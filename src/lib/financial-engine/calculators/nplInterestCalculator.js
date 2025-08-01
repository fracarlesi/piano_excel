/**
 * NPL Interest Calculator Module
 * 
 * Dedicated microservice for calculating interest on Non-Performing Loans
 * Interest is calculated on Net Book Value (NBV) not on gross amount
 */

/**
 * NPL Interest Registry to track NBV by cohort
 * This ensures we calculate interest on the correct net value
 */
class NPLInterestRegistry {
  constructor() {
    this.cohorts = new Map();
  }

  /**
   * Register a new NPL cohort with its NBV
   * @param {string} cohortId - Unique identifier for the cohort
   * @param {Object} cohortData - Cohort details including NBV
   */
  registerCohort(cohortId, cohortData) {
    this.cohorts.set(cohortId, {
      creationQuarter: cohortData.creationQuarter,
      grossAmount: cohortData.grossAmount,
      nbvAmount: cohortData.nbvAmount,
      productRate: cohortData.productRate,
      recovered: false
    });
  }

  /**
   * Mark a cohort as recovered
   * @param {string} cohortId - Cohort identifier
   */
  markRecovered(cohortId) {
    const cohort = this.cohorts.get(cohortId);
    if (cohort) {
      cohort.recovered = true;
    }
  }

  /**
   * Get total NBV for interest calculation
   * @returns {number} Total NBV of active NPL cohorts
   */
  getTotalNBV() {
    let totalNBV = 0;
    this.cohorts.forEach(cohort => {
      if (!cohort.recovered) {
        totalNBV += cohort.nbvAmount;
      }
    });
    return totalNBV;
  }

  /**
   * Get detailed cohort information
   * @returns {Array} Array of cohort details
   */
  getCohortDetails() {
    const details = [];
    this.cohorts.forEach((cohort, id) => {
      details.push({
        id,
        ...cohort
      });
    });
    return details;
  }
}

/**
 * Calculate quarterly interest on NPL stock
 * @param {number} nplNBV - Net Book Value of NPL stock
 * @param {number} quarterlyRate - Quarterly interest rate
 * @returns {number} Quarterly interest amount
 */
export const calculateQuarterlyNPLInterest = (nplNBV, quarterlyRate) => {
  // Interest is calculated on NBV, not gross amount
  return nplNBV * quarterlyRate;
};

/**
 * Calculate annual NPL interest with quarterly granularity
 * @param {Array} quarterlyNBVs - Array of quarterly NBV values
 * @param {number} annualRate - Annual interest rate
 * @returns {Object} Annual NPL interest breakdown
 */
export const calculateAnnualNPLInterest = (quarterlyNBVs, annualRate) => {
  const quarterlyRate = annualRate / 4;
  let totalInterest = 0;
  const quarterlyInterests = [];

  quarterlyNBVs.forEach((nbv, quarter) => {
    const interest = calculateQuarterlyNPLInterest(nbv, quarterlyRate);
    quarterlyInterests.push(interest);
    totalInterest += interest;
  });

  return {
    totalInterest,
    quarterlyInterests,
    averageNBV: quarterlyNBVs.reduce((sum, nbv) => sum + nbv, 0) / 4,
    effectiveRate: quarterlyNBVs.some(nbv => nbv > 0) 
      ? (totalInterest / (quarterlyNBVs.reduce((sum, nbv) => sum + nbv, 0) / 4))
      : 0
  };
};

/**
 * Track NPL cohorts and calculate interest correctly
 * @param {Array} nplCohorts - Array of NPL cohorts with NBV
 * @param {number} currentQuarter - Current quarter for calculation
 * @param {number} productRate - Annual interest rate for the product
 * @returns {Object} NPL interest calculation results
 */
export const calculateNPLInterestByCohort = (nplCohorts, currentQuarter, productRate) => {
  const quarterlyRate = productRate / 4;
  let totalNBV = 0;
  let totalInterest = 0;
  const activeCohorts = [];

  nplCohorts.forEach(cohort => {
    // Only include cohorts that exist and haven't been recovered yet
    if (cohort.quarter <= currentQuarter && 
        (!cohort.recoveryQuarter || cohort.recoveryQuarter > currentQuarter)) {
      
      // Use NBV (amount field in cohort structure represents NBV)
      const cohortNBV = cohort.amount || 0;
      const cohortInterest = cohortNBV * quarterlyRate;
      
      totalNBV += cohortNBV;
      totalInterest += cohortInterest;
      
      activeCohorts.push({
        quarter: cohort.quarter,
        nbv: cohortNBV,
        interest: cohortInterest,
        type: cohort.type
      });
    }
  });

  return {
    totalNBV,
    totalInterest,
    quarterlyRate,
    activeCohortCount: activeCohorts.length,
    cohortDetails: activeCohorts
  };
};

/**
 * Verify NPL interest calculation logic
 * @param {Object} params - Calculation parameters
 * @returns {Object} Verification results
 */
export const verifyNPLInterestCalculation = ({
  grossNPL,
  nbvNPL,
  llpAmount,
  calculatedInterest,
  interestRate
}) => {
  // Verify that NBV + LLP = Gross NPL
  const impliedNBV = grossNPL - llpAmount;
  const nbvCheck = Math.abs(impliedNBV - nbvNPL) < 0.01;

  // Verify interest is calculated on NBV not gross
  const expectedInterest = nbvNPL * interestRate;
  const interestCheck = Math.abs(expectedInterest - calculatedInterest) < 0.01;

  return {
    nbvCheck,
    interestCheck,
    impliedNBV,
    expectedInterest,
    actualInterest: calculatedInterest,
    message: nbvCheck && interestCheck 
      ? '✅ NPL interest correctly calculated on NBV'
      : '❌ NPL interest calculation error'
  };
};

// Export the registry class for use in main calculator
export { NPLInterestRegistry };