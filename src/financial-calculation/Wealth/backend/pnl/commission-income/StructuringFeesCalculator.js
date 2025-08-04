/**
 * Structuring Fees Calculator for Wealth Division
 * 
 * Calcola i structuring fees (one-time) sui nuovi investimenti
 * Basato su: numero clienti × investimento medio × structuring fee %
 */

export const calculateStructuringFees = (assumptions, referralResults, quarters = 40) => {
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
      totalStructuringFees: 0,
      totalInvestmentsStructured: 0,
      byProduct: {}
    }
  };

  // Prodotti Wealth definiti nelle assumptions
  const wealthProducts = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthTechVenture', 'wealthIncentiveFund'];
  
  wealthProducts.forEach(productKey => {
    const product = assumptions.products?.[productKey];
    if (!product || !product.captiveInvestment) return;

    const { avgInvestmentPerClient, structuringFee } = product.captiveInvestment;
    const { adoptionRate } = product.digitalReferral || { adoptionRate: 0 };
    
    // Initialize arrays
    results.quarterly.byProduct[productKey] = new Array(quarters).fill(0);
    results.annual.byProduct[productKey] = new Array(10).fill(0);
    results.metrics.byProduct[productKey] = {
      totalFees: 0,
      totalVolume: 0,
      avgInvestmentPerClient,
      structuringFeeRate: structuringFee
    };

    // Calculate quarterly structuring fees
    for (let q = 0; q < quarters; q++) {
      // Get all digital division customers (using correct keys)
      const digitalBankAccount = referralResults?.digitalClients?.byProduct?.digitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
      const premiumDigitalAccount = referralResults?.digitalClients?.byProduct?.premiumDigitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
      const depositAccount = referralResults?.digitalClients?.byProduct?.depositAccount?.activeCustomers?.quarterly?.[q] || 0;
      
      // Total digital customers across all products
      const totalDigitalCustomers = digitalBankAccount + premiumDigitalAccount + depositAccount;
      
      // Calculate new wealth clients
      const newWealthClients = totalDigitalCustomers * (adoptionRate / 100);
      
      // Calculate total new investments
      const newInvestmentVolume = newWealthClients * avgInvestmentPerClient;
      
      // Calculate structuring fees (one-time on new investments)
      const quarterlyStructuringFees = newInvestmentVolume * (structuringFee / 100);
      
      results.quarterly.byProduct[productKey][q] = quarterlyStructuringFees;
      results.quarterly.total[q] += quarterlyStructuringFees;
      
      // Update metrics
      results.metrics.byProduct[productKey].totalFees += quarterlyStructuringFees;
      results.metrics.byProduct[productKey].totalVolume += newInvestmentVolume;
      results.metrics.totalStructuringFees += quarterlyStructuringFees;
      results.metrics.totalInvestmentsStructured += newInvestmentVolume;
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

  return results;
};