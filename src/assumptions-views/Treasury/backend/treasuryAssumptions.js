// Treasury & ALM Division Configuration
export const treasuryAssumptions = {
  // Treasury parameters
  liquidityCushion: 10, // % of total deposits to maintain as liquidity cushion
  bondPortfolioTarget: 15, // % of assets to maintain in bond portfolio
  interbankLendingTarget: 5, // % of assets for interbank lending
  liquidityBufferRequirement: 10, // Required liquidity buffer as % of total deposits
  liquidAssetReturnRate: 1.5, // Annual return on liquid assets
  interbankFundingRate: 2.5, // Cost of interbank funding
  tradingBookSize: 50, // Initial size of trading portfolio in €M
  tradingBookGrowthRate: 5, // Annual growth rate of trading book
  tradingBookReturnTarget: 3.5, // Target annual return on trading activities
  tradingBookVolatility: 15, // Expected volatility of trading returns
  
  // Treasury staffing
  headcountGrowth: 3, // % annual headcount growth
  staffing: [
    { level: 'Junior', count: 2, ralPerHead: 35 },
    { level: 'Middle', count: 2, ralPerHead: 50 },
    { level: 'Senior', count: 1, ralPerHead: 70 },
    { level: 'Head of', count: 1, ralPerHead: 110 }
  ]
};

// Fund Transfer Pricing (FTP) System
export const ftpAssumptions = {
  ftpSpread: {
    retail: 1.5,
    corporate: 2.0,
    institutional: 1.0
  },
  liquidityCosts: {
    sight: 0.5,
    termDeposits: 0.3,
    bonds: 0.1
  }
};