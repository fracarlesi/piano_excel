/**
 * Treasury Interest Expense Calculator
 * 
 * Calculates interest expense from treasury and ALM activities
 * Includes funding costs, hedging costs, etc.
 */

/**
 * Calculate interest expense for treasury division
 * @param {Object} treasuryDivision - Treasury division data
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Interest expense (annual and quarterly) - negative values
 */
export const calculateTreasuryInterestExpense = (treasuryDivision, assumptions, years) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    components: {
      fundingCost: new Array(10).fill(0),
      hedgingCost: new Array(10).fill(0),
      repoFunding: new Array(10).fill(0)
    }
  };

  // If treasury has pre-calculated results, use them
  if (treasuryDivision.pnl?.interestExpenses) {
    result.annual = treasuryDivision.pnl.interestExpenses;
    result.quarterly = treasuryDivision.pnl.quarterly?.interestExpenses || result.quarterly;
    return result;
  }

  // Calculate based on treasury funding needs
  const fundingRate = assumptions.euribor / 100; // Simplified: funding at EURIBOR
  const hedgingCost = 0.002; // 20 bps for hedging

  years.forEach(year => {
    // Funding gap cost (if any)
    if (treasuryDivision.bs?.fundingGap?.[year] > 0) {
      result.components.fundingCost[year] = -treasuryDivision.bs.fundingGap[year] * fundingRate;
    }
    
    // Hedging costs on trading portfolio
    if (treasuryDivision.bs?.tradingAssets?.[year]) {
      result.components.hedgingCost[year] = -treasuryDivision.bs.tradingAssets[year] * hedgingCost;
    }

    // Total treasury interest expense
    result.annual[year] = 
      result.components.fundingCost[year] + 
      result.components.hedgingCost[year] + 
      result.components.repoFunding[year];
  });

  // Quarterly distribution
  for (let q = 0; q < 40; q++) {
    const year = Math.floor(q / 4);
    if (year < 10) {
      result.quarterly[q] = result.annual[year] / 4;
    }
  }

  return result;
};