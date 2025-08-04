/**
 * Tech Balance Sheet Orchestrator
 * Coordinates all balance sheet calculations for Tech Division
 * Focus: IT assets, depreciation, and service-oriented structure
 */

import { ITAssetCalculator } from './assets/ITAssetCalculator.js';
import { WorkingCapitalCalculator } from './assets/WorkingCapitalCalculator.js';
import { TechEquityCalculator } from './liabilities/TechEquityCalculator.js';

export class TechBalanceSheetOrchestrator {
  constructor() {
    this.itAssetCalculator = new ITAssetCalculator();
    this.workingCapitalCalculator = new WorkingCapitalCalculator();
    this.techEquityCalculator = new TechEquityCalculator();
  }

  /**
   * Calculate all balance sheet items for Tech Division
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @returns {Object} Complete balance sheet data
   */
  calculateBalanceSheet(assumptions, globalAssumptions) {
    console.log('🖥️ Starting Tech Balance Sheet calculation...');
    console.log('  Tech assumptions:', assumptions);
    console.log('  Tech products:', assumptions?.products);
    
    // Step 1: Calculate IT assets (CAPEX-based)
    const itAssets = this.itAssetCalculator.calculateITAssets(
      assumptions,
      globalAssumptions
    );
    
    // Step 2: Calculate operational requirements (for Treasury management)
    const operationalRequirements = this.workingCapitalCalculator.calculateWorkingCapital(
      assumptions,
      globalAssumptions
    );
    
    // Step 3: Calculate total assets (only IT assets - no working capital)
    const totalAssets = this.calculateTotalAssets(itAssets);
    
    // Step 4: Calculate equity allocation
    const equity = this.techEquityCalculator.calculateEquity(
      totalAssets,
      assumptions,
      globalAssumptions
    );
    
    // Step 5: Apply exit strategy impact if applicable
    const exitImpact = this.calculateExitStrategyImpact(
      itAssets,
      assumptions,
      globalAssumptions
    );
    
    // Return structured balance sheet data
    return {
      assets: {
        itInfrastructure: itAssets.infrastructure,
        software: itAssets.software,
        developmentProjects: itAssets.developmentProjects,
        totalITAssets: itAssets.total,
        totalAssets: totalAssets,
        // Tech has no lending assets
        newVolumes: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        repayments: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        stockNBV: totalAssets, // For consistency with other divisions
        netPerformingAssets: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      liabilities: {
        // Tech has minimal direct liabilities - working capital managed by Treasury
        equity: equity,
        groupFunding: totalAssets, // All funding comes from group/treasury
        // No customer deposits or operational liabilities (managed by Treasury)
        customerDeposits: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        sightDeposits: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        termDeposits: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      exitStrategy: exitImpact,
      depreciation: itAssets.depreciation,
      
      // Operational requirements for Treasury management (not in balance sheet)
      operationalRequirements: {
        workingCapitalNeeds: operationalRequirements,
        cashRequirements: operationalRequirements.total,
        paymentTerms: {
          receivables: 60, // days
          payables: 45,    // days
          prepaidCycles: 90 // days
        }
      }
    };
  }

  /**
   * Calculate total assets (only IT assets - no working capital)
   */
  calculateTotalAssets(itAssets) {
    const quarterly = new Array(40).fill(0);
    const yearly = new Array(10).fill(0);
    
    // Only IT assets - working capital managed by Treasury
    for (let q = 0; q < 40; q++) {
      quarterly[q] = itAssets.total.quarterly[q] || 0;
    }
    
    for (let y = 0; y < 10; y++) {
      yearly[y] = itAssets.total.yearly[y] || 0;
    }
    
    return { quarterly, yearly };
  }

  /**
   * Calculate exit strategy impact on balance sheet
   */
  calculateExitStrategyImpact(itAssets, assumptions, globalAssumptions) {
    // Get exit configuration from products (same path as P&L)
    const exitConfig = assumptions.products?.divisionExit || {};
    const exitYear = exitConfig.exitYear || 5;
    const exitPercentage = (exitConfig.exitPercentage || 40) / 100; // Convert percentage
    
    const impact = {
      exitYear: exitYear,
      exitQuarter: exitYear * 4,
      exitPercentage: exitPercentage,
      assetsTransferred: {
        quarterly: new Array(40).fill(0),
        yearly: new Array(10).fill(0)
      },
      retainedAssets: {
        quarterly: new Array(40).fill(0),
        yearly: new Array(10).fill(0)
      }
    };
    
    // Calculate asset transfer at exit
    const exitQ = impact.exitQuarter;
    if (exitQ < 40) {
      // Assets transferred at book value
      const bookValue = itAssets.total.quarterly[exitQ] || 0;
      impact.assetsTransferred.quarterly[exitQ] = bookValue * exitPercentage;
      
      // Update retained assets post-exit
      for (let q = exitQ; q < 40; q++) {
        impact.retainedAssets.quarterly[q] = (itAssets.total.quarterly[q] || 0) * (1 - exitPercentage);
      }
    }
    
    // Calculate yearly impact
    if (exitYear < 10) {
      const bookValueYearly = itAssets.total.yearly[exitYear] || 0;
      impact.assetsTransferred.yearly[exitYear] = bookValueYearly * exitPercentage;
      
      for (let y = exitYear; y < 10; y++) {
        impact.retainedAssets.yearly[y] = (itAssets.total.yearly[y] || 0) * (1 - exitPercentage);
      }
    }
    
    return impact;
  }
}

export default TechBalanceSheetOrchestrator;