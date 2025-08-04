/**
 * Wealth Referral Income Calculator for Digital Division
 * 
 * Calcola i ricavi da referral fees che Digital riceve da Wealth
 * per ogni cliente affluent segnalato alla divisione Wealth
 * 
 * Questi sono RICAVI per Digital (Commission Income)
 */

export const calculateWealthReferralIncome = (assumptions, customerGrowth, quarters = 40) => {
  const results = {
    quarterly: new Array(quarters).fill(0),
    yearly: new Array(10).fill(0),
    metrics: {
      totalReferralIncome: 0,
      totalClientsReferred: 0,
      avgReferralFee: 0
    }
  };

  // Get wealth products to extract referral fees
  const wealthProducts = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthIncentiveFund'];
  let totalReferralIncome = 0;
  let totalClientsReferred = 0;
  
  // Calculate quarterly referral income
  for (let q = 0; q < quarters; q++) {
    const year = Math.floor(q / 4);
    
    // Get all digital division customers (using correct product keys)
    const digitalBankAccount = customerGrowth?.byProduct?.digitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
    const premiumDigitalAccount = customerGrowth?.byProduct?.premiumDigitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
    const depositAccount = customerGrowth?.byProduct?.depositAccount?.activeCustomers?.quarterly?.[q] || 0;
    
    // Total digital customers across all products
    const totalDigitalCustomers = digitalBankAccount + premiumDigitalAccount + depositAccount;
    
    let quarterlyReferralIncome = 0;
    let quarterlyClientsReferred = 0;
    
    // Calculate referral income from each wealth product
    wealthProducts.forEach(productKey => {
      const product = assumptions.products?.[productKey];
      if (!product || !product.digitalReferral) return;
      
      const { adoptionRate, referralFee } = product.digitalReferral;
      
      // Calculate new wealth clients from this product
      const newWealthClients = totalDigitalCustomers * (adoptionRate / 100);
      
      // Calculate referral income
      const productReferralIncome = newWealthClients * referralFee;
      
      quarterlyReferralIncome += productReferralIncome;
      quarterlyClientsReferred += newWealthClients;
    });
    
    results.quarterly[q] = quarterlyReferralIncome;
    totalReferralIncome += quarterlyReferralIncome;
    totalClientsReferred += quarterlyClientsReferred;
  }
  
  // Calculate annual totals
  for (let year = 0; year < 10; year++) {
    let annualTotal = 0;
    for (let q = 0; q < 4; q++) {
      const quarterIndex = year * 4 + q;
      if (quarterIndex < quarters) {
        annualTotal += results.quarterly[quarterIndex];
      }
    }
    results.yearly[year] = annualTotal;
  }
  
  // Calculate metrics
  results.metrics.totalReferralIncome = totalReferralIncome;
  results.metrics.totalClientsReferred = totalClientsReferred;
  results.metrics.avgReferralFee = totalClientsReferred > 0 
    ? totalReferralIncome / totalClientsReferred 
    : 0;
  
  return results;
};