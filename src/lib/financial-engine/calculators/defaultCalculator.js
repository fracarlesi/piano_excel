/**
 * Default Calculator Module
 * 
 * Handles NPL formation, default rate calculations, and LLP calculations
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
 * Calculate annual defaults for a vintage
 * @param {Object} vintage - Vintage object
 * @param {number} year - Current year
 * @param {number} adjustedDefaultRate - Adjusted annual default rate
 * @returns {number} Annual default amount
 */
export const calculateVintageAnnualDefaults = (vintage, year, adjustedDefaultRate) => {
  // Only calculate defaults on outstanding principal
  if (vintage.outstandingPrincipal <= 0) {
    return 0;
  }
  
  const vintageStartYear = vintage.startYear;
  const vintageStartQuarter = vintage.startQuarter;
  
  // For first year of vintage, adjust for partial year
  if (year === vintageStartYear) {
    const quartersActive = 4 - vintageStartQuarter;
    const effectiveRate = adjustedDefaultRate * (quartersActive / 4);
    return vintage.outstandingPrincipal * effectiveRate;
  }
  
  // For subsequent years, use full annual rate
  return vintage.outstandingPrincipal * adjustedDefaultRate;
};

/**
 * Calculate quarterly defaults based on annual allocation
 * @param {number} annualDefaults - Total annual defaults
 * @param {number} quarter - Current quarter (0-3)
 * @param {number} year - Current year
 * @param {Object} vintage - Vintage object
 * @param {number} defaultsAppliedSoFar - Defaults already applied this year
 * @returns {number} Quarterly default amount
 */
export const calculateQuarterlyDefaults = (
  annualDefaults,
  quarter,
  year,
  vintage,
  defaultsAppliedSoFar
) => {
  const remainingDefaults = annualDefaults - defaultsAppliedSoFar;
  
  if (remainingDefaults <= 0) {
    return 0;
  }
  
  const vintageStartYear = vintage.startYear;
  const vintageStartQuarter = vintage.startQuarter;
  
  // Check if vintage is active in this quarter
  if (year === vintageStartYear && quarter < vintageStartQuarter) {
    return 0;
  }
  
  // Calculate distribution
  if (year === vintageStartYear) {
    // First year: distribute across active quarters
    const firstActiveQuarter = quarter - vintageStartQuarter;
    const totalActiveQuarters = 4 - vintageStartQuarter;
    const quartersRemaining = totalActiveQuarters - firstActiveQuarter;
    return Math.min(remainingDefaults / quartersRemaining, vintage.outstandingPrincipal);
  } else {
    // Subsequent years: distribute evenly across remaining quarters
    const quartersRemaining = 4 - quarter;
    return Math.min(remainingDefaults / quartersRemaining, vintage.outstandingPrincipal);
  }
};

/**
 * NPL Cohort tracking for recovery timing
 * @typedef {Object} NPLCohort
 * @property {number} quarter - Quarter when NPL was created
 * @property {number} amount - NPL amount
 * @property {number} recoveryQuarter - Quarter when recovery is expected
 * @property {string} type - Recovery type (stateGuarantee, collateral, unsecured)
 */

/**
 * Process quarterly defaults and recovery for all vintages
 * @param {Array} vintages - Array of vintage objects
 * @param {number} currentQuarter - Current quarter (absolute)
 * @param {number} year - Current year
 * @param {number} quarter - Quarter within year (0-3)
 * @param {Object} product - Product configuration
 * @param {Map} annualDefaultsByVintage - Pre-calculated annual defaults
 * @param {Map} defaultsAppliedByVintage - Tracking applied defaults
 * @returns {Object} Quarterly default results
 */
export const processQuarterlyDefaults = (
  vintages,
  currentQuarter,
  year,
  quarter,
  product,
  annualDefaultsByVintage,
  defaultsAppliedByVintage
) => {
  let quarterlyNewDefaults = 0;
  let quarterlyLLP = 0;
  const newNPLCohorts = [];
  
  vintages.forEach(vintage => {
    if (!annualDefaultsByVintage.has(vintage)) {
      return;
    }
    
    const annualDefaults = annualDefaultsByVintage.get(vintage);
    const defaultsApplied = defaultsAppliedByVintage.get(vintage) || 0;
    
    const newDefaultsThisQuarter = calculateQuarterlyDefaults(
      annualDefaults,
      quarter,
      year,
      vintage,
      defaultsApplied
    );
    
    if (newDefaultsThisQuarter > 0) {
      // CRITICAL: Cannot default more than outstanding principal
      const actualDefaults = Math.min(newDefaultsThisQuarter, vintage.outstandingPrincipal);
      
      if (actualDefaults > 0) {
        // Update tracking
        defaultsAppliedByVintage.set(vintage, defaultsApplied + actualDefaults);
        
        // Reduce performing stock
        vintage.outstandingPrincipal -= actualDefaults;
        quarterlyNewDefaults += actualDefaults;
        
        // Note: NPV recovery calculation will be handled by recoveryCalculator
        // Here we just track the new defaults
        newNPLCohorts.push({
          vintage,
          amount: actualDefaults,
          quarter: currentQuarter
        });
      }
    }
  });
  
  return {
    newDefaults: quarterlyNewDefaults,
    newNPLCohorts
  };
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