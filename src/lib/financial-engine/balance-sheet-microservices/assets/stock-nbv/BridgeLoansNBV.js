/**
 * Bridge Loans NBV Calculator
 * 
 * Calcola il Net Book Value totale dei Bridge/Bullet Loans
 * Include tutta la logica di ammortamento per prodotti bullet
 */

import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate total NBV for Bridge/Bullet Loans
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} NBV results with vintages
 */
export const calculateBridgeLoansNBV = (product, assumptions, quarters = 40) => {
  const results = {
    quarterlyNBV: new Array(quarters).fill(0),
    vintages: [],
    metrics: {
      totalOriginated: 0,
      totalRepaid: 0,
      averageMaturity: 0,
      peakExposure: 0,
      peakQuarter: 0
    }
  };
  
  // Step 1: Calculate yearly volumes
  const yearlyVolumes = calculateYearlyVolumes(product);
  
  // Step 2: Create vintages for bridge loans
  const vintages = createBridgeVintages(product, yearlyVolumes, assumptions);
  results.vintages = vintages;
  
  // Step 3: Calculate NBV for each quarter
  
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Track total originated
    results.metrics.totalOriginated += vintage.initialAmount;
    
    // For each quarter, track outstanding principal
    for (let q = 0; q < quarters; q++) {
      if (q >= startQ && q < maturityQ) {
        // Before maturity: full principal outstanding
        results.quarterlyNBV[q] += vintage.outstandingPrincipal;
        
        // Update vintage outstanding for tracking
        vintage.quarterlyOutstanding = vintage.quarterlyOutstanding || {};
        vintage.quarterlyOutstanding[q] = vintage.outstandingPrincipal;
      } else if (q === maturityQ) {
        // At maturity: the loan is still on books at beginning of quarter
        // but gets repaid during the quarter
        // For balance sheet purposes, we show it as 0 at end of quarter
        results.metrics.totalRepaid += vintage.initialAmount;
        vintage.outstandingPrincipal = 0;
        
        // Update vintage outstanding for tracking
        vintage.quarterlyOutstanding = vintage.quarterlyOutstanding || {};
        vintage.quarterlyOutstanding[q] = 0;
      }
    }
  });
  
  // Step 4: Calculate metrics
  results.quarterlyNBV.forEach((nbv, q) => {
    if (nbv > results.metrics.peakExposure) {
      results.metrics.peakExposure = nbv;
      results.metrics.peakQuarter = q;
    }
  });
  
  // Average maturity
  const totalWeightedMaturity = vintages.reduce((sum, v) => 
    sum + (v.initialAmount * v.durationQuarters), 0
  );
  results.metrics.averageMaturity = results.metrics.totalOriginated > 0 
    ? totalWeightedMaturity / results.metrics.totalOriginated / 4 
    : 0;
  
  return results;
};

/**
 * Calculate yearly volumes from product configuration
 * @private
 */
const calculateYearlyVolumes = (product) => {
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  return years.map(i => {
    if (product.volumeArray && Array.isArray(product.volumeArray)) {
      return product.volumeArray[i] || 0;
    }
    
    if (product.volumes) {
      const yearKey = `y${i + 1}`;
      if (product.volumes[yearKey] !== undefined) {
        return product.volumes[yearKey];
      }
      
      // Linear interpolation
      const y1 = product.volumes.y1 || 0;
      const y10 = product.volumes.y10 || 0;
      return y1 + ((y10 - y1) * i / 9);
    }
    
    return 0;
  });
};

/**
 * Create vintages for bridge loans
 * @private
 */
const createBridgeVintages = (product, yearlyVolumes, assumptions) => {
  const vintages = [];
  const durationQuarters = product.durata || 8; // Default 2 years
  
  yearlyVolumes.forEach((volume, year) => {
    if (volume > 0) {
      const quarterlyAllocation = product.quarterlyAllocation || 
                                  assumptions.quarterlyAllocation || 
                                  [25, 25, 25, 25];
      
      quarterlyAllocation.forEach((percentage, quarter) => {
        const quarterlyVolume = new Decimal(volume).mul(percentage).div(100);
        
        if (quarterlyVolume.gt(0)) {
          const vintage = {
            id: `bridge_${product.id || product.name}_y${year}_q${quarter}`,
            type: 'bullet',
            productId: product.id,
            productName: product.name,
            
            // Timing
            startYear: year,
            startQuarter: quarter,
            maturityYear: year + Math.floor((quarter + durationQuarters) / 4),
            maturityQuarter: (quarter + durationQuarters) % 4,
            durationQuarters: durationQuarters,
            
            // Amounts
            initialAmount: quarterlyVolume.toNumber(),
            outstandingPrincipal: quarterlyVolume.toNumber(),
            
            // Interest parameters
            spread: product.spread / 100,
            isFixed: product.isFixed || false,
            quarterlyRate: calculateQuarterlyRate(product, assumptions),
            
            // Risk parameters
            dangerRate: product.dangerRate || 0,
            lgd: product.lgd || 45,
            hasStateGuarantee: product.hasStateGuarantee || false
          };
          
          vintages.push(vintage);
        }
      });
    }
  });
  
  return vintages;
};

/**
 * Calculate quarterly interest rate
 * @private
 */
const calculateQuarterlyRate = (product, assumptions) => {
  const annualRate = product.isFixed 
    ? (product.spread / 100) + 0.02  // Fixed = spread + 2%
    : (product.spread / 100) + (assumptions.euribor / 100);
  
  return annualRate / 4;
};