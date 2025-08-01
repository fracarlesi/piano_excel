/**
 * NPL Present Value Calculator Microservice
 * 
 * MICROSERVIZIO AUTONOMO per calcolare valore attuale flussi NPL
 * Input: Flussi recovery futuri da NPLRecoveryCalculator
 * Output: Present Value per Balance Sheet (Net Realizable Value)
 */

/**
 * Calcola Present Value dei flussi di recovery NPL
 * @param {Object} recoveryResults - Results da NPLRecoveryCalculator
 * @param {Object} nplNBVResults - Results da NPLNBVCalculator  
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero trimestri (default 40)
 * @returns {Object} Present Value results
 */
export const calculateNPLPresentValue = (recoveryResults, nplNBVResults, assumptions, quarters = 40) => {
  const results = {
    // Net Realizable Value per Balance Sheet
    quarterlyNetRealizableValue: new Array(quarters).fill(0),
    
    // Breakdown componenti PV
    quarterlyPVStateGuarantee: new Array(quarters).fill(0),
    quarterlyPVCollateral: new Array(quarters).fill(0),
    
    // Impairment vs NBV
    quarterlyImpairmentLoss: new Array(quarters).fill(0),
    quarterlyImpairmentRate: new Array(quarters).fill(0),
    
    // Annual values per reporting
    annualNetRealizableValue: new Array(10).fill(0),
    annualImpairmentLoss: new Array(10).fill(0),
    
    // NPL cohort tracking con PV
    cohortPresentValues: [],
    
    // Metrics finali
    metrics: {
      totalNBV: 0,
      totalPresentValue: 0,
      totalImpairment: 0,
      averageRecoveryRate: 0,
      avgTimeToRecovery: 0
    }
  };

  const discountRate = getDiscountRate(assumptions);
  const quarterlyDiscountRate = discountRate / 4;
  
  // Calculate Present Value per quarter
  for (let quarter = 0; quarter < quarters; quarter++) {
    const year = Math.floor(quarter / 4);
    
    // Get NBV for this quarter
    const currentNBV = nplNBVResults.quarterlyNBV[quarter] || 0;
    
    // Calculate PV of future recovery flows from this quarter
    const presentValue = calculatePresentValueFromQuarter(
      recoveryResults,
      quarter,
      quarterlyDiscountRate,
      quarters
    );
    
    // Store results
    results.quarterlyNetRealizableValue[quarter] = presentValue.total;
    results.quarterlyPVStateGuarantee[quarter] = presentValue.stateGuarantee;
    results.quarterlyPVCollateral[quarter] = presentValue.collateral;
    
    // Calculate impairment loss
    const impairmentLoss = Math.max(0, currentNBV - presentValue.total);
    results.quarterlyImpairmentLoss[quarter] = impairmentLoss;
    results.quarterlyImpairmentRate[quarter] = currentNBV > 0 
      ? (impairmentLoss / currentNBV) * 100 
      : 0;
    
    // Annual aggregation
    if (quarter % 4 === 3) { // End of year
      results.annualNetRealizableValue[year] = presentValue.total;
      results.annualImpairmentLoss[year] = impairmentLoss;
    }
  }
  
  // Calculate cohort-level present values
  results.cohortPresentValues = calculateCohortPresentValues(
    recoveryResults.cohortRecoveryDetails,
    quarterlyDiscountRate
  );
  
  // Calculate final metrics
  results.metrics = calculateFinalMetrics(
    nplNBVResults,
    results,
    recoveryResults
  );
  
  return results;
};

/**
 * Calcola Present Value dei flussi futuri da un quarter specifico
 * @param {Object} recoveryResults - Recovery results
 * @param {number} currentQuarter - Quarter corrente
 * @param {number} quarterlyRate - Tasso sconto trimestrale
 * @param {number} totalQuarters - Numero totale trimestri
 * @returns {Object} Present value components
 */
const calculatePresentValueFromQuarter = (recoveryResults, currentQuarter, quarterlyRate, totalQuarters) => {
  let totalPV = 0;
  let stateGuaranteePV = 0;
  let collateralPV = 0;
  
  // Discount all future recovery flows from current quarter
  for (let futureQuarter = currentQuarter; futureQuarter < totalQuarters; futureQuarter++) {
    const periodsToDiscount = futureQuarter - currentQuarter;
    const discountFactor = Math.pow(1 + quarterlyRate, periodsToDiscount);
    
    // Get recovery flows for future quarter
    const stateGuaranteeFlow = recoveryResults.stateGuaranteeRecovery[futureQuarter] || 0;
    const collateralFlow = recoveryResults.collateralRecovery[futureQuarter] || 0;
    
    // Calculate present values
    const stateGuaranteePVFlow = stateGuaranteeFlow / discountFactor;
    const collateralPVFlow = collateralFlow / discountFactor;
    
    stateGuaranteePV += stateGuaranteePVFlow;
    collateralPV += collateralPVFlow;
    totalPV += stateGuaranteePVFlow + collateralPVFlow;
  }
  
  return {
    total: totalPV,
    stateGuarantee: stateGuaranteePV,
    collateral: collateralPV
  };
};

/**
 * Calcola Present Value per ogni cohort NPL
 * @param {Array} cohortRecoveryDetails - Dettagli recovery per cohort
 * @param {number} quarterlyRate - Tasso sconto trimestrale
 * @returns {Array} Present values per cohort
 */
const calculateCohortPresentValues = (cohortRecoveryDetails, quarterlyRate) => {
  return cohortRecoveryDetails.map(cohort => {
    // Calculate NPV of expected recovery
    const presentValue = cohort.expectedRecovery; // Already NPV from recovery calculator
    
    // Calculate recovery efficiency
    const recoveryEfficiency = cohort.originalNBV > 0 
      ? (presentValue / cohort.originalNBV) * 100 
      : 0;
    
    return {
      cohortId: cohort.cohortId,
      originalNBV: cohort.originalNBV,
      expectedRecovery: cohort.expectedRecovery,
      presentValue: presentValue,
      impairmentLoss: Math.max(0, cohort.originalNBV - presentValue),
      recoveryEfficiency: recoveryEfficiency,
      hasStateGuarantee: cohort.hasStateGuarantee
    };
  });
};

/**
 * Calcola metriche finali aggregate
 * @param {Object} nplNBVResults - NBV results
 * @param {Object} pvResults - Present value results
 * @param {Object} recoveryResults - Recovery results
 * @returns {Object} Final metrics
 */
const calculateFinalMetrics = (nplNBVResults, pvResults, recoveryResults) => {
  const finalQuarter = pvResults.quarterlyNetRealizableValue.length - 1;
  
  const totalNBV = nplNBVResults.metrics.totalNPLGenerated;
  const totalPresentValue = pvResults.quarterlyNetRealizableValue[finalQuarter];
  const totalImpairment = pvResults.quarterlyImpairmentLoss[finalQuarter];
  
  const averageRecoveryRate = totalNBV > 0 
    ? (totalPresentValue / totalNBV) * 100 
    : 0;
  
  return {
    totalNBV: totalNBV,
    totalPresentValue: totalPresentValue,
    totalImpairment: totalImpairment,
    averageRecoveryRate: averageRecoveryRate,
    avgTimeToRecovery: recoveryResults.metrics.averageRecoveryTime,
    
    // Breakdown efficiency
    stateGuaranteeEfficiency: calculateComponentEfficiency(
      pvResults.quarterlyPVStateGuarantee,
      totalNBV
    ),
    collateralEfficiency: calculateComponentEfficiency(
      pvResults.quarterlyPVCollateral,
      totalNBV
    )
  };
};

/**
 * Calcola efficienza componente recovery
 * @param {Array} componentValues - Array valori componente
 * @param {number} totalNBV - NBV totale
 * @returns {number} Efficiency percentage
 */
const calculateComponentEfficiency = (componentValues, totalNBV) => {
  const finalValue = componentValues[componentValues.length - 1] || 0;
  return totalNBV > 0 ? (finalValue / totalNBV) * 100 : 0;
};

/**
 * Get discount rate from assumptions
 * @param {Object} assumptions - Global assumptions
 * @returns {number} Annual discount rate
 */
const getDiscountRate = (assumptions) => {
  // Use cost of funds as discount rate for NPL recovery
  return (assumptions.costOfFundsRate || 3.0) / 100;
};

/**
 * Calcola coverage ratio per NPL
 * @param {Object} pvResults - Present value results
 * @param {Object} nplNBVResults - NBV results
 * @param {number} quarter - Quarter specifico
 * @returns {number} Coverage ratio percentage
 */
export const calculateCoverageRatio = (pvResults, nplNBVResults, quarter) => {
  const nbv = nplNBVResults.quarterlyNBV[quarter] || 0;
  const presentValue = pvResults.quarterlyNetRealizableValue[quarter] || 0;
  
  return nbv > 0 ? (presentValue / nbv) * 100 : 0;
};

/**
 * Format Present Value data per Balance Sheet
 * @param {Object} pvResults - Present value results
 * @param {Object} nblNBVResults - NBV results
 * @param {number} quarter - Quarter da visualizzare
 * @returns {Object} Formatted data per Balance Sheet
 */
export const formatPresentValueForBalanceSheet = (pvResults, nblNBVResults, quarter) => {
  const netRealizableValue = pvResults.quarterlyNetRealizableValue[quarter] || 0;
  const nbv = nblNBVResults.quarterlyNBV[quarter] || 0;
  const impairmentLoss = pvResults.quarterlyImpairmentLoss[quarter] || 0;
  const coverageRatio = calculateCoverageRatio(pvResults, nblNBVResults, quarter);
  
  return {
    // Main Balance Sheet line
    mainLine: {
      label: 'Non-Performing Assets (Net Realizable Value)',
      value: netRealizableValue,
      unit: '€M'
    },
    
    // Sub-components breakdown
    breakdown: {
      grossNBV: nbv,
      stateGuaranteePV: pvResults.quarterlyPVStateGuarantee[quarter] || 0,
      collateralPV: pvResults.quarterlyPVCollateral[quarter] || 0,
      impairmentLoss: impairmentLoss
    },
    
    // Key metrics
    metrics: {
      coverageRatio: coverageRatio,
      impairmentRate: pvResults.quarterlyImpairmentRate[quarter] || 0,
      recoveryEfficiency: netRealizableValue > 0 && nbv > 0 
        ? (netRealizableValue / nbv) * 100 
        : 0
    },
    
    // Formula explanation
    formula: `NPL Recovery PV: State Guarantee (${formatNumber(pvResults.quarterlyPVStateGuarantee[quarter] || 0, 1)}€M) + Collateral (${formatNumber(pvResults.quarterlyPVCollateral[quarter] || 0, 1)}€M) = ${formatNumber(netRealizableValue, 1)}€M`
  };
};

/**
 * Calcola stress test scenario per NPL values
 * @param {Object} pvResults - Base present value results
 * @param {Object} stressParams - Stress test parameters
 * @returns {Object} Stressed NPL values
 */
export const calculateStressScenario = (pvResults, stressParams) => {
  const stressedResults = {
    quarterlyNetRealizableValue: [...pvResults.quarterlyNetRealizableValue],
    additionalImpairment: new Array(pvResults.quarterlyNetRealizableValue.length).fill(0)
  };
  
  // Apply stress factors
  const recoveryRateStress = stressParams.recoveryRateReduction || 0; // % reduction
  const timeDelayStress = stressParams.recoveryDelayQuarters || 0; // additional quarters
  
  stressedResults.quarterlyNetRealizableValue = stressedResults.quarterlyNetRealizableValue.map((value, quarter) => {
    // Reduce recovery rate
    const stressedValue = value * (1 - recoveryRateStress / 100);
    
    // Calculate additional impairment
    stressedResults.additionalImpairment[quarter] = value - stressedValue;
    
    return stressedValue;
  });
  
  return stressedResults;
};

/**
 * Utility function per number formatting
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted number
 */
const formatNumber = (value, decimals = 1) => {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};