/**
 * Interest Calculator Module
 * 
 * Handles all interest calculations for credit products
 * including performing loans and NPL interest
 */

import { getInterestRate, getVintageActivityStatus } from '../../balance-sheet-microservices/assets/net-performing-assets/VintageManager.js';

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
  const quarterlyRate = getInterestRate(product, assumptions) / 4;
  let performingStock = 0;
  let quarterlyInterest = 0;
  
  vintages.forEach(vintage => {
    const status = getVintageActivityStatus(vintage, currentQuarter);
    
    // Only calculate interest for active vintages
    // Interest starts from the quarter AFTER disbursement
    if (status.isActiveForInterest && vintage.outstandingPrincipal > 0) {
      performingStock += vintage.outstandingPrincipal;
    }
  });
  
  // Calculate interest on performing stock
  quarterlyInterest = performingStock * quarterlyRate;
  
  return {
    performingStock,
    quarterlyInterest
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
  let annualInterestOnPerforming = 0;
  let annualInterestOnNPL = 0;
  let totalQuarterlyPerformingStock = 0;
  
  // Process each quarter in the year
  for (let quarter = 0; quarter < 4; quarter++) {
    const currentQuarter = year * 4 + quarter;
    
    // Get NPL stock for this quarter
    const nplStock = nplStockUpdater ? nplStockUpdater(quarter) : nplStockStart;
    
    // Calculate NPL interest
    const nplInterest = calculateNPLInterest(nplStock, product, assumptions);
    annualInterestOnNPL += nplInterest;
    
    // Calculate performing loan interest
    const { performingStock, quarterlyInterest } = calculateQuarterlyInterest(
      vintages,
      currentQuarter,
      product,
      assumptions
    );
    
    annualInterestOnPerforming += quarterlyInterest;
    totalQuarterlyPerformingStock += performingStock;
  }
  
  // Calculate average performing stock for the year
  const averagePerformingStock = totalQuarterlyPerformingStock / 4;
  
  return {
    interestOnPerforming: annualInterestOnPerforming,
    interestOnNPL: annualInterestOnNPL,
    totalInterest: annualInterestOnPerforming + annualInterestOnNPL,
    averagePerformingStock
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