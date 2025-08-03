/**
 * Stock NBV Performing Orchestrator
 * 
 * ORCHESTRATORE che coordina il calcolo dello Stock NBV Performing
 * come differenza tra Stock NBV totale e GBV Defaulted
 */

import { 
  calculateProductStockNBVPerforming,
  calculateByProductType,
  calculateQuarterlyChanges
} from './StockNBVPerformingCalculator.js';

/**
 * Calcola Stock NBV Performing per tutti i prodotti
 * @param {Object} totalNBVResults - Risultati Stock NBV dal TotalNBVOrchestrator
 * @param {Object} gbvDefaultedResults - Risultati GBV Defaulted
 * @param {Object} recoveryResults - Risultati Recovery (opzionale)
 * @param {Object} divisions - Dati divisioni con prodotti
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Risultati Stock NBV Performing completi
 */
export const calculateStockNBVPerforming = (
  totalNBVResults, 
  gbvDefaultedResults, 
  recoveryResults = null,
  divisions, 
  quarters = 40
) => {
  
  const results = {
    // RIGA PRINCIPALE BALANCE SHEET
    balanceSheetLine: {
      name: 'Stock NBV Performing',
      quarterly: new Array(quarters).fill(0)
    },
    
    // BREAKDOWN PER TIPO PRODOTTO
    byProductType: {
      bridgeLoans: {
        name: 'Bridge/Bullet Loans',
        quarterly: new Array(quarters).fill(0)
      },
      frenchNoGrace: {
        name: 'French Amortization',
        quarterly: new Array(quarters).fill(0)
      },
      frenchWithGrace: {
        name: 'French with Grace Period',
        quarterly: new Array(quarters).fill(0)
      }
    },
    
    // DETTAGLIO PER PRODOTTO
    byProduct: {},
    
    // DETTAGLIO PER DIVISIONE
    byDivision: {},
    
    // METRICHE CONSOLIDATE
    consolidatedMetrics: {
      totalStockNBVPerforming: new Array(quarters).fill(0),
      averageStockNBVPerforming: 0,
      growthRate: 0,
      performingRatio: new Array(quarters).fill(0),
      defaultedImpact: new Array(quarters).fill(0)
    },
    
    // ANALISI VARIAZIONI
    changeAnalysis: {
      quarterlyChanges: new Array(quarters).fill(0),
      quarterlyGrowthRates: new Array(quarters).fill(0),
      cumulativeGrowth: new Array(quarters).fill(0),
      yearOverYearGrowth: new Array(quarters).fill(0)
    },
    
    // RECONCILIATION DATA
    reconciliation: {
      totalStockNBV: new Array(quarters).fill(0),
      gbvDefaulted: new Array(quarters).fill(0),
      recoveries: new Array(quarters).fill(0),
      stockNBVPerforming: new Array(quarters).fill(0)
    }
  };
  
  // Step 1: Calcola Stock NBV Performing per ogni prodotto
  if (totalNBVResults && totalNBVResults.byProduct && gbvDefaultedResults && gbvDefaultedResults.byProduct) {
    Object.entries(totalNBVResults.byProduct).forEach(([productKey, productNBV]) => {
      
      // Get Stock NBV data
      const stockNBV = productNBV.quarterlyNBV || new Array(quarters).fill(0);
      
      // Get GBV Defaulted data
      const gbvDefaulted = gbvDefaultedResults.byProduct[productKey]?.quarterlyGrossNPL || new Array(quarters).fill(0);
      
      // Get Recovery data if available
      const recoveries = recoveryResults?.byProduct?.[productKey]?.quarterly || new Array(quarters).fill(0);
      
      
      // Calculate Stock NBV Performing
      const stockNBVPerforming = calculateProductStockNBVPerforming(
        stockNBV, 
        gbvDefaulted, 
        recoveries, 
        quarters
      );
      
      
      // Store product results
      results.byProduct[productKey] = {
        productName: productNBV.productName || productKey,
        productType: productNBV.productType,
        quarterly: stockNBVPerforming,
        totalStockNBV: stockNBV,
        gbvDefaulted: gbvDefaulted,
        recoveries: recoveries
      };
      
      // Aggregate to total
      stockNBVPerforming.forEach((value, q) => {
        results.balanceSheetLine.quarterly[q] += value;
        results.consolidatedMetrics.totalStockNBVPerforming[q] += value;
      });
      
      // Aggregate to reconciliation
      stockNBV.forEach((value, q) => {
        results.reconciliation.totalStockNBV[q] += value;
      });
      gbvDefaulted.forEach((value, q) => {
        results.reconciliation.gbvDefaulted[q] += value;
      });
      recoveries.forEach((value, q) => {
        results.reconciliation.recoveries[q] += value;
      });
      
      // Aggregate by product type
      const productType = getProductTypeFromNBV(productNBV);
      if (results.byProductType[productType]) {
        stockNBVPerforming.forEach((value, q) => {
          results.byProductType[productType].quarterly[q] += value;
        });
      }
    });
  }
  
  // Update reconciliation
  results.reconciliation.stockNBVPerforming = results.balanceSheetLine.quarterly;
  
  // Step 2: Aggregate by division
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionQuarterly = new Array(quarters).fill(0);
    let divisionProducts = 0;
    
    // Sum all products in this division
    Object.entries(results.byProduct).forEach(([productKey, productResults]) => {
      if (isProductInDivision(productKey, divisionKey, division)) {
        productResults.quarterly.forEach((value, q) => {
          divisionQuarterly[q] += value;
        });
        divisionProducts++;
      }
    });
    
    results.byDivision[divisionKey] = {
      divisionName: division.name || divisionKey,
      quarterly: divisionQuarterly,
      annual: quarterlyToAnnual(divisionQuarterly),
      numberOfProducts: divisionProducts
    };
  });
  
  // Step 3: Calculate consolidated metrics
  const totalSum = results.consolidatedMetrics.totalStockNBVPerforming.reduce((sum, val) => sum + val, 0);
  const nonZeroQuarters = results.consolidatedMetrics.totalStockNBVPerforming.filter(val => val > 0).length;
  
  results.consolidatedMetrics.averageStockNBVPerforming = nonZeroQuarters > 0 ? totalSum / nonZeroQuarters : 0;
  
  // Calculate growth rate (CAGR)
  const firstValue = results.consolidatedMetrics.totalStockNBVPerforming.find(val => val > 0) || 0;
  const lastValue = results.consolidatedMetrics.totalStockNBVPerforming[quarters - 1] || 0;
  
  if (firstValue > 0 && lastValue > 0) {
    const periods = quarters / 4;
    results.consolidatedMetrics.growthRate = (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
  }
  
  // Calculate performing ratio and defaulted impact
  for (let q = 0; q < quarters; q++) {
    const totalNBV = results.reconciliation.totalStockNBV[q] || 0;
    const performingNBV = results.balanceSheetLine.quarterly[q] || 0;
    const defaulted = results.reconciliation.gbvDefaulted[q] || 0;
    
    results.consolidatedMetrics.performingRatio[q] = totalNBV > 0 ? (performingNBV / totalNBV) * 100 : 0;
    results.consolidatedMetrics.defaultedImpact[q] = totalNBV > 0 ? (defaulted / totalNBV) * 100 : 0;
  }
  
  // Step 4: Calculate change analysis
  const quarterlyChanges = calculateQuarterlyChanges(results.balanceSheetLine.quarterly);
  results.changeAnalysis.quarterlyChanges = quarterlyChanges.quarterlyGrowth || new Array(quarters).fill(0);
  results.changeAnalysis.quarterlyGrowthRates = quarterlyChanges.quarterlyGrowthRate || new Array(quarters).fill(0);
  results.changeAnalysis.cumulativeGrowth = quarterlyChanges.cumulativeGrowth || new Array(quarters).fill(0);
  
  // Step 5: Calculate year-over-year growth
  for (let q = 4; q < quarters; q++) {
    const current = results.balanceSheetLine.quarterly[q];
    const yearAgo = results.balanceSheetLine.quarterly[q - 4];
    const yoyGrowth = yearAgo > 0 ? ((current - yearAgo) / yearAgo) * 100 : 0;
    results.changeAnalysis.yearOverYearGrowth[q] = yoyGrowth;
  }
  
  
  return results;
};

/**
 * Get product type from NBV data
 * @private
 */
const getProductTypeFromNBV = (productNBV) => {
  const productType = productNBV.productType;
  
  if (productType === 'bridgeLoans' || productType === 'bullet') {
    return 'bridgeLoans';
  }
  
  if (productType === 'frenchNoGrace') {
    return 'frenchNoGrace';
  }
  
  if (productType === 'frenchWithGrace') {
    return 'frenchWithGrace';
  }
  
  // Default fallback
  return 'bridgeLoans';
};

/**
 * Check if product belongs to division
 * @private
 */
const isProductInDivision = (productKey, divisionKey, division) => {
  const products = division.products || division;
  return !!products[productKey];
};

/**
 * Convert quarterly to annual data
 * @private
 */
const quarterlyToAnnual = (quarterlyData) => {
  const annual = [];
  for (let year = 0; year < 10; year++) {
    annual.push(quarterlyData[year * 4 + 3] || 0);
  }
  return annual;
};

/**
 * Get formatted data for Balance Sheet
 * @param {Object} results - Stock NBV Performing results
 * @param {number} quarter - Quarter index
 * @returns {Object} Formatted data for Balance Sheet
 */
export const getStockNBVPerformingBalanceSheetData = (results, quarter) => {
  const total = results.balanceSheetLine.quarterly[quarter];
  const previousTotal = quarter > 0 ? results.balanceSheetLine.quarterly[quarter - 1] : 0;
  
  return {
    // Main line
    mainLine: {
      label: 'Stock NBV Performing',
      value: total,
      unit: '€M'
    },
    
    // Product type breakdown
    breakdown: {
      bridgeLoans: results.byProductType.bridgeLoans.quarterly[quarter],
      frenchNoGrace: results.byProductType.frenchNoGrace.quarterly[quarter],
      frenchWithGrace: results.byProductType.frenchWithGrace.quarterly[quarter]
    },
    
    // Quarterly movements
    quarterlyMovements: {
      openingBalance: previousTotal,
      netChange: total - previousTotal,
      closingBalance: total
    },
    
    // Metrics
    metrics: {
      performingRatio: results.consolidatedMetrics.performingRatio[quarter],
      defaultedImpact: results.consolidatedMetrics.defaultedImpact[quarter],
      quarterlyGrowthRate: results.changeAnalysis.quarterlyGrowthRates?.[quarter] || 0,
      yearOverYearGrowth: results.changeAnalysis.yearOverYearGrowth?.[quarter] || 0
    },
    
    // Reconciliation
    reconciliation: {
      totalStockNBV: results.reconciliation.totalStockNBV[quarter],
      gbvDefaulted: results.reconciliation.gbvDefaulted[quarter],
      recoveries: results.reconciliation.recoveries[quarter],
      stockNBVPerforming: results.reconciliation.stockNBVPerforming[quarter]
    }
  };
};