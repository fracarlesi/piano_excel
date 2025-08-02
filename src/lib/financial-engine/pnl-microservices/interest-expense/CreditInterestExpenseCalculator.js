/**
 * Credit Interest Expense Calculator
 * 
 * Calcola gli interessi passivi (FTP - Funds Transfer Pricing) sui prodotti di credito
 */

/**
 * Calcola gli interessi passivi FTP per i prodotti di credito
 * @param {Object} balanceSheetResults - Risultati del balance sheet
 * @param {Object} assumptions - Assumptions complete
 * @param {Array} years - Array degli anni
 * @returns {Object} Interessi passivi per divisione
 */
export const calculateCreditInterestExpense = (balanceSheetResults, assumptions, years) => {
  console.log('💸 Credit Interest Expense Calculator - Start');
  
  const results = {
    consolidated: new Array(10).fill(0),
    byDivision: {}
  };
  
  // Initialize division arrays
  const divisions = ['realEstate', 'sme', 'wealth', 'incentive', 'digitalBanking'];
  divisions.forEach(div => {
    results.byDivision[div] = new Array(10).fill(0);
  });
  
  // FTP rate calculation
  const ftpRate = (assumptions.euribor + (assumptions.ftpSpread || 1.5)) / 100;
  
  // Get performing assets by division
  const divisionAssets = balanceSheetResults.byDivision || {};
  
  Object.entries(divisionAssets).forEach(([divKey, divData]) => {
    const performingAssets = divData.bs?.netPerformingAssets || divData.bs?.performingAssets || new Array(10).fill(0);
    
    // Calculate FTP expense for each year
    performingAssets.forEach((assets, year) => {
      const ftpExpense = -assets * ftpRate; // Negative because it's an expense
      
      if (results.byDivision[divKey]) {
        results.byDivision[divKey][year] = ftpExpense;
      }
      
      results.consolidated[year] += ftpExpense;
    });
  });
  
  console.log('💸 Credit Interest Expense - Complete');
  console.log(`  Total FTP expense Y1: €${Math.abs(results.consolidated[0]).toFixed(2)}M`);
  
  return results;
};