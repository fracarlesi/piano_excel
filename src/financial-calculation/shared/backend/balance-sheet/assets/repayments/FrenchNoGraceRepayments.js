/**
 * French No Grace Repayments Calculator
 * 
 * Calcola i rimborsi di capitale per prestiti francesi senza periodo di grazia
 * L'ammortamento alla francese prevede rate costanti con quota capitale crescente
 */

import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate repayments for french loans without grace period
 * @param {Object} product - Product configuration
 * @param {Array} vintages - Array of vintage objects from NBV calculations
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} Repayment results with quarterly detail
 */
export const calculateFrenchNoGraceRepayments = (product, vintages, assumptions, quarters = 40) => {
  const results = {
    productName: product.name,
    productType: 'french-no-grace',
    quarterlyRepayments: new Array(quarters).fill(0),
    vintageRepayments: [],
    metrics: {
      totalRepaid: 0,
      averageQuarterlyPayment: 0,
      numberOfVintages: vintages.length,
      firstRepaymentQuarter: null,
      lastRepaymentQuarter: null,
      totalInterestPaid: 0
    }
  };
  
  // Process each vintage
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Calculate quarterly payment if not already present
    const quarterlyPayment = vintage.quarterlyPayment || 
      calculateQuarterlyPayment(
        vintage.initialAmount,
        vintage.quarterlyRate,
        vintage.durationQuarters
      );
    
    // Initialize outstanding principal
    let outstandingPrincipal = new Decimal(vintage.initialAmount);
    const vintageSchedule = [];
    let totalPrincipalRepaid = 0;
    let totalInterestPaid = 0;
    
    // Calculate amortization schedule
    for (let q = startQ + 1; q <= Math.min(maturityQ, quarters - 1); q++) {
      if (outstandingPrincipal.gt(0)) {
        const quarterlyRate = new Decimal(vintage.quarterlyRate);
        const payment = new Decimal(quarterlyPayment);
        
        // Calculate interest for this quarter
        const interestPayment = outstandingPrincipal.mul(quarterlyRate);
        
        // Calculate principal repayment
        const principalPayment = payment.minus(interestPayment);
        
        if (principalPayment.gt(0)) {
          // Apply principal reduction
          const actualPrincipalPayment = Decimal.min(principalPayment, outstandingPrincipal);
          
          // Add to quarterly repayments
          results.quarterlyRepayments[q] += actualPrincipalPayment.toNumber();
          totalPrincipalRepaid += actualPrincipalPayment.toNumber();
          totalInterestPaid += interestPayment.toNumber();
          
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
            outstandingAfter: outstandingPrincipal.toNumber()
          });
        }
      }
    }
    
    // Store vintage repayment detail
    results.vintageRepayments.push({
      vintageId: vintage.id,
      startQuarter: startQ,
      maturityQuarter: maturityQ,
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
  
  // Calculate average quarterly payment
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