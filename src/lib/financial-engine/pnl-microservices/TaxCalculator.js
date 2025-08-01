/**
 * Tax Calculator Microservice
 * 
 * Responsible for calculating corporate income taxes
 * Handles tax loss carryforwards and deferred tax assets/liabilities
 */

/**
 * Main entry point for Tax calculation
 * @param {Object} preTaxProfit - Pre-tax profit by division and consolidated
 * @param {Object} assumptions - Global assumptions including tax rate
 * @param {Array} years - Array of year indices
 * @returns {Object} Tax expense and related metrics
 */
export const calculateTaxes = (preTaxProfit, assumptions, years) => {
  const results = {
    byDivision: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0)
    },
    components: {
      currentTax: new Array(10).fill(0),
      deferredTax: new Array(10).fill(0),
      taxCredits: new Array(10).fill(0)
    },
    metrics: {
      effectiveTaxRate: new Array(10).fill(0),
      taxShield: new Array(10).fill(0)
    },
    taxAssets: {
      lossCarryforward: new Array(10).fill(0),
      deferredTaxAsset: new Array(10).fill(0)
    }
  };

  const taxRate = (assumptions.taxRate || 28) / 100;
  let accumulatedLosses = 0;

  // Calculate consolidated taxes with loss carryforward
  years.forEach(year => {
    const profit = preTaxProfit.consolidated?.annual?.[year] || 0;
    
    if (profit > 0) {
      // Profitable year
      let taxableIncome = profit;
      
      // Use accumulated losses to offset taxable income
      if (accumulatedLosses > 0) {
        const lossUtilization = Math.min(accumulatedLosses, taxableIncome);
        taxableIncome -= lossUtilization;
        accumulatedLosses -= lossUtilization;
        results.components.taxCredits[year] = lossUtilization * taxRate;
      }
      
      // Calculate current tax
      results.components.currentTax[year] = -taxableIncome * taxRate;
      results.consolidated.annual[year] = results.components.currentTax[year];
      
      // Calculate effective tax rate
      results.metrics.effectiveTaxRate[year] = 
        profit > 0 ? (Math.abs(results.consolidated.annual[year]) / profit) * 100 : 0;
    } else {
      // Loss year - accumulate losses
      accumulatedLosses += Math.abs(profit);
      results.consolidated.annual[year] = 0; // No tax on losses
      results.metrics.effectiveTaxRate[year] = 0;
    }
    
    // Track tax assets
    results.taxAssets.lossCarryforward[year] = accumulatedLosses;
    results.taxAssets.deferredTaxAsset[year] = accumulatedLosses * taxRate;
  });

  // Calculate division-level taxes (simplified allocation)
  if (preTaxProfit.byDivision) {
    Object.entries(preTaxProfit.byDivision).forEach(([divKey, divProfit]) => {
      results.byDivision[divKey] = {
        annual: new Array(10).fill(0),
        quarterly: new Array(40).fill(0)
      };
      
      years.forEach(year => {
        const profit = divProfit.annual?.[year] || 0;
        if (profit > 0) {
          // Allocate tax proportionally
          const consolidatedProfit = preTaxProfit.consolidated.annual[year];
          if (consolidatedProfit > 0) {
            const share = profit / consolidatedProfit;
            results.byDivision[divKey].annual[year] = 
              results.consolidated.annual[year] * share;
          }
        }
      });
    });
  }

  // Quarterly distribution
  for (let q = 0; q < 40; q++) {
    const year = Math.floor(q / 4);
    if (year < 10) {
      results.consolidated.quarterly[q] = results.consolidated.annual[year] / 4;
      
      Object.keys(results.byDivision).forEach(divKey => {
        results.byDivision[divKey].quarterly[q] = 
          results.byDivision[divKey].annual[year] / 4;
      });
    }
  }

  return results;
};

/**
 * Calculate pre-tax profit
 * @param {Object} operatingProfit - Operating profit after LLP
 * @param {Object} otherItems - Other P&L items (if any)
 * @returns {Object} Pre-tax profit
 */
export const calculatePreTaxProfit = (operatingProfit, otherItems = null) => {
  if (!otherItems) {
    return operatingProfit;
  }

  // Add any other items to operating profit
  return {
    consolidated: {
      annual: operatingProfit.consolidated.annual.map((op, i) => 
        op + (otherItems.consolidated?.annual?.[i] || 0)
      ),
      quarterly: operatingProfit.consolidated.quarterly.map((op, i) => 
        op + (otherItems.consolidated?.quarterly?.[i] || 0)
      )
    },
    byDivision: Object.keys(operatingProfit.byDivision).reduce((acc, divKey) => {
      acc[divKey] = {
        annual: operatingProfit.byDivision[divKey].annual.map((op, i) => 
          op + (otherItems.byDivision?.[divKey]?.annual?.[i] || 0)
        ),
        quarterly: operatingProfit.byDivision[divKey].quarterly.map((op, i) => 
          op + (otherItems.byDivision?.[divKey]?.quarterly?.[i] || 0)
        )
      };
      return acc;
    }, {})
  };
};

/**
 * Calculate net profit
 * @param {Object} preTaxProfit - Pre-tax profit
 * @param {Object} taxes - Tax expense
 * @returns {Object} Net profit
 */
export const calculateNetProfit = (preTaxProfit, taxes) => {
  return {
    consolidated: {
      annual: preTaxProfit.consolidated.annual.map((profit, i) => 
        profit + taxes.consolidated.annual[i]
      ),
      quarterly: preTaxProfit.consolidated.quarterly.map((profit, i) => 
        profit + taxes.consolidated.quarterly[i]
      )
    },
    byDivision: Object.keys(preTaxProfit.byDivision).reduce((acc, divKey) => {
      acc[divKey] = {
        annual: preTaxProfit.byDivision[divKey].annual.map((profit, i) => 
          profit + (taxes.byDivision[divKey]?.annual[i] || 0)
        ),
        quarterly: preTaxProfit.byDivision[divKey].quarterly.map((profit, i) => 
          profit + (taxes.byDivision[divKey]?.quarterly[i] || 0)
        )
      };
      return acc;
    }, {})
  };
};