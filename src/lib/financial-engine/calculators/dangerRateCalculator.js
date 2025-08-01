/**
 * Danger Rate Calculator Microservice
 * 
 * Handles default calculations for loan vintages
 * Each vintage (quarterly disbursement) can default only once in its lifetime
 * after a specified number of quarters from disbursement
 */

/**
 * Calculate defaults for a specific quarter based on vintage-level danger rate
 * @param {Array} vintages - Array of all loan vintages
 * @param {number} currentQuarter - Current quarter index (0-based)
 * @param {Object} product - Product configuration including dangerRate and defaultAfterQuarters
 * @returns {Object} Default calculation results
 */
export const calculateQuarterlyDefaults = (vintages, currentQuarter, product) => {
  const dangerRate = (product.dangerRate || 0) / 100; // Convert percentage to decimal
  const defaultAfterQuarters = product.defaultAfterQuarters || 8; // Default to 8 quarters if not specified
  
  let totalNewDefaults = 0;
  const defaultingVintages = [];
  
  // Check each vintage to see if it defaults this quarter
  vintages.forEach(vintage => {
    // Skip if vintage has already defaulted
    if (vintage.hasDefaulted) return;
    
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const quartersElapsed = currentQuarter - vintageStartQuarter;
    
    // Check if this vintage defaults in the current quarter
    if (quartersElapsed === defaultAfterQuarters) {
      // Calculate default amount based on outstanding principal
      const defaultAmount = vintage.outstandingPrincipal * dangerRate;
      
      if (defaultAmount > 0) {
        totalNewDefaults += defaultAmount;
        
        // Mark vintage as defaulted
        vintage.hasDefaulted = true;
        vintage.defaultQuarter = currentQuarter;
        vintage.defaultAmount = defaultAmount;
        
        // Update outstanding principal (remove defaulted portion)
        vintage.outstandingPrincipal -= defaultAmount;
        
        defaultingVintages.push({
          vintageId: `Y${vintage.startYear}Q${vintage.startQuarter + 1}`,
          originalAmount: vintage.initialAmount,
          outstandingAtDefault: vintage.outstandingPrincipal + defaultAmount,
          defaultAmount: defaultAmount,
          defaultRate: dangerRate,
          quartersToDefault: defaultAfterQuarters
        });
      }
    }
  });
  
  return {
    newDefaults: totalNewDefaults,
    defaultingVintages: defaultingVintages,
    defaultRate: dangerRate,
    defaultTiming: defaultAfterQuarters
  };
};

/**
 * Calculate cumulative NPL (Non-Performing Loans) stock
 * @param {Array} vintages - Array of all loan vintages
 * @param {number} currentQuarter - Current quarter index
 * @returns {Object} NPL stock information
 */
export const calculateNPLStock = (vintages, currentQuarter) => {
  let totalNPLStock = 0;
  const nplVintages = [];
  
  vintages.forEach(vintage => {
    if (vintage.hasDefaulted && vintage.defaultAmount > 0) {
      const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
      const defaultAge = currentQuarter - (vintage.defaultQuarter || 0);
      
      // NPL stock is the defaulted amount that hasn't been recovered yet
      const remainingNPL = vintage.defaultAmount;
      
      if (remainingNPL > 0) {
        totalNPLStock += remainingNPL;
        
        nplVintages.push({
          vintageId: `Y${vintage.startYear}Q${vintage.startQuarter + 1}`,
          defaultAmount: vintage.defaultAmount,
          remainingNPL: remainingNPL,
          defaultQuarter: vintage.defaultQuarter,
          ageInQuarters: defaultAge
        });
      }
    }
  });
  
  return {
    totalNPLStock: totalNPLStock,
    nplVintages: nplVintages,
    nplCount: nplVintages.length
  };
};

/**
 * Calculate LLP (Loan Loss Provisions) for new defaults
 * @param {number} newDefaults - Amount of new defaults this quarter
 * @param {Object} product - Product configuration
 * @returns {Object} LLP calculation results
 */
export const calculateLLP = (newDefaults, product) => {
  // Simple LLP calculation - can be enhanced with more sophisticated models
  const coverageRatio = 1.0; // 100% coverage of new defaults
  const llp = newDefaults * coverageRatio;
  
  return {
    llp: llp,
    coverageRatio: coverageRatio,
    coveredDefaults: newDefaults
  };
};

/**
 * Main orchestrator for danger rate calculations
 * @param {Array} vintages - Array of all loan vintages
 * @param {number} currentQuarter - Current quarter index
 * @param {Object} product - Product configuration
 * @returns {Object} Complete danger rate calculation results
 */
export const processDangerRate = (vintages, currentQuarter, product) => {
  // Skip if no danger rate is configured
  if (!product.dangerRate || product.dangerRate === 0) {
    return {
      newDefaults: 0,
      nplStock: 0,
      llp: 0,
      defaultingVintages: [],
      nplVintages: []
    };
  }
  
  // Calculate new defaults for this quarter
  const defaultResults = calculateQuarterlyDefaults(vintages, currentQuarter, product);
  
  // Calculate cumulative NPL stock
  const nplResults = calculateNPLStock(vintages, currentQuarter);
  
  // Calculate LLP for new defaults
  const llpResults = calculateLLP(defaultResults.newDefaults, product);
  
  return {
    newDefaults: defaultResults.newDefaults,
    defaultingVintages: defaultResults.defaultingVintages,
    nplStock: nplResults.totalNPLStock,
    nplVintages: nplResults.nplVintages,
    llp: llpResults.llp,
    coverageRatio: llpResults.coverageRatio,
    defaultRate: defaultResults.defaultRate,
    defaultTiming: defaultResults.defaultTiming
  };
};

/**
 * Get danger rate configuration for UI
 * @returns {Object} Configuration options
 */
export const getDangerRateConfig = () => {
  return {
    dangerRate: {
      label: 'Danger Rate (%)',
      min: 0,
      max: 100,
      step: 0.1,
      defaultValue: 0,
      tooltip: 'Percentuale di default applicata una sola volta per ogni vintage'
    },
    defaultAfterQuarters: {
      label: 'Default dopo (trimestri)',
      min: 1,
      max: 40,
      step: 1,
      defaultValue: 8,
      tooltip: 'Numero di trimestri dopo l\'erogazione quando si verifica il default'
    }
  };
};