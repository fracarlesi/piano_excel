/**
 * Credit Interest Expense Calculator
 * 
 * Calcola gli interessi passivi (FTP - Funds Transfer Pricing) sui prodotti di credito
 * Utilizza i microservizi per calcolo modulare e dettagliato per prodotto
 */

import { orchestrateFTPCalculation, formatFTPForPnL } from './microservices/InterestExpenseOrchestrator.js';
import { orchestrateFTPCalculationSeparated, formatFTPForPnLSeparated } from './microservices/InterestExpenseOrchestratorSeparated.js';

/**
 * Calcola gli interessi passivi FTP per i prodotti di credito
 * @param {Object} creditResults - Risultati del credit calculator (include performing e NPL)
 * @param {Object} assumptions - Assumptions complete
 * @returns {Object} Interessi passivi per divisione e prodotto con dettaglio trimestrale
 */
export const calculateCreditInterestExpense = (creditResults, assumptions) => {
  console.log('💸 Credit Interest Expense Calculator - Start');
  console.log('📥 Input creditResults:', {
    hasCreditResults: !!creditResults,
    creditResultsKeys: Object.keys(creditResults || {}),
    hasByDivision: !!creditResults?.byDivision,
    divisionKeys: Object.keys(creditResults?.byDivision || {})
  });
  
  // Debug: mostra un esempio di dati per la prima divisione
  const firstDivKey = Object.keys(creditResults?.byDivision || {})[0];
  if (firstDivKey && creditResults?.byDivision[firstDivKey]) {
    const divData = creditResults.byDivision[firstDivKey];
    console.log(`📊 Sample division data (${firstDivKey}):`, {
      hasCreditProducts: !!divData.creditProducts,
      productKeys: Object.keys(divData.creditProducts || {}),
      firstProduct: Object.keys(divData.creditProducts || {})[0]
    });
    
    const firstProdKey = Object.keys(divData.creditProducts || {})[0];
    if (firstProdKey) {
      const prodData = divData.creditProducts[firstProdKey];
      console.log(`  📦 Sample product data (${firstProdKey}):`, {
        hasPerformingAssets: !!prodData.performingAssets,
        performingLength: prodData.performingAssets?.length,
        firstQPerforming: prodData.performingAssets?.[0],
        hasNplStock: !!prodData.nplStock,
        nplLength: prodData.nplStock?.length,
        firstQNpl: prodData.nplStock?.[0]
      });
    }
  }
  
  // Use orchestrator to calculate FTP with new microservices (separated version)
  const ftpResults = orchestrateFTPCalculationSeparated(creditResults, assumptions);
  
  // Format results for P&L display (separated version)
  const formattedResults = formatFTPForPnLSeparated(ftpResults);
  
  console.log('💸 Credit Interest Expense - Complete');
  console.log(`  Total FTP expense Y1: €${Math.abs(formattedResults.consolidated[0]).toFixed(2)}M`);
  console.log('💸 FTP Results Summary:', {
    consolidatedY0: formattedResults.consolidated[0]?.toFixed(2),
    consolidatedY1: formattedResults.consolidated[1]?.toFixed(2),
    divisionCount: Object.keys(formattedResults.byDivision || {}).length,
    productCount: Object.keys(formattedResults.productDetails || {}).length
  });
  
  // Return with additional details for P&L display
  return {
    consolidated: formattedResults.consolidated,
    byDivision: formattedResults.byDivision,
    productDetails: formattedResults.productDetails,
    rawResults: ftpResults // Keep raw results for detailed analysis
  };
};