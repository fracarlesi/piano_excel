/**
 * French With Grace Repayments Calculator
 * 
 * Calcola i rimborsi di capitale per prestiti francesi con periodo di grazia
 * Durante il grace period si pagano solo gli interessi, poi inizia l'ammortamento
 */

import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate repayments for french loans with grace period
 * @param {Object} product - Product configuration
 * @param {Array} vintages - Array of vintage objects from NBV calculations
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} Repayment results with quarterly detail
 */
export const calculateFrenchWithGraceRepayments = (product, vintages, assumptions, quarters = 40) => {
  const results = {
    productName: product.name,
    productType: 'french-with-grace',
    quarterlyRepayments: new Array(quarters).fill(0),
    vintageRepayments: [],
    metrics: {
      totalRepaid: 0,
      averageQuarterlyPayment: 0,
      numberOfVintages: vintages.length,
      firstRepaymentQuarter: null,
      lastRepaymentQuarter: null,
      totalInterestPaid: 0,
      averageGracePeriod: 0
    }
  };
  
  let totalGracePeriods = 0;
  
  // Process each vintage
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    const gracePeriod = vintage.gracePeriod || product.gracePeriod || 0;
    const amortizationStartQ = startQ + gracePeriod;
    
    totalGracePeriods += gracePeriod;
    
    // Calculate quarters for amortization (after grace period)
    const amortizationQuarters = vintage.durationQuarters - gracePeriod;
    
    // Calculate quarterly payment for amortization period
    const quarterlyPayment = vintage.quarterlyPayment || 
      calculateQuarterlyPayment(
        vintage.initialAmount,
        vintage.quarterlyRate,
        amortizationQuarters
      );
    
    // Initialize outstanding principal
    let outstandingPrincipal = new Decimal(vintage.initialAmount);
    const vintageSchedule = [];
    let totalPrincipalRepaid = 0;
    let totalInterestPaid = 0;
    
    // Process each quarter
    for (let q = startQ + 1; q <= Math.min(maturityQ, quarters - 1); q++) {
      if (outstandingPrincipal.gt(0)) {
        const quarterlyRate = new Decimal(vintage.quarterlyRate);
        
        // Calculate interest
        const interestPayment = outstandingPrincipal.mul(quarterlyRate);
        totalInterestPaid += interestPayment.toNumber();
        
        // During grace period: interest only
        if (q <= amortizationStartQ) {
          vintageSchedule.push({
            quarter: q,
            outstandingBefore: outstandingPrincipal.toNumber(),
            principalRepayment: 0,
            interestPayment: interestPayment.toNumber(),
            totalPayment: interestPayment.toNumber(),
            outstandingAfter: outstandingPrincipal.toNumber(),
            gracePeriod: true
          });
        } 
        // After grace period: full amortization
        else {
          const payment = new Decimal(quarterlyPayment);
          
          // Calculate principal repayment
          const principalPayment = payment.minus(interestPayment);
          
          if (principalPayment.gt(0)) {
            // Apply principal reduction
            const actualPrincipalPayment = Decimal.min(principalPayment, outstandingPrincipal);
            
            // Add to quarterly repayments
            results.quarterlyRepayments[q] += actualPrincipalPayment.toNumber();
            totalPrincipalRepaid += actualPrincipalPayment.toNumber();
            
            // Update outstanding principal
            outstandingPrincipal = outstandingPrincipal.minus(actualPrincipalPayment);
            
            // Track first and last repayment
            if (results.metrics.firstRepaymentQuarter === null || q < results.metrics.firstRepaymentQuarter) {
              results.metrics.firstRepaymentQuarter = q;
            }
            results.metrics.lastRepaymentQuarter = q;
            
            // Store in schedule
            vintageSchedule.push({
              quarter: q,
              outstandingBefore: outstandingPrincipal.plus(actualPrincipalPayment).toNumber(),
              principalRepayment: actualPrincipalPayment.toNumber(),
              interestPayment: interestPayment.toNumber(),
              totalPayment: quarterlyPayment,
              outstandingAfter: outstandingPrincipal.toNumber(),
              gracePeriod: false
            });
          }
        }
      }
    }
    
    // Store vintage repayment detail
    results.vintageRepayments.push({
      vintageId: vintage.id,
      startQuarter: startQ,
      maturityQuarter: maturityQ,
      gracePeriod: gracePeriod,
      amortizationStartQuarter: amortizationStartQ,
      principalAmount: vintage.initialAmount,
      quarterlyPayment: quarterlyPayment,
      totalPrincipalRepaid: totalPrincipalRepaid,
      totalInterestPaid: totalInterestPaid,
      schedule: vintageSchedule
    });
    
    // Update metrics
    results.metrics.totalRepaid += totalPrincipalRepaid;
    results.metrics.totalInterestPaid += totalInterestPaid;
  });
  
  // Calculate averages
  if (vintages.length > 0) {
    results.metrics.averageGracePeriod = totalGracePeriods / vintages.length;
  }
  
  const quartersWithRepayments = results.quarterlyRepayments.filter(r => r > 0).length;
  if (quartersWithRepayments > 0) {
    results.metrics.averageQuarterlyPayment = results.metrics.totalRepaid / quartersWithRepayments;
  }
  
  return results;
};

/**
 * Calculate quarterly payment for French amortization
 * @private
 */
const calculateQuarterlyPayment = (principal, quarterlyRate, quarters) => {
  if (quarterlyRate === 0 || quarters === 0) {
    return quarters > 0 ? principal / quarters : 0;
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