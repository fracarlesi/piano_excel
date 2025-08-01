/**
 * Recovery Calculator Module
 * 
 * Handles NPL recovery calculations including collateral recovery
 * and state guarantee recovery with NPV calculations
 */

/**
 * Calculate state guarantee recovery NPV
 * @param {number} defaultAmount - Default amount
 * @param {Object} product - Product configuration
 * @param {number} quarterlyRate - Quarterly discount rate
 * @returns {Object} State guarantee recovery details
 */
export const calculateStateGuaranteeRecovery = (defaultAmount, product, quarterlyRate) => {
  if (!product.stateGuaranteeType || 
      product.stateGuaranteeType === 'none' || 
      !product.stateGuaranteeCoverage || 
      product.stateGuaranteeCoverage === 0) {
    return {
      guaranteedAmount: 0,
      recoveryNPV: 0,
      recoveryTime: 0
    };
  }
  
  const guaranteedAmount = defaultAmount * (product.stateGuaranteeCoverage / 100);
  const stateRecoveryTime = product.stateGuaranteeRecoveryTime || 0.5;
  const annualRate = quarterlyRate * 4;
  const recoveryNPV = guaranteedAmount / Math.pow(1 + annualRate, stateRecoveryTime);
  
  return {
    guaranteedAmount,
    recoveryNPV,
    recoveryTime: stateRecoveryTime
  };
};

/**
 * Calculate collateral recovery NPV for secured loans
 * @param {number} defaultAmount - Default amount (or non-guaranteed portion)
 * @param {Object} product - Product configuration
 * @param {number} quarterlyRate - Quarterly discount rate
 * @returns {Object} Collateral recovery details
 */
export const calculateCollateralRecovery = (defaultAmount, product, quarterlyRate) => {
  if (product.isUnsecured || defaultAmount <= 0) {
    return {
      collateralValue: 0,
      netRecovery: 0,
      recoveryNPV: 0
    };
  }
  
  const collateralValue = defaultAmount / (product.ltv / 100);
  const valueAfterHaircut = collateralValue * (1 - product.collateralHaircut / 100);
  const recoveryCosts = defaultAmount * (product.recoveryCosts / 100);
  const netRecovery = Math.max(0, valueAfterHaircut - recoveryCosts);
  
  const timeToRecover = product.timeToRecover || 3;
  const annualRate = quarterlyRate * 4;
  const recoveryNPV = netRecovery / Math.pow(1 + annualRate, timeToRecover);
  
  return {
    collateralValue,
    netRecovery,
    recoveryNPV,
    recoveryTime: timeToRecover
  };
};

/**
 * Calculate unsecured loan recovery NPV
 * @param {number} defaultAmount - Default amount
 * @param {Object} product - Product configuration
 * @param {number} quarterlyRate - Quarterly discount rate
 * @returns {Object} Unsecured recovery details
 */
export const calculateUnsecuredRecovery = (defaultAmount, product, quarterlyRate) => {
  if (!product.isUnsecured || defaultAmount <= 0) {
    return {
      recoveryRate: 0,
      recoveryAmount: 0,
      recoveryNPV: 0
    };
  }
  
  const unsecuredLGD = product.unsecuredLGD || 45;
  const recoveryRate = (100 - unsecuredLGD) / 100;
  const recoveryAmount = defaultAmount * recoveryRate;
  
  const timeToRecover = product.timeToRecover || 3;
  const annualRate = quarterlyRate * 4;
  const recoveryNPV = recoveryAmount / Math.pow(1 + annualRate, timeToRecover);
  
  return {
    recoveryRate,
    recoveryAmount,
    recoveryNPV,
    recoveryTime: timeToRecover
  };
};

/**
 * Calculate total NPV recovery and LLP for a default
 * @param {number} defaultAmount - Default amount
 * @param {Object} product - Product configuration
 * @param {number} quarterlyRate - Quarterly discount rate
 * @param {number} currentQuarter - Current quarter for cohort tracking
 * @returns {Object} Complete recovery analysis
 */
export const calculateTotalRecovery = (defaultAmount, product, quarterlyRate, currentQuarter) => {
  const nplCohorts = [];
  let totalNPVRecovery = 0;
  
  // Step 1: Calculate state guarantee recovery
  const stateGuarantee = calculateStateGuaranteeRecovery(defaultAmount, product, quarterlyRate);
  if (stateGuarantee.recoveryNPV > 0) {
    totalNPVRecovery += stateGuarantee.recoveryNPV;
    const recoveryQuarter = currentQuarter + Math.round(stateGuarantee.recoveryTime * 4);
    
    nplCohorts.push({
      quarter: currentQuarter,
      amount: stateGuarantee.recoveryNPV,
      recoveryQuarter,
      type: 'stateGuarantee'
    });
  }
  
  // Step 2: Calculate recovery on non-guaranteed portion
  const nonGuaranteedAmount = defaultAmount * (1 - (product.stateGuaranteeCoverage || 0) / 100);
  
  if (nonGuaranteedAmount > 0) {
    if (product.isUnsecured) {
      // Unsecured recovery
      const unsecured = calculateUnsecuredRecovery(nonGuaranteedAmount, product, quarterlyRate);
      if (unsecured.recoveryNPV > 0) {
        totalNPVRecovery += unsecured.recoveryNPV;
        const recoveryQuarter = currentQuarter + Math.round(unsecured.recoveryTime * 4);
        
        nplCohorts.push({
          quarter: currentQuarter,
          amount: unsecured.recoveryNPV,
          recoveryQuarter,
          type: 'unsecured'
        });
      }
    } else {
      // Collateral recovery
      const collateral = calculateCollateralRecovery(nonGuaranteedAmount, product, quarterlyRate);
      if (collateral.recoveryNPV > 0) {
        totalNPVRecovery += collateral.recoveryNPV;
        const recoveryQuarter = currentQuarter + Math.round(collateral.recoveryTime * 4);
        
        nplCohorts.push({
          quarter: currentQuarter,
          amount: collateral.recoveryNPV,
          recoveryQuarter,
          type: 'collateral'
        });
      }
    }
  }
  
  // LLP is the difference between gross value and total discounted recovery
  const llp = defaultAmount - totalNPVRecovery;
  
  return {
    defaultAmount,
    totalNPVRecovery,
    llp,
    nplCohorts,
    stateGuaranteeRecovery: stateGuarantee.recoveryNPV,
    otherRecovery: totalNPVRecovery - stateGuarantee.recoveryNPV
  };
};

/**
 * Process NPL cohort recoveries for a quarter
 * @param {Array} nplCohorts - Array of NPL cohorts
 * @param {number} currentQuarter - Current quarter
 * @returns {Object} Recovery results
 */
export const processQuarterlyRecoveries = (nplCohorts, currentQuarter) => {
  let quarterlyRecoveries = 0;
  const recoveredCohorts = [];
  
  nplCohorts.forEach((cohort, index) => {
    if (currentQuarter === cohort.recoveryQuarter) {
      quarterlyRecoveries += cohort.amount;
      recoveredCohorts.push(index);
    }
  });
  
  return {
    quarterlyRecoveries,
    recoveredCohortIndices: recoveredCohorts
  };
};