/**
 * Treasury & ALM Calculator Module
 * 
 * Handles treasury and asset-liability management calculations including:
 * - Funding gap analysis
 * - Liquidity buffer management
 * - FTP (Funds Transfer Pricing) calculations
 * - Trading book P&L
 */

/**
 * Calculate treasury division results
 * 
 * @param {Object} assumptions - Global assumptions including treasury config
 * @param {Object} bankData - Aggregated bank data (loans, deposits, etc.)
 * @param {Array} years - Array of year indices
 * @returns {Object} Complete treasury calculation results
 */
export const calculateTreasuryResults = (assumptions, bankData, years) => {
  const treasury = assumptions.treasury || {};
  const ftpSpread = assumptions.ftpSpread;
  const euribor = assumptions.euribor;
  const ftpRate = (euribor + ftpSpread) / 100;
  const depositRate = assumptions.depositRate / 100;
  
  // Extract treasury parameters
  const interbankFundingRate = treasury.interbankFundingRate / 100;
  const liquidityBufferRequirement = treasury.liquidityBufferRequirement / 100;
  const liquidAssetReturnRate = treasury.liquidAssetReturnRate / 100;
  const tradingBookSize = treasury.tradingBookSize;
  const tradingBookGrowthRate = treasury.tradingBookGrowthRate / 100;
  const tradingBookReturnTarget = treasury.tradingBookReturnTarget / 100;
  const tradingBookVolatility = treasury.tradingBookVolatility / 100;
  
  // Initialize result structure
  const results = {
    bs: {
      liquidAssets: [],
      tradingAssets: [],
      interbankFunding: [],
      performingAssets: [],
      nonPerformingAssets: [],
      totalAssets: []
    },
    pnl: {
      liquidityBufferIncome: [],
      tradingIncome: [],
      interbankFundingCost: [],
      ftpSpreadIncome: [],
      interestIncome: [],
      interestExpenses: [],
      commissionIncome: [],
      commissionExpenses: [],
      totalRevenues: [],
      personnelCosts: [],
      otherOpex: [],
      totalOpex: [],
      preTaxProfit: [],
      taxes: [],
      netProfit: []
    },
    capital: {
      rwaCreditRisk: [],
      rwaMarketRisk: [],
      totalRWA: []
    },
    kpi: {
      liquidityRatio: [],
      fundingGap: [],
      fundingGapPercent: [],
      netFtpMargin: [],
      treasuryRoe: []
    }
  };
  
  // Calculate for each year
  years.forEach((_, i) => {
    // Extract bank data for the year
    const totalLoans = bankData.totalLoans?.[i] || 0;
    const totalDeposits = bankData.totalDeposits?.[i] || 0;
    // const digitalDeposits = bankData.digitalDeposits?.[i] || 0; // Currently unused - may be needed for specific deposit calculations
    
    // Calculate funding gap
    const fundingGap = Math.max(0, totalLoans - totalDeposits);
    results.kpi.fundingGap[i] = fundingGap;
    
    // Liquidity buffer (% of total deposits)
    const liquidityBuffer = totalDeposits * liquidityBufferRequirement;
    results.bs.liquidAssets[i] = liquidityBuffer;
    
    // Trading book assets
    const tradingAssets = tradingBookSize * Math.pow(1 + tradingBookGrowthRate, i);
    results.bs.tradingAssets[i] = tradingAssets;
    
    // Total treasury assets
    results.bs.performingAssets[i] = liquidityBuffer + tradingAssets;
    results.bs.nonPerformingAssets[i] = 0; // Treasury doesn't have NPLs
    results.bs.totalAssets[i] = results.bs.performingAssets[i];
    
    // Interbank funding to cover funding gap
    results.bs.interbankFunding[i] = fundingGap;
    
    // Income calculations
    
    // 1. Liquidity buffer income
    results.pnl.liquidityBufferIncome[i] = liquidityBuffer * liquidAssetReturnRate;
    
    // 2. Trading income (with volatility)
    const baseTrading = tradingAssets * tradingBookReturnTarget;
    const volatilityFactor = 1 + (Math.random() - 0.5) * tradingBookVolatility;
    results.pnl.tradingIncome[i] = baseTrading * (i === 0 ? 1 : volatilityFactor);
    
    // 3. Interbank funding cost
    results.pnl.interbankFundingCost[i] = -fundingGap * interbankFundingRate;
    
    // 4. FTP spread income
    // Treasury earns spread on funds provided to divisions
    const ftpIncome = totalLoans * ftpRate;
    const depositCost = totalDeposits * depositRate;
    results.pnl.ftpSpreadIncome[i] = ftpIncome - depositCost;
    
    // Aggregate interest income/expense
    results.pnl.interestIncome[i] = 
      results.pnl.liquidityBufferIncome[i] + 
      (results.pnl.ftpSpreadIncome[i] > 0 ? results.pnl.ftpSpreadIncome[i] : 0);
    
    results.pnl.interestExpenses[i] = 
      results.pnl.interbankFundingCost[i] + 
      (results.pnl.ftpSpreadIncome[i] < 0 ? results.pnl.ftpSpreadIncome[i] : 0);
    
    // Trading income as commission
    results.pnl.commissionIncome[i] = results.pnl.tradingIncome[i];
    results.pnl.commissionExpenses[i] = 0;
    
    // Total revenues
    results.pnl.totalRevenues[i] = 
      results.pnl.interestIncome[i] + 
      results.pnl.interestExpenses[i] + 
      results.pnl.commissionIncome[i];
    
    // Capital calculations
    
    // Credit RWA for liquid assets (20% weight) and trading book (100% weight)
    results.capital.rwaCreditRisk[i] = 
      liquidityBuffer * 0.2 + tradingAssets * 1.0;
    
    // Market RWA for trading book
    results.capital.rwaMarketRisk[i] = tradingAssets * 1.5;
    
    results.capital.totalRWA[i] = 
      results.capital.rwaCreditRisk[i] + 
      results.capital.rwaMarketRisk[i];
    
    // KPIs
    results.kpi.liquidityRatio[i] = 
      totalDeposits > 0 ? (liquidityBuffer / totalDeposits) * 100 : 0;
    
    results.kpi.fundingGapPercent[i] = 
      totalLoans > 0 ? (fundingGap / totalLoans) * 100 : 0;
    
    results.kpi.netFtpMargin[i] = 
      totalLoans > 0 ? (results.pnl.ftpSpreadIncome[i] / totalLoans) * 10000 : 0; // in bps
  });
  
  return results;
};

/**
 * Calculate funding mix and cost of funds
 * 
 * @param {Object} fundingMix - Funding mix configuration
 * @param {Array} totalLiabilities - Total liabilities by year
 * @param {Object} rates - Interest rates configuration
 * @param {Array} years - Array of year indices
 * @returns {Object} Funding breakdown and costs
 */
export const calculateFundingMix = (fundingMix, totalLiabilities, rates, years) => {
  const sightDepositRate = 0.001; // 10 bps
  const termDepositRate = rates.depositRate / 100;
  const groupFundingRate = (rates.euribor + 0.5) / 100; // EURIBOR + 50 bps
  
  const results = {
    sightDeposits: [],
    termDeposits: [],
    groupFunding: [],
    totalFundingCost: []
  };
  
  years.forEach((_, i) => {
    const totalLiab = totalLiabilities[i] || 0;
    
    results.sightDeposits[i] = totalLiab * (fundingMix.sightDeposits / 100);
    results.termDeposits[i] = totalLiab * (fundingMix.termDeposits / 100);
    results.groupFunding[i] = totalLiab * (fundingMix.groupFunding / 100);
    
    results.totalFundingCost[i] = -(
      results.sightDeposits[i] * sightDepositRate +
      results.termDeposits[i] * termDepositRate +
      results.groupFunding[i] * groupFundingRate
    );
  });
  
  return results;
};