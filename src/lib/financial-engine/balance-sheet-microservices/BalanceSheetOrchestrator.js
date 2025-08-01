/**
 * Balance Sheet Orchestrator
 * 
 * Main orchestrator that coordinates all Balance Sheet microservices
 * to produce the complete Statement of Financial Position
 */

import { calculatePerformingAssets } from './PerformingAssetsCalculator.js';
import { calculateNonPerformingAssets } from './NonPerformingAssetsCalculator.js';
import { calculateDeposits } from './DepositCalculator.js';
import { calculateLiquidity } from './LiquidityCalculator.js';
import { calculateEquity, calculateROEMetrics } from './EquityCalculator.js';

/**
 * Calculate complete Balance Sheet for all divisions
 * @param {Object} divisions - Division data with products
 * @param {Object} pnlResults - P&L results for net profit
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Complete Balance Sheet results
 */
export const calculateBalanceSheet = (divisions, pnlResults, assumptions, years) => {
  // Step 1: Assets side
  const performingAssets = calculatePerformingAssets(divisions, assumptions, years);
  const nonPerformingAssets = calculateNonPerformingAssets(divisions, assumptions, years);
  
  // Total loans
  const totalLoans = {
    annual: performingAssets.consolidated.annual.map((pa, i) => 
      pa + nonPerformingAssets.consolidated.annual[i]
    ),
    quarterly: performingAssets.consolidated.quarterly.map((pa, i) => 
      pa + nonPerformingAssets.consolidated.quarterly[i]
    )
  };

  // Step 2: Liabilities side - Deposits
  const deposits = calculateDeposits(divisions, assumptions, years);

  // Step 3: Liquidity and other assets
  const balanceSheetData = {
    totalLoans: totalLoans.annual,
    deposits: deposits.consolidated.annual,
    totalAssets: null, // Will be calculated
    equity: null // Will be calculated
  };
  
  const liquidity = calculateLiquidity(divisions, assumptions, years, balanceSheetData);

  // Step 4: Equity calculation
  const equity = calculateEquity(pnlResults, assumptions, years);
  balanceSheetData.equity = equity.components.totalEquity;

  // Step 5: Calculate total assets
  const totalAssets = {
    annual: years.map(year => 
      totalLoans.annual[year] + 
      liquidity.components.totalLiquidAssets[year] +
      (divisions.treasury?.bs?.otherAssets?.[year] || 0)
    ),
    quarterly: new Array(40).fill(0) // Simplified quarterly
  };
  balanceSheetData.totalAssets = totalAssets.annual;

  // Step 6: Calculate funding gap (if any)
  const fundingGap = {
    annual: years.map(year => 
      Math.max(0, totalAssets.annual[year] - deposits.consolidated.annual[year] - equity.components.totalEquity[year])
    )
  };

  // Step 7: ROE metrics
  const roeMetrics = calculateROEMetrics(equity, pnlResults, years);

  // Return complete balance sheet structure
  return {
    // Assets
    assets: {
      // Liquid assets
      cashAndCentralBank: liquidity.components.cashAndCentralBank,
      interbankDeposits: liquidity.components.interbankDeposits,
      liquidSecurities: liquidity.components.liquidSecurities,
      tradingAssets: liquidity.components.tradingAssets,
      
      // Loan portfolio
      performingLoans: performingAssets.consolidated.annual,
      nonPerformingLoans: nonPerformingAssets.consolidated.annual,
      totalLoans: totalLoans.annual,
      
      // Other assets
      otherAssets: new Array(10).fill(0), // Placeholder
      
      // Total
      totalAssets: totalAssets.annual
    },
    
    // Liabilities
    liabilities: {
      // Customer deposits
      customerDeposits: deposits.consolidated.annual,
      depositsByType: deposits.byType,
      
      // Wholesale funding
      interbankFunding: fundingGap.annual,
      bondsFunding: new Array(10).fill(0), // Could be added
      
      // Other liabilities
      otherLiabilities: new Array(10).fill(0), // Placeholder
      
      // Total liabilities
      totalLiabilities: years.map(year => 
        deposits.consolidated.annual[year] + 
        fundingGap.annual[year]
      )
    },
    
    // Equity
    equity: {
      shareCapital: equity.components.shareCapital,
      retainedEarnings: equity.components.retainedEarnings,
      currentYearProfit: equity.components.currentYearProfit,
      totalEquity: equity.components.totalEquity
    },
    
    // Quarterly data
    quarterly: {
      performingLoans: performingAssets.consolidated.quarterly,
      nonPerformingLoans: nonPerformingAssets.consolidated.quarterly,
      totalLoans: totalLoans.quarterly,
      customerDeposits: deposits.consolidated.quarterly,
      totalAssets: totalAssets.quarterly
    },
    
    // Division breakdown
    byDivision: Object.keys(divisions).reduce((acc, divKey) => {
      acc[divKey] = {
        performingAssets: performingAssets.byDivision[divKey]?.annual || new Array(10).fill(0),
        nonPerformingAssets: nonPerformingAssets.byDivision[divKey]?.annual || new Array(10).fill(0),
        deposits: deposits.byDivision[divKey]?.annual || new Array(10).fill(0)
      };
      return acc;
    }, {}),
    
    // Metrics
    metrics: {
      // Asset quality
      nplRatio: nonPerformingAssets.metrics.nplRatio,
      coverageRatio: nonPerformingAssets.metrics.coverageRatio,
      
      // Liquidity
      lcr: liquidity.metrics.lcr,
      nsfr: liquidity.metrics.nsfr,
      liquidAssetsRatio: liquidity.metrics.liquidAssetsRatio,
      depositToLoanRatio: deposits.metrics.depositToLoanRatio,
      
      // Profitability
      roe: roeMetrics.roe,
      
      // Leverage
      leverageRatio: years.map(year => 
        totalAssets.annual[year] > 0 ? 
        (equity.components.totalEquity[year] / totalAssets.annual[year]) * 100 : 0
      )
    },
    
    // Detailed components for drill-down
    details: {
      performingAssets: performingAssets,
      nonPerformingAssets: nonPerformingAssets,
      deposits: deposits,
      liquidity: liquidity,
      equity: equity
    }
  };
};