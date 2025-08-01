/**
 * LLP (Loan Loss Provision) Calculator Module
 * 
 * Implements IFRS 9 compliant impairment calculation
 * with quarterly granularity and DCF-based recovery estimation
 */

/**
 * Calculate Expected Recovery Value (ERV) based on collateral
 * @param {number} defaultAmount - Amount defaulted
 * @param {Object} product - Product parameters
 * @returns {Object} Recovery details
 */
const calculateExpectedRecovery = (defaultAmount, product) => {
  let totalRecovery = 0;
  let collateralRecovery = 0;
  let stateGuaranteeRecovery = 0;
  
  // State guarantee recovery (if applicable)
  if (product.stateGuaranteeType === 'present' && product.stateGuaranteeCoverage > 0) {
    const guaranteedAmount = defaultAmount * (product.stateGuaranteeCoverage / 100);
    stateGuaranteeRecovery = guaranteedAmount; // State guarantees assumed at face value
    totalRecovery += stateGuaranteeRecovery;
  }
  
  // Collateral recovery on non-guaranteed portion
  const nonGuaranteedAmount = defaultAmount * (1 - (product.stateGuaranteeCoverage || 0) / 100);
  
  if (nonGuaranteedAmount > 0) {
    if (product.isUnsecured) {
      // Unsecured loan recovery
      const unsecuredLGD = product.unsecuredLGD || 45;
      const recoveryRate = (100 - unsecuredLGD) / 100;
      collateralRecovery = nonGuaranteedAmount * recoveryRate;
    } else {
      // Secured loan recovery
      const collateralValue = nonGuaranteedAmount / (product.ltv / 100);
      const valueAfterHaircut = collateralValue * (1 - (product.collateralHaircut || 0) / 100);
      const recoveryCosts = nonGuaranteedAmount * ((product.recoveryCosts || 0) / 100);
      collateralRecovery = Math.max(0, valueAfterHaircut - recoveryCosts);
    }
    totalRecovery += collateralRecovery;
  }
  
  return {
    totalRecovery,
    collateralRecovery,
    stateGuaranteeRecovery
  };
};

/**
 * Calculate NPV of expected recovery
 * @param {number} expectedRecovery - Expected recovery amount
 * @param {number} timeToRecover - Time to recovery in years
 * @param {number} discountRate - Annual discount rate
 * @returns {number} NPV of recovery
 */
const calculateRecoveryNPV = (expectedRecovery, timeToRecover, discountRate) => {
  return expectedRecovery / Math.pow(1 + discountRate, timeToRecover);
};

/**
 * Calculate quarterly LLP based on IFRS 9 model
 * @param {Object} params - Calculation parameters
 * @param {number} params.performingStock - Performing loans at period start
 * @param {number} params.dangerRate - Annual default rate (%)
 * @param {Object} params.productParameters - Product specific parameters
 * @param {number} params.quarterlyInterestRate - Quarterly interest rate for discounting
 * @returns {Object} LLP calculation results
 */
export const calculateLLP = ({
  performingStock,
  dangerRate,
  productParameters,
  quarterlyInterestRate
}) => {
  // Input validation
  if (performingStock <= 0 || dangerRate <= 0) {
    return {
      newDefaults: 0,
      expectedRecovery: 0,
      recoveryNPV: 0,
      llp: 0,
      details: {
        performingStock,
        dangerRate,
        quarterlyDefaultRate: 0
      }
    };
  }
  
  // Convert annual danger rate to quarterly
  const quarterlyDefaultRate = dangerRate / 100 / 4;
  
  // Calculate new defaults for the quarter
  const newDefaults = performingStock * quarterlyDefaultRate;
  
  // Calculate expected recovery
  const recovery = calculateExpectedRecovery(newDefaults, productParameters);
  
  // Calculate NPV of recovery
  const annualRate = quarterlyInterestRate * 4;
  const timeToRecover = productParameters.timeToRecover || 3;
  const recoveryNPV = calculateRecoveryNPV(recovery.totalRecovery, timeToRecover, annualRate);
  
  // LLP is the difference between defaults and NPV of recovery
  const llp = newDefaults - recoveryNPV;
  
  return {
    newDefaults,
    expectedRecovery: recovery.totalRecovery,
    recoveryNPV,
    llp,
    details: {
      performingStock,
      dangerRate,
      quarterlyDefaultRate,
      collateralRecovery: recovery.collateralRecovery,
      stateGuaranteeRecovery: recovery.stateGuaranteeRecovery,
      timeToRecover,
      discountRate: annualRate
    }
  };
};

/**
 * Calculate annual LLP by aggregating quarterly results
 * @param {Array} quarterlyResults - Array of quarterly LLP results
 * @returns {number} Total annual LLP
 */
export const calculateAnnualLLP = (quarterlyResults) => {
  return quarterlyResults.reduce((total, quarter) => total + quarter.llp, 0);
};

/**
 * Validate product parameters for LLP calculation
 * @param {Object} product - Product configuration
 * @returns {boolean} True if valid
 */
export const validateProductParameters = (product) => {
  const requiredParams = ['dangerRate'];
  const hasRequired = requiredParams.every(param => 
    product[param] !== undefined && product[param] !== null
  );
  
  if (!hasRequired) return false;
  
  // Validate ranges
  if (product.dangerRate < 0 || product.dangerRate > 100) return false;
  if (product.ltv && (product.ltv < 0 || product.ltv > 100)) return false;
  if (product.collateralHaircut && (product.collateralHaircut < 0 || product.collateralHaircut > 100)) return false;
  
  return true;
};

/**
 * Create detailed LLP report for a period
 * @param {Array} quarterlyResults - Quarterly LLP results
 * @param {number} year - Year index
 * @returns {Object} Detailed LLP report
 */
export const createLLPReport = (quarterlyResults, year) => {
  const totalDefaults = quarterlyResults.reduce((sum, q) => sum + q.newDefaults, 0);
  const totalRecoveryNPV = quarterlyResults.reduce((sum, q) => sum + q.recoveryNPV, 0);
  const totalLLP = quarterlyResults.reduce((sum, q) => sum + q.llp, 0);
  
  return {
    year,
    totalDefaults,
    totalRecoveryNPV,
    totalLLP,
    coverageRatio: totalDefaults > 0 ? (totalLLP / totalDefaults) * 100 : 0,
    quarterlyBreakdown: quarterlyResults.map((q, i) => ({
      quarter: i + 1,
      defaults: q.newDefaults,
      recoveryNPV: q.recoveryNPV,
      llp: q.llp,
      performingStock: q.details.performingStock
    }))
  };
};