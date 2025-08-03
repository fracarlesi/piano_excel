/**
 * French No Grace NBV Calculator
 * 
 * Calcola il Net Book Value totale dei prestiti French senza periodo di grazia
 * Include tutta la logica di ammortamento alla francese
 */

import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate total NBV for French Loans without grace period
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} NBV results with vintages
 */
export const calculateFrenchNoGraceNBV = (product, assumptions, quarters = 40) => {
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
  
  // Step 2: Create vintages for french no grace
  const vintages = createFrenchNoGraceVintages(product, yearlyVolumes, assumptions);
  results.vintages = vintages;
  
  // Step 3: Calculate NBV for each quarter with amortization
  
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Track total originated
    results.metrics.totalOriginated += vintage.initialAmount;
    
    // Initialize outstanding principal with Decimal
    let outstandingPrincipal = new Decimal(vintage.initialAmount);
    
    // For each quarter, calculate amortization
    for (let q = 0; q < quarters; q++) {
      if (q >= startQ && q <= maturityQ && outstandingPrincipal.gt(0)) {
        // Add current outstanding to NBV BEFORE any reduction
        results.quarterlyNBV[q] += outstandingPrincipal.toNumber();
        
        // Store quarterly outstanding for vintage tracking
        vintage.quarterlyOutstanding = vintage.quarterlyOutstanding || {};
        vintage.quarterlyOutstanding[q] = outstandingPrincipal.toNumber();
        
        // Apply amortization AFTER recording NBV
        if (vintage.quarterlyPayment) {
          const quarterlyRate = new Decimal(vintage.quarterlyRate);
          const quarterlyPayment = new Decimal(vintage.quarterlyPayment);
          
          // Interest payment
          const interestPayment = outstandingPrincipal.mul(quarterlyRate);
          
          // Principal payment
          const principalPayment = quarterlyPayment.minus(interestPayment);
          
          if (principalPayment.gt(0)) {
            // Apply principal reduction
            outstandingPrincipal = outstandingPrincipal.minus(principalPayment);
            results.metrics.totalRepaid += principalPayment.toNumber();
            
            // Ensure we don't go negative
            if (outstandingPrincipal.lt(0)) {
              outstandingPrincipal = new Decimal(0);
            }
          }
        }
      }
    }
    
    // Update final outstanding in vintage
    vintage.outstandingPrincipal = outstandingPrincipal.toNumber();
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
 * Create vintages for french loans without grace
 * @private
 */
const createFrenchNoGraceVintages = (product, yearlyVolumes, assumptions) => {
  const vintages = [];
  const durationQuarters = product.durata || 20; // Default 5 years
  
  yearlyVolumes.forEach((volume, year) => {
    if (volume > 0) {
      const quarterlyAllocation = product.quarterlyAllocation || 
                                  assumptions.quarterlyAllocation || 
                                  [25, 25, 25, 25];
      
      quarterlyAllocation.forEach((percentage, quarter) => {
        // Volume is already in millions of euros, just apply quarterly allocation
        const quarterlyVolume = new Decimal(volume).mul(percentage).div(100);
        
        if (quarterlyVolume.gt(0)) {
          const vintage = {
            id: `french_ng_${product.id || product.name}_y${year}_q${quarter}`,
            type: 'french',
            subType: 'no-grace',
            productId: product.id,
            productName: product.name,
            
            // Timing
            startYear: year,
            startQuarter: quarter,
            maturityYear: year + Math.floor((quarter + durationQuarters) / 4),
            maturityQuarter: (quarter + durationQuarters) % 4,
            durationQuarters: durationQuarters,
            gracePeriod: 0, // No grace period
            
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
          
          // Calculate quarterly payment (French amortization)
          vintage.quarterlyPayment = calculateQuarterlyPayment(
            vintage.initialAmount,
            vintage.quarterlyRate,
            vintage.durationQuarters
          );
          
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

/**
 * Calculate quarterly payment for French amortization
 * @private
 */
const calculateQuarterlyPayment = (principal, quarterlyRate, quarters) => {
  if (quarterlyRate === 0) {
    return principal / quarters;
  }
  
  const r = new Decimal(quarterlyRate);
  const n = new Decimal(quarters);
  const p = new Decimal(principal);
  
  // PMT = P * r * (1+r)^n / ((1+r)^n - 1)
  const onePlusR = r.plus(1);
  const powerN = onePlusR.pow(n);
  const numerator = p.mul(r).mul(powerN);
  const denominator = powerN.minus(1);
  
  return numerator.div(denominator).toNumber();
};