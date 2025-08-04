/**
 * TechExitGainCalculator
 * 
 * Calculates gains/losses from the partial or full exit of Tech division
 * Handles unamortized assets, sale proceeds, and retained stake accounting
 */

const TechDepreciationCalculator = require('../operating-costs/TechDepreciationCalculator');

class TechExitGainCalculator {
  /**
   * Calculate exit gains/losses for Tech division
   * @param {Object} assumptions - All divisions assumptions
   * @param {number} year - Current year (0-9)
   * @param {number} quarter - Current quarter (0-39)
   * @returns {Object} Exit gains/losses breakdown
   */
  static calculate(assumptions, year, quarter) {
    const results = {
      saleProceeds: 0,
      bookValueSold: 0,
      grossGain: 0,
      unamortizedAssetImpact: 0,
      netGainLoss: 0,
      earnOutReceivable: 0,
      retainedStakeValue: 0,
      isExitYear: false,
      breakdown: {},
      metrics: {}
    };
    
    // Get exit configuration
    const exitConfig = assumptions.products?.divisionExit || {};
    const exitYear = exitConfig.exitYear || 0;
    
    // Check if this is the exit year and quarter (assume Q4 for exit)
    const exitQuarter = exitYear * 4 + 3; // Q4 of exit year
    if (exitYear === 0 || quarter !== exitQuarter) {
      return results; // No exit or not the exit quarter
    }
    
    results.isExitYear = true;
    
    // Get exit parameters
    const exitPercentage = (exitConfig.exitPercentage || 40) / 100;
    const valuationMultiple = exitConfig.valuationMultiple || 2.5;
    const unamortizedTreatment = exitConfig.unamortizedAssetTreatment || 'transfer';
    
    // Calculate division revenue for valuation
    const divisionRevenue = this.calculateDivisionRevenue(assumptions, year);
    
    // Calculate total valuation and sale proceeds
    const totalValuation = divisionRevenue * valuationMultiple;
    const grossSalePrice = totalValuation * exitPercentage;
    
    // 100% immediate cash payment - no earn-out
    results.saleProceeds = grossSalePrice;
    results.earnOutReceivable = 0;
    
    // Calculate book value of assets being sold
    const depreciationCalc = new TechDepreciationCalculator();
    const assetValues = depreciationCalc.getNetBookValue(assumptions, year);
    results.bookValueSold = assetValues.netBookValue * exitPercentage;
    
    // Handle unamortized assets based on treatment
    if (unamortizedTreatment === 'accelerate') {
      // Accelerated depreciation - recognize immediately
      results.unamortizedAssetImpact = -results.bookValueSold; // Negative impact
    } else if (unamortizedTreatment === 'transfer') {
      // Transfer to buyer - reduce sale proceeds
      results.saleProceeds -= results.bookValueSold;
      results.unamortizedAssetImpact = 0;
    } else if (unamortizedTreatment === 'writeoff') {
      // Write off as extraordinary loss
      results.unamortizedAssetImpact = -results.bookValueSold;
    }
    
    // Calculate gross gain
    results.grossGain = results.saleProceeds - results.bookValueSold;
    
    // Net gain/loss including unamortized asset impact
    results.netGainLoss = results.grossGain + results.unamortizedAssetImpact;
    
    // Value of retained stake
    results.retainedStakeValue = totalValuation * (1 - exitPercentage);
    
    // Detailed breakdown
    results.breakdown = {
      valuation: {
        annualRevenue: divisionRevenue,
        multiple: valuationMultiple,
        totalValuation: totalValuation,
        exitPercentage: exitPercentage * 100,
        saleValuation: grossSalePrice
      },
      proceeds: {
        immediate: grossSalePrice,
        earnOut: 0,
        earnOutYears: 0,
        total: grossSalePrice
      },
      assetImpact: {
        netBookValue: assetValues.netBookValue,
        soldPortion: results.bookValueSold,
        treatment: unamortizedTreatment,
        impact: results.unamortizedAssetImpact
      },
      retained: {
        percentage: (1 - exitPercentage) * 100,
        value: results.retainedStakeValue,
        continueOperations: exitConfig.retainedStakeRevenue || true
      }
    };
    
    // Metrics
    results.metrics = {
      impliedEVRevenue: valuationMultiple,
      gainAsPercentOfRevenue: (results.netGainLoss / divisionRevenue) * 100,
      returnOnAssets: (results.netGainLoss / assetValues.grossBookValue) * 100
    };
    
    return results;
  }
  
  /**
   * Calculate division revenue for valuation purposes
   */
  static calculateDivisionRevenue(assumptions, year) {
    // Calculate revenue based on post-exit contract model
    // After exit, the Tech company is valued based on its contracted revenues only
    
    const postExitServices = assumptions.products?.postExitServices || {};
    const totalClientsArray = postExitServices.totalClientsArray || [0, 0, 0, 0, 0, 1, 2, 4, 7, 10];
    const annualFeePerClient = postExitServices.annualFeePerClient || 50.0;
    const annualGrowthRate = (postExitServices.annualGrowthRate || 3) / 100;
    
    // Get exit year to calculate growth
    const exitConfig = assumptions.products?.divisionExit || {};
    const exitYear = exitConfig.exitYear || 5;
    
    // Calculate total clients for the year
    const totalClients = totalClientsArray[year] || 0;
    
    // Apply growth rate from exit year
    const yearsFromExit = Math.max(0, year - exitYear);
    const adjustedAnnualFee = annualFeePerClient * Math.pow(1 + annualGrowthRate, yearsFromExit);
    
    // Total contracted revenue (all clients × fee with growth)
    const contractedRevenue = totalClients * adjustedAnnualFee;
    
    // For valuation purposes, we use the contracted revenue model
    // This represents the recurring revenue stream that buyers would value
    return contractedRevenue;
  }
  
  
  /**
   * Calculate earn-out receipts in years following exit
   * NOTE: Earn-out mechanism removed - all payments are immediate at closing
   */
  static calculateEarnOutReceipts(assumptions, year, quarter) {
    // No earn-out - all payments made at closing
    return {
      earnOutReceipt: 0,
      remainingEarnOut: 0,
      isEarnOutPeriod: false
    };
  }
  
  /**
   * Calculate annual exit impact
   */
  static calculateAnnual(assumptions, year) {
    const annualResults = {
      saleProceeds: 0,
      bookValueSold: 0,
      grossGain: 0,
      unamortizedAssetImpact: 0,
      netGainLoss: 0,
      earnOutReceivable: 0,
      earnOutReceipts: 0,
      retainedStakeValue: 0,
      isExitYear: false,
      isEarnOutYear: false
    };
    
    // Check all quarters for exit
    for (let q = 0; q < 4; q++) {
      const quarterResults = this.calculate(assumptions, year, year * 4 + q);
      
      if (quarterResults.isExitYear) {
        annualResults.isExitYear = true;
        annualResults.saleProceeds = quarterResults.saleProceeds;
        annualResults.bookValueSold = quarterResults.bookValueSold;
        annualResults.grossGain = quarterResults.grossGain;
        annualResults.unamortizedAssetImpact = quarterResults.unamortizedAssetImpact;
        annualResults.netGainLoss = quarterResults.netGainLoss;
        annualResults.earnOutReceivable = quarterResults.earnOutReceivable;
        annualResults.retainedStakeValue = quarterResults.retainedStakeValue;
      }
      
      // Also check for earn-out receipts
      const earnOutResults = this.calculateEarnOutReceipts(assumptions, year, year * 4 + q);
      annualResults.earnOutReceipts += earnOutResults.earnOutReceipt;
      if (earnOutResults.isEarnOutPeriod) {
        annualResults.isEarnOutYear = true;
      }
    }
    
    return annualResults;
  }
}

module.exports = TechExitGainCalculator;