/**
 * Default Calculator Module - True Quarterly Logic
 * 
 * This version applies default rate on beginning-of-quarter stock only,
 * excluding new disbursements in the current quarter
 */

/**
 * Calculate adjusted default rate based on credit classification
 * @param {Object} product - Product configuration
 * @returns {number} Adjusted default rate as decimal
 */
export const getAdjustedDefaultRate = (product) => {
  const baseDefaultRate = product.dangerRate / 100;
  const classificationMultiplier = product.creditClassification === 'UTP' ? 2.5 : 1.0;
  return baseDefaultRate * classificationMultiplier;
};

/**
 * Calculate quarterly default rate from annual rate
 * @param {number} annualRate - Annual default rate
 * @returns {number} Quarterly default rate
 */
export const getQuarterlyDefaultRate = (annualRate) => {
  // Simple division by 4 for quarterly rate
  // Could use compound formula: (1 + annualRate)^(1/4) - 1 for more precision
  return annualRate / 4;
};

/**
 * Process quarterly defaults with true quarterly logic
 * @param {Array} vintages - Array of vintage objects
 * @param {number} currentQuarter - Current quarter (absolute)
 * @param {number} year - Current year
 * @param {number} quarter - Quarter within year (0-3)
 * @param {Object} product - Product configuration
 * @returns {Object} Quarterly default results
 */
export const processQuarterlyDefaultsNew = (
  vintages,
  currentQuarter,
  year,
  quarter,
  product
) => {
  let quarterlyNewDefaults = 0;
  const newNPLCohorts = [];
  
  // Get quarterly default rate
  const annualRate = getAdjustedDefaultRate(product);
  const quarterlyRate = getQuarterlyDefaultRate(annualRate);
  
  vintages.forEach(vintage => {
    // Skip if vintage hasn't started yet
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    if (currentQuarter < vintageStartQuarter) {
      return;
    }
    
    // Skip if vintage has matured
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    if (currentQuarter >= vintageMaturityQuarter) {
      return;
    }
    
    // Get beginning-of-quarter stock (before any new disbursements)
    // This is critical: we save the state BEFORE processing the quarter
    const beginningStock = vintage.outstandingPrincipalBeforeQuarter || vintage.outstandingPrincipal;
    
    if (beginningStock <= 0) {
      return;
    }
    
    // Calculate defaults on beginning stock only
    let defaultAmount = beginningStock * quarterlyRate;
    
    // Cannot default more than outstanding
    defaultAmount = Math.min(defaultAmount, vintage.outstandingPrincipal);
    
    if (defaultAmount > 0) {
      // Reduce performing stock
      vintage.outstandingPrincipal -= defaultAmount;
      quarterlyNewDefaults += defaultAmount;
      
      // Track new NPL cohort
      newNPLCohorts.push({
        vintage,
        amount: defaultAmount,
        quarter: currentQuarter
      });
    }
  });
  
  return {
    newDefaults: quarterlyNewDefaults,
    newNPLCohorts
  };
};

/**
 * Save vintage states before quarter processing
 * @param {Array} vintages - Array of vintage objects
 */
export const saveVintageStatesBeforeQuarter = (vintages) => {
  vintages.forEach(vintage => {
    vintage.outstandingPrincipalBeforeQuarter = vintage.outstandingPrincipal;
  });
};

/**
 * Calculate year-end performing stock
 * @param {Array} vintages - Array of vintage objects
 * @param {number} year - Year index
 * @returns {number} Total performing stock at year end
 */
export const calculateYearEndPerformingStock = (vintages, year) => {
  const currentYearEnd = (year + 1) * 4;
  let yearEndPerformingStock = 0;
  
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    if (vintageStartQuarter < currentYearEnd && vintageMaturityQuarter >= currentYearEnd) {
      yearEndPerformingStock += vintage.outstandingPrincipal;
    }
  });
  
  return yearEndPerformingStock;
};