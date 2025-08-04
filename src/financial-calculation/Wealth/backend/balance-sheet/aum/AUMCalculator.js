/**
 * Assets Under Management (AUM) Calculator for Wealth Division
 * 
 * Calcola gli AUM totali per prodotto considerando:
 * - Nuovi investimenti (clienti × investimento medio)
 * - Scadenze/disinvestimenti basati su durata media
 * 
 * NOTA: L'AUM rappresenta solo il capitale investito, NON include i rendimenti maturati.
 * I rendimenti vengono tracciati separatamente per il calcolo del carried interest.
 */

export const calculateAUM = (assumptions, digitalClients, quarters = 40) => {
  const results = {
    quarterly: {
      total: new Array(quarters).fill(0),
      byProduct: {},
      newInflows: new Array(quarters).fill(0),
      outflows: new Array(quarters).fill(0),
      returns: new Array(quarters).fill(0)
    },
    annual: {
      total: new Array(10).fill(0),
      byProduct: {},
      newInflows: new Array(10).fill(0),
      outflows: new Array(10).fill(0),
      returns: new Array(10).fill(0)
    },
    metrics: {
      totalAUM: 0,
      peakAUM: 0,
      avgAUM: 0,
      totalInflows: 0,
      totalOutflows: 0,
      byProduct: {}
    }
  };

  // Prodotti Wealth definiti nelle assumptions
  const wealthProducts = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthIncentiveFund'];
  
  // Track investments by vintage for maturity calculations
  const investmentVintages = {};
  
  wealthProducts.forEach(productKey => {
    const product = assumptions.products?.[productKey];
    if (!product) return;

    const { adoptionRate } = product.digitalReferral || {};
    const { avgInvestmentPerClient, avgDealDuration } = product.captiveInvestment || {};
    const { expectedReturn } = product.carriedInterest || {};
    
    // Initialize arrays and vintage tracking
    results.quarterly.byProduct[productKey] = new Array(quarters).fill(0);
    results.annual.byProduct[productKey] = new Array(10).fill(0);
    investmentVintages[productKey] = new Array(quarters).fill(0);
    
    results.metrics.byProduct[productKey] = {
      totalInflows: 0,
      totalOutflows: 0,
      totalReturns: 0,
      peakAUM: 0,
      avgDuration: avgDealDuration
    };

    let currentAUM = 0;
    let totalAUM = 0;

    // Calculate quarterly AUM
    for (let q = 0; q < quarters; q++) {
      // Calculate new investments based on all Digital division customers (using correct keys)
      // Sum customers from all digital products
      const digitalBankAccount = digitalClients?.byProduct?.digitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
      const premiumDigitalAccount = digitalClients?.byProduct?.premiumDigitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
      const depositAccount = digitalClients?.byProduct?.depositAccount?.activeCustomers?.quarterly?.[q] || 0;
      
      // Total digital customers across all products
      const totalDigitalCustomers = digitalBankAccount + premiumDigitalAccount + depositAccount;
      
      // For Wealth, we can target all digital customers (not just affluent)
      // The adoption rate will determine who actually invests
      const targetableDigitalCustomers = totalDigitalCustomers;
      const newWealthClients = targetableDigitalCustomers * (adoptionRate / 100);
      const newInvestments = newWealthClients * avgInvestmentPerClient;
      
      // Track vintage for future maturity
      investmentVintages[productKey][q] = newInvestments;
      
      // Calculate returns on existing AUM (for tracking only, not added to AUM)
      const quarterlyReturn = currentAUM * (expectedReturn / 100) / 4;
      
      // Calculate outflows (maturities based on average duration)
      let outflows = 0;
      if (avgDealDuration > 0) {
        const maturityQuarter = q - (avgDealDuration * 4); // Convert years to quarters
        if (maturityQuarter >= 0 && maturityQuarter < quarters) {
          // Investments mature after avgDealDuration years
          // Only the original investment amount exits AUM
          const maturingInvestment = investmentVintages[productKey][maturityQuarter];
          outflows = maturingInvestment;
        }
      }
      
      // Update AUM: previous + new investments - outflows (returns NOT included in AUM)
      currentAUM = currentAUM + newInvestments - outflows;
      
      // Store results
      results.quarterly.byProduct[productKey][q] = currentAUM;
      results.quarterly.total[q] += currentAUM;
      results.quarterly.newInflows[q] += newInvestments;
      results.quarterly.outflows[q] += outflows;
      results.quarterly.returns[q] += quarterlyReturn;
      
      // Update metrics
      results.metrics.byProduct[productKey].totalInflows += newInvestments;
      results.metrics.byProduct[productKey].totalOutflows += outflows;
      results.metrics.byProduct[productKey].totalReturns += quarterlyReturn;
      results.metrics.byProduct[productKey].peakAUM = Math.max(
        results.metrics.byProduct[productKey].peakAUM,
        currentAUM
      );
      
      totalAUM += currentAUM;
    }
    
    // Calculate average AUM
    results.metrics.byProduct[productKey].avgAUM = totalAUM / quarters;

    // Calculate annual totals
    for (let year = 0; year < 10; year++) {
      let yearEndAUM = 0;
      let annualInflows = 0;
      let annualOutflows = 0;
      let annualReturns = 0;
      
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        if (quarterIndex < quarters) {
          yearEndAUM = results.quarterly.byProduct[productKey][quarterIndex];
          annualInflows += results.quarterly.newInflows[quarterIndex];
          annualOutflows += results.quarterly.outflows[quarterIndex];
          annualReturns += results.quarterly.returns[quarterIndex];
        }
      }
      
      results.annual.byProduct[productKey][year] = yearEndAUM;
      results.annual.total[year] = Math.max(results.annual.total[year], yearEndAUM);
      results.annual.newInflows[year] += annualInflows;
      results.annual.outflows[year] += annualOutflows;
      results.annual.returns[year] += annualReturns;
    }
  });

  // Calculate overall metrics
  results.metrics.totalInflows = results.quarterly.newInflows.reduce((sum, val) => sum + val, 0);
  results.metrics.totalOutflows = results.quarterly.outflows.reduce((sum, val) => sum + val, 0);
  results.metrics.peakAUM = Math.max(...results.quarterly.total);
  results.metrics.avgAUM = results.quarterly.total.reduce((sum, val) => sum + val, 0) / quarters;
  results.metrics.totalAUM = results.quarterly.total[quarters - 1]; // Final AUM

  return results;
};