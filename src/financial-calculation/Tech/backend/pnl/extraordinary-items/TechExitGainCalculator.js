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
    const earnOutPercentage = (exitConfig.earnOutPercentage || 20) / 100;
    const earnOutYears = exitConfig.earnOutYears || 3;
    const unamortizedTreatment = exitConfig.unamortizedAssetTreatment || 'accelerate';
    
    // Calculate division revenue for valuation
    const divisionRevenue = this.calculateDivisionRevenue(assumptions, year);
    
    // Calculate total valuation and sale proceeds
    const totalValuation = divisionRevenue * valuationMultiple;
    const grossSalePrice = totalValuation * exitPercentage;
    
    // Split between immediate cash and earn-out
    const immediateProceeds = grossSalePrice * (1 - earnOutPercentage);
    const earnOutAmount = grossSalePrice * earnOutPercentage;
    
    results.saleProceeds = immediateProceeds;
    results.earnOutReceivable = earnOutAmount;
    
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
        immediate: immediateProceeds,
        earnOut: earnOutAmount,
        earnOutYears: earnOutYears,
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
    // This would typically call other revenue calculators
    // For now, estimate based on external revenue and allocation markup
    
    const externalClients = assumptions.products?.externalClients || {};
    const clientsArray = externalClients.clientsArray || [0, 0, 2, 5, 10, 15, 20, 25, 30, 35];
    const annualFeePerClient = externalClients.annualFeePerClient || 2.0;
    const clients = clientsArray[year] || 0;
    
    const externalRevenue = clients * annualFeePerClient;
    
    // Estimate internal allocation revenue (simplified)
    // In production, this would call TechAllocationRevenueCalculator
    const totalITCosts = this.estimateTotalITCosts(assumptions, year);
    const avgMarkup = 0.15; // 15% average markup
    const allocationRevenue = totalITCosts * (1 + avgMarkup);
    
    return externalRevenue + allocationRevenue;
  }
  
  /**
   * Estimate total IT costs for revenue calculation
   */
  static estimateTotalITCosts(assumptions, year) {
    const products = assumptions.products || {};
    let total = 0;
    
    ['infrastructure', 'softwareLicenses', 'developmentProjects', 'cloudServices', 'maintenanceSupport'].forEach(key => {
      const product = products[key] || {};
      const costs = product.costArray || [];
      total += costs[year] || 0;
    });
    
    return total;
  }
  
  /**
   * Calculate earn-out receipts in years following exit
   */
  static calculateEarnOutReceipts(assumptions, year, quarter) {
    const results = {
      earnOutReceipt: 0,
      remainingEarnOut: 0,
      isEarnOutPeriod: false
    };
    
    const exitConfig = assumptions.products?.divisionExit || {};
    const exitYear = exitConfig.exitYear || 0;
    
    if (exitYear === 0) return results;
    
    const yearsAfterExit = year - exitYear;
    const earnOutYears = exitConfig.earnOutYears || 3;
    
    // Check if we're in earn-out period
    if (yearsAfterExit > 0 && yearsAfterExit <= earnOutYears) {
      results.isEarnOutPeriod = true;
      
      // Calculate total earn-out amount
      const divisionRevenue = this.calculateDivisionRevenue(assumptions, exitYear);
      const totalValuation = divisionRevenue * (exitConfig.valuationMultiple || 2.5);
      const salePrice = totalValuation * ((exitConfig.exitPercentage || 40) / 100);
      const totalEarnOut = salePrice * ((exitConfig.earnOutPercentage || 20) / 100);
      
      // Annual earn-out payment
      const annualEarnOut = totalEarnOut / earnOutYears;
      results.earnOutReceipt = annualEarnOut / 4; // Quarterly amount
      
      // Remaining earn-out
      const receivedYears = yearsAfterExit - 1;
      results.remainingEarnOut = totalEarnOut - (annualEarnOut * receivedYears);
    }
    
    return results;
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