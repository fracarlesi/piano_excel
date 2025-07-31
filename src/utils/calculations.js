import { calculatePersonnelCosts } from './calculatePersonnelCosts';

/**
 * Calculate Deposit Product results (for Digital Banking division)
 * These products work as liabilities - they collect deposits from customers
 */
const calculateDepositProduct = (product, assumptions, years, ftpRate, depositRate) => {
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
  const retentionRate = 0.90;
  
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
  
  // Commission income from account fees, transaction fees, etc.
  const commissionIncome = volumes10Y.map(v => v * (product.commissionRate || 0) / 100);
  
  return {
    name: product.name,
    volumes: volumes10Y,
    depositStock: depositStock, // This is the key metric for deposit products
    performingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Deposit products don't create assets
    averagePerformingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    nonPerformingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    interestIncome: interestIncome, // Revenue from Treasury FTP
    interestExpense: interestExpense, // Cost of customer deposits
    commissionIncome: commissionIncome,
    commissionExpense: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    llp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // No credit losses on deposits
    rwa: depositStock.map(stock => stock * 0.20), // 20% RWA weight for operational risk
    newBusiness: volumes10Y,
    numberOfLoans: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Deposits are not loans
  };
};

/**
 * Calculate Commission Product results
 */
const calculateCommissionProduct = (product, assumptions, years) => {
  // Use volumeArray if available, otherwise fallback to interpolation (same logic as credit products)
  const volumes10Y = years.map(i => {
    let yearVolume;
    
    // Priority 1: Use volumeArray if available
    if (product.volumeArray && Array.isArray(product.volumeArray) && product.volumeArray.length === 10) {
      yearVolume = product.volumeArray[i] || 0;
    }
    // Priority 2: Use individual year keys (y1, y2, etc.)
    else if (product.volumes) {
      const yearKey = `y${i + 1}`;
      if (product.volumes[yearKey] !== undefined) {
        yearVolume = product.volumes[yearKey];
      } else {
        // Priority 3: Fallback to linear interpolation between y1 and y10
        const y1 = product.volumes.y1 || 0;
        const y10 = product.volumes.y10 !== undefined ? product.volumes.y10 : 0;
        
        // Special case for bullet loans with short duration: only originate in year 1
        if ((product.type || '').toLowerCase() === 'bullet' && product.durata <= 2 && y10 === 0 && i > 0) {
          yearVolume = 0; // No new originations after year 1
        } else {
          yearVolume = y1 + ((y10 - y1) * i / 9);
        }
      }
    }
    // Priority 4: Default to zero
    else {
      yearVolume = 0;
    }
    
    // Apply quarterly distribution if provided
    const quarterlyDist = product.quarterlyDist || [25, 25, 25, 25];
    const quarterlyMultiplier = quarterlyDist.reduce((sum, q) => sum + q, 0) / 100;
    
    return yearVolume * quarterlyMultiplier;
  });
  
  // Commission-based calculations
  const commissionIncome = volumes10Y.map(v => v * (product.commissionRate || 0) / 100);
  const feeIncome = volumes10Y.map(v => v * (product.feeIncomeRate || 0) / 100);
  const setupFees = volumes10Y.map(v => v * (product.setupFeeRate || 0) / 100);
  const managementFees = volumes10Y.map(v => v * (product.managementFeeRate || 0) / 100);
  const performanceFees = volumes10Y.map(v => v * (product.performanceFeeRate || 0) / 100);
  
  const totalCommissionIncome = commissionIncome.map((ci, i) => 
    ci + feeIncome[i] + setupFees[i] + managementFees[i] + performanceFees[i]
  );
  
  // Commission products have minimal RWA, also apply state guarantee if present
  const baseOperationalRWA = (product.operationalRiskWeight || 15) / 100;
  const stateGuaranteePercentage = (product.stateGuaranteePercentage || 0) / 100;
  const adjustedOperationalRWA = baseOperationalRWA * (1 - stateGuaranteePercentage);
  const operationalRWA = volumes10Y.map(v => v * adjustedOperationalRWA);
  
  return {
    name: product.name,
    performingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // No lending assets
    averagePerformingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    nonPerformingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    interestIncome: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // No interest income
    interestExpense: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    commissionIncome: totalCommissionIncome,
    commissionExpense: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Can be added if needed
    llp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // No credit losses
    rwa: operationalRWA,
    numberOfTransactions: volumes10Y.map(v => Math.round(v / (product.avgTransactionSize || 0.001))),
    numberOfLoans: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Commission products are not loans
    newBusiness: volumes10Y,
    assumptions: {
      commissionRate: (product.commissionRate || 0) / 100,
      feeIncomeRate: (product.feeIncomeRate || 0) / 100,
      operationalRiskWeight: adjustedOperationalRWA,
      baseOperationalRiskWeight: baseOperationalRWA,
      stateGuaranteePercentage: stateGuaranteePercentage
    }
  };
};

/**
 * Calculate Digital Service Product results (for Digital Banking division)
 * These products are based on customer acquisition and service revenue
 */
const calculateDigitalServiceProduct = (product, assumptions, years, ftpRate) => {
  const customers = years.map(i => {
    // First check if there's a customerArray
    if (product.customerArray && Array.isArray(product.customerArray) && product.customerArray.length === 10) {
      return product.customerArray[i] || 0;
    }
    // Otherwise use customers object
    if (product.customers) {
      if (product.customers[`y${i + 1}`] !== undefined) {
        return product.customers[`y${i + 1}`];
      } else {
        // Linear interpolation between y1 and y5
        const y1 = product.customers.y1 || 0;
        const y5 = product.customers.y5 || 0;
        if (i < 5) {
          return y1 + ((y5 - y1) * i / 4);
        } else {
          // Beyond year 5, maintain y5 level
          return y5;
        }
      }
    }
    return 0;
  });

  // Calculate total customers: previous year customers * (1 - churn) + new customers
  const totalCustomers = [];
  const churnRate = (product.churnRate || 5) / 100;
  
  for (let i = 0; i < years.length; i++) {
    if (i === 0) {
      totalCustomers[i] = customers[i];
    } else {
      totalCustomers[i] = totalCustomers[i-1] * (1 - churnRate) + customers[i];
    }
  }

  // Calculate average customers for the year (for revenue calculations)
  const avgCustomers = totalCustomers.map((current, i) => {
    if (i === 0) return current / 2; // Half year for first year
    return (totalCustomers[i-1] + current) / 2;
  });

  // Calculate deposit stock: Total Customers * Average Deposit
  const avgDeposit = (product.avgDeposit || 0) / 1000000; // Convert to millions
  const depositStock = totalCustomers.map(customers => customers * avgDeposit);

  // Calculate revenues
  const monthlyFee = product.monthlyFee || 0;
  const annualServiceRevenue = product.annualServiceRevenue || 0;
  
  // Fee Income = Average Customers * Monthly Fee * 12 + Average Customers * Annual Service Revenue
  const feeIncome = avgCustomers.map(customers => 
    (customers * monthlyFee * 12 + customers * annualServiceRevenue) / 1000000 // Convert to millions
  );

  // Calculate costs
  const cac = product.cac || 0;
  const marketingCosts = customers.map(newCustomers => 
    -(newCustomers * cac) / 1000000 // Convert to millions, negative as cost
  );

  // Interest Expense = Deposit Stock * Deposit Interest Rate
  const depositInterestRate = (product.depositInterestRate || 0) / 100;
  const interestExpense = depositStock.map(stock => -stock * depositInterestRate);

  // Interest Income from Treasury (FTP): Deposit Stock * FTP Rate
  const interestIncome = depositStock.map(stock => stock * ftpRate);

  return {
    name: product.name,
    volumes: customers, // New customers per year
    totalCustomers: totalCustomers,
    avgCustomers: avgCustomers,
    depositStock: depositStock, // Total deposit liability
    performingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Digital services don't create credit assets
    averagePerformingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    nonPerformingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    interestIncome: interestIncome, // Revenue from Treasury FTP
    interestExpense: interestExpense, // Cost of deposit interest
    commissionIncome: feeIncome, // Service fees and monthly fees
    commissionExpense: marketingCosts, // Customer acquisition costs
    llp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // No credit losses
    rwa: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Minimal operational RWA for digital services
    newBusiness: customers,
    numberOfLoans: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Digital services are not loans
    assumptions: {
      cac: cac,
      avgDeposit: product.avgDeposit || 0,
      churnRate: churnRate * 100,
      monthlyFee: monthlyFee,
      annualServiceRevenue: annualServiceRevenue,
      depositInterestRate: depositInterestRate * 100,
      ftpRate: ftpRate * 100
    }
  };
};

/**
 * Calculate Deposit and Service Product results (Digital Banking model)
 * Handles products with customer-based metrics and deposit funding
 */
const calculateDepositAndServiceProduct = (product, assumptions, years, ftpRate, baseProductResults = null) => {
  // Handle special case for unified digitalRetailCustomer
  if (product.acquisition && product.baseAccount && product.savingsModule) {
    // This is the new unified customer model
    const newCustomers = years.map(i => {
      const y1 = product.acquisition.newCustomers.y1 || 0;
      const y5 = product.acquisition.newCustomers.y5 || 0;
      if (i < 5) {
        return y1 + ((y5 - y1) * i / 4);
      } else {
        return y5;
      }
    });

    // Calculate total customer stock
    const totalCustomers = [];
    const churnRate = (product.acquisition.churnRate || 5) / 100;
    
    for (let i = 0; i < years.length; i++) {
      if (i === 0) {
        totalCustomers[i] = newCustomers[i];
      } else {
        totalCustomers[i] = totalCustomers[i-1] * (1 - churnRate) + newCustomers[i];
      }
    }

    // Calculate average customers for revenue calculations
    const avgCustomers = totalCustomers.map((current, i) => {
      if (i === 0) return current / 2;
      return (totalCustomers[i-1] + current) / 2;
    });

    // Create sub-products for detailed reporting
    const subProducts = [];

    // 1. Base Account Product
    const baseAccountDeposits = totalCustomers.map(customers => 
      customers * (product.baseAccount.avgDeposit / 1000000)
    );
    const baseAccountInterestRate = (product.baseAccount.interestRate / 100);
    const baseAccountInterestExpense = baseAccountDeposits.map(stock => 
      -stock * baseAccountInterestRate
    );
    // FTP income = expense (no margin)
    const baseAccountFtpIncome = baseAccountDeposits.map(stock => stock * baseAccountInterestRate);
    const baseAccountFees = avgCustomers.map(customers => 
      (customers * product.baseAccount.monthlyFee * 12) / 1000000
    );

    subProducts.push({
      name: product.name + ' - Conto Corrente Base',
      depositStock: baseAccountDeposits,
      interestIncome: baseAccountFtpIncome,
      interestExpense: baseAccountInterestExpense,
      commissionIncome: baseAccountFees,
      rwa: baseAccountDeposits.map(stock => stock * 0.10)
    });

    // 2. Savings Module Product
    const savingsAdoptionRate = (product.savingsModule.adoptionRate || 0) / 100;
    const savingsCustomers = totalCustomers.map(c => c * savingsAdoptionRate);
    const savingsDeposits = savingsCustomers.map(customers => 
      customers * (product.savingsModule.avgAdditionalDeposit / 1000000)
    );
    
    // Calculate weighted average rate for savings deposits
    let weightedSavingsRate = 0;
    if (product.savingsModule.depositMix && Array.isArray(product.savingsModule.depositMix)) {
      product.savingsModule.depositMix.forEach(deposit => {
        const percentage = (deposit.percentage || 0) / 100;
        const rate = (deposit.interestRate || 0) / 100;
        weightedSavingsRate += percentage * rate;
      });
    }
    
    const savingsInterestExpense = savingsDeposits.map(stock => -stock * weightedSavingsRate);
    // FTP income = expense (no margin)
    const savingsFtpIncome = savingsDeposits.map(stock => stock * weightedSavingsRate);

    subProducts.push({
      name: product.name + ' - Conto Deposito',
      depositStock: savingsDeposits,
      interestIncome: savingsFtpIncome,
      interestExpense: savingsInterestExpense,
      commissionIncome: years.map(() => 0),
      rwa: savingsDeposits.map(stock => stock * 0.05) // Lower RWA for savings
    });

    // 3. Premium Services Module
    const premiumAdoptionRate = (product.premiumServicesModule.adoptionRate || 0) / 100;
    const premiumCustomers = avgCustomers.map(c => c * premiumAdoptionRate);
    const premiumRevenue = premiumCustomers.map(customers => 
      (customers * product.premiumServicesModule.avgAnnualRevenue) / 1000000
    );

    subProducts.push({
      name: product.name + ' - Servizi Premium',
      depositStock: years.map(() => 0),
      interestIncome: years.map(() => 0),
      interestExpense: years.map(() => 0),
      commissionIncome: premiumRevenue,
      rwa: premiumRevenue.map(rev => rev * 12.5 * 0.15) // Operational risk RWA
    });

    // 4. Wealth Management Referral
    const referralAdoptionRate = (product.wealthManagementReferral.adoptionRate || 0) / 100;
    const referralRevenue = newCustomers.map(customers => 
      (customers * referralAdoptionRate * product.wealthManagementReferral.referralFee) / 1000000
    );

    subProducts.push({
      name: product.name + ' - Referral Wealth Management',
      depositStock: years.map(() => 0),
      interestIncome: years.map(() => 0),
      interestExpense: years.map(() => 0),
      commissionIncome: referralRevenue,
      rwa: referralRevenue.map(rev => rev * 12.5 * 0.10) // Lower operational risk
    });

    // Calculate acquisition costs
    const cac = product.acquisition.cac || 0;
    const marketingCosts = newCustomers.map(customers => 
      -(customers * cac) / 1000000
    );

    // Return structure with sub-products
    return {
      name: product.name,
      isModular: true,
      subProducts: subProducts,
      volumes: newCustomers,
      totalCustomers: totalCustomers,
      avgCustomers: avgCustomers,
      // Aggregated values for backward compatibility
      depositStock: subProducts.reduce((acc, sp) => 
        acc.map((v, i) => v + (sp.depositStock[i] || 0)), years.map(() => 0)
      ),
      performingAssets: years.map(() => 0),
      averagePerformingAssets: years.map(() => 0),
      nonPerformingAssets: years.map(() => 0),
      interestIncome: subProducts.reduce((acc, sp) => 
        acc.map((v, i) => v + sp.interestIncome[i]), years.map(() => 0)
      ),
      interestExpense: subProducts.reduce((acc, sp) => 
        acc.map((v, i) => v + sp.interestExpense[i]), years.map(() => 0)
      ),
      commissionIncome: subProducts.reduce((acc, sp) => 
        acc.map((v, i) => v + sp.commissionIncome[i]), years.map(() => 0)
      ),
      commissionExpense: marketingCosts,
      llp: years.map(() => 0),
      rwa: subProducts.reduce((acc, sp) => 
        acc.map((v, i) => v + sp.rwa[i]), years.map(() => 0)
      ),
      newBusiness: newCustomers,
      numberOfLoans: years.map(() => 0),
      assumptions: {
        cac: cac,
        churnRate: product.acquisition.churnRate,
        baseAccount: product.baseAccount,
        savingsModule: product.savingsModule,
        premiumServicesModule: product.premiumServicesModule,
        wealthManagementReferral: product.wealthManagementReferral,
        ftpRate: ftpRate * 100
      }
    };
  }

  // Original logic for standard products follows...
  // Handle dependency on base product
  let effectiveCustomers = [];
  let newCustomers = [];
  
  if (product.requiresBaseProduct && baseProductResults) {
    // This product depends on another product's customer base
    const adoptionRate = (product.adoptionRate || 0) / 100;
    effectiveCustomers = baseProductResults.totalCustomers.map(baseCustomers => 
      baseCustomers * adoptionRate
    );
    // For dependent products, new customers are derived from base product growth
    newCustomers = effectiveCustomers;
  } else {
    // This is a base product with its own customer acquisition
    // Get new customers per year
    newCustomers = years.map(i => {
      // First check if there's a customerArray
      if (product.customerArray && Array.isArray(product.customerArray) && product.customerArray.length === 10) {
        return product.customerArray[i] || 0;
      }
      
      // Standard customer structure
      if (product.customers) {
        if (product.customers[`y${i + 1}`] !== undefined) {
          return product.customers[`y${i + 1}`];
        } else {
          const y1 = product.customers.y1 || 0;
          const y5 = product.customers.y5 || 0;
          if (i < 5) {
            return y1 + ((y5 - y1) * i / 4);
          } else {
            return y5;
          }
        }
      }
      return 0;
    });

    // Calculate total customer stock evolution
    const totalCustomers = [];
    const churnRate = (product.churnRate || 5) / 100;
    
    for (let i = 0; i < years.length; i++) {
      if (i === 0) {
        totalCustomers[i] = newCustomers[i];
      } else {
        totalCustomers[i] = totalCustomers[i-1] * (1 - churnRate) + newCustomers[i];
      }
    }
    
    effectiveCustomers = totalCustomers;
  }

  // Calculate average customers for revenue calculations
  const avgCustomers = effectiveCustomers.map((current, i) => {
    if (i === 0) return current / 2;
    return (effectiveCustomers[i-1] + current) / 2;
  });

  // Calculate deposit stock (funding generated)
  const avgDeposit = (product.avgDeposit || 0) / 1000000; // Convert to millions
  const depositStock = effectiveCustomers.map(customers => customers * avgDeposit);
  
  // Calculate interest expense on deposits
  const depositInterestRate = (product.depositInterestRate || 0) / 100;
  const interestExpense = depositStock.map(stock => -stock * depositInterestRate);
  
  // Calculate FTP income (funds transfer pricing to Treasury)
  const ftpIncome = depositStock.map(stock => stock * ftpRate);
  
  // Calculate revenues from fees and services
  const monthlyFee = product.monthlyFee || 0;
  const annualServiceRevenue = product.annualServiceRevenue || 0;
  const commissionIncome = avgCustomers.map(customers => 
    (customers * monthlyFee * 12 + customers * annualServiceRevenue) / 1000000 // Convert to millions
  );

  // Calculate costs
  let marketingCosts;
  
  if (product.requiresBaseProduct) {
    // No acquisition costs for dependent products
    marketingCosts = years.map(() => 0);
  } else {
    // Acquisition costs only for base products
    const cac = product.cac || 0;
    const newCustomers = years.map((_, i) => {
      if (i === 0) return effectiveCustomers[0];
      return effectiveCustomers[i] - effectiveCustomers[i-1] * (1 - (product.churnRate || 5) / 100);
    });
    marketingCosts = newCustomers.map(customers => 
      -(Math.max(0, customers) * cac) / 1000000 // Convert to millions, negative as cost
    );
  }

  return {
    name: product.name,
    volumes: product.requiresBaseProduct ? effectiveCustomers : newCustomers,
    totalCustomers: effectiveCustomers,
    avgCustomers: avgCustomers,
    depositStock: depositStock,
    performingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    averagePerformingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    nonPerformingAssets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    interestIncome: ftpIncome,
    interestExpense: interestExpense,
    commissionIncome: commissionIncome,
    commissionExpense: marketingCosts,
    llp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rwa: depositStock.map(stock => stock * 0.15),
    newBusiness: product.requiresBaseProduct ? effectiveCustomers : newCustomers,
    numberOfLoans: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    assumptions: {
      cac: product.cac || 0,
      avgDeposit: product.avgDeposit || 0,
      churnRate: (product.churnRate || 5),
      monthlyFee: product.monthlyFee || 0,
      annualServiceRevenue: product.annualServiceRevenue || 0,
      depositInterestRate: product.depositInterestRate || 0,
      ftpRate: ftpRate * 100,
      adoptionRate: product.adoptionRate || 0,
      requiresBaseProduct: product.requiresBaseProduct || null
    }
  };
};

// Old calculatePersonnelCosts function removed - now using imported function

/*
const calculatePersonnelCostsOld = (personnel, years) => {
  if (!personnel) {
    // Return empty structure if personnel data not available
    return {
      byDivision: {},
      centralFunctionsTotal: years.map(() => 0),
      totalCosts: years.map(() => 0),
      totalHeadcount: years.map(() => 0),
      byDepartment: {}
    };
  }

  const { annualSalaryReview = 2.5, companyTaxMultiplier = 1.4, businessDivisions = {}, structuralDivisions = {} } = personnel;
  const salaryGrowth = years.map(i => Math.pow(1 + annualSalaryReview / 100, i));
  
  const results = {
    byDivision: {},
    centralFunctionsTotal: years.map(() => 0),
    totalCosts: years.map(() => 0),
    totalHeadcount: years.map(() => 0),
    byDepartment: {}
  };

  // Calculate costs for business divisions
  Object.entries(businessDivisions).forEach(([divisionKey, divisionData]) => {
    const { headcountGrowth = 0, staffing = [] } = divisionData;
    const headcountMultiplier = years.map(i => Math.pow(1 + headcountGrowth / 100, i));
    
    const divisionCosts = years.map((_, yearIndex) => {
      let totalCost = 0;
      let totalHeadcount = 0;
      
      staffing.forEach(level => {
        const headcount = level.count * headcountMultiplier[yearIndex];
        const ralPerHead = (level.ralPerHead || level.costPerHead || 0) * salaryGrowth[yearIndex];
        const companyCostPerHead = ralPerHead * companyTaxMultiplier;
        totalCost += headcount * companyCostPerHead / 1000; // Convert to €M
        totalHeadcount += headcount;
      });
      
      return { cost: totalCost, headcount: totalHeadcount };
    });
    
    results.byDivision[divisionKey] = {
      costs: divisionCosts.map(d => -d.cost), // Negative for P&L
      headcount: divisionCosts.map(d => d.headcount)
    };
  });

  // Calculate costs for Tech division
  if (structuralDivisions.Tech) {
    const { headcountGrowth = 0, staffing = [] } = structuralDivisions.Tech;
    const headcountMultiplier = years.map(i => Math.pow(1 + headcountGrowth / 100, i));
    
    const techCosts = years.map((_, yearIndex) => {
      let totalCost = 0;
      let totalHeadcount = 0;
      
      staffing.forEach(level => {
        const headcount = level.count * headcountMultiplier[yearIndex];
        const ralPerHead = (level.ralPerHead || level.costPerHead || 0) * salaryGrowth[yearIndex];
        const companyCostPerHead = ralPerHead * companyTaxMultiplier;
        totalCost += headcount * companyCostPerHead / 1000; // Convert to €M
        totalHeadcount += headcount;
      });
      
      return { cost: totalCost, headcount: totalHeadcount };
    });
    
    results.byDivision.Tech = {
      costs: techCosts.map(d => -d.cost), // Negative for P&L
      headcount: techCosts.map(d => d.headcount)
    };
  }

  // Calculate costs for Treasury division
  if (structuralDivisions.Treasury) {
    const { headcountGrowth = 0, staffing = [] } = structuralDivisions.Treasury;
    const headcountMultiplier = years.map(i => Math.pow(1 + headcountGrowth / 100, i));
    
    const treasuryCosts = years.map((_, yearIndex) => {
      let totalCost = 0;
      let totalHeadcount = 0;
      
      staffing.forEach(level => {
        const headcount = level.count * headcountMultiplier[yearIndex];
        const ralPerHead = (level.ralPerHead || level.costPerHead || 0) * salaryGrowth[yearIndex];
        const companyCostPerHead = ralPerHead * companyTaxMultiplier;
        totalCost += headcount * companyCostPerHead / 1000; // Convert to €M
        totalHeadcount += headcount;
      });
      
      return { cost: totalCost, headcount: totalHeadcount };
    });
    
    results.byDivision.Treasury = {
      costs: treasuryCosts.map(d => -d.cost), // Negative for P&L
      headcount: treasuryCosts.map(d => d.headcount)
    };
  }

  // Calculate costs for Central Functions departments
  if (structuralDivisions.CentralFunctions) {
    Object.entries(structuralDivisions.CentralFunctions).forEach(([deptKey, deptData]) => {
      const { headcountGrowth = 0, staffing = [] } = deptData;
      const headcountMultiplier = years.map(i => Math.pow(1 + headcountGrowth / 100, i));
      
      const deptCosts = years.map((_, yearIndex) => {
        let totalCost = 0;
        let totalHeadcount = 0;
        
        staffing.forEach(level => {
          const headcount = level.count * headcountMultiplier[yearIndex];
          const costPerHead = level.costPerHead * salaryGrowth[yearIndex];
          totalCost += headcount * costPerHead / 1000; // Convert to €M
          totalHeadcount += headcount;
        });
        
        return { cost: totalCost, headcount: totalHeadcount };
      });
      
      results.byDepartment[deptKey] = {
        costs: deptCosts.map(d => -d.cost), // Negative for P&L
        headcount: deptCosts.map(d => d.headcount)
      };
      
      // Add to central functions total
      results.centralFunctionsTotal = results.centralFunctionsTotal.map((total, i) => 
        total - deptCosts[i].cost
      );
    });
  }

  // Calculate total costs and headcount
  results.totalCosts = years.map((_, i) => {
    let totalCost = 0;
    
    // Add business and structural division costs
    Object.values(results.byDivision).forEach(division => {
      totalCost += division.costs[i];
    });
    
    // Add central functions costs
    totalCost += results.centralFunctionsTotal[i];
    
    return totalCost;
  });

  results.totalHeadcount = years.map((_, i) => {
    let totalHeadcount = 0;
    
    // Add business and structural division headcount
    Object.values(results.byDivision).forEach(division => {
      totalHeadcount += division.headcount[i];
    });
    
    // Add central functions headcount
    Object.values(results.byDepartment).forEach(dept => {
      totalHeadcount += dept.headcount[i];
    });
    
    return totalHeadcount;
  });

  return results;
};
*/

/**
 * Advanced calculation engine for bank business plan
 * 
 * @param {Object} assumptions - The financial assumptions object
 * @returns {Object} Complete calculation results including P&L, Balance Sheet, Capital, and KPIs
 */
export const calculateResults = (assumptions) => {
  const results = { pnl: {}, bs: {}, capital: {}, kpi: {}, formulas: {} };
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // Calculate FTP (Funds Transfer Pricing) rate: EURIBOR + FTP Spread
  const ftpRate = (assumptions.euribor + (assumptions.ftpSpread || 1.5)) / 100;
  const depositRate = (assumptions.depositRate || 0.5) / 100;

  const productResults = {};
  for (const [key, product] of Object.entries(assumptions.products)) {
      
      // Route to appropriate calculation function based on product type
      if (product.productType === 'Commission') {
        productResults[key] = calculateCommissionProduct(product, assumptions, years);
        continue;
      }
      
      // Handle Digital Service products (new customer-based model)
      if (product.productType === 'DigitalService') {
        productResults[key] = calculateDigitalServiceProduct(product, assumptions, years, ftpRate);
        continue;
      }
      
      // Skip products that depend on others for first pass
      if (product.requiresBaseProduct) {
        continue;
      }
      
      // Handle Deposit and Service products (Digital Banking model)
      if (product.productType === 'DepositAndService') {
        const result = calculateDepositAndServiceProduct(product, assumptions, years, ftpRate);
        
        // If it's a modular product, expand it into separate products
        if (result.isModular && result.subProducts) {
          // Don't include the parent product
          // Instead, add each sub-product as a separate product
          result.subProducts.forEach((subProduct, index) => {
            const subProductKey = `${key}_sub${index}`;
            productResults[subProductKey] = {
              name: subProduct.name,
              performingAssets: years.map(() => 0),
              averagePerformingAssets: years.map(() => 0),
              nonPerformingAssets: years.map(() => 0),
              interestIncome: subProduct.interestIncome || years.map(() => 0),
              interestExpense: subProduct.interestExpense || years.map(() => 0),
              commissionIncome: subProduct.commissionIncome || years.map(() => 0),
              commissionExpense: index === 0 ? result.commissionExpense : years.map(() => 0), // CAC only on base account
              llp: years.map(() => 0),
              rwa: subProduct.rwa || years.map(() => 0),
              newBusiness: index === 0 ? result.newBusiness : years.map(() => 0),
              numberOfLoans: years.map(() => 0),
              depositStock: subProduct.depositStock || years.map(() => 0),
              totalCustomers: result.totalCustomers,
              avgCustomers: result.avgCustomers,
              assumptions: {
                ...result.assumptions,
                subProductType: index === 0 ? 'base' : index === 1 ? 'savings' : index === 2 ? 'premium' : 'referral'
              }
            };
          });
        } else {
          // Standard non-modular product
          productResults[key] = result;
        }
        continue;
      }
      
      // Handle Digital Banking products as deposits (liabilities) - legacy support
      if (product.productType === 'Deposit' || key.startsWith('digitalBanking')) {
        productResults[key] = calculateDepositProduct(product, assumptions, years, ftpRate, depositRate);
        continue;
      }
      
      // VINTAGE-BASED CREDIT CALCULATION ENGINE WITH QUARTERLY ALLOCATION
      // Initialize vintages array to track each loan cohort
      const vintages = [];
      
      // Calculate first year adjustment factor based on quarterly allocation
      const quarterlyAllocation = assumptions.quarterlyAllocation || [25, 25, 25, 25];
      const firstYearAdjustmentFactor = 
        (quarterlyAllocation[0] / 100 * 0.875) +  // Q1: ~87.5% of year
        (quarterlyAllocation[1] / 100 * 0.625) +  // Q2: ~62.5% of year
        (quarterlyAllocation[2] / 100 * 0.375) +  // Q3: ~37.5% of year
        (quarterlyAllocation[3] / 100 * 0.125);   // Q4: ~12.5% of year
      
      // Extract volume information with same logic as before
      const volumes10Y = years.map(i => {
        let yearVolume;
        
        // Priority 1: Use volumeArray if available
        if (product.volumeArray && Array.isArray(product.volumeArray) && product.volumeArray.length === 10) {
          yearVolume = product.volumeArray[i] || 0;
        }
        // Priority 2: Use individual year keys (y1, y2, etc.)
        else if (product.volumes) {
          const yearKey = `y${i + 1}`;
          if (product.volumes[yearKey] !== undefined) {
            yearVolume = product.volumes[yearKey];
          } else {
            // Priority 3: Fallback to linear interpolation between y1 and y10
            const y1 = product.volumes.y1 || 0;
            const y10 = product.volumes.y10 !== undefined ? product.volumes.y10 : 0;
            
            // Special case for bullet loans with short duration: only originate in year 1
            if ((product.type || '').toLowerCase() === 'bullet' && product.durata <= 2 && y10 === 0 && i > 0) {
              yearVolume = 0;
            } else {
              yearVolume = y1 + ((y10 - y1) * i / 9);
            }
          }
        }
        // Priority 4: Default to zero
        else {
          yearVolume = 0;
        }
        
        // Apply quarterly distribution if provided
        const quarterlyDist = product.quarterlyDist || [25, 25, 25, 25];
        const quarterlyMultiplier = quarterlyDist.reduce((sum, q) => sum + q, 0) / 100;
        
        return yearVolume * quarterlyMultiplier;
      });

      // Initialize result arrays
      const grossPerformingStock = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const nplStock = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const averagePerformingStock = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const newNPLs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const totalInterestIncome = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const totalPrincipalRepayments = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      // Apply credit classification impact on default rate
      const baseDefaultRate = product.dangerRate / 100;
      const classificationMultiplier = product.creditClassification === 'UTP' ? 2.5 : 1.0;
      const adjustedDefaultRate = baseDefaultRate * classificationMultiplier;
      
      // Normalize product type for consistent comparison
      const productType = (product.type || 'french').toLowerCase();
      const durata = Number(product.durata || 7);
      const gracePeriod = Number(product.gracePeriod || 0);
      const spread = product.spread || 0;
      
      // MAIN CALCULATION LOOP - Process each year
      for (let year = 0; year < years.length; year++) {
          
          // Step 1: Create new vintage for current year's originations
          if (volumes10Y[year] > 0) {
              vintages.push({
                  startYear: year,
                  initialAmount: volumes10Y[year],
                  outstandingPrincipal: volumes10Y[year],
                  type: productType,
                  durata: durata,
                  gracePeriod: gracePeriod,
                  spread: spread,
                  isFixedRate: product.isFixedRate || false,
                  hasDefaulted: false // Track if this vintage has defaulted
              });
          }
          
          // Step 2: Initialize aggregates for current year
          let totalInterestIncomeForYear = 0;
          let totalPrincipalRepaymentsForYear = 0;
          let totalOutstandingStockForYear = 0;
          let totalAverageStockForYear = 0;
          let defaultsForYear = 0;
          
          // Step 3: Process each active vintage
          vintages.forEach((vintage, vintageIndex) => {
              const age = year - vintage.startYear;
              
              // Skip if vintage hasn't started yet or is fully repaid
              if (age < 0 || vintage.outstandingPrincipal <= 0.01) return;
              
              // Store beginning of year principal for average calculation
              const beginningPrincipal = vintage.outstandingPrincipal;
              
              // Calculate principal repayment based on loan type
              let principalRepayment = 0;
              
              if (vintage.type === 'bullet') {
                  // Bullet loan: repay entire principal at maturity
                  if (age === vintage.durata) {
                      principalRepayment = vintage.outstandingPrincipal;
                  }
              } else if (vintage.type === 'french' || vintage.type === 'amortizing') {
                  // French/Amortizing: repay after grace period
                  if (age > vintage.gracePeriod && age <= vintage.durata) {
                      const remainingPeriods = vintage.durata - vintage.gracePeriod;
                      const periodsElapsed = age - vintage.gracePeriod;
                      
                      if (periodsElapsed > 0 && periodsElapsed <= remainingPeriods) {
                          // Calculate using French amortization formula
                          const interestRate = vintage.isFixedRate ? 
                              (vintage.spread + 2.0) / 100 : 
                              (assumptions.euribor + vintage.spread) / 100;
                          
                          const r = interestRate;
                          const n = remainingPeriods;
                          const PV = vintage.initialAmount;
                          
                          // Calculate fixed payment amount
                          const annuityPayment = PV * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
                          
                          // Interest portion of current payment
                          const interestPortion = beginningPrincipal * r;
                          
                          // Principal portion is annuity minus interest
                          principalRepayment = Math.min(annuityPayment - interestPortion, beginningPrincipal);
                          
                          // Ensure we don't overpay
                          if (principalRepayment < 0) principalRepayment = 0;
                      }
                  }
              }
              
              totalPrincipalRepaymentsForYear += principalRepayment;
              
              // Apply defaults before updating principal
              let defaultAmount = 0;
              if (!vintage.hasDefaulted && beginningPrincipal > 0) {
                  defaultAmount = beginningPrincipal * adjustedDefaultRate;
                  defaultsForYear += defaultAmount;
                  
                  // Mark as defaulted if significant portion has defaulted
                  if (defaultAmount > beginningPrincipal * 0.5) {
                      vintage.hasDefaulted = true;
                  }
              }
              
              // Update vintage outstanding principal (after repayment and defaults)
              vintage.outstandingPrincipal = beginningPrincipal - principalRepayment - defaultAmount;
              const endingPrincipal = vintage.outstandingPrincipal;
              
              // Calculate average stock for interest calculation
              let avgStock = 0;
              if (age === 0) {
                  // First year: apply quarterly allocation adjustment
                  avgStock = beginningPrincipal * firstYearAdjustmentFactor;
              } else {
                  // Subsequent years: average of beginning and ending balances
                  avgStock = (beginningPrincipal + endingPrincipal) / 2;
              }
              
              // Calculate interest income on average stock
              const interestRate = vintage.isFixedRate ? 
                  (vintage.spread + 2.0) / 100 : 
                  (assumptions.euribor + vintage.spread) / 100;
              
              const interestIncome = avgStock * interestRate;
              totalInterestIncomeForYear += interestIncome;
              
              // Add to total outstanding and average stock
              totalOutstandingStockForYear += endingPrincipal;
              totalAverageStockForYear += avgStock;
          });
          
          // Step 4: Update result arrays
          grossPerformingStock[year] = totalOutstandingStockForYear;
          averagePerformingStock[year] = totalAverageStockForYear;
          totalInterestIncome[year] = totalInterestIncomeForYear;
          totalPrincipalRepayments[year] = totalPrincipalRepaymentsForYear;
          newNPLs[year] = defaultsForYear;
          
          // Update NPL stock
          const prevNplStock = year > 0 ? nplStock[year - 1] : 0;
          nplStock[year] = prevNplStock + defaultsForYear;
      }

      // Calculate LGD based on whether loan is secured or unsecured
      let baseLgd;
      if (product.isUnsecured || product.ltv === 0 || product.ltv === undefined) {
        // Unsecured loans: higher LGD (typically 45-75% for corporate, 85% for retail)
        baseLgd = product.unsecuredLGD ? (product.unsecuredLGD / 100) : 0.45; // Default 45% LGD for unsecured
      } else {
        // Secured loans: calculate based on collateral
        const collateralValue = 1 / (product.ltv / 100);
        const discountedCollateralValue = collateralValue * (1 - (product.collateralHaircut / 100));
        const netRecoveryValue = discountedCollateralValue * (1 - (product.recoveryCosts / 100));
        baseLgd = Math.max(0, 1 - netRecoveryValue);
      }
      
      // Apply state guarantee mitigation: LGD applies only to unguaranteed portion
      const stateGuaranteePercentage = (product.stateGuaranteePercentage || 0) / 100;
      const lgd = baseLgd * (1 - stateGuaranteePercentage);
      
      // Apply credit classification impact on RWA density
      const baseRwaDensity = product.rwaDensity / 100;
      const rwaMultiplier = product.creditClassification === 'UTP' ? 1.5 : 1.0;
      const classificationAdjustedRwaDensity = baseRwaDensity * rwaMultiplier;
      
      // Apply state guarantee mitigation to RWA: guaranteed portion has 0% RWA
      const guaranteedPortionRwa = 0; // State-guaranteed portion typically has 0% RWA
      const unguaranteedPortionRwa = classificationAdjustedRwaDensity;
      const adjustedRwaDensity = (guaranteedPortionRwa * stateGuaranteePercentage) + 
                                (unguaranteedPortionRwa * (1 - stateGuaranteePercentage));
      
      // Calculate interest expense using FTP rate
      const interestExpense = averagePerformingStock.map(v => -v * ftpRate);
      
      // Calculate commission income on new business
      const commissionIncome = volumes10Y.map(v => v * (product.commissionRate || 0) / 100);
      
      // Calculate equity upside potential
      const equityUpsideIncome = volumes10Y.map(v => v * (product.equityUpside || 0) / 100);
      
      // Calculate LLP (loan loss provisions)
      const expectedLossOnNewBusiness = volumes10Y.map(v => -v * adjustedDefaultRate * lgd);
      const lossOnStockDefaults = newNPLs.map(v => -v * lgd);
      const llp = years.map(i => lossOnStockDefaults[i] + expectedLossOnNewBusiness[i]);
      
      // Calculate number of loans
      const avgLoanSize = product.avgLoanSize || 1.0;
      const numberOfLoans = volumes10Y.map(v => Math.round(v / avgLoanSize));
      
      // For display purposes, calculate average interest rate
      const displayInterestRate = product.isFixedRate ? 
          product.spread + 2.0 : 
          assumptions.euribor + product.spread;
      
      productResults[key] = {
          name: product.name,
          performingAssets: grossPerformingStock,
          averagePerformingAssets: averagePerformingStock,
          nonPerformingAssets: nplStock,
          interestIncome: totalInterestIncome, // Use the vintage-calculated interest income
          interestExpense: interestExpense,
          commissionIncome: commissionIncome,
          equityUpsideIncome: equityUpsideIncome,
          llp: llp,
          rwa: grossPerformingStock.map(v => v * adjustedRwaDensity),
          numberOfLoans: numberOfLoans,
          newBusiness: volumes10Y,
          principalRepayments: totalPrincipalRepayments, // New field for tracking repayments
          assumptions: {
              interestRate: displayInterestRate,
              commissionRate: (product.commissionRate || 0),
              pd: adjustedDefaultRate,
              lgd: lgd,
              baseLgd: baseLgd,
              riskWeight: adjustedRwaDensity,
              baseRiskWeight: classificationAdjustedRwaDensity,
              stateGuaranteePercentage: stateGuaranteePercentage,
              ftpRate: ftpRate * 100,
              isFixedRate: product.isFixedRate || false,
              creditClassification: product.creditClassification || 'Bonis',
              equityUpside: (product.equityUpside || 0) / 100,
              gracePeriod: gracePeriod,
              durata: durata,
              type: productType
          }
      };
  }
  
  // Second pass: Calculate dependent products
  for (const [key, product] of Object.entries(assumptions.products)) {
    if (product.requiresBaseProduct && productResults[product.requiresBaseProduct]) {
      const baseProductResults = productResults[product.requiresBaseProduct];
      
      if (product.productType === 'DepositAndService') {
        productResults[key] = calculateDepositAndServiceProduct(product, assumptions, years, ftpRate, baseProductResults);
      } else if (product.productType === 'Commission') {
        // Handle commission products that depend on base customers
        const adoptionRate = (product.adoptionRate || 0) / 100;
        const baseCustomers = baseProductResults.totalCustomers || years.map(() => 0);
        const effectiveCustomers = baseCustomers.map(customers => customers * adoptionRate);
        
        // Create a modified product with effective volumes
        const modifiedProduct = {
          ...product,
          volumes: years.map((_, i) => {
            // For commission products, use customer count as volume
            if (product.avgAUM) {
              // Investment platform: volume = customers * avgAUM
              return effectiveCustomers[i] * (product.avgAUM / 1000000); // Convert to millions
            } else {
              // Service products: volume = number of customers (in thousands)
              return effectiveCustomers[i] / 1000;
            }
          })
        };
        
        productResults[key] = calculateCommissionProduct(modifiedProduct, assumptions, years);
        
        // Add customer tracking for reporting
        productResults[key].totalCustomers = effectiveCustomers;
        productResults[key].requiresBaseProduct = product.requiresBaseProduct;
      }
    }
  }
  
  // Define all available divisions dynamically based on product prefixes
  const businessDivisionPrefixes = ['re', 'sme', 'digital', 'wealth', 'tech', 'incentive'];
  const structuralDivisionPrefixes = ['central', 'treasury'];
  const divisionPrefixes = [...businessDivisionPrefixes, ...structuralDivisionPrefixes];
  
  // Create division-specific product results
  const divisionProductResults = {};
  divisionPrefixes.forEach(prefix => {
    divisionProductResults[prefix] = Object.fromEntries(
      Object.entries(productResults).filter(([key]) => 
        key.startsWith(prefix) || key.startsWith(`${prefix}RetailCustomer_sub`)
      )
    );
  });

  // Initialize divisions structure dynamically
  results.divisions = {};
  divisionPrefixes.forEach(prefix => {
    results.divisions[prefix] = {
      bs: {},
      pnl: {},
      capital: {},
      kpi: {}
    };
  });

  // Calculate aggregates for all business divisions first
  businessDivisionPrefixes.forEach(prefix => {
    const divisionProducts = divisionProductResults[prefix];
    
    results.divisions[prefix].bs.performingAssets = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.performingAssets[i], 0)
    );
    results.divisions[prefix].bs.nonPerformingAssets = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.nonPerformingAssets[i], 0)
    );
    results.divisions[prefix].pnl.interestIncome = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.interestIncome[i], 0)
    );
    results.divisions[prefix].pnl.interestExpenses = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + (p.interestExpense || 0), 0)
    );
    results.divisions[prefix].pnl.commissionIncome = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.commissionIncome[i], 0)
    );
    results.divisions[prefix].pnl.commissionExpenses = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + (p.commissionExpense || 0), 0)
    );
    results.divisions[prefix].pnl.totalLLP = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.llp[i], 0)
    );
    results.divisions[prefix].capital.rwaCreditRisk = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.rwa[i], 0)
    );
  });

  // Initialize structural divisions' balance sheet properties early
  // Central Functions has no assets
  results.divisions.central.bs.performingAssets = years.map(() => 0);
  results.divisions.central.bs.nonPerformingAssets = years.map(() => 0);
  results.divisions.central.capital.rwaCreditRisk = years.map(() => 0);
  results.divisions.central.pnl.totalLLP = years.map(() => 0);
  results.divisions.central.pnl.interestIncome = years.map(() => 0);
  results.divisions.central.pnl.interestExpenses = years.map(() => 0);
  results.divisions.central.pnl.commissionIncome = years.map(() => 0);
  results.divisions.central.pnl.totalCentralCosts = years.map(() => 0); // Will be updated later

  // Treasury will be calculated later, but initialize to zero for now
  results.divisions.treasury.bs.performingAssets = years.map(() => 0);
  results.divisions.treasury.bs.nonPerformingAssets = years.map(() => 0);
  results.divisions.treasury.capital.rwaCreditRisk = years.map(() => 0);
  results.divisions.treasury.pnl.totalLLP = years.map(() => 0);
  results.divisions.treasury.pnl.interestIncome = years.map(() => 0);
  results.divisions.treasury.pnl.interestExpenses = years.map(() => 0);
  results.divisions.treasury.pnl.commissionIncome = years.map(() => 0);

  // First calculate total balance sheet items from business divisions only
  // (Treasury assets will be added after they are calculated)
  results.bs.performingAssets = years.map(i => 
    businessDivisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].bs.performingAssets[i], 0)
  );
  results.bs.nonPerformingAssets = years.map(i => 
    businessDivisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].bs.nonPerformingAssets[i], 0)
  );
  const totalLoans = years.map(i => results.bs.performingAssets[i] + results.bs.nonPerformingAssets[i]);
  results.bs.totalAssets = totalLoans;
  
  // Calculate total RWA components from business divisions first
  results.capital.rwaCreditRisk = years.map(i => 
    businessDivisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].capital.rwaCreditRisk[i], 0)
  );
  results.capital.rwaOperationalRisk = results.bs.totalAssets.map(assets => assets * 0.1);
  results.capital.rwaMarketRisk = years.map(() => 0);
  results.capital.totalRWA = years.map(i => results.capital.rwaCreditRisk[i] + results.capital.rwaOperationalRisk[i] + results.capital.rwaMarketRisk[i]);

  // Calculate P&L first to get net profit for equity calculation
  results.pnl.interestIncome = years.map(i => 
    businessDivisionPrefixes.reduce((sum, prefix) => sum + (results.divisions[prefix].pnl.interestIncome[i] || 0), 0)
  );
  // Calculate interest expenses from business divisions only for now
  results.pnl.interestExpenses = years.map(i => 
    businessDivisionPrefixes.reduce((sum, prefix) => {
      const divisionExpenses = (results.divisions[prefix].pnl.interestExpenses || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
      return sum + divisionExpenses;
    }, 0)
  );
  results.pnl.netInterestIncome = years.map(i => results.pnl.interestIncome[i] + results.pnl.interestExpenses[i]);
  
  results.pnl.commissionIncome = years.map(i => 
    businessDivisionPrefixes.reduce((sum, prefix) => sum + (results.divisions[prefix].pnl.commissionIncome[i] || 0), 0)
  );
  results.pnl.commissionExpenses = results.pnl.commissionIncome.map(c => -c * assumptions.commissionExpenseRate / 100);
  results.pnl.netCommissions = years.map(i => results.pnl.commissionIncome[i] + results.pnl.commissionExpenses[i]);
  
  results.pnl.totalRevenues = years.map(i => results.pnl.netInterestIncome[i] + results.pnl.netCommissions[i]);

  // Calculate FTE for all divisions dynamically
  const divisionFteMapping = {
    're': 'realEstateDivision',
    'sme': 'smeDivision', 
    'digital': 'digitalBankingDivision',
    'wealth': 'wealthManagementDivision',
    'tech': 'techPlatformDivision',
    'incentive': 'incentiveFinanceDivision',
    'central': 'centralFunctions',
    'treasury': 'treasury'
  };
  
  let totalFte = years.map(() => 0);
  
  divisionPrefixes.forEach(prefix => {
    const divisionKey = divisionFteMapping[prefix];
    const divisionAssumptions = assumptions[divisionKey];
    
    if (divisionAssumptions && divisionAssumptions.fteY1 !== undefined && divisionAssumptions.fteY5 !== undefined) {
      const fteGrowth = (divisionAssumptions.fteY5 - divisionAssumptions.fteY1) / 4;
      results.kpi[`${prefix}Fte`] = years.map(i => divisionAssumptions.fteY1 + (fteGrowth * i));
      totalFte = totalFte.map((total, i) => total + results.kpi[`${prefix}Fte`][i]);
    } else {
      // Default to 0 if division assumptions not found
      results.kpi[`${prefix}Fte`] = years.map(() => 0);
    }
  });
  
  results.kpi.fte = totalFte;
  
  // Calculate personnel costs using new bottom-up model
  const personnelResults = calculatePersonnelCosts(assumptions, years);
  results.pnl.personnelCostsTotal = personnelResults.totalCosts;
  results.kpi.fte = personnelResults.totalHeadcount;
  
  // Store detailed personnel costs for divisions
  results.personnelCostsByDivision = personnelResults.byDivision;
  results.personnelCostsByCentralDept = personnelResults.byDepartment;
  
  // Update division-level FTE from personnel results
  const divisionPersonnelKeys = {
    're': 'RealEstateFinancing',
    'sme': 'SMEFinancing',
    'digital': 'DigitalBanking',
    'wealth': 'WealthAndAssetManagement',
    'incentive': 'Incentives',
    'tech': 'Tech',
    'treasury': 'Treasury'
  };
  
  divisionPrefixes.forEach(prefix => {
    if (prefix === 'central') {
      // Central functions total headcount from all departments
      results.kpi[`${prefix}Fte`] = years.map(i => 
        Object.values(personnelResults.byDepartment).reduce((sum, dept) => 
          sum + (dept.headcount?.[i] || 0), 0
        )
      );
    } else {
      const divisionKey = divisionPersonnelKeys[prefix];
      results.kpi[`${prefix}Fte`] = personnelResults.byDivision[divisionKey]?.headcount || years.map(() => 0);
    }
  });

  const costGrowth = years.map(i => Math.pow(1 + assumptions.costGrowthRate / 100, i));
  results.pnl.adminCosts = years.map(i => -assumptions.adminCostsY1 * costGrowth[i]);
  results.pnl.marketingCosts = years.map(i => -assumptions.marketingCostsY1 * costGrowth[i]);
  results.pnl.hqAllocation = years.map(i => -assumptions.hqAllocationY1 * costGrowth[i]);
  results.pnl.itCosts = years.map(i => -assumptions.itCostsY1 * costGrowth[i]);
  const otherOpex = years.map(i => results.pnl.adminCosts[i] + results.pnl.marketingCosts[i] + results.pnl.hqAllocation[i] + results.pnl.itCosts[i]);
  // Note: otherOpex now only includes costs allocated to business divisions
  // Central Functions costs are tracked separately
  results.pnl.totalOpex = years.map(i => results.pnl.personnelCostsTotal[i] + otherOpex[i]);

  results.pnl.otherCosts = years.map(i => -assumptions.otherCostsY1 * costGrowth[i]);
  results.pnl.provisions = years.map(i => -assumptions.provisionsY1 * costGrowth[i]);
  results.pnl.totalLLP = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].pnl.totalLLP[i], 0)
  );
  
  // Calculate pre-tax profit before central functions costs
  const preTaxBeforeCentral = years.map(i => results.pnl.totalRevenues[i] + results.pnl.totalOpex[i] + results.pnl.totalLLP[i] + results.pnl.otherCosts[i]);
  
  // Add Central Functions costs to get final pre-tax profit
  results.pnl.centralFunctionsCosts = results.divisions.central.pnl.totalCentralCosts;
  
  results.pnl.preTaxProfit = years.map(i => preTaxBeforeCentral[i] + (results.pnl.centralFunctionsCosts[i] || 0));
  results.pnl.taxes = years.map(i => results.pnl.preTaxProfit[i] > 0 ? -results.pnl.preTaxProfit[i] * (assumptions.taxRate / 100) : 0);
  results.pnl.netProfit = years.map(i => results.pnl.preTaxProfit[i] + results.pnl.taxes[i]);

  // Calculate digital service deposits (from DigitalService products)
  results.bs.digitalServiceDeposits = years.map(i => 
    Object.values(productResults)
      .filter(product => product.depositStock) // Only products with deposit stock
      .reduce((sum, product) => sum + (product.depositStock[i] || 0), 0)
  );

  // ======== CENTRAL FUNCTIONS DIVISION ========
  // Central Functions has only costs, no revenues or assets
  const cf = results.divisions.central;
  
  // Initialize balance sheet items for Central Functions (no assets)
  cf.bs.performingAssets = years.map(() => 0);
  cf.bs.nonPerformingAssets = years.map(() => 0);
  
  // Central Functions FTE is already calculated above and stored in results.kpi.centralFte
  
  // Calculate Central Functions non-personnel costs
  cf.pnl.facilitiesCosts = years.map(i => -(assumptions.centralFunctions.facilitiesCostsY1 || 0) * costGrowth[i]);
  cf.pnl.externalServices = years.map(i => -(assumptions.centralFunctions.externalServicesY1 || 0) * costGrowth[i]);
  cf.pnl.regulatoryFees = years.map(i => -(assumptions.centralFunctions.regulatoryFeesY1 || 0) * costGrowth[i]);
  cf.pnl.otherCentralCosts = years.map(i => -(assumptions.centralFunctions.otherCentralCostsY1 || 0) * costGrowth[i]);
  
  // Personnel costs for Central Functions (from bottom-up model)
  cf.pnl.personnelCosts = personnelResults.centralFunctionsTotal;
  
  // Total Central Functions costs
  cf.pnl.totalCentralCosts = years.map(i => 
    cf.pnl.facilitiesCosts[i] +
    cf.pnl.externalServices[i] +
    cf.pnl.regulatoryFees[i] +
    cf.pnl.otherCentralCosts[i] +
    cf.pnl.personnelCosts[i]
  );
  
  // Central Functions has no interest income/expense
  cf.pnl.interestIncome = years.map(() => 0);
  cf.pnl.interestExpenses = years.map(() => 0);
  cf.pnl.commissionIncome = years.map(() => 0);
  cf.pnl.commissionExpenses = years.map(() => 0);
  cf.pnl.totalLLP = years.map(() => 0);
  
  // Central Functions P&L - Complete structure for StandardPnL
  cf.pnl.netInterestIncome = years.map(() => 0);
  cf.pnl.netCommissions = years.map(() => 0);
  cf.pnl.totalRevenues = years.map(() => 0);
  cf.pnl.personnelCosts = cf.pnl.personnelCosts || years.map(() => 0);
  cf.pnl.otherOpex = years.map(i => cf.pnl.totalCentralCosts[i] - cf.pnl.personnelCosts[i]);
  cf.pnl.totalOpex = cf.pnl.totalCentralCosts;
  cf.pnl.preTaxProfit = cf.pnl.totalCentralCosts;
  cf.pnl.taxes = years.map(() => 0); // No taxes for cost center
  cf.pnl.netProfit = cf.pnl.preTaxProfit; // Simplified - no separate tax calculation
  
  // Central Functions has minimal RWA (operational risk only)
  cf.capital.rwaCreditRisk = years.map(() => 0);
  cf.capital.totalRWA = years.map(() => 10); // Minimal operational RWA
  
  // Central Functions Balance Sheet - Empty structure for consistency
  cf.bs.loans = years.map(() => 0);
  cf.bs.securities = years.map(() => 0);
  cf.bs.cashAndEquivalents = years.map(() => 0);
  cf.bs.otherAssets = years.map(() => 0);
  cf.bs.totalAssets = years.map(() => 0);
  
  cf.bs.customerDeposits = years.map(() => 0);
  cf.bs.interbankLiabilities = years.map(() => 0);
  cf.bs.debtSecurities = years.map(() => 0);
  cf.bs.otherLiabilities = years.map(() => 0);
  cf.bs.totalLiabilities = years.map(() => 0);
  cf.bs.equity = years.map(() => 0); // Will be allocated based on RWA
  
  // Central Functions KPIs
  cf.kpi = {};
  cf.kpi.costToIncomeRatio = years.map(() => 100); // Pure cost center
  cf.kpi.fteCount = years.map(i => {
    const fteY1 = assumptions.centralFunctions?.fteY1 || 0;
    const fteY5 = assumptions.centralFunctions?.fteY5 || 0;
    const fteGrowth = (fteY5 - fteY1) / 4;
    return fteY1 + (fteGrowth * Math.min(i, 4));
  });
  cf.kpi.costPerFte = years.map(i => {
    const fte = cf.kpi.fteCount[i];
    const totalCosts = Math.abs(cf.pnl.totalCentralCosts[i] || 0);
    return fte > 0 ? (totalCosts / fte) * 1000 : 0; // in €k
  });
  cf.kpi.percentOfTotalBankCosts = years.map(() => 0); // Will calculate later
  
  // ======== TREASURY / ALM DIVISION ========
  const treasury = results.divisions.treasury;
  
  // Calculate funding gap: Total loans - Total deposits
  const fundingGap = years.map(i => 
    results.bs.totalAssets[i] - results.bs.digitalServiceDeposits[i]
  );
  
  // Calculate liquidity buffer requirement
  const liquidityBuffer = years.map(i => 
    results.bs.digitalServiceDeposits[i] * (assumptions.treasury.liquidityBufferRequirement / 100)
  );
  
  // Treasury assets
  treasury.bs.liquidAssets = liquidityBuffer;
  treasury.bs.tradingBook = years.map(i => 
    assumptions.treasury.tradingBookSize * Math.pow(1 + assumptions.treasury.tradingBookGrowthRate / 100, i)
  );
  treasury.bs.totalAssets = years.map(i => 
    treasury.bs.liquidAssets[i] + treasury.bs.tradingBook[i]
  );
  
  // Treasury funding
  treasury.bs.interbankFunding = years.map(i => 
    Math.max(0, fundingGap[i]) // Only positive funding gaps
  );
  
  // Treasury P&L
  // Interest income from liquidity buffer
  treasury.pnl.liquidityBufferIncome = years.map(i => 
    liquidityBuffer[i] * (assumptions.treasury.liquidAssetReturnRate / 100)
  );
  
  // Trading income (simplified)
  treasury.pnl.tradingIncome = years.map(i => 
    treasury.bs.tradingBook[i] * (assumptions.treasury.tradingBookReturnTarget / 100)
  );
  
  // Interest expense on interbank funding
  treasury.pnl.interbankFundingCost = years.map(i => 
    -treasury.bs.interbankFunding[i] * (assumptions.treasury.interbankFundingRate / 100)
  );
  
  // FTP spread income/cost (Treasury acts as intermediary)
  // Income: receives FTP rate from lending divisions
  // Cost: pays deposit rate to Digital Bank
  // Net: keeps the spread
  treasury.pnl.ftpSpreadIncome = years.map(i => {
    const totalLoans = results.bs.totalAssets[i];
    const totalDeposits = results.bs.digitalServiceDeposits[i];
    const ftpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
    const depositRate = assumptions.depositRate / 100;
    
    // Income from lending divisions at FTP rate
    const ftpIncome = totalLoans * ftpRate;
    // Cost to Digital Bank at deposit rate
    const depositCost = totalDeposits * depositRate;
    // Net spread income
    return ftpIncome - depositCost;
  });
  
  // Treasury personnel costs (from bottom-up model)
  treasury.pnl.personnelCosts = personnelResults.byDivision.Treasury?.costs || years.map(() => 0);
  
  // Treasury other costs (allocated portion)
  treasury.pnl.otherOpex = years.map(i => -2); // Simplified allocation
  
  // Treasury totals
  treasury.pnl.interestIncome = years.map(i => 
    treasury.pnl.liquidityBufferIncome[i] + 
    (treasury.pnl.ftpSpreadIncome[i] > 0 ? treasury.pnl.ftpSpreadIncome[i] : 0)
  );
  
  treasury.pnl.interestExpenses = years.map(i => 
    treasury.pnl.interbankFundingCost[i] + 
    (treasury.pnl.ftpSpreadIncome[i] < 0 ? treasury.pnl.ftpSpreadIncome[i] : 0)
  );
  
  treasury.pnl.commissionIncome = treasury.pnl.tradingIncome;
  treasury.pnl.commissionExpenses = years.map(() => 0);
  treasury.pnl.totalLLP = years.map(() => 0);
  
  treasury.pnl.totalRevenues = years.map(i => 
    treasury.pnl.interestIncome[i] + 
    treasury.pnl.interestExpenses[i] + 
    treasury.pnl.commissionIncome[i]
  );
  
  treasury.pnl.totalOpex = years.map(i => 
    treasury.pnl.personnelCosts[i] + treasury.pnl.otherOpex[i]
  );
  
  treasury.pnl.preTaxProfit = years.map(i => 
    treasury.pnl.totalRevenues[i] + treasury.pnl.totalOpex[i]
  );
  
  treasury.pnl.taxes = treasury.pnl.preTaxProfit.map(profit => profit > 0 ? -profit * assumptions.taxRate / 100 : 0);
  treasury.pnl.netProfit = years.map(i => treasury.pnl.preTaxProfit[i] + treasury.pnl.taxes[i]);
  
  // Treasury RWA (liquidity buffer has low RWA, trading book has market risk RWA)
  treasury.capital.rwaCreditRisk = years.map(i => 
    treasury.bs.liquidAssets[i] * 0.20 + // 20% RWA for liquid assets
    treasury.bs.tradingBook[i] * 1.00 // 100% RWA for trading book
  );
  
  treasury.capital.totalRWA = treasury.capital.rwaCreditRisk;
  
  // Update balance sheet items
  treasury.bs.performingAssets = treasury.bs.totalAssets;
  treasury.bs.nonPerformingAssets = years.map(() => 0);
  
  // Treasury Balance Sheet - Full structure for StandardBalanceSheet component
  // Assets
  treasury.bs.loans = years.map(() => 0); // Treasury doesn't make loans
  treasury.bs.securities = treasury.bs.tradingBook; // Trading book securities
  treasury.bs.cashAndEquivalents = treasury.bs.liquidAssets; // Liquidity buffer
  treasury.bs.otherAssets = years.map(() => 0);
  
  // Liabilities  
  treasury.bs.customerDeposits = years.map(() => 0); // Treasury doesn't take deposits
  treasury.bs.interbankLiabilities = treasury.bs.interbankFunding;
  treasury.bs.debtSecurities = years.map(() => 0);
  treasury.bs.otherLiabilities = years.map(() => 0);
  treasury.bs.totalLiabilities = treasury.bs.interbankFunding;
  
  // Equity (will be allocated based on RWA)
  treasury.bs.equity = years.map(() => 0); // Will be calculated later
  
  // Treasury KPIs
  treasury.kpi = {};
  treasury.kpi.fundingGap = years.map(i => fundingGap[i]);
  treasury.kpi.fundingGapPercent = years.map(i => {
    const totalAssets = results.bs.totalAssets[i];
    return totalAssets > 0 ? (fundingGap[i] / totalAssets) * 100 : 0;
  });
  treasury.kpi.liquidityRatio = years.map(i => {
    const deposits = results.bs.digitalServiceDeposits[i];
    return deposits > 0 ? (treasury.bs.liquidAssets[i] / deposits) * 100 : 0;
  });
  treasury.kpi.netFtpMargin = years.map(i => {
    const ftpSpreadIncome = treasury.pnl.ftpSpreadIncome[i] || 0;
    const totalAssets = results.bs.totalAssets[i];
    return totalAssets > 0 ? (ftpSpreadIncome / totalAssets) * 10000 : 0; // in basis points
  });
  treasury.kpi.treasuryRoe = years.map(() => 0); // Will be calculated after equity allocation

  // Now update the total balance sheet to include Treasury assets
  results.bs.performingAssets = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + (results.divisions[prefix].bs.performingAssets[i] || 0), 0)
  );
  results.bs.nonPerformingAssets = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + (results.divisions[prefix].bs.nonPerformingAssets[i] || 0), 0)
  );
  results.bs.totalAssets = years.map(i => results.bs.performingAssets[i] + results.bs.nonPerformingAssets[i]);

  // Update total RWA to include all divisions
  results.capital.rwaCreditRisk = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + (results.divisions[prefix].capital.rwaCreditRisk[i] || 0), 0)
  );
  results.capital.rwaOperationalRisk = results.bs.totalAssets.map(assets => assets * 0.1);
  results.capital.totalRWA = years.map(i => results.capital.rwaCreditRisk[i] + results.capital.rwaOperationalRisk[i] + results.capital.rwaMarketRisk[i]);

  // Update P&L totals to include all divisions (including Treasury and Central Functions)
  results.pnl.interestIncome = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + (results.divisions[prefix].pnl.interestIncome[i] || 0), 0)
  );
  results.pnl.interestExpenses = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + (results.divisions[prefix].pnl.interestExpenses[i] || 0), 0)
  );
  results.pnl.netInterestIncome = years.map(i => results.pnl.interestIncome[i] + results.pnl.interestExpenses[i]);
  
  results.pnl.commissionIncome = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + (results.divisions[prefix].pnl.commissionIncome[i] || 0), 0)
  );
  // Recalculate commission expenses based on updated commission income
  results.pnl.commissionExpenses = results.pnl.commissionIncome.map(c => -c * assumptions.commissionExpenseRate / 100);
  results.pnl.netCommissions = years.map(i => results.pnl.commissionIncome[i] + results.pnl.commissionExpenses[i]);
  
  results.pnl.totalRevenues = years.map(i => results.pnl.netInterestIncome[i] + results.pnl.netCommissions[i]);

  // Update total OPEX to include Central Functions costs
  const centralOpex = results.divisions.central.pnl.totalOpex || years.map(() => 0);
  const treasuryOpex = results.divisions.treasury.pnl.totalOpex || years.map(() => 0);
  results.pnl.totalOpex = years.map(i => 
    results.pnl.personnelCostsTotal[i] + otherOpex[i] + centralOpex[i] + treasuryOpex[i]
  );

  // Recalculate pre-tax profit and net profit
  results.pnl.preTaxProfit = years.map(i => 
    results.pnl.totalRevenues[i] + results.pnl.totalOpex[i] + results.pnl.totalLLP[i]
  );
  results.pnl.taxes = results.pnl.preTaxProfit.map(profit => profit > 0 ? -profit * assumptions.taxRate / 100 : 0);
  results.pnl.netProfit = years.map(i => results.pnl.preTaxProfit[i] + results.pnl.taxes[i]);

  // Calculate total equity first
  results.bs.equity = years.map(i => assumptions.initialEquity + results.pnl.netProfit.slice(0, i + 1).reduce((a, b) => a + b, 0));
  
  // Total liabilities = Total Assets - Equity + Digital Service Deposits
  // (Digital service deposits are additional liabilities beyond what's needed to fund assets)
  results.bs.totalLiabilities = years.map(i => results.bs.totalAssets[i] - results.bs.equity[i] + results.bs.digitalServiceDeposits[i]);
  
  results.bs.sightDeposits = results.bs.totalLiabilities.map(tl => tl * (assumptions.fundingMix.sightDeposits / 100));
  results.bs.termDeposits = results.bs.totalLiabilities.map(tl => tl * (assumptions.fundingMix.termDeposits / 100));
  results.bs.groupFunding = results.bs.totalLiabilities.map(tl => tl * (assumptions.fundingMix.groupFunding / 100));

  // Calculate total RWA for each division (including operational, market, operating assets)
  divisionPrefixes.forEach(prefix => {
    results.divisions[prefix].capital.totalRWA = years.map(i => {
      const assetWeight = results.bs.totalAssets[i] > 0 ? 
        (results.divisions[prefix].bs.performingAssets[i] + results.divisions[prefix].bs.nonPerformingAssets[i]) / results.bs.totalAssets[i] : 0;
      return results.divisions[prefix].capital.rwaCreditRisk[i] + 
             (results.capital.rwaOperationalRisk[i] * assetWeight);
    });
  });

  // Allocate equity based on RWA weights
  divisionPrefixes.forEach(prefix => {
    results.divisions[prefix].bs.allocatedEquity = years.map(i => {
      const totalRWA = results.capital.totalRWA[i];
      const divisionRWAWeight = totalRWA > 0 ? results.divisions[prefix].capital.totalRWA[i] / totalRWA : 0;
      return results.bs.equity[i] * divisionRWAWeight;
    });
  });

  // Calculate CET1 ratio for each division
  divisionPrefixes.forEach(prefix => {
    results.divisions[prefix].capital.cet1Ratio = years.map(i => 
      results.divisions[prefix].capital.totalRWA[i] > 0 ? 
      (results.divisions[prefix].bs.allocatedEquity[i] / results.divisions[prefix].capital.totalRWA[i]) * 100 : 0
    );
  });
  
  // Update Treasury ROE after equity allocation
  treasury.kpi.treasuryRoe = years.map(i => {
    const netProfit = treasury.pnl.netProfit[i] || 0;
    const allocatedEquity = treasury.bs.allocatedEquity[i] || 0;
    return allocatedEquity > 0 ? (netProfit / allocatedEquity) * 100 : 0;
  });
  
  // Update Central Functions percentage of total bank costs
  cf.kpi.percentOfTotalBankCosts = years.map(i => {
    const centralCosts = Math.abs(cf.pnl.totalCentralCosts[i] || 0);
    const totalBankCosts = Math.abs(results.pnl.totalOpex[i] || 0);
    return totalBankCosts > 0 ? (centralCosts / totalBankCosts) * 100 : 0;
  });

  // KPIs and remaining calculations
  
  results.kpi.cet1Ratio = years.map(i => results.capital.totalRWA[i] > 0 ? (results.bs.equity[i] / results.capital.totalRWA[i]) * 100 : 0);
  results.kpi.costIncome = years.map(i => results.pnl.totalRevenues[i] > 0 ? (-results.pnl.totalOpex[i] / results.pnl.totalRevenues[i]) * 100 : 0);
  
  // Product-level allocation for PNL and ROE
  for (const key in productResults) {
      const product = productResults[key];
      const assetWeight = years.map(i => results.bs.totalAssets[i] > 0 ? (product.performingAssets[i] + product.nonPerformingAssets[i]) / results.bs.totalAssets[i] : 0);
      const rwaWeight = years.map(i => results.capital.totalRWA[i] > 0 ? product.rwa[i] / results.capital.totalRWA[i] : 0);
      
      // Interest expense is already calculated at product level
      if (!product.interestExpense) {
          product.interestExpense = years.map(i => results.pnl.interestExpenses[i] * assetWeight[i]);
      }
      
      product.commissionExpense = years.map(i => results.pnl.commissionExpenses[i] * assetWeight[i]);
      // Allocate personnel costs based on division
      let divisionPersonnelCosts = years.map(() => 0);
      
      // Map product to division
      if (key.startsWith('re')) {
        divisionPersonnelCosts = personnelResults.byDivision.RealEstateFinancing?.costs || years.map(() => 0);
      } else if (key.startsWith('sme')) {
        divisionPersonnelCosts = personnelResults.byDivision.SMEFinancing?.costs || years.map(() => 0);
      } else if (key.startsWith('digital')) {
        divisionPersonnelCosts = personnelResults.byDivision.DigitalBanking?.costs || years.map(() => 0);
      } else if (key.startsWith('wealth')) {
        divisionPersonnelCosts = personnelResults.byDivision.WealthAndAssetManagement?.costs || years.map(() => 0);
      } else if (key.startsWith('incentive')) {
        divisionPersonnelCosts = personnelResults.byDivision.Incentives?.costs || years.map(() => 0);
      } else if (key.startsWith('tech')) {
        divisionPersonnelCosts = personnelResults.byDivision.Tech?.costs || years.map(() => 0);
      }
      
      // Calculate product's share of division RWA
      const divisionPrefix = key.match(/^(re|sme|digital|wealth|incentive|tech)/)?.[1];
      const divisionRWA = divisionPrefix ? results.divisions[divisionPrefix]?.capital?.totalRWA || years.map(() => 0) : years.map(() => 0);
      const productRWAWeight = years.map(i => divisionRWA[i] > 0 ? product.rwa[i] / divisionRWA[i] : 0);
      
      product.personnelCosts = years.map(i => divisionPersonnelCosts[i] * productRWAWeight[i]);
      product.allocatedEquity = years.map(i => results.bs.equity[i] * rwaWeight[i]);
      product.cet1Ratio = years.map(i => product.rwa[i] > 0 ? (product.allocatedEquity[i] / product.rwa[i]) * 100 : 0);
      
      // Include equity upside income in total revenues
      const revenues = years.map(i => 
        product.interestIncome[i] + 
        product.commissionIncome[i] + 
        (product.equityUpsideIncome ? product.equityUpsideIncome[i] : 0)
      );
      const allocatedOtherOpex = years.map(i => otherOpex[i] * rwaWeight[i]);
      const allocatedTaxes = years.map(i => results.pnl.taxes[i] * rwaWeight[i]);
      
      // Store allocated other OPEX in product for visibility
      product.otherOpex = allocatedOtherOpex;
      
      product.netProfit = years.map(i => revenues[i] + product.interestExpense[i] + product.llp[i] + product.personnelCosts[i] + allocatedOtherOpex[i] + allocatedTaxes[i] + product.commissionExpense[i]);
      
      product.roe = years.map(i => {
          const startEquity = i > 0 ? product.allocatedEquity[i-1] : 0;
          const avgEquity = (product.allocatedEquity[i] + startEquity) / 2;
          return avgEquity > 0 ? (product.netProfit[i] / avgEquity) * 100 : 0;
      });
  }
  

  // Calculate total ROE
  results.kpi.roe = years.map(i => {
      const startEquity = i > 0 ? results.bs.equity[i-1] : assumptions.initialEquity;
      const endEquity = results.bs.equity[i];
      const avgEquity = (startEquity + endEquity) / 2;
      return avgEquity > 0 ? (results.pnl.netProfit[i] / avgEquity) * 100 : 0;
  });

  // Calculate Cost of Risk (basis points)
  results.kpi.costOfRisk = years.map(i => {
      const avgPerformingAssets = i > 0 ? 
          (results.bs.performingAssets[i] + results.bs.performingAssets[i-1]) / 2 : 
          results.bs.performingAssets[i];
      return avgPerformingAssets > 0 ? (-results.pnl.totalLLP[i] / avgPerformingAssets) * 10000 : 0;
  });

  // Calculate total number of loans granted (exclude deposit products)
  results.kpi.totalNumberOfLoans = years.map(i => 
    Object.values(productResults).reduce((sum, p) => 
      sum + (p.numberOfLoans ? p.numberOfLoans[i] || 0 : 0), 0
    )
  );
  
  // Calculate division-level number of loans dynamically (exclude deposit products)
  divisionPrefixes.forEach(prefix => {
    results.kpi[`${prefix}NumberOfLoans`] = years.map(i => 
      Object.entries(productResults)
        .filter(([key]) => key.startsWith(prefix))
        .reduce((sum, [key, p]) => sum + (p.numberOfLoans ? p.numberOfLoans[i] || 0 : 0), 0)
    );
  });

  // Calculate division-level results
  results.divisions = {};
  
  // Mapping from division prefixes to personnel cost division keys
  const divisionPersonnelMapping = {
    're': 'RealEstateFinancing',
    'sme': 'SMEFinancing',
    'digital': 'DigitalBanking',
    'wealth': 'WealthAndAssetManagement',
    'incentive': 'Incentives',
    'tech': 'Tech',
    'treasury': 'Treasury',
    'central': 'CentralFunctions'
  };
  
  divisionPrefixes.forEach(prefix => {
    const divisionProducts = Object.entries(productResults)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, product]) => product);
    
    // Get personnel costs from the new bottom-up calculation
    const personnelDivisionKey = divisionPersonnelMapping[prefix];
    const divisionPersonnelCosts = prefix === 'central' 
      ? personnelResults.centralFunctionsTotal
      : (personnelResults.byDivision[personnelDivisionKey]?.costs || years.map(() => 0));
    
    results.divisions[prefix] = {
      bs: {
        performingAssets: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.performingAssets[i], 0)
        ),
        nonPerformingAssets: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.nonPerformingAssets[i], 0)
        ),
        allocatedEquity: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.allocatedEquity[i], 0)
        )
      },
      pnl: {
        interestIncome: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.interestIncome[i], 0)
        ),
        interestExpenses: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.interestExpense[i], 0)
        ),
        commissionIncome: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.commissionIncome[i], 0)
        ),
        commissionExpenses: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.commissionExpense[i], 0)
        ),
        totalLLP: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.llp[i], 0)
        ),
        personnelCosts: divisionPersonnelCosts,
        personnelCostDetails: prefix === 'central' 
          ? personnelResults.byDepartment 
          : (personnelResults.byDivision[personnelDivisionKey]?.details || []),
        netProfit: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.netProfit[i], 0)
        )
      },
      capital: {
        rwaCreditRisk: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.rwa[i], 0)
        ),
        totalRWA: years.map(i => 
          divisionProducts.reduce((sum, p) => sum + p.rwa[i], 0)
        ),
        cet1Ratio: years.map(i => {
          const totalRwa = divisionProducts.reduce((sum, p) => sum + p.rwa[i], 0);
          const totalEquity = divisionProducts.reduce((sum, p) => sum + p.allocatedEquity[i], 0);
          return totalRwa > 0 ? (totalEquity / totalRwa) * 100 : 0;
        })
      }
    };
  });

  results.productResults = productResults;

  return results;
};

export default calculateResults;