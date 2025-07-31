/**
 * Digital Banking Calculator Module
 * 
 * Handles funnel-based digital customer calculations including:
 * - Customer acquisition and retention
 * - Deposit collection and management
 * - Service monetization and cross-selling
 */

/**
 * Calculate digital banking product results using funnel approach
 * 
 * @param {Object} product - Digital product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @param {number} ftpRate - Funds Transfer Pricing rate
 * @param {number} depositRate - Rate paid to customers on deposits
 * @returns {Object} Complete digital product calculation results
 */
export const calculateDigitalProduct = (product, assumptions, years, ftpRate, depositRate) => {
  // Use volumeArray for deposit volumes (same logic as other products)
  const volumes10Y = years.map(i => {
    let yearVolume;
    
    if (product.volumeArray && Array.isArray(product.volumeArray) && product.volumeArray.length === 10) {
      yearVolume = product.volumeArray[i] || 0;
    } else if (product.volumes) {
      const yearKey = `y${i + 1}`;
      if (product.volumes[yearKey] !== undefined) {
        yearVolume = product.volumes[yearKey];
      } else {
        const y1 = product.volumes.y1 || 0;
        const y10 = product.volumes.y10 || 0;
        yearVolume = y1 + ((y10 - y1) * i / 9);
      }
    } else {
      yearVolume = 0;
    }
    
    const quarterlyDist = product.quarterlyDist || [25, 25, 25, 25];
    const quarterlyMultiplier = quarterlyDist.reduce((sum, q) => sum + q, 0) / 100;
    return yearVolume * quarterlyMultiplier;
  });
  
  // For deposit products, volumes represent deposit stock (cumulative)
  // Calculate deposit stock evolution: previous stock + new deposits - withdrawals
  const depositStock = [];
  const retentionRate = 0.90; // 90% retention rate
  
  for (let i = 0; i < years.length; i++) {
    if (i === 0) {
      depositStock[i] = volumes10Y[i];
    } else {
      // Previous stock * retention rate + new deposits
      depositStock[i] = depositStock[i-1] * retentionRate + volumes10Y[i];
    }
  }
  
  // Interest expense: what we pay to customers on their deposits
  const interestExpense = depositStock.map(stock => -stock * depositRate);
  
  // Interest income: what Treasury pays us for providing liquidity (FTP rate)
  const interestIncome = depositStock.map(stock => stock * ftpRate);
  
  // Commission income from deposit accounts (account fees, service charges)
  const baseCommissionRate = 0.002; // 20 bps on deposits
  const commissionIncome = depositStock.map(stock => stock * baseCommissionRate);
  
  // No RWA for pure deposit products (they're liabilities, not assets)
  const rwa = years.map(() => 0);
  
  // No LLP for deposit products
  const llp = years.map(() => 0);
  
  // Number of accounts (assuming average deposit per account)
  const avgDepositPerAccount = 0.01; // €10k average per account
  const numberOfAccounts = depositStock.map(stock => Math.round(stock / avgDepositPerAccount));
  
  return {
    performingAssets: years.map(() => 0), // Deposits are liabilities, not assets
    nonPerformingAssets: years.map(() => 0),
    depositStock: depositStock,
    interestIncome: interestIncome,
    interestExpense: interestExpense,
    commissionIncome: commissionIncome,
    llp: llp,
    rwa: rwa,
    numberOfAccounts: numberOfAccounts,
    volumes: volumes10Y
  };
};

/**
 * Calculate unified digital customer model with modular services
 * 
 * @param {Object} product - Digital customer product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @param {number} ftpRate - Funds Transfer Pricing rate
 * @returns {Object} Complete digital customer calculation results
 */
export const calculateDigitalCustomerModel = (product, assumptions, years, ftpRate) => {
  const acquisition = product.acquisition || {};
  const baseAccount = product.baseAccount || {};
  const savingsModule = product.savingsModule || {};
  const premiumServices = product.premiumServicesModule || {};
  const wealthReferral = product.wealthManagementReferral || {};
  
  // Customer base evolution
  const customerBase = [];
  const newCustomers = [];
  const churnRate = (acquisition.churnRate || 5) / 100;
  
  for (let i = 0; i < years.length; i++) {
    // New customer acquisition
    if (i < 5) {
      // Linear growth for first 5 years
      const y1Customers = acquisition.newCustomers?.y1 || 0;
      const y5Customers = acquisition.newCustomers?.y5 || 0;
      newCustomers[i] = y1Customers + ((y5Customers - y1Customers) * i / 4);
    } else {
      // Stable acquisition after year 5
      newCustomers[i] = acquisition.newCustomers?.y5 || 0;
    }
    
    // Customer base calculation
    if (i === 0) {
      customerBase[i] = newCustomers[i];
    } else {
      customerBase[i] = customerBase[i-1] * (1 - churnRate) + newCustomers[i];
    }
  }
  
  // Base account deposits
  const avgDepositPerCustomer = (baseAccount.avgDeposit || 0) / 1000000; // Convert to €M
  const baseDeposits = customerBase.map(customers => customers * avgDepositPerCustomer);
  
  // Savings module adoption
  const savingsAdoptionRate = (savingsModule.adoptionRate || 0) / 100;
  const savingsCustomers = customerBase.map(customers => customers * savingsAdoptionRate);
  const avgAdditionalDeposit = (savingsModule.avgAdditionalDeposit || 0) / 1000000; // Convert to €M
  const savingsDeposits = savingsCustomers.map(customers => customers * avgAdditionalDeposit);
  
  // Total deposits
  const totalDeposits = years.map((_, i) => baseDeposits[i] + savingsDeposits[i]);
  
  // Interest calculations
  const baseInterestRate = (baseAccount.interestRate || 0) / 100;
  const savingsMix = savingsModule.depositMix || [];
  
  // Calculate weighted average savings rate
  let weightedSavingsRate = 0;
  savingsMix.forEach(product => {
    const percentage = (product.percentage || 0) / 100;
    const rate = (product.interestRate || 0) / 100;
    weightedSavingsRate += percentage * rate;
  });
  
  // Interest expense (paid to customers)
  const baseInterestExpense = baseDeposits.map(deposits => -deposits * baseInterestRate);
  const savingsInterestExpense = savingsDeposits.map(deposits => -deposits * weightedSavingsRate);
  const totalInterestExpense = years.map((_, i) => baseInterestExpense[i] + savingsInterestExpense[i]);
  
  // Interest income (from Treasury at FTP rate)
  const interestIncome = totalDeposits.map(deposits => deposits * ftpRate);
  
  // Commission and fee income
  const monthlyFee = (baseAccount.monthlyFee || 0) * 12 / 1000000; // Annual fee in €M
  const accountFees = customerBase.map(customers => customers * monthlyFee);
  
  // Premium services revenue
  const premiumAdoptionRate = (premiumServices.adoptionRate || 0) / 100;
  const premiumCustomers = customerBase.map(customers => customers * premiumAdoptionRate);
  const avgPremiumRevenue = (premiumServices.avgAnnualRevenue || 0) / 1000000; // Convert to €M
  const premiumRevenue = premiumCustomers.map(customers => customers * avgPremiumRevenue);
  
  // Wealth management referral fees
  const wealthAdoptionRate = (wealthReferral.adoptionRate || 0) / 100;
  const wealthReferrals = customerBase.map(customers => customers * wealthAdoptionRate);
  const referralFee = (wealthReferral.referralFee || 0) / 1000000; // Convert to €M
  const referralRevenue = wealthReferrals.map(referrals => referrals * referralFee);
  
  // Total commission income
  const totalCommissionIncome = years.map((_, i) => 
    accountFees[i] + premiumRevenue[i] + referralRevenue[i]
  );
  
  // Customer acquisition costs
  const cac = (acquisition.cac || 0) / 1000000; // Convert to €M
  const acquisitionCosts = newCustomers.map(customers => -customers * cac);
  
  return {
    performingAssets: years.map(() => 0), // Digital customers are deposit-based
    nonPerformingAssets: years.map(() => 0),
    depositStock: totalDeposits,
    customerBase: customerBase,
    newCustomers: newCustomers,
    interestIncome: interestIncome,
    interestExpense: totalInterestExpense,
    commissionIncome: totalCommissionIncome,
    acquisitionCosts: acquisitionCosts,
    llp: years.map(() => 0),
    rwa: years.map(() => 0),
    
    // Detailed metrics for reporting
    metrics: {
      baseDeposits: baseDeposits,
      savingsDeposits: savingsDeposits,
      savingsCustomers: savingsCustomers,
      premiumCustomers: premiumCustomers,
      wealthReferrals: wealthReferrals,
      accountFees: accountFees,
      premiumRevenue: premiumRevenue,
      referralRevenue: referralRevenue
    }
  };
};