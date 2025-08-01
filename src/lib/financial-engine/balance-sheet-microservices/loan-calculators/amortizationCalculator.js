/**
 * Amortization Calculator Module
 * 
 * Handles principal repayment calculations for different loan types
 * including French amortization and bullet repayments
 */

import { getInterestRate } from './vintageManager.js';

/**
 * Calculate principal payment for French amortization
 * @param {Object} vintage - Vintage object
 * @param {number} quarterlyRate - Quarterly interest rate
 * @param {number} quartersElapsed - Quarters since vintage start
 * @returns {number} Principal payment amount
 */
export const calculateFrenchPrincipalPayment = (vintage, quarterlyRate, quartersElapsed) => {
  const gracePeriodQuarters = vintage.gracePeriod; // Already in quarters
  
  // During grace period, no principal repayment
  if (quartersElapsed <= gracePeriodQuarters) {
    return 0;
  }
  
  // Post grace period: normal amortization
  const interestPayment = vintage.outstandingPrincipal * quarterlyRate;
  const principalPayment = vintage.quarterlyPayment - interestPayment;
  
  return Math.max(0, principalPayment);
};

/**
 * Process quarterly amortization for a vintage
 * @param {Object} vintage - Vintage object
 * @param {number} currentQuarter - Current quarter (absolute)
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {Object} Amortization results
 */
export const processQuarterlyAmortization = (vintage, currentQuarter, product, assumptions) => {
  const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
  const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
  const quartersElapsed = currentQuarter - vintageStartQuarter;
  
  let principalPayment = 0;
  let shouldUpdatePrincipal = false;
  
  // Check if vintage is active
  if (currentQuarter > vintageStartQuarter && currentQuarter <= vintageMaturityQuarter) {
    if (vintage.type === 'french' || vintage.type === 'amortizing') {
      const quarterlyRate = getInterestRate(product, assumptions) / 4;
      principalPayment = calculateFrenchPrincipalPayment(vintage, quarterlyRate, quartersElapsed);
      shouldUpdatePrincipal = principalPayment > 0;
    }
  }
  
  return {
    principalPayment,
    shouldUpdatePrincipal,
    quartersElapsed
  };
};

/**
 * Calculate annual principal repayments for all vintages
 * @param {Array} vintages - Array of vintage objects
 * @param {number} year - Year index
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {Object} Annual repayment summary
 */
export const calculateAnnualRepayments = (vintages, year, product, assumptions) => {
  let annualPrincipalRepayments = 0;
  const repaymentsByVintage = new Map();
  
  // Track repayments during the year
  for (let quarter = 0; quarter < 4; quarter++) {
    const currentQuarter = year * 4 + quarter;
    
    vintages.forEach(vintage => {
      const { principalPayment } = processQuarterlyAmortization(
        vintage,
        currentQuarter,
        product,
        assumptions
      );
      
      if (principalPayment > 0) {
        const currentRepayments = repaymentsByVintage.get(vintage) || 0;
        repaymentsByVintage.set(vintage, currentRepayments + principalPayment);
      }
    });
  }
  
  // Process bullet repayments at maturity
  const yearStartQuarter = year * 4;
  const yearEndQuarter = (year + 1) * 4;
  
  vintages.forEach(vintage => {
    if (vintage.type === 'bullet') {
      const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
      
      // Check if bullet matures this year
      if (vintageMaturityQuarter >= yearStartQuarter && vintageMaturityQuarter < yearEndQuarter) {
        annualPrincipalRepayments += vintage.initialAmount;
      }
    } else {
      // Add French/amortizing repayments
      const vintageRepayments = repaymentsByVintage.get(vintage) || 0;
      annualPrincipalRepayments += vintageRepayments;
    }
  });
  
  return {
    totalRepayments: annualPrincipalRepayments,
    repaymentsByVintage
  };
};

/**
 * Update vintage principal after repayment
 * @param {Object} vintage - Vintage object
 * @param {number} principalPayment - Principal payment amount
 */
export const updateVintagePrincipal = (vintage, principalPayment) => {
  vintage.outstandingPrincipal = Math.max(0, vintage.outstandingPrincipal - principalPayment);
};

/**
 * Process all vintage principal updates for a quarter
 * @param {Array} vintages - Array of vintage objects
 * @param {number} currentQuarter - Current quarter (absolute)
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 */
export const updateAllVintagePrincipals = (vintages, currentQuarter, product, assumptions) => {
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Check if vintage should be updated
    const isBeforeMaturity = currentQuarter < vintageMaturityQuarter;
    
    if (currentQuarter > vintageStartQuarter && isBeforeMaturity) {
      if (vintage.type === 'french' || vintage.type === 'amortizing') {
        const quartersElapsed = currentQuarter - vintageStartQuarter;
        const gracePeriodQuarters = vintage.gracePeriod; // Already in quarters
        
        if (quartersElapsed >= gracePeriodQuarters) {
          const quarterlyRate = getInterestRate(product, assumptions) / 4;
          const interestPayment = vintage.outstandingPrincipal * quarterlyRate;
          const principalPayment = vintage.quarterlyPayment - interestPayment;
          
          updateVintagePrincipal(vintage, principalPayment);
        }
      }
    }
  });
};