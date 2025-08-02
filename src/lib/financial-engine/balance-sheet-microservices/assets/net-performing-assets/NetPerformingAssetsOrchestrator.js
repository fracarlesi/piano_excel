/**
 * Net Performing Assets Orchestrator
 * 
 * ORCHESTRATORE che coordina il calcolo dei Net Performing Assets
 * che sono uguali allo Stock NBV Performing
 */

import { 
  calculateProductNetPerforming,
  calculateByProductType,
  calculateQuarterlyChanges,
  formatNetPerformingForBalanceSheet 
} from './NetPerformingAssetsCalculator.js';

/**
 * Calcola Net Performing Assets per tutti i prodotti
 * @param {Object} stockNBVPerformingResults - Risultati Stock NBV Performing dal StockNBVPerformingOrchestrator
 * @param {Object} divisions - Dati divisioni con prodotti
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Risultati Net Performing Assets completi
 */
export const calculateNetPerformingAssets = (stockNBVPerformingResults, divisions, quarters = 40) => {
  console.log('📊 Net Performing Assets Calculator - Start');
  console.log('  - Stock NBV Performing available:', !!stockNBVPerformingResults);
  
  const results = {
    // RIGA PRINCIPALE BALANCE SHEET
    balanceSheetLine: {
      name: 'Net Performing Assets',
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
      totalNetPerforming: new Array(quarters).fill(0),
      averageNetPerforming: 0,
      growthRate: 0,
      nplRatio: new Array(quarters).fill(0)
    },
    
    // ANALISI VARIAZIONI
    changeAnalysis: {
      quarterlyChanges: new Array(quarters).fill(0),
      quarterlyGrowthRates: new Array(quarters).fill(0),
      cumulativeGrowth: new Array(quarters).fill(0),
      yearOverYearGrowth: new Array(quarters).fill(0)
    }
  };
  
  // Step 1: Calcola Net Performing per ogni prodotto (usando Stock NBV Performing)
  if (stockNBVPerformingResults && stockNBVPerformingResults.byProduct) {
    Object.entries(stockNBVPerformingResults.byProduct).forEach(([productKey, productData]) => {
      console.log(`\n🔍 Processing product: ${productKey}`);
      
      // Get Stock NBV Performing data
      const stockNBVPerforming = productData.quarterly || new Array(quarters).fill(0);
      
      console.log(`  - Stock NBV Performing Q0: €${stockNBVPerforming[0]?.toFixed(1)}M`);
      
      // Net Performing = Stock NBV Performing
      const netPerforming = calculateProductNetPerforming(stockNBVPerforming, quarters);
      
      console.log(`  - Net Performing Q0: €${netPerforming[0]?.toFixed(1)}M`);
      
      // Store product results
      results.byProduct[productKey] = {
        productName: productData.productName || productKey,
        productType: productData.productType,
        quarterly: netPerforming,
        stockNBVPerforming: stockNBVPerforming
      };
      
      // Aggregate to total
      netPerforming.forEach((value, q) => {
        results.balanceSheetLine.quarterly[q] += value;
        results.consolidatedMetrics.totalNetPerforming[q] += value;
      });
      
      // Aggregate by product type
      const productType = productData.productType || 'bridgeLoans';
      if (results.byProductType[productType]) {
        netPerforming.forEach((value, q) => {
          results.byProductType[productType].quarterly[q] += value;
        });
      }
    });
  }
  
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
  const totalSum = results.consolidatedMetrics.totalNetPerforming.reduce((sum, val) => sum + val, 0);
  const nonZeroQuarters = results.consolidatedMetrics.totalNetPerforming.filter(val => val > 0).length;
  
  results.consolidatedMetrics.averageNetPerforming = nonZeroQuarters > 0 ? totalSum / nonZeroQuarters : 0;
  
  // Calculate growth rate (CAGR)
  const firstValue = results.consolidatedMetrics.totalNetPerforming.find(val => val > 0) || 0;
  const lastValue = results.consolidatedMetrics.totalNetPerforming[quarters - 1] || 0;
  
  if (firstValue > 0 && lastValue > 0) {
    const periods = quarters / 4; // Convert to years
    results.consolidatedMetrics.growthRate = (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
  }
  
  // Calculate NPL ratio for each quarter (not applicable anymore as we don't have totalNBV here)
  // This metric will be calculated at a higher level
  
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
  
  console.log('\n📊 Net Performing Assets Calculator - Summary');
  console.log(`  - Total products processed: ${Object.keys(results.byProduct).length}`);
  console.log(`  - Average Net Performing: €${results.consolidatedMetrics.averageNetPerforming.toFixed(1)}M`);
  console.log(`  - Growth rate (CAGR): ${results.consolidatedMetrics.growthRate.toFixed(2)}%`);
  console.log(`  - Net Performing Q0: €${results.balanceSheetLine.quarterly[0].toFixed(1)}M`);
  console.log(`  - Net Performing Q${quarters-1}: €${results.balanceSheetLine.quarterly[quarters-1].toFixed(1)}M`);
  
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
 * @param {Object} results - Net Performing Assets results
 * @param {number} quarter - Quarter index
 * @returns {Object} Formatted data for Balance Sheet
 */
export const getNetPerformingBalanceSheetData = (results, quarter) => {
  const total = results.balanceSheetLine.quarterly[quarter];
  const previousTotal = quarter > 0 ? results.balanceSheetLine.quarterly[quarter - 1] : 0;
  
  return {
    // Main line
    mainLine: {
      label: 'Net Performing Assets',
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
      nplRatio: results.consolidatedMetrics.nplRatio[quarter],
      quarterlyGrowthRate: results.changeAnalysis.quarterlyGrowthRates?.[quarter] || 0,
      yearOverYearGrowth: results.changeAnalysis.yearOverYearGrowth?.[quarter] || 0
    }
  };
};