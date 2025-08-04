/**
 * TechPnLOrchestrator
 * 
 * Orchestrates all P&L calculations specific to Tech division
 * Handles IT services revenue, cost allocation, operating costs, and exit scenarios
 */

// Revenue calculators
const TechServiceRevenueCalculator = require('./commission-income/TechServiceRevenueCalculator');
const TechAllocationRevenueCalculator = require('./commission-income/TechAllocationRevenueCalculator');

// Cost calculators
const TechOperatingCostsCalculator = require('./operating-costs/TechOperatingCostsCalculator');
const TechDepreciationCalculator = require('./operating-costs/TechDepreciationCalculator');

// Personnel calculator (using local Tech version)
const { PersonnelCalculator } = require('./personnel-calculators/personnelCalculator');

// Extraordinary items
const TechExitGainCalculator = require('./extraordinary-items/TechExitGainCalculator');


class TechPnLOrchestrator {
  constructor() {
    this.depreciationCalculator = new TechDepreciationCalculator();
  }
  
  /**
   * Calculate complete P&L for Tech division
   * @param {Object} assumptions - All divisions assumptions
   * @param {number} year - Current year (0-9)
   * @param {number} quarter - Current quarter (0-39)
   * @returns {Object} Complete P&L breakdown
   */
  calculate(assumptions, year, quarter) {
    const results = {
      // Revenue components
      externalServiceRevenue: {},
      internalAllocationRevenue: {},
      totalOperatingRevenue: 0,
      
      // Cost components
      operatingCosts: {},
      depreciation: {},
      personnelCosts: {},
      ftpExpense: {},
      totalOperatingCosts: 0,
      
      // Operating results
      ebitda: 0,
      ebit: 0,
      
      // Extraordinary items
      exitGain: {},
      earnOutReceipts: {},
      extraordinaryItems: 0,
      
      // Final results
      pbt: 0, // Profit before tax
      
      // Detailed breakdown
      breakdown: {},
      metrics: {}
    };
    
    const techAssumptions = assumptions.techDivision || {};
    
    // 1. Calculate external service revenue
    results.externalServiceRevenue = TechServiceRevenueCalculator.calculate(techAssumptions, year, quarter);
    
    // 2. Calculate operating costs first (needed for allocation revenue)
    results.operatingCosts = TechOperatingCostsCalculator.calculate(techAssumptions, year, quarter);
    results.depreciation = this.depreciationCalculator.calculate(techAssumptions, year, quarter);
    
    // 3. Prepare total IT costs for allocation
    const totalITCosts = {
      infrastructure: results.depreciation.infrastructureDepreciation * 4 + // Annualize for allocation
                      (results.operatingCosts.breakdown.infrastructure?.amount || 0) * 4,
      software: results.depreciation.softwareDepreciation * 4 +
                results.operatingCosts.softwareLicensesOpex * 4,
      development: results.depreciation.developmentDepreciation * 4,
      cloud: results.operatingCosts.cloudServices * 4,
      maintenance: results.operatingCosts.maintenanceSupport * 4
    };
    
    // 4. Calculate internal allocation revenue (with markup)
    results.internalAllocationRevenue = TechAllocationRevenueCalculator.calculate(
      assumptions, year, quarter, totalITCosts
    );
    
    // 5. Total operating revenue
    results.totalOperatingRevenue = 
      results.externalServiceRevenue.totalRevenue +
      results.internalAllocationRevenue.totalAllocationRevenue;
    
    // 6. Calculate personnel costs
    const personnelCalc = new PersonnelCalculator(
      techAssumptions,
      techAssumptions,
      [`Q${quarter + 1}`]
    );
    const personnelResults = personnelCalc.calculate();
    const quarterKey = `Q${quarter + 1}`;
    const personnelData = personnelResults[quarterKey] || { total: 0 };
    
    results.personnelCosts = {
      totalCost: personnelData.total ? personnelData.total.toNumber() : 0,
      breakdown: personnelData
    };
    
    // 7. Calculate FTP expense on funding needs
    const fundingNeeds = this.calculateFundingNeeds(results, techAssumptions, year);
    const ftpRate = assumptions.centralAssumptions?.ftpRate || 2.5;
    
    // For Tech division, we calculate FTP on the funding needs as a simple calculation
    results.ftpExpense = {
      total: (fundingNeeds * ftpRate / 100) / 4, // Quarterly FTP
      rate: ftpRate,
      base: fundingNeeds
    };
    
    // 8. Total operating costs (excluding depreciation for EBITDA)
    results.totalOperatingCosts = 
      results.operatingCosts.totalOperatingCosts +
      results.personnelCosts.totalCost +
      results.ftpExpense.total;
    
    // 9. EBITDA
    results.ebitda = results.totalOperatingRevenue - results.totalOperatingCosts;
    
    // 10. EBIT (after depreciation)
    results.ebit = results.ebitda - results.depreciation.totalDepreciation;
    
    // 11. Extraordinary items
    results.exitGain = TechExitGainCalculator.calculate(assumptions, year, quarter);
    results.earnOutReceipts = TechExitGainCalculator.calculateEarnOutReceipts(assumptions, year, quarter);
    
    results.extraordinaryItems = 
      results.exitGain.netGainLoss + 
      results.earnOutReceipts.earnOutReceipt;
    
    // 12. Profit before tax
    results.pbt = results.ebit + results.extraordinaryItems;
    
    // 13. Create detailed breakdown
    results.breakdown = {
      revenue: {
        external: {
          setupFees: results.externalServiceRevenue.setupFees,
          recurringFees: results.externalServiceRevenue.recurringFees,
          total: results.externalServiceRevenue.totalRevenue
        },
        internal: {
          allocationRevenue: results.internalAllocationRevenue.totalAllocationRevenue - 
                           results.internalAllocationRevenue.totalMarkupRevenue,
          markupRevenue: results.internalAllocationRevenue.totalMarkupRevenue,
          total: results.internalAllocationRevenue.totalAllocationRevenue
        },
        total: results.totalOperatingRevenue
      },
      costs: {
        operating: {
          cloud: results.operatingCosts.cloudServices,
          maintenance: results.operatingCosts.maintenanceSupport,
          softwareOpex: results.operatingCosts.softwareLicensesOpex,
          externalServices: results.operatingCosts.externalServiceCosts,
          total: results.operatingCosts.totalOperatingCosts
        },
        personnel: results.personnelCosts.totalCost,
        ftp: results.ftpExpense.total,
        depreciation: results.depreciation.totalDepreciation,
        total: results.totalOperatingCosts + results.depreciation.totalDepreciation
      },
      extraordinary: {
        exitGain: results.exitGain.netGainLoss,
        earnOut: results.earnOutReceipts.earnOutReceipt,
        total: results.extraordinaryItems
      }
    };
    
    // 14. Key metrics
    results.metrics = {
      revenueGrowthQoQ: 0, // Will be calculated separately to avoid recursion
      ebitdaMargin: results.totalOperatingRevenue > 0 ? 
        (results.ebitda / results.totalOperatingRevenue) * 100 : 0,
      ebitMargin: results.totalOperatingRevenue > 0 ? 
        (results.ebit / results.totalOperatingRevenue) * 100 : 0,
      costIncomeRatio: results.totalOperatingRevenue > 0 ? 
        ((results.totalOperatingCosts + results.depreciation.totalDepreciation) / results.totalOperatingRevenue) * 100 : 0,
      externalRevenueShare: results.totalOperatingRevenue > 0 ?
        (results.externalServiceRevenue.totalRevenue / results.totalOperatingRevenue) * 100 : 0
    };
    
    return results;
  }
  
  /**
   * Calculate funding needs for FTP
   */
  calculateFundingNeeds(results, assumptions, year) {
    // Simplified: funding needs = CAPEX investments
    const products = assumptions.products || {};
    let capexNeeds = 0;
    
    // Infrastructure CAPEX
    const infrastructureCosts = products.infrastructure?.costArray || [];
    capexNeeds += (infrastructureCosts[year] || 0) / 4;
    
    // Software CAPEX portion
    const softwareCosts = products.softwareLicenses?.costArray || [];
    const capexPercentage = (products.softwareLicenses?.capexPercentage || 40) / 100;
    capexNeeds += ((softwareCosts[year] || 0) * capexPercentage) / 4;
    
    // Development CAPEX
    const developmentCosts = products.developmentProjects?.costArray || [];
    capexNeeds += (developmentCosts[year] || 0) / 4;
    
    return capexNeeds;
  }
  
  
  /**
   * Calculate annual P&L
   */
  calculateAnnual(assumptions, year) {
    const annualResults = {
      externalServiceRevenue: 0,
      internalAllocationRevenue: 0,
      totalOperatingRevenue: 0,
      operatingCosts: 0,
      depreciation: 0,
      personnelCosts: 0,
      ftpExpense: 0,
      ebitda: 0,
      ebit: 0,
      extraordinaryItems: 0,
      pbt: 0,
      quarterlyBreakdown: []
    };
    
    // Calculate for each quarter
    for (let q = 0; q < 4; q++) {
      const quarterResults = this.calculate(assumptions, year, year * 4 + q);
      
      annualResults.externalServiceRevenue += quarterResults.externalServiceRevenue.totalRevenue;
      annualResults.internalAllocationRevenue += quarterResults.internalAllocationRevenue.totalAllocationRevenue;
      annualResults.totalOperatingRevenue += quarterResults.totalOperatingRevenue;
      annualResults.operatingCosts += quarterResults.operatingCosts.totalOperatingCosts;
      annualResults.depreciation += quarterResults.depreciation.totalDepreciation;
      annualResults.personnelCosts += quarterResults.personnelCosts.totalCost;
      annualResults.ftpExpense += quarterResults.ftpExpense.total;
      annualResults.ebitda += quarterResults.ebitda;
      annualResults.ebit += quarterResults.ebit;
      annualResults.extraordinaryItems += quarterResults.extraordinaryItems;
      annualResults.pbt += quarterResults.pbt;
      
      annualResults.quarterlyBreakdown.push(quarterResults);
    }
    
    // Annual metrics
    annualResults.metrics = {
      ebitdaMargin: annualResults.totalOperatingRevenue > 0 ? 
        (annualResults.ebitda / annualResults.totalOperatingRevenue) * 100 : 0,
      ebitMargin: annualResults.totalOperatingRevenue > 0 ? 
        (annualResults.ebit / annualResults.totalOperatingRevenue) * 100 : 0,
      yoyRevenueGrowth: 0 // Will be calculated separately to avoid recursion
    };
    
    return annualResults;
  }
}

module.exports = TechPnLOrchestrator;