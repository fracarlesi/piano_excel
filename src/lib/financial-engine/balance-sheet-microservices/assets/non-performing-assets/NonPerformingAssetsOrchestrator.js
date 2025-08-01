/**
 * Non-Performing Assets Orchestrator
 * 
 * ORCHESTRATORE che calcola il valore dei Non-Performing Assets (NPL)
 * utilizzando il Net Present Value (NPV) dei recovery attesi.
 * Il valore si incrementa nel tempo per l'unwinding del discount.
 */

import { calculateNPVEvolution, formatNPVForBalanceSheet, calculateTimeValueIncrease } from './NPVCalculator.js';

/**
 * Calcola Non-Performing Assets per tutti i prodotti
 * @param {Object} divisions - Dati divisioni con recovery schedule
 * @param {Object} assumptions - Assumptions globali
 * @param {Object} recoveryResults - Risultati dal RecoveryOrchestrator
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Risultati Non-Performing Assets
 */
export const calculateNonPerformingAssets = (divisions, assumptions, recoveryResults, quarters = 40) => {
  console.log('📊 Non-Performing Assets Calculator - Start');
  console.log('  - Recovery Results available:', !!recoveryResults);
  console.log('  - Products with recovery:', Object.keys(recoveryResults?.byProduct || {}));
  
  const results = {
    // RIGA PRINCIPALE BALANCE SHEET
    balanceSheetLine: {
      name: 'Non-Performing Assets (Net)',
      quarterly: new Array(quarters).fill(0)
    },
    
    // DETTAGLIO PER PRODOTTO
    byProduct: {},
    
    // DETTAGLIO PER DIVISIONE
    byDivision: {},
    
    // METRICHE AGGREGATE
    consolidatedMetrics: {
      totalNPV: new Array(quarters).fill(0),
      weightedAverageRate: 0,
      totalTimeValueEffect: 0,
      numberOfProducts: 0
    },
    
    // TIME VALUE ANALYSIS
    timeValueAnalysis: {
      quarterlyTimeValue: new Array(quarters).fill(0),
      quarterlyRecoveries: new Array(quarters).fill(0),
      quarterlyNetChange: new Array(quarters).fill(0)
    }
  };
  
  // Processa ogni prodotto con recovery data
  if (recoveryResults && recoveryResults.byProduct) {
    Object.entries(recoveryResults.byProduct).forEach(([productKey, productRecovery]) => {
      console.log(`\n🔍 Processing product: ${productKey}`);
      
      // Trova configurazione prodotto originale
      const productConfig = findProductConfig(divisions, productKey);
      
      if (productConfig && productRecovery.fullResults) {
        // Calcola evoluzione NPV per questo prodotto
        const npvEvolution = calculateNPVEvolution(
          productRecovery.fullResults,
          productConfig,
          quarters
        );
        
        console.log(`  - Product rate: ${npvEvolution.productRate.toFixed(2)}%`);
        console.log(`  - NPV Q0: €${npvEvolution.quarterlyNPV[0].toFixed(1)}M`);
        console.log(`  - NPV Q10: €${npvEvolution.quarterlyNPV[10]?.toFixed(1)}M`);
        
        // Salva risultati per prodotto
        results.byProduct[productKey] = {
          productName: productConfig.name,
          productType: productRecovery.productType,
          discountRate: npvEvolution.productRate,
          quarterlyNPV: npvEvolution.quarterlyNPV,
          quarterlyDetails: npvEvolution.quarterlyDetails,
          totalDefaulted: productRecovery.fullResults.metrics.totalGBVDefaulted
        };
        
        // Aggrega a livello consolidato
        npvEvolution.quarterlyNPV.forEach((npv, q) => {
          results.balanceSheetLine.quarterly[q] += npv;
          results.consolidatedMetrics.totalNPV[q] += npv;
        });
        
        // Calcola time value effects
        for (let q = 1; q < quarters; q++) {
          const previousNPV = npvEvolution.quarterlyNPV[q - 1];
          const currentNPV = npvEvolution.quarterlyNPV[q];
          const cashRecovered = productRecovery.quarterly[q] || 0;
          
          const timeValueCalc = calculateTimeValueIncrease(previousNPV, currentNPV, cashRecovered);
          
          results.timeValueAnalysis.quarterlyTimeValue[q] += timeValueCalc.timeValueEffect;
          results.timeValueAnalysis.quarterlyRecoveries[q] += cashRecovered;
          results.timeValueAnalysis.quarterlyNetChange[q] += timeValueCalc.totalValueChange;
        }
        
        results.consolidatedMetrics.numberOfProducts++;
      }
    });
  }
  
  // Aggrega per divisione
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionNPV = new Array(quarters).fill(0);
    let divisionProducts = 0;
    
    // Somma NPV di tutti i prodotti della divisione
    Object.entries(results.byProduct).forEach(([productKey, productResults]) => {
      if (isProductInDivision(productKey, divisionKey, division)) {
        productResults.quarterlyNPV.forEach((npv, q) => {
          divisionNPV[q] += npv;
        });
        divisionProducts++;
      }
    });
    
    results.byDivision[divisionKey] = {
      divisionName: division.name || divisionKey,
      quarterlyNPV: divisionNPV,
      numberOfProducts: divisionProducts
    };
  });
  
  // Calcola weighted average rate
  let totalWeightedRate = 0;
  let totalWeight = 0;
  
  Object.values(results.byProduct).forEach(product => {
    const weight = product.totalDefaulted || 0;
    totalWeightedRate += product.discountRate * weight;
    totalWeight += weight;
  });
  
  results.consolidatedMetrics.weightedAverageRate = totalWeight > 0 
    ? totalWeightedRate / totalWeight 
    : 0;
  
  // Calcola total time value effect
  results.consolidatedMetrics.totalTimeValueEffect = results.timeValueAnalysis.quarterlyTimeValue.reduce((a, b) => a + b, 0);
  
  console.log('\n📊 Non-Performing Assets Calculator - Summary');
  console.log(`  - Total products processed: ${results.consolidatedMetrics.numberOfProducts}`);
  console.log(`  - Weighted average rate: ${results.consolidatedMetrics.weightedAverageRate.toFixed(2)}%`);
  console.log(`  - Total NPV Q0: €${results.consolidatedMetrics.totalNPV[0].toFixed(1)}M`);
  console.log(`  - Total time value effect: €${results.consolidatedMetrics.totalTimeValueEffect.toFixed(1)}M`);
  
  return results;
};

/**
 * Trova configurazione prodotto nelle divisioni
 * @param {Object} divisions - Struttura divisioni
 * @param {string} productKey - Chiave prodotto
 * @returns {Object|null} Configurazione prodotto
 */
const findProductConfig = (divisions, productKey) => {
  for (const [divKey, division] of Object.entries(divisions)) {
    const products = division.products || division;
    
    if (products[productKey]) {
      return products[productKey].originalProduct || products[productKey];
    }
  }
  
  console.log(`⚠️ Product config not found for: ${productKey}`);
  return null;
};

/**
 * Verifica se un prodotto appartiene a una divisione
 * @param {string} productKey - Chiave prodotto
 * @param {string} divisionKey - Chiave divisione
 * @param {Object} division - Dati divisione
 * @returns {boolean} True se il prodotto appartiene alla divisione
 */
const isProductInDivision = (productKey, divisionKey, division) => {
  const products = division.products || division;
  return !!products[productKey];
};

/**
 * Get dati formattati per Balance Sheet
 * @param {Object} results - Risultati NPA completi
 * @param {number} quarter - Indice trimestre
 * @returns {Object} Dati formattati per Balance Sheet
 */
export const getNPABalanceSheetData = (results, quarter) => {
  const total = results.balanceSheetLine.quarterly[quarter];
  const previousTotal = quarter > 0 ? results.balanceSheetLine.quarterly[quarter - 1] : 0;
  const timeValue = results.timeValueAnalysis.quarterlyTimeValue[quarter];
  const recoveries = results.timeValueAnalysis.quarterlyRecoveries[quarter];
  
  return {
    // Riga principale
    mainLine: {
      label: 'Non-Performing Assets (Net)',
      value: total,
      unit: '€M'
    },
    
    // Variazioni del trimestre
    quarterlyMovements: {
      openingBalance: previousTotal,
      timeValueUnwinding: timeValue,
      cashRecoveries: -recoveries,
      closingBalance: total,
      netChange: total - previousTotal
    },
    
    // Metriche
    metrics: {
      impliedYield: previousTotal > 0 ? (timeValue / previousTotal) * 400 : 0, // Annualizzato
      numberOfProducts: results.consolidatedMetrics.numberOfProducts,
      weightedAverageRate: results.consolidatedMetrics.weightedAverageRate
    }
  };
};