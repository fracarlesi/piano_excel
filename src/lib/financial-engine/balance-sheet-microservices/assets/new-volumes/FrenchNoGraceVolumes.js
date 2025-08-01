/**
 * French No Grace Volumes Calculator
 * 
 * Calcola i nuovi volumi erogati per prestiti francesi senza periodo di grazia
 * Fornisce dettaglio trimestrale delle erogazioni
 */

import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate new volumes for french loans without grace period
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} Volume results with quarterly detail
 */
export const calculateFrenchNoGraceVolumes = (product, assumptions, quarters = 40) => {
  const results = {
    productName: product.name,
    productType: 'french-no-grace',
    quarterlyVolumes: new Array(quarters).fill(0),
    annualVolumes: new Array(10).fill(0),
    vintages: [],
    metrics: {
      totalVolume: 0,
      averageQuarterlyVolume: 0,
      firstDisbursementQuarter: null,
      lastDisbursementQuarter: null,
      averageMaturity: product.durata / 4 || 5 // in years
    }
  };
  
  // Step 1: Calculate yearly volumes
  const yearlyVolumes = calculateYearlyVolumes(product);
  
  // Step 2: Distribute volumes across quarters
  yearlyVolumes.forEach((yearVolume, year) => {
    if (yearVolume > 0) {
      results.annualVolumes[year] = yearVolume;
      results.metrics.totalVolume += yearVolume;
      
      // Get quarterly allocation
      const quarterlyAllocation = product.quarterlyAllocation || 
                                  assumptions.quarterlyAllocation || 
                                  [25, 25, 25, 25];
      
      // Distribute volume across quarters
      quarterlyAllocation.forEach((percentage, quarter) => {
        const quarterIndex = year * 4 + quarter;
        
        if (quarterIndex < quarters) {
          const quarterlyVolume = new Decimal(yearVolume)
            .mul(percentage)
            .div(100)
            .toNumber();
          
          if (quarterlyVolume > 0) {
            results.quarterlyVolumes[quarterIndex] = quarterlyVolume;
            
            // Track first and last disbursement
            if (results.metrics.firstDisbursementQuarter === null) {
              results.metrics.firstDisbursementQuarter = quarterIndex;
            }
            results.metrics.lastDisbursementQuarter = quarterIndex;
            
            // Create vintage detail with French loan specifics
            results.vintages.push({
              year: year,
              quarter: quarter,
              quarterIndex: quarterIndex,
              volume: quarterlyVolume,
              percentage: percentage,
              date: `Y${year + 1} Q${quarter + 1}`,
              maturityQuarters: product.durata || 20,
              gracePeriod: 0,
              amortizationType: 'french'
            });
          }
        }
      });
    }
  });
  
  // Calculate average quarterly volume (only for quarters with disbursements)
  const quarterlyVolumeCount = results.quarterlyVolumes.filter(v => v > 0).length;
  if (quarterlyVolumeCount > 0) {
    results.metrics.averageQuarterlyVolume = results.metrics.totalVolume / quarterlyVolumeCount;
  }
  
  return results;
};

/**
 * Calculate yearly volumes from product configuration
 * @private
 */
const calculateYearlyVolumes = (product) => {
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  return years.map(i => {
    // Check for volumeArray first (new format)
    if (product.volumeArray && Array.isArray(product.volumeArray)) {
      return product.volumeArray[i] || 0;
    }
    
    // Check for volumes object (old format)
    if (product.volumes) {
      const yearKey = `y${i + 1}`;
      if (product.volumes[yearKey] !== undefined) {
        return product.volumes[yearKey];
      }
      
      // Linear interpolation between y1 and y10
      const y1 = product.volumes.y1 || 0;
      const y10 = product.volumes.y10 || 0;
      return y1 + ((y10 - y1) * i / 9);
    }
    
    // Check for direct year properties (y1, y2, etc.)
    const yearKey = `y${i + 1}`;
    if (product[yearKey] !== undefined) {
      return product[yearKey];
    }
    
    return 0;
  });
};