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
        const y10 = product.volumes.y10 || 0;
        yearVolume = y1 + ((y10 - y1) * i / 9);
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
  let commissionIncome;
  
  if (false) { // Remove old modular logic
    // Modular structure calculations
    
    // Current account deposits
    const caAvgDeposit = (product.currentAccount.avgDeposit || 0) / 1000000;
    currentAccountDeposits = totalCustomers.map(customers => customers * caAvgDeposit);
    
    // Savings deposits (based on adoption rate)
    const savingsAdoptionRate = (product.savingsModule.adoptionRate || 0) / 100;
    const savingsAvgDeposit = (product.savingsModule.avgAdditionalDeposit || 0) / 1000000;
    savingsDeposits = totalCustomers.map(customers => 
      customers * savingsAdoptionRate * savingsAvgDeposit
    );
    
    // Total deposits
    totalDepositStock = currentAccountDeposits.map((ca, i) => ca + savingsDeposits[i]);
    
    // Interest expenses
    const caInterestRate = (product.currentAccount.interestRate || 0) / 100;
    currentAccountInterestExpense = currentAccountDeposits.map(stock => -stock * caInterestRate);
    
    // Calculate weighted average interest rate for savings deposits
    let weightedSavingsRate = 0;
    if (product.savingsModule.depositMix && Array.isArray(product.savingsModule.depositMix)) {
      product.savingsModule.depositMix.forEach(deposit => {
        const percentage = (deposit.percentage || 0) / 100;
        const rate = (deposit.interestRate || 0) / 100;
        weightedSavingsRate += percentage * rate;
      });
    }
    savingsInterestExpense = savingsDeposits.map(stock => -stock * weightedSavingsRate);
    
    totalInterestExpense = currentAccountInterestExpense.map((ca, i) => 
      ca + savingsInterestExpense[i]
    );
  } else {
    // Standard fee calculation
    const monthlyFee = product.monthlyFee || 0;
    const annualServiceRevenue = product.annualServiceRevenue || 0;
    commissionIncome = avgCustomers.map(customers => 
      (customers * monthlyFee * 12 + customers * annualServiceRevenue) / 1000000 // Convert to millions
    );
  }

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
        productResults[key] = calculateDepositAndServiceProduct(product, assumptions, years, ftpRate);
        continue;
      }
      
      // Handle Digital Banking products as deposits (liabilities) - legacy support
      if (product.productType === 'Deposit' || key.startsWith('digitalBanking')) {
        productResults[key] = calculateDepositProduct(product, assumptions, years, ftpRate, depositRate);
        continue;
      }
      
      // Use volumeArray if available, otherwise fallback to interpolation
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
            const y10 = product.volumes.y10 || 0;
            yearVolume = y1 + ((y10 - y1) * i / 9);
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

      const grossPerformingStock = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const nplStock = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const averagePerformingStock = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const newNPLs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      // Apply credit classification impact on default rate (defined outside loop)
      const baseDefaultRate = product.dangerRate / 100;
      const classificationMultiplier = product.creditClassification === 'UTP' ? 2.5 : 1.0;
      const adjustedDefaultRate = baseDefaultRate * classificationMultiplier;
      
      for (let year = 0; year < years.length; year++) {
          
          const defaultsFromStock = year > 0 ? grossPerformingStock[year - 1] * adjustedDefaultRate : 0;
          newNPLs[year] = defaultsFromStock;

          let repayments = 0;
          for (let prevYear = 0; prevYear < year; prevYear++) {
              const cohortVolume = volumes10Y[prevYear];
              const ageInYears = year - prevYear;
              
              // Apply grace period logic
              const gracePeriod = product.gracePeriod || 0;
              const effectiveAge = Math.max(0, ageInYears - gracePeriod);
              
              // Use totalDuration if available, otherwise fall back to durata
              const totalDuration = product.totalDuration || product.durata || 7;
              
              if (effectiveAge > 0 && effectiveAge <= totalDuration && product.type !== 'bullet') {
                  // During grace period, no repayments
                  if (ageInYears > gracePeriod) {
                      repayments += cohortVolume / (totalDuration - gracePeriod);
                  }
              }
              if (ageInYears === totalDuration && product.type === 'bullet') {
                  repayments += cohortVolume;
              }
          }

          const prevYearStock = year > 0 ? grossPerformingStock[year - 1] : 0;
          const totalEopStock = prevYearStock + volumes10Y[year] - repayments - newNPLs[year];
          grossPerformingStock[year] = totalEopStock;
          
          // Calculate duration-weighted average stock
          let durationWeightedAvgStock = 0;
          
          // For each vintage (year of origination), calculate its contribution to average stock
          for (let originYear = 0; originYear <= year; originYear++) {
              const vintageVolume = volumes10Y[originYear] || 0;
              if (vintageVolume > 0) {
                  const ageInYears = year - originYear;
                  const totalDuration = product.totalDuration || product.durata || 7;
                  const gracePeriod = product.gracePeriod || 0;
                  
                  if (ageInYears < totalDuration) {
                      let vintageAvgStock = 0;
                      
                      if (product.type === 'bullet') {
                          // Bullet: full amount until maturity
                          vintageAvgStock = vintageVolume;
                      } else if (product.type === 'interest-only') {
                          // Interest-only: full amount until final repayment
                          vintageAvgStock = ageInYears < (totalDuration - 1) ? vintageVolume : vintageVolume / 2;
                      } else {
                          // French amortization: linear repayment after grace period
                          if (ageInYears <= gracePeriod) {
                              vintageAvgStock = vintageVolume; // Full amount during grace period
                          } else {
                              const effectiveAge = ageInYears - gracePeriod;
                              const amortizationPeriod = totalDuration - gracePeriod;
                              const remainingPct = Math.max(0, (amortizationPeriod - effectiveAge) / amortizationPeriod);
                              const startYearPct = Math.max(0, (amortizationPeriod - effectiveAge + 1) / amortizationPeriod);
                              vintageAvgStock = vintageVolume * (startYearPct + remainingPct) / 2;
                          }
                      }
                      
                      // Apply default adjustments (reduce stock for cumulative defaults)
                      const cumulativeDefaultRate = Math.min(0.95, adjustedDefaultRate * ageInYears);
                      vintageAvgStock *= (1 - cumulativeDefaultRate);
                      
                      durationWeightedAvgStock += vintageAvgStock;
                  }
              }
          }
          
          averagePerformingStock[year] = durationWeightedAvgStock;
          
          const prevNplStock = year > 0 ? nplStock[year - 1] : 0;
          nplStock[year] = prevNplStock + newNPLs[year];
      }

      const collateralValue = 1 / (product.ltv / 100);
      const discountedCollateralValue = collateralValue * (1 - (product.collateralHaircut / 100));
      const netRecoveryValue = discountedCollateralValue * (1 - (product.recoveryCosts / 100));
      const baseLgd = Math.max(0, 1 - netRecoveryValue);
      
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
      
      const expectedLossOnNewBusiness = volumes10Y.map(v => -v * (product.dangerRate / 100) * lgd);
      const lossOnStockDefaults = newNPLs.map(v => -v * lgd);

      // Calculate number of loans granted per year
      const avgLoanSize = product.avgLoanSize || 1.0;
      const numberOfLoans = volumes10Y.map(v => Math.round(v / avgLoanSize));

      // Calculate interest income considering fixed vs variable rates
      const baseInterestRate = assumptions.euribor + product.spread;
      const interestRate = product.isFixedRate ? product.spread + 2.0 : baseInterestRate; // Fixed rate assumption
      
      // Calculate interest expense using FTP rate for all credit products
      const interestExpense = averagePerformingStock.map(v => -v * ftpRate);
      
      // Calculate equity upside potential
      const equityUpsideIncome = volumes10Y.map(v => v * (product.equityUpside || 0) / 100);
      
      productResults[key] = {
          name: product.name,
          performingAssets: grossPerformingStock,
          averagePerformingAssets: averagePerformingStock,
          nonPerformingAssets: nplStock,
          interestIncome: averagePerformingStock.map(v => v * interestRate / 100),
          interestExpense: interestExpense,
          commissionIncome: volumes10Y.map(v => v * (product.commissionRate || 0) / 100),
          equityUpsideIncome: equityUpsideIncome,
          llp: years.map(i => lossOnStockDefaults[i] + expectedLossOnNewBusiness[i]),
          rwa: grossPerformingStock.map(v => v * adjustedRwaDensity),
          numberOfLoans: numberOfLoans,
          newBusiness: volumes10Y,
          assumptions: {
              interestRate: interestRate, // Keep as percentage for display (6.3 for 6.3%)
              commissionRate: (product.commissionRate || 0), // Keep as percentage for display (0.8 for 0.8%)
              pd: adjustedDefaultRate,
              lgd: lgd,
              baseLgd: baseLgd, // LGD before state guarantee mitigation
              riskWeight: adjustedRwaDensity,
              baseRiskWeight: classificationAdjustedRwaDensity, // RWA before state guarantee mitigation
              stateGuaranteePercentage: stateGuaranteePercentage,
              ftpRate: ftpRate * 100, // Store FTP rate as percentage for display
              isFixedRate: product.isFixedRate || false,
              creditClassification: product.creditClassification || 'Bonis',
              equityUpside: (product.equityUpside || 0) / 100
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
  const divisionPrefixes = ['re', 'sme', 'digital', 'wealth', 'tech', 'incentive'];
  
  // Create division-specific product results
  const divisionProductResults = {};
  divisionPrefixes.forEach(prefix => {
    divisionProductResults[prefix] = Object.fromEntries(
      Object.entries(productResults).filter(([key]) => key.startsWith(prefix))
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

  // Calculate aggregates for all divisions dynamically
  divisionPrefixes.forEach(prefix => {
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
    results.divisions[prefix].pnl.commissionIncome = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.commissionIncome[i], 0)
    );
    results.divisions[prefix].pnl.totalLLP = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.llp[i], 0)
    );
    results.divisions[prefix].capital.rwaCreditRisk = years.map(i => 
      Object.values(divisionProducts).reduce((sum, p) => sum + p.rwa[i], 0)
    );
  });

  // First calculate total balance sheet items to get accurate weights
  results.bs.performingAssets = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].bs.performingAssets[i], 0)
  );
  results.bs.nonPerformingAssets = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].bs.nonPerformingAssets[i], 0)
  );
  const totalLoans = years.map(i => results.bs.performingAssets[i] + results.bs.nonPerformingAssets[i]);
  results.bs.totalAssets = totalLoans;
  
  // Calculate total RWA components first
  results.capital.rwaCreditRisk = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].capital.rwaCreditRisk[i], 0)
  );
  results.capital.rwaOperationalRisk = results.bs.totalAssets.map(assets => assets * 0.1);
  results.capital.rwaMarketRisk = years.map(() => 0);
  results.capital.totalRWA = years.map(i => results.capital.rwaCreditRisk[i] + results.capital.rwaOperationalRisk[i] + results.capital.rwaMarketRisk[i]);

  // Calculate P&L first to get net profit for equity calculation
  results.pnl.interestIncome = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].pnl.interestIncome[i], 0)
  );
  // Calculate interest expenses using product-specific cost of funding
  results.pnl.interestExpenses = years.map(i => 
    Object.values(productResults).reduce((sum, product) => {
      const productInterestExpense = (product.interestExpense || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
      return sum + productInterestExpense;
    }, 0)
  );
  results.pnl.netInterestIncome = years.map(i => results.pnl.interestIncome[i] + results.pnl.interestExpenses[i]);
  
  results.pnl.commissionIncome = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].pnl.commissionIncome[i], 0)
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
    'incentive': 'incentiveFinanceDivision'
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
  
  results.pnl.personnelCostsTotal = results.kpi.fte.map(fte => - (fte * assumptions.avgCostPerFte) / 1000);

  const costGrowth = years.map(i => Math.pow(1 + assumptions.costGrowthRate / 100, i));
  results.pnl.adminCosts = years.map(i => -assumptions.adminCostsY1 * costGrowth[i]);
  results.pnl.marketingCosts = years.map(i => -assumptions.marketingCostsY1 * costGrowth[i]);
  results.pnl.hqAllocation = years.map(i => -assumptions.hqAllocationY1 * costGrowth[i]);
  results.pnl.itCosts = years.map(i => -assumptions.itCostsY1 * costGrowth[i]);
  const otherOpex = years.map(i => results.pnl.adminCosts[i] + results.pnl.marketingCosts[i] + results.pnl.hqAllocation[i] + results.pnl.itCosts[i]);
  results.pnl.totalOpex = years.map(i => results.pnl.personnelCostsTotal[i] + otherOpex[i]);

  results.pnl.otherCosts = years.map(i => -assumptions.otherCostsY1 * costGrowth[i]);
  results.pnl.provisions = years.map(i => -assumptions.provisionsY1 * costGrowth[i]);
  results.pnl.totalLLP = years.map(i => 
    divisionPrefixes.reduce((sum, prefix) => sum + results.divisions[prefix].pnl.totalLLP[i], 0)
  );
  results.pnl.preTaxProfit = years.map(i => results.pnl.totalRevenues[i] + results.pnl.totalOpex[i] + results.pnl.totalLLP[i] + results.pnl.otherCosts[i]);
  results.pnl.taxes = years.map(i => results.pnl.preTaxProfit[i] > 0 ? -results.pnl.preTaxProfit[i] * (assumptions.taxRate / 100) : 0);
  results.pnl.netProfit = years.map(i => results.pnl.preTaxProfit[i] + results.pnl.taxes[i]);

  // Calculate digital service deposits (from DigitalService products)
  results.bs.digitalServiceDeposits = years.map(i => 
    Object.values(productResults)
      .filter(product => product.depositStock) // Only products with deposit stock
      .reduce((sum, product) => sum + (product.depositStock[i] || 0), 0)
  );

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
      product.personnelCosts = years.map(i => results.pnl.personnelCostsTotal[i] * rwaWeight[i]);
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
  
  divisionPrefixes.forEach(prefix => {
    const divisionProducts = Object.entries(productResults)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, product]) => product);
    
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