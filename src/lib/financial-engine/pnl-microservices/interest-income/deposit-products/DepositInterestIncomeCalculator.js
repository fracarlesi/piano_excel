/**
 * Deposit Interest Income Calculator
 * 
 * Calcola gli interessi attivi sui prodotti di deposito (se presenti)
 * Alcuni prodotti digitali potrebbero generare interessi attivi
 */

/**
 * Calcola gli interessi attivi per i prodotti di deposito
 * @param {Object} balanceSheetResults - Risultati del balance sheet
 * @param {Object} assumptions - Assumptions complete
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Interessi attivi per prodotti di deposito
 */
export const calculateDepositInterestIncome = (balanceSheetResults, assumptions, quarters = 40) => {
  console.log('  💳 Deposit Interest Income Calculator - Start');
  
  const results = {
    quarterly: {
      total: new Array(quarters).fill(0),
      byDivision: {
        digitalBanking: new Array(quarters).fill(0)
      },
      byProduct: {}
    },
    annual: {
      total: new Array(10).fill(0),
      byDivision: {
        digitalBanking: new Array(10).fill(0)
      },
      byProduct: {}
    },
    tableData: {},
    metrics: {
      totalInterestIncome: 0
    }
  };
  
  // For now, deposit products don't generate interest income
  // This is a placeholder for future implementation if needed
  
  console.log('  💳 Deposit Interest Income - Complete (no active income)');
  
  return results;
};