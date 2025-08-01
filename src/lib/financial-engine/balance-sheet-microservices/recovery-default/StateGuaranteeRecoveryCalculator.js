/**
 * State Guarantee Recovery Calculator Microservice
 * 
 * MICROSERVIZIO AUTONOMO per calcolare recovery da garanzie pubbliche
 * Gestisce: MCC, SACE, altre garanzie statali
 * Tempi di recupero specifici per tipo garanzia
 */

/**
 * Calcola state guarantee recovery per importo defaulted
 * @param {number} defaultedAmount - Importo andato in default (GBV)
 * @param {Object} product - Configurazione prodotto
 * @param {Object} assumptions - Assumptions globali
 * @param {number} defaultQuarter - Trimestre di default
 * @param {number} totalQuarters - Totale trimestri proiezione
 * @returns {Object} State guarantee recovery details
 */
export const calculateStateGuaranteeRecovery = (defaultedAmount, product, assumptions, defaultQuarter, totalQuarters) => {
  // Se no garanzia statale o no defaulted amount, nessun recovery
  if (!hasStateGuarantee(product) || defaultedAmount <= 0) {
    return {
      guaranteedAmount: 0,
      recoveryAmount: 0,
      recoveryNPV: 0,
      recoveryRate: 0,
      recoveryTime: 0,
      guaranteeType: 'none',
      recoveryStartQuarter: defaultQuarter,
      recoveryEndQuarter: defaultQuarter
    };
  }
  
  // PARAMETRI GARANZIA DA ASSUNZIONI PRODOTTO
  const guaranteeType = getStateGuaranteeType(product);
  const coveragePercentage = getStateGuaranteeCoverage(product, guaranteeType);
  const recoveryTimeYears = getStateGuaranteeRecoveryTime(product, guaranteeType);
  
  // CALCOLO RECOVERY DIRETTO (CORRETTO)
  // Recovery = Coverage% applicata direttamente al GBV defaulted
  const guaranteeValue = getGuaranteeValue(product);
  let recoveryAmount = 0;
  
  if (guaranteeValue > 0) {
    // Se c'è un valore fisso di garanzia, usa quello (capped al defaulted amount)
    recoveryAmount = Math.min(guaranteeValue, defaultedAmount);
  } else {
    // Altrimenti usa la percentuale di coverage
    recoveryAmount = defaultedAmount * (coveragePercentage / 100);
  }
  
  // SAFETY CHECK: Recovery non può superare GBV defaulted
  recoveryAmount = Math.min(recoveryAmount, defaultedAmount);
  
  console.log(`🛡️ State Guarantee: €${defaultedAmount.toFixed(1)}M × ${coveragePercentage}% = €${recoveryAmount.toFixed(1)}M`);
  
  // CALCOLO NPV CON DISCOUNT RATE
  const quarterlyDiscountRate = getQuarterlyDiscountRate(assumptions);
  const recoveryNPV = recoveryAmount / Math.pow(1 + quarterlyDiscountRate, recoveryTimeYears);
  
  // TIMING RECOVERY
  const recoveryStartQuarter = defaultQuarter + getGuaranteeActivationDelay(guaranteeType);
  const recoveryTimeQuarters = recoveryTimeYears * 4;
  const recoveryEndQuarter = Math.min(
    recoveryStartQuarter + recoveryTimeQuarters,
    totalQuarters - 1
  );
  
  // RECOVERY RATE
  const recoveryRate = defaultedAmount > 0 ? (recoveryAmount / defaultedAmount) * 100 : 0;
  
  return {
    guaranteedAmount: recoveryAmount, // Same as recoveryAmount now
    recoveryAmount,
    recoveryNPV,
    recoveryRate,
    recoveryTime: recoveryTimeYears,
    guaranteeType,
    recoveryStartQuarter,
    recoveryEndQuarter,
    
    // Breakdown details per analisi
    breakdown: {
      originalDefaultAmount: defaultedAmount,
      guaranteeValue: guaranteeValue,
      coveragePercentage,
      discountRate: quarterlyDiscountRate * 4, // Annualized
      recoveryTimeQuarters,
      activationDelay: getGuaranteeActivationDelay(guaranteeType)
    }
  };
};

/**
 * Calcola distribuzione temporale state guarantee recovery
 * @param {Object} stateGuaranteeRecovery - Results da calculateStateGuaranteeRecovery
 * @returns {Array} Recovery distribution schedule
 */
export const calculateStateGuaranteeRecoveryDistribution = (stateGuaranteeRecovery) => {
  const schedule = [];
  
  if (stateGuaranteeRecovery.recoveryAmount <= 0) {
    return schedule;
  }
  
  const startQuarter = stateGuaranteeRecovery.recoveryStartQuarter;
  const endQuarter = stateGuaranteeRecovery.recoveryEndQuarter;
  const totalRecovery = stateGuaranteeRecovery.recoveryAmount;
  const guaranteeType = stateGuaranteeRecovery.guaranteeType;
  
  // DISTRIBUZIONE RECOVERY PATTERN (dipende dal tipo garanzia)
  const distributionPattern = getStateGuaranteeRecoveryPattern(guaranteeType);
  const totalPeriods = endQuarter - startQuarter + 1;
  
  for (let quarter = startQuarter; quarter <= endQuarter; quarter++) {
    const quarterIndex = quarter - startQuarter;
    const quarterProgress = quarterIndex / (totalPeriods - 1);
    const recoveryPercent = calculateStateGuaranteeRecoveryPercentage(quarterProgress, distributionPattern);
    
    schedule.push({
      quarter,
      recoveryAmount: totalRecovery * recoveryPercent,
      cumulativeRecovery: totalRecovery * quarterProgress,
      recoveryType: 'state_guarantee',
      guaranteeType
    });
  }
  
  return schedule;
};

/**
 * Check se prodotto ha garanzia statale
 * @param {Object} product - Product configuration
 * @returns {boolean} True se ha garanzia statale
 */
const hasStateGuarantee = (product) => {
  return product.hasStateGuarantee === true ||
         product.stateGuarantee === true ||
         (product.stateGuaranteeType && product.stateGuaranteeType !== 'none') ||
         (product.guaranteeType && product.guaranteeType !== 'none');
};

/**
 * Get tipo garanzia statale
 * @param {Object} product - Product configuration
 * @returns {string} Tipo garanzia
 */
const getStateGuaranteeType = (product) => {
  // Priorità: stateGuaranteeType > guaranteeType > default
  return product.stateGuaranteeType || 
         product.guaranteeType || 
         'mcc'; // Default MCC
};

/**
 * Get copertura garanzia statale
 * @param {Object} product - Product configuration
 * @param {string} guaranteeType - Tipo garanzia
 * @returns {number} Coverage percentage
 */
const getStateGuaranteeCoverage = (product, guaranteeType) => {
  // Priorità: product.stateGuaranteeCoverage > default per tipo
  if (product.stateGuaranteeCoverage !== undefined) {
    return product.stateGuaranteeCoverage;
  }
  
  if (product.guaranteeCoverage !== undefined) {
    return product.guaranteeCoverage;
  }
  
  // Default coverage per tipo garanzia
  const coverageByType = {
    'mcc': 70,        // Medio Credito Centrale 70%
    'sace': 80,       // SACE 80%
    'invitalia': 75,  // Invitalia 75%
    'region': 60,     // Garanzie regionali 60%
    'other': 65,      // Altre garanzie pubbliche 65%
    'none': 0
  };
  
  return coverageByType[guaranteeType.toLowerCase()] || 65;
};

/**
 * Get valore specifico garanzia (se configurato)
 * @param {Object} product - Product configuration
 * @returns {number} Guarantee value (0 = use percentage)
 */
const getGuaranteeValue = (product) => {
  return product.stateGuaranteeValue || 
         product.guaranteeValue || 
         0; // 0 = use percentage coverage
};

/**
 * Get tempo di recupero garanzia statale (priorità al valore prodotto)
 * @param {Object} product - Product configuration
 * @param {string} guaranteeType - Tipo garanzia (fallback)
 * @returns {number} Recovery time in years
 */
const getStateGuaranteeRecoveryTime = (product, guaranteeType) => {
  // PRIORITÀ 1: Usa il valore configurato nel prodotto (in trimestri)
  if (product.stateGuaranteeRecoveryTime && product.stateGuaranteeRecoveryTime > 0) {
    console.log(`📅 Using product-specific state guarantee recovery time: ${product.stateGuaranteeRecoveryTime} quarters`);
    return product.stateGuaranteeRecoveryTime / 4; // Convert quarters to years
  }
  
  // PRIORITÀ 2: Usa default per tipo garanzia
  const timeByType = {
    'mcc': 0.5,       // MCC: 6 mesi (veloce)
    'sace': 0.75,     // SACE: 9 mesi
    'invitalia': 1.0, // Invitalia: 12 mesi
    'region': 1.25,   // Regionali: 15 mesi (più lente)
    'other': 1.5,     // Altre: 18 mesi
    'none': 0
  };
  
  const fallbackTime = timeByType[guaranteeType?.toLowerCase()] || 1.0;
  console.log(`📅 Using fallback state guarantee recovery time: ${fallbackTime} years for type ${guaranteeType}`);
  return fallbackTime;
};

/**
 * Get efficienza garanzia (% effettivamente recuperata)
 * @param {string} guaranteeType - Tipo garanzia
 * @returns {number} Efficiency percentage
 */
const getStateGuaranteeEfficiency = (guaranteeType) => {
  // Non tutte le garanzie pagano il 100% del garantito
  const efficiencyByType = {
    'mcc': 95,        // MCC molto efficiente
    'sace': 90,       // SACE efficiente
    'invitalia': 85,  // Invitalia buona
    'region': 80,     // Regionali variabili
    'other': 75,      // Altre meno efficienti
    'none': 0
  };
  
  return efficiencyByType[guaranteeType.toLowerCase()] || 85;
};

/**
 * Get delay attivazione garanzia in quarters
 * @param {string} guaranteeType - Tipo garanzia
 * @returns {number} Activation delay in quarters
 */
const getGuaranteeActivationDelay = (guaranteeType) => {
  // Tempo tra default e attivazione garanzia
  const delayByType = {
    'mcc': 1,         // MCC: 3 mesi (rapida)
    'sace': 2,        // SACE: 6 mesi
    'invitalia': 2,   // Invitalia: 6 mesi
    'region': 3,      // Regionali: 9 mesi (procedure più lunghe)
    'other': 4,       // Altre: 12 mesi
    'none': 0
  };
  
  return delayByType[guaranteeType.toLowerCase()] || 2;
};

/**
 * Get quarterly discount rate from assumptions
 * @param {Object} assumptions - Global assumptions
 * @returns {number} Quarterly discount rate
 */
const getQuarterlyDiscountRate = (assumptions) => {
  const annualRate = assumptions.costOfFundsRate || 
                    assumptions.discountRate || 
                    3.0; // Default 3%
  return annualRate / 100 / 4;
};

/**
 * Get state guarantee recovery pattern
 * @param {string} guaranteeType - Tipo garanzia
 * @returns {string} Recovery pattern type
 */
const getStateGuaranteeRecoveryPattern = (guaranteeType) => {
  // Patterns per tipo garanzia
  const patternByType = {
    'mcc': 'front_loaded',      // MCC paga velocemente all'inizio
    'sace': 'linear',           // SACE distribuzione uniforme
    'invitalia': 'linear',      // Invitalia distribuzione uniforme
    'region': 'back_loaded',    // Regionali pagano di più verso la fine
    'other': 'linear'           // Altre distribuzione uniforme
  };
  
  return patternByType[guaranteeType.toLowerCase()] || 'linear';
};

/**
 * Calculate state guarantee recovery percentage for given quarter progress
 * @param {number} progress - Progress (0-1) from start to end
 * @param {string} pattern - Recovery pattern type
 * @returns {number} Recovery percentage for this quarter
 */
const calculateStateGuaranteeRecoveryPercentage = (progress, pattern) => {
  const periods = 10; // Normalize to 10 periods for calculation
  const basePeriodPercent = 1.0 / periods;
  
  switch (pattern) {
    case 'front_loaded':
      // 70% nei primi 50% del tempo, 30% nel resto
      return progress < 0.5 ? basePeriodPercent * 1.4 : basePeriodPercent * 0.6;
      
    case 'back_loaded':
      // 30% nei primi 50% del tempo, 70% nel resto
      return progress < 0.5 ? basePeriodPercent * 0.6 : basePeriodPercent * 1.4;
      
    case 'linear':
    default:
      // Distribuzione uniforme
      return basePeriodPercent;
  }
};

/**
 * Validate state guarantee parameters
 * @param {Object} product - Product configuration
 * @returns {Object} Validation results
 */
export const validateStateGuaranteeParams = (product) => {
  const validation = {
    isValid: true,
    warnings: [],
    errors: []
  };
  
  if (!hasStateGuarantee(product)) {
    return validation; // No validation needed if no guarantee
  }
  
  // Check guarantee type
  const guaranteeType = getStateGuaranteeType(product);
  const validTypes = ['mcc', 'sace', 'invitalia', 'region', 'other'];
  if (!validTypes.includes(guaranteeType.toLowerCase())) {
    validation.warnings.push(`Unknown guarantee type: ${guaranteeType}`);
  }
  
  // Check coverage
  const coverage = getStateGuaranteeCoverage(product, guaranteeType);
  if (coverage < 0 || coverage > 100) {
    validation.errors.push(`Guarantee coverage ${coverage}% outside valid range (0-100%)`);
    validation.isValid = false;
  }
  
  if (coverage > 90) {
    validation.warnings.push(`Guarantee coverage ${coverage}% is very high (typical max 80%)`);
  }
  
  // Check guarantee value vs coverage
  const guaranteeValue = getGuaranteeValue(product);
  if (guaranteeValue > 0 && coverage > 0) {
    validation.warnings.push('Both guarantee value and coverage percentage specified - using value');
  }
  
  return validation;
};

/**
 * Format state guarantee recovery for reporting
 * @param {Object} stateGuaranteeRecovery - Recovery calculation results
 * @param {Object} product - Product configuration
 * @returns {Object} Formatted reporting data
 */
export const formatStateGuaranteeRecoveryReport = (stateGuaranteeRecovery, product) => {
  return {
    summary: {
      guaranteeType: stateGuaranteeRecovery.guaranteeType,
      originalAmount: stateGuaranteeRecovery.breakdown.originalDefaultAmount,
      guaranteedAmount: stateGuaranteeRecovery.guaranteedAmount,
      recoveryAmount: stateGuaranteeRecovery.recoveryAmount,
      recoveryRate: stateGuaranteeRecovery.recoveryRate,
      recoveryTimeYears: stateGuaranteeRecovery.recoveryTime
    },
    
    assumptions: {
      coveragePercentage: stateGuaranteeRecovery.breakdown.coveragePercentage,
      guaranteeEfficiency: stateGuaranteeRecovery.breakdown.guaranteeEfficiency,
      guaranteeValue: stateGuaranteeRecovery.breakdown.guaranteeValue,
      discountRate: stateGuaranteeRecovery.breakdown.discountRate
    },
    
    timing: {
      activationDelay: stateGuaranteeRecovery.breakdown.activationDelay,
      startQuarter: stateGuaranteeRecovery.recoveryStartQuarter,
      endQuarter: stateGuaranteeRecovery.recoveryEndQuarter,
      durationQuarters: stateGuaranteeRecovery.breakdown.recoveryTimeQuarters
    },
    
    amounts: {
      guaranteedAmount: stateGuaranteeRecovery.guaranteedAmount,
      recoveryAmount: stateGuaranteeRecovery.recoveryAmount,
      recoveryNPV: stateGuaranteeRecovery.recoveryNPV,
      efficiencyLoss: stateGuaranteeRecovery.guaranteedAmount - stateGuaranteeRecovery.recoveryAmount
    }
  };
};

/**
 * Get state guarantee types available
 * @returns {Array} Available guarantee types with descriptions
 */
export const getAvailableStateGuaranteeTypes = () => {
  return [
    {
      type: 'mcc',
      name: 'Medio Credito Centrale',
      coverage: '70%',
      recoveryTime: '6 months',
      efficiency: '95%'
    },
    {
      type: 'sace',
      name: 'SACE',
      coverage: '80%',
      recoveryTime: '9 months',
      efficiency: '90%'
    },
    {
      type: 'invitalia',
      name: 'Invitalia',
      coverage: '75%',
      recoveryTime: '12 months',
      efficiency: '85%'
    },
    {
      type: 'region',
      name: 'Garanzie Regionali',
      coverage: '60%',
      recoveryTime: '15 months',
      efficiency: '80%'
    },
    {
      type: 'other',
      name: 'Altre Garanzie Pubbliche',
      coverage: '65%',
      recoveryTime: '18 months',
      efficiency: '75%'
    }
  ];
};