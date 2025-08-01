/**
 * Volume Projector Module
 * 
 * Handles volume planning and projections for net performing assets
 * Part of Net Performing Assets microservice
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
 * Project quarterly volumes from annual volumes
 * @param {Array} annualVolumes - Annual volumes
 * @param {Array} quarterlyAllocation - Quarterly allocation percentages
 * @returns {Array} Quarterly volumes (40 quarters)
 */
export const projectQuarterlyVolumes = (annualVolumes, quarterlyAllocation = [25, 25, 25, 25]) => {
  const quarterlyVolumes = [];
  
  annualVolumes.forEach((annualVolume, year) => {
    quarterlyAllocation.forEach((allocation, quarter) => {
      quarterlyVolumes.push(annualVolume * (allocation / 100));
    });
  });
  
  return quarterlyVolumes;
};

/**
 * Validate volume configuration
 * @param {Object} product - Product configuration
 * @returns {Object} Validation result
 */
export const validateVolumeConfig = (product) => {
  const errors = [];
  
  if (!product.volumeArray && !product.volumes) {
    errors.push('No volume configuration found');
  }
  
  if (product.volumeArray && (!Array.isArray(product.volumeArray) || product.volumeArray.length !== 10)) {
    errors.push('volumeArray must be an array of 10 elements');
  }
  
  if (product.volumes && (!product.volumes.y1 || !product.volumes.y10)) {
    errors.push('volumes must have at least y1 and y10 defined');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};