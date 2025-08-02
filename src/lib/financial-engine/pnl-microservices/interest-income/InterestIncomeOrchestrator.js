/**
 * Interest Income Orchestrator
 * 
 * Coordina il calcolo degli interessi attivi per tutti i tipi di crediti:
 * - Performing (in bonis)
 * - Non-Performing (NPL)
 */

import { calculatePerformingInterest } from './performing/PerformingInterestCalculator.js';
import { calculateNonPerformingInterest } from './non-performing/NonPerformingInterestCalculator.js';
import { calculateDivisionInterestIncomeTotals, formatForDisplay } from './DivisionInterestIncomeTotals.js';

/**
 * Calcola gli interessi attivi totali
 * @param {Object} balanceSheetResults - Risultati completi del balance sheet
 * @param {Object} assumptions - Assumptions complete
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Object} Interessi attivi consolidati
 */
export const calculateInterestIncome = (balanceSheetResults, assumptions, quarters = 40) => {
  // console.log('💰 Interest Income Orchestrator - Start');
  
  // Initialize combined results
  const combinedResults = {
    quarterly: {
      total: new Array(quarters).fill(0),
      performing: new Array(quarters).fill(0),
      nonPerforming: new Array(quarters).fill(0),
      byDivision: initializeDivisionArrays(quarters),
      byProduct: {}
    },
    annual: {
      total: new Array(10).fill(0),
      performing: new Array(10).fill(0),
      nonPerforming: new Array(10).fill(0),
      byDivision: initializeDivisionArrays(10),
      byProduct: {}
    },
    tableData: {},
    metrics: {
      totalInterestIncome: 0,
      performingInterestIncome: 0,
      nonPerformingInterestIncome: 0,
      averageRate: 0,
      productCount: 0
    },
    // NPL reconciliation data
    reconciliation: {
      byProduct: {}
    }
  };
  
  // 1. Calculate Performing Interest
  const netPerformingAssets = balanceSheetResults.details?.netPerformingAssets;
  if (netPerformingAssets) {
    const performingResults = calculatePerformingInterest(
      netPerformingAssets,
      assumptions,
      quarters
    );
    
    // Merge performing results
    mergeResults(combinedResults, performingResults, 'performing');
  } else {
    // console.warn('No Net Performing Assets data available');
  }
  
  // 2. Calculate Non-Performing Interest (NPL)
  const nonPerformingAssets = balanceSheetResults.details?.nonPerformingAssets;
  if (nonPerformingAssets) {
    const nonPerformingResults = calculateNonPerformingInterest(
      nonPerformingAssets,
      assumptions,
      quarters
    );
    
    // Merge non-performing results
    mergeResults(combinedResults, nonPerformingResults, 'nonPerforming');
  } else {
    // console.warn('No Non-Performing Assets data available');
  }
  
  // Calculate combined totals
  for (let q = 0; q < quarters; q++) {
    combinedResults.quarterly.total[q] = 
      combinedResults.quarterly.performing[q] + 
      combinedResults.quarterly.nonPerforming[q];
  }
  
  for (let y = 0; y < 10; y++) {
    combinedResults.annual.total[y] = 
      combinedResults.annual.performing[y] + 
      combinedResults.annual.nonPerforming[y];
  }
  
  // Update metrics
  combinedResults.metrics.totalInterestIncome = 
    combinedResults.metrics.performingInterestIncome + 
    combinedResults.metrics.nonPerformingInterestIncome;
  
  // Calculate division totals using the new microservice
  const divisionTotals = {};
  
  // Get products by division from balance sheet
  const productsByDivision = {};
  Object.entries(balanceSheetResults.productResults || {}).forEach(([productKey, productData]) => {
    // Determine division from product key
    let divisionKey = '';
    if (productKey.startsWith('re')) divisionKey = 're';
    else if (productKey.startsWith('sme')) divisionKey = 'sme';
    else if (productKey.startsWith('wealth')) divisionKey = 'wealth';
    else if (productKey.startsWith('incentive')) divisionKey = 'incentive';
    else if (productKey.startsWith('digital')) divisionKey = 'digital';
    
    if (divisionKey) {
      if (!productsByDivision[divisionKey]) {
        productsByDivision[divisionKey] = {};
      }
      
      // Add product with interest income data from tableData
      const productTableData = combinedResults.tableData[productKey] || {};
      productsByDivision[divisionKey][productKey] = {
        name: productData.name || productKey,
        quarterly: {
          interestIncome: productTableData.quarterlyInterestIncome || new Array(40).fill(0),
          interestIncomePerforming: productTableData.quarterlyInterestIncomePerforming || new Array(40).fill(0),
          interestIncomeNonPerforming: productTableData.quarterlyInterestIncomeNPL || new Array(40).fill(0)
        }
      };
    }
  });
  
  // Also add NPL products from tableData (they have _NPL suffix)
  Object.entries(combinedResults.tableData || {}).forEach(([productKey, productData]) => {
    if (productKey.endsWith('_NPL')) {
      // Get base product key without _NPL
      const baseProductKey = productKey.replace('_NPL', '');
      
      // Determine division from base product key
      let divisionKey = '';
      if (baseProductKey.startsWith('re')) divisionKey = 're';
      else if (baseProductKey.startsWith('sme')) divisionKey = 'sme';
      else if (baseProductKey.startsWith('wealth')) divisionKey = 'wealth';
      else if (baseProductKey.startsWith('incentive')) divisionKey = 'incentive';
      else if (baseProductKey.startsWith('digital')) divisionKey = 'digital';
      
      if (divisionKey) {
        if (!productsByDivision[divisionKey]) {
          productsByDivision[divisionKey] = {};
        }
        
        // Add NPL product
        productsByDivision[divisionKey][productKey] = {
          name: productData.name || productKey,
          quarterly: {
            interestIncome: productData.quarterlyInterestIncome || new Array(40).fill(0),
            interestIncomePerforming: productData.quarterlyInterestIncomePerforming || new Array(40).fill(0),
            interestIncomeNonPerforming: productData.quarterlyInterestIncomeNPL || new Array(40).fill(0)
          }
        };
      }
    }
  });
  
  // Calculate totals for each division
  Object.entries(productsByDivision).forEach(([divisionKey, products]) => {
    divisionTotals[divisionKey] = calculateDivisionInterestIncomeTotals(products, divisionKey);
  });
  
  // Logging disabled
  
  // Add division totals to results
  combinedResults.divisionTotals = divisionTotals;
  
  return combinedResults;
};

/**
 * Merge results from sub-calculators
 * @private
 */
const mergeResults = (combined, source, type) => {
  // Store type-specific results
  combined.quarterly[type] = source.quarterly.total;
  combined.annual[type] = source.annual.total;
  
  // Merge by division
  Object.entries(source.quarterly.byDivision).forEach(([division, values]) => {
    values.forEach((value, q) => {
      combined.quarterly.byDivision[division][q] += value;
    });
  });
  
  Object.entries(source.annual.byDivision).forEach(([division, values]) => {
    values.forEach((value, y) => {
      combined.annual.byDivision[division][y] += value;
    });
  });
  
  // Merge by product
  Object.entries(source.quarterly.byProduct).forEach(([product, values]) => {
    if (!combined.quarterly.byProduct[product]) {
      combined.quarterly.byProduct[product] = new Array(40).fill(0);
    }
    values.forEach((value, q) => {
      combined.quarterly.byProduct[product][q] += value;
    });
  });
  
  Object.entries(source.annual.byProduct).forEach(([product, values]) => {
    if (!combined.annual.byProduct[product]) {
      combined.annual.byProduct[product] = new Array(10).fill(0);
    }
    values.forEach((value, y) => {
      combined.annual.byProduct[product][y] += value;
    });
  });
  
  // Merge table data
  Object.assign(combined.tableData, source.tableData);
  
  // Merge reconciliation data for NPL
  if (source.reconciliation && source.reconciliation.byProduct) {
    Object.assign(combined.reconciliation.byProduct, source.reconciliation.byProduct);
  }
  
  // Update metrics
  combined.metrics[`${type}InterestIncome`] = source.metrics.totalInterestIncome;
  combined.metrics.productCount += source.metrics.productCount;
};

/**
 * Inizializza gli array per divisione
 * @private
 */
const initializeDivisionArrays = (length) => {
  return {
    realEstate: new Array(length).fill(0),
    sme: new Array(length).fill(0),
    wealth: new Array(length).fill(0),
    incentive: new Array(length).fill(0),
    digitalBanking: new Array(length).fill(0),
    central: new Array(length).fill(0),
    treasury: new Array(length).fill(0)
  };
};