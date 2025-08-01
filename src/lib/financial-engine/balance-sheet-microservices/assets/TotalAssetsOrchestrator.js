/**
 * Total Assets Orchestrator
 * 
 * Orchestratore principale per tutti gli asset creditizi
 * Usa NBV totali e coordina performing e non-performing assets
 */

import { calculateTotalNBV } from './stock-nbv/TotalNBVOrchestrator.js';
import { calculateGBVDefaulted } from './gbv-defaulted/GBVDefaultedOrchestrator.js';
import { calculateNonPerformingAssets } from './non-performing-assets/NonPerformingAssetsOrchestrator.js';
import { calculateNetPerformingAssets } from './net-performing-assets/NetPerformingAssetsOrchestrator.js';

/**
 * Calculate total assets (performing + non-performing)
 * @param {Object} divisionProducts - Products organized by division
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @param {Object} recoveryResults - Recovery results from RecoveryOrchestrator (optional)
 * @returns {Object} Complete assets results with vintages
 */
export const calculateTotalAssets = (divisionProducts, assumptions, quarters = 40, recoveryResults = null) => {
  // Step 1: Calculate total NBV (gross assets) with all vintages
  const totalNBVResults = calculateTotalNBV(divisionProducts, assumptions, quarters);
  
  // Step 2: Create enhanced division products with vintages from NBV calculation
  const divisionProductsWithVintages = enhanceDivisionProductsWithVintages(
    divisionProducts, 
    totalNBVResults.allVintages
  );
  
  // Step 3: Calculate GBV Defaulted (applying danger rate)
  const gbvDefaultedResults = calculateGBVDefaulted(
    divisionProducts,
    assumptions,
    totalNBVResults,
    quarters
  );
  
  // Step 4: Calculate non-performing assets using NPV methodology if recovery data available
  let nonPerformingResults;
  if (recoveryResults) {
    // Use advanced NPV-based calculation with recovery data
    nonPerformingResults = calculateNonPerformingAssets(
      divisionProducts,
      assumptions,
      recoveryResults,
      quarters
    );
  } else {
    // Fallback to simplified calculation based on GBV Defaulted
    nonPerformingResults = calculateNonPerformingFromGBVDefaulted(
      gbvDefaultedResults,
      quarters
    );
  }
  
  // Step 5: Calculate net performing assets using dedicated microservice
  const performingResults = calculateNetPerformingAssets(
    totalNBVResults,
    nonPerformingResults,
    divisionProducts,
    quarters
  );
  
  // Step 5: Calculate total assets
  const totalAssetsQuarterly = new Array(quarters).fill(0);
  
  for (let q = 0; q < quarters; q++) {
    totalAssetsQuarterly[q] = 
      (performingResults.balanceSheetLine.quarterly[q] || 0) +
      (nonPerformingResults.balanceSheetLine.quarterly[q] || 0);
  }
  
  return {
    // Total assets breakdown
    totalAssets: totalNBVResults.totalAssets,
    byProductType: totalNBVResults.byProductType,
    byProduct: totalNBVResults.byProduct, // Product-level NBV data
    
    // Main balance sheet lines
    netPerformingAssets: performingResults,
    gbvDefaulted: gbvDefaultedResults,
    nonPerformingAssets: nonPerformingResults,
    
    // Vintages for detailed analysis
    vintages: totalNBVResults.allVintages,
    
    // New volumes and repayments detail
    newVolumes: totalNBVResults.newVolumes,
    repayments: totalNBVResults.repayments,
    
    // Metrics
    metrics: {
      totalAssets: totalNBVResults.totalAssets.quarterly[quarters - 1] || 0,
      totalPerforming: performingResults.balanceSheetLine.quarterly[quarters - 1] || 0,
      totalNonPerforming: nonPerformingResults.balanceSheetLine.quarterly[quarters - 1] || 0,
      nplRatio: calculateNPLRatio(performingResults, nonPerformingResults, quarters - 1),
      ...totalNBVResults.metrics
    }
  };
};

/**
 * Create all vintages for all products
 * @private
 */
const createAllVintages = (divisionProducts, assumptions) => {
  const vintagesByProduct = {};
  
  Object.entries(divisionProducts).forEach(([divKey, division]) => {
    const productsToProcess = division.products || division;
    
    Object.entries(productsToProcess).forEach(([productKey, product]) => {
      const productConfig = product.originalProduct || product;
      
      // Only create vintages for credit products
      if (productConfig.productType === 'Credit' || !productConfig.productType) {
        const vintages = createVintagesForProduct(productConfig, assumptions);
        if (vintages.length > 0) {
          vintagesByProduct[productKey] = vintages;
        }
      }
    });
  });
  
  return vintagesByProduct;
};

/**
 * Create vintages for a single product
 * @private
 */
const createVintagesForProduct = (product, assumptions) => {
  const vintages = [];
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  years.forEach(year => {
    const volume = product.volumeArray?.[year] || 0;
    
    if (volume > 0) {
      // Distribute volume across quarters
      const quarterlyAllocation = product.quarterlyAllocation || [25, 25, 25, 25];
      
      for (let quarter = 0; quarter < 4; quarter++) {
        const quarterlyVolume = volume * quarterlyAllocation[quarter] / 100;
        
        if (quarterlyVolume > 0) {
          const vintage = {
            id: `${product.id || product.name}_y${year}_q${quarter}`,
            startYear: year,
            startQuarter: quarter,
            maturityYear: year + Math.floor(product.durata / 4),
            maturityQuarter: (quarter + product.durata) % 4,
            initialAmount: quarterlyVolume,
            outstandingPrincipal: quarterlyVolume,
            type: product.type || 'french',
            gracePeriod: product.gracePeriod || 0,
            
            // Interest parameters
            spread: product.spread / 100,
            fixedRate: product.isFixed,
            quarterlyRate: calculateQuarterlyRateForProduct(product, assumptions),
            
            // Product reference
            productId: product.id,
            productName: product.name,
            productType: product.type
          };
          
          // Calculate quarterly payment for french loans
          if (vintage.type === 'french' || vintage.type === 'amortizing') {
            vintage.quarterlyPayment = calculatePaymentForVintage(vintage, product);
          }
          
          vintages.push(vintage);
        }
      }
    }
  });
  
  return vintages;
};

/**
 * Calculate payment for vintage
 * @private
 */
const calculatePaymentForVintage = (vintage, product) => {
  const principal = vintage.initialAmount;
  const rate = vintage.quarterlyRate;
  const periods = product.durata;
  
  if (rate === 0) return principal / periods;
  
  return principal * rate * Math.pow(1 + rate, periods) / 
         (Math.pow(1 + rate, periods) - 1);
};

/**
 * Enhance division products with real vintages
 * @private
 */
const enhanceDivisionProductsWithVintages = (divisionProducts, vintagesByProduct) => {
  const enhanced = {};
  
  Object.entries(divisionProducts).forEach(([divKey, division]) => {
    enhanced[divKey] = {};
    
    const productsToProcess = division.products || division;
    
    Object.entries(productsToProcess).forEach(([productKey, product]) => {
      enhanced[divKey][productKey] = {
        ...product,
        originalProduct: product.originalProduct || product,
        vintages: vintagesByProduct[productKey] || []
      };
    });
  });
  
  return enhanced;
};

/**
 * Convert quarterly to annual
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
 * Calculate NPL ratio
 * @private
 */
const calculateNPLRatio = (performingResults, nonPerformingResults, quarter) => {
  const performing = performingResults.balanceSheetLine.quarterly[quarter] || 0;
  const nonPerforming = nonPerformingResults.balanceSheetLine.quarterly[quarter] || 0;
  const total = performing + nonPerforming;
  
  return total > 0 ? (nonPerforming / total) * 100 : 0;
};


/**
 * Calculate quarterly interest rate for product
 * @private
 */
const calculateQuarterlyRateForProduct = (product, assumptions) => {
  const annualRate = product.isFixed 
    ? (product.spread / 100) + 0.02  // Fixed = spread + 2%
    : (product.spread / 100) + (assumptions.euribor / 100);
  
  return annualRate / 4;
};


/**
 * Calculate non-performing assets from GBV Defaulted data (simplified)
 * @param {Object} gbvDefaultedResults - GBV Defaulted results
 * @param {number} quarters - Number of quarters
 * @returns {Object} Non-performing assets results
 */
const calculateNonPerformingFromGBVDefaulted = (gbvDefaultedResults, quarters) => {
  const results = {
    balanceSheetLine: {
      name: 'Non-Performing Assets',
      quarterly: new Array(quarters).fill(0)
    },
    byDivision: {},
    byProduct: {}
  };
  
  // Use the quarterly gross NPL as the base for non-performing assets
  // This is a simplified approach - could be enhanced with recovery calculations
  if (gbvDefaultedResults && gbvDefaultedResults.gbvDefaulted && gbvDefaultedResults.gbvDefaulted.quarterly) {
    for (let q = 0; q < quarters; q++) {
      results.balanceSheetLine.quarterly[q] = gbvDefaultedResults.gbvDefaulted.quarterly[q] || 0;
    }
  }
  
  // Copy breakdown structure from GBV Defaulted
  if (gbvDefaultedResults && gbvDefaultedResults.byDivision) {
    Object.entries(gbvDefaultedResults.byDivision).forEach(([divKey, divData]) => {
      if (divData) {
        results.byDivision[divKey] = {
          quarterly: [...(divData.quarterly || new Array(quarters).fill(0))],
          annual: quarterlyToAnnual(divData.quarterly || new Array(quarters).fill(0))
        };
      }
    });
  }
  
  if (gbvDefaultedResults && gbvDefaultedResults.byProduct) {
    Object.entries(gbvDefaultedResults.byProduct).forEach(([productKey, productData]) => {
      if (productData) {
        results.byProduct[productKey] = {
          quarterly: [...(productData.quarterlyGrossNPL || new Array(quarters).fill(0))],
          productType: productData.productType || 'unknown',
          productName: productData.productName || productKey
        };
      }
    });
  }
  
  return results;
};