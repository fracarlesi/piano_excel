/**
 * Recovery-Default Orchestrator
 * 
 * ORCHESTRATORE che coordina i microservizi di recupero per prodotto:
 * - Calcola i tempi di recupero della garanzia secondo le assunzioni del prodotto
 * - Considera LTV, collateral haircut, recovery costs
 * - Gestisce garanzie pubbliche con tempi specifici
 * - Assicura che il recupero non superi il GBV defaulted
 */

import { calculateCollateralRecovery } from './CollateralRecoveryCalculator.js';
import { calculateStateGuaranteeRecovery } from './StateGuaranteeRecoveryCalculator.js';
import { calculateRecoveryTiming } from './RecoveryTimingCalculator.js';

/**
 * Calcola recovery proiettato per tutti i prodotti creditizi
 * @param {Object} divisions - Dati divisioni con prodotti e defaults
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @param {Object} totalAssetsResults - Results from TotalAssetsOrchestrator with GBV defaulted data
 * @returns {Object} Risultati recovery completi
 */
export const calculateRecoveryDefault = (divisions, assumptions, quarters = 40, totalAssetsResults = null) => {
  // Logging disabled
  
  const results = {
    // RIGA PRINCIPALE BALANCE SHEET
    balanceSheetLine: {
      name: 'Recovery on Defaulted Assets',
      quarterly: new Array(quarters).fill(0)
    },
    
    // BREAKDOWN PER TIPO RECOVERY
    byRecoveryType: {
      collateralRecovery: new Array(quarters).fill(0),
      stateGuaranteeRecovery: new Array(quarters).fill(0),
      totalRecovery: new Array(quarters).fill(0)
    },
    
    // BREAKDOWN DETTAGLIATO
    byDivision: {},
    byProduct: {},
    
    // AGGREGATED METRICS
    consolidatedMetrics: {
      totalGBVDefaulted: 0,
      totalExpectedRecovery: 0,
      totalCollateralRecovery: 0,
      totalStateGuaranteeRecovery: 0,
      averageRecoveryRate: 0,
      averageRecoveryTime: 0
    },
    
    // RECOVERY TIMING METRICS
    timingMetrics: {
      peakRecoveryQuarter: 0,
      peakRecoveryValue: 0,
      recoveryConcentration: {},
      recoverySchedule: []
    }
  };

  // Processa ogni divisione
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionResults = {
      quarterly: new Array(quarters).fill(0),
      products: {},
      divisionMetrics: {
        totalGBVDefaulted: 0,
        totalExpectedRecovery: 0,
        averageRecoveryRate: 0
      }
    };

    // Handle both structures: division.products or direct product objects  
    const productsToProcess = division.products || division;
    
    if (productsToProcess && typeof productsToProcess === 'object') {
      Object.entries(productsToProcess).forEach(([productKey, product]) => {
        // Use original product configuration if available
        const productConfig = product.originalProduct || product;
        
        if (isCreditProduct(productConfig)) {
          // Extract default flows from credit calculator or vintages
          const defaultFlows = extractDefaultFlows(product, quarters, productKey, totalAssetsResults);
          
          if (defaultFlows && defaultFlows.length > 0) {
            // CALCOLA RECOVERY PER QUESTO PRODOTTO
            const productRecoveryResults = calculateProductRecovery(
              productConfig,
              defaultFlows,
              assumptions,
              quarters
            );
            
            // Store risultati prodotto
            divisionResults.products[productKey] = {
              quarterly: productRecoveryResults.quarterlyRecovery,
              productType: getProductType(productConfig),
              productName: productConfig.name,
              recoveryMetrics: productRecoveryResults.metrics,
              recoverySchedule: productRecoveryResults.recoverySchedule
            };
            
            results.byProduct[productKey] = {
              quarterly: productRecoveryResults.quarterlyRecovery,
              productType: getProductType(productConfig),
              productName: productConfig.name,
              fullResults: productRecoveryResults
            };

            // Aggrega a tutti i livelli
            productRecoveryResults.quarterlyRecovery.forEach((value, q) => {
              // Divisione
              divisionResults.quarterly[q] += value;
              
              // Consolidato
              results.balanceSheetLine.quarterly[q] += value;
              
              // Per tipo recovery
              results.byRecoveryType.totalRecovery[q] += value;
            });
            
            // Aggrega breakdown per tipo
            productRecoveryResults.quarterlyCollateralRecovery.forEach((value, q) => {
              results.byRecoveryType.collateralRecovery[q] += value;
            });
            
            productRecoveryResults.quarterlyStateGuaranteeRecovery.forEach((value, q) => {
              results.byRecoveryType.stateGuaranteeRecovery[q] += value;
            });
            
            // Aggregate division metrics
            divisionResults.divisionMetrics.totalGBVDefaulted += productRecoveryResults.metrics.totalGBVDefaulted;
            divisionResults.divisionMetrics.totalExpectedRecovery += productRecoveryResults.metrics.totalExpectedRecovery;
          }
        }
      });
    }

    // Calculate division average recovery rate
    if (divisionResults.divisionMetrics.totalGBVDefaulted > 0) {
      divisionResults.divisionMetrics.averageRecoveryRate = 
        (divisionResults.divisionMetrics.totalExpectedRecovery / divisionResults.divisionMetrics.totalGBVDefaulted) * 100;
    }

    results.byDivision[divisionKey] = divisionResults;
  });
  
  // Calculate consolidated metrics
  results.consolidatedMetrics = calculateConsolidatedRecoveryMetrics(results);
  
  // Calculate timing metrics
  results.timingMetrics = calculateRecoveryTimingMetrics(results, quarters);
  
  // Debug final results
  
  return results;
};

/**
 * Calcola recovery per singolo prodotto creditizio
 * @param {Object} productConfig - Configurazione prodotto
 * @param {Array} defaultFlows - Flussi di default per trimestre
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero trimestri
 * @returns {Object} Recovery results per prodotto
 */
const calculateProductRecovery = (productConfig, defaultFlows, assumptions, quarters) => {
  const results = {
    quarterlyRecovery: new Array(quarters).fill(0),
    quarterlyCollateralRecovery: new Array(quarters).fill(0),
    quarterlyStateGuaranteeRecovery: new Array(quarters).fill(0),
    
    recoverySchedule: [],
    
    metrics: {
      totalGBVDefaulted: 0,
      totalExpectedRecovery: 0,
      totalCollateralRecovery: 0,
      totalStateGuaranteeRecovery: 0,
      averageRecoveryRate: 0,
      averageRecoveryTime: 0
    }
  };

  let totalGBVDefaulted = 0;
  let totalExpectedRecovery = 0;
  let totalCollateralRecovery = 0;
  let totalStateGuaranteeRecovery = 0;

  // Process default flows quarter by quarter
  defaultFlows.forEach((defaultAmount, quarter) => {
    if (defaultAmount > 0) {
      totalGBVDefaulted += defaultAmount;
      
      // CALCOLA STATE GUARANTEE RECOVERY
      const stateGuaranteeRecovery = calculateStateGuaranteeRecovery(
        defaultAmount,
        productConfig,
        assumptions,
        quarter,
        quarters
      );
      
      // CALCOLA COLLATERAL RECOVERY
      // IMPORTANTE: Applica cap per non superare GBV defaulted
      const collateralRecovery = calculateCollateralRecovery(
        defaultAmount,
        productConfig,
        assumptions,
        quarter,
        quarters
      );
      
      // CALCOLA RECOVERY TIMING (prima del capping per conoscere l'ordine temporale)
      const preliminaryTiming = calculateRecoveryTiming(
        stateGuaranteeRecovery,
        collateralRecovery,
        productConfig,
        quarter,
        quarters
      );
      
      // APPLICA CAP DINAMICO basato su ordine temporale dei cashflow
      let remainingGBVDefaulted = defaultAmount;
      let cappedStateGuarantee = stateGuaranteeRecovery.recoveryAmount;
      let cappedCollateral = collateralRecovery.netRecovery;
      let wasCapped = false;
      
      // Determina quale recovery arriva prima
      const stateGuaranteeFirst = preliminaryTiming.schedule.find(s => s.stateGuaranteeRecovery > 0);
      const collateralFirst = preliminaryTiming.schedule.find(s => s.collateralRecovery > 0);
      
      if (stateGuaranteeFirst && collateralFirst) {
        if (stateGuaranteeFirst.quarter <= collateralFirst.quarter) {
          // State guarantee arriva prima
          cappedStateGuarantee = Math.min(stateGuaranteeRecovery.recoveryAmount, remainingGBVDefaulted);
          remainingGBVDefaulted -= cappedStateGuarantee;
          cappedCollateral = Math.min(collateralRecovery.netRecovery, remainingGBVDefaulted);
          
          if (cappedStateGuarantee < stateGuaranteeRecovery.recoveryAmount || cappedCollateral < collateralRecovery.netRecovery) {
            wasCapped = true;
          }
        } else {
          // Collateral arriva prima
          cappedCollateral = Math.min(collateralRecovery.netRecovery, remainingGBVDefaulted);
          remainingGBVDefaulted -= cappedCollateral;
          cappedStateGuarantee = Math.min(stateGuaranteeRecovery.recoveryAmount, remainingGBVDefaulted);
          
          if (cappedCollateral < collateralRecovery.netRecovery || cappedStateGuarantee < stateGuaranteeRecovery.recoveryAmount) {
            wasCapped = true;
          }
        }
      } else if (stateGuaranteeFirst) {
        // Solo state guarantee
        cappedStateGuarantee = Math.min(stateGuaranteeRecovery.recoveryAmount, remainingGBVDefaulted);
        wasCapped = cappedStateGuarantee < stateGuaranteeRecovery.recoveryAmount;
      } else if (collateralFirst) {
        // Solo collateral
        cappedCollateral = Math.min(collateralRecovery.netRecovery, remainingGBVDefaulted);
        wasCapped = cappedCollateral < collateralRecovery.netRecovery;
      }
      
      // Aggiorna i valori cappati
      const cappedStateGuaranteeRecovery = {
        ...stateGuaranteeRecovery,
        recoveryAmount: cappedStateGuarantee,
        recoveryNPV: cappedStateGuarantee / Math.pow(1 + (assumptions.costOfFundsRate || 3) / 400, stateGuaranteeRecovery.recoveryTime)
      };
      
      const cappedCollateralRecovery = {
        ...collateralRecovery,
        netRecovery: cappedCollateral,
        netRecoveryNPV: cappedCollateral / Math.pow(1 + (assumptions.costOfFundsRate || 3) / 400, collateralRecovery.recoveryTime)
      };
      
      // CALCOLA RECOVERY TIMING
      const recoveryTiming = calculateRecoveryTiming(
        cappedStateGuaranteeRecovery,
        cappedCollateralRecovery,
        productConfig,
        quarter,
        quarters
      );
      
      // Distribute recovery over time
      recoveryTiming.schedule.forEach(recoveryFlow => {
        if (recoveryFlow.quarter < quarters) {
          results.quarterlyRecovery[recoveryFlow.quarter] += recoveryFlow.totalRecovery;
          results.quarterlyCollateralRecovery[recoveryFlow.quarter] += recoveryFlow.collateralRecovery;
          results.quarterlyStateGuaranteeRecovery[recoveryFlow.quarter] += recoveryFlow.stateGuaranteeRecovery;
        }
      });
      
      // Store recovery schedule details
      results.recoverySchedule.push({
        defaultQuarter: quarter,
        defaultAmount: defaultAmount,
        stateGuaranteeRecovery: cappedStateGuaranteeRecovery,
        collateralRecovery: cappedCollateralRecovery,
        totalRecoveryNPV: cappedStateGuaranteeRecovery.recoveryNPV + cappedCollateralRecovery.netRecoveryNPV,
        recoverySchedule: recoveryTiming.schedule,
        wasCapped: wasCapped
      });
      
      recoveryTiming.schedule.forEach((cf, i) => {
        if (cf.totalRecovery > 0) {
        }
      });
      
      // Aggregate totals
      totalExpectedRecovery += cappedStateGuaranteeRecovery.recoveryNPV + cappedCollateralRecovery.netRecoveryNPV;
      totalStateGuaranteeRecovery += cappedStateGuaranteeRecovery.recoveryNPV;
      totalCollateralRecovery += cappedCollateralRecovery.netRecoveryNPV;
    }
  });
  
  // Calculate metrics
  results.metrics.totalGBVDefaulted = totalGBVDefaulted;
  results.metrics.totalExpectedRecovery = totalExpectedRecovery;
  results.metrics.totalCollateralRecovery = totalCollateralRecovery;
  results.metrics.totalStateGuaranteeRecovery = totalStateGuaranteeRecovery;
  results.metrics.averageRecoveryRate = totalGBVDefaulted > 0 
    ? (totalExpectedRecovery / totalGBVDefaulted) * 100 
    : 0;
  
  // Calculate average recovery time
  results.metrics.averageRecoveryTime = calculateAverageRecoveryTime(results.recoverySchedule);
  
  return results;
};

/**
 * Extract default flows from product data
 * @param {Object} product - Product data with vintages or calculated flows
 * @param {number} quarters - Number of quarters
 * @param {string} productKey - Product key for lookup
 * @param {Object} totalAssetsResults - Results from TotalAssetsOrchestrator
 * @returns {Array} Default flows per quarter
 */
const extractDefaultFlows = (product, quarters, productKey, totalAssetsResults) => {
  // PRIORITY 1: Try to get from GBV Defaulted results (most reliable)
  if (totalAssetsResults && totalAssetsResults.gbvDefaulted && totalAssetsResults.gbvDefaulted.byProduct) {
    const productGbvData = totalAssetsResults.gbvDefaulted.byProduct[productKey];
    if (productGbvData && productGbvData.quarterlyGrossNPL) {
      return productGbvData.quarterlyGrossNPL;
    }
  }
  
  // PRIORITY 2: Try to get from calculated flows
  if (product.calculatedFlows && product.calculatedFlows.defaultFlows) {
    return product.calculatedFlows.defaultFlows;
  }
  
  // PRIORITY 3: Try to extract from vintages
  if (product.vintages && product.vintages.length > 0) {
    const defaultFlows = new Array(quarters).fill(0);
    
    product.vintages.forEach(vintage => {
      if (vintage.defaultAmount && vintage.defaultQuarter) {
        if (vintage.defaultQuarter < quarters) {
          defaultFlows[vintage.defaultQuarter] += vintage.defaultAmount;
        }
      }
    });
    
    const hasDefaults = defaultFlows.some(val => val > 0);
    if (hasDefaults) {
      return defaultFlows;
    }
  }
  
  // Return empty array if no default data found
  return new Array(quarters).fill(0);
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
 * Calcola metriche consolidate recovery
 * @param {Object} results - Results aggregati
 * @returns {Object} Consolidated recovery metrics
 */
const calculateConsolidatedRecoveryMetrics = (results) => {
  let totalGBVDefaulted = 0;
  let totalExpectedRecovery = 0;
  let totalCollateralRecovery = 0;
  let totalStateGuaranteeRecovery = 0;
  let productCount = 0;
  
  // Aggregate from all products
  Object.values(results.byProduct).forEach(product => {
    if (product.fullResults && product.fullResults.metrics) {
      totalGBVDefaulted += product.fullResults.metrics.totalGBVDefaulted || 0;
      totalExpectedRecovery += product.fullResults.metrics.totalExpectedRecovery || 0;
      totalCollateralRecovery += product.fullResults.metrics.totalCollateralRecovery || 0;
      totalStateGuaranteeRecovery += product.fullResults.metrics.totalStateGuaranteeRecovery || 0;
      productCount++;
    }
  });
  
  const averageRecoveryRate = totalGBVDefaulted > 0 
    ? (totalExpectedRecovery / totalGBVDefaulted) * 100 
    : 0;
  
  // Calculate weighted average recovery time
  let totalWeightedTime = 0;
  let totalWeight = 0;
  
  Object.values(results.byProduct).forEach(product => {
    if (product.fullResults && product.fullResults.metrics) {
      const weight = product.fullResults.metrics.totalExpectedRecovery || 0;
      const time = product.fullResults.metrics.averageRecoveryTime || 0;
      totalWeightedTime += weight * time;
      totalWeight += weight;
    }
  });
  
  const averageRecoveryTime = totalWeight > 0 ? totalWeightedTime / totalWeight : 0;
  
  return {
    totalGBVDefaulted,
    totalExpectedRecovery,
    totalCollateralRecovery,
    totalStateGuaranteeRecovery,
    averageRecoveryRate,
    averageRecoveryTime,
    productCount
  };
};

/**
 * Calcola metriche timing recovery
 * @param {Object} results - Results aggregati
 * @param {number} quarters - Numero trimestri
 * @returns {Object} Recovery timing metrics
 */
const calculateRecoveryTimingMetrics = (results, quarters) => {
  // Find peak recovery quarter and value
  let peakRecoveryQuarter = 0;
  let peakRecoveryValue = 0;
  
  results.balanceSheetLine.quarterly.forEach((value, quarter) => {
    if (value > peakRecoveryValue) {
      peakRecoveryValue = value;
      peakRecoveryQuarter = quarter;
    }
  });
  
  // Calculate recovery concentration by quarter
  const recoveryConcentration = {};
  const totalRecovery = results.consolidatedMetrics.totalExpectedRecovery;
  
  results.balanceSheetLine.quarterly.forEach((value, quarter) => {
    recoveryConcentration[quarter] = totalRecovery > 0 
      ? (value / totalRecovery) * 100 
      : 0;
  });
  
  // Create recovery schedule summary
  const recoverySchedule = results.balanceSheetLine.quarterly.map((value, quarter) => ({
    quarter,
    totalRecovery: value,
    collateralRecovery: results.byRecoveryType.collateralRecovery[quarter],
    stateGuaranteeRecovery: results.byRecoveryType.stateGuaranteeRecovery[quarter],
    percentage: totalRecovery > 0 ? (value / totalRecovery) * 100 : 0
  }));
  
  return {
    peakRecoveryQuarter,
    peakRecoveryValue,
    recoveryConcentration,
    recoverySchedule
  };
};

/**
 * Calcola tempo medio di recovery
 * @param {Array} recoverySchedule - Schedule recovery dettagliato
 * @returns {number} Average recovery time in quarters
 */
const calculateAverageRecoveryTime = (recoverySchedule) => {
  if (recoverySchedule.length === 0) return 0;
  
  let totalWeightedTime = 0;
  let totalWeight = 0;
  
  recoverySchedule.forEach(schedule => {
    schedule.recoverySchedule.forEach(flow => {
      const weight = flow.totalRecovery;
      const timeDiff = flow.quarter - schedule.defaultQuarter;
      totalWeightedTime += weight * timeDiff;
      totalWeight += weight;
    });
  });
  
  return totalWeight > 0 ? totalWeightedTime / totalWeight : 0;
};

/**
 * Get dati formattati per Balance Sheet
 * @param {Object} results - Risultati recovery completi
 * @param {number} quarter - Indice trimestre
 * @returns {Object} Dati formattati per Balance Sheet
 */
export const getRecoveryBalanceSheetData = (results, quarter) => {
  const total = results.balanceSheetLine.quarterly[quarter];
  const collateral = results.byRecoveryType.collateralRecovery[quarter];
  const stateGuarantee = results.byRecoveryType.stateGuaranteeRecovery[quarter];
  
  return {
    // Riga principale
    mainLine: {
      label: 'Recovery on Defaulted Assets',
      value: total,
      unit: '€M'
    },
    
    // Sub-linee per dettaglio
    subLines: [
      {
        label: 'o/w Collateral Recovery',
        value: collateral,
        percentage: total > 0 ? (collateral / total) * 100 : 0
      },
      {
        label: 'o/w State Guarantee Recovery',
        value: stateGuarantee,
        percentage: total > 0 ? (stateGuarantee / total) * 100 : 0
      }
    ],
    
    // Recovery indicators
    recoveryIndicators: {
      recoveryRate: results.consolidatedMetrics.averageRecoveryRate,
      averageRecoveryTime: results.consolidatedMetrics.averageRecoveryTime,
      peakRecoveryQuarter: results.timingMetrics.peakRecoveryQuarter
    }
  };
};