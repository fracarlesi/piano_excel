/**
 * Volume Commission Calculator Module
 * 
 * Calculates commission income based on new loan volumes
 * Part of Commission Income P&L microservice
 */

/**
 * Calculate commission income based on new volumes
 * @param {Array} volumes - Array of yearly volumes
 * @param {number} commissionRate - Commission rate percentage
 * @returns {Array} Array of yearly commission income
 */
export const calculateCommissionIncome = (volumes, commissionRate) => {
  return volumes.map(volume => volume * commissionRate / 100);
};

/**
 * Calculate quarterly commission income
 * @param {Array} quarterlyVolumes - Quarterly volumes (40 quarters)
 * @param {number} commissionRate - Commission rate percentage
 * @returns {Array} Quarterly commission income
 */
export const calculateQuarterlyCommissions = (quarterlyVolumes, commissionRate) => {
  return quarterlyVolumes.map(volume => volume * commissionRate / 100);
};

/**
 * Calculate commission income by product type
 * @param {Object} productVolumes - Volumes by product type
 * @param {Object} commissionRates - Commission rates by product type
 * @returns {Object} Commission income breakdown
 */
export const calculateCommissionsByProductType = (productVolumes, commissionRates) => {
  const commissionBreakdown = {};
  let totalCommissions = 0;
  
  Object.entries(productVolumes).forEach(([productType, volumes]) => {
    const rate = commissionRates[productType] || 0;
    const commissions = calculateCommissionIncome(volumes, rate);
    
    commissionBreakdown[productType] = {
      volumes: volumes,
      rate: rate,
      commissions: commissions,
      total: commissions.reduce((sum, val) => sum + val, 0)
    };
    
    totalCommissions += commissionBreakdown[productType].total;
  });
  
  return {
    breakdown: commissionBreakdown,
    totalCommissions: totalCommissions
  };
};

/**
 * Calculate deferred commission income (for multi-year recognition)
 * @param {Array} volumes - New volumes by year
 * @param {number} commissionRate - Commission rate
 * @param {number} recognitionYears - Years over which to recognize income
 * @returns {Array} Recognized commission income by year
 */
export const calculateDeferredCommissions = (volumes, commissionRate, recognitionYears = 1) => {
  const totalYears = volumes.length;
  const recognizedIncome = new Array(totalYears).fill(0);
  
  volumes.forEach((volume, year) => {
    const totalCommission = volume * commissionRate / 100;
    const annualRecognition = totalCommission / recognitionYears;
    
    for (let i = 0; i < recognitionYears && (year + i) < totalYears; i++) {
      recognizedIncome[year + i] += annualRecognition;
    }
  });
  
  return recognizedIncome;
};

/**
 * Format commission data for P&L display
 * @param {Object} commissionResults - Commission calculation results
 * @param {number} year - Year to display
 * @returns {Object} Formatted commission data
 */
export const formatCommissionForPnL = (commissionResults, year) => {
  return {
    mainLine: {
      label: 'Commission Income',
      value: commissionResults[year] || 0,
      unit: '€M'
    },
    formula: `New Volumes × Commission Rate`,
    variance: year > 0 ? {
      absolute: (commissionResults[year] || 0) - (commissionResults[year - 1] || 0),
      percentage: commissionResults[year - 1] > 0 
        ? ((commissionResults[year] - commissionResults[year - 1]) / commissionResults[year - 1]) * 100
        : 0
    } : null
  };
};