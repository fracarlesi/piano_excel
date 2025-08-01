/**
 * Treasury Interest Income Calculator
 * 
 * Calculates interest income from treasury and ALM activities
 * Includes income from liquidity buffer, trading portfolio, etc.
 */

/**
 * Calculate interest income for treasury division
 * @param {Object} treasuryDivision - Treasury division data
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Interest income (annual and quarterly)
 */
export const calculateTreasuryInterestIncome = (treasuryDivision, assumptions, years) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    components: {
      liquidityBuffer: new Array(10).fill(0),
      tradingPortfolio: new Array(10).fill(0),
      hedging: new Array(10).fill(0)
    }
  };

  // If treasury has pre-calculated results, use them
  if (treasuryDivision.pnl?.interestIncome) {
    result.annual = treasuryDivision.pnl.interestIncome;
    result.quarterly = treasuryDivision.pnl.quarterly?.interestIncome || result.quarterly;
    return result;
  }

  // Otherwise calculate based on treasury assets
  const liquidityYield = assumptions.euribor / 100; // Simplified: liquidity earns EURIBOR
  const tradingYield = (assumptions.euribor + 0.5) / 100; // Trading portfolio earns slightly more

  years.forEach(year => {
    if (treasuryDivision.bs?.liquidityBuffer?.[year]) {
      result.components.liquidityBuffer[year] = treasuryDivision.bs.liquidityBuffer[year] * liquidityYield;
    }
    
    if (treasuryDivision.bs?.tradingAssets?.[year]) {
      result.components.tradingPortfolio[year] = treasuryDivision.bs.tradingAssets[year] * tradingYield;
    }

    // Total treasury interest income
    result.annual[year] = 
      result.components.liquidityBuffer[year] + 
      result.components.tradingPortfolio[year] + 
      result.components.hedging[year];
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