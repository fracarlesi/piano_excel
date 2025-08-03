/**
 * Recovery Timing Calculator Microservice
 * 
 * MICROSERVIZIO AUTONOMO per calcolare timing e distribuzione recovery
 * Coordina timing tra collateral recovery e state guarantee recovery
 * Crea schedule dettagliato per ogni trimestre
 */

/**
 * Calcola timing e distribuzione recovery completa
 * @param {Object} stateGuaranteeRecovery - State guarantee recovery details
 * @param {Object} collateralRecovery - Collateral recovery details  
 * @param {Object} product - Configurazione prodotto
 * @param {number} defaultQuarter - Trimestre di default
 * @param {number} totalQuarters - Totale trimestri proiezione
 * @returns {Object} Recovery timing and schedule
 */
export const calculateRecoveryTiming = (stateGuaranteeRecovery, collateralRecovery, product, defaultQuarter, totalQuarters) => {
  const results = {
    schedule: [],
    summary: {
      totalRecoveryAmount: 0,
      totalRecoveryNPV: 0,
      averageRecoveryTime: 0,
      recoveryCompletionQuarter: defaultQuarter,
      recoveryStartQuarter: defaultQuarter
    },
    
    // Breakdown per tipo recovery
    breakdown: {
      stateGuaranteeTotal: stateGuaranteeRecovery.recoveryAmount || 0,
      collateralTotal: collateralRecovery.netRecovery || 0,
      stateGuaranteeNPV: stateGuaranteeRecovery.recoveryNPV || 0,
      collateralNPV: collateralRecovery.netRecoveryNPV || 0
    }
  };
  
  // Calculate total recovery amounts
  results.summary.totalRecoveryAmount = results.breakdown.stateGuaranteeTotal + results.breakdown.collateralTotal;
  results.summary.totalRecoveryNPV = results.breakdown.stateGuaranteeNPV + results.breakdown.collateralNPV;
  
  // Se nessun recovery, return empty schedule
  if (results.summary.totalRecoveryAmount <= 0) {
    return results;
  }
  
  // CREA SCHEDULE DISTRIBUZIONE STATE GUARANTEE
  const stateGuaranteeSchedule = createStateGuaranteeDistribution(
    stateGuaranteeRecovery, 
    defaultQuarter, 
    totalQuarters
  );
  
  // CREA SCHEDULE DISTRIBUZIONE COLLATERAL
  const collateralSchedule = createCollateralDistribution(
    collateralRecovery, 
    defaultQuarter, 
    totalQuarters
  );
  
  // MERGE E OTTIMIZZA SCHEDULES
  results.schedule = mergeRecoverySchedules(
    stateGuaranteeSchedule, 
    collateralSchedule, 
    totalQuarters
  );
  
  // CALCOLA METRICHE TIMING
  results.summary = calculateTimingMetrics(results.schedule, results.summary);
  
  return results;
};

/**
 * Crea distribuzione temporale state guarantee recovery
 * @param {Object} stateGuaranteeRecovery - State guarantee recovery details
 * @param {number} defaultQuarter - Trimestre di default
 * @param {number} totalQuarters - Totale trimestri
 * @returns {Array} State guarantee distribution schedule
 */
const createStateGuaranteeDistribution = (stateGuaranteeRecovery, defaultQuarter, totalQuarters) => {
  const schedule = [];
  
  if (stateGuaranteeRecovery.recoveryAmount <= 0) {
    return schedule;
  }
  
  const startQuarter = stateGuaranteeRecovery.recoveryStartQuarter || defaultQuarter;
  const endQuarter = Math.min(
    stateGuaranteeRecovery.recoveryEndQuarter || startQuarter + 4,
    totalQuarters - 1
  );
  
  const totalAmount = stateGuaranteeRecovery.recoveryAmount;
  const guaranteeType = stateGuaranteeRecovery.guaranteeType || 'mcc';
  
  // DISTRIBUZIONE CONCENTRATA PER TIPO GARANZIA
  const cashflowSchedule = getStateGuaranteeCashflowSchedule(guaranteeType, totalAmount, startQuarter, endQuarter);
  
  cashflowSchedule.forEach(cashflow => {
    if (cashflow.quarter < totalQuarters) {
      schedule.push({
        quarter: cashflow.quarter,
        amount: cashflow.amount,
        type: 'state_guarantee',
        guaranteeType,
        cumulativeAmount: cashflow.cumulative
      });
    }
  });
  
  return schedule;
};

/**
 * Crea distribuzione temporale collateral recovery
 * @param {Object} collateralRecovery - Collateral recovery details
 * @param {number} defaultQuarter - Trimestre di default
 * @param {number} totalQuarters - Totale trimestri
 * @returns {Array} Collateral distribution schedule
 */
const createCollateralDistribution = (collateralRecovery, defaultQuarter, totalQuarters) => {
  const schedule = [];
  
  if (collateralRecovery.netRecovery <= 0) {
    return schedule;
  }
  
  const startQuarter = collateralRecovery.recoveryStartQuarter || defaultQuarter + 4;
  const endQuarter = Math.min(
    collateralRecovery.recoveryEndQuarter || startQuarter + 12,
    totalQuarters - 1
  );
  
  const totalAmount = collateralRecovery.netRecovery;
  
  // DISTRIBUZIONE CONCENTRATA COLLATERAL 
  const cashflowSchedule = getCollateralCashflowSchedule(totalAmount, startQuarter, endQuarter);
  
  cashflowSchedule.forEach(cashflow => {
    if (cashflow.quarter < totalQuarters) {
      schedule.push({
        quarter: cashflow.quarter,
        amount: cashflow.amount,
        type: 'collateral',
        cumulativeAmount: cashflow.cumulative
      });
    }
  });
  
  return schedule;
};

/**
 * Merge schedules state guarantee e collateral
 * @param {Array} stateGuaranteeSchedule - State guarantee schedule
 * @param {Array} collateralSchedule - Collateral schedule
 * @param {number} totalQuarters - Totale trimestri
 * @returns {Array} Combined recovery schedule
 */
const mergeRecoverySchedules = (stateGuaranteeSchedule, collateralSchedule, totalQuarters) => {
  const mergedSchedule = [];
  const quarterMap = new Map();
  
  // Aggiungi state guarantee
  stateGuaranteeSchedule.forEach(item => {
    if (!quarterMap.has(item.quarter)) {
      quarterMap.set(item.quarter, {
        quarter: item.quarter,
        totalRecovery: 0,
        stateGuaranteeRecovery: 0,
        collateralRecovery: 0,
        details: []
      });
    }
    
    const quarterData = quarterMap.get(item.quarter);
    quarterData.stateGuaranteeRecovery += item.amount;
    quarterData.totalRecovery += item.amount;
    quarterData.details.push({
      type: 'state_guarantee',
      amount: item.amount,
      guaranteeType: item.guaranteeType
    });
  });
  
  // Aggiungi collateral
  collateralSchedule.forEach(item => {
    if (!quarterMap.has(item.quarter)) {
      quarterMap.set(item.quarter, {
        quarter: item.quarter,
        totalRecovery: 0,
        stateGuaranteeRecovery: 0,
        collateralRecovery: 0,
        details: []
      });
    }
    
    const quarterData = quarterMap.get(item.quarter);
    quarterData.collateralRecovery += item.amount;
    quarterData.totalRecovery += item.amount;
    quarterData.details.push({
      type: 'collateral',
      amount: item.amount
    });
  });
  
  // Converti map in array ordinato
  const sortedQuarters = Array.from(quarterMap.keys()).sort((a, b) => a - b);
  
  sortedQuarters.forEach(quarter => {
    mergedSchedule.push(quarterMap.get(quarter));
  });
  
  return mergedSchedule;
};

/**
 * Calcola metriche timing dalla schedule
 * @param {Array} schedule - Recovery schedule
 * @param {Object} existingSummary - Summary esistente da aggiornare
 * @returns {Object} Updated summary con timing metrics
 */
const calculateTimingMetrics = (schedule, existingSummary) => {
  const summary = { ...existingSummary };
  
  if (schedule.length === 0) {
    return summary;
  }
  
  // Recovery start e completion quarters
  summary.recoveryStartQuarter = schedule[0].quarter;
  summary.recoveryCompletionQuarter = schedule[schedule.length - 1].quarter;
  
  // Calcola average recovery time (weighted by amount)
  let totalWeightedTime = 0;
  let totalAmount = 0;
  
  schedule.forEach(item => {
    const timeDiff = item.quarter - summary.recoveryStartQuarter;
    totalWeightedTime += item.totalRecovery * timeDiff;
    totalAmount += item.totalRecovery;
  });
  
  summary.averageRecoveryTime = totalAmount > 0 ? totalWeightedTime / totalAmount : 0;
  
  return summary;
};

/**
 * Get concentrated state guarantee cashflow schedule
 * @param {string} guaranteeType - Tipo garanzia  
 * @param {number} totalAmount - Importo totale da recuperare
 * @param {number} startQuarter - Quarter di inizio recovery
 * @param {number} endQuarter - Quarter di fine recovery
 * @returns {Array} Array of concentrated cashflows
 */
const getStateGuaranteeCashflowSchedule = (guaranteeType, totalAmount, startQuarter, endQuarter) => {
  const schedule = [];
  
  // SEMPRE 1 SOLO CASHFLOW per State Guarantee (unica soluzione)
  // Il timing dipende dal tipo di garanzia ma è sempre concentrato
  
  let recoveryQuarter = startQuarter;
  
  switch (guaranteeType.toLowerCase()) {
    case 'mcc':
      // MCC: recovery immediato (primo quarter disponibile)
      recoveryQuarter = startQuarter;
      break;
      
    case 'sace':
      // SACE: recovery leggermente posticipato
      recoveryQuarter = Math.min(startQuarter + 1, endQuarter);
      break;
      
    case 'region':
      // Regionali: più lente, recovery posticipato
      recoveryQuarter = Math.min(startQuarter + 2, endQuarter);
      break;
      
    default:
      // Altri tipi: recovery nel mezzo del periodo
      recoveryQuarter = Math.min(startQuarter + 1, endQuarter);
  }
  
  // SINGOLO CASHFLOW con l'intero importo
  schedule.push({
    quarter: recoveryQuarter,
    amount: totalAmount,
    cumulative: totalAmount
  });
  
  return schedule;
};

/**
 * Get concentrated collateral cashflow schedule
 * @param {number} totalAmount - Importo totale da recuperare
 * @param {number} startQuarter - Quarter di inizio recovery  
 * @param {number} endQuarter - Quarter di fine recovery
 * @returns {Array} Array of concentrated cashflows
 */
const getCollateralCashflowSchedule = (totalAmount, startQuarter, endQuarter) => {
  const schedule = [];
  
  // SEMPRE 1 SOLO CASHFLOW per Collateral Recovery (unica soluzione)
  // Recovery avviene al termine del periodo di liquidazione
  
  // Recovery al trimestre finale del periodo
  const recoveryQuarter = endQuarter;
  
  // SINGOLO CASHFLOW con l'intero importo
  schedule.push({
    quarter: recoveryQuarter,
    amount: totalAmount,
    cumulative: totalAmount
  });
  
  return schedule;
};

/**
 * Get state guarantee quarter percentage (DEPRECATED - keeping for compatibility)
 * @param {number} progress - Progress (0-1) nel periodo recovery
 * @param {string} guaranteeType - Tipo garanzia
 * @param {number} totalPeriods - Totale periodi distribuzione
 * @returns {number} Percentage per questo quarter
 */
const getStateGuaranteeQuarterPercent = (progress, guaranteeType, totalPeriods) => {
  const basePeriodPercent = 1.0 / totalPeriods;
  
  switch (guaranteeType.toLowerCase()) {
    case 'mcc':
      // MCC paga velocemente all'inizio (front-loaded)
      if (progress <= 0.3) return basePeriodPercent * 1.8; // 80% nei primi 30%
      if (progress <= 0.6) return basePeriodPercent * 0.7; // 20% nel 30% medio
      return basePeriodPercent * 0.1; // Poco alla fine
      
    case 'sace':
      // SACE distribuzione più uniforme
      return basePeriodPercent;
      
    case 'region':
      // Regionali più lente all'inizio (back-loaded)
      if (progress <= 0.4) return basePeriodPercent * 0.5; // 20% nei primi 40%
      if (progress <= 0.7) return basePeriodPercent * 1.0; // 30% nel medio
      return basePeriodPercent * 1.7; // 50% negli ultimi 30%
      
    default:
      // Linear distribution
      return basePeriodPercent;
  }
};

/**
 * Get collateral quarter percentage (bell curve distribution)
 * @param {number} progress - Progress (0-1) nel periodo recovery
 * @param {number} totalPeriods - Totale periodi distribuzione
 * @returns {number} Percentage per questo quarter
 */
const getCollateralQuarterPercent = (progress, totalPeriods) => {
  const basePeriodPercent = 1.0 / totalPeriods;
  
  // Bell curve: basso all'inizio e fine, alto nel mezzo
  if (progress <= 0.2) return basePeriodPercent * 0.3; // 6% nei primi 20%
  if (progress <= 0.4) return basePeriodPercent * 1.2; // 24% nel 20-40%
  if (progress <= 0.6) return basePeriodPercent * 1.8; // 36% nel 40-60% (peak)
  if (progress <= 0.8) return basePeriodPercent * 1.2; // 24% nel 60-80%
  return basePeriodPercent * 0.5; // 10% negli ultimi 20%
};

/**
 * Valida consistency recovery timing  
 * @param {Object} stateGuaranteeRecovery - State guarantee recovery
 * @param {Object} collateralRecovery - Collateral recovery
 * @param {number} defaultQuarter - Default quarter
 * @returns {Object} Validation results
 */
export const validateRecoveryTiming = (stateGuaranteeRecovery, collateralRecovery, defaultQuarter) => {
  const validation = {
    isValid: true,
    warnings: [],
    errors: []
  };
  
  // Check che recovery start dopo default
  if (stateGuaranteeRecovery.recoveryStartQuarter < defaultQuarter) {
    validation.errors.push('State guarantee recovery cannot start before default');
    validation.isValid = false;
  }
  
  if (collateralRecovery.recoveryStartQuarter < defaultQuarter) {
    validation.errors.push('Collateral recovery cannot start before default');
    validation.isValid = false;
  }
  
  // Check timing logico
  if (stateGuaranteeRecovery.recoveryStartQuarter > collateralRecovery.recoveryStartQuarter) {
    validation.warnings.push('State guarantee typically recovers before collateral liquidation');
  }
  
  // Check durate ragionevoli
  const stateGuaranteeDuration = stateGuaranteeRecovery.recoveryEndQuarter - stateGuaranteeRecovery.recoveryStartQuarter;
  if (stateGuaranteeDuration > 8) { // > 2 anni
    validation.warnings.push('State guarantee recovery duration seems very long (>2 years)');
  }
  
  const collateralDuration = collateralRecovery.recoveryEndQuarter - collateralRecovery.recoveryStartQuarter;
  if (collateralDuration > 20) { // > 5 anni
    validation.warnings.push('Collateral recovery duration seems very long (>5 years)');
  }
  
  return validation;
};

/**
 * Format recovery timing for reporting
 * @param {Object} recoveryTiming - Recovery timing results
 * @param {number} defaultQuarter - Default quarter
 * @returns {Object} Formatted timing report
 */
export const formatRecoveryTimingReport = (recoveryTiming, defaultQuarter) => {
  const startQuarter = recoveryTiming.summary.recoveryStartQuarter;
  const completionQuarter = recoveryTiming.summary.recoveryCompletionQuarter;
  
  return {
    summary: {
      totalRecoveryAmount: recoveryTiming.summary.totalRecoveryAmount,
      totalRecoveryNPV: recoveryTiming.summary.totalRecoveryNPV,
      averageRecoveryTimeQuarters: recoveryTiming.summary.averageRecoveryTime,
      averageRecoveryTimeYears: recoveryTiming.summary.averageRecoveryTime / 4
    },
    
    timing: {
      defaultQuarter,
      recoveryStartQuarter: startQuarter,
      recoveryCompletionQuarter: completionQuarter,
      totalRecoveryDurationQuarters: completionQuarter - startQuarter,
      totalRecoveryDurationYears: (completionQuarter - startQuarter) / 4,
      delayFromDefaultQuarters: startQuarter - defaultQuarter,
      delayFromDefaultYears: (startQuarter - defaultQuarter) / 4
    },
    
    breakdown: {
      stateGuaranteeAmount: recoveryTiming.breakdown.stateGuaranteeTotal,
      stateGuaranteeNPV: recoveryTiming.breakdown.stateGuaranteeNPV,
      stateGuaranteePercentage: recoveryTiming.summary.totalRecoveryAmount > 0 
        ? (recoveryTiming.breakdown.stateGuaranteeTotal / recoveryTiming.summary.totalRecoveryAmount) * 100 
        : 0,
      
      collateralAmount: recoveryTiming.breakdown.collateralTotal,
      collateralNPV: recoveryTiming.breakdown.collateralNPV,
      collateralPercentage: recoveryTiming.summary.totalRecoveryAmount > 0 
        ? (recoveryTiming.breakdown.collateralTotal / recoveryTiming.summary.totalRecoveryAmount) * 100 
        : 0
    },
    
    schedule: recoveryTiming.schedule.map(item => ({
      quarter: item.quarter,
      totalRecovery: item.totalRecovery,
      stateGuaranteeRecovery: item.stateGuaranteeRecovery,
      collateralRecovery: item.collateralRecovery,
      cumulativeTotal: item.totalRecovery // This would need to be calculated cumulatively
    }))
  };
};

/**
 * Get recovery timing benchmark per product type
 * @param {string} productType - Tipo prodotto
 * @returns {Object} Benchmark timing data
 */
export const getRecoveryTimingBenchmarks = (productType) => {
  const benchmarks = {
    'bridge': {
      stateGuaranteeDays: 90,     // 3 mesi
      collateralDays: 730,        // 2 anni (asset development)
      totalRecoveryDays: 1095     // 3 anni
    },
    'french': {
      stateGuaranteeDays: 180,    // 6 mesi
      collateralDays: 1095,       // 3 anni (residential/commercial)
      totalRecoveryDays: 1460     // 4 anni
    },
    'bullet': {
      stateGuaranteeDays: 120,    // 4 mesi
      collateralDays: 1000,       // ~2.7 anni
      totalRecoveryDays: 1300     // ~3.5 anni
    }
  };
  
  const benchmark = benchmarks[productType] || benchmarks['french'];
  
  return {
    stateGuaranteeQuarters: Math.ceil(benchmark.stateGuaranteeDays / 90),
    collateralQuarters: Math.ceil(benchmark.collateralDays / 90),
    totalRecoveryQuarters: Math.ceil(benchmark.totalRecoveryDays / 90),
    productType
  };
};