/**
 * Net Performing Assets Calculator
 * 
 * Calcola i Net Performing Assets come differenza tra Stock NBV e Non-Performing Assets
 * Formula: Net Performing Assets = Stock NBV - Non-Performing Assets
 */

/**
 * Calcola Net Performing Assets per singolo prodotto
 * @param {Array} stockNBV - Array trimestrale dello stock NBV
 * @param {Array} nonPerformingAssets - Array trimestrale dei Non-Performing Assets
 * @param {number} quarters - Numero di trimestri
 * @returns {Array} Net Performing Assets trimestrali
 */
export const calculateProductNetPerforming = (stockNBV, nonPerformingAssets, quarters = 40) => {
  const netPerforming = new Array(quarters).fill(0);
  
  for (let q = 0; q < quarters; q++) {
    const nbv = stockNBV[q] || 0;
    const npa = nonPerformingAssets[q] || 0;
    
    // Net Performing = Stock NBV - Non-Performing Assets
    netPerforming[q] = Math.max(0, nbv - npa);
  }
  
  return netPerforming;
};

/**
 * Calcola Net Performing Assets aggregati
 * @param {Object} totalNBVData - Dati Stock NBV totali per prodotto
 * @param {Object} nonPerformingData - Dati Non-Performing Assets per prodotto
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Net Performing Assets con breakdown
 */
export const calculateAggregateNetPerforming = (totalNBVData, nonPerformingData, quarters = 40) => {
  const results = {
    totalNetPerforming: new Array(quarters).fill(0),
    byProduct: {},
    metrics: {
      averageNetPerforming: 0,
      netPerformingGrowthRate: 0,
      nplCoverageRatio: 0
    }
  };
  
  // Calcola per ogni prodotto
  Object.keys(totalNBVData).forEach(productKey => {
    const stockNBV = totalNBVData[productKey] || new Array(quarters).fill(0);
    const nonPerforming = nonPerformingData[productKey] || new Array(quarters).fill(0);
    
    const productNetPerforming = calculateProductNetPerforming(stockNBV, nonPerforming, quarters);
    
    results.byProduct[productKey] = productNetPerforming;
    
    // Aggrega al totale
    productNetPerforming.forEach((value, q) => {
      results.totalNetPerforming[q] += value;
    });
  });
  
  // Calcola metriche
  const totalSum = results.totalNetPerforming.reduce((sum, val) => sum + val, 0);
  const nonZeroQuarters = results.totalNetPerforming.filter(val => val > 0).length;
  
  results.metrics.averageNetPerforming = nonZeroQuarters > 0 ? totalSum / nonZeroQuarters : 0;
  
  // Growth rate (CAGR)
  const firstValue = results.totalNetPerforming.find(val => val > 0) || 0;
  const lastValue = results.totalNetPerforming[quarters - 1] || 0;
  
  if (firstValue > 0 && lastValue > 0) {
    const periods = quarters / 4; // Converti in anni
    results.metrics.netPerformingGrowthRate = (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
  }
  
  return results;
};

/**
 * Calcola breakdown per tipo di prodotto
 * @param {Object} productResults - Risultati per prodotto
 * @param {Object} productConfigs - Configurazioni prodotto
 * @returns {Object} Breakdown per tipo
 */
export const calculateByProductType = (productResults, productConfigs) => {
  const byType = {
    bridgeLoans: [],
    frenchNoGrace: [],
    frenchWithGrace: []
  };
  
  Object.entries(productResults).forEach(([productKey, netPerforming]) => {
    const config = productConfigs[productKey];
    if (!config) return;
    
    const type = getProductType(config);
    
    if (!byType[type]) {
      byType[type] = new Array(netPerforming.length).fill(0);
    }
    
    netPerforming.forEach((value, q) => {
      byType[type][q] += value;
    });
  });
  
  return byType;
};

/**
 * Determina tipo prodotto
 * @private
 */
const getProductType = (product) => {
  if (product.productType === 'bridge' || product.type === 'bullet') {
    return 'bridgeLoans';
  }
  
  if (product.type === 'french') {
    if (product.gracePeriod > 0) {
      return 'frenchWithGrace';
    } else {
      return 'frenchNoGrace';
    }
  }
  
  return 'bridgeLoans';
};

/**
 * Calcola variazioni trimestrali
 * @param {Array} netPerformingArray - Array dei Net Performing Assets
 * @returns {Object} Analisi delle variazioni
 */
export const calculateQuarterlyChanges = (netPerformingArray) => {
  const changes = {
    quarterlyGrowth: [],
    quarterlyGrowthRate: [],
    cumulativeGrowth: []
  };
  
  for (let q = 1; q < netPerformingArray.length; q++) {
    const current = netPerformingArray[q];
    const previous = netPerformingArray[q - 1];
    
    // Crescita assoluta
    changes.quarterlyGrowth[q] = current - previous;
    
    // Tasso di crescita %
    changes.quarterlyGrowthRate[q] = previous > 0 
      ? ((current - previous) / previous) * 100 
      : 0;
    
    // Crescita cumulativa dal primo trimestre
    const initial = netPerformingArray[0] || 0;
    changes.cumulativeGrowth[q] = initial > 0 
      ? ((current - initial) / initial) * 100 
      : 0;
  }
  
  return changes;
};

/**
 * Formatta dati per Balance Sheet
 * @param {Object} results - Risultati Net Performing Assets
 * @param {number} quarter - Trimestre di riferimento
 * @returns {Object} Dati formattati
 */
export const formatNetPerformingForBalanceSheet = (results, quarter) => {
  return {
    mainLine: {
      label: 'Net Performing Assets',
      value: results.totalNetPerforming[quarter],
      unit: '€M'
    },
    
    metrics: {
      quarterlyValue: results.totalNetPerforming[quarter],
      quarterlyChange: quarter > 0 
        ? results.totalNetPerforming[quarter] - results.totalNetPerforming[quarter - 1]
        : 0,
      productCount: Object.keys(results.byProduct).length
    }
  };
};