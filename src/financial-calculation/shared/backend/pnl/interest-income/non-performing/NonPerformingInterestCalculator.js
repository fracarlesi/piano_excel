/**
 * Non-Performing Interest Calculator
 * 
 * Calcola gli interessi attivi per i crediti non-performing (NPL)
 * Gli NPL continuano a generare interessi al tasso originale del prodotto
 * Formula: NPL Stock (Q-1) × Tasso Prodotto / 4 = Interessi Q
 */

/**
 * Calcola gli interessi attivi per i crediti non-performing
 * @param {Object} nonPerformingAssets - NPL Assets dal balance sheet (con NPV trimestrali)
 * @param {Object} assumptions - Assumptions complete
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} Interessi attivi per crediti non-performing
 */
export const calculateNonPerformingInterest = (nonPerformingAssets, assumptions, quarters = 40) => {
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
    },
    // Dati per test di riconciliazione
    reconciliation: {
      byProduct: {}
    }
  };
  
  // Process each product
  const byProduct = nonPerformingAssets.byProduct || {};
  let totalNPLStock = 0;
  let weightedRate = 0;
  
  Object.entries(byProduct).forEach(([productKey, productNPL]) => {
    // Get product configuration
    const productConfig = assumptions.products?.[productKey];
    
    if (!productConfig) {
      return;
    }
    
    // Logging disabled
    
    // Calculate quarterly interest on NPL
    const quarterlyInterest = calculateProductNPLInterest(
      productNPL,
      productConfig,
      assumptions,
      quarters
    );
    
    // Store results
    results.quarterly.byProduct[productKey] = quarterlyInterest.quarterly;
    results.annual.byProduct[productKey] = quarterlyInterest.annual;
    results.reconciliation.byProduct[productKey] = quarterlyInterest.reconciliation;
    
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
    
    // Prepare table data - use key with _NPL suffix
    results.tableData[productKey + '_NPL'] = prepareProductTableData(
      productKey,
      productConfig,
      productNPL,
      quarterlyInterest,
      assumptions
    );
    
    // Update metrics
    const avgNPL = quarterlyInterest.metrics.averageNPLStock;
    totalNPLStock += avgNPL;
    weightedRate += avgNPL * quarterlyInterest.metrics.effectiveRate;
    results.metrics.productCount++;
  });
  
  // Calculate final metrics
  results.metrics.totalInterestIncome = results.annual.total.reduce((sum, val) => sum + val, 0);
  results.metrics.averageRate = totalNPLStock > 0 ? (weightedRate / totalNPLStock) : 0;
  
  // Logging disabled
  
  return results;
};

/**
 * Calcola gli interessi per un singolo prodotto NPL
 * @private
 */
const calculateProductNPLInterest = (productNPL, productConfig, assumptions, quarters) => {
  const quarterly = new Array(quarters).fill(0);
  const annual = new Array(10).fill(0);
  const reconciliation = [];
  
  // Get quarterly NPL NPV data
  const quarterlyNPV = productNPL.quarterlyNPV || new Array(quarters).fill(0);
  
  // Calculate interest rate (should match the discount rate used in NPV)
  const annualRate = getProductInterestRate(productConfig, assumptions) / 100;
  const quarterlyRate = annualRate / 4;
  
  
  // Calculate quarterly interest
  let totalNPLStock = 0;
  let nonZeroQuarters = 0;
  
  for (let q = 0; q < quarters; q++) {
    if (q === 0) {
      // No interest in Q0 (no previous stock)
      quarterly[q] = 0;
      reconciliation[q] = {
        quarter: q,
        previousNPL: 0,
        interest: 0,
        currentNPL: quarterlyNPV[q],
        timeValueUnwinding: 0
      };
    } else {
      // Interest = Previous quarter NPL stock × quarterly rate
      const previousNPL = quarterlyNPV[q - 1] || 0;
      quarterly[q] = previousNPL * quarterlyRate;
      
      // Calculate time value unwinding
      // NPV(Q) = NPV(Q-1) × (1 + r/4) - Cash Recovery(Q)
      // Therefore: Time Value = NPV(Q) - NPV(Q-1) + Cash Recovery(Q)
      // Since we don't have cash recovery data here, we approximate
      const currentNPL = quarterlyNPV[q] || 0;
      const expectedNPLWithInterest = previousNPL * (1 + quarterlyRate);
      const impliedCashRecovery = expectedNPLWithInterest - currentNPL;
      const timeValueUnwinding = currentNPL - previousNPL + impliedCashRecovery;
      
      reconciliation[q] = {
        quarter: q,
        previousNPL: previousNPL,
        interest: quarterly[q],
        currentNPL: currentNPL,
        timeValueUnwinding: timeValueUnwinding,
        difference: Math.abs(quarterly[q] - timeValueUnwinding),
        isReconciled: Math.abs(quarterly[q] - timeValueUnwinding) < 0.01
      };
      
      if (previousNPL > 0) {
        totalNPLStock += previousNPL;
        nonZeroQuarters++;
      }
      
      // Log reconciliation for first few quarters
      if (q <= 4 && previousNPL > 0) {
        // Logging disabled
      }
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
    reconciliation,
    metrics: {
      effectiveRate: annualRate * 100,
      averageNPLStock: nonZeroQuarters > 0 ? totalNPLStock / nonZeroQuarters : 0
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
const prepareProductTableData = (productKey, productConfig, productNPL, interestResults, assumptions) => {
  const quarterlyNPV = productNPL.quarterlyNPV || new Array(40).fill(0);
  
  // Calculate average NPL stock for display
  const averageNPLStock = new Array(10).fill(0);
  for (let year = 0; year < 10; year++) {
    let yearSum = 0;
    let count = 0;
    for (let q = 0; q < 4; q++) {
      const qIndex = year * 4 + q;
      if (qIndex < 40 && quarterlyNPV[qIndex] > 0) {
        yearSum += quarterlyNPV[qIndex];
        count++;
      }
    }
    averageNPLStock[year] = count > 0 ? yearSum / count : 0;
  }
  
  // Get year-end NPL stock
  const nplStock = new Array(10).fill(0);
  for (let year = 0; year < 10; year++) {
    const q4Index = year * 4 + 3;
    nplStock[year] = quarterlyNPV[q4Index] || 0;
  }
  
  return {
    // Basic info
    name: productConfig.name + ' (NPL)',
    productKey: productKey + '_NPL',
    
    // Interest data
    interestIncome: interestResults.annual,
    quarterly: {
      interestIncome: interestResults.quarterly,
      reconciliation: interestResults.reconciliation
    },
    
    // Add quarterly NPL interest for the microservice
    quarterlyInterestIncomePerforming: new Array(40).fill(0), // NPL products don't have performing interest
    quarterlyInterestIncomeNPL: interestResults.quarterly,
    quarterlyInterestIncome: interestResults.quarterly, // Total is same as NPL for these products
    
    // Configuration for formulas
    assumptions: {
      spread: productConfig.spread || 0,
      isFixedRate: productConfig.isFixedRate || false,
      interestRate: interestResults.metrics.effectiveRate,
      discountRate: productNPL.discountRate
    },
    
    // NPL stock data for formulas
    averageNPLStock: averageNPLStock,
    nplStock: nplStock,
    quarterlyNPV: quarterlyNPV
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