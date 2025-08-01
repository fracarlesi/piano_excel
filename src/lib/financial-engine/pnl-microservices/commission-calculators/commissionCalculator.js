/**
 * Commission Product Calculator Module
 * 
 * Handles pure commission-based products (no lending/deposits)
 */

/**
 * Calculate commission-only product results
 * 
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Commission product calculation results
 */
export const calculateCommissionProduct = (product, assumptions, years) => {
  // Calculate volumes
  const volumes10Y = years.map(i => {
    let yearVolume;
    
    if (product.volumeArray && Array.isArray(product.volumeArray) && product.volumeArray.length === 10) {
      yearVolume = product.volumeArray[i];
    } else if (product.volumes) {
      const yearKey = `y${i + 1}`;
      if (product.volumes[yearKey] !== undefined) {
        yearVolume = product.volumes[yearKey];
      } else {
        const y1 = product.volumes.y1;
        const y10 = product.volumes.y10;
        yearVolume = y1 + ((y10 - y1) * i / 9);
      }
    } else {
      yearVolume = 0;
    }
    
    return yearVolume;
  });
  
  // Commission income based on volume and rate
  const commissionRate = product.commissionRate / 100;
  const commissionIncome = volumes10Y.map(volume => volume * commissionRate);
  
  // No balance sheet impact for pure commission products
  const zeros = years.map(() => 0);
  
  return {
    performingAssets: zeros,
    nonPerformingAssets: zeros,
    interestIncome: zeros,
    interestExpense: zeros,
    commissionIncome: commissionIncome,
    llp: zeros,
    rwa: zeros,
    volumes: volumes10Y,
    // Special fields for commission products
    isCommissionOnly: true,
    requiresBaseProduct: product.requiresBaseProduct
  };
};