/**
 * NPL Recovery Calculator Microservice
 * 
 * MICROSERVIZIO AUTONOMO per calcolare recuperi su NPL esistenti
 * Input: NPL Cohorts con NBV
 * Output: Flussi di recovery attesi con state guarantees
 */

/**
 * Calcola recovery su portfolio NPL esistente
 * @param {Array} nplCohorts - Cohorts NPL da NPLNBVCalculator
 * @param {Object} product - Configurazione prodotto
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero trimestri (default 40)
 * @returns {Object} Recovery results
 */
export const calculateNPLRecovery = (nplCohorts, product, assumptions, quarters = 40) => {
  const results = {
    // Flussi recovery per trimestre
    quarterlyRecoveryFlows: new Array(quarters).fill(0),
    
    // Breakdown per tipo recovery
    stateGuaranteeRecovery: new Array(quarters).fill(0),
    collateralRecovery: new Array(quarters).fill(0),
    
    // Tracking cohorts recovery
    cohortRecoveryDetails: [],
    
    // Metrics per analisi
    metrics: {
      totalExpectedRecovery: 0,
      stateGuaranteeShare: 0,
      collateralShare: 0,
      averageRecoveryTime: 0
    }
  };

  const quarterlyRate = getQuarterlyDiscountRate(assumptions);
  let totalExpectedRecovery = 0;
  let totalStateGuaranteeRecovery = 0;
  let totalCollateralRecovery = 0;
  
  // Process each NPL cohort
  nplCohorts.forEach((cohort, cohortIndex) => {
    const cohortRecovery = calculateCohortRecovery(
      cohort,
      product,
      quarterlyRate,
      quarters
    );
    
    // Add to quarterly flows
    cohortRecovery.quarterlyFlows.forEach((flow, quarter) => {
      if (quarter < quarters) {
        results.quarterlyRecoveryFlows[quarter] += flow.totalRecovery;
        results.stateGuaranteeRecovery[quarter] += flow.stateGuarantee;
        results.collateralRecovery[quarter] += flow.collateral;
      }
    });
    
    // Store cohort details
    results.cohortRecoveryDetails.push({
      cohortId: cohortIndex,
      originalNBV: cohort.nbvAmount,
      expectedRecovery: cohortRecovery.totalRecovery,
      recoveryRate: cohortRecovery.recoveryRate,
      primaryRecoveryQuarter: cohortRecovery.primaryRecoveryQuarter,
      hasStateGuarantee: cohort.hasStateGuarantee
    });
    
    // Aggregate totals
    totalExpectedRecovery += cohortRecovery.totalRecovery;
    totalStateGuaranteeRecovery += cohortRecovery.stateGuaranteeTotal;
    totalCollateralRecovery += cohortRecovery.collateralTotal;
  });
  
  // Calculate metrics
  results.metrics.totalExpectedRecovery = totalExpectedRecovery;
  results.metrics.stateGuaranteeShare = totalExpectedRecovery > 0 
    ? (totalStateGuaranteeRecovery / totalExpectedRecovery) * 100 
    : 0;
  results.metrics.collateralShare = totalExpectedRecovery > 0 
    ? (totalCollateralRecovery / totalExpectedRecovery) * 100 
    : 0;
  
  // Calculate average recovery time
  results.metrics.averageRecoveryTime = calculateAverageRecoveryTime(
    results.cohortRecoveryDetails
  );
  
  return results;
};

/**
 * Calcola recovery per singolo cohort NPL
 * @param {Object} cohort - NPL cohort
 * @param {Object} product - Product configuration
 * @param {number} quarterlyRate - Quarterly discount rate
 * @param {number} quarters - Total quarters
 * @returns {Object} Cohort recovery details
 */
const calculateCohortRecovery = (cohort, product, quarterlyRate, quarters) => {
  const result = {
    quarterlyFlows: [],
    totalRecovery: 0,
    stateGuaranteeTotal: 0,
    collateralTotal: 0,
    recoveryRate: 0,
    primaryRecoveryQuarter: 0
  };
  
  // 1. State Guarantee Recovery (if applicable)
  const stateGuaranteeRecovery = calculateStateGuaranteeRecovery(
    cohort.nbvAmount,
    product,
    quarterlyRate,
    cohort.creationDate
  );
  
  // 2. Collateral Recovery (remaining amount)
  const remainingAmount = cohort.nbvAmount - stateGuaranteeRecovery.guaranteedAmount;
  const collateralRecovery = calculateCollateralRecovery(
    remainingAmount,
    product,
    quarterlyRate,
    cohort.creationDate
  );
  
  // Distribute recovery flows over time
  const recoverySchedule = createRecoverySchedule(
    stateGuaranteeRecovery,
    collateralRecovery,
    cohort.creationDate,
    quarters
  );
  
  result.quarterlyFlows = recoverySchedule;
  result.totalRecovery = stateGuaranteeRecovery.recoveryNPV + collateralRecovery.netRecoveryNPV;
  result.stateGuaranteeTotal = stateGuaranteeRecovery.recoveryNPV;
  result.collateralTotal = collateralRecovery.netRecoveryNPV;
  result.recoveryRate = cohort.nbvAmount > 0 
    ? (result.totalRecovery / cohort.nbvAmount) * 100 
    : 0;
  
  // Find primary recovery quarter
  let maxRecovery = 0;
  recoverySchedule.forEach((flow, index) => {
    if (flow.totalRecovery > maxRecovery) {
      maxRecovery = flow.totalRecovery;
      result.primaryRecoveryQuarter = cohort.creationDate + index;
    }
  });
  
  return result;
};

/**
 * Calculate state guarantee recovery NPV
 * @param {number} defaultAmount - Default amount
 * @param {Object} product - Product configuration
 * @param {number} quarterlyRate - Quarterly discount rate
 * @param {number} creationQuarter - Quarter when NPL was created
 * @returns {Object} State guarantee recovery details
 */
const calculateStateGuaranteeRecovery = (defaultAmount, product, quarterlyRate, creationQuarter) => {
  if (!product.hasStateGuarantee || 
      product.stateGuaranteeType === 'none' || 
      !product.stateGuaranteeCoverage || 
      product.stateGuaranteeCoverage === 0) {
    return {
      guaranteedAmount: 0,
      recoveryNPV: 0,
      recoveryTime: 0
    };
  }
  
  // State guarantee parameters
  const coverage = getStateGuaranteeCoverage(product.stateGuaranteeType);
  const recoveryTime = getStateGuaranteeRecoveryTime(product.stateGuaranteeType);
  
  const guaranteedAmount = defaultAmount * (coverage / 100);
  const annualRate = quarterlyRate * 4;
  const recoveryNPV = guaranteedAmount / Math.pow(1 + annualRate, recoveryTime);
  
  return {
    guaranteedAmount,
    recoveryNPV,
    recoveryTime
  };
};

/**
 * Calculate collateral recovery NPV for secured loans
 * @param {number} remainingAmount - Amount not covered by state guarantee
 * @param {Object} product - Product configuration
 * @param {number} quarterlyRate - Quarterly discount rate
 * @param {number} creationQuarter - Quarter when NPL was created
 * @returns {Object} Collateral recovery details
 */
const calculateCollateralRecovery = (remainingAmount, product, quarterlyRate, creationQuarter) => {
  if (product.isUnsecured || remainingAmount <= 0) {
    return {
      collateralValue: 0,
      netRecovery: 0,
      netRecoveryNPV: 0,
      recoveryTime: 0
    };
  }
  
  // Collateral recovery calculation
  const ltv = product.ltv || 80;
  const collateralHaircut = product.collateralHaircut || 15;
  const recoveryCosts = product.recoveryCosts || 10;
  const recoveryTime = 3; // 3 years average recovery time
  
  // Collateral value = Loan amount / LTV
  const collateralValue = remainingAmount / (ltv / 100);
  
  // Net recovery after haircut and costs
  const grossRecovery = collateralValue * (1 - collateralHaircut / 100);
  const netRecovery = Math.max(0, grossRecovery - (remainingAmount * recoveryCosts / 100));
  
  // NPV calculation
  const annualRate = quarterlyRate * 4;
  const netRecoveryNPV = netRecovery / Math.pow(1 + annualRate, recoveryTime);
  
  return {
    collateralValue,
    netRecovery,
    netRecoveryNPV,
    recoveryTime
  };
};

/**
 * Create recovery schedule over time
 * @param {Object} stateGuaranteeRecovery - State guarantee recovery details
 * @param {Object} collateralRecovery - Collateral recovery details
 * @param {number} creationQuarter - NPL creation quarter
 * @param {number} totalQuarters - Total quarters
 * @returns {Array} Recovery schedule
 */
const createRecoverySchedule = (stateGuaranteeRecovery, collateralRecovery, creationQuarter, totalQuarters) => {
  const schedule = [];
  const maxRecoveryPeriod = 20; // 5 years in quarters
  
  for (let i = 0; i < maxRecoveryPeriod && (creationQuarter + i) < totalQuarters; i++) {
    const quartersSinceDefault = i;
    let stateGuaranteeFlow = 0;
    let collateralFlow = 0;
    
    // State guarantee recovery (typically within 0.5 years)
    if (stateGuaranteeRecovery.recoveryNPV > 0 && 
        quartersSinceDefault >= 2 && quartersSinceDefault <= 4) {
      stateGuaranteeFlow = stateGuaranteeRecovery.recoveryNPV / 3; // Spread over 3 quarters
    }
    
    // Collateral recovery (typically 2-4 years)
    if (collateralRecovery.netRecoveryNPV > 0 && 
        quartersSinceDefault >= 8 && quartersSinceDefault <= 16) {
      collateralFlow = collateralRecovery.netRecoveryNPV / 9; // Spread over 9 quarters
    }
    
    schedule.push({
      quarter: creationQuarter + i,
      stateGuarantee: stateGuaranteeFlow,
      collateral: collateralFlow,
      totalRecovery: stateGuaranteeFlow + collateralFlow
    });
  }
  
  return schedule;
};

/**
 * Get state guarantee coverage based on type
 * @param {string} guaranteeType - Type of state guarantee
 * @returns {number} Coverage percentage
 */
const getStateGuaranteeCoverage = (guaranteeType) => {
  const coverageMap = {
    'mcc': 70,      // MCC guarantee
    'sace': 80,     // SACE guarantee
    'other': 60,    // Other state guarantees
    'none': 0
  };
  
  return coverageMap[guaranteeType?.toLowerCase()] || 0;
};

/**
 * Get state guarantee recovery time
 * @param {string} guaranteeType - Type of state guarantee
 * @returns {number} Recovery time in years
 */
const getStateGuaranteeRecoveryTime = (guaranteeType) => {
  const timeMap = {
    'mcc': 0.5,     // 6 months
    'sace': 0.75,   // 9 months
    'other': 1.0,   // 12 months
    'none': 0
  };
  
  return timeMap[guaranteeType?.toLowerCase()] || 1.0;
};

/**
 * Get quarterly discount rate from assumptions
 * @param {Object} assumptions - Global assumptions
 * @returns {number} Quarterly discount rate
 */
const getQuarterlyDiscountRate = (assumptions) => {
  const annualRate = assumptions.costOfFundsRate || 3.0;
  return annualRate / 100 / 4;
};

/**
 * Calculate average recovery time across cohorts
 * @param {Array} cohortDetails - Array of cohort recovery details
 * @returns {number} Average recovery time in quarters
 */
const calculateAverageRecoveryTime = (cohortDetails) => {
  if (cohortDetails.length === 0) return 0;
  
  const totalWeightedTime = cohortDetails.reduce((sum, cohort) => {
    return sum + (cohort.primaryRecoveryQuarter * cohort.expectedRecovery);
  }, 0);
  
  const totalRecovery = cohortDetails.reduce((sum, cohort) => {
    return sum + cohort.expectedRecovery;
  }, 0);
  
  return totalRecovery > 0 ? totalWeightedTime / totalRecovery : 0;
};

/**
 * Format recovery data for reporting
 * @param {Object} recoveryResults - Results from calculateNPLRecovery
 * @param {number} quarter - Quarter to display
 * @returns {Object} Formatted recovery data
 */
export const formatRecoveryForReporting = (recoveryResults, quarter) => {
  const recoveryFlow = recoveryResults.quarterlyRecoveryFlows[quarter] || 0;
  const stateGuaranteeFlow = recoveryResults.stateGuaranteeRecovery[quarter] || 0;
  const collateralFlow = recoveryResults.collateralRecovery[quarter] || 0;
  
  return {
    totalRecovery: recoveryFlow,
    breakdown: {
      stateGuarantee: stateGuaranteeFlow,
      collateral: collateralFlow
    },
    metrics: recoveryResults.metrics
  };
};