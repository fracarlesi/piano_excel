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
  // Logging disabled
  
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
      return;
    }
    
    // Skip non-credit products
    if (productConfig.productType === 'DepositAndService' || productConfig.isDigital) {
      return;
    }
    
    // Logging disabled
    
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
  
  // Logging disabled
  
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
    // Logging disabled
  }
  
  // Calculate interest rate
  const annualRate = getProductInterestRate(productConfig, assumptions) / 100;
  const quarterlyRate = annualRate / 4;
  
  // Calculate quarterly interest
  let totalNPA = 0;
  let nonZeroQuarters = 0;
  
  for (let q = 0; q < quarters; q++) {
    // Use previous quarter's closing balance for interest calculation
    // (loans disbursed at end of quarter earn interest from next quarter)
    const performingAssetsForInterest = q > 0 ? (quarterlyPerforming[q - 1] || 0) : 0;
    quarterly[q] = performingAssetsForInterest * quarterlyRate;
    
    const performingAssets = quarterlyPerforming[q] || 0;
    if (performingAssets > 0) {
      totalNPA += performingAssets;
      nonZeroQuarters++;
    }
    
    // Log first few quarters for debug
    if (q < 2 && performingAssets > 0) {
      // Logging disabled
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
    
    // Add quarterly performing interest for the microservice
    quarterlyInterestIncomePerforming: interestResults.quarterly,
    quarterlyInterestIncomeNPL: new Array(40).fill(0), // Performing products don't have NPL interest
    quarterlyInterestIncome: interestResults.quarterly, // Total is same as performing for these products
    
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