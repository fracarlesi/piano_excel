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
  
  // Commission products have minimal RWA
  const operationalRWA = volumes10Y.map(v => v * (product.operationalRiskWeight || 15) / 100);
  
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
    newBusiness: volumes10Y,
    assumptions: {
      commissionRate: (product.commissionRate || 0) / 100,
      feeIncomeRate: (product.feeIncomeRate || 0) / 100,
      operationalRiskWeight: (product.operationalRiskWeight || 15) / 100
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

  const productResults = {};
  for (const [key, product] of Object.entries(assumptions.products)) {
      
      // Skip calculation if product type is not Credit for credit-specific calculations
      if (product.productType === 'Commission') {
        productResults[key] = calculateCommissionProduct(product, assumptions, years);
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
      const lgd = Math.max(0, 1 - netRecoveryValue);
      
      // Apply credit classification impact on RWA density
      const baseRwaDensity = product.rwaDensity / 100;
      const rwaMultiplier = product.creditClassification === 'UTP' ? 1.5 : 1.0;
      const adjustedRwaDensity = baseRwaDensity * rwaMultiplier;
      
      const expectedLossOnNewBusiness = volumes10Y.map(v => -v * (product.dangerRate / 100) * lgd);
      const lossOnStockDefaults = newNPLs.map(v => -v * lgd);

      // Calculate number of loans granted per year
      const avgLoanSize = product.avgLoanSize || 1.0;
      const numberOfLoans = volumes10Y.map(v => Math.round(v / avgLoanSize));

      // Calculate interest income considering fixed vs variable rates
      const baseInterestRate = assumptions.euribor + product.spread;
      const interestRate = product.isFixedRate ? product.spread + 2.0 : baseInterestRate; // Fixed rate assumption
      
      // Calculate interest expense using product-specific cost of funding
      const productCostOfFunding = (product.costOfFunding || assumptions.costOfFundsRate || 3.0) / 100;
      const interestExpense = averagePerformingStock.map(v => -v * productCostOfFunding);
      
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
              riskWeight: adjustedRwaDensity,
              costOfFunding: productCostOfFunding,
              isFixedRate: product.isFixedRate || false,
              creditClassification: product.creditClassification || 'Bonis',
              equityUpside: (product.equityUpside || 0) / 100
          }
      };
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

  // Calculate total equity first
  results.bs.equity = years.map(i => assumptions.initialEquity + results.pnl.netProfit.slice(0, i + 1).reduce((a, b) => a + b, 0));
  results.bs.totalLiabilities = years.map(i => results.bs.totalAssets[i] - results.bs.equity[i]);
  
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

  // Calculate total number of loans granted
  results.kpi.totalNumberOfLoans = years.map(i => Object.values(productResults).reduce((sum, p) => sum + p.numberOfLoans[i], 0));
  
  // Calculate division-level number of loans dynamically
  divisionPrefixes.forEach(prefix => {
    results.kpi[`${prefix}NumberOfLoans`] = years.map(i => 
      Object.entries(productResults)
        .filter(([key]) => key.startsWith(prefix))
        .reduce((sum, [key, p]) => sum + p.numberOfLoans[i], 0)
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