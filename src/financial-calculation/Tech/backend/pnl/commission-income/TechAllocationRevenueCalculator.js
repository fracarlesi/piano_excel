/**
 * TechAllocationRevenueCalculator
 * 
 * Calculates revenue from internal cost allocation to other divisions
 * Applies markup on IT costs before allocation
 */

const { techAllocationKeys } = require('../../../../../assumptions-views/Tech/backend/products');

class TechAllocationRevenueCalculator {
  /**
   * Calculate internal allocation revenues
   * @param {Object} assumptions - All divisions assumptions
   * @param {number} year - Current year (0-9)
   * @param {number} quarter - Current quarter (0-39)
   * @param {Object} totalITCosts - Total IT costs to allocate (from other calculators)
   * @returns {Object} Revenue breakdown by division
   */
  static calculate(assumptions, year, quarter, totalITCosts) {
    const results = {
      allocationByDivision: {},
      totalAllocationRevenue: 0,
      totalMarkupRevenue: 0,
      metrics: {
        totalCostsToAllocate: 0,
        avgMarkupPercentage: 0,
        divisionsServed: 0
      }
    };
    
    // Get Tech products for markup percentages from assumptions (user-modified values)
    const techProducts = assumptions.products || {};
    
    // Debug: log what products we're using
    console.log('Tech products from assumptions:', {
      infrastructure: techProducts.infrastructure?.markupPercentage,
      software: techProducts.softwareLicenses?.markupPercentage,
      cloud: techProducts.cloudServices?.markupPercentage
    });
    
    // Calculate total costs by category and their markups
    const costsByCategory = {
      infrastructure: totalITCosts.infrastructure || 0,
      software: totalITCosts.software || 0,
      development: totalITCosts.development || 0,
      cloud: totalITCosts.cloud || 0,
      maintenance: totalITCosts.maintenance || 0
    };
    
    // Get allocation keys from assumptions or defaults
    const allocationKeys = assumptions.techAllocationKeys || techAllocationKeys;
    
    // Process each cost category
    Object.entries(costsByCategory).forEach(([category, cost]) => {
      if (cost <= 0) return;
      
      // Get the product configuration for this category
      const productKey = this.getCategoryProductKey(category);
      const product = techProducts[productKey] || {};
      
      // Get allocation method and markup
      const allocationMethod = product.allocationMethod || 'usage';
      const markupPercentage = (product.markupPercentage !== undefined ? product.markupPercentage : 10) / 100;
      
      // Debug log
      if (category === 'infrastructure' || category === 'software') {
        console.log(`Tech ${category} - Markup %:`, product.markupPercentage, '-> decimal:', markupPercentage);
      }
      
      // Get allocation percentages for this method
      const allocations = allocationKeys[allocationMethod] || allocationKeys.usage;
      
      // Allocate to each division
      Object.entries(allocations).forEach(([division, percentage]) => {
        if (percentage <= 0) return;
        
        const allocationPercentage = percentage / 100;
        const allocatedCost = cost * allocationPercentage;
        const markup = allocatedCost * markupPercentage;
        const totalCharge = allocatedCost + markup;
        
        // Initialize division if needed
        if (!results.allocationByDivision[division]) {
          results.allocationByDivision[division] = {
            allocatedCosts: 0,
            markupAmount: 0,
            totalCharge: 0,
            breakdown: {}
          };
        }
        
        // Add to division totals
        results.allocationByDivision[division].allocatedCosts += allocatedCost;
        results.allocationByDivision[division].markupAmount += markup;
        results.allocationByDivision[division].totalCharge += totalCharge;
        
        // Add category breakdown
        results.allocationByDivision[division].breakdown[category] = {
          cost: allocatedCost,
          markup: markup,
          total: totalCharge,
          markupPercentage: markupPercentage * 100
        };
        
        // Add to totals
        results.totalAllocationRevenue += totalCharge;
        results.totalMarkupRevenue += markup;
      });
    });
    
    // Calculate metrics
    const totalCosts = Object.values(costsByCategory).reduce((sum, cost) => sum + cost, 0);
    results.metrics.totalCostsToAllocate = totalCosts;
    results.metrics.avgMarkupPercentage = totalCosts > 0 ? 
      (results.totalMarkupRevenue / totalCosts) * 100 : 0;
    results.metrics.divisionsServed = Object.keys(results.allocationByDivision).length;
    
    return results;
  }
  
  /**
   * Map category name to product key
   */
  static getCategoryProductKey(category) {
    const mapping = {
      infrastructure: 'infrastructure',
      software: 'softwareLicenses',
      development: 'developmentProjects',
      cloud: 'cloudServices',
      maintenance: 'maintenanceSupport'
    };
    return mapping[category] || category;
  }
  
  /**
   * Calculate annual allocation summary
   */
  static calculateAnnual(assumptions, year, annualITCosts) {
    const annualResults = {
      allocationByDivision: {},
      totalAllocationRevenue: 0,
      totalMarkupRevenue: 0,
      quarterlyBreakdown: []
    };
    
    // Calculate for each quarter
    for (let q = 0; q < 4; q++) {
      // Divide annual costs by 4 for quarterly
      const quarterlyCosts = {};
      Object.entries(annualITCosts).forEach(([key, value]) => {
        quarterlyCosts[key] = value / 4;
      });
      
      const quarterResults = this.calculate(assumptions, year, year * 4 + q, quarterlyCosts);
      
      // Aggregate results
      annualResults.totalAllocationRevenue += quarterResults.totalAllocationRevenue;
      annualResults.totalMarkupRevenue += quarterResults.totalMarkupRevenue;
      
      // Aggregate by division
      Object.entries(quarterResults.allocationByDivision).forEach(([division, data]) => {
        if (!annualResults.allocationByDivision[division]) {
          annualResults.allocationByDivision[division] = {
            allocatedCosts: 0,
            markupAmount: 0,
            totalCharge: 0
          };
        }
        
        annualResults.allocationByDivision[division].allocatedCosts += data.allocatedCosts;
        annualResults.allocationByDivision[division].markupAmount += data.markupAmount;
        annualResults.allocationByDivision[division].totalCharge += data.totalCharge;
      });
      
      annualResults.quarterlyBreakdown.push(quarterResults);
    }
    
    return annualResults;
  }
}

module.exports = TechAllocationRevenueCalculator;