/**
 * TechServiceRevenueCalculator
 * 
 * Calculates revenue from external IT services provided to third-party clients
 * Includes setup fees and recurring annual fees
 */

class TechServiceRevenueCalculator {
  /**
   * Calculate external IT service revenues
   * @param {Object} assumptions - Tech division assumptions
   * @param {number} year - Current year (0-9)
   * @param {number} quarter - Current quarter (0-39)
   * @returns {Object} Revenue breakdown by type
   */
  static calculate(assumptions, year, quarter) {
    // console.log('TechServiceRevenueCalculator - Full assumptions:', JSON.stringify(assumptions.techDivision?.products || {}, null, 2));
    
    // Get unified post-exit services data
    const postExitServices = assumptions.techDivision?.products?.postExitServices || {};
    
    // Check if Tech division exit has occurred
    const exitConfig = assumptions.techDivision?.products?.divisionExit || {};
    const exitYear = exitConfig.exitYear || -1; // -1 means no exit planned
    const hasExited = exitYear >= 0 && year >= exitYear;
    
    // console.log('TechServiceRevenue - Year:', year, 'Exit Year:', exitYear, 'Has Exited:', hasExited);
    // console.log('Exit Config:', exitConfig);
    
    // Get unified pricing parameters
    const setupFeePerClient = postExitServices.setupFeePerClient || 0.5; // €M
    const annualFeePerClient = postExitServices.annualFeePerClient || 50.0; // €M
    const marginPercentage = (postExitServices.marginPercentage || 30) / 100;
    const annualGrowthRate = (postExitServices.annualGrowthRate || 3) / 100;
    
    // Get total clients array (bank mother is client #1)
    const totalClientsArray = postExitServices.totalClientsArray || [0, 0, 0, 0, 0, 1, 2, 4, 7, 10];
    
    // Calculate client counts - simple model where all clients are equal
    // If no exit has occurred, no external revenue
    const totalClients = hasExited ? (totalClientsArray[year] || 0) : 0;
    const previousYearClients = hasExited && year > 0 ? (totalClientsArray[year - 1] || 0) : 0;
    
    // console.log('Total Clients:', totalClients, 'Previous Year:', previousYearClients);
    
    // Calculate new clients in current year (only after exit)
    const newClients = hasExited ? Math.max(0, totalClients - previousYearClients) : 0;
    
    // Calculate revenues for the quarter
    const quarterlyResults = {
      setupFees: 0,
      recurringFees: 0,
      totalRevenue: 0,
      totalCosts: 0,
      netRevenue: 0,
      metrics: {
        totalClients: totalClients,
        newClients: newClients,
        setupFeePerClient: setupFeePerClient,
        annualFeePerClient: annualFeePerClient,
        marginPercentage: marginPercentage * 100,
        hasExited: hasExited,
        exitYear: exitYear >= 0 ? exitYear : null
      }
    };
    
    if (hasExited) {
      // Calculate fee with growth from exit year
      const yearsFromExit = year - exitYear;
      const adjustedAnnualFee = annualFeePerClient * Math.pow(1 + annualGrowthRate, yearsFromExit);
      
      // Setup fees - recognized in the quarter when new clients join
      // Distribute new clients evenly across quarters
      const newClientsThisQuarter = newClients / 4;
      quarterlyResults.setupFees = newClientsThisQuarter * setupFeePerClient;
      
      // Recurring fees - based on total active clients
      // Annual fee divided by 4 for quarterly amount
      quarterlyResults.recurringFees = totalClients * adjustedAnnualFee / 4;
    }
    
    // Total revenue (unified model includes both bank mother and external clients)
    quarterlyResults.totalRevenue = quarterlyResults.setupFees + quarterlyResults.recurringFees;
    
    // Calculate costs (inverse of margin)
    quarterlyResults.totalCosts = quarterlyResults.totalRevenue * (1 - marginPercentage);
    
    // Net revenue (after costs)
    quarterlyResults.netRevenue = quarterlyResults.totalRevenue * marginPercentage;
    
    return quarterlyResults;
  }
  
  
  /**
   * Calculate annual summary
   * @param {Object} assumptions - Tech division assumptions
   * @param {number} year - Current year (0-9)
   * @returns {Object} Annual revenue summary
   */
  static calculateAnnual(assumptions, year) {
    const annualResults = {
      setupFees: 0,
      recurringFees: 0,
      totalRevenue: 0,
      totalCosts: 0,
      netRevenue: 0,
      quarterlyBreakdown: []
    };
    
    // Calculate for each quarter
    for (let q = 0; q < 4; q++) {
      const quarterResults = this.calculate(assumptions, year, year * 4 + q);
      
      annualResults.setupFees += quarterResults.setupFees;
      annualResults.recurringFees += quarterResults.recurringFees;
      annualResults.totalRevenue += quarterResults.totalRevenue;
      annualResults.totalCosts += quarterResults.totalCosts;
      annualResults.netRevenue += quarterResults.netRevenue;
      
      annualResults.quarterlyBreakdown.push(quarterResults);
    }
    
    // Add annual metrics
    const postExitServices = assumptions.techDivision?.products?.postExitServices || {};
    const totalClientsArray = postExitServices.totalClientsArray || [0, 0, 0, 0, 0, 1, 2, 4, 7, 10];
    
    // Check if Tech division exit has occurred
    const exitConfig = assumptions.techDivision?.products?.divisionExit || {};
    const exitYear = exitConfig.exitYear || -1;
    const hasExited = exitYear >= 0 && year >= exitYear;
    
    const totalClients = hasExited ? (totalClientsArray[year] || 0) : 0;
    const prevYearClients = hasExited && year > 0 ? (totalClientsArray[year - 1] || 0) : 0;
    
    annualResults.metrics = {
      totalClients: totalClients,
      newClients: hasExited ? Math.max(0, totalClients - prevYearClients) : 0,
      avgRevenuePerClient: totalClients > 0 ? annualResults.totalRevenue / totalClients : 0,
      marginPercentage: (postExitServices.marginPercentage || 30),
      hasExited: hasExited,
      exitYear: exitYear >= 0 ? exitYear : null
    };
    
    return annualResults;
  }
}

module.exports = TechServiceRevenueCalculator;