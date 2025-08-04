/**
 * Management Fees Calculator for Wealth Division
 * 
 * Calcola i management fees ricorrenti sugli AUM (Assets Under Management)
 * Basato su: AUM totali × management fee % annuale
 */

export const calculateManagementFees = (assumptions, aumResults, quarters = 40) => {
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
      totalManagementFees: 0,
      avgAUM: 0,
      byProduct: {}
    }
  };

  // Prodotti Wealth definiti nelle assumptions
  const wealthProducts = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthIncentiveFund'];
  
  wealthProducts.forEach(productKey => {
    const product = assumptions.products?.[productKey];
    if (!product || !product.captiveInvestment) return;

    const { managementFee } = product.captiveInvestment;
    
    // Initialize arrays
    results.quarterly.byProduct[productKey] = new Array(quarters).fill(0);
    results.annual.byProduct[productKey] = new Array(10).fill(0);
    results.metrics.byProduct[productKey] = {
      totalFees: 0,
      avgAUM: 0,
      managementFeeRate: managementFee
    };

    let totalAUM = 0;
    let quarterCount = 0;

    // Calculate quarterly management fees
    for (let q = 0; q < quarters; q++) {
      // Get AUM for this product and quarter
      const aum = aumResults?.quarterly?.byProduct?.[productKey]?.[q] || 0;
      
      // Management fee is annual rate, so divide by 4 for quarterly
      const quarterlyManagementFees = aum * (managementFee / 100) / 4;
      
      results.quarterly.byProduct[productKey][q] = quarterlyManagementFees;
      results.quarterly.total[q] += quarterlyManagementFees;
      
      // Update metrics
      results.metrics.byProduct[productKey].totalFees += quarterlyManagementFees;
      totalAUM += aum;
      quarterCount++;
    }

    // Calculate average AUM
    results.metrics.byProduct[productKey].avgAUM = quarterCount > 0 ? totalAUM / quarterCount : 0;

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

  // Calculate total metrics
  results.metrics.totalManagementFees = results.quarterly.total.reduce((sum, val) => sum + val, 0);
  
  // Calculate average total AUM
  let totalAvgAUM = 0;
  Object.values(results.metrics.byProduct).forEach(productMetrics => {
    totalAvgAUM += productMetrics.avgAUM;
  });
  results.metrics.avgAUM = totalAvgAUM;

  return results;
};