/**
 * Division Interest Income Totals Microservice
 * 
 * Calcola i totali di Interest Income per divisione:
 * - Totale Interest Income (performing + NPL)
 * - Subtotale Performing Assets
 * - Subtotale Non-Performing (NPL)
 * 
 * Dati trimestrali per prodotto della divisione
 */

import Decimal from 'decimal.js';

/**
 * Calcola i totali di interest income per una divisione
 * @param {Object} divisionProducts - Prodotti della divisione con dati quarterly
 * @param {string} divisionKey - Chiave della divisione (re, sme, wealth, etc.)
 * @returns {Object} Totali e subtotali per trimestre
 */
export const calculateDivisionInterestIncomeTotals = (divisionProducts, divisionKey) => {
  
  // Initialize arrays for 40 quarters
  const result = {
    // Totale generale (performing + NPL)
    total: new Array(40).fill(0),
    
    // Subtotale performing
    performingSubtotal: new Array(40).fill(0),
    
    // Subtotale NPL
    nplSubtotal: new Array(40).fill(0),
    
    // Dettaglio per prodotto
    byProduct: {
      performing: {},
      npl: {}
    }
  };
  
  // Process each product
  Object.entries(divisionProducts || {}).forEach(([productKey, productData]) => {
      hasQuarterly: !!productData.quarterly,
      hasInterestIncome: !!productData.quarterly?.interestIncome,
      hasInterestIncomePerforming: !!productData.quarterly?.interestIncomePerforming,
      hasInterestIncomeNonPerforming: !!productData.quarterly?.interestIncomeNonPerforming
    });
    
    // Get quarterly interest income data
    const quarterlyInterestIncome = productData.quarterly?.interestIncome || new Array(40).fill(0);
    const quarterlyPerforming = productData.quarterly?.interestIncomePerforming || new Array(40).fill(0);
    const quarterlyNPL = productData.quarterly?.interestIncomeNonPerforming || new Array(40).fill(0);
    
    // Check if this is an NPL product
    const isNPL = productKey.includes('_NPL');
    
    if (isNPL) {
      // NPL products contribute only to NPL subtotal
      result.byProduct.npl[productKey] = {
        name: productData.name,
        quarterlyInterestIncome: quarterlyNPL
      };
      
      // Add to NPL subtotal and total
      for (let q = 0; q < 40; q++) {
        const value = new Decimal(quarterlyNPL[q] || 0);
        result.nplSubtotal[q] = new Decimal(result.nplSubtotal[q]).plus(value).toNumber();
        result.total[q] = new Decimal(result.total[q]).plus(value).toNumber();
      }
    } else {
      // Performing products
      result.byProduct.performing[productKey] = {
        name: productData.name,
        quarterlyInterestIncomePerforming: quarterlyPerforming,
        quarterlyInterestIncomeNPL: quarterlyNPL,
        quarterlyInterestIncomeTotal: quarterlyInterestIncome
      };
      
      // Add to performing subtotal
      for (let q = 0; q < 40; q++) {
        const performingValue = new Decimal(quarterlyPerforming[q] || 0);
        const nplValue = new Decimal(quarterlyNPL[q] || 0);
        
        // Performing component goes to performing subtotal
        result.performingSubtotal[q] = new Decimal(result.performingSubtotal[q])
          .plus(performingValue)
          .toNumber();
        
        // NPL component goes to NPL subtotal
        result.nplSubtotal[q] = new Decimal(result.nplSubtotal[q])
          .plus(nplValue)
          .toNumber();
        
        // Both go to total
        result.total[q] = new Decimal(result.total[q])
          .plus(performingValue)
          .plus(nplValue)
          .toNumber();
      }
    }
  });
  
  // Log summary for first year
  
  return result;
};

/**
 * Verifica che i totali siano corretti (per debugging)
 */
export const verifyTotals = (result) => {
  const errors = [];
  
  for (let q = 0; q < 40; q++) {
    const total = new Decimal(result.total[q]);
    const performing = new Decimal(result.performingSubtotal[q]);
    const npl = new Decimal(result.nplSubtotal[q]);
    const sum = performing.plus(npl);
    
    if (!total.equals(sum)) {
      errors.push({
        quarter: q,
        total: total.toNumber(),
        performing: performing.toNumber(),
        npl: npl.toNumber(),
        sum: sum.toNumber(),
        difference: total.minus(sum).toNumber()
      });
    }
  }
  
  if (errors.length > 0) {
  } else {
  }
  
  return errors.length === 0;
};

/**
 * Formatta i risultati per il display in StandardPnL
 */
export const formatForDisplay = (result) => {
  return {
    // Array di 40 trimestri per ogni riga
    interestIncomeTotal: result.total,
    interestIncomePerforming: result.performingSubtotal,
    interestIncomeNPL: result.nplSubtotal,
    
    // Dettaglio prodotti per tooltip/espansione
    productDetails: {
      performing: Object.entries(result.byProduct.performing).map(([key, data]) => ({
        key,
        name: data.name,
        data: data.quarterlyInterestIncomeTotal
      })),
      npl: Object.entries(result.byProduct.npl).map(([key, data]) => ({
        key,
        name: data.name,
        data: data.quarterlyInterestIncome
      }))
    }
  };
};