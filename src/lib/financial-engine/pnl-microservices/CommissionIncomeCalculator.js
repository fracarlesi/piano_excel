/**
 * Commission Income Calculator Microservice
 * 
 * Responsible for calculating all fee and commission income across all products and divisions
 * This is a P&L line item microservice that orchestrates product-specific calculations
 */

/**
 * Main entry point for Commission Income calculation
 * @param {Object} divisions - All division data with their products
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Commission income by division and consolidated
 */
export const calculateCommissionIncome = (divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    byProduct: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0)
    },
    byType: {
      arrangementFees: new Array(10).fill(0),
      accountFees: new Array(10).fill(0),
      transactionFees: new Array(10).fill(0),
      advisoryFees: new Array(10).fill(0),
      performanceFees: new Array(10).fill(0)
    }
  };

  // Process each division
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionIncome = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      products: {}
    };

    // Process products in the division
    if (division.products) {
      Object.entries(division.products).forEach(([productKey, product]) => {
        const commissionIncome = calculateProductCommissionIncome(product, assumptions, years);
        
        if (commissionIncome) {
          // Store product-level results
          divisionIncome.products[productKey] = commissionIncome;
          results.byProduct[productKey] = commissionIncome;

          // Aggregate to division level
          commissionIncome.annual.forEach((value, i) => {
            divisionIncome.annual[i] += value;
            results.consolidated.annual[i] += value;
            
            // Track by type
            if (commissionIncome.type) {
              results.byType[commissionIncome.type][i] += value;
            }
          });

          commissionIncome.quarterly.forEach((value, i) => {
            divisionIncome.quarterly[i] += value;
            results.consolidated.quarterly[i] += value;
          });
        }
      });
    }

    results.byDivision[divisionKey] = divisionIncome;
  });

  return results;
};

/**
 * Calculate commission income for a specific product
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Commission income details
 */
const calculateProductCommissionIncome = (product, assumptions, years) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    type: null,
    details: {}
  };

  // If product has pre-calculated commission income, use it
  if (product.calculatedResults?.commissionIncome) {
    result.annual = product.calculatedResults.commissionIncome;
    result.quarterly = product.calculatedResults.quarterly?.commissionIncome || 
                      result.annual.map(v => [v/4, v/4, v/4, v/4]).flat();
    return result;
  }

  // Credit products - arrangement fees
  if ((product.productType === 'Credit' || !product.productType) && product.commissionRate) {
    result.type = 'arrangementFees';
    result.details.rate = product.commissionRate;
    
    if (product.volumes) {
      years.forEach(year => {
        const volume = getProductVolume(product, year);
        result.annual[year] = volume * product.commissionRate / 100;
      });
    }
  }

  // Commission products - pure fee business
  if (product.productType === 'Commission' && product.commissionRate) {
    result.type = 'advisoryFees';
    result.details.rate = product.commissionRate;
    
    if (product.volumes) {
      years.forEach(year => {
        const volume = getProductVolume(product, year);
        result.annual[year] = volume * product.commissionRate / 100;
      });
    }
  }

  // Digital products - account and transaction fees
  if (product.isDigital || product.productType === 'DepositAndService') {
    result.type = 'accountFees';
    
    // Account maintenance fees
    if (product.monthlyFee && product.customerStock) {
      years.forEach(year => {
        const avgCustomers = year > 0 ? 
          (product.customerStock[year-1] + product.customerStock[year]) / 2 :
          product.customerStock[year] / 2;
        result.annual[year] = avgCustomers * product.monthlyFee * 12 / 1000000; // Convert to millions
      });
    }
    
    // Transaction fees
    if (product.transactionFee && product.transactionsPerCustomer && product.customerStock) {
      const transactionIncome = new Array(10).fill(0);
      years.forEach(year => {
        const avgCustomers = year > 0 ? 
          (product.customerStock[year-1] + product.customerStock[year]) / 2 :
          product.customerStock[year] / 2;
        transactionIncome[year] = avgCustomers * product.transactionsPerCustomer * 
                                  product.transactionFee * 12 / 1000000; // Monthly to annual, convert to millions
      });
      
      // Add to total
      result.annual = result.annual.map((v, i) => v + transactionIncome[i]);
    }
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
 * Get product volume for a specific year
 * @param {Object} product - Product configuration
 * @param {number} year - Year index
 * @returns {number} Volume for the year
 */
const getProductVolume = (product, year) => {
  // Check different volume structures
  if (product.volumeArray && product.volumeArray[year] !== undefined) {
    return product.volumeArray[year];
  }
  
  if (product.volumes) {
    const yearKey = `y${year + 1}`;
    if (product.volumes[yearKey] !== undefined) {
      return product.volumes[yearKey];
    }
    
    // Linear interpolation between y1 and y10
    if (product.volumes.y1 !== undefined && product.volumes.y10 !== undefined) {
      const y1 = product.volumes.y1;
      const y10 = product.volumes.y10;
      return y1 + ((y10 - y1) * year / 9);
    }
  }
  
  return 0;
};