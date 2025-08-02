/**
 * Interest Income Orchestrator
 * 
 * Coordina il calcolo degli interessi attivi per tutti i prodotti
 * Riceve i Net Performing Assets dal Balance Sheet e calcola gli interessi
 */

import { calculateCreditInterestIncome } from './credit-products/CreditInterestIncomeCalculator.js';

/**
 * Calcola gli interessi attivi per tutti i prodotti
 * @param {Object} balanceSheetResults - Risultati completi del balance sheet
 * @param {Object} assumptions - Assumptions complete
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Object} Interessi attivi consolidati e per prodotto
 */
export const calculateInterestIncome = (balanceSheetResults, assumptions, quarters = 40) => {
  // console.log('💰 Interest Income Orchestrator - Start');
  
  // Get Net Performing Assets data
  const netPerformingAssets = balanceSheetResults.details?.netPerformingAssets;
  
  if (!netPerformingAssets) {
    console.warn('No Net Performing Assets data available');
    return createEmptyResults(quarters);
  }
  
  // Debug: Check NPA structure
  // console.log('  NPA structure:', {
  //   hasBalanceSheetLine: !!netPerformingAssets.balanceSheetLine,
  //   hasByProduct: !!netPerformingAssets.byProduct,
  //   productKeys: Object.keys(netPerformingAssets.byProduct || {})
  // });
  
  // Calculate credit products interest income
  const creditInterest = calculateCreditInterestIncome(
    netPerformingAssets,
    assumptions,
    quarters
  );
  
  // console.log('💰 Interest Income Orchestrator - Complete');
  // console.log('  Total Y1 Interest Income:', creditInterest.annual.total[0]);
  
  // For now, we only have credit products
  // Future: add other product types as needed
  return creditInterest;
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
      totalInterestIncome: 0
    }
  };
};