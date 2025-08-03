/**
 * Bridge Loans Repayments Calculator
 * 
 * Calcola i rimborsi di capitale per prestiti bridge/bullet
 * I prestiti bullet vengono rimborsati in un'unica soluzione alla scadenza
 */

import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate repayments for bridge/bullet loans
 * @param {Object} product - Product configuration
 * @param {Array} vintages - Array of vintage objects from NBV calculations
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} Repayment results with quarterly detail
 */
export const calculateBridgeLoansRepayments = (product, vintages, assumptions, quarters = 40) => {
  const results = {
    productName: product.name,
    productType: 'bridge',
    quarterlyRepayments: new Array(quarters).fill(0),
    vintageRepayments: [],
    metrics: {
      totalRepaid: 0,
      averageMaturityQuarters: 0,
      numberOfVintages: vintages.length,
      firstRepaymentQuarter: null,
      lastRepaymentQuarter: null
    }
  };
  
  // Process each vintage
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Bridge/Bullet loans repay full principal at maturity
    if (maturityQ < quarters) {
      const principalAmount = new Decimal(vintage.initialAmount);
      
      // Add repayment at maturity
      results.quarterlyRepayments[maturityQ] += principalAmount.toNumber();
      results.metrics.totalRepaid += principalAmount.toNumber();
      
      // Track first and last repayment
      if (results.metrics.firstRepaymentQuarter === null || maturityQ < results.metrics.firstRepaymentQuarter) {
        results.metrics.firstRepaymentQuarter = maturityQ;
      }
      if (results.metrics.lastRepaymentQuarter === null || maturityQ > results.metrics.lastRepaymentQuarter) {
        results.metrics.lastRepaymentQuarter = maturityQ;
      }
      
      // Store vintage repayment detail
      results.vintageRepayments.push({
        vintageId: vintage.id,
        startQuarter: startQ,
        maturityQuarter: maturityQ,
        principalAmount: principalAmount.toNumber(),
        repaymentQuarter: maturityQ,
        repaymentType: 'bullet',
        quarterlySchedule: createBulletSchedule(startQ, maturityQ, principalAmount.toNumber(), quarters)
      });
      
      // Update average maturity
      results.metrics.averageMaturityQuarters += (maturityQ - startQ);
    }
  });
  
  // Calculate average maturity
  if (vintages.length > 0) {
    results.metrics.averageMaturityQuarters = results.metrics.averageMaturityQuarters / vintages.length;
  }
  
  return results;
};

/**
 * Create bullet repayment schedule for a vintage
 * @private
 */
const createBulletSchedule = (startQ, maturityQ, principal, totalQuarters) => {
  const schedule = [];
  
  for (let q = startQ; q <= Math.min(maturityQ, totalQuarters - 1); q++) {
    schedule.push({
      quarter: q,
      outstandingPrincipal: principal,
      principalRepayment: q === maturityQ ? principal : 0,
      interestOnly: q < maturityQ
    });
  }
  
  return schedule;
};