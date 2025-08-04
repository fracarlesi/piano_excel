/**
 * Wealth Division Financial Calculation Entry Point
 * 
 * Coordina tutti i calcoli finanziari per la divisione Wealth Management
 */

import { calculateWealthBalanceSheet } from './balance-sheet/WealthBalanceSheetOrchestrator.js';
import { calculateWealthPnL } from './pnl/WealthPnLOrchestrator.js';

export const calculateWealthFinancials = (assumptions, digitalClients, quarters = 40) => {
  console.log('💎 Starting Wealth Division financial calculations...');
  
  const results = {
    balanceSheet: null,
    pnl: null,
    metrics: {
      finalAUM: 0,
      totalRevenues: 0,
      totalCosts: 0,
      netIncome: 0,
      roaum: 0, // Return on AUM
      costIncomeRatio: 0
    }
  };
  
  try {
    // 1. Calculate Balance Sheet (AUM)
    console.log('📊 Calculating Wealth Balance Sheet...');
    results.balanceSheet = calculateWealthBalanceSheet(assumptions, digitalClients, quarters);
    
    // 2. Calculate P&L
    console.log('💰 Calculating Wealth P&L...');
    results.pnl = calculateWealthPnL(
      assumptions, 
      { wealth: results.balanceSheet }, // Pass balance sheet results
      digitalClients, 
      quarters
    );
    
    // 3. Calculate key metrics
    results.metrics = {
      finalAUM: results.balanceSheet.metrics.totalAUM,
      totalRevenues: results.pnl.summary.totalRevenues,
      totalCosts: results.pnl.summary.totalCosts,
      netIncome: results.pnl.summary.netIncome,
      roaum: results.balanceSheet.metrics.avgAUM > 0 
        ? (results.pnl.summary.totalRevenues / results.balanceSheet.metrics.avgAUM) * 100
        : 0,
      costIncomeRatio: results.pnl.summary.totalRevenues > 0
        ? (results.pnl.summary.totalCosts / results.pnl.summary.totalRevenues) * 100
        : 0
    };
    
    console.log('✅ Wealth financial calculations completed');
    console.log('📈 Key Metrics:');
    console.log(`   - Final AUM: €${(results.metrics.finalAUM / 1000000).toFixed(1)}M`);
    console.log(`   - Total Revenues: €${results.metrics.totalRevenues.toFixed(1)}M`);
    console.log(`   - Net Income: €${results.metrics.netIncome.toFixed(1)}M`);
    console.log(`   - RoAUM: ${results.metrics.roaum.toFixed(2)}%`);
    console.log(`   - Cost/Income: ${results.metrics.costIncomeRatio.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error in Wealth financial calculations:', error);
    throw error;
  }
  
  return results;
};

// Export individual calculators for testing or specific use
export { calculateWealthBalanceSheet } from './balance-sheet/WealthBalanceSheetOrchestrator.js';
export { calculateWealthPnL } from './pnl/WealthPnLOrchestrator.js';