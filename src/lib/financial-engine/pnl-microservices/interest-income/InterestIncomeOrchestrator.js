/**
 * Interest Income Orchestrator
 * 
 * Coordina il calcolo degli interessi attivi per tutti i prodotti
 * Riceve i Net Performing Assets dal Balance Sheet e calcola gli interessi
 */

import { calculateCreditInterestIncome } from './credit-products/CreditInterestIncomeCalculator.js';
import { calculateDepositInterestIncome } from './deposit-products/DepositInterestIncomeCalculator.js';
import { calculateTreasuryInterestIncome } from './treasury/TreasuryInterestIncomeCalculator.js';

/**
 * Calcola gli interessi attivi per tutti i prodotti
 * @param {Object} balanceSheetResults - Risultati completi del balance sheet
 * @param {Object} assumptions - Assumptions complete
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Object} Interessi attivi consolidati e per prodotto
 */
export const calculateInterestIncome = (balanceSheetResults, assumptions, quarters = 40) => {
  console.log('💰 Interest Income Orchestrator - Start');
  
  // Get Net Performing Assets data
  const netPerformingAssets = balanceSheetResults.details?.netPerformingAssets;
  
  if (!netPerformingAssets) {
    console.warn('No Net Performing Assets data available');
    return createEmptyResults(quarters);
  }
  
  // Step 1: Calculate credit products interest income
  const creditInterest = calculateCreditInterestIncome(
    netPerformingAssets,
    assumptions,
    quarters
  );
  
  // Step 2: Calculate deposit products interest income (if any)
  const depositInterest = calculateDepositInterestIncome(
    balanceSheetResults,
    assumptions,
    quarters
  );
  
  // Step 3: Calculate treasury interest income
  const treasuryInterest = calculateTreasuryInterestIncome(
    balanceSheetResults,
    assumptions,
    quarters
  );
  
  // Step 4: Aggregate all results
  const aggregatedResults = aggregateInterestIncome(
    creditInterest,
    depositInterest,
    treasuryInterest,
    quarters
  );
  
  console.log('💰 Interest Income Orchestrator - Complete');
  console.log('  Total Y1 Interest Income:', aggregatedResults.annual.total[0]);
  
  return aggregatedResults;
};

/**
 * Aggrega i risultati da tutti i microservizi
 * @private
 */
const aggregateInterestIncome = (credit, deposit, treasury, quarters) => {
  const results = {
    // Quarterly data
    quarterly: {
      total: new Array(quarters).fill(0),
      byDivision: {},
      byProduct: {}
    },
    // Annual data
    annual: {
      total: new Array(10).fill(0),
      byDivision: {},
      byProduct: {}
    },
    // Table-ready data for UI
    tableData: {},
    // Metrics
    metrics: {
      totalInterestIncome: 0,
      bySource: {
        credit: 0,
        deposit: 0,
        treasury: 0
      }
    }
  };
  
  // Aggregate credit interest
  aggregateSource(results, credit, 'credit', quarters);
  
  // Aggregate deposit interest
  aggregateSource(results, deposit, 'deposit', quarters);
  
  // Aggregate treasury interest
  aggregateSource(results, treasury, 'treasury', quarters);
  
  // Calculate total metrics
  results.metrics.totalInterestIncome = results.annual.total.reduce((sum, val) => sum + val, 0);
  
  return results;
};

/**
 * Aggrega i risultati da una singola fonte
 * @private
 */
const aggregateSource = (results, source, sourceName, quarters) => {
  if (!source) return;
  
  // Aggregate quarterly totals
  source.quarterly?.total?.forEach((value, q) => {
    results.quarterly.total[q] += value;
  });
  
  // Aggregate annual totals
  source.annual?.total?.forEach((value, y) => {
    results.annual.total[y] += value;
  });
  
  // Aggregate by division
  Object.entries(source.quarterly?.byDivision || {}).forEach(([divKey, divData]) => {
    if (!results.quarterly.byDivision[divKey]) {
      results.quarterly.byDivision[divKey] = new Array(quarters).fill(0);
    }
    divData.forEach((value, q) => {
      results.quarterly.byDivision[divKey][q] += value;
    });
  });
  
  Object.entries(source.annual?.byDivision || {}).forEach(([divKey, divData]) => {
    if (!results.annual.byDivision[divKey]) {
      results.annual.byDivision[divKey] = new Array(10).fill(0);
    }
    divData.forEach((value, y) => {
      results.annual.byDivision[divKey][y] += value;
    });
  });
  
  // Aggregate by product
  Object.entries(source.quarterly?.byProduct || {}).forEach(([productKey, productData]) => {
    results.quarterly.byProduct[productKey] = productData;
  });
  
  Object.entries(source.annual?.byProduct || {}).forEach(([productKey, productData]) => {
    results.annual.byProduct[productKey] = productData;
  });
  
  // Merge table data
  Object.entries(source.tableData || {}).forEach(([productKey, tableData]) => {
    results.tableData[productKey] = tableData;
  });
  
  // Update metrics
  results.metrics.bySource[sourceName] = source.metrics?.totalInterestIncome || 0;
};

/**
 * Crea risultati vuoti
 * @private
 */
const createEmptyResults = (quarters) => {
  return {
    quarterly: {
      total: new Array(quarters).fill(0),
      byDivision: {},
      byProduct: {}
    },
    annual: {
      total: new Array(10).fill(0),
      byDivision: {},
      byProduct: {}
    },
    tableData: {},
    metrics: {
      totalInterestIncome: 0,
      bySource: {
        credit: 0,
        deposit: 0,
        treasury: 0
      }
    }
  };
};