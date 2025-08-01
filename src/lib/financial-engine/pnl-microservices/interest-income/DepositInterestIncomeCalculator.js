/**
 * Deposit Interest Income Calculator
 * 
 * Calculates interest income from deposit products
 * For deposits, the bank earns FTP (Funds Transfer Pricing) income
 */

/**
 * Calculate interest income for deposit products
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Interest income (annual and quarterly)
 */
export const calculateDepositInterestIncome = (product, assumptions, years) => {
  const ftpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
  
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    details: {
      ftpRate: ftpRate,
      depositRate: assumptions.depositRate / 100,
      ftpSpread: assumptions.ftpSpread,
      euribor: assumptions.euribor
    }
  };

  // For deposits, interest income is FTP income (internal pricing)
  // The bank earns the FTP rate on deposits collected
  if (product.depositStock) {
    // Annual calculation
    product.depositStock.forEach((deposits, year) => {
      if (year < 10) {
        // Use average deposits for the year
        const prevDeposits = year > 0 ? product.depositStock[year - 1] : 0;
        const avgDeposits = (prevDeposits + deposits) / 2;
        result.annual[year] = avgDeposits * ftpRate;
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
 * Calculate interest income for structured deposits
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @returns {Object} Interest income details
 */
export const calculateStructuredDepositIncome = (product, assumptions) => {
  // For structured deposits, there might be a different FTP calculation
  // based on the structure and embedded options
  const baseFtpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
  const structureAdjustment = product.structureSpread ? product.structureSpread / 100 : 0;
  
  return {
    ftpRate: baseFtpRate + structureAdjustment,
    components: {
      baseFtp: baseFtpRate,
      structureAdjustment: structureAdjustment
    }
  };
};