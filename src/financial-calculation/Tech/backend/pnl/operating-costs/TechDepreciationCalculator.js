/**
 * TechDepreciationCalculator
 * 
 * Calculates depreciation for IT capital expenditures (CAPEX)
 * Handles different depreciation periods for various asset types
 */

class TechDepreciationCalculator {
  constructor() {
    // Track accumulated CAPEX by category and year for depreciation calculation
    this.capexHistory = {
      infrastructure: [],
      softwareCapex: [],
      development: []
    };
  }
  
  /**
   * Calculate depreciation for Tech division
   * @param {Object} assumptions - Tech division assumptions
   * @param {number} year - Current year (0-9)
   * @param {number} quarter - Current quarter (0-39)
   * @returns {Object} Depreciation breakdown
   */
  calculate(assumptions, year, quarter) {
    const results = {
      infrastructureDepreciation: 0,
      softwareDepreciation: 0,
      developmentDepreciation: 0,
      totalDepreciation: 0,
      breakdown: {},
      metrics: {
        totalCapexInForce: 0,
        avgRemainingLife: 0,
        newCapexThisYear: 0
      }
    };
    
    // Get product configurations
    const products = assumptions.products || {};
    
    // Process each CAPEX category
    // 1. Infrastructure & Hardware
    const infrastructureProduct = products.infrastructure || {};
    const infrastructureCosts = infrastructureProduct.costArray || [5, 8, 12, 15, 18, 20, 22, 24, 26, 28];
    const infrastructureDepreciationYears = infrastructureProduct.depreciationYears || 5;
    
    // 2. Software Licenses - CAPEX portion
    const softwareProduct = products.softwareLicenses || {};
    const softwareCosts = softwareProduct.costArray || [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const capexPercentage = (softwareProduct.capexPercentage || 40) / 100;
    const softwareDepreciationYears = softwareProduct.depreciationYears || 3;
    
    // 3. Development Projects
    const developmentProduct = products.developmentProjects || {};
    const developmentCosts = developmentProduct.costArray || [15, 25, 35, 40, 45, 50, 55, 60, 65, 70];
    const developmentDepreciationYears = developmentProduct.depreciationYears || 5;
    
    // Calculate depreciation for current quarter
    // Infrastructure depreciation
    for (let investmentYear = 0; investmentYear <= year; investmentYear++) {
      const yearsSinceInvestment = year - investmentYear;
      if (yearsSinceInvestment < infrastructureDepreciationYears) {
        const annualCapex = infrastructureCosts[investmentYear] || 0;
        const annualDepreciation = annualCapex / infrastructureDepreciationYears;
        const quarterlyDepreciation = annualDepreciation / 4;
        
        results.infrastructureDepreciation += quarterlyDepreciation;
        
        // Track for metrics
        if (yearsSinceInvestment === 0 && quarter < 4) {
          results.metrics.newCapexThisYear += annualCapex;
        }
        results.metrics.totalCapexInForce += annualCapex * 
          (infrastructureDepreciationYears - yearsSinceInvestment) / infrastructureDepreciationYears;
      }
    }
    
    // Software depreciation (CAPEX portion only)
    for (let investmentYear = 0; investmentYear <= year; investmentYear++) {
      const yearsSinceInvestment = year - investmentYear;
      if (yearsSinceInvestment < softwareDepreciationYears) {
        const annualCapex = (softwareCosts[investmentYear] || 0) * capexPercentage;
        const annualDepreciation = annualCapex / softwareDepreciationYears;
        const quarterlyDepreciation = annualDepreciation / 4;
        
        results.softwareDepreciation += quarterlyDepreciation;
        
        if (yearsSinceInvestment === 0 && quarter < 4) {
          results.metrics.newCapexThisYear += annualCapex;
        }
        results.metrics.totalCapexInForce += annualCapex * 
          (softwareDepreciationYears - yearsSinceInvestment) / softwareDepreciationYears;
      }
    }
    
    // Development depreciation
    for (let investmentYear = 0; investmentYear <= year; investmentYear++) {
      const yearsSinceInvestment = year - investmentYear;
      if (yearsSinceInvestment < developmentDepreciationYears) {
        const annualCapex = developmentCosts[investmentYear] || 0;
        const annualDepreciation = annualCapex / developmentDepreciationYears;
        const quarterlyDepreciation = annualDepreciation / 4;
        
        results.developmentDepreciation += quarterlyDepreciation;
        
        if (yearsSinceInvestment === 0 && quarter < 4) {
          results.metrics.newCapexThisYear += annualCapex;
        }
        results.metrics.totalCapexInForce += annualCapex * 
          (developmentDepreciationYears - yearsSinceInvestment) / developmentDepreciationYears;
      }
    }
    
    // Total depreciation
    results.totalDepreciation = 
      results.infrastructureDepreciation + 
      results.softwareDepreciation + 
      results.developmentDepreciation;
    
    // Create detailed breakdown
    results.breakdown = {
      infrastructure: {
        quarterlyDepreciation: results.infrastructureDepreciation,
        depreciationYears: infrastructureDepreciationYears,
        depreciationMethod: 'Straight-line'
      },
      software: {
        quarterlyDepreciation: results.softwareDepreciation,
        depreciationYears: softwareDepreciationYears,
        depreciationMethod: 'Straight-line',
        note: `Based on ${capexPercentage * 100}% CAPEX portion`
      },
      development: {
        quarterlyDepreciation: results.developmentDepreciation,
        depreciationYears: developmentDepreciationYears,
        depreciationMethod: 'Straight-line'
      }
    };
    
    // Calculate average remaining life
    if (results.totalDepreciation > 0) {
      const weightedLife = 
        (results.infrastructureDepreciation * infrastructureDepreciationYears +
         results.softwareDepreciation * softwareDepreciationYears +
         results.developmentDepreciation * developmentDepreciationYears) / 
        results.totalDepreciation;
      results.metrics.avgRemainingLife = weightedLife / 2; // Approximate average
    }
    
    return results;
  }
  
  /**
   * Calculate annual depreciation
   */
  calculateAnnual(assumptions, year) {
    const annualResults = {
      infrastructureDepreciation: 0,
      softwareDepreciation: 0,
      developmentDepreciation: 0,
      totalDepreciation: 0,
      quarterlyBreakdown: []
    };
    
    // Calculate for each quarter
    for (let q = 0; q < 4; q++) {
      const quarterResults = this.calculate(assumptions, year, year * 4 + q);
      
      annualResults.infrastructureDepreciation += quarterResults.infrastructureDepreciation;
      annualResults.softwareDepreciation += quarterResults.softwareDepreciation;
      annualResults.developmentDepreciation += quarterResults.developmentDepreciation;
      annualResults.totalDepreciation += quarterResults.totalDepreciation;
      
      annualResults.quarterlyBreakdown.push(quarterResults);
    }
    
    // Get annual metrics from Q4
    annualResults.metrics = annualResults.quarterlyBreakdown[3].metrics;
    
    return annualResults;
  }
  
  /**
   * Get net book value of IT assets
   */
  getNetBookValue(assumptions, year) {
    const products = assumptions.products || {};
    let grossBookValue = 0;
    let accumulatedDepreciation = 0;
    
    // Calculate gross book value and accumulated depreciation
    const categories = [
      { 
        key: 'infrastructure', 
        costs: products.infrastructure?.costArray || [5, 8, 12, 15, 18, 20, 22, 24, 26, 28],
        years: products.infrastructure?.depreciationYears || 5,
        capexRatio: 1
      },
      { 
        key: 'software', 
        costs: products.softwareLicenses?.costArray || [10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
        years: products.softwareLicenses?.depreciationYears || 3,
        capexRatio: (products.softwareLicenses?.capexPercentage || 40) / 100
      },
      { 
        key: 'development', 
        costs: products.developmentProjects?.costArray || [15, 25, 35, 40, 45, 50, 55, 60, 65, 70],
        years: products.developmentProjects?.depreciationYears || 5,
        capexRatio: 1
      }
    ];
    
    categories.forEach(category => {
      for (let investmentYear = 0; investmentYear <= year; investmentYear++) {
        const yearsSinceInvestment = year - investmentYear;
        const annualCapex = (category.costs[investmentYear] || 0) * category.capexRatio;
        
        grossBookValue += annualCapex;
        
        if (yearsSinceInvestment < category.years) {
          accumulatedDepreciation += annualCapex * (yearsSinceInvestment + 1) / category.years;
        } else {
          accumulatedDepreciation += annualCapex; // Fully depreciated
        }
      }
    });
    
    return {
      grossBookValue,
      accumulatedDepreciation,
      netBookValue: grossBookValue - accumulatedDepreciation
    };
  }
}

module.exports = TechDepreciationCalculator;