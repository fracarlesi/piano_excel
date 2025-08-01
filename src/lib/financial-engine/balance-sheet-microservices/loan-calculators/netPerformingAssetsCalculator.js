/**
 * Net Performing Assets Calculator Microservice
 * 
 * Calculates performing and non-performing assets over time
 * accounting for different credit types and their specific amortization patterns
 */

/**
 * Calculate Net Performing Assets for Bullet Loans
 * For bullet loans, principal remains constant until maturity, then goes to zero
 */
export const calculateBulletNetAssets = (vintages, currentQuarter, nplStock) => {
  let performingStock = 0;
  
  vintages.forEach(vintage => {
    if (vintage.type !== 'bullet') return;
    
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // For bullet loans: full principal until maturity, then zero
    // Note: we show quarter-end values, so exclude the maturity quarter
    if (vintageStartQuarter <= currentQuarter && currentQuarter < vintageMaturityQuarter) {
      performingStock += vintage.outstandingPrincipal;
    }
    // After maturity, the loan is fully repaid (assuming no defaults)
  });
  
  return {
    performingStock,
    nplStock, // NPL stock comes from defaults, not amortization
    totalGrossAssets: performingStock + nplStock
  };
};

/**
 * Calculate Net Performing Assets for French Loans with Grace Period
 * During grace period: full principal, then declining principal
 */
export const calculateFrenchWithGraceNetAssets = (vintages, currentQuarter, nplStock) => {
  let performingStock = 0;
  
  vintages.forEach(vintage => {
    if (vintage.type !== 'french' || !vintage.gracePeriod) return;
    
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    const gracePeriodQuarters = vintage.gracePeriod; // Already in quarters
    const graceEndQuarter = vintageStartQuarter + gracePeriodQuarters;
    
    if (vintageStartQuarter <= currentQuarter && currentQuarter < vintageMaturityQuarter) {
      // Always use the actual outstanding principal from the vintage
      // This value is already updated by updateAllVintagePrincipals
      // and follows the correct French amortization formula
      performingStock += vintage.outstandingPrincipal;
    }
  });
  
  return {
    performingStock,
    nplStock,
    totalGrossAssets: performingStock + nplStock
  };
};

/**
 * Calculate Net Performing Assets for French Loans without Grace Period
 * Declining principal from the start based on French amortization
 */
export const calculateFrenchNoGraceNetAssets = (vintages, currentQuarter, nplStock) => {
  let performingStock = 0;
  
  vintages.forEach(vintage => {
    if (vintage.type !== 'french' || vintage.gracePeriod > 0) return;
    
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    if (vintageStartQuarter <= currentQuarter && currentQuarter < vintageMaturityQuarter) {
      // Use the actual outstanding principal from the vintage
      // This value is already updated by updateAllVintagePrincipals
      // and follows the correct French amortization formula
      performingStock += vintage.outstandingPrincipal;
    }
  });
  
  return {
    performingStock,
    nplStock,
    totalGrossAssets: performingStock + nplStock
  };
};

/**
 * Main Net Performing Assets Calculator
 * Uses the outstanding principal from vintages which is already updated
 * with the correct amortization pattern
 */
export const calculateNetPerformingAssets = (vintages, currentQuarter, nplStock) => {
  let performingStock = 0;
  
  // Simple aggregation of all vintage outstanding principals
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Include vintages that are active in the current quarter
    if (vintageStartQuarter <= currentQuarter && currentQuarter < vintageMaturityQuarter) {
      performingStock += vintage.outstandingPrincipal;
    }
  });
  
  return {
    performingStock,
    nplStock, // Total NPL stock from defaults
    totalGrossAssets: performingStock + nplStock
  };
};