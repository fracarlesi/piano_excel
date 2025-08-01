/**
 * Performing Assets Calculator Microservice
 * 
 * Responsible for calculating all performing assets (loans) across all products and divisions
 * This is a Balance Sheet line item microservice
 */

import { calculateNetPerformingAssets } from './loan-calculators/netPerformingAssetsCalculator.js';

/**
 * Main entry point for Performing Assets calculation
 * @param {Object} divisions - All division data with their products
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Performing assets by division and consolidated
 */
export const calculatePerformingAssets = (divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    byProduct: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0)
    },
    byProductType: {
      mortgages: new Array(10).fill(0),
      corporateLoans: new Array(10).fill(0),
      bridgeLoans: new Array(10).fill(0),
      otherLoans: new Array(10).fill(0)
    },
    metrics: {
      averageMaturity: new Array(10).fill(0),
      averageRate: new Array(10).fill(0),
      concentration: {} // Top exposures
    }
  };

  // Process each division
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionAssets = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      products: {}
    };

    // Process credit products
    if (division.products) {
      Object.entries(division.products).forEach(([productKey, product]) => {
        if (product.productType === 'Credit' || !product.productType) {
          const productAssets = calculateProductPerformingAssets(product, assumptions, years);
          
          if (productAssets) {
            // Store product-level results
            divisionAssets.products[productKey] = productAssets;
            results.byProduct[productKey] = productAssets;

            // Aggregate to division level
            productAssets.annual.forEach((value, i) => {
              divisionAssets.annual[i] += value;
              results.consolidated.annual[i] += value;
              
              // Track by product type
              const productType = categorizeProduct(product);
              if (results.byProductType[productType]) {
                results.byProductType[productType][i] += value;
              }
            });

            productAssets.quarterly.forEach((value, i) => {
              divisionAssets.quarterly[i] += value;
              results.consolidated.quarterly[i] += value;
            });
          }
        }
      });
    }

    // Use pre-calculated balance sheet data if available
    if (division.bs?.performingAssets) {
      divisionAssets.annual = division.bs.performingAssets;
      
      // Add to consolidated if not already done
      if (Object.keys(divisionAssets.products).length === 0) {
        division.bs.performingAssets.forEach((value, i) => {
          results.consolidated.annual[i] += value;
        });
      }
    }

    // Use quarterly data if available
    if (division.bs?.quarterly?.performingAssets) {
      divisionAssets.quarterly = division.bs.quarterly.performingAssets;
      
      // Add to consolidated quarterly if not already done
      if (Object.keys(divisionAssets.products).length === 0) {
        division.bs.quarterly.performingAssets.forEach((value, i) => {
          results.consolidated.quarterly[i] += value;
        });
      }
    }

    results.byDivision[divisionKey] = divisionAssets;
  });

  // Calculate metrics
  calculatePerformingAssetMetrics(results, divisions, years);

  return results;
};

/**
 * Calculate performing assets for a specific product
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Performing assets details
 */
const calculateProductPerformingAssets = (product, assumptions, years) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    details: {
      productName: product.name,
      productType: product.type || 'french',
      averageMaturity: product.durata / 4, // Convert quarters to years
      spread: product.spread
    }
  };

  // Use pre-calculated results if available
  if (product.calculatedResults?.performingAssets) {
    result.annual = product.calculatedResults.performingAssets;
    result.quarterly = product.calculatedResults.quarterly?.performingStock || 
                      new Array(40).fill(0);
    return result;
  }

  // Otherwise calculate based on volumes and amortization
  if (product.performingAssets) {
    result.annual = product.performingAssets;
  }

  return result;
};

/**
 * Categorize product for reporting
 * @param {Object} product - Product configuration
 * @returns {string} Product category
 */
const categorizeProduct = (product) => {
  const name = product.name?.toLowerCase() || '';
  
  if (name.includes('ipotecar') || name.includes('mortgage')) {
    return 'mortgages';
  } else if (name.includes('bridge')) {
    return 'bridgeLoans';
  } else if (name.includes('corporate') || name.includes('pmi') || name.includes('sme')) {
    return 'corporateLoans';
  } else {
    return 'otherLoans';
  }
};

/**
 * Calculate performing asset metrics
 * @param {Object} results - Performing assets results
 * @param {Object} divisions - Division data
 * @param {Array} years - Array of year indices
 */
const calculatePerformingAssetMetrics = (results, divisions, years) => {
  years.forEach(year => {
    let totalAssets = 0;
    let weightedMaturity = 0;
    let weightedRate = 0;
    
    Object.values(results.byProduct).forEach(product => {
      const assets = product.annual[year];
      if (assets > 0 && product.details) {
        totalAssets += assets;
        weightedMaturity += assets * (product.details.averageMaturity || 0);
        weightedRate += assets * (product.details.spread || 0);
      }
    });
    
    if (totalAssets > 0) {
      results.metrics.averageMaturity[year] = weightedMaturity / totalAssets;
      results.metrics.averageRate[year] = weightedRate / totalAssets;
    }
  });
};