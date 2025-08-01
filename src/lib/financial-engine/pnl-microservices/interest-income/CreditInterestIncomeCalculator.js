/**
 * Credit Interest Income Calculator
 * 
 * Calculates interest income for credit products (loans, mortgages, etc.)
 * Handles different loan types: French amortization, Bullet loans, with/without grace periods
 */

/**
 * Calculate interest income for a credit product
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Interest income (annual and quarterly)
 */
export const calculateCreditInterestIncome = (product, assumptions, years) => {
  const interestRate = getInterestRate(product, assumptions);
  const quarterlyRate = interestRate / 4;
  
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    details: {
      rate: interestRate,
      isFixed: product.isFixedRate || false,
      spread: product.spread,
      euribor: assumptions.euribor
    }
  };

  // If product has pre-calculated results, use them
  if (product.calculatedResults) {
    result.annual = product.calculatedResults.interestIncome || result.annual;
    result.quarterly = product.calculatedResults.quarterly?.interestIncome || result.quarterly;
    return result;
  }

  // Otherwise calculate based on performing assets and rate
  if (product.performingAssets) {
    // Annual calculation
    product.performingAssets.forEach((assets, year) => {
      if (year < 10) {
        // Use average assets for the year
        const prevAssets = year > 0 ? product.performingAssets[year - 1] : 0;
        const avgAssets = (prevAssets + assets) / 2;
        result.annual[year] = avgAssets * interestRate;
      }
    });

    // Quarterly calculation (simplified - should track quarterly balances)
    for (let q = 0; q < 40; q++) {
      const year = Math.floor(q / 4);
      if (year < 10) {
        result.quarterly[q] = result.annual[year] / 4;
      }
    }
  }

  return result;
};

/**
 * Get interest rate for a product
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {number} Interest rate as decimal
 */
const getInterestRate = (product, assumptions) => {
  if (product.isFixedRate) {
    return (product.spread + 2.0) / 100; // Fixed rate: spread + 2%
  }
  return (assumptions.euribor + product.spread) / 100; // Variable rate: EURIBOR + spread
};

/**
 * Calculate interest income for French amortization loans
 * @param {Array} vintages - Array of loan vintages
 * @param {number} quarterlyRate - Quarterly interest rate
 * @param {number} currentQuarter - Current quarter index
 * @returns {number} Quarterly interest income
 */
export const calculateFrenchLoanInterest = (vintages, quarterlyRate, currentQuarter) => {
  let totalInterest = 0;

  vintages.forEach(vintage => {
    if (vintage.type !== 'french') return;

    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;

    // Check if vintage is active for interest
    if (currentQuarter > vintageStartQuarter && currentQuarter <= vintageMaturityQuarter) {
      // Interest on outstanding principal
      totalInterest += vintage.outstandingPrincipal * quarterlyRate;
    }
  });

  return totalInterest;
};

/**
 * Calculate interest income for Bullet loans
 * @param {Array} vintages - Array of loan vintages
 * @param {number} quarterlyRate - Quarterly interest rate
 * @param {number} currentQuarter - Current quarter index
 * @returns {number} Quarterly interest income
 */
export const calculateBulletLoanInterest = (vintages, quarterlyRate, currentQuarter) => {
  let totalInterest = 0;

  vintages.forEach(vintage => {
    if (vintage.type !== 'bullet') return;

    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;

    // Bullet loans pay interest on full principal until maturity
    if (currentQuarter > vintageStartQuarter && currentQuarter < vintageMaturityQuarter) {
      totalInterest += vintage.initialAmount * quarterlyRate;
    }
  });

  return totalInterest;
};