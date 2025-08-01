/**
 * KPI Calculator
 * 
 * Calculates Key Performance Indicators from financial results
 * Combines Balance Sheet, P&L and Capital Requirements data
 */

import { ALL_DIVISION_PREFIXES } from '../divisionMappings.js';

/**
 * Main KPI calculation - static method for clean interface
 */
export const KPICalculator = {
  /**
   * Calculate complete KPIs
   * @param {Object} balanceSheetResults - Balance sheet results
   * @param {Object} pnlResults - P&L results
   * @param {Object} capitalResults - Capital requirements results
   * @param {Object} assumptions - Complete assumptions
   * @returns {Object} KPI results
   */
  calculate(balanceSheetResults, pnlResults, capitalResults, assumptions) {
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Profitability KPIs
    const profitabilityKPIs = this.calculateProfitabilityKPIs(
      balanceSheetResults,
      pnlResults,
      years
    );
    
    // Efficiency KPIs
    const efficiencyKPIs = this.calculateEfficiencyKPIs(
      pnlResults,
      years
    );
    
    // Asset Quality KPIs
    const assetQualityKPIs = this.calculateAssetQualityKPIs(
      balanceSheetResults,
      pnlResults,
      years
    );
    
    // Capital KPIs
    const capitalKPIs = this.calculateCapitalKPIs(
      capitalResults,
      years
    );
    
    // Liquidity KPIs
    const liquidityKPIs = this.calculateLiquidityKPIs(
      balanceSheetResults,
      years
    );
    
    // Business KPIs
    const businessKPIs = this.calculateBusinessKPIs(
      balanceSheetResults,
      pnlResults,
      assumptions,
      years
    );
    
    // Return complete KPI structure
    return {
      // Consolidated KPIs
      consolidated: {
        // Profitability
        roe: profitabilityKPIs.roe,
        roa: profitabilityKPIs.roa,
        nim: profitabilityKPIs.nim,
        
        // Efficiency
        costIncomeRatio: efficiencyKPIs.costIncomeRatio,
        costAssets: efficiencyKPIs.costAssets,
        
        // Asset Quality
        nplRatio: assetQualityKPIs.nplRatio,
        coverageRatio: assetQualityKPIs.coverageRatio,
        costOfRisk: assetQualityKPIs.costOfRisk,
        
        // Capital
        cet1Ratio: capitalKPIs.cet1Ratio,
        leverageRatio: capitalKPIs.leverageRatio,
        
        // Liquidity
        lcrRatio: liquidityKPIs.lcrRatio,
        loanDepositRatio: liquidityKPIs.loanDepositRatio,
        
        // Business
        newBusinessVolumes: businessKPIs.newBusinessVolumes,
        avgLoanYield: businessKPIs.avgLoanYield,
        avgDepositCost: businessKPIs.avgDepositCost,
        headcount: businessKPIs.headcount
      },
      
      // Quarterly KPIs
      quarterly: {
        roe: this.annualToQuarterly(profitabilityKPIs.roe),
        nplRatio: this.annualToQuarterly(assetQualityKPIs.nplRatio),
        cet1Ratio: capitalResults.quarterly.cet1Ratio
      },
      
      // Division breakdown
      byDivision: this.organizeDivisionKPIs(
        balanceSheetResults,
        pnlResults,
        capitalResults,
        assumptions,
        years
      ),
      
      // Detailed components
      details: {
        profitability: profitabilityKPIs,
        efficiency: efficiencyKPIs,
        assetQuality: assetQualityKPIs,
        capital: capitalKPIs,
        liquidity: liquidityKPIs,
        business: businessKPIs
      }
    };
  },
  
  /**
   * Calculate profitability KPIs
   * @private
   */
  calculateProfitabilityKPIs(balanceSheet, pnl, years) {
    const roe = years.map((_, year) => {
      const netProfit = pnl.consolidated.netProfit[year];
      const avgEquity = this.getAverage(
        balanceSheet.consolidated.equity[year],
        balanceSheet.consolidated.equity[Math.max(0, year - 1)]
      );
      return avgEquity > 0 ? (netProfit / avgEquity) * 100 : 0;
    });
    
    const roa = years.map((_, year) => {
      const netProfit = pnl.consolidated.netProfit[year];
      const avgAssets = this.getAverage(
        balanceSheet.consolidated.totalAssets[year],
        balanceSheet.consolidated.totalAssets[Math.max(0, year - 1)]
      );
      return avgAssets > 0 ? (netProfit / avgAssets) * 100 : 0;
    });
    
    const nim = years.map((_, year) => {
      const nii = pnl.consolidated.netInterestIncome[year];
      const avgEarningAssets = this.getAverage(
        balanceSheet.consolidated.netPerformingAssets[year],
        balanceSheet.consolidated.netPerformingAssets[Math.max(0, year - 1)]
      );
      return avgEarningAssets > 0 ? (nii / avgEarningAssets) * 100 : 0;
    });
    
    return { roe, roa, nim };
  },
  
  /**
   * Calculate efficiency KPIs
   * @private
   */
  calculateEfficiencyKPIs(pnl, years) {
    const costIncomeRatio = years.map((_, year) => {
      const opex = Math.abs(pnl.consolidated.totalOpex[year]);
      const revenues = pnl.consolidated.totalRevenues[year];
      return revenues > 0 ? (opex / revenues) * 100 : 0;
    });
    
    const costAssets = years.map((_, year) => {
      const opex = Math.abs(pnl.consolidated.totalOpex[year]);
      return opex; // Simplified - should divide by avg assets
    });
    
    return { costIncomeRatio, costAssets };
  },
  
  /**
   * Calculate asset quality KPIs
   * @private
   */
  calculateAssetQualityKPIs(balanceSheet, pnl, years) {
    const nplRatio = years.map((_, year) => {
      const npl = balanceSheet.consolidated.nonPerformingAssets[year];
      const performing = balanceSheet.consolidated.netPerformingAssets[year];
      const total = npl + performing;
      return total > 0 ? (npl / total) * 100 : 0;
    });
    
    const coverageRatio = years.map((_, year) => {
      // Simplified - would need gross NPL and provisions
      return 60; // Placeholder
    });
    
    const costOfRisk = years.map((_, year) => {
      const llp = Math.abs(pnl.consolidated.totalLLP[year]);
      const avgLoans = this.getAverage(
        balanceSheet.consolidated.netPerformingAssets[year],
        balanceSheet.consolidated.netPerformingAssets[Math.max(0, year - 1)]
      );
      return avgLoans > 0 ? (llp / avgLoans) * 10000 : 0; // Basis points
    });
    
    return { nplRatio, coverageRatio, costOfRisk };
  },
  
  /**
   * Calculate capital KPIs
   * @private
   */
  calculateCapitalKPIs(capitalResults, years) {
    const cet1Ratio = capitalResults.consolidated.cet1Ratio;
    
    const leverageRatio = years.map((_, year) => {
      // Simplified leverage ratio
      return 5.0 + year * 0.1;
    });
    
    return { cet1Ratio, leverageRatio };
  },
  
  /**
   * Calculate liquidity KPIs
   * @private
   */
  calculateLiquidityKPIs(balanceSheet, years) {
    const lcrRatio = years.map(() => 120); // Placeholder
    
    const loanDepositRatio = years.map((_, year) => {
      const loans = balanceSheet.consolidated.netPerformingAssets[year];
      const deposits = balanceSheet.consolidated.customerDeposits[year];
      return deposits > 0 ? (loans / deposits) * 100 : 0;
    });
    
    return { lcrRatio, loanDepositRatio };
  },
  
  /**
   * Calculate business KPIs
   * @private
   */
  calculateBusinessKPIs(balanceSheet, pnl, assumptions, years) {
    // New business volumes
    const newBusinessVolumes = years.map((_, year) => {
      let totalVolume = 0;
      Object.values(balanceSheet.productResults || {}).forEach(product => {
        if (product.originalProduct?.volumeArray) {
          totalVolume += product.originalProduct.volumeArray[year] || 0;
        }
      });
      return totalVolume;
    });
    
    // Average loan yield
    const avgLoanYield = years.map((_, year) => {
      const interestIncome = pnl.consolidated.interestIncome[year];
      const avgLoans = this.getAverage(
        balanceSheet.consolidated.netPerformingAssets[year],
        balanceSheet.consolidated.netPerformingAssets[Math.max(0, year - 1)]
      );
      return avgLoans > 0 ? (interestIncome / avgLoans) * 100 : 0;
    });
    
    // Average deposit cost
    const avgDepositCost = years.map((_, year) => {
      const interestExpense = Math.abs(pnl.consolidated.interestExpenses[year]);
      const avgDeposits = this.getAverage(
        balanceSheet.consolidated.customerDeposits[year],
        balanceSheet.consolidated.customerDeposits[Math.max(0, year - 1)]
      );
      return avgDeposits > 0 ? (interestExpense / avgDeposits) * 100 : 0;
    });
    
    // Headcount
    const headcount = years.map((_, year) => {
      let totalFTE = 0;
      if (pnl.personnelDetail) {
        Object.values(pnl.personnelDetail).forEach(dept => {
          if (dept.headcount) {
            totalFTE += dept.headcount[year] || 0;
          }
        });
      }
      return totalFTE;
    });
    
    return {
      newBusinessVolumes,
      avgLoanYield,
      avgDepositCost,
      headcount
    };
  },
  
  /**
   * Organize KPIs by division
   * @private
   */
  organizeDivisionKPIs(balanceSheet, pnl, capital, assumptions, years) {
    const results = {};
    
    ALL_DIVISION_PREFIXES.forEach(divKey => {
      const divBS = balanceSheet.byDivision[divKey];
      const divPnL = pnl.byDivision[divKey];
      const divCapital = capital.byDivision[divKey];
      
      if (!divBS || !divPnL) {
        results[divKey] = this.getEmptyDivisionKPIs();
        return;
      }
      
      // ROE (division level)
      const roe = years.map((_, year) => {
        const netProfit = divPnL.netProfit?.[year] || 0;
        const allocatedEquity = 100; // Simplified allocation
        return allocatedEquity > 0 ? (netProfit / allocatedEquity) * 100 : 0;
      });
      
      // NPL Ratio (division level)
      const nplRatio = years.map((_, year) => {
        const npl = divBS.annual?.nonPerformingAssets?.[year] || 0;
        const performing = divBS.annual?.netPerformingAssets?.[year] || 0;
        const total = npl + performing;
        return total > 0 ? (npl / total) * 100 : 0;
      });
      
      // Cost Income Ratio (division level)
      const costIncomeRatio = years.map((_, year) => {
        const opex = Math.abs(divPnL.totalOpex?.[year] || 0);
        const revenues = divPnL.totalRevenues?.[year] || 0;
        return revenues > 0 ? (opex / revenues) * 100 : 0;
      });
      
      // Headcount (division level)
      const headcount = years.map((_, year) => {
        // Would need division personnel data
        return 10 + year; // Placeholder
      });
      
      results[divKey] = {
        roe,
        nplRatio,
        costIncomeRatio,
        headcount,
        revenues: divPnL.totalRevenues || new Array(10).fill(0),
        netProfit: divPnL.netProfit || new Array(10).fill(0)
      };
    });
    
    return results;
  },
  
  /**
   * Get empty division KPIs structure
   * @private
   */
  getEmptyDivisionKPIs() {
    return {
      roe: new Array(10).fill(0),
      nplRatio: new Array(10).fill(0),
      costIncomeRatio: new Array(10).fill(0),
      headcount: new Array(10).fill(0),
      revenues: new Array(10).fill(0),
      netProfit: new Array(10).fill(0)
    };
  },
  
  /**
   * Calculate average of two values
   * @private
   */
  getAverage(current, previous) {
    return (current + previous) / 2;
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