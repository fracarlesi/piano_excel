/**
 * Stock NBV Performing Post-ECL Calculator
 * 
 * Calcola lo Stock NBV Performing al netto delle ECL provisions
 * Stock NBV Performing Post-ECL = Stock NBV Performing - ECL Provision
 */

/**
 * Calcola Stock NBV Performing Post-ECL
 * @param {Object} stockNBVPerformingResults - Stock NBV Performing results
 * @param {Object} eclResults - ECL provision results
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Stock NBV Performing Post-ECL results
 */
export const calculateStockNBVPerformingPostECL = (stockNBVPerformingResults, eclResults, quarters = 40) => {
  console.log('📊 Stock NBV Performing Post-ECL Calculator - Start');
  console.log('  - Stock NBV Performing data available:', !!stockNBVPerformingResults);
  console.log('  - ECL Results data available:', !!eclResults);
  
  const results = {
    // Main balance sheet line
    balanceSheetLine: {
      name: 'Stock NBV Performing Post-ECL',
      quarterly: new Array(quarters).fill(0),
      annual: new Array(10).fill(0)
    },
    
    // Components for reconciliation
    components: {
      stockNBVPerforming: new Array(quarters).fill(0),
      eclProvision: new Array(quarters).fill(0),
      stockNBVPostECL: new Array(quarters).fill(0)
    },
    
    // By product breakdown
    byProduct: {},
    
    // By division breakdown
    byDivision: {},
    
    // Metrics
    metrics: {
      averageECLImpact: 0,
      finalStockPostECL: 0,
      eclCoverageRatio: 0
    }
  };
  
  // Get consolidated data
  const stockNBVPerforming = stockNBVPerformingResults?.balanceSheetLine?.quarterly || new Array(quarters).fill(0);
  const eclProvision = eclResults?.details?.consolidated?.quarterlyProvision || new Array(quarters).fill(0);
  
  console.log('🔍 Post-ECL Debug:');
  console.log(`  - Stock NBV Q0: €${stockNBVPerforming[0]?.toFixed(1) || 0}M`);
  console.log(`  - ECL Provision Q0: €${eclProvision[0]?.toFixed(1) || 0}M`);
  console.log(`  - Calculated Post-ECL Q0: €${(stockNBVPerforming[0] - eclProvision[0])?.toFixed(1)}M`);
  
  // Calculate Post-ECL stock for each quarter
  for (let q = 0; q < quarters; q++) {
    const stock = stockNBVPerforming[q] || 0;
    const provision = eclProvision[q] || 0;
    const postECL = stock - provision;
    
    results.balanceSheetLine.quarterly[q] = postECL;
    results.components.stockNBVPerforming[q] = stock;
    results.components.eclProvision[q] = provision;
    results.components.stockNBVPostECL[q] = postECL;
  }
  
  // Calculate annual values
  for (let year = 0; year < 10; year++) {
    const yearEndQuarter = Math.min(year * 4 + 3, quarters - 1);
    results.balanceSheetLine.annual[year] = results.balanceSheetLine.quarterly[yearEndQuarter];
  }
  
  // Process by product
  if (stockNBVPerformingResults?.byProduct && eclResults?.details?.byProduct) {
    Object.keys(stockNBVPerformingResults.byProduct).forEach(productKey => {
      const productStock = stockNBVPerformingResults.byProduct[productKey];
      const productECL = eclResults.details.byProduct[productKey];
      
      if (productStock && productECL) {
        const quarterlyPostECL = new Array(quarters).fill(0);
        
        for (let q = 0; q < quarters; q++) {
          const stock = productStock.quarterly?.[q] || 0;
          const provision = productECL.quarterlyProvision?.[q] || 0;
          quarterlyPostECL[q] = stock - provision;
        }
        
        results.byProduct[productKey] = {
          productName: productStock.productName,
          quarterly: quarterlyPostECL,
          stockNBVPerforming: productStock.quarterly || new Array(quarters).fill(0),
          eclProvision: productECL.quarterlyProvision || new Array(quarters).fill(0),
          eclRate: productECL.dangerRate * productECL.lgdEffective
        };
      }
    });
  }
  
  // Process by division - using actual product keys from defaultAssumptions.js
  const divisionMap = {
    're': ['reSecuritization', 'reMortgage', 'reBridge', 'reTest1'],
    'sme': ['smeRefinancing', 'smeBridge', 'smeSpecialSituation', 'smeNuovaFinanza', 'smeRestructuring'],
    'wealth': [], // No wealth products defined yet
    'incentive': [], // No incentive products defined yet  
    'digital': [] // No digital credit products (digitalRetailCustomer is deposit)
  };
  
  Object.entries(divisionMap).forEach(([divKey, products]) => {
    const divisionQuarterly = new Array(quarters).fill(0);
    const divisionStock = new Array(quarters).fill(0);
    const divisionECL = new Array(quarters).fill(0);
    const divisionAnnual = new Array(10).fill(0);
    
    products.forEach(productKey => {
      if (results.byProduct[productKey]) {
        results.byProduct[productKey].quarterly.forEach((value, q) => {
          divisionQuarterly[q] += value;
          divisionStock[q] += results.byProduct[productKey].stockNBVPerforming[q];
          divisionECL[q] += results.byProduct[productKey].eclProvision[q];
        });
      }
    });
    
    // Annual values
    for (let year = 0; year < 10; year++) {
      const yearEndQuarter = Math.min(year * 4 + 3, quarters - 1);
      divisionAnnual[year] = divisionQuarterly[yearEndQuarter];
    }
    
    results.byDivision[divKey] = {
      quarterly: divisionQuarterly,
      annual: divisionAnnual,
      stockNBVPerforming: divisionStock,
      eclProvision: divisionECL,
      products: products.filter(p => results.byProduct[p])
    };
  });
  
  // Calculate metrics
  // Use Q0 instead of final quarter to avoid negative values when all loans have matured
  results.metrics.finalStockPostECL = results.balanceSheetLine.quarterly[0];
  
  // Average ECL impact
  let totalImpact = 0;
  let count = 0;
  for (let q = 0; q < quarters; q++) {
    if (results.components.stockNBVPerforming[q] > 0) {
      const impact = results.components.eclProvision[q] / results.components.stockNBVPerforming[q];
      totalImpact += impact;
      count++;
    }
  }
  results.metrics.averageECLImpact = count > 0 ? totalImpact / count : 0;
  
  // ECL coverage ratio (Q0 - initial quarter)
  const finalStock = results.components.stockNBVPerforming[0];
  const finalECL = results.components.eclProvision[0];
  results.metrics.eclCoverageRatio = finalStock > 0 ? finalECL / finalStock : 0;
  
  console.log('📊 Stock NBV Performing Post-ECL Calculator - Summary');
  console.log(`  - Final Stock Post-ECL: €${results.metrics.finalStockPostECL.toFixed(1)}M`);
  console.log(`  - Average ECL Impact: ${(results.metrics.averageECLImpact * 100).toFixed(2)}%`);
  console.log(`  - ECL Coverage Ratio: ${(results.metrics.eclCoverageRatio * 100).toFixed(2)}%`);
  
  return results;
};

/**
 * Get formatted data for Balance Sheet display
 * @param {Object} results - Stock NBV Performing Post-ECL results
 * @param {number} quarter - Quarter index
 * @returns {Object} Formatted data for Balance Sheet
 */
export const getStockNBVPerformingPostECLBalanceSheetData = (results, quarter) => {
  const stockPostECL = results.balanceSheetLine.quarterly[quarter];
  const previousStock = quarter > 0 ? results.balanceSheetLine.quarterly[quarter - 1] : 0;
  
  return {
    // Main line
    mainLine: {
      label: 'Stock NBV Performing Post-ECL',
      value: stockPostECL,
      unit: '€M'
    },
    
    // Components breakdown
    components: {
      stockNBVPerforming: results.components.stockNBVPerforming[quarter],
      eclProvision: -results.components.eclProvision[quarter], // Show as negative
      stockNBVPostECL: stockPostECL
    },
    
    // Quarterly movements
    quarterlyMovements: {
      openingBalance: previousStock,
      netChange: stockPostECL - previousStock,
      closingBalance: stockPostECL
    },
    
    // Metrics
    metrics: {
      eclImpact: results.components.stockNBVPerforming[quarter] > 0 
        ? (results.components.eclProvision[quarter] / results.components.stockNBVPerforming[quarter]) * 100
        : 0,
      quarterlyGrowth: previousStock > 0 
        ? ((stockPostECL - previousStock) / previousStock) * 100
        : 0
    }
  };
};