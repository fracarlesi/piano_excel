/**
 * FTP Division Aggregator Microservice
 * 
 * Aggrega i valori FTP dei singoli prodotti per creare totali divisione corretti
 * Assicura che i totali FTP per divisione siano la somma esatta dei FTP prodotto
 */

import Decimal from 'decimal.js';

/**
 * Aggrega FTP dai prodotti individuali per creare totali divisione accurati
 * @param {Object} divisionFTPResults - Risultati FTP per divisione da FTPCalculator
 * @returns {Object} Risultati FTP con totali divisione corretti
 */
export const aggregateDivisionFTP = (divisionFTPResults) => {
  
  const aggregatedResults = {};
  
  // Process each division
  Object.entries(divisionFTPResults).forEach(([divKey, divData]) => {
    
    // Initialize quarterly totals for this division
    const quarterlyTotal = new Array(40).fill(0).map(() => new Decimal(0));
    
    // Sum all product FTP values for each quarter
    Object.entries(divData.byProduct || {}).forEach(([prodKey, prodData]) => {
      // Add each quarter's FTP to the division total
      (prodData.quarterlyFTP || []).forEach((ftpValue, quarter) => {
        if (quarter < 40) {
          quarterlyTotal[quarter] = quarterlyTotal[quarter].plus(ftpValue || 0);
        }
      });
    });
    
    // Convert back to regular numbers for output
    const quarterlyTotalNumbers = quarterlyTotal.map(val => val.toNumber());
    
    // Log aggregation results for first year - removed
    
    // Store aggregated results
    aggregatedResults[divKey] = {
      ...divData,
      quarterlyTotal: quarterlyTotalNumbers,
      aggregationMethod: 'product-sum' // Mark as aggregated from products
    };
  });
  
  return aggregatedResults;
};

/**
 * Validates division FTP totals match sum of products
 * @param {Object} divisionFTPResults - FTP results by division
 * @returns {Object} Validation results with any discrepancies
 */
export const validateDivisionTotals = (divisionFTPResults) => {
  const validationResults = {
    isValid: true,
    discrepancies: {}
  };
  
  Object.entries(divisionFTPResults).forEach(([divKey, divData]) => {
    const originalTotal = divData.quarterlyTotal || [];
    
    // Calculate sum from products
    const productSum = new Array(40).fill(0).map(() => new Decimal(0));
    Object.values(divData.byProduct || {}).forEach(prodData => {
      (prodData.quarterlyFTP || []).forEach((val, q) => {
        if (q < 40) productSum[q] = productSum[q].plus(val || 0);
      });
    });
    
    // Check for discrepancies
    const discrepancies = [];
    originalTotal.forEach((originalVal, q) => {
      const sumVal = productSum[q].toNumber();
      const diff = Math.abs(originalVal - sumVal);
      
      if (diff > 0.01) { // Allow small rounding differences
        discrepancies.push({
          quarter: q,
          original: originalVal,
          productSum: sumVal,
          difference: diff
        });
      }
    });
    
    if (discrepancies.length > 0) {
      validationResults.isValid = false;
      validationResults.discrepancies[divKey] = discrepancies;
    }
  });
  
  return validationResults;
};