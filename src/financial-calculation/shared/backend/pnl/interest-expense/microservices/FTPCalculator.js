/**
 * FTP Calculator Microservice
 * 
 * Calcola il Funds Transfer Pricing per singolo prodotto di credito
 * Formula: (FTP Rate prodotto + Euribor) * Asset Totali (Performing + NPL)
 */

import Decimal from 'decimal.js';

/**
 * Calcola FTP expense per un singolo prodotto - QUARTERLY
 * @param {Object} product - Dati del prodotto (performing + NPL)
 * @param {Object} productAssumptions - Assumptions del prodotto
 * @param {number} euribor - Tasso Euribor
 * @param {number} quarter - Trimestre di calcolo (0-39)
 * @returns {Object} FTP expense details
 */
export const calculateProductFTPQuarterly = (product, productAssumptions, euribor, quarter) => {
  const d = (val) => new Decimal(val || 0);
  
  // Get FTP rate for the product (default 1.5% if not specified)
  const ftpRate = productAssumptions.ftpRate || 1.5;
  const totalRate = (ftpRate + euribor) / 100 / 4; // Divide by 4 for quarterly rate
  
  // Get assets from PREVIOUS quarter (loans disbursed at end of quarter)
  // FTP is charged from the next quarter after disbursement
  const performingAssets = quarter > 0 ? d(product.performingAssets?.[quarter - 1] || 0) : d(0);
  const nplAssets = quarter > 0 ? d(product.nplStock?.[quarter - 1] || 0) : d(0);
  const totalAssets = performingAssets.plus(nplAssets);
  
  // Calculate FTP expense (negative because it's a cost)
  const ftpExpense = totalAssets.mul(totalRate).neg();
  
  return {
    productName: productAssumptions.name,
    ftpRate: ftpRate,
    euribor: euribor,
    totalRate: totalRate * 100 * 4, // Annualized rate for display
    performingAssets: performingAssets.toNumber(),
    nplAssets: nplAssets.toNumber(),
    totalAssets: totalAssets.toNumber(),
    ftpExpense: ftpExpense.toNumber()
  };
};

/**
 * Calcola FTP per tutti i trimestri di un prodotto
 * @param {Object} product - Dati del prodotto (performing + NPL)
 * @param {Object} productAssumptions - Assumptions del prodotto
 * @param {number} euribor - Tasso Euribor
 * @returns {Object} FTP expense details per quarter
 */
export const calculateProductFTP = (product, productAssumptions, euribor) => {
  const quarterlyResults = [];
  
  // Debug logging for first quarter - removed
  
  // Calculate for all 40 quarters
  for (let q = 0; q < 40; q++) {
    const quarterResult = calculateProductFTPQuarterly(product, productAssumptions, euribor, q);
    quarterlyResults.push(quarterResult.ftpExpense);
  }
  
  // Log first year results with stock details
  // Log first year results if there's activity - removed
  
  return {
    productName: productAssumptions.name,
    quarterlyFTP: quarterlyResults,
    ftpRate: productAssumptions.ftpRate || 1.5
  };
};

/**
 * Calcola FTP per tutti i prodotti di una divisione
 * @param {Object} divisionData - Dati della divisione
 * @param {Object} divisionAssumptions - Assumptions della divisione
 * @param {number} euribor - Tasso Euribor
 * @returns {Object} FTP results by product with quarterly detail
 */
export const calculateDivisionFTP = (divisionData, divisionAssumptions, euribor) => {
  const results = {
    quarterlyTotal: new Array(40).fill(0),
    byProduct: {}
  };
  
  // Process each credit product
  const creditProducts = divisionAssumptions.creditProducts || {};
  
  // Process each product in the division
  Object.entries(divisionData.creditProducts || {}).forEach(([prodKey, prodData]) => {
    // Find matching product assumptions - creditProducts is now an object
    const productAssumptions = creditProducts[prodKey] || 
      Object.values(creditProducts).find(p => 
        p.key === prodKey ||
        p.name.toLowerCase().replace(/\s+/g, '_') === prodKey ||
        prodKey.includes(p.name.toLowerCase().replace(/\s+/g, '_'))
      ) || { name: prodKey, ftpRate: 1.5 };
    
    // Debug: log found assumptions - removed
    
    // Calculate FTP for all quarters
    const productFTPResult = calculateProductFTP(prodData, productAssumptions, euribor);
    
    results.byProduct[prodKey] = {
      name: productAssumptions.name,
      quarterlyFTP: productFTPResult.quarterlyFTP,
      ftpRate: productFTPResult.ftpRate
    };
    
    // Add to division totals
    productFTPResult.quarterlyFTP.forEach((ftpExpense, q) => {
      results.quarterlyTotal[q] += ftpExpense;
    });
  });
  
  return results;
};