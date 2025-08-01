/**
 * NPL Orchestrator
 * 
 * ORCHESTRATORE PRINCIPALE che coordina i 3 microservizi NPL autonomi:
 * 1. NPLNBVCalculator - Stima NBV NPL
 * 2. NPLRecoveryCalculator - Calcolo recuperi 
 * 3. NPLPresentValueCalculator - Valore attuale flussi
 * 
 * Routing intelligente per tipo di prodotto NPL
 */

import { calculateNPLNBV, formatNBVForBalanceSheet } from './NPLNBVCalculator.js';
import { calculateNPLRecovery, formatRecoveryForReporting } from './NPLRecoveryCalculator.js';
import { 
  calculateNPLPresentValue, 
  formatPresentValueForBalanceSheet,
  calculateCoverageRatio,
  calculateStressScenario 
} from './NPLPresentValueCalculator.js';
import {
  calculateNPLStockUnwinding,
  formatUnwindingForBalanceSheet,
  projectFutureUnwinding
} from './NPLStockUnwindingCalculator.js';

/**
 * Calcola Non-Performing Assets per tutti i prodotti creditizi
 * @param {Object} divisions - Dati divisioni con prodotti
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Object} Risultati Non-Performing Assets completi
 */
export const calculateNonPerformingAssets = (divisions, assumptions, quarters = 40) => {
  const results = {
    // RIGA PRINCIPALE BALANCE SHEET
    balanceSheetLine: {
      name: 'Non-Performing Assets',
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
    byProduct: {},
    
    // AGGREGATED METRICS
    consolidatedMetrics: {
      totalNBV: 0,
      totalNetRealizableValue: 0,
      totalImpairmentLoss: 0,
      averageRecoveryRate: 0,
      averageCoverageRatio: 0
    },
    
    // RISK METRICS
    riskMetrics: {
      peakNPLQuarter: 0,
      peakNPLValue: 0,
      concentrationByProductType: {},
      stressTestResults: null
    }
  };

  let consolidatedNBVResults = null;
  let consolidatedRecoveryResults = null;
  let consolidatedPVResults = null;
  
  // Processa ogni divisione
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionResults = {
      quarterly: new Array(quarters).fill(0),
      products: {},
      divisionMetrics: {
        totalNBV: 0,
        totalNetRealizableValue: 0,
        averageRecoveryRate: 0
      }
    };

    // Handle both structures: division.products or direct product objects  
    const productsToProcess = division.products || division;
    
    // Processa solo prodotti creditizi
    if (productsToProcess && typeof productsToProcess === 'object') {
      Object.entries(productsToProcess).forEach(([productKey, product]) => {
        // Use original product configuration if available
        const productConfig = product.originalProduct || product;
        
        if (isCreditProduct(productConfig)) {
          // ROUTING AI MICROSERVIZI NPL
          const productResults = routeToNPLMicroservices(
            productConfig, 
            assumptions, 
            quarters,
            productKey
          );
          
          if (productResults && productResults.netRealizableValue.length === quarters) {
            // Store risultati prodotto
            divisionResults.products[productKey] = {
              quarterly: productResults.netRealizableValue,
              productType: getProductType(productConfig),
              productName: productConfig.name,
              nplMetrics: productResults.metrics,
              cohortDetails: productResults.cohortDetails
            };
            
            results.byProduct[productKey] = {
              quarterly: productResults.netRealizableValue,
              productType: getProductType(productConfig),
              productName: productConfig.name,
              fullResults: productResults
            };

            // Aggrega a tutti i livelli
            productResults.netRealizableValue.forEach((value, q) => {
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
            
            // Aggregate division metrics
            divisionResults.divisionMetrics.totalNBV += productResults.metrics.totalNBV;
            divisionResults.divisionMetrics.totalNetRealizableValue += productResults.metrics.totalNetRealizableValue;
          }
        }
      });
    }

    // Calculate division average recovery rate
    if (divisionResults.divisionMetrics.totalNBV > 0) {
      divisionResults.divisionMetrics.averageRecoveryRate = 
        (divisionResults.divisionMetrics.totalNetRealizableValue / divisionResults.divisionMetrics.totalNBV) * 100;
    }

    results.byDivision[divisionKey] = divisionResults;
  });
  
  // Calculate consolidated metrics
  results.consolidatedMetrics = calculateConsolidatedMetrics(results);
  
  // Calculate risk metrics
  results.riskMetrics = calculateRiskMetrics(results, quarters);
  
  return results;
};

/**
 * ROUTING INTELLIGENTE ai microservizi NPL
 * @param {Object} product - Configurazione prodotto
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri
 * @param {string} productKey - Chiave prodotto per logging
 * @returns {Object} NPL results completi
 */
const routeToNPLMicroservices = (product, assumptions, quarters, productKey) => {
  try {
    // Estrai vintages mock per il prodotto (in realtà verranno da creditCalculator)
    const vintages = createMockVintages(product, assumptions);
    
    // STEP 1: Calcola NBV NPL
    const nblResults = calculateNPLNBV(product, vintages, assumptions, quarters);
    
    // STEP 2: Calcola Recovery su NPL
    const recoveryResults = calculateNPLRecovery(
      nblResults.nplCohorts, 
      product, 
      assumptions, 
      quarters
    );
    
    // STEP 3: Calcola Present Value
    const presentValueResults = calculateNPLPresentValue(
      recoveryResults, 
      nblResults, 
      assumptions, 
      quarters
    );
    
    // STEP 4: Calcola Stock Unwinding
    const unwindingResults = calculateNPLStockUnwinding(
      nblResults,
      recoveryResults,
      assumptions,
      quarters
    );
    
    // Return consolidated results
    return {
      netRealizableValue: presentValueResults.quarterlyNetRealizableValue,
      nbvGross: nblResults.quarterlyNBV,
      recoveryFlows: recoveryResults.quarterlyRecoveryFlows,
      impairmentLoss: presentValueResults.quarterlyImpairmentLoss,
      residualNPLStock: unwindingResults.quarterlyResidualStock,
      
      // Detailed results per ulteriori analisi
      nblResults: nblResults,
      recoveryResults: recoveryResults,
      presentValueResults: presentValueResults,
      unwindingResults: unwindingResults,
      
      // Aggregated metrics
      metrics: {
        totalNBV: presentValueResults.metrics.totalNBV,
        totalNetRealizableValue: presentValueResults.metrics.totalPresentValue,
        totalImpairment: presentValueResults.metrics.totalImpairment,
        averageRecoveryRate: presentValueResults.metrics.averageRecoveryRate,
        peakNPL: nblResults.metrics.peakNBV,
        totalRecovered: unwindingResults.unwindingMetrics.totalRecovered,
        residualStockAtEnd: unwindingResults.unwindingMetrics.residualStockAtEnd,
        averageRecoverySpeed: unwindingResults.unwindingMetrics.averageRecoverySpeed
      },
      
      // Cohort details per risk analysis
      cohortDetails: presentValueResults.cohortPresentValues
    };
    
  } catch (error) {
    console.error(`Error calculating NPL for product ${productKey}:`, error);
    return {
      netRealizableValue: new Array(quarters).fill(0),
      nbvGross: new Array(quarters).fill(0),
      recoveryFlows: new Array(quarters).fill(0),
      impairmentLoss: new Array(quarters).fill(0),
      metrics: {
        totalNBV: 0,
        totalNetRealizableValue: 0,
        totalImpairment: 0,
        averageRecoveryRate: 0,
        peakNPL: { quarter: 0, value: 0 }
      },
      cohortDetails: []
    };
  }
};

/**
 * Create mock vintages per testing (in realtà verranno da creditCalculator)
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {Array} Mock vintages
 */
const createMockVintages = (product, assumptions) => {
  // Simplified mock - in realtà verranno passati i vintages reali
  const mockVintages = [];
  
  for (let year = 0; year < 5; year++) {
    const volume = product.volumeArray?.[year] || 0;
    if (volume > 0) {
      mockVintages.push({
        id: `vintage_${year}`,
        originationYear: year,
        originalAmount: volume,
        outstandingPrincipal: volume * (1 - year * 0.1), // Mock amortization
        maturityYear: year + (product.totalDuration || 5),
        productType: product.type || 'french'
      });
    }
  }
  
  return mockVintages;
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
  
  // Default fallback
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
 * Calcola metriche consolidate
 * @param {Object} results - Results aggregati
 * @returns {Object} Consolidated metrics
 */
const calculateConsolidatedMetrics = (results) => {
  let totalNBV = 0;
  let totalNetRealizableValue = 0;
  let totalImpairmentLoss = 0;
  let productCount = 0;
  
  // Aggregate from all products
  Object.values(results.byProduct).forEach(product => {
    if (product.fullResults && product.fullResults.metrics) {
      totalNBV += product.fullResults.metrics.totalNBV || 0;
      totalNetRealizableValue += product.fullResults.metrics.totalNetRealizableValue || 0;
      totalImpairmentLoss += product.fullResults.metrics.totalImpairment || 0;
      productCount++;
    }
  });
  
  const averageRecoveryRate = totalNBV > 0 
    ? (totalNetRealizableValue / totalNBV) * 100 
    : 0;
  
  // Calculate average coverage ratio across quarters
  const finalQuarter = results.balanceSheetLine.quarterly.length - 1;
  const averageCoverageRatio = totalNBV > 0 
    ? (results.balanceSheetLine.quarterly[finalQuarter] / totalNBV) * 100 
    : 0;
  
  return {
    totalNBV,
    totalNetRealizableValue,
    totalImpairmentLoss,
    averageRecoveryRate,
    averageCoverageRatio,
    productCount
  };
};

/**
 * Calcola metriche di rischio
 * @param {Object} results - Results aggregati
 * @param {number} quarters - Numero trimestri
 * @returns {Object} Risk metrics
 */
const calculateRiskMetrics = (results, quarters) => {
  // Find peak NPL quarter and value
  let peakNPLQuarter = 0;
  let peakNPLValue = 0;
  
  results.balanceSheetLine.quarterly.forEach((value, quarter) => {
    if (value > peakNPLValue) {
      peakNPLValue = value;
      peakNPLQuarter = quarter;
    }
  });
  
  // Calculate concentration by product type
  const concentrationByProductType = {};
  const totalFinalNPL = results.balanceSheetLine.quarterly[quarters - 1];
  
  Object.entries(results.byProductType).forEach(([productType, values]) => {
    const finalValue = values[quarters - 1];
    concentrationByProductType[productType] = totalFinalNPL > 0 
      ? (finalValue / totalFinalNPL) * 100 
      : 0;
  });
  
  return {
    peakNPLQuarter,
    peakNPLValue,
    concentrationByProductType,
    volatilityIndex: calculateNPLVolatility(results.balanceSheetLine.quarterly)
  };
};

/**
 * Calcola indice volatilità NPL
 * @param {Array} quarterlyValues - Valori trimestrali NPL
 * @returns {number} Volatility index
 */
const calculateNPLVolatility = (quarterlyValues) => {
  if (quarterlyValues.length < 2) return 0;
  
  let totalVariation = 0;
  let validPeriods = 0;
  
  for (let i = 1; i < quarterlyValues.length; i++) {
    const currentValue = quarterlyValues[i];
    const previousValue = quarterlyValues[i - 1];
    
    if (previousValue > 0) {
      const variation = Math.abs((currentValue - previousValue) / previousValue);
      totalVariation += variation;
      validPeriods++;
    }
  }
  
  return validPeriods > 0 ? (totalVariation / validPeriods) * 100 : 0;
};

/**
 * Get dati formattati per Balance Sheet
 * @param {Object} results - Risultati NPL completi
 * @param {number} quarter - Indice trimestre
 * @returns {Object} Dati formattati per Balance Sheet
 */
export const getBalanceSheetData = (results, quarter) => {
  const total = results.balanceSheetLine.quarterly[quarter];
  
  return {
    // Riga principale
    mainLine: {
      label: 'Non-Performing Assets',
      value: total,
      unit: '€M'
    },
    
    // Sub-linee per dettaglio
    subLines: [
      {
        label: 'o/w Bridge Loans NPL',
        value: results.byProductType.bridgeLoans[quarter],
        percentage: total > 0 ? (results.byProductType.bridgeLoans[quarter] / total) * 100 : 0
      },
      {
        label: 'o/w French Loans NPL (No Grace)',
        value: results.byProductType.frenchNoGrace[quarter],
        percentage: total > 0 ? (results.byProductType.frenchNoGrace[quarter] / total) * 100 : 0
      },
      {
        label: 'o/w French Loans NPL (With Grace)',
        value: results.byProductType.frenchWithGrace[quarter],
        percentage: total > 0 ? (results.byProductType.frenchWithGrace[quarter] / total) * 100 : 0
      }
    ],
    
    // Risk indicators
    riskIndicators: {
      coverageRatio: results.consolidatedMetrics.averageCoverageRatio,
      concentrationRisk: Math.max(...Object.values(results.riskMetrics.concentrationByProductType || {})),
      volatilityIndex: results.riskMetrics.volatilityIndex
    }
  };
};

/**
 * Run stress test scenario su NPL portfolio
 * @param {Object} results - NPL results base case
 * @param {Object} stressParams - Stress parameters
 * @returns {Object} Stressed NPL results
 */
export const runNPLStressTest = (results, stressParams) => {
  const stressedResults = { ...results };
  
  // Apply stress to each product
  Object.entries(results.byProduct).forEach(([productKey, product]) => {
    if (product.fullResults && product.fullResults.presentValueResults) {
      const stressedPV = calculateStressScenario(
        product.fullResults.presentValueResults,
        stressParams
      );
      
      // Update quarterly values
      stressedPV.quarterlyNetRealizableValue.forEach((value, quarter) => {
        const reduction = product.quarterly[quarter] - value;
        stressedResults.balanceSheetLine.quarterly[quarter] -= reduction;
        
        // Update by product type
        const productType = product.productType;
        if (stressedResults.byProductType[productType]) {
          stressedResults.byProductType[productType][quarter] -= reduction;
        }
      });
    }
  });
  
  // Recalculate stressed metrics
  stressedResults.consolidatedMetrics = calculateConsolidatedMetrics(stressedResults);
  stressedResults.riskMetrics.stressTestResults = {
    baseCase: results.consolidatedMetrics.totalNetRealizableValue,
    stressedCase: stressedResults.consolidatedMetrics.totalNetRealizableValue,
    additionalImpairment: results.consolidatedMetrics.totalNetRealizableValue - 
                          stressedResults.consolidatedMetrics.totalNetRealizableValue,
    stressParams: stressParams
  };
  
  return stressedResults;
};