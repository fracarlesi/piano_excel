/**
 * Interest Calculator Module
 * 
 * Handles all interest calculations for credit products
 * including performing loans and NPL interest
 */

// Utility functions moved here from obsolete VintageManager.js

/**
 * Calculate quarterly interest for a single vintage
 * @param {Object} vintage - Vintage object
 * @param {number} quarterlyRate - Quarterly interest rate
 * @returns {number} Interest amount for the quarter
 */
export const calculateVintageQuarterlyInterest = (vintage, quarterlyRate) => {
  return vintage.outstandingPrincipal * quarterlyRate;
};

/**
 * Calculate interest on NPL stock (NBV basis)
 * NPLs generate interest on Net Book Value, not gross amount
 * @param {number} nplNBV - NPL Net Book Value (after LLP)
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {number} Quarterly interest on NPLs
 */
export const calculateNPLInterest = (nplNBV, product, assumptions) => {
  // IMPORTANT: Interest is calculated on NBV (net of provisions)
  const productRate = getInterestRate(product, assumptions);
  const quarterlyProductRate = productRate / 4;
  return nplNBV * quarterlyProductRate;
};

/**
 * Calculate total quarterly interest for all vintages
 * @param {Array} vintages - Array of vintage objects
 * @param {number} currentQuarter - Current quarter (absolute)
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {Object} Interest breakdown
 */
export const calculateQuarterlyInterest = (vintages, currentQuarter, product, assumptions) => {
  // PLACEHOLDER: Implementazione temporaneamente disabilitata
  // Questa funzione verrà implementata nella fase successiva (dopo recovery)
  return {
    performingStock: 0,
    quarterlyInterest: 0
  };
};

/**
 * Calculate annual interest income
 * @param {Array} vintages - Array of vintage objects
 * @param {number} year - Year index
 * @param {number} nplStockStart - NPL stock at start of year
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Function} nplStockUpdater - Function to get NPL stock for each quarter
 * @returns {Object} Annual interest breakdown
 */
export const calculateAnnualInterest = (
  vintages, 
  year, 
  nplStockStart,
  product, 
  assumptions,
  nplStockUpdater
) => {
  // PLACEHOLDER: Implementazione temporaneamente disabilitata
  // Questa funzione verrà implementata nella fase successiva (dopo recovery)
  return {
    annualInterestOnPerforming: 0,
    annualInterestOnNPL: 0,
    totalQuarterlyPerformingStock: 0,
    averagePerformingStock: 0,
    averageNPLStock: 0
  };
};

/**
 * Calculate FTP (Funds Transfer Pricing) expense
 * @param {number} averageStock - Average outstanding stock
 * @param {Object} assumptions - Global assumptions
 * @returns {number} FTP expense (negative value)
 */
export const calculateFTPExpense = (averageStock, assumptions) => {
  const ftpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
  return -averageStock * ftpRate;
};

// Funzioni utility rimosse - verranno implementate quando necessarie nelle fasi successive