/**
 * Deposit Interest Expense Calculator
 * 
 * Calculates interest paid to customers on their deposits
 * This is the actual cost of deposits for the bank
 */

/**
 * Calculate interest expense for deposit products
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Interest expense (annual and quarterly) - negative values
 */
export const calculateDepositInterestExpense = (product, assumptions, years) => {
  const depositRate = assumptions.depositRate / 100;
  
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    details: {
      depositRate: depositRate,
      depositMix: product.depositMix || null
    }
  };

  // Calculate based on deposit stock
  if (product.depositStock) {
    // Annual calculation
    product.depositStock.forEach((deposits, year) => {
      if (year < 10) {
        // Use average deposits for the year
        const prevDeposits = year > 0 ? product.depositStock[year - 1] : 0;
        const avgDeposits = (prevDeposits + deposits) / 2;
        
        // Calculate weighted rate if deposit mix is provided
        const effectiveRate = calculateEffectiveDepositRate(product, assumptions);
        
        result.annual[year] = -avgDeposits * effectiveRate; // Negative for expense
      }
    });

    // Quarterly calculation
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
 * Calculate effective deposit rate based on deposit mix
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {number} Effective deposit rate
 */
const calculateEffectiveDepositRate = (product, assumptions) => {
  const baseRate = assumptions.depositRate / 100;
  
  // If product has deposit mix, calculate weighted average
  if (product.depositMix) {
    let weightedRate = 0;
    
    if (product.depositMix.current) {
      // Current accounts typically pay 0%
      weightedRate += 0 * (product.depositMix.current / 100);
    }
    
    if (product.depositMix.savings) {
      // Savings accounts pay base rate
      weightedRate += baseRate * (product.depositMix.savings / 100);
    }
    
    if (product.depositMix.term) {
      // Term deposits pay premium
      weightedRate += (baseRate + 0.01) * (product.depositMix.term / 100);
    }
    
    return weightedRate;
  }
  
  return baseRate;
};

/**
 * Calculate interest expense for premium accounts
 * @param {Object} product - Product configuration
 * @param {number} accountCount - Number of premium accounts
 * @param {Object} assumptions - Global assumptions
 * @returns {number} Interest expense (negative value)
 */
export const calculatePremiumAccountInterest = (product, accountCount, assumptions) => {
  // Premium accounts might have special rates
  const premiumRate = (assumptions.depositRate + 0.5) / 100; // 50 bps premium
  const avgBalance = product.avgPremiumBalance || 50000; // Average balance per account
  
  return -accountCount * avgBalance * premiumRate;
};