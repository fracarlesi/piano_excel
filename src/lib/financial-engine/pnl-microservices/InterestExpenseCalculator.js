/**
 * Interest Expense Calculator Microservice
 * 
 * Responsible for calculating all interest expenses across all products and divisions
 * This is a P&L line item microservice that orchestrates product-specific calculations
 */

import { calculateCreditInterestExpense } from './interest-expense/CreditInterestExpenseCalculator.js';
import { calculateDepositInterestExpense } from './interest-expense/DepositInterestExpenseCalculator.js';
import { calculateTreasuryInterestExpense } from './interest-expense/TreasuryInterestExpenseCalculator.js';

/**
 * Main entry point for Interest Expense calculation
 * @param {Object} divisions - All division data with their products
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Interest expense by division and consolidated
 */
export const calculateInterestExpense = (divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    byProduct: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0)
    }
  };

  // Process each division
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionExpense = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      products: {}
    };

    // Process products in the division
    if (division.products) {
      Object.entries(division.products).forEach(([productKey, product]) => {
        let productExpense = null;

        // Route to appropriate calculator based on product type
        if (product.productType === 'Credit' || !product.productType) {
          // Credit products have FTP expense
          productExpense = calculateCreditInterestExpense(product, assumptions, years);
        } else if (product.productType === 'DepositAndService') {
          // Deposit products pay interest to customers
          productExpense = calculateDepositInterestExpense(product, assumptions, years);
        }

        if (productExpense) {
          // Store product-level results
          divisionExpense.products[productKey] = productExpense;
          results.byProduct[productKey] = productExpense;

          // Aggregate to division level (expenses are negative)
          productExpense.annual.forEach((value, i) => {
            divisionExpense.annual[i] += value;
            results.consolidated.annual[i] += value;
          });

          productExpense.quarterly.forEach((value, i) => {
            divisionExpense.quarterly[i] += value;
            results.consolidated.quarterly[i] += value;
          });
        }
      });
    }

    // Handle special divisions
    if (divisionKey === 'treasury') {
      const treasuryExpense = calculateTreasuryInterestExpense(division, assumptions, years);
      divisionExpense.annual = treasuryExpense.annual;
      divisionExpense.quarterly = treasuryExpense.quarterly;
      
      // Add to consolidated
      treasuryExpense.annual.forEach((value, i) => {
        results.consolidated.annual[i] += value;
      });
      treasuryExpense.quarterly.forEach((value, i) => {
        results.consolidated.quarterly[i] += value;
      });
    }

    results.byDivision[divisionKey] = divisionExpense;
  });

  return results;
};

/**
 * Calculate net interest income
 * @param {Object} interestIncome - Interest income results
 * @param {Object} interestExpense - Interest expense results
 * @returns {Object} Net interest income
 */
export const calculateNetInterestIncome = (interestIncome, interestExpense) => {
  return {
    annual: interestIncome.consolidated.annual.map((income, i) => 
      income + interestExpense.consolidated.annual[i]
    ),
    quarterly: interestIncome.consolidated.quarterly.map((income, i) => 
      income + interestExpense.consolidated.quarterly[i]
    ),
    byDivision: Object.keys(interestIncome.byDivision).reduce((acc, divKey) => {
      acc[divKey] = {
        annual: interestIncome.byDivision[divKey].annual.map((income, i) => 
          income + (interestExpense.byDivision[divKey]?.annual[i] || 0)
        ),
        quarterly: interestIncome.byDivision[divKey].quarterly.map((income, i) => 
          income + (interestExpense.byDivision[divKey]?.quarterly[i] || 0)
        )
      };
      return acc;
    }, {})
  };
};