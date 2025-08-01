/**
 * Non-Performing Assets (NPL) Calculator Microservice
 * 
 * Responsible for calculating all non-performing loans across all products and divisions
 * Tracks NPL stock, flows, coverage ratios, and recovery expectations
 */

/**
 * Main entry point for NPL calculation
 * @param {Object} divisions - All division data with their products
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} NPL assets by division and consolidated
 */
export const calculateNonPerformingAssets = (divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    byProduct: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      flows: {
        newDefaults: new Array(10).fill(0),
        recoveries: new Array(10).fill(0),
        writeOffs: new Array(10).fill(0)
      }
    },
    byCategory: {
      secured: new Array(10).fill(0),
      unsecured: new Array(10).fill(0),
      stateGuaranteed: new Array(10).fill(0)
    },
    metrics: {
      nplRatio: new Array(10).fill(0), // NPL / Total loans
      coverageRatio: new Array(10).fill(0), // LLP stock / NPL stock
      netNPLRatio: new Array(10).fill(0), // Net NPL / Total loans
      expectedRecoveryRate: new Array(10).fill(0)
    },
    vintageAnalysis: {} // Track NPLs by origination year
  };

  // Process each division
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionNPL = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      products: {},
      flows: {
        newDefaults: new Array(10).fill(0),
        recoveries: new Array(10).fill(0)
      }
    };

    // Process credit products
    if (division.products) {
      Object.entries(division.products).forEach(([productKey, product]) => {
        if (product.productType === 'Credit' || !product.productType) {
          const productNPL = calculateProductNPL(product, assumptions, years);
          
          if (productNPL) {
            // Store product-level results
            divisionNPL.products[productKey] = productNPL;
            results.byProduct[productKey] = productNPL;

            // Aggregate to division level
            productNPL.annual.forEach((value, i) => {
              divisionNPL.annual[i] += value;
              results.consolidated.annual[i] += value;
              
              // Track by category
              const category = categorizeNPL(product);
              if (results.byCategory[category]) {
                results.byCategory[category][i] += value;
              }
            });

            // Aggregate flows
            if (productNPL.flows) {
              productNPL.flows.newDefaults.forEach((value, i) => {
                divisionNPL.flows.newDefaults[i] += value;
                results.consolidated.flows.newDefaults[i] += value;
              });
              
              productNPL.flows.recoveries.forEach((value, i) => {
                divisionNPL.flows.recoveries[i] += value;
                results.consolidated.flows.recoveries[i] += value;
              });
            }

            productNPL.quarterly.forEach((value, i) => {
              divisionNPL.quarterly[i] += value;
              results.consolidated.quarterly[i] += value;
            });
          }
        }
      });
    }

    // Use pre-calculated balance sheet data if available
    if (division.bs?.nonPerformingAssets) {
      divisionNPL.annual = division.bs.nonPerformingAssets;
      
      // Add to consolidated if not already done
      if (Object.keys(divisionNPL.products).length === 0) {
        division.bs.nonPerformingAssets.forEach((value, i) => {
          results.consolidated.annual[i] += value;
        });
      }
    }

    // Use quarterly data if available
    if (division.bs?.quarterly?.nonPerformingAssets) {
      divisionNPL.quarterly = division.bs.quarterly.nonPerformingAssets;
      
      // Add to consolidated quarterly if not already done
      if (Object.keys(divisionNPL.products).length === 0) {
        division.bs.quarterly.nonPerformingAssets.forEach((value, i) => {
          results.consolidated.quarterly[i] += value;
        });
      }
    }

    results.byDivision[divisionKey] = divisionNPL;
  });

  // Calculate metrics
  calculateNPLMetrics(results, divisions, years);

  return results;
};

/**
 * Calculate NPL for a specific product
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} NPL details
 */
const calculateProductNPL = (product, assumptions, years) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    flows: {
      newDefaults: new Array(10).fill(0),
      recoveries: new Array(10).fill(0),
      writeOffs: new Array(10).fill(0)
    },
    details: {
      productName: product.name,
      dangerRate: product.dangerRate,
      recoveryTime: product.timeToRecover,
      secured: product.secured !== false,
      stateGuarantee: product.stateGuaranteeType === 'present'
    }
  };

  // Use pre-calculated results if available
  if (product.calculatedResults?.nonPerformingAssets) {
    result.annual = product.calculatedResults.nonPerformingAssets;
    result.quarterly = product.calculatedResults.quarterly?.nplStock || 
                      new Array(40).fill(0);
    
    // Get flows if available
    if (product.calculatedResults.newNPLs) {
      result.flows.newDefaults = product.calculatedResults.newNPLs;
    }
    
    return result;
  }

  // Otherwise use available NPL data
  if (product.nonPerformingAssets) {
    result.annual = product.nonPerformingAssets;
  }

  return result;
};

/**
 * Categorize NPL for reporting
 * @param {Object} product - Product configuration
 * @returns {string} NPL category
 */
const categorizeNPL = (product) => {
  if (product.stateGuaranteeType === 'present') {
    return 'stateGuaranteed';
  } else if (product.secured === false) {
    return 'unsecured';
  } else {
    return 'secured';
  }
};

/**
 * Calculate NPL metrics
 * @param {Object} results - NPL results
 * @param {Object} divisions - Division data
 * @param {Array} years - Array of year indices
 */
const calculateNPLMetrics = (results, divisions, years) => {
  // Get total performing assets for ratio calculations
  let totalPerformingAssets = new Array(10).fill(0);
  let totalLLPStock = new Array(10).fill(0);
  
  Object.values(divisions).forEach(division => {
    if (division.bs?.performingAssets) {
      division.bs.performingAssets.forEach((value, i) => {
        totalPerformingAssets[i] += value;
      });
    }
  });
  
  years.forEach(year => {
    const totalLoans = totalPerformingAssets[year] + results.consolidated.annual[year];
    
    if (totalLoans > 0) {
      // NPL Ratio
      results.metrics.nplRatio[year] = 
        (results.consolidated.annual[year] / totalLoans) * 100;
      
      // Net NPL Ratio (after provisions)
      const netNPL = Math.max(0, results.consolidated.annual[year] - totalLLPStock[year]);
      results.metrics.netNPLRatio[year] = (netNPL / totalLoans) * 100;
    }
    
    // Coverage Ratio
    if (results.consolidated.annual[year] > 0 && totalLLPStock[year] > 0) {
      results.metrics.coverageRatio[year] = 
        (totalLLPStock[year] / results.consolidated.annual[year]) * 100;
    }
    
    // Expected Recovery Rate
    if (results.consolidated.annual[year] > 0) {
      const securedRatio = results.byCategory.secured[year] / results.consolidated.annual[year];
      const guaranteedRatio = results.byCategory.stateGuaranteed[year] / results.consolidated.annual[year];
      
      // Weighted average recovery rate
      results.metrics.expectedRecoveryRate[year] = 
        securedRatio * 65 + // 65% recovery on secured
        guaranteedRatio * 85 + // 85% recovery on state guaranteed
        (1 - securedRatio - guaranteedRatio) * 35; // 35% recovery on unsecured
    }
  });
};