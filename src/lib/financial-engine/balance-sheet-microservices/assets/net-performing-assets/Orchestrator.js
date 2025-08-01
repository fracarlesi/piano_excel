/**
 * Net Performing Assets Orchestrator
 * 
 * ORCHESTRATORE SEMPLICE che coordina i 3 microservizi autonomi
 * Routing intelligente per tipo di prodotto
 */

import { calculateBridgeLoansNetPerformingAssets } from './BridgeLoans.js';
import { calculateFrenchNoGraceNetPerformingAssets } from './FrenchNoGrace.js';
import { calculateFrenchWithGraceNetPerformingAssets } from './FrenchWithGrace.js';

/**
 * Calcola Net Performing Assets per tutti i prodotti creditizi
 * @param {Object} divisions - Dati divisioni con prodotti
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Object} Risultati Net Performing Assets per Balance Sheet
 */
export const calculateNetPerformingAssets = (divisions, assumptions, quarters = 40) => {
  const results = {
    // RIGA PRINCIPALE BALANCE SHEET
    balanceSheetLine: {
      name: 'Net Performing Assets',
      quarterly: new Array(quarters).fill(0)
    },
    
    // BREAKDOWN PER TIPO PRODOTTO
    byProductType: {
      bridgeLoans: new Array(quarters).fill(0),
      frenchNoGrace: new Array(quarters).fill(0),
      frenchWithGrace: new Array(quarters).fill(0)
    },
    
    // BREAKDOWN DETTAGLIATO
    byDivision: {},
    byProduct: {}
  };

  // Processa ogni divisione
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionResults = {
      quarterly: new Array(quarters).fill(0),
      products: {}
    };

    // Handle both structures: division.products or direct product objects  
    // When called from index.js, divisions structure is: { divisionKey: { productKey: productData } }
    // When called elsewhere, it might be: { divisionKey: { products: { productKey: productData } } }
    const productsToProcess = division.products || division;
    
    // Processa solo prodotti creditizi
    if (productsToProcess && typeof productsToProcess === 'object') {
      Object.entries(productsToProcess).forEach(([productKey, product]) => {
        // Use original product configuration if available (from index.js structure)
        const productConfig = product.originalProduct || product;
        
        if (isCreditProduct(productConfig)) {
          // ROUTING AI MICROSERVIZI AUTONOMI
          const productResults = routeToMicroservice(productConfig, assumptions, quarters);
          
          if (productResults && productResults.length === quarters) {
            // Store risultati prodotto
            divisionResults.products[productKey] = {
              quarterly: productResults,
              productType: getProductType(productConfig),
              productName: productConfig.name
            };
            
            results.byProduct[productKey] = {
              quarterly: productResults,
              productType: getProductType(productConfig),
              productName: productConfig.name
            };

            // Aggrega a tutti i livelli
            productResults.forEach((value, q) => {
              // Divisione
              divisionResults.quarterly[q] += value;
              
              // Consolidato
              results.balanceSheetLine.quarterly[q] += value;
              
              // Per tipo prodotto
              const productType = getProductType(productConfig);
              if (results.byProductType[productType]) {
                results.byProductType[productType][q] += value;
              }
            });
          }
        }
      });
    }

    results.byDivision[divisionKey] = divisionResults;
  });

  return results;
};

/**
 * ROUTING INTELLIGENTE ai microservizi autonomi
 * @param {Object} product - Configurazione prodotto
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri
 * @returns {Array} Outstanding principal per 40 trimestri
 */
const routeToMicroservice = (product, assumptions, quarters) => {
  const productType = getProductType(product);
  
  try {
    switch (productType) {
      case 'bridgeLoans':
        return calculateBridgeLoansNetPerformingAssets(product, assumptions, quarters);
        
      case 'frenchNoGrace':
        return calculateFrenchNoGraceNetPerformingAssets(product, assumptions, quarters);
        
      case 'frenchWithGrace':
        return calculateFrenchWithGraceNetPerformingAssets(product, assumptions, quarters);
        
      default:
        console.warn(`Unknown product type: ${productType} for product ${product.name}. Using bridge default.`);
        return calculateBridgeLoansNetPerformingAssets(product, assumptions, quarters);
    }
  } catch (error) {
    console.error(`Error calculating net performing assets for product ${product.name}:`, error);
    return new Array(quarters).fill(0); // Safe fallback
  }
};

/**
 * Determina tipo prodotto per routing
 * @param {Object} product - Configurazione prodotto
 * @returns {string} Tipo prodotto per routing
 */
const getProductType = (product) => {
  // Bridge/Bullet loans
  if (product.productType === 'bridge' || product.type === 'bullet') {
    return 'bridgeLoans';
  }
  
  // French loans
  if (product.type === 'french') {
    if (product.gracePeriod > 0) {
      return 'frenchWithGrace';
    } else {
      return 'frenchNoGrace';
    }
  }
  
  // Default fallback per prodotti non specificati
  return 'bridgeLoans';
};

/**
 * Verifica se è un prodotto creditizio
 * @param {Object} product - Configurazione prodotto
 * @returns {boolean} True se è prodotto creditizio
 */
const isCreditProduct = (product) => {
  return product.productType === 'Credit' || 
         product.productType === 'bridge' ||
         product.type === 'french' ||
         product.type === 'bullet' ||
         !product.productType; // Default assume credit se non specificato
};

/**
 * Get dati formattati per Balance Sheet
 * @param {Object} results - Risultati Net Performing Assets
 * @param {number} quarter - Indice trimestre
 * @returns {Object} Dati formattati per Balance Sheet
 */
export const getBalanceSheetData = (results, quarter) => {
  const total = results.balanceSheetLine.quarterly[quarter];
  
  return {
    // Riga principale
    mainLine: {
      label: 'Net Performing Assets',
      value: total,
      unit: '€M'
    },
    
    // Sub-linee per dettaglio
    subLines: [
      {
        label: 'o/w Bridge Loans',
        value: results.byProductType.bridgeLoans[quarter],
        percentage: total > 0 ? (results.byProductType.bridgeLoans[quarter] / total) * 100 : 0
      },
      {
        label: 'o/w French Loans (No Grace)',
        value: results.byProductType.frenchNoGrace[quarter],
        percentage: total > 0 ? (results.byProductType.frenchNoGrace[quarter] / total) * 100 : 0
      },
      {
        label: 'o/w French Loans (With Grace)',
        value: results.byProductType.frenchWithGrace[quarter],
        percentage: total > 0 ? (results.byProductType.frenchWithGrace[quarter] / total) * 100 : 0
      }
    ]
  };
};