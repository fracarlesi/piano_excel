/**
 * Default Calculator Module - LLP Support
 * 
 * DEPRECATED: Main default calculations moved to GBVDefaultedOrchestrator
 * This module only provides utility functions for LLP calculations
 */

// Import default calculations from centralized microservice
import { 
  calculateGBVDefaulted,
  getQuarterlyDefaultAmount,
  getDefaultsForQuarter 
} from '../../balance-sheet-microservices/assets/gbv-defaulted/GBVDefaultedOrchestrator.js';

/**
 * Get quarterly defaults for LLP calculation
 * Uses the centralized GBV Defaulted microservice
 * @param {Object} divisionProducts - Products organized by division
 * @param {Object} assumptions - Global assumptions
 * @param {Object} totalAssetsResults - Results from TotalAssetsOrchestrator containing vintages
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} Default results for LLP calculation
 */
export const getDefaultsForLLP = (divisionProducts, assumptions, totalAssetsResults, quarters = 40) => {
  // Use centralized calculation
  return calculateGBVDefaulted(divisionProducts, assumptions, totalAssetsResults, quarters);
};

/**
 * Get quarterly default amount for a specific product (utility for LLP)
 * @param {Object} gbvDefaultedResults - Results from GBV Defaulted microservice
 * @param {string} productKey - Product identifier
 * @param {number} quarter - Quarter index
 * @returns {number} Default amount for that quarter
 */
export const getQuarterlyDefaultForProduct = (gbvDefaultedResults, productKey, quarter) => {
  return getQuarterlyDefaultAmount(gbvDefaultedResults, productKey, quarter);
};

/**
 * Get all defaults for a specific quarter (utility for LLP)
 * @param {Object} gbvDefaultedResults - Results from GBV Defaulted microservice
 * @param {number} quarter - Quarter index
 * @returns {Array} Array of default events
 */
export const getQuarterlyDefaults = (gbvDefaultedResults, quarter) => {
  return getDefaultsForQuarter(gbvDefaultedResults, quarter);
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