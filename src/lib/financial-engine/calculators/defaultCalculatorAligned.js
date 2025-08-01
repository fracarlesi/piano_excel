/**
 * Default Calculator Module - Aligned with User Requirements
 * 
 * Applies default rate on total portfolio at beginning of quarter,
 * excluding new disbursements in current quarter
 */

/**
 * Calculate adjusted default rate based on credit classification
 */
export const getAdjustedDefaultRate = (product) => {
  const baseDefaultRate = product.dangerRate / 100;
  const classificationMultiplier = product.creditClassification === 'UTP' ? 2.5 : 1.0;
  return baseDefaultRate * classificationMultiplier;
};

/**
 * Process quarterly defaults - aligned version
 * Applies default rate to total portfolio at beginning of quarter
 */
export const processQuarterlyDefaultsAligned = (
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
  const quarterlyRate = annualRate / 4;
  
  // Calculate total performing stock at beginning of quarter
  // (before any new disbursements this quarter)
  let totalBeginningStock = 0;
  
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Include vintage if it started before this quarter and hasn't matured yet
    if (vintageStartQuarter < currentQuarter && currentQuarter < vintageMaturityQuarter) {
      // Use the saved state from before quarter processing
      const beginningStock = vintage.outstandingPrincipalBeforeQuarter || vintage.outstandingPrincipal;
      totalBeginningStock += beginningStock;
    }
  });
  
  // Apply default rate to total portfolio
  const totalDefaultAmount = totalBeginningStock * quarterlyRate;
  
  if (totalDefaultAmount <= 0) {
    return {
      newDefaults: 0,
      newNPLCohorts: []
    };
  }
  
  // Distribute defaults proportionally across vintages
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    if (vintageStartQuarter < currentQuarter && currentQuarter < vintageMaturityQuarter) {
      const beginningStock = vintage.outstandingPrincipalBeforeQuarter || vintage.outstandingPrincipal;
      
      if (beginningStock > 0 && totalBeginningStock > 0) {
        // Proportional share of defaults
        const vintageShare = beginningStock / totalBeginningStock;
        let vintageDefaults = totalDefaultAmount * vintageShare;
        
        // Cannot default more than outstanding
        vintageDefaults = Math.min(vintageDefaults, vintage.outstandingPrincipal);
        
        if (vintageDefaults > 0) {
          // Reduce performing stock
          vintage.outstandingPrincipal -= vintageDefaults;
          quarterlyNewDefaults += vintageDefaults;
          
          // Track new NPL cohort
          newNPLCohorts.push({
            vintage,
            amount: vintageDefaults,
            quarter: currentQuarter
          });
        }
      }
    }
  });
  
  return {
    newDefaults: quarterlyNewDefaults,
    newNPLCohorts
  };
};

/**
 * Save vintage states before quarter processing
 */
export const saveVintageStatesBeforeQuarter = (vintages) => {
  vintages.forEach(vintage => {
    vintage.outstandingPrincipalBeforeQuarter = vintage.outstandingPrincipal;
  });
};

/**
 * Calculate year-end performing stock
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