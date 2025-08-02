/**
 * Asset Aggregator Microservice
 * 
 * Aggrega performing assets e NPL per fornire una vista completa
 * degli asset su cui calcolare FTP
 */

import Decimal from 'decimal.js';

/**
 * Aggrega asset performing e NPL per prodotto
 * @param {Object} creditResults - Risultati del credit calculator
 * @returns {Object} Asset aggregati per divisione e prodotto
 */
export const aggregateCreditAssets = (creditResults) => {
  console.log('📊 Asset Aggregator - Starting aggregation');
  console.log('📊 Asset Aggregator - Input structure:', {
    creditResultsKeys: Object.keys(creditResults || {}),
    hasByDivision: !!creditResults?.byDivision,
    divisionKeys: creditResults?.byDivision ? Object.keys(creditResults.byDivision) : [],
    sampleDivision: creditResults?.byDivision ? Object.keys(creditResults.byDivision['re'] || {}) : []
  });
  
  const aggregated = {
    consolidated: {
      performingAssets: new Array(40).fill(0),
      nplAssets: new Array(40).fill(0),
      totalAssets: new Array(40).fill(0)
    },
    byDivision: {}
  };
  
  // Process each division
  Object.entries(creditResults.byDivision || {}).forEach(([divKey, divData]) => {
    console.log(`🔍 Asset Aggregator - Processing division ${divKey}:`, {
      hasPerformingAssets: !!divData.performingAssets,
      hasCreditProducts: !!divData.creditProducts,
      performingAssetsLength: divData.performingAssets?.length || 0,
      firstPerformingValue: divData.performingAssets?.[0] || 0
    });
    
    aggregated.byDivision[divKey] = {
      total: {
        performingAssets: new Array(40).fill(0),
        nplAssets: new Array(40).fill(0),
        totalAssets: new Array(40).fill(0)
      },
      creditProducts: {}
    };
    
    
    // Process each product in the division
    Object.entries(divData.creditProducts || {}).forEach(([prodKey, prodData]) => {
      console.log(`    📦 Processing product ${prodKey}:`, {
        hasPerformingAssets: !!prodData.performingAssets,
        performingLength: prodData.performingAssets?.length || 0,
        firstPerforming: prodData.performingAssets?.[0] || 0,
        hasNPLStock: !!prodData.nplStock,
        firstNPL: prodData.nplStock?.[0] || 0
      });
      
      const productAggregated = {
        performingAssets: prodData.performingAssets || new Array(40).fill(0),
        nplStock: prodData.nplStock || new Array(40).fill(0),
        totalAssets: new Array(40).fill(0)
      };
      
      // Calculate total assets for each quarter
      for (let quarter = 0; quarter < 40; quarter++) {
        const performing = new Decimal(productAggregated.performingAssets[quarter] || 0);
        const npl = new Decimal(productAggregated.nplStock[quarter] || 0);
        const total = performing.plus(npl);
        
        productAggregated.totalAssets[quarter] = total.toNumber();
        
        // Add to division totals
        aggregated.byDivision[divKey].total.performingAssets[quarter] += performing.toNumber();
        aggregated.byDivision[divKey].total.nplAssets[quarter] += npl.toNumber();
        aggregated.byDivision[divKey].total.totalAssets[quarter] += total.toNumber();
        
        // Add to consolidated totals
        aggregated.consolidated.performingAssets[quarter] += performing.toNumber();
        aggregated.consolidated.nplAssets[quarter] += npl.toNumber();
        aggregated.consolidated.totalAssets[quarter] += total.toNumber();
      }
      
      aggregated.byDivision[divKey].creditProducts[prodKey] = productAggregated;
    });
  });
  
  console.log('📊 Asset Aggregator - Aggregation complete');
  console.log(`  Total assets Y1: €${aggregated.consolidated.totalAssets[0].toFixed(2)}M`);
  console.log(`  - Performing: €${aggregated.consolidated.performingAssets[0].toFixed(2)}M`);
  console.log(`  - NPL: €${aggregated.consolidated.nplAssets[0].toFixed(2)}M`);
  
  return aggregated;
};

/**
 * Get asset details for a specific product
 * @param {Object} aggregatedData - Aggregated asset data
 * @param {string} divisionKey - Division key
 * @param {string} productKey - Product key
 * @param {number} year - Year index
 * @returns {Object} Asset details for the product
 */
export const getProductAssets = (aggregatedData, divisionKey, productKey, year) => {
  const divData = aggregatedData.byDivision?.[divisionKey];
  const prodData = divData?.creditProducts?.[productKey];
  
  if (!prodData) {
    return {
      performingAssets: 0,
      nplAssets: 0,
      totalAssets: 0
    };
  }
  
  return {
    performingAssets: prodData.performingAssets[year] || 0,
    nplAssets: prodData.nplStock[year] || 0,
    totalAssets: prodData.totalAssets[year] || 0
  };
};