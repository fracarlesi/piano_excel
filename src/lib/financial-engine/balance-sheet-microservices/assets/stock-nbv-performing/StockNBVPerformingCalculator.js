/**
 * Stock NBV Performing Calculator
 * 
 * Calcola lo Stock NBV dei soli crediti performing (non deteriorati)
 * Formula: Stock NBV Performing = Stock NBV Totale - Stock NPL
 * Dove Stock NPL = Stock NPL precedente + Nuovi Default
 * 
 * IMPORTANTE: I recovery NON riducono lo stock NPL. I recovery sono solo flussi di cassa
 * che riducono la perdita economica, ma i crediti NPL rimangono classificati come tali
 * fino al loro completo ammortamento/write-off.
 */

/**
 * Calcola Stock NBV Performing per singolo prodotto
 * @param {Array} totalStockNBV - Array trimestrale dello stock NBV totale
 * @param {Array} gbvDefaulted - Array trimestrale del GBV defaulted (nuovi default per periodo)
 * @param {Array} recoveries - Array trimestrale dei recovery su NPL (NON UTILIZZATO - i recovery non fanno tornare performing i crediti)
 * @param {number} quarters - Numero di trimestri
 * @returns {Array} Stock NBV Performing trimestrali
 */
export const calculateProductStockNBVPerforming = (totalStockNBV, gbvDefaulted, recoveries, quarters = 40) => {
  const stockNBVPerforming = new Array(quarters).fill(0);
  let stockNPL = 0; // Stock NPL che si accumula (NON si riduce con i recovery)
  
  for (let q = 0; q < quarters; q++) {
    const totalNBV = totalStockNBV[q] || 0;
    const newDefaulted = gbvDefaulted[q] || 0;
    // I recovery NON riducono lo stock NPL - sono solo flussi di cassa
    // const quarterlyRecovery = recoveries[q] || 0;
    
    // Aggiorna lo stock NPL:
    // - Aumenta SOLO con i nuovi default
    // - NON diminuisce con i recovery (i crediti rimangono NPL fino a completo ammortamento)
    stockNPL = stockNPL + newDefaulted;
    
    // Stock NBV Performing = Total Stock NBV - Stock NPL
    // IMPORTANTE: Lo stock NPL non può superare lo stock totale
    stockNPL = Math.min(stockNPL, totalNBV);
    stockNBVPerforming[q] = Math.max(0, totalNBV - stockNPL);
  }
  
  return stockNBVPerforming;
};

/**
 * Calcola Stock NBV Performing aggregato
 * @param {Object} totalNBVData - Dati Stock NBV totali per prodotto
 * @param {Object} gbvDefaultedData - Dati GBV Defaulted per prodotto
 * @param {Object} recoveryData - Dati Recovery per prodotto (non utilizzato)
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Stock NBV Performing con breakdown
 */
export const calculateAggregateStockNBVPerforming = (totalNBVData, gbvDefaultedData, recoveryData, quarters = 40) => {
  const results = {
    totalStockNBVPerforming: new Array(quarters).fill(0),
    byProduct: {},
    metrics: {
      averageStockNBVPerforming: 0,
      performingGrowthRate: 0,
      performingToTotalRatio: new Array(quarters).fill(0)
    }
  };
  
  // Calcola per ogni prodotto
  Object.keys(totalNBVData).forEach(productKey => {
    const totalNBV = totalNBVData[productKey] || new Array(quarters).fill(0);
    const gbvDefaulted = gbvDefaultedData[productKey]?.quarterlyGrossNPL || new Array(quarters).fill(0);
    const recoveries = new Array(quarters).fill(0); // Non utilizzato
    
    const productStockNBVPerforming = calculateProductStockNBVPerforming(
      totalNBV, 
      gbvDefaulted, 
      recoveries, 
      quarters
    );
    
    results.byProduct[productKey] = productStockNBVPerforming;
    
    // Aggrega al totale
    productStockNBVPerforming.forEach((value, q) => {
      results.totalStockNBVPerforming[q] += value;
    });
  });
  
  // Calcola metriche
  const totalSum = results.totalStockNBVPerforming.reduce((sum, val) => sum + val, 0);
  const nonZeroQuarters = results.totalStockNBVPerforming.filter(val => val > 0).length;
  
  results.metrics.averageStockNBVPerforming = nonZeroQuarters > 0 ? totalSum / nonZeroQuarters : 0;
  
  // Growth rate (CAGR)
  const firstValue = results.totalStockNBVPerforming.find(val => val > 0) || 0;
  const lastValue = results.totalStockNBVPerforming[quarters - 1] || 0;
  
  if (firstValue > 0 && lastValue > 0) {
    const periods = quarters / 4;
    results.metrics.performingGrowthRate = (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
  }
  
  // Performing to total ratio
  for (let q = 0; q < quarters; q++) {
    const totalNBV = Object.values(totalNBVData).reduce((sum, data) => sum + (data[q] || 0), 0);
    const performingNBV = results.totalStockNBVPerforming[q];
    results.metrics.performingToTotalRatio[q] = totalNBV > 0 ? (performingNBV / totalNBV) * 100 : 0;
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
    bridgeLoans: new Array(40).fill(0),
    frenchNoGrace: new Array(40).fill(0),
    frenchWithGrace: new Array(40).fill(0)
  };
  
  Object.entries(productResults).forEach(([productKey, stockNBVPerforming]) => {
    const config = productConfigs[productKey];
    if (!config) return;
    
    const type = getProductType(config);
    
    if (byType[type]) {
      stockNBVPerforming.forEach((value, q) => {
        byType[type][q] += value;
      });
    }
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
 * @param {Array} stockNBVPerformingArray - Array dello Stock NBV Performing
 * @returns {Object} Analisi delle variazioni
 */
export const calculateQuarterlyChanges = (stockNBVPerformingArray) => {
  const changes = {
    quarterlyGrowth: [],
    quarterlyGrowthRate: [],
    cumulativeGrowth: []
  };
  
  for (let q = 1; q < stockNBVPerformingArray.length; q++) {
    const current = stockNBVPerformingArray[q];
    const previous = stockNBVPerformingArray[q - 1];
    
    changes.quarterlyGrowth[q] = current - previous;
    
    changes.quarterlyGrowthRate[q] = previous > 0 
      ? ((current - previous) / previous) * 100 
      : 0;
    
    const initial = stockNBVPerformingArray[0] || 0;
    changes.cumulativeGrowth[q] = initial > 0 
      ? ((current - initial) / initial) * 100 
      : 0;
  }
  
  return changes;
};