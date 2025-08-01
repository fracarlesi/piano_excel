/**
 * Loan Loss Provision (LLP) Calculator Microservice
 * 
 * Responsible for calculating all credit loss provisions across all products
 * Implements IFRS 9 expected credit loss (ECL) methodology
 */

/**
 * Main entry point for LLP calculation
 * @param {Object} divisions - All division data with their products
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} LLP by division and consolidated
 */
export const calculateLoanLossProvisions = (divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    byProduct: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0)
    },
    byStage: {
      stage1: new Array(10).fill(0), // Performing loans ECL
      stage2: new Array(10).fill(0), // Underperforming loans ECL
      stage3: new Array(10).fill(0), // NPL provisions
      recoveries: new Array(10).fill(0) // Recovery credits
    },
    metrics: {
      coverageRatio: new Array(10).fill(0), // LLP stock / NPL stock
      costOfRisk: new Array(10).fill(0) // LLP flow / avg performing assets (bps)
    }
  };

  // Process each division
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionLLP = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      products: {}
    };

    // Process credit products only
    if (division.products) {
      Object.entries(division.products).forEach(([productKey, product]) => {
        if (product.productType === 'Credit' || !product.productType) {
          const productLLP = calculateProductLLP(product, assumptions, years);
          
          if (productLLP) {
            // Store product-level results
            divisionLLP.products[productKey] = productLLP;
            results.byProduct[productKey] = productLLP;

            // Aggregate to division level
            productLLP.annual.forEach((value, i) => {
              divisionLLP.annual[i] += value;
              results.consolidated.annual[i] += value;
              
              // Track by stage
              if (productLLP.byStage) {
                results.byStage.stage1[i] += productLLP.byStage.stage1[i] || 0;
                results.byStage.stage2[i] += productLLP.byStage.stage2[i] || 0;
                results.byStage.stage3[i] += productLLP.byStage.stage3[i] || 0;
                results.byStage.recoveries[i] += productLLP.byStage.recoveries[i] || 0;
              }
            });

            productLLP.quarterly.forEach((value, i) => {
              divisionLLP.quarterly[i] += value;
              results.consolidated.quarterly[i] += value;
            });
          }
        }
      });
    }

    results.byDivision[divisionKey] = divisionLLP;
  });

  // Calculate metrics
  calculateLLPMetrics(results, divisions, years);

  return results;
};

/**
 * Calculate LLP for a specific product
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} LLP details
 */
const calculateProductLLP = (product, assumptions, years) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    byStage: {
      stage1: new Array(10).fill(0),
      stage2: new Array(10).fill(0),
      stage3: new Array(10).fill(0),
      recoveries: new Array(10).fill(0)
    },
    details: {}
  };

  // If product has pre-calculated LLP, use it
  if (product.calculatedResults?.llp) {
    result.annual = product.calculatedResults.llp;
    result.quarterly = product.calculatedResults.quarterly?.llp || 
                      result.annual.map(v => [v/4, v/4, v/4, v/4]).flat();
    return result;
  }

  // Calculate ECL based on performing assets
  if (product.performingAssets && product.dangerRate) {
    const pd = product.dangerRate / 100; // Probability of Default
    const lgd = calculateLGD(product); // Loss Given Default
    
    years.forEach(year => {
      if (product.performingAssets[year] > 0) {
        // Stage 1 ECL (12-month expected loss)
        const stage1ECL = product.performingAssets[year] * pd * lgd;
        
        // Stage 2 ECL (lifetime expected loss for underperforming)
        const utpRatio = product.creditClassification === 'UTP' ? 0.2 : 0.05;
        const stage2ECL = product.performingAssets[year] * utpRatio * pd * 2.5 * lgd;
        
        // Total ECL (negative for expense)
        result.annual[year] = -(stage1ECL + stage2ECL);
        result.byStage.stage1[year] = -stage1ECL;
        result.byStage.stage2[year] = -stage2ECL;
      }
      
      // Stage 3 provisions on new NPLs
      if (product.calculatedResults?.newNPLs?.[year] > 0) {
        const nplProvision = product.calculatedResults.newNPLs[year] * lgd;
        result.annual[year] += -nplProvision;
        result.byStage.stage3[year] = -nplProvision;
      }
    });
  }

  // Quarterly distribution
  for (let q = 0; q < 40; q++) {
    const year = Math.floor(q / 4);
    if (year < 10) {
      result.quarterly[q] = result.annual[year] / 4;
    }
  }

  return result;
};

/**
 * Calculate Loss Given Default (LGD)
 * @param {Object} product - Product configuration
 * @returns {number} LGD as decimal
 */
const calculateLGD = (product) => {
  let baseLGD = 0.45; // 45% for unsecured
  
  // Adjust for secured loans
  if (product.secured !== false && product.ltv) {
    const recoveryRate = (100 - product.ltv) / 100;
    const haircutAdjustment = product.collateralHaircut ? product.collateralHaircut / 100 : 0.2;
    const costAdjustment = product.recoveryCosts ? product.recoveryCosts / 100 : 0.1;
    
    baseLGD = 1 - (recoveryRate * (1 - haircutAdjustment) - costAdjustment);
    baseLGD = Math.max(0.1, Math.min(0.9, baseLGD)); // Cap between 10% and 90%
  }
  
  // Adjust for state guarantees
  if (product.stateGuaranteeType === 'present' && product.stateGuaranteeCoverage) {
    const guaranteeCoverage = product.stateGuaranteeCoverage / 100;
    baseLGD = baseLGD * (1 - guaranteeCoverage * 0.9); // 90% effectiveness of guarantee
  }
  
  return baseLGD;
};

/**
 * Calculate LLP metrics
 * @param {Object} results - LLP results
 * @param {Object} divisions - Division data
 * @param {Array} years - Array of year indices
 */
const calculateLLPMetrics = (results, divisions, years) => {
  // Calculate total performing assets and NPL stock
  const totalPerformingAssets = new Array(10).fill(0);
  const totalNPLStock = new Array(10).fill(0);
  
  Object.values(divisions).forEach(division => {
    if (division.bs) {
      years.forEach(year => {
        totalPerformingAssets[year] += division.bs.performingAssets?.[year] || 0;
        totalNPLStock[year] += division.bs.nonPerformingAssets?.[year] || 0;
      });
    }
  });
  
  // Calculate metrics
  years.forEach(year => {
    // Coverage ratio
    if (totalNPLStock[year] > 0) {
      const llpStock = Math.abs(results.byStage.stage3[year]);
      results.metrics.coverageRatio[year] = (llpStock / totalNPLStock[year]) * 100;
    }
    
    // Cost of risk (basis points)
    if (totalPerformingAssets[year] > 0) {
      const avgAssets = year > 0 ? 
        (totalPerformingAssets[year-1] + totalPerformingAssets[year]) / 2 :
        totalPerformingAssets[year];
      results.metrics.costOfRisk[year] = 
        (Math.abs(results.consolidated.annual[year]) / avgAssets) * 10000;
    }
  });
};