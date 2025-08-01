/**
 * Credit Interest Expense Calculator
 * 
 * Calculates FTP (Funds Transfer Pricing) expense for credit products
 * This represents the internal cost of funding for loans
 */

/**
 * Calculate FTP expense for a credit product
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Interest expense (annual and quarterly) - negative values
 */
export const calculateCreditInterestExpense = (product, assumptions, years) => {
  const ftpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
  const quarterlyFtpRate = ftpRate / 4;
  
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    details: {
      ftpRate: ftpRate,
      ftpSpread: assumptions.ftpSpread,
      euribor: assumptions.euribor
    }
  };

  // If product has pre-calculated results, use them
  if (product.calculatedResults) {
    result.annual = product.calculatedResults.interestExpense || result.annual;
    result.quarterly = product.calculatedResults.quarterly?.interestExpense || result.quarterly;
    return result;
  }

  // Otherwise calculate based on performing assets and FTP rate
  if (product.performingAssets) {
    // Annual calculation
    product.performingAssets.forEach((assets, year) => {
      if (year < 10) {
        // Use average assets for the year
        const prevAssets = year > 0 ? product.performingAssets[year - 1] : 0;
        const avgAssets = (prevAssets + assets) / 2;
        result.annual[year] = -avgAssets * ftpRate; // Negative for expense
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
 * Calculate FTP expense with adjustments for specific product types
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {number} avgAssets - Average performing assets
 * @returns {number} FTP expense (negative value)
 */
export const calculateAdjustedFTPExpense = (product, assumptions, avgAssets) => {
  let baseFtpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
  
  // Adjustments based on product characteristics
  if (product.secured === false) {
    // Unsecured loans may have higher funding cost
    baseFtpRate += 0.005; // 50 bps additional
  }
  
  if (product.durata > 60) {
    // Long-term loans may have duration adjustment
    baseFtpRate += 0.003; // 30 bps for duration risk
  }
  
  return -avgAssets * baseFtpRate;
};