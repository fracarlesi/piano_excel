/**
 * Capital Requirements Orchestrator
 * 
 * Main orchestrator that coordinates all Capital Requirements microservices
 * to produce the complete regulatory capital calculations
 */

import { calculateRWA } from './risk-weighted-assets/RWACalculator.js';
import { ALL_DIVISION_PREFIXES } from '../divisionMappings.js';

// TODO: This is a stub implementation - needs full development

/**
 * Main Capital Requirements calculation - static method for clean interface
 */
export const CapitalRequirementsOrchestrator = {
  /**
   * Calculate complete Capital Requirements
   * @param {Object} balanceSheetResults - Balance sheet results for RWA calculation
   * @param {Object} assumptions - Complete assumptions
   * @returns {Object} Capital Requirements results
   */
  calculate(balanceSheetResults, assumptions) {
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Step 1: Calculate Risk Weighted Assets
    const rwaResults = this.calculateTotalRWA(balanceSheetResults, assumptions, years);
    
    // Step 2: Calculate Capital Ratios
    const capitalRatios = this.calculateCapitalRatios(
      balanceSheetResults.consolidated.equity,
      rwaResults.total,
      years
    );
    
    // Step 3: Calculate Minimum Requirements
    const minimumRequirements = this.calculateMinimumRequirements(
      rwaResults.total,
      assumptions
    );
    
    // Step 4: Calculate Buffers
    const buffers = this.calculateBuffers(
      rwaResults.total,
      assumptions
    );
    
    // Step 5: Calculate Excess/Shortfall
    const excessShortfall = this.calculateExcessShortfall(
      capitalRatios,
      minimumRequirements,
      buffers,
      balanceSheetResults.consolidated.equity
    );
    
    // Return complete capital requirements structure
    return {
      // Consolidated results
      consolidated: {
        // Risk Weighted Assets
        rwaCreditRisk: rwaResults.credit,
        rwaOperationalRisk: rwaResults.operational,
        rwaMarketRisk: rwaResults.market,
        totalRWA: rwaResults.total,
        
        // Capital Ratios
        cet1Ratio: capitalRatios.cet1,
        tier1Ratio: capitalRatios.tier1,
        totalCapitalRatio: capitalRatios.total,
        
        // Requirements
        minimumCET1: minimumRequirements.cet1,
        minimumTier1: minimumRequirements.tier1,
        minimumTotal: minimumRequirements.total,
        
        // Buffers
        conservationBuffer: buffers.conservation,
        countercyclicalBuffer: buffers.countercyclical,
        systemicBuffer: buffers.systemic,
        totalBuffer: buffers.total,
        
        // Excess/Shortfall
        cet1Excess: excessShortfall.cet1,
        tier1Excess: excessShortfall.tier1,
        totalCapitalExcess: excessShortfall.total
      },
      
      // Quarterly data (simplified - same as annual)
      quarterly: {
        totalRWA: this.annualToQuarterly(rwaResults.total),
        cet1Ratio: this.annualToQuarterly(capitalRatios.cet1)
      },
      
      // Division breakdown
      byDivision: this.organizeDivisionCapital(
        balanceSheetResults,
        assumptions,
        years
      ),
      
      // Detailed breakdown
      details: {
        rwa: {
          byAssetClass: rwaResults.byAssetClass,
          byDivision: rwaResults.byDivision
        },
        capitalRatios,
        requirements: minimumRequirements,
        buffers
      }
    };
  },
  
  /**
   * Calculate total Risk Weighted Assets
   * @private
   */
  calculateTotalRWA(balanceSheetResults, assumptions, years) {
    const credit = new Array(10).fill(0);
    const operational = new Array(10).fill(0);
    const market = new Array(10).fill(0);
    const total = new Array(10).fill(0);
    const byDivision = {};
    
    // Credit Risk RWA
    years.forEach(year => {
      // Performing assets RWA
      const performingAssets = balanceSheetResults.consolidated.netPerformingAssets[year];
      const performingRWA = performingAssets * 0.75; // 75% avg risk weight
      
      // NPL RWA
      const nplAssets = balanceSheetResults.consolidated.nonPerformingAssets[year];
      const nplRWA = nplAssets * 1.5; // 150% risk weight
      
      credit[year] = performingRWA + nplRWA;
      
      // Operational Risk (simplified - 15% of gross income)
      operational[year] = balanceSheetResults.consolidated.totalAssets[year] * 0.1;
      
      // Market Risk (treasury only)
      market[year] = 50; // Placeholder
      
      // Total
      total[year] = credit[year] + operational[year] + market[year];
    });
    
    // Division breakdown
    ALL_DIVISION_PREFIXES.forEach(divKey => {
      const divisionAssets = balanceSheetResults.byDivision[divKey]?.annual || {};
      byDivision[divKey] = {
        credit: years.map(year => {
          const performing = divisionAssets.netPerformingAssets?.[year] || 0;
          const npl = divisionAssets.nonPerformingAssets?.[year] || 0;
          return performing * 0.75 + npl * 1.5;
        }),
        operational: years.map(year => 
          (divisionAssets.netPerformingAssets?.[year] || 0) * 0.1
        )
      };
    });
    
    return {
      credit,
      operational,
      market,
      total,
      byDivision,
      byAssetClass: {
        corporate: credit.map(c => c * 0.6),
        retail: credit.map(c => c * 0.3),
        realEstate: credit.map(c => c * 0.1)
      }
    };
  },
  
  /**
   * Calculate capital ratios
   * @private
   */
  calculateCapitalRatios(equity, totalRWA, years) {
    const cet1 = years.map((_, year) => 
      totalRWA[year] > 0 ? (equity[year] / totalRWA[year]) * 100 : 0
    );
    
    // Simplified - assume all equity is CET1
    const tier1 = cet1;
    const total = cet1;
    
    return { cet1, tier1, total };
  },
  
  /**
   * Calculate minimum capital requirements
   * @private
   */
  calculateMinimumRequirements(totalRWA, assumptions) {
    const pillar1Requirements = {
      cet1: 4.5,  // 4.5% minimum CET1
      tier1: 6.0, // 6% minimum Tier 1
      total: 8.0  // 8% minimum total capital
    };
    
    const pillar2Requirements = {
      cet1: 1.0,  // 1% P2R (simplified)
      tier1: 1.3,
      total: 1.8
    };
    
    return {
      cet1: totalRWA.map(rwa => rwa * (pillar1Requirements.cet1 + pillar2Requirements.cet1) / 100),
      tier1: totalRWA.map(rwa => rwa * (pillar1Requirements.tier1 + pillar2Requirements.tier1) / 100),
      total: totalRWA.map(rwa => rwa * (pillar1Requirements.total + pillar2Requirements.total) / 100),
      percentages: {
        cet1: pillar1Requirements.cet1 + pillar2Requirements.cet1,
        tier1: pillar1Requirements.tier1 + pillar2Requirements.tier1,
        total: pillar1Requirements.total + pillar2Requirements.total
      }
    };
  },
  
  /**
   * Calculate capital buffers
   * @private
   */
  calculateBuffers(totalRWA, assumptions) {
    const bufferRates = {
      conservation: 2.5,      // Capital conservation buffer
      countercyclical: 0.5,   // Countercyclical buffer (simplified)
      systemic: 0.0           // Not a systemic bank
    };
    
    const totalBufferRate = 
      bufferRates.conservation + 
      bufferRates.countercyclical + 
      bufferRates.systemic;
    
    return {
      conservation: totalRWA.map(rwa => rwa * bufferRates.conservation / 100),
      countercyclical: totalRWA.map(rwa => rwa * bufferRates.countercyclical / 100),
      systemic: totalRWA.map(rwa => rwa * bufferRates.systemic / 100),
      total: totalRWA.map(rwa => rwa * totalBufferRate / 100),
      rates: bufferRates
    };
  },
  
  /**
   * Calculate excess/shortfall vs requirements
   * @private
   */
  calculateExcessShortfall(capitalRatios, requirements, buffers, equity) {
    const totalRequirement = {
      cet1: requirements.cet1.map((req, i) => req + buffers.total[i]),
      tier1: requirements.tier1.map((req, i) => req + buffers.total[i]),
      total: requirements.total.map((req, i) => req + buffers.total[i])
    };
    
    return {
      cet1: equity.map((eq, i) => eq - totalRequirement.cet1[i]),
      tier1: equity.map((eq, i) => eq - totalRequirement.tier1[i]),
      total: equity.map((eq, i) => eq - totalRequirement.total[i])
    };
  },
  
  /**
   * Organize capital requirements by division
   * @private
   */
  organizeDivisionCapital(balanceSheetResults, assumptions, years) {
    const results = {};
    
    ALL_DIVISION_PREFIXES.forEach(divKey => {
      const divisionAssets = balanceSheetResults.byDivision[divKey]?.annual || {};
      
      // Calculate division RWA
      const rwaCreditRisk = years.map(year => {
        const performing = divisionAssets.netPerformingAssets?.[year] || 0;
        const npl = divisionAssets.nonPerformingAssets?.[year] || 0;
        return performing * 0.75 + npl * 1.5;
      });
      
      const rwaOperationalRisk = rwaCreditRisk.map(rwa => rwa * 0.2); // 20% of credit RWA
      
      const totalRWA = rwaCreditRisk.map((credit, i) => 
        credit + rwaOperationalRisk[i]
      );
      
      results[divKey] = {
        rwaCreditRisk,
        rwaOperationalRisk,
        rwaMarketRisk: new Array(10).fill(0),
        totalRWA
      };
    });
    
    return results;
  },
  
  /**
   * Convert annual to quarterly
   * @private
   */
  annualToQuarterly(annualData) {
    const quarterly = [];
    annualData.forEach(value => {
      for (let q = 0; q < 4; q++) {
        quarterly.push(value);
      }
    });
    return quarterly;
  }
};