/**
 * Volume Calculator Module
 * 
 * Handles volume calculations and distributions for credit products
 */

/**
 * Calculate volumes for each year based on product configuration
 * @param {Object} product - Product configuration
 * @param {Array} years - Array of year indices
 * @returns {Array} Array of yearly volumes
 */
export const calculateVolumes = (product, years) => {
  return years.map(i => {
    let yearVolume;
    
    // Check for volumeArray first (direct array specification)
    if (product.volumeArray && Array.isArray(product.volumeArray) && product.volumeArray.length === 10) {
      yearVolume = product.volumeArray[i];
    } 
    // Then check for volumes object with y1-y10 structure
    else if (product.volumes) {
      const yearKey = `y${i + 1}`;
      if (product.volumes[yearKey] !== undefined) {
        yearVolume = product.volumes[yearKey];
      } else {
        // Linear interpolation between y1 and y10
        const y1 = product.volumes.y1 || 0;
        const y10 = product.volumes.y10 || 0;
        yearVolume = y1 + ((y10 - y1) * i / 9);
      }
    } 
    // Default to 0 if no volume configuration
    else {
      yearVolume = 0;
    }
    
    return yearVolume;
  });
};

/**
 * Calculate number of loans based on volume and average loan size
 * @param {Array} volumes - Array of yearly volumes
 * @param {number} avgLoanSize - Average loan size
 * @returns {Array} Array of loan counts
 */
export const calculateNumberOfLoans = (volumes, avgLoanSize) => {
  return volumes.map(volume => 
    avgLoanSize > 0 ? Math.round(volume / avgLoanSize) : 0
  );
};

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