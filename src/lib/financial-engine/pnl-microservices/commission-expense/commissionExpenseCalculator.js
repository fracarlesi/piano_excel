/**
 * Commission Expense Calculator
 * 
 * Calcola le commissioni passive sui prodotti creditizi
 * Basato sui nuovi volumi erogati e il commission expense rate globale
 */

import { 
  ALL_DIVISION_PREFIXES,
  BUSINESS_DIVISION_PREFIXES
} from '../../divisionMappings.js';

/**
 * Calcola le commissioni passive
 * @param {Object} balanceSheetResults - Risultati del balance sheet
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Commissioni passive per trimestre e anno
 */
export const calculateCommissionExpense = (balanceSheetResults, assumptions, quarters = 40) => {
  const results = {
    quarterly: {
      total: new Array(quarters).fill(0),
      byDivision: {
        re: new Array(quarters).fill(0),
        sme: new Array(quarters).fill(0),
        wealth: new Array(quarters).fill(0),
        digital: new Array(quarters).fill(0)
      },
      byProduct: {}
    },
    annual: {
      total: new Array(10).fill(0),
      byDivision: {
        re: new Array(10).fill(0),
        sme: new Array(10).fill(0),
        wealth: new Array(10).fill(0),
        digital: new Array(10).fill(0)
      },
      byProduct: {}
    },
    tableData: {
      quarterly: {},
      annual: {}
    },
    metrics: {
      totalCommissionExpense: 0,
      effectiveCommissionExpenseRate: 0,
      productCount: 0,
      commissionsByProduct: {}
    }
  };

  // Verifica che esistano i dati sui nuovi volumi
  if (!balanceSheetResults?.newVolumes?.byProduct) {
    console.warn('❌ Commission Expense Calculator: No new volumes data found in balance sheet results');
    console.log('balanceSheetResults keys:', Object.keys(balanceSheetResults || {}));
    return results;
  }
  
  console.log('✅ Commission Expense Calculator: Starting calculation with volumes:', 
    Object.keys(balanceSheetResults.newVolumes.byProduct));

  const newVolumesByProduct = balanceSheetResults.newVolumes.byProduct;
  let totalVolumes = 0;
  let totalCommissions = 0;
  let productCount = 0;

  console.log('💰 Commission Expense Calculator - Available volume keys:', Object.keys(newVolumesByProduct));
  console.log('💰 Commission Expense Calculator - Product structure:', Object.keys(assumptions.products || {}));

  // Process each product directly from assumptions.products
  Object.entries(assumptions.products || {}).forEach(([productKey, productConfig]) => {
      
    // Skip non-credit products
    if (!isCreditProduct(productConfig)) return;

    // Get commission expense rate from product config (default to 0 if not specified)
    const commissionExpenseRate = productConfig.commissionExpenseRate || 0;
    
    // Get new volumes for this product
    const productVolumes = newVolumesByProduct[productKey];
    if (!productVolumes || !productVolumes.quarterlyVolumes) {
      console.warn(`No volume data found for product ${productKey}`);
      return;
    }
    
    console.log(`📊 Product ${productKey}:`, {
      commissionExpenseRate,
      hasVolumes: productVolumes.quarterlyVolumes.some(v => v > 0),
      firstQuarterVolume: productVolumes.quarterlyVolumes[0]
    });

    // Determine division from product key
    const divisionCode = productKey.startsWith('re') ? 're' : 
                        productKey.startsWith('sme') ? 'sme' :
                        productKey.startsWith('wealth') ? 'wealth' :
                        productKey.startsWith('digital') ? 'digital' : null;

    // Initialize product arrays
    results.quarterly.byProduct[productKey] = new Array(quarters).fill(0);
    results.annual.byProduct[productKey] = new Array(10).fill(0);

    // Calculate quarterly commission expenses
    productVolumes.quarterlyVolumes.forEach((volume, q) => {
      // Commission expense = volume * commission expense rate (as percentage) - NEGATIVE because it's a cost
      const commissionExpense = -volume * (commissionExpenseRate / 100);
      
      // Add to product total
      results.quarterly.byProduct[productKey][q] = commissionExpense;
      
      // Add to division total
      if (divisionCode && results.quarterly.byDivision[divisionCode]) {
        results.quarterly.byDivision[divisionCode][q] += commissionExpense;
      }
      
      // Add to overall total
      results.quarterly.total[q] += commissionExpense;
      
      totalVolumes += volume;
      totalCommissions += commissionExpense;
    });

    // Calculate annual commission expenses
    for (let year = 0; year < 10; year++) {
      let annualCommissionExpense = 0;
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        if (quarterIndex < quarters) {
          annualCommissionExpense += results.quarterly.byProduct[productKey][quarterIndex];
        }
      }
      results.annual.byProduct[productKey][year] = annualCommissionExpense;
      
      // Add to division annual
      if (divisionCode && results.annual.byDivision[divisionCode]) {
        results.annual.byDivision[divisionCode][year] += annualCommissionExpense;
      }
      
      // Add to total annual
      results.annual.total[year] += annualCommissionExpense;
    }

    // Store metrics for this product
    results.metrics.commissionsByProduct[productKey] = {
      name: productConfig.name,
      commissionExpenseRate: commissionExpenseRate,
      totalVolume: productVolumes.metrics?.totalVolume || 0,
      totalCommissionExpense: results.quarterly.byProduct[productKey].reduce((sum, val) => sum + val, 0)
    };

    productCount++;
  });

  // Calculate overall metrics
  results.metrics.totalCommissionExpense = totalCommissions;
  results.metrics.effectiveCommissionExpenseRate = totalVolumes > 0 ? (totalCommissions / totalVolumes) * 100 : 0;
  results.metrics.productCount = productCount;

  // Prepare table data for UI
  results.tableData = prepareTableData(results, assumptions);
  
  // Add byProduct at top level for easier access
  results.byProduct = results.quarterly.byProduct;

  console.log('💰 Commission Expense Calculator Results:', {
    totalCommissionExpense: totalCommissions,
    productCount,
    quarterlyTotal: results.quarterly.total.slice(0, 4),
    byDivision: Object.keys(results.quarterly.byDivision).map(div => ({
      division: div,
      firstYearTotal: results.quarterly.byDivision[div].slice(0, 4).reduce((a, b) => a + b, 0)
    })),
    productKeys: Object.keys(results.byProduct)
  });

  return results;
};

/**
 * Check if product is a credit product
 * @private
 */
const isCreditProduct = (product) => {
  return product.productType === 'Credit' || 
         product.type === 'french' ||
         product.type === 'bullet' ||
         product.type === 'bridge' ||
         !product.productType;
};

/**
 * Prepare data for table visualization
 * @private
 */
const prepareTableData = (results, assumptions) => {
  const tableData = {
    quarterly: [],
    annual: []
  };

  // Quarterly data - show first 20 quarters (5 years)
  for (let q = 0; q < Math.min(20, results.quarterly.total.length); q++) {
    const quarter = {
      period: `Q${(q % 4) + 1} Y${Math.floor(q / 4) + 1}`,
      total: results.quarterly.total[q],
      byDivision: {}
    };

    Object.keys(results.quarterly.byDivision).forEach(div => {
      quarter.byDivision[div] = results.quarterly.byDivision[div][q];
    });

    tableData.quarterly.push(quarter);
  }

  // Annual data
  for (let y = 0; y < 10; y++) {
    const year = {
      period: `Year ${y + 1}`,
      total: results.annual.total[y],
      byDivision: {}
    };

    Object.keys(results.annual.byDivision).forEach(div => {
      year.byDivision[div] = results.annual.byDivision[div][y];
    });

    tableData.annual.push(year);
  }

  return tableData;
};