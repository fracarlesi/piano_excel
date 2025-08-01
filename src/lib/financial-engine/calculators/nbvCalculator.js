/**
 * NBV (Net Book Value) Calculator Microservice
 * 
 * Dedicated microservice for calculating the Net Book Value of loans
 * after impairment/deterioration. This handles the present value calculation
 * of expected recoveries for defaulted loans.
 * 
 * This service works in conjunction with the Default Recovery Calculator
 * to provide a complete picture of NPL valuation.
 */

import { calculateDefaultRecovery } from './defaultRecoveryCalculator.js';

// DEPRECATED: Individual NBV calculation functions replaced by integrated approach
// These functions are kept for backward compatibility but should not be used directly
// Use calculateNBV() which integrates with the Default Recovery Calculator

/**
 * @deprecated Use calculateNBV with Default Recovery Calculator
 */
export const calculateSecuredNBV = (defaultAmount, product, quarterlyRate) => {
  console.warn('calculateSecuredNBV is deprecated. Use calculateNBV instead.');
  return calculateNBV(defaultAmount, product, quarterlyRate).components[0] || {};
};

/**
 * @deprecated Use calculateNBV with Default Recovery Calculator
 */
export const calculateUnsecuredNBV = (defaultAmount, product, quarterlyRate) => {
  console.warn('calculateUnsecuredNBV is deprecated. Use calculateNBV instead.');
  return calculateNBV(defaultAmount, product, quarterlyRate).components[0] || {};
};

/**
 * @deprecated Use calculateNBV with Default Recovery Calculator
 */
export const calculateStateGuaranteeNBV = (guaranteedAmount, product, quarterlyRate) => {
  console.warn('calculateStateGuaranteeNBV is deprecated. Use calculateNBV instead.');
  return calculateNBV(guaranteedAmount, product, quarterlyRate).components[0] || {};
};

/**
 * Main NBV calculation orchestrator
 * Integrates with Default Recovery Calculator for comprehensive NPL valuation
 * @param {number} defaultAmount - Total defaulted amount
 * @param {Object} product - Product configuration
 * @param {number} quarterlyRate - Quarterly discount rate
 * @returns {Object} Complete NBV calculation
 */
export const calculateNBV = (defaultAmount, product, quarterlyRate) => {
  if (defaultAmount <= 0) {
    return {
      totalDefault: 0,
      totalNBV: 0,
      totalLLP: 0,
      components: [],
      recoveryAnalysis: null
    };
  }

  // First, get recovery analysis from the recovery calculator
  const recoveryAnalysis = calculateDefaultRecovery(defaultAmount, product);
  
  // Now calculate NPV for each recovery component
  const nbvComponents = [];
  let totalNBV = 0;
  
  recoveryAnalysis.components.forEach(recoveryComponent => {
    let componentNBV = 0;
    let discountFactor = 1;
    
    // Get the recovery amount and timing
    const recoveryAmount = recoveryComponent.expectedRecovery || 
                          recoveryComponent.netRecovery || 0;
    const recoveryTime = recoveryComponent.recoveryTime || 
                        product.timeToRecover || 12;
    
    // Calculate NPV
    if (recoveryAmount > 0) {
      discountFactor = Math.pow(1 + quarterlyRate, recoveryTime);
      componentNBV = recoveryAmount / discountFactor;
    }
    
    const nbvComponent = {
      type: recoveryComponent.type,
      grossAmount: recoveryComponent.guaranteedAmount || 
                   recoveryComponent.unsecuredAmount || 
                   defaultAmount,
      recoveryAmount,
      recoveryTime,
      discountFactor,
      nbv: componentNBV,
      recoveryRate: recoveryComponent.recoveryRate || 0
    };
    
    nbvComponents.push(nbvComponent);
    totalNBV += componentNBV;
  });
  
  const totalLLP = defaultAmount - totalNBV;
  
  return {
    totalDefault: defaultAmount,
    totalNBV,
    totalLLP,
    impliedRecoveryRate: (totalNBV / defaultAmount) * 100,
    components: nbvComponents,
    recoveryAnalysis: {
      totalRecovery: recoveryAnalysis.totalRecovery,
      weightedRecoveryRate: recoveryAnalysis.weightedRecoveryRate,
      schedule: recoveryAnalysis.recoverySchedule,
      metrics: recoveryAnalysis.metrics
    }
  };
};

/**
 * Calculate portfolio-level NBV for multiple defaults
 * @param {Array} defaults - Array of default events with amounts and products
 * @param {number} quarterlyRate - Quarterly discount rate
 * @returns {Object} Portfolio NBV summary
 */
export const calculatePortfolioNBV = (defaults, quarterlyRate) => {
  const results = defaults.map(({ amount, product, quarter }) => ({
    quarter,
    product: product.name,
    ...calculateNBV(amount, product, quarterlyRate)
  }));
  
  const totalDefault = results.reduce((sum, r) => sum + r.totalDefault, 0);
  const totalNBV = results.reduce((sum, r) => sum + r.totalNBV, 0);
  const totalLLP = results.reduce((sum, r) => sum + r.totalLLP, 0);
  
  return {
    totalDefault,
    totalNBV,
    totalLLP,
    portfolioRecoveryRate: totalDefault > 0 ? (totalNBV / totalDefault) * 100 : 0,
    details: results
  };
};