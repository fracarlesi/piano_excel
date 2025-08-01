/**
 * Vintage Manager Module
 * 
 * Handles the creation and management of loan vintages
 * A vintage represents a cohort of loans originated in a specific quarter
 */

/**
 * Get interest rate based on product configuration
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {number} Interest rate as decimal
 */
export const getInterestRate = (product, assumptions) => {
  if (product.isFixedRate) {
    return (product.spread + 2.0) / 100; // Fixed rate: spread + 2%
  }
  return (assumptions.euribor + product.spread) / 100; // Variable rate: EURIBOR + spread
};

/**
 * Calculate quarterly payment for French amortization
 * @param {number} principal - Loan principal amount
 * @param {number} quarterlyRate - Quarterly interest rate
 * @param {number} totalQuarters - Total number of quarters
 * @param {number} gracePeriodQuarters - Grace period in quarters
 * @returns {number} Quarterly payment amount
 */
export const calculateQuarterlyPayment = (principal, quarterlyRate, totalQuarters, gracePeriodQuarters) => {
  const amortizationQuarters = totalQuarters - gracePeriodQuarters;
  
  if (quarterlyRate > 0 && amortizationQuarters > 0) {
    // French amortization formula for quarterly payments (excluding grace period)
    const compoundFactor = Math.pow(1 + quarterlyRate, amortizationQuarters);
    return principal * (quarterlyRate * compoundFactor) / (compoundFactor - 1);
  }
  
  return amortizationQuarters > 0 ? principal / amortizationQuarters : 0;
};

/**
 * Create a single vintage
 * @param {Object} params - Vintage parameters
 * @returns {Object} Vintage object
 */
export const createVintage = ({
  year,
  quarter,
  volume,
  product,
  assumptions
}) => {
  const productType = (product.type || 'french').toLowerCase();
  const durata = Number(product.durata);
  const gracePeriod = Number(product.gracePeriod) || 0;
  
  const vintage = {
    startYear: year,
    startQuarter: quarter, // Q0, Q1, Q2, Q3
    initialAmount: volume,
    outstandingPrincipal: volume,
    type: productType,
    durata: durata,
    gracePeriod: gracePeriod,
    spread: product.spread,
    isFixedRate: product.isFixedRate,
    hasDefaulted: false,
    // Calculate maturity quarter
    // Duration represents quarters AFTER disbursement, so we don't count the disbursement quarter
    // For a 12-quarter loan starting at Q4, maturity is Q4 + 12 = Q16
    // The last payment will be at Q15, and the loan will be fully repaid by Q16
    maturityYear: year + Math.floor((quarter + durata) / 4),
    maturityQuarter: (quarter + durata) % 4
  };
  
  // For French loans, calculate quarterly payment
  if (productType === 'french' || productType === 'amortizing') {
    const quarterlyRate = getInterestRate(product, assumptions) / 4;
    const totalQuarters = durata; // Already in quarters
    const gracePeriodQuarters = gracePeriod; // Already in quarters
    
    vintage.quarterlyPayment = calculateQuarterlyPayment(
      volume,
      quarterlyRate,
      totalQuarters,
      gracePeriodQuarters
    );
    
    // Initialize amortization schedule
    vintage.amortizationSchedule = [];
  }
  
  return vintage;
};

/**
 * Create all vintages for a product based on volume schedule
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} volumes10Y - 10-year volume array
 * @returns {Array} Array of vintage objects
 */
export const createVintages = (product, assumptions, volumes10Y) => {
  const vintages = [];
  
  for (let year = 0; year < volumes10Y.length; year++) {
    if (volumes10Y[year] > 0) {
      const quarterlyDist = assumptions.quarterlyAllocation;
      
      // Create 4 quarterly vintages for each year
      for (let quarter = 0; quarter < 4; quarter++) {
        const quarterVolume = volumes10Y[year] * (quarterlyDist[quarter] / 100);
        
        if (quarterVolume > 0) {
          const vintage = createVintage({
            year,
            quarter,
            volume: quarterVolume,
            product,
            assumptions
          });
          
          vintages.push(vintage);
        }
      }
    }
  }
  
  return vintages;
};

/**
 * Check if a vintage is active in a given quarter
 * @param {Object} vintage - Vintage object
 * @param {number} currentQuarter - Current quarter number (absolute)
 * @returns {Object} Activity status and timing info
 */
export const getVintageActivityStatus = (vintage, currentQuarter) => {
  const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
  const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
  
  return {
    isStarted: currentQuarter >= vintageStartQuarter,
    isMatured: currentQuarter >= vintageMaturityQuarter,
    // Interest calculation rules differ by product type
    isActiveForInterest: vintage.type === 'bullet' ? 
      (currentQuarter > vintageStartQuarter && currentQuarter < vintageMaturityQuarter) :
      (currentQuarter > vintageStartQuarter && currentQuarter <= vintageMaturityQuarter),
    quartersElapsed: Math.max(0, currentQuarter - vintageStartQuarter),
    quartersToMaturity: Math.max(0, vintageMaturityQuarter - currentQuarter)
  };
};