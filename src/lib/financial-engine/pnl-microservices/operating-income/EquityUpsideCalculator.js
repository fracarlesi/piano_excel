/**
 * Equity Upside Calculator Module
 * 
 * Calculates equity upside income from investment exits
 * Part of Operating Income P&L microservice
 */

/**
 * Calculate equity upside income if applicable
 * @param {Array} performingAssets - Array of performing assets by year
 * @param {number} equityUpside - Equity upside percentage
 * @param {Array} years - Array of year indices
 * @returns {Array} Array of equity upside income
 */
export const calculateEquityUpsideIncome = (performingAssets, equityUpside, years) => {
  return years.map((_, i) => {
    if (equityUpside && equityUpside > 0) {
      // Assume exits happen after 3 years with 20% of loans exiting
      const exitingLoans = i >= 3 ? performingAssets[i-3] * 0.2 : 0;
      return exitingLoans * (equityUpside / 100);
    }
    return 0;
  });
};

/**
 * Calculate equity upside with custom exit profile
 * @param {Array} performingAssets - Performing assets by year
 * @param {number} equityUpside - Equity upside percentage
 * @param {Object} exitProfile - Exit timing and percentages
 * @returns {Array} Equity upside income by year
 */
export const calculateCustomEquityUpside = (performingAssets, equityUpside, exitProfile) => {
  const defaultProfile = {
    startYear: 3,
    exitSchedule: [
      { year: 3, percentage: 10 },
      { year: 4, percentage: 20 },
      { year: 5, percentage: 30 },
      { year: 6, percentage: 25 },
      { year: 7, percentage: 15 }
    ]
  };
  
  const profile = exitProfile || defaultProfile;
  const income = new Array(10).fill(0);
  
  profile.exitSchedule.forEach(exit => {
    if (exit.year < income.length && exit.year >= profile.startYear) {
      const originYear = exit.year - profile.startYear;
      if (originYear >= 0 && originYear < performingAssets.length) {
        const exitingAmount = performingAssets[originYear] * (exit.percentage / 100);
        income[exit.year] = exitingAmount * (equityUpside / 100);
      }
    }
  });
  
  return income;
};

/**
 * Calculate equity upside by vintage
 * @param {Array} vintages - Active vintages
 * @param {number} currentYear - Current year
 * @param {number} equityUpside - Equity upside percentage
 * @param {number} holdingPeriod - Years before exit
 * @returns {number} Equity upside for current year
 */
export const calculateVintageEquityUpside = (vintages, currentYear, equityUpside, holdingPeriod = 3) => {
  if (!equityUpside || equityUpside <= 0) return 0;
  
  let totalUpside = 0;
  
  vintages.forEach(vintage => {
    const vintageAge = currentYear - vintage.originationYear;
    
    // Check if vintage is ready for exit
    if (vintageAge === holdingPeriod && vintage.hasEquityComponent) {
      const exitValue = vintage.outstandingPrincipal * (equityUpside / 100);
      totalUpside += exitValue;
    }
  });
  
  return totalUpside;
};

/**
 * Calculate IRR-based equity upside
 * @param {Object} investment - Investment details
 * @param {number} exitMultiple - Exit multiple (e.g., 2.5x)
 * @param {number} holdingPeriod - Years until exit
 * @returns {Object} Equity upside analysis
 */
export const calculateIRRBasedUpside = (investment, exitMultiple, holdingPeriod) => {
  const initialInvestment = investment.amount;
  const exitValue = initialInvestment * exitMultiple;
  const gain = exitValue - initialInvestment;
  
  // Simple IRR approximation
  const irr = Math.pow(exitMultiple, 1 / holdingPeriod) - 1;
  
  return {
    initialInvestment,
    exitValue,
    gain,
    irr: irr * 100, // as percentage
    holdingPeriod
  };
};

/**
 * Format equity upside for P&L display
 * @param {Array} equityUpsideIncome - Equity upside by year
 * @param {number} year - Year to display
 * @returns {Object} Formatted data
 */
export const formatEquityUpsideForPnL = (equityUpsideIncome, year) => {
  const currentIncome = equityUpsideIncome[year] || 0;
  const previousIncome = year > 0 ? (equityUpsideIncome[year - 1] || 0) : 0;
  
  return {
    mainLine: {
      label: 'Equity Upside Income',
      value: currentIncome,
      unit: '€M'
    },
    details: {
      description: 'Gains from equity participations in lending',
      recognition: 'Realized upon exit'
    },
    variance: {
      absolute: currentIncome - previousIncome,
      percentage: previousIncome > 0 
        ? ((currentIncome - previousIncome) / previousIncome) * 100
        : 0
    }
  };
};