/**
 * Commission Expense Calculator Microservice
 * 
 * Responsible for calculating all fee and commission expenses
 * Typically a percentage of commission income or specific costs
 */

/**
 * Main entry point for Commission Expense calculation
 * @param {Object} commissionIncome - Commission income results
 * @param {Object} divisions - All division data
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Commission expense by division and consolidated
 */
export const calculateCommissionExpense = (commissionIncome, divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    byProduct: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0)
    },
    byType: {
      distributionCosts: new Array(10).fill(0),
      processingCosts: new Array(10).fill(0),
      referralFees: new Array(10).fill(0),
      customerAcquisition: new Array(10).fill(0)
    }
  };

  // General commission expense rate
  const generalExpenseRate = assumptions.commissionExpenseRate / 100 || 0;

  // Process commission income and apply expense rates
  if (generalExpenseRate > 0) {
    // Simple approach: apply general rate to all commission income
    results.consolidated.annual = commissionIncome.consolidated.annual.map(
      income => -income * generalExpenseRate
    );
    results.consolidated.quarterly = commissionIncome.consolidated.quarterly.map(
      income => -income * generalExpenseRate
    );
  }

  // Process specific product expenses
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionExpense = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      products: {}
    };

    if (division.products) {
      Object.entries(division.products).forEach(([productKey, product]) => {
        const productExpense = calculateProductCommissionExpense(
          product, 
          commissionIncome.byProduct[productKey],
          assumptions, 
          years
        );
        
        if (productExpense) {
          divisionExpense.products[productKey] = productExpense;
          results.byProduct[productKey] = productExpense;

          // Aggregate expenses
          productExpense.annual.forEach((value, i) => {
            divisionExpense.annual[i] += value;
            
            // If no general rate, add to consolidated
            if (generalExpenseRate === 0) {
              results.consolidated.annual[i] += value;
            }
            
            // Track by type
            if (productExpense.type) {
              results.byType[productExpense.type][i] += value;
            }
          });

          productExpense.quarterly.forEach((value, i) => {
            divisionExpense.quarterly[i] += value;
            if (generalExpenseRate === 0) {
              results.consolidated.quarterly[i] += value;
            }
          });
        }
      });
    }

    results.byDivision[divisionKey] = divisionExpense;
  });

  return results;
};

/**
 * Calculate commission expense for a specific product
 * @param {Object} product - Product configuration
 * @param {Object} productCommissionIncome - Product's commission income
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Commission expense details
 */
const calculateProductCommissionExpense = (product, productCommissionIncome, assumptions, years) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    type: null,
    details: {}
  };

  // Digital products - Customer Acquisition Costs (CAC)
  if ((product.isDigital || product.productType === 'DepositAndService') && product.cac) {
    result.type = 'customerAcquisition';
    result.details.cacPerCustomer = product.cac;
    
    if (product.customerAcquisition) {
      years.forEach(year => {
        const newCustomers = product.customerAcquisition[year] || 0;
        result.annual[year] = -newCustomers * product.cac / 1000000; // Convert to millions, negative for expense
      });
    }
  }

  // Wealth management - referral fees to wealth division
  if (product.wealthReferralFee && product.wealthReferrals) {
    const referralExpense = new Array(10).fill(0);
    years.forEach(year => {
      const referrals = product.wealthReferrals[year] || 0;
      referralExpense[year] = -referrals * product.wealthReferralFee / 1000000; // Convert to millions
    });
    
    // Add to total
    result.annual = result.annual.map((v, i) => v + referralExpense[i]);
    result.type = result.type || 'referralFees';
  }

  // Product-specific commission expense rate
  if (product.commissionExpenseRate && productCommissionIncome) {
    const specificRate = product.commissionExpenseRate / 100;
    const specificExpense = productCommissionIncome.annual.map(
      income => -income * specificRate
    );
    
    // Add to total
    result.annual = result.annual.map((v, i) => v + specificExpense[i]);
    result.type = result.type || 'distributionCosts';
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
 * Calculate net commission income
 * @param {Object} commissionIncome - Commission income results
 * @param {Object} commissionExpense - Commission expense results
 * @returns {Object} Net commission income
 */
export const calculateNetCommissionIncome = (commissionIncome, commissionExpense) => {
  return {
    annual: commissionIncome.consolidated.annual.map((income, i) => 
      income + commissionExpense.consolidated.annual[i]
    ),
    quarterly: commissionIncome.consolidated.quarterly.map((income, i) => 
      income + commissionExpense.consolidated.quarterly[i]
    ),
    byDivision: Object.keys(commissionIncome.byDivision).reduce((acc, divKey) => {
      acc[divKey] = {
        annual: commissionIncome.byDivision[divKey].annual.map((income, i) => 
          income + (commissionExpense.byDivision[divKey]?.annual[i] || 0)
        ),
        quarterly: commissionIncome.byDivision[divKey].quarterly.map((income, i) => 
          income + (commissionExpense.byDivision[divKey]?.quarterly[i] || 0)
        )
      };
      return acc;
    }, {})
  };
};