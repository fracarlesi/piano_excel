/**
 * FTP Calculator Separated Microservice
 * 
 * Calcola il Funds Transfer Pricing separatamente per Bonis e NPL
 * Formula: (FTP Rate prodotto + Euribor) * Asset (Performing o NPL)
 * 
 * Questo modulo separa il calcolo FTP per fornire maggiore trasparenza
 * sul costo del funding per le diverse tipologie di asset
 */

import Decimal from 'decimal.js';

/**
 * Calcola FTP expense separato per Bonis e NPL - QUARTERLY
 * @param {Object} product - Dati del prodotto (performing + NPL)
 * @param {Object} productAssumptions - Assumptions del prodotto
 * @param {number} euribor - Tasso Euribor
 * @param {number} quarter - Trimestre di calcolo (0-39)
 * @returns {Object} FTP expense details separati
 */
export const calculateProductFTPQuarterlySeparated = (product, productAssumptions, euribor, quarter) => {
  const d = (val) => new Decimal(val || 0);
  
  // Get FTP rate for the product (default 1.5% if not specified)
  const ftpRate = productAssumptions.ftpRate || 1.5;
  const totalRate = (ftpRate + euribor) / 100 / 4; // Divide by 4 for quarterly rate
  
  // Get assets from PREVIOUS quarter (loans disbursed at end of quarter)
  // FTP is charged from the next quarter after disbursement
  const performingAssets = quarter > 0 ? d(product.performingAssets?.[quarter - 1] || 0) : d(0);
  const nplAssets = quarter > 0 ? d(product.nplStock?.[quarter - 1] || 0) : d(0);
  
  // Calculate FTP expense separately (negative because it's a cost)
  const ftpExpenseBonis = performingAssets.mul(totalRate).neg();
  const ftpExpenseNPL = nplAssets.mul(totalRate).neg();
  const ftpExpenseTotal = ftpExpenseBonis.plus(ftpExpenseNPL);
  
  return {
    productName: productAssumptions.name,
    ftpRate: ftpRate,
    euribor: euribor,
    totalRate: totalRate * 100 * 4, // Annualized rate for display
    // Bonis details
    performingAssets: performingAssets.toNumber(),
    ftpExpenseBonis: ftpExpenseBonis.toNumber(),
    // NPL details
    nplAssets: nplAssets.toNumber(),
    ftpExpenseNPL: ftpExpenseNPL.toNumber(),
    // Total
    totalAssets: performingAssets.plus(nplAssets).toNumber(),
    ftpExpenseTotal: ftpExpenseTotal.toNumber()
  };
};

/**
 * Calcola FTP separato per tutti i trimestri di un prodotto
 * @param {Object} product - Dati del prodotto (performing + NPL)
 * @param {Object} productAssumptions - Assumptions del prodotto
 * @param {number} euribor - Tasso Euribor
 * @returns {Object} FTP expense details per quarter separati
 */
export const calculateProductFTPSeparated = (product, productAssumptions, euribor) => {
  const quarterlyResultsBonis = [];
  const quarterlyResultsNPL = [];
  const quarterlyResultsTotal = [];
  const quarterlyDetails = [];
  
  // Debug logging for first quarter
    hasPerformingAssets: !!product.performingAssets,
    hasNplStock: !!product.nplStock,
    performingLength: product.performingAssets?.length || 0,
    nplLength: product.nplStock?.length || 0,
    ftpRate: productAssumptions.ftpRate,
    firstQuarterPerforming: product.performingAssets?.[0] || 0,
    firstQuarterNPL: product.nplStock?.[0] || 0
  });
  
  // Calculate for all 40 quarters
  for (let q = 0; q < 40; q++) {
    const quarterResult = calculateProductFTPQuarterlySeparated(product, productAssumptions, euribor, q);
    quarterlyResultsBonis.push(quarterResult.ftpExpenseBonis);
    quarterlyResultsNPL.push(quarterResult.ftpExpenseNPL);
    quarterlyResultsTotal.push(quarterResult.ftpExpenseTotal);
    quarterlyDetails.push(quarterResult);
  }
  
  // Log first year results with separated details
  const hasActivity = product.performingAssets?.some(v => v > 0) || product.nplStock?.some(v => v > 0);
  if (hasActivity) {
      ftpRate: productAssumptions.ftpRate || 1.5,
      euribor: euribor,
      totalRate: ((productAssumptions.ftpRate || 1.5) + euribor) + '%',
      Q1: {
        bonisStock: product.performingAssets?.[0] || 0,
        nplStock: product.nplStock?.[0] || 0,
        ftpBonis: quarterlyResultsBonis[0]?.toFixed(2),
        ftpNPL: quarterlyResultsNPL[0]?.toFixed(2),
        ftpTotal: quarterlyResultsTotal[0]?.toFixed(2)
      },
      Q2: {
        bonisStock: product.performingAssets?.[1] || 0,
        nplStock: product.nplStock?.[1] || 0,
        ftpBonis: quarterlyResultsBonis[1]?.toFixed(2),
        ftpNPL: quarterlyResultsNPL[1]?.toFixed(2),
        ftpTotal: quarterlyResultsTotal[1]?.toFixed(2)
      }
    });
  }
  
  return {
    productName: productAssumptions.name,
    quarterlyFTPBonis: quarterlyResultsBonis,
    quarterlyFTPNPL: quarterlyResultsNPL,
    quarterlyFTPTotal: quarterlyResultsTotal,
    quarterlyDetails: quarterlyDetails,
    ftpRate: productAssumptions.ftpRate || 1.5
  };
};

/**
 * Calcola FTP separato per tutti i prodotti di una divisione
 * @param {Object} divisionData - Dati della divisione
 * @param {Object} divisionAssumptions - Assumptions della divisione
 * @param {number} euribor - Tasso Euribor
 * @returns {Object} FTP results by product with quarterly detail separati
 */
export const calculateDivisionFTPSeparated = (divisionData, divisionAssumptions, euribor) => {
  
  const results = {
    quarterlyTotalBonis: new Array(40).fill(0),
    quarterlyTotalNPL: new Array(40).fill(0),
    quarterlyTotal: new Array(40).fill(0),
    byProduct: {}
  };
  
  // Process each credit product
  const creditProducts = divisionAssumptions.creditProducts || {};
  
  // Process each product in the division
  Object.entries(divisionData.creditProducts || {}).forEach(([prodKey, prodData]) => {
    // Find matching product assumptions
    const productAssumptions = creditProducts[prodKey] || 
      Object.values(creditProducts).find(p => 
        p.key === prodKey ||
        p.name.toLowerCase().replace(/\s+/g, '_') === prodKey ||
        prodKey.includes(p.name.toLowerCase().replace(/\s+/g, '_'))
      ) || { name: prodKey, ftpRate: 1.5 };
    
      foundAssumptions: !!productAssumptions,
      ftpRate: productAssumptions.ftpRate || 1.5
    });
    
    // Calculate FTP separated for all quarters
    const productFTPResult = calculateProductFTPSeparated(prodData, productAssumptions, euribor);
    
    results.byProduct[prodKey] = {
      name: productAssumptions.name,
      quarterlyFTPBonis: productFTPResult.quarterlyFTPBonis,
      quarterlyFTPNPL: productFTPResult.quarterlyFTPNPL,
      quarterlyFTPTotal: productFTPResult.quarterlyFTPTotal,
      quarterlyDetails: productFTPResult.quarterlyDetails,
      ftpRate: productFTPResult.ftpRate
    };
    
    // Add to division totals
    productFTPResult.quarterlyFTPBonis.forEach((ftpExpense, q) => {
      results.quarterlyTotalBonis[q] += ftpExpense;
    });
    
    productFTPResult.quarterlyFTPNPL.forEach((ftpExpense, q) => {
      results.quarterlyTotalNPL[q] += ftpExpense;
    });
    
    productFTPResult.quarterlyFTPTotal.forEach((ftpExpense, q) => {
      results.quarterlyTotal[q] += ftpExpense;
    });
  });
  
  return results;
};