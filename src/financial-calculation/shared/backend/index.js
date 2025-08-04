/**
 * Main Calculation Engine - Simplified Orchestrator
 * 
 * This module coordinates the three main calculation domains:
 * 1. Balance Sheet
 * 2. Profit & Loss
 * 3. Capital Requirements
 * 4. Key Performance Indicators
 */

import { BalanceSheetOrchestrator } from './balance-sheet/BalanceSheetOrchestrator';
import { PnLOrchestrator } from './pnl/PnLOrchestrator';
import { CapitalRequirementsOrchestrator } from './capital-requirements/CapitalRequirementsOrchestrator';
import { KPICalculator } from './kpis/KPICalculator';

/**
 * Main calculation function - delegates to domain orchestrators
 * 
 * @param {Object} assumptions - Complete assumptions object from UI/Firebase
 * @returns {Object} Complete calculation results for all domains
 */
export const calculateResults = (assumptions) => {
  try {
    // Step 1: Calculate Balance Sheet first (assets, liabilities, equity)
    const balanceSheetResults = BalanceSheetOrchestrator.calculate(assumptions);
    
    // Step 2: Calculate P&L (needs balance sheet for interest calculations)
    const pnlResults = PnLOrchestrator.calculate(assumptions, balanceSheetResults);
    
    // Step 3: Calculate Capital Requirements (needs balance sheet for RWA)
    const capitalResults = CapitalRequirementsOrchestrator.calculate(balanceSheetResults, assumptions);
    
    // Step 4: Calculate KPIs (needs all previous results)
    const kpiResults = KPICalculator.calculate(balanceSheetResults, pnlResults, capitalResults, assumptions);
    
    // Step 5: Organize results by division for UI
    const divisionResults = organizeDivisionResults(
      balanceSheetResults,
      pnlResults,
      capitalResults,
      kpiResults
    );
    
    // Return complete results structure expected by UI
    return {
      // Consolidated results
      bs: {
        ...balanceSheetResults.consolidated,
        // Include the details which contain product-level volumes and repayments
        details: balanceSheetResults.details
      },
      pnl: {
        ...pnlResults.consolidated,
        // Include PnL details for access to tech results
        details: pnlResults.details
      },
      capital: capitalResults.consolidated,
      kpi: kpiResults.consolidated,
      
      // Division breakdown
      divisions: divisionResults,
      
      // Product-level detail
      productResults: balanceSheetResults.productResults,
      
      // Product P&L table data
      productPnLTableData: pnlResults.productTableData,
      
      // Personnel costs detail
      allPersonnelCosts: pnlResults.personnelDetail,
      
      // Quarterly data for charts
      quarterly: {
        balanceSheet: balanceSheetResults.quarterly,
        pnl: pnlResults.quarterly,
        capital: capitalResults.quarterly
      },
      
      // Add complete balance sheet results at top level for easy access
      balanceSheet: balanceSheetResults
    };
    
  } catch (error) {
    throw new Error(`Calculation failed: ${error.message}`);
  }
};

/**
 * Organize results by division for UI consumption
 * @private
 */
const organizeDivisionResults = (balanceSheet, pnl, capital, kpi) => {
  const divisions = {};
  
  // Get all division keys from balance sheet
  const divisionKeys = Object.keys(balanceSheet.byDivision || {});
  
  divisionKeys.forEach(divisionKey => {
    const pnlDivision = pnl.byDivision[divisionKey] || {};
    
    const bsDivision = balanceSheet.byDivision[divisionKey] || {};
    
    divisions[divisionKey] = {
      bs: bsDivision,
      pnl: pnlDivision,
      capital: capital.byDivision[divisionKey] || {},
      kpi: kpi.byDivision[divisionKey] || {},
      // Add operatingCosts at the top level if it exists
      ...(pnlDivision.operatingCosts ? { operatingCosts: pnlDivision.operatingCosts } : {}),
      // Add liabilities data for divisions that have it (e.g., Digital)
      ...(bsDivision.liabilities ? { liabilities: bsDivision.liabilities } : {}),
      // Add customerGrowth data for divisions that have it (e.g., Digital)
      ...(bsDivision.customerGrowth ? { customerGrowth: bsDivision.customerGrowth } : {}),
      // Add techPnLResults for Tech division
      ...(pnlDivision.techPnLResults ? { techPnLResults: pnlDivision.techPnLResults } : {}),
      // Add Tech division specific data
      ...(bsDivision.techAssets ? { techAssets: bsDivision.techAssets } : {}),
      ...(bsDivision.exitStrategy ? { exitStrategy: bsDivision.exitStrategy } : {}),
      ...(bsDivision.depreciation ? { depreciation: bsDivision.depreciation } : {})
    };
  });
  
  return divisions;
};

/**
 * Export the main calculation function as default
 */
export default calculateResults;

/**
 * Export individual orchestrators for testing/debugging
 */
export {
  BalanceSheetOrchestrator,
  PnLOrchestrator,
  CapitalRequirementsOrchestrator,
  KPICalculator
};