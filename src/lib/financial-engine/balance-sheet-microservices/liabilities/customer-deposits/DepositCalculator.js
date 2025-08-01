/**
 * Deposit Calculator Microservice
 * 
 * Responsible for calculating all customer deposits across all products and divisions
 * Tracks deposit volumes, mix, stability, and cost of funding
 */

/**
 * Main entry point for Deposit calculation
 * @param {Object} divisions - All division data with their products
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Deposits by division and consolidated
 */
export const calculateDeposits = (divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    byProduct: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      flows: {
        newDeposits: new Array(10).fill(0),
        withdrawals: new Array(10).fill(0),
        netFlow: new Array(10).fill(0)
      }
    },
    byType: {
      current: new Array(10).fill(0),      // Non-interest bearing
      savings: new Array(10).fill(0),      // Low interest
      term: new Array(10).fill(0),         // Higher interest
      structured: new Array(10).fill(0)    // Complex products
    },
    metrics: {
      averageCost: new Array(10).fill(0),   // Weighted average cost
      stabilityRatio: new Array(10).fill(0), // Stable deposits / Total
      concentrationRisk: new Array(10).fill(0), // Top 10 depositors %
      depositToLoanRatio: new Array(10).fill(0)
    }
  };

  // Process each division
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionDeposits = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      products: {},
      flows: {
        newDeposits: new Array(10).fill(0),
        withdrawals: new Array(10).fill(0)
      }
    };

    // Process deposit products
    if (division.products) {
      Object.entries(division.products).forEach(([productKey, product]) => {
        if (product.productType === 'DepositAndService' || product.isDigital) {
          const productDeposits = calculateProductDeposits(product, assumptions, years);
          
          if (productDeposits) {
            // Store product-level results
            divisionDeposits.products[productKey] = productDeposits;
            results.byProduct[productKey] = productDeposits;

            // Aggregate to division level
            productDeposits.annual.forEach((value, i) => {
              divisionDeposits.annual[i] += value;
              results.consolidated.annual[i] += value;
              
              // Track by type
              const depositType = categorizeDeposit(product);
              if (results.byType[depositType]) {
                results.byType[depositType][i] += value;
              }
            });

            // Aggregate flows
            if (productDeposits.flows) {
              productDeposits.flows.newDeposits.forEach((value, i) => {
                divisionDeposits.flows.newDeposits[i] += value;
                results.consolidated.flows.newDeposits[i] += value;
              });
            }

            productDeposits.quarterly.forEach((value, i) => {
              divisionDeposits.quarterly[i] += value;
              results.consolidated.quarterly[i] += value;
            });
          }
        }
      });
    }

    // Use pre-calculated balance sheet data if available
    if (division.bs?.digitalServiceDeposits) {
      const deposits = division.bs.digitalServiceDeposits;
      
      // Add to annual totals if not already included
      if (Object.keys(divisionDeposits.products).length === 0) {
        deposits.forEach((value, i) => {
          divisionDeposits.annual[i] += value;
          results.consolidated.annual[i] += value;
        });
      }
    }

    results.byDivision[divisionKey] = divisionDeposits;
  });

  // Calculate flows
  calculateDepositFlows(results, years);

  // Calculate metrics
  calculateDepositMetrics(results, divisions, assumptions, years);

  return results;
};

/**
 * Calculate deposits for a specific product
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Deposit details
 */
const calculateProductDeposits = (product, assumptions, years) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    flows: {
      newDeposits: new Array(10).fill(0),
      withdrawals: new Array(10).fill(0)
    },
    details: {
      productName: product.name,
      depositRate: assumptions.depositRate,
      depositMix: product.depositMix,
      avgBalance: product.avgDepositBalance
    }
  };

  // Use pre-calculated results if available
  if (product.calculatedResults?.depositStock) {
    result.annual = product.calculatedResults.depositStock;
    
    // Calculate flows from stock changes
    years.forEach(year => {
      if (year === 0) {
        result.flows.newDeposits[year] = result.annual[year];
      } else {
        const netChange = result.annual[year] - result.annual[year - 1];
        if (netChange > 0) {
          result.flows.newDeposits[year] = netChange;
        } else {
          result.flows.withdrawals[year] = Math.abs(netChange);
        }
      }
    });
    
    return result;
  }

  // Otherwise use available deposit data
  if (product.depositStock) {
    result.annual = product.depositStock;
    
    // Calculate flows
    years.forEach(year => {
      if (year === 0) {
        result.flows.newDeposits[year] = result.annual[year];
      } else {
        const netChange = result.annual[year] - result.annual[year - 1];
        if (netChange > 0) {
          result.flows.newDeposits[year] = netChange;
        } else {
          result.flows.withdrawals[year] = Math.abs(netChange);
        }
      }
    });
  }

  // Quarterly distribution (simplified)
  for (let q = 0; q < 40; q++) {
    const year = Math.floor(q / 4);
    if (year < 10 && result.annual[year] > 0) {
      // Linear interpolation within year
      const prevYearEnd = year > 0 ? result.annual[year - 1] : 0;
      const yearEnd = result.annual[year];
      const quarterlyGrowth = (yearEnd - prevYearEnd) / 4;
      const quarterInYear = q % 4;
      
      result.quarterly[q] = prevYearEnd + (quarterlyGrowth * (quarterInYear + 1));
    }
  }

  return result;
};

/**
 * Categorize deposit for reporting
 * @param {Object} product - Product configuration
 * @returns {string} Deposit category
 */
const categorizeDeposit = (product) => {
  // Check deposit mix if available
  if (product.depositMix) {
    // Return the dominant type
    const mix = product.depositMix;
    if (mix.current > 50) return 'current';
    if (mix.savings > 50) return 'savings';
    if (mix.term > 50) return 'term';
    
    // Default to savings if mixed
    return 'savings';
  }
  
  // Check product name
  const name = product.name?.toLowerCase() || '';
  
  if (name.includes('current') || name.includes('checking')) {
    return 'current';
  } else if (name.includes('term') || name.includes('fixed')) {
    return 'term';
  } else if (name.includes('structured')) {
    return 'structured';
  } else {
    return 'savings';
  }
};

/**
 * Calculate deposit flows
 * @param {Object} results - Deposit results
 * @param {Array} years - Array of year indices
 */
const calculateDepositFlows = (results, years) => {
  years.forEach(year => {
    results.consolidated.flows.netFlow[year] = 
      results.consolidated.flows.newDeposits[year] - 
      results.consolidated.flows.withdrawals[year];
  });
};

/**
 * Calculate deposit metrics
 * @param {Object} results - Deposit results
 * @param {Object} divisions - Division data
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 */
const calculateDepositMetrics = (results, divisions, assumptions, years) => {
  // Get total loans for deposit-to-loan ratio
  let totalLoans = new Array(10).fill(0);
  
  Object.values(divisions).forEach(division => {
    if (division.bs?.performingAssets) {
      division.bs.performingAssets.forEach((value, i) => {
        totalLoans[i] += value;
      });
    }
    if (division.bs?.nonPerformingAssets) {
      division.bs.nonPerformingAssets.forEach((value, i) => {
        totalLoans[i] += value;
      });
    }
  });
  
  const baseDepositRate = assumptions.depositRate / 100;
  
  years.forEach(year => {
    const totalDeposits = results.consolidated.annual[year];
    
    if (totalDeposits > 0) {
      // Average cost of deposits
      const currentDeposits = results.byType.current[year];
      const savingsDeposits = results.byType.savings[year];
      const termDeposits = results.byType.term[year];
      
      const weightedCost = 
        (currentDeposits * 0) + // Current accounts: 0%
        (savingsDeposits * baseDepositRate) +
        (termDeposits * (baseDepositRate + 0.01)); // Term: +100bps
      
      results.metrics.averageCost[year] = (weightedCost / totalDeposits) * 100;
      
      // Stability ratio (term deposits are most stable)
      results.metrics.stabilityRatio[year] = 
        ((termDeposits + savingsDeposits * 0.7) / totalDeposits) * 100;
      
      // Deposit-to-loan ratio
      if (totalLoans[year] > 0) {
        results.metrics.depositToLoanRatio[year] = 
          (totalDeposits / totalLoans[year]) * 100;
      }
    }
  });
};