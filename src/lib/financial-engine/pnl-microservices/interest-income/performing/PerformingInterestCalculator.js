/**
 * Performing Interest Calculator
 * 
 * Calcola gli interessi attivi per i crediti performing (in bonis)
 * basandosi sui Net Performing Assets e sui tassi dei prodotti
 */

/**
 * Calcola gli interessi attivi per i crediti performing
 * @param {Object} netPerformingAssets - Net Performing Assets dal balance sheet
 * @param {Object} assumptions - Assumptions complete
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Interessi attivi per crediti performing
 */
export const calculatePerformingInterest = (netPerformingAssets, assumptions, quarters = 40) => {
  console.log('  📈 Performing Interest Calculator - Start');
  console.log('    - NPA data available:', !!netPerformingAssets);
  console.log('    - NPA byProduct keys:', Object.keys(netPerformingAssets?.byProduct || {}));
  console.log('    - Assumptions products keys:', Object.keys(assumptions?.products || {}));
  
  const results = {
    quarterly: {
      total: new Array(quarters).fill(0),
      byDivision: initializeDivisionArrays(quarters),
      byProduct: {}
    },
    annual: {
      total: new Array(10).fill(0),
      byDivision: initializeDivisionArrays(10),
      byProduct: {}
    },
    tableData: {},
    metrics: {
      totalInterestIncome: 0,
      averageRate: 0,
      productCount: 0
    }
  };
  
  // Process each product
  const byProduct = netPerformingAssets.byProduct || {};
  let totalNPA = 0;
  let weightedRate = 0;
  
  Object.entries(byProduct).forEach(([productKey, productPerformingAssets]) => {
    // Get product configuration
    const productConfig = assumptions.products?.[productKey];
    
    if (!productConfig) {
      console.error(`    ❌ No configuration found for product: ${productKey}`);
      console.error(`       Available products in assumptions:`, Object.keys(assumptions.products || {}));
      console.error(`       This product will have ZERO interest income!`);
      return;
    }
    
    // Skip non-credit products
    if (productConfig.productType === 'DepositAndService' || productConfig.isDigital) {
      return;
    }
    
    console.log(`    Processing: ${productKey} (${productConfig.name})`);
    console.log(`      - Spread: ${productConfig.spread}%`);
    console.log(`      - Euribor: ${assumptions.euribor}%`);
    
    // Calculate quarterly interest
    const quarterlyInterest = calculateProductInterest(
      productPerformingAssets,
      productConfig,
      assumptions,
      quarters
    );
    
    // Store results
    results.quarterly.byProduct[productKey] = quarterlyInterest.quarterly;
    results.annual.byProduct[productKey] = quarterlyInterest.annual;
    
    // Aggregate to totals
    quarterlyInterest.quarterly.forEach((value, q) => {
      results.quarterly.total[q] += value;
    });
    
    quarterlyInterest.annual.forEach((value, y) => {
      results.annual.total[y] += value;
    });
    
    // Aggregate by division
    const division = getDivisionFromProduct(productKey);
    if (division) {
      quarterlyInterest.quarterly.forEach((value, q) => {
        results.quarterly.byDivision[division][q] += value;
      });
      
      quarterlyInterest.annual.forEach((value, y) => {
        results.annual.byDivision[division][y] += value;
      });
    }
    
    // Prepare table data
    results.tableData[productKey] = prepareProductTableData(
      productKey,
      productConfig,
      productPerformingAssets,
      quarterlyInterest,
      assumptions
    );
    
    // Update metrics
    const avgPerforming = quarterlyInterest.metrics.averagePerforming;
    totalNPA += avgPerforming;
    weightedRate += avgPerforming * quarterlyInterest.metrics.effectiveRate;
    results.metrics.productCount++;
  });
  
  // Calculate final metrics
  results.metrics.totalInterestIncome = results.annual.total.reduce((sum, val) => sum + val, 0);
  results.metrics.averageRate = totalNPA > 0 ? (weightedRate / totalNPA) : 0;
  
  console.log(`  📈 Performing Interest - Complete`);
  console.log(`    - Products processed: ${results.metrics.productCount}`);
  console.log(`    - Total Y1 interest: €${results.annual.total[0].toFixed(2)}M`);
  console.log(`    - Average rate: ${results.metrics.averageRate.toFixed(2)}%`);
  
  return results;
};

/**
 * Calcola gli interessi per un singolo prodotto
 * @private
 */
const calculateProductInterest = (productPerformingAssets, productConfig, assumptions, quarters) => {
  const quarterly = new Array(quarters).fill(0);
  const annual = new Array(10).fill(0);
  
  // Get quarterly performing assets data
  const quarterlyPerforming = productPerformingAssets.quarterly || productPerformingAssets || new Array(quarters).fill(0);
  
  // Debug: Check what we're getting
  if (productConfig.name && quarterlyPerforming[0] !== undefined) {
    console.log(`      - Performing data type: ${Array.isArray(quarterlyPerforming) ? 'Array' : typeof quarterlyPerforming}`);
    console.log(`      - First 4 quarters Performing: [${quarterlyPerforming.slice(0,4).map(v => v?.toFixed(1) || '0').join(', ')}]`);
  }
  
  // Calculate interest rate
  const annualRate = getProductInterestRate(productConfig, assumptions) / 100;
  const quarterlyRate = annualRate / 4;
  
  // Calculate quarterly interest
  let totalNPA = 0;
  let nonZeroQuarters = 0;
  
  for (let q = 0; q < quarters; q++) {
    const performingAssets = quarterlyPerforming[q] || 0;
    quarterly[q] = performingAssets * quarterlyRate;
    
    if (performingAssets > 0) {
      totalNPA += performingAssets;
      nonZeroQuarters++;
    }
    
    // Log first quarter for debug
    if (q === 0 && performingAssets > 0) {
      console.log(`      - Q1 Performing: €${performingAssets.toFixed(2)}M`);
      console.log(`      - Quarterly rate: ${(quarterlyRate * 100).toFixed(4)}%`);
      console.log(`      - Q1 Interest: €${quarterly[q].toFixed(2)}M`);
    }
  }
  
  // Aggregate to annual
  for (let year = 0; year < 10; year++) {
    for (let q = 0; q < 4; q++) {
      const qIndex = year * 4 + q;
      if (qIndex < quarters) {
        annual[year] += quarterly[qIndex];
      }
    }
  }
  
  return {
    quarterly,
    annual,
    metrics: {
      effectiveRate: annualRate * 100,
      averagePerforming: nonZeroQuarters > 0 ? totalNPA / nonZeroQuarters : 0
    }
  };
};

/**
 * Calcola il tasso di interesse per un prodotto
 * @private
 */
const getProductInterestRate = (product, assumptions) => {
  if (product.isFixedRate) {
    return product.spread + 2.0; // Fixed rate formula
  }
  return assumptions.euribor + product.spread;
};

/**
 * Prepara i dati per la visualizzazione nella tabella
 * @private
 */
const prepareProductTableData = (productKey, productConfig, productPerformingAssets, interestResults, assumptions) => {
  const quarterlyPerforming = productPerformingAssets.quarterly || productPerformingAssets || new Array(40).fill(0);
  
  // Calculate average performing assets for display
  const averagePerformingAssets = new Array(10).fill(0);
  for (let year = 0; year < 10; year++) {
    let yearSum = 0;
    let count = 0;
    for (let q = 0; q < 4; q++) {
      const qIndex = year * 4 + q;
      if (qIndex < 40 && quarterlyPerforming[qIndex] > 0) {
        yearSum += quarterlyPerforming[qIndex];
        count++;
      }
    }
    averagePerformingAssets[year] = count > 0 ? yearSum / count : 0;
  }
  
  // Get year-end performing assets
  const performingAssets = new Array(10).fill(0);
  for (let year = 0; year < 10; year++) {
    const q4Index = year * 4 + 3;
    performingAssets[year] = quarterlyPerforming[q4Index] || 0;
  }
  
  return {
    // Basic info
    name: productConfig.name,
    productKey: productKey,
    
    // Interest data
    interestIncome: interestResults.annual,
    quarterly: {
      interestIncome: interestResults.quarterly
    },
    
    // Configuration for formulas
    assumptions: {
      spread: productConfig.spread || 0,
      isFixedRate: productConfig.isFixedRate || false,
      interestRate: interestResults.metrics.effectiveRate
    },
    
    // Balance sheet data for formulas
    averagePerformingAssets: averagePerformingAssets,
    performingAssets: performingAssets
  };
};

/**
 * Determina la divisione dal nome del prodotto
 * @private
 */
const getDivisionFromProduct = (productKey) => {
  const key = productKey.toLowerCase();
  
  if (key.startsWith('re')) return 'realEstate';
  if (key.startsWith('sme')) return 'sme';
  if (key.startsWith('wealth')) return 'wealth';
  if (key.startsWith('incentive')) return 'incentive';
  
  return null;
};

/**
 * Inizializza gli array per divisione
 * @private
 */
const initializeDivisionArrays = (length) => {
  return {
    realEstate: new Array(length).fill(0),
    sme: new Array(length).fill(0),
    wealth: new Array(length).fill(0),
    incentive: new Array(length).fill(0),
    digitalBanking: new Array(length).fill(0),
    central: new Array(length).fill(0),
    treasury: new Array(length).fill(0)
  };
};