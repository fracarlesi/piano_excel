/**
 * Collateral Recovery Calculator Microservice
 * 
 * MICROSERVIZIO AUTONOMO per calcolare recovery su garanzie collaterali
 * Considera: LTV, collateral haircut, recovery costs
 * Garantisce che recovery non superi il GBV defaulted
 */

/**
 * Calcola collateral recovery per importo defaulted
 * @param {number} defaultedAmount - Importo andato in default (GBV)
 * @param {Object} product - Configurazione prodotto
 * @param {Object} assumptions - Assumptions globali
 * @param {number} defaultQuarter - Trimestre di default
 * @param {number} totalQuarters - Totale trimestri proiezione
 * @returns {Object} Collateral recovery details
 */
export const calculateCollateralRecovery = (defaultedAmount, product, assumptions, defaultQuarter, totalQuarters) => {
  // Se no defaulted amount, nessun recovery
  if (defaultedAmount <= 0) {
    return {
      collateralValue: 0,
      grossRecovery: 0,
      netRecovery: 0,
      netRecoveryNPV: 0,
      recoveryTime: 0,
      recoveryRate: 0,
      recoveryStartQuarter: defaultQuarter,
      recoveryEndQuarter: defaultQuarter,
      calculationMethod: 'none'
    };
  }
  
  const recoveryTimeYears = getCollateralRecoveryTime(product);
  let cappedNetRecovery = 0;
  let calculationMethod = '';
  let grossRecoveryAmount = 0; // For breakdown tracking
  
  // VERIFICA SE PRODOTTO È UNSECURED O SECURED
  
  if (isUnsecuredProduct(product)) {
    // UNSECURED: Usa LGD per calcolare recovery
    
    const lgd = getProductLGD(product);
    const recoveryRate = 100 - lgd; // Recovery Rate = 100% - LGD%
    cappedNetRecovery = defaultedAmount * (recoveryRate / 100);
    calculationMethod = 'lgd';
    
    
  } else {
    // SECURED: Usa LTV + Haircut + Recovery Costs (logica esistente)
    const ltv = getCollateralLTV(product);
    const collateralHaircut = getCollateralHaircut(product);
    const recoveryCosts = getRecoveryCosts(product);
    
    // CALCOLO VALORE COLLATERALE
    const collateralValue = defaultedAmount / (ltv / 100);
    
    // CALCOLO GROSS RECOVERY (dopo haircut)
    const grossRecovery = collateralValue * (1 - collateralHaircut / 100);
    grossRecoveryAmount = grossRecovery; // Store for breakdown
    
    // CALCOLO NET RECOVERY (dopo costi di recupero)
    // Recovery costs are applied as a percentage reduction of the gross recovery amount
    const netRecovery = grossRecovery * (1 - recoveryCosts / 100);
    
    // SAFETY CHECK: Recovery non può superare GBV defaulted
    cappedNetRecovery = Math.min(netRecovery, defaultedAmount);
    calculationMethod = 'ltv_haircut_costs';
    
  }
  
  // CALCOLO NPV CON DISCOUNT RATE
  const quarterlyDiscountRate = getQuarterlyDiscountRate(assumptions);
  const recoveryTimeQuarters = recoveryTimeYears * 4;
  const netRecoveryNPV = cappedNetRecovery / Math.pow(1 + quarterlyDiscountRate, recoveryTimeYears);
  
  // TIMING RECOVERY
  const recoveryStartQuarter = defaultQuarter + getRecoveryStartDelay(product);
  const recoveryEndQuarter = Math.min(
    recoveryStartQuarter + recoveryTimeQuarters,
    totalQuarters - 1
  );
  
  // RECOVERY RATE
  const recoveryRate = defaultedAmount > 0 ? (cappedNetRecovery / defaultedAmount) * 100 : 0;
  
  return {
    collateralValue: calculationMethod === 'lgd' ? 0 : (defaultedAmount / (getCollateralLTV(product) / 100)),
    grossRecovery: calculationMethod === 'lgd' ? cappedNetRecovery : grossRecoveryAmount,
    netRecovery: cappedNetRecovery,
    netRecoveryNPV,
    recoveryTime: recoveryTimeYears,
    recoveryRate,
    recoveryStartQuarter,
    recoveryEndQuarter,
    calculationMethod,
    
    // Breakdown details per analisi
    breakdown: {
      originalDefaultAmount: defaultedAmount,
      ltvUsed: calculationMethod === 'lgd' ? 0 : getCollateralLTV(product),
      collateralHaircut: calculationMethod === 'lgd' ? 0 : getCollateralHaircut(product),
      recoveryCosts: calculationMethod === 'lgd' ? 0 : getRecoveryCosts(product),
      recoveryCostAmount: calculationMethod === 'lgd' ? 0 : (grossRecoveryAmount * (getRecoveryCosts(product) / 100)),
      lgdUsed: calculationMethod === 'lgd' ? getProductLGD(product) : 0,
      discountRate: quarterlyDiscountRate * 4, // Annualized
      recoveryTimeQuarters
    }
  };
};

/**
 * Calcola distribuzione temporale collateral recovery
 * @param {Object} collateralRecovery - Results da calculateCollateralRecovery
 * @param {Object} product - Configurazione prodotto
 * @returns {Array} Recovery distribution schedule
 */
export const calculateCollateralRecoveryDistribution = (collateralRecovery, product) => {
  const schedule = [];
  
  if (collateralRecovery.netRecovery <= 0) {
    return schedule;
  }
  
  const startQuarter = collateralRecovery.recoveryStartQuarter;
  const endQuarter = collateralRecovery.recoveryEndQuarter;
  const totalRecovery = collateralRecovery.netRecovery;
  
  // DISTRIBUZIONE RECOVERY PATTERN
  const distributionPattern = getCollateralRecoveryPattern(product);
  
  for (let quarter = startQuarter; quarter <= endQuarter; quarter++) {
    const quarterProgress = (quarter - startQuarter) / (endQuarter - startQuarter);
    const recoveryPercent = calculateRecoveryPercentage(quarterProgress, distributionPattern);
    
    schedule.push({
      quarter,
      recoveryAmount: totalRecovery * recoveryPercent,
      cumulativeRecovery: totalRecovery * quarterProgress,
      recoveryType: 'collateral'
    });
  }
  
  return schedule;
};

/**
 * Verifica se prodotto è unsecured
 * @param {Object} product - Product configuration
 * @returns {boolean} True se unsecured
 */
const isUnsecuredProduct = (product) => {
  // Verifica multiple ways di indicare unsecured
  return product.isUnsecured === true ||
         product.secured === false ||
         product.securityType === 'unsecured' ||
         (product.stateGuaranteeType && product.stateGuaranteeType !== 'none' && !product.ltv); // Se ha solo garanzia statale senza LTV
};

/**
 * Get LGD per prodotti unsecured
 * @param {Object} product - Product configuration
 * @returns {number} LGD percentage
 */
const getProductLGD = (product) => {
  // Priorità: product.unsecuredLGD (UI) > product.lgd (default) > product.unsecuredLgd > default per tipo prodotto
  if (product.unsecuredLGD !== undefined) {
    return product.unsecuredLGD;
  }
  
  if (product.lgd !== undefined) {
    return product.lgd;
  }
  
  if (product.unsecuredLgd !== undefined) {
    return product.unsecuredLgd;
  }
  
  // Default LGD per tipo prodotto unsecured
  const lgdByType = {
    'bridge': 60,     // Bridge loans unsecured più rischioso
    'french': 45,     // French loans unsecured standard 
    'bullet': 55,     // Bullet loans unsecured medio
    'other': 50
  };
  
  const productType = product.type || product.productType || 'other';
  return lgdByType[productType] || 45; // Default 45% LGD
};

/**
 * Get LTV per collateral recovery (solo per secured)
 * @param {Object} product - Product configuration
 * @returns {number} LTV percentage
 */
const getCollateralLTV = (product) => {
  // Priorità: product.ltv > product assumptions > default
  return product.ltv || 
         product.loanToValue ||
         80; // Default LTV 80%
};

/**
 * Get collateral haircut percentage
 * @param {Object} product - Product configuration
 * @returns {number} Haircut percentage
 */
const getCollateralHaircut = (product) => {
  // Priorità: product.collateralHaircut > product assumptions > default per tipo
  if (product.collateralHaircut !== undefined) {
    return product.collateralHaircut;
  }
  
  // Default haircut per tipo prodotto
  const haircutByType = {
    'bridge': 20,     // Bridge loans più rischioso
    'french': 15,     // French loans standard
    'bullet': 18,     // Bullet loans medio rischio
    'other': 15
  };
  
  const productType = product.type || product.productType || 'other';
  return haircutByType[productType] || 15;
};

/**
 * Get recovery costs percentage
 * @param {Object} product - Product configuration
 * @returns {number} Recovery costs percentage
 */
const getRecoveryCosts = (product) => {
  // Priorità: product.recoveryCosts > product assumptions > default
  if (product.recoveryCosts !== undefined) {
    return product.recoveryCosts;
  }
  
  if (product.recoveryExpenses !== undefined) {
    return product.recoveryExpenses;
  }
  
  // Default recovery costs
  return 8; // 8% default recovery costs
};

/**
 * Get collateral recovery time in years (priorità al valore prodotto)
 * @param {Object} product - Product configuration
 * @returns {number} Recovery time in years
 */
const getCollateralRecoveryTime = (product) => {
  // PRIORITÀ 1: Usa timeToRecover configurato nel prodotto (in trimestri)
  if (product.timeToRecover && product.timeToRecover > 0) {
    return product.timeToRecover / 4; // Convert quarters to years
  }
  
  // PRIORITÀ 2: Altri campi specifici
  if (product.recoveryTime !== undefined) {
    return product.recoveryTime;
  }
  
  if (product.collateralRecoveryTime !== undefined) {
    return product.collateralRecoveryTime;
  }
  
  // PRIORITÀ 3: Default recovery time per tipo prodotto
  const recoveryTimeByType = {
    'bridge': 2.5,    // Bridge più veloce (asset development)
    'french': 3.0,    // French standard (residential/commercial)
    'bullet': 2.8,    // Bullet medio
    'other': 3.0
  };
  
  const productType = product.type || product.productType || 'other';
  const fallbackTime = recoveryTimeByType[productType] || 3.0;
  return fallbackTime;
};

/**
 * Get recovery start delay in quarters
 * @param {Object} product - Product configuration
 * @returns {number} Delay in quarters before recovery starts
 */
const getRecoveryStartDelay = (product) => {
  // Priorità: product.recoveryStartDelay > default per tipo
  if (product.recoveryStartDelay !== undefined) {
    return product.recoveryStartDelay;
  }
  
  // Default start delay per tipo prodotto (legal procedures)
  const delayByType = {
    'bridge': 2,      // 6 mesi (procedure più veloci)
    'french': 4,      // 1 anno (procedure standard)  
    'bullet': 3,      // 9 mesi (medio)
    'other': 4
  };
  
  const productType = product.type || product.productType || 'other';
  return delayByType[productType] || 4;
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
 * Get collateral recovery pattern
 * @param {Object} product - Product configuration
 * @returns {string} Recovery pattern type
 */
const getCollateralRecoveryPattern = (product) => {
  // Patterns disponibili: 'linear', 'early_heavy', 'late_heavy', 'bell_curve'
  return product.recoveryPattern || 'bell_curve'; // Default: concentrated in middle period
};

/**
 * Calculate recovery percentage for given quarter progress
 * @param {number} progress - Progress (0-1) from start to end
 * @param {string} pattern - Recovery pattern type
 * @returns {number} Recovery percentage for this quarter
 */
const calculateRecoveryPercentage = (progress, pattern) => {
  const totalPeriods = 1.0; // Normalized to 1.0
  const periodStep = 0.1; // 10% increments for distribution
  
  switch (pattern) {
    case 'linear':
      return periodStep; // Equal distribution
      
    case 'early_heavy':
      // 60% in first half, 40% in second half
      return progress < 0.5 ? periodStep * 1.2 : periodStep * 0.8;
      
    case 'late_heavy':
      // 40% in first half, 60% in second half
      return progress < 0.5 ? periodStep * 0.8 : periodStep * 1.2;
      
    case 'bell_curve':
    default:
      // Concentrated in middle period (25%-75%)
      if (progress < 0.25 || progress > 0.75) {
        return periodStep * 0.5; // Low recovery at start/end
      } else {
        return periodStep * 1.0; // Higher recovery in middle
      }
  }
};

/**
 * Validate collateral recovery parameters
 * @param {Object} product - Product configuration
 * @returns {Object} Validation results
 */
export const validateCollateralRecoveryParams = (product) => {
  const validation = {
    isValid: true,
    warnings: [],
    errors: []
  };
  
  // Check LTV
  const ltv = getCollateralLTV(product);
  if (ltv < 10 || ltv > 100) {
    validation.warnings.push(`LTV ${ltv}% seems unusual (typical range 50-90%)`);
  }
  
  // Check haircut
  const haircut = getCollateralHaircut(product);
  if (haircut < 0 || haircut > 50) {
    validation.errors.push(`Collateral haircut ${haircut}% outside valid range (0-50%)`);
    validation.isValid = false;
  }
  
  // Check recovery costs
  const costs = getRecoveryCosts(product);
  if (costs < 0 || costs > 25) {
    validation.warnings.push(`Recovery costs ${costs}% seem high (typical range 5-15%)`);
  }
  
  // Check recovery time
  const time = getCollateralRecoveryTime(product);
  if (time < 0.5 || time > 7) {
    validation.warnings.push(`Recovery time ${time} years outside typical range (1-5 years)`);
  }
  
  return validation;
};

/**
 * Format collateral recovery for reporting
 * @param {Object} collateralRecovery - Recovery calculation results
 * @param {Object} product - Product configuration
 * @returns {Object} Formatted reporting data
 */
export const formatCollateralRecoveryReport = (collateralRecovery, product) => {
  return {
    summary: {
      originalAmount: collateralRecovery.breakdown.originalDefaultAmount,
      collateralValue: collateralRecovery.collateralValue,
      netRecovery: collateralRecovery.netRecovery,
      recoveryRate: collateralRecovery.recoveryRate,
      recoveryTimeYears: collateralRecovery.recoveryTime
    },
    
    assumptions: {
      ltv: collateralRecovery.breakdown.ltvUsed,
      haircut: collateralRecovery.breakdown.collateralHaircut,
      recoveryCosts: collateralRecovery.breakdown.recoveryCosts,
      discountRate: collateralRecovery.breakdown.discountRate
    },
    
    timing: {
      startQuarter: collateralRecovery.recoveryStartQuarter,
      endQuarter: collateralRecovery.recoveryEndQuarter,
      durationQuarters: collateralRecovery.breakdown.recoveryTimeQuarters
    },
    
    amounts: {
      grossRecovery: collateralRecovery.grossRecovery,
      recoveryCostAmount: collateralRecovery.breakdown.recoveryCostAmount,
      netRecovery: collateralRecovery.netRecovery,
      netRecoveryNPV: collateralRecovery.netRecoveryNPV
    }
  };
};

// Export helper functions for ECL calculator
export { isUnsecuredProduct, getProductLGD };