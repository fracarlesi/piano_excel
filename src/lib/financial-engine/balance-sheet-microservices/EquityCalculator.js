/**
 * Equity Calculator Microservice
 * 
 * Responsible for calculating shareholders' equity evolution
 * Tracks retained earnings, capital increases, and book value
 */

/**
 * Main entry point for Equity calculation
 * @param {Object} netProfit - Net profit data from P&L
 * @param {Object} assumptions - Global assumptions including initial equity
 * @param {Array} years - Array of year indices
 * @param {Object} capitalActions - Optional capital actions (dividends, capital increases)
 * @returns {Object} Equity positions and metrics
 */
export const calculateEquity = (netProfit, assumptions, years, capitalActions = {}) => {
  const results = {
    components: {
      shareCapital: new Array(10).fill(0),
      retainedEarnings: new Array(10).fill(0),
      reserves: new Array(10).fill(0),
      currentYearProfit: new Array(10).fill(0),
      totalEquity: new Array(10).fill(0)
    },
    movements: {
      beginningEquity: new Array(10).fill(0),
      netProfit: new Array(10).fill(0),
      dividends: new Array(10).fill(0),
      capitalIncreases: new Array(10).fill(0),
      otherMovements: new Array(10).fill(0),
      endingEquity: new Array(10).fill(0)
    },
    metrics: {
      bookValuePerShare: new Array(10).fill(0),
      tangibleBookValue: new Array(10).fill(0),
      dividendPayoutRatio: new Array(10).fill(0),
      retentionRatio: new Array(10).fill(0)
    },
    regulatory: {
      cet1Capital: new Array(10).fill(0),
      tier1Capital: new Array(10).fill(0),
      tier2Capital: new Array(10).fill(0),
      totalCapital: new Array(10).fill(0)
    }
  };

  const initialEquity = assumptions.initialEquity || 200;
  const dividendPolicy = capitalActions.dividendPolicy || {
    payoutRatio: 0, // 0% payout (full retention) by default
    minPayout: 0,
    maxPayout: 0.5
  };

  // Initialize share capital
  results.components.shareCapital[0] = initialEquity;

  // Calculate equity evolution
  years.forEach(year => {
    // Beginning equity
    if (year === 0) {
      results.movements.beginningEquity[year] = initialEquity;
    } else {
      results.movements.beginningEquity[year] = results.movements.endingEquity[year - 1];
    }

    // Net profit for the year
    const yearProfit = netProfit.consolidated?.annual?.[year] || 0;
    results.movements.netProfit[year] = yearProfit;
    results.components.currentYearProfit[year] = yearProfit;

    // Calculate dividends based on policy
    let dividends = 0;
    if (yearProfit > 0 && year > 0) { // No dividends in year 0 or on losses
      const targetPayout = yearProfit * dividendPolicy.payoutRatio;
      dividends = Math.max(
        dividendPolicy.minPayout || 0,
        Math.min(targetPayout, yearProfit * (dividendPolicy.maxPayout || 0.5))
      );
    }
    results.movements.dividends[year] = -dividends;

    // Capital increases (if any)
    const capitalIncrease = capitalActions.capitalIncreases?.[year] || 0;
    results.movements.capitalIncreases[year] = capitalIncrease;
    
    if (capitalIncrease > 0) {
      results.components.shareCapital[year] = 
        (year > 0 ? results.components.shareCapital[year - 1] : initialEquity) + capitalIncrease;
    } else {
      results.components.shareCapital[year] = 
        year > 0 ? results.components.shareCapital[year - 1] : initialEquity;
    }

    // Update retained earnings
    if (year === 0) {
      results.components.retainedEarnings[year] = 0;
    } else {
      results.components.retainedEarnings[year] = 
        results.components.retainedEarnings[year - 1] + 
        results.movements.netProfit[year - 1] + 
        results.movements.dividends[year - 1];
    }

    // Calculate ending equity
    results.movements.endingEquity[year] = 
      results.movements.beginningEquity[year] +
      results.movements.netProfit[year] +
      results.movements.dividends[year] +
      results.movements.capitalIncreases[year] +
      results.movements.otherMovements[year];

    // Total equity components
    results.components.totalEquity[year] = results.movements.endingEquity[year];

    // Calculate metrics
    calculateEquityMetrics(results, year, yearProfit, dividends, assumptions);

    // Calculate regulatory capital
    calculateRegulatoryCapital(results, year, assumptions);
  });

  return results;
};

/**
 * Calculate equity metrics
 * @param {Object} results - Results object
 * @param {number} year - Year index
 * @param {number} yearProfit - Net profit for the year
 * @param {number} dividends - Dividends paid
 * @param {Object} assumptions - Global assumptions
 */
const calculateEquityMetrics = (results, year, yearProfit, dividends, assumptions) => {
  const totalEquity = results.components.totalEquity[year];
  const sharesOutstanding = assumptions.sharesOutstanding || 100000000; // 100M shares default

  // Book value per share
  if (sharesOutstanding > 0) {
    results.metrics.bookValuePerShare[year] = totalEquity / sharesOutstanding * 1000000; // Convert to per share
  }

  // Tangible book value (assuming no intangibles for now)
  results.metrics.tangibleBookValue[year] = totalEquity;

  // Dividend payout ratio
  if (yearProfit > 0 && dividends > 0) {
    results.metrics.dividendPayoutRatio[year] = (dividends / yearProfit) * 100;
    results.metrics.retentionRatio[year] = ((yearProfit - dividends) / yearProfit) * 100;
  } else if (yearProfit > 0) {
    results.metrics.dividendPayoutRatio[year] = 0;
    results.metrics.retentionRatio[year] = 100;
  } else {
    results.metrics.dividendPayoutRatio[year] = 0;
    results.metrics.retentionRatio[year] = 0;
  }
};

/**
 * Calculate regulatory capital components
 * @param {Object} results - Results object
 * @param {number} year - Year index
 * @param {Object} assumptions - Global assumptions
 */
const calculateRegulatoryCapital = (results, year, assumptions) => {
  const totalEquity = results.components.totalEquity[year];
  
  // CET1 Capital (Common Equity Tier 1)
  // Simplified: equity minus current year profit (if not yet audited)
  results.regulatory.cet1Capital[year] = totalEquity - results.components.currentYearProfit[year];
  
  // Add back current year profit if retained (conservative approach)
  if (results.movements.dividends[year] === 0) {
    results.regulatory.cet1Capital[year] = totalEquity;
  }
  
  // Tier 1 Capital (CET1 + Additional Tier 1)
  const at1Capital = assumptions.additionalTier1?.[year] || 0;
  results.regulatory.tier1Capital[year] = results.regulatory.cet1Capital[year] + at1Capital;
  
  // Tier 2 Capital
  const tier2Capital = assumptions.tier2Capital?.[year] || 0;
  results.regulatory.tier2Capital[year] = tier2Capital;
  
  // Total Regulatory Capital
  results.regulatory.totalCapital[year] = 
    results.regulatory.tier1Capital[year] + 
    results.regulatory.tier2Capital[year];
};

/**
 * Calculate return on equity metrics
 * @param {Object} equity - Equity results
 * @param {Object} netProfit - Net profit data
 * @param {Array} years - Array of year indices
 * @returns {Object} ROE metrics
 */
export const calculateROEMetrics = (equity, netProfit, years) => {
  const roeMetrics = {
    roe: new Array(10).fill(0),
    averageEquity: new Array(10).fill(0),
    leverageMultiplier: new Array(10).fill(0)
  };

  years.forEach(year => {
    // Average equity (beginning + ending) / 2
    const beginningEquity = equity.movements.beginningEquity[year];
    const endingEquity = equity.movements.endingEquity[year];
    roeMetrics.averageEquity[year] = (beginningEquity + endingEquity) / 2;

    // ROE calculation
    if (roeMetrics.averageEquity[year] > 0) {
      const yearProfit = netProfit.consolidated?.annual?.[year] || 0;
      roeMetrics.roe[year] = (yearProfit / roeMetrics.averageEquity[year]) * 100;
    }
  });

  return roeMetrics;
};