/**
 * Interest Income Calculator Microservice
 * 
 * Responsible for calculating all interest income across all products and divisions
 * This is a P&L line item microservice that orchestrates product-specific calculations
 */

import { calculateCreditInterestIncome } from './interest-income/CreditInterestIncomeCalculator.js';
import { calculateDepositInterestIncome } from './interest-income/DepositInterestIncomeCalculator.js';
import { calculateTreasuryInterestIncome } from './interest-income/TreasuryInterestIncomeCalculator.js';

/**
 * Main entry point for Interest Income calculation
 * @param {Object} divisions - All division data with their products
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Interest income by division and consolidated
 */
export const calculateInterestIncome = (divisions, assumptions, years) => {
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
    const divisionIncome = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      products: {}
    };

    // Process products in the division
    if (division.products) {
      Object.entries(division.products).forEach(([productKey, product]) => {
        let productIncome = null;

        // Route to appropriate calculator based on product type
        if (product.productType === 'Credit' || !product.productType) {
          productIncome = calculateCreditInterestIncome(product, assumptions, years);
        } else if (product.productType === 'DepositAndService') {
          productIncome = calculateDepositInterestIncome(product, assumptions, years);
        }

        if (productIncome) {
          // Store product-level results
          divisionIncome.products[productKey] = productIncome;
          results.byProduct[productKey] = productIncome;

          // Aggregate to division level
          productIncome.annual.forEach((value, i) => {
            divisionIncome.annual[i] += value;
            results.consolidated.annual[i] += value;
          });

          productIncome.quarterly.forEach((value, i) => {
            divisionIncome.quarterly[i] += value;
            results.consolidated.quarterly[i] += value;
          });
        }
      });
    }

    // Handle special divisions
    if (divisionKey === 'treasury') {
      const treasuryIncome = calculateTreasuryInterestIncome(division, assumptions, years);
      divisionIncome.annual = treasuryIncome.annual;
      divisionIncome.quarterly = treasuryIncome.quarterly;
      
      // Add to consolidated
      treasuryIncome.annual.forEach((value, i) => {
        results.consolidated.annual[i] += value;
      });
      treasuryIncome.quarterly.forEach((value, i) => {
        results.consolidated.quarterly[i] += value;
      });
    }

    results.byDivision[divisionKey] = divisionIncome;
  });

  return results;
};

/**
 * Calculate interest income for a specific product
 * @param {Object} product - Product configuration
 * @param {Object} productResults - Calculated product results
 * @param {Object} assumptions - Global assumptions
 * @returns {Object} Interest income arrays (annual and quarterly)
 */
export const calculateProductInterestIncome = (product, productResults, assumptions) => {
  // This is a helper for backward compatibility
  return {
    annual: productResults.interestIncome || new Array(10).fill(0),
    quarterly: productResults.quarterly?.interestIncome || new Array(40).fill(0)
  };
};