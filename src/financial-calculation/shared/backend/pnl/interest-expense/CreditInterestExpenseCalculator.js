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
  
  // Debug: mostra un esempio di dati per la prima divisione
  const firstDivKey = Object.keys(creditResults?.byDivision || {})[0];
  if (firstDivKey && creditResults?.byDivision[firstDivKey]) {
    const divData = creditResults.byDivision[firstDivKey];
    
    const firstProdKey = Object.keys(divData.creditProducts || {})[0];
    if (firstProdKey) {
      const prodData = divData.creditProducts[firstProdKey];
    }
  }
  
  // Use orchestrator to calculate FTP with new microservices (separated version)
  const ftpResults = orchestrateFTPCalculationSeparated(creditResults, assumptions);
  
  // Format results for P&L display (separated version)
  const formattedResults = formatFTPForPnLSeparated(ftpResults);
  
  // Return with additional details for P&L display
  return {
    consolidated: formattedResults.consolidated,
    byDivision: formattedResults.byDivision,
    productDetails: formattedResults.productDetails,
    rawResults: ftpResults // Keep raw results for detailed analysis
  };
};