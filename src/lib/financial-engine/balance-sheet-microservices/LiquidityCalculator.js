/**
 * Liquidity Calculator Microservice
 * 
 * Responsible for calculating liquidity buffer, cash and cash equivalents
 * Ensures regulatory compliance with LCR and NSFR requirements
 */

/**
 * Main entry point for Liquidity calculation
 * @param {Object} divisions - All division data
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @param {Object} balanceSheetData - Other balance sheet items for ratio calculations
 * @returns {Object} Liquidity positions and metrics
 */
export const calculateLiquidity = (divisions, assumptions, years, balanceSheetData) => {
  const results = {
    components: {
      cashAndCentralBank: new Array(10).fill(0),
      interbankDeposits: new Array(10).fill(0),
      liquidSecurities: new Array(10).fill(0),
      tradingAssets: new Array(10).fill(0),
      totalLiquidAssets: new Array(10).fill(0)
    },
    buffers: {
      regulatoryBuffer: new Array(10).fill(0),  // Required by regulation
      managementBuffer: new Array(10).fill(0),  // Additional management buffer
      totalBuffer: new Array(10).fill(0)
    },
    metrics: {
      lcr: new Array(10).fill(0),              // Liquidity Coverage Ratio
      nsfr: new Array(10).fill(0),             // Net Stable Funding Ratio
      liquidAssetsRatio: new Array(10).fill(0), // Liquid assets / Total assets
      cashRatio: new Array(10).fill(0)         // Cash / Short-term liabilities
    },
    funding: {
      stableFunding: new Array(10).fill(0),
      unstableFunding: new Array(10).fill(0),
      requiredStableFunding: new Array(10).fill(0)
    }
  };

  // Get treasury division data if available
  const treasuryDivision = divisions.treasury;
  
  if (treasuryDivision?.bs) {
    // Use pre-calculated treasury assets
    if (treasuryDivision.bs.liquidityBuffer) {
      results.components.liquidSecurities = treasuryDivision.bs.liquidityBuffer;
    }
    
    if (treasuryDivision.bs.tradingAssets) {
      results.components.tradingAssets = treasuryDivision.bs.tradingAssets;
    }
    
    if (treasuryDivision.bs.interbankAssets) {
      results.components.interbankDeposits = treasuryDivision.bs.interbankAssets;
    }
  } else {
    // Calculate based on balance sheet needs
    calculateLiquidityRequirements(results, balanceSheetData, assumptions, years);
  }

  // Calculate total liquid assets
  years.forEach(year => {
    results.components.totalLiquidAssets[year] = 
      results.components.cashAndCentralBank[year] +
      results.components.interbankDeposits[year] +
      results.components.liquidSecurities[year] +
      results.components.tradingAssets[year];
  });

  // Calculate regulatory metrics
  calculateRegulatoryMetrics(results, balanceSheetData, assumptions, years);

  return results;
};

/**
 * Calculate liquidity requirements based on balance sheet
 * @param {Object} results - Results object to populate
 * @param {Object} balanceSheetData - Balance sheet data
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 */
const calculateLiquidityRequirements = (results, balanceSheetData, assumptions, years) => {
  const lcrRequirement = 1.0; // 100% LCR requirement
  const liquidityBufferRatio = 0.15; // 15% of deposits as liquidity buffer
  
  years.forEach(year => {
    const totalDeposits = balanceSheetData.deposits?.[year] || 0;
    const totalLoans = balanceSheetData.totalLoans?.[year] || 0;
    
    // Calculate required liquidity buffer
    const requiredBuffer = totalDeposits * liquidityBufferRatio;
    
    // Allocate to different liquid asset categories
    results.components.cashAndCentralBank[year] = requiredBuffer * 0.2;  // 20% as cash
    results.components.liquidSecurities[year] = requiredBuffer * 0.6;     // 60% as liquid securities
    results.components.interbankDeposits[year] = requiredBuffer * 0.2;   // 20% as interbank
    
    // Trading assets based on business model
    results.components.tradingAssets[year] = totalLoans * 0.02; // 2% of loans as trading book
    
    // Store buffer requirements
    results.buffers.regulatoryBuffer[year] = requiredBuffer;
    results.buffers.managementBuffer[year] = requiredBuffer * 0.1; // 10% additional
    results.buffers.totalBuffer[year] = results.buffers.regulatoryBuffer[year] + 
                                       results.buffers.managementBuffer[year];
  });
};

/**
 * Calculate regulatory liquidity metrics
 * @param {Object} results - Results object
 * @param {Object} balanceSheetData - Balance sheet data
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 */
const calculateRegulatoryMetrics = (results, balanceSheetData, assumptions, years) => {
  years.forEach(year => {
    const totalAssets = balanceSheetData.totalAssets?.[year] || 0;
    const totalDeposits = balanceSheetData.deposits?.[year] || 0;
    const shortTermLiabilities = totalDeposits * 0.3; // Assume 30% are short-term
    
    // LCR = High-Quality Liquid Assets / Net Cash Outflows (30 days)
    const hqla = results.components.cashAndCentralBank[year] + 
                 results.components.liquidSecurities[year] * 0.85; // 85% haircut on securities
    const netCashOutflows = shortTermLiabilities * 0.25; // 25% outflow assumption
    
    if (netCashOutflows > 0) {
      results.metrics.lcr[year] = (hqla / netCashOutflows) * 100;
    } else {
      results.metrics.lcr[year] = 200; // Cap at 200%
    }
    
    // NSFR = Available Stable Funding / Required Stable Funding
    const stableDeposits = totalDeposits * 0.7; // 70% considered stable
    const equity = balanceSheetData.equity?.[year] || 0;
    const availableStableFunding = equity + stableDeposits * 0.95; // 95% weight for stable deposits
    
    const loans = balanceSheetData.totalLoans?.[year] || 0;
    const requiredStableFunding = loans * 0.85; // 85% RSF for loans
    
    if (requiredStableFunding > 0) {
      results.metrics.nsfr[year] = (availableStableFunding / requiredStableFunding) * 100;
    } else {
      results.metrics.nsfr[year] = 150; // Cap at 150%
    }
    
    // Liquid assets ratio
    if (totalAssets > 0) {
      results.metrics.liquidAssetsRatio[year] = 
        (results.components.totalLiquidAssets[year] / totalAssets) * 100;
    }
    
    // Cash ratio
    if (shortTermLiabilities > 0) {
      results.metrics.cashRatio[year] = 
        (results.components.cashAndCentralBank[year] / shortTermLiabilities) * 100;
    }
    
    // Store funding data
    results.funding.stableFunding[year] = availableStableFunding;
    results.funding.unstableFunding[year] = totalDeposits * 0.3;
    results.funding.requiredStableFunding[year] = requiredStableFunding;
  });
};