/**
 * Carried Interest Calculator for Wealth Division
 * 
 * Calcola il carried interest sui rendimenti generati per i clienti
 * Formula: AUM × rendimento cliente × carried interest %
 * 
 * Esempio: €1M AUM × 12% rendimento × 20% carried = €24k
 */

export const calculateCarriedInterest = (assumptions, aumResults, quarters = 40) => {
  const results = {
    quarterly: {
      total: new Array(quarters).fill(0),
      byProduct: {}
    },
    annual: {
      total: new Array(10).fill(0),
      byProduct: {}
    },
    metrics: {
      totalCarriedInterest: 0,
      totalClientReturns: 0,
      byProduct: {}
    }
  };

  // Prodotti Wealth definiti nelle assumptions
  const wealthProducts = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthIncentiveFund'];
  
  wealthProducts.forEach(productKey => {
    const product = assumptions.products?.[productKey];
    if (!product || !product.carriedInterest) return;

    const { percentage: carriedPercentage, expectedReturn } = product.carriedInterest;
    
    // Initialize arrays
    results.quarterly.byProduct[productKey] = new Array(quarters).fill(0);
    results.annual.byProduct[productKey] = new Array(10).fill(0);
    results.metrics.byProduct[productKey] = {
      totalCarried: 0,
      totalClientReturns: 0,
      carriedPercentage,
      expectedReturn,
      effectiveRate: (expectedReturn * carriedPercentage) / 100
    };

    // Calculate quarterly carried interest
    for (let q = 0; q < quarters; q++) {
      // Get AUM for this product and quarter
      const aum = aumResults?.quarterly?.byProduct?.[productKey]?.[q] || 0;
      
      // Calculate client returns (annual rate divided by 4 for quarterly)
      const quarterlyClientReturns = aum * (expectedReturn / 100) / 4;
      
      // Calculate carried interest (percentage of client returns)
      const quarterlyCarriedInterest = quarterlyClientReturns * (carriedPercentage / 100);
      
      results.quarterly.byProduct[productKey][q] = quarterlyCarriedInterest;
      results.quarterly.total[q] += quarterlyCarriedInterest;
      
      // Update metrics
      results.metrics.byProduct[productKey].totalCarried += quarterlyCarriedInterest;
      results.metrics.byProduct[productKey].totalClientReturns += quarterlyClientReturns;
      results.metrics.totalCarriedInterest += quarterlyCarriedInterest;
      results.metrics.totalClientReturns += quarterlyClientReturns;
    }

    // Calculate annual totals
    for (let year = 0; year < 10; year++) {
      let annualTotal = 0;
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        if (quarterIndex < quarters) {
          annualTotal += results.quarterly.byProduct[productKey][quarterIndex];
        }
      }
      results.annual.byProduct[productKey][year] = annualTotal;
      results.annual.total[year] += annualTotal;
    }
  });

  // Add summary metrics
  results.metrics.averageCarriedRate = results.metrics.totalClientReturns > 0 
    ? (results.metrics.totalCarriedInterest / results.metrics.totalClientReturns) * 100 
    : 0;

  return results;
};