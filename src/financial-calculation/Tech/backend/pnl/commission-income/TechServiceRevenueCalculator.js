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
    console.log('TechServiceRevenueCalculator - Full assumptions:', JSON.stringify(assumptions.techDivision?.products || {}, null, 2));
    
    // Get external clients product data
    const externalClients = assumptions.techDivision?.products?.externalClients || {};
    
    // Check if Tech division exit has occurred
    const exitConfig = assumptions.techDivision?.products?.divisionExit || {};
    const exitYear = exitConfig.exitYear || -1; // -1 means no exit planned
    const hasExited = exitYear >= 0 && year >= exitYear;
    
    console.log('TechServiceRevenue - Year:', year, 'Exit Year:', exitYear, 'Has Exited:', hasExited);
    console.log('Exit Config:', exitConfig);
    
    // Default values if not provided
    const clientsArray = externalClients.clientsArray || [0, 0, 2, 5, 10, 15, 20, 25, 30, 35];
    const setupFeePerClient = externalClients.setupFeePerClient || 0.5; // €M
    const annualFeePerClient = externalClients.annualFeePerClient || 2.0; // €M
    const marginPercentage = (externalClients.marginPercentage || 30) / 100;
    
    // Get current and previous year client counts
    // If no exit has occurred, no external clients are allowed
    const currentYearClients = hasExited ? (clientsArray[year] || 0) : 0;
    const previousYearClients = hasExited && year > 0 ? (clientsArray[year - 1] || 0) : 0;
    
    console.log('Clients Array:', clientsArray);
    console.log('Current Year Clients:', currentYearClients, 'Previous Year Clients:', previousYearClients);
    
    // Calculate new clients in current year (only after exit)
    const newClients = hasExited ? Math.max(0, currentYearClients - previousYearClients) : 0;
    
    // Calculate revenues for the quarter
    const quarterlyResults = {
      setupFees: 0,
      recurringFees: 0,
      totalRevenue: 0,
      totalCosts: 0,
      netRevenue: 0,
      metrics: {
        totalClients: currentYearClients,
        newClients: newClients,
        setupFeePerClient: setupFeePerClient,
        annualFeePerClient: annualFeePerClient,
        marginPercentage: marginPercentage * 100,
        hasExited: hasExited,
        exitYear: exitYear >= 0 ? exitYear : null
      }
    };
    
    // Setup fees - recognized in the quarter when new client joins
    // Distribute new clients evenly across quarters
    const newClientsThisQuarter = newClients / 4;
    quarterlyResults.setupFees = newClientsThisQuarter * setupFeePerClient;
    
    // Recurring fees - based on total active clients
    // Annual fee divided by 4 for quarterly amount
    quarterlyResults.recurringFees = currentYearClients * annualFeePerClient / 4;
    
    // Total revenue
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
    const externalClients = assumptions.techDivision?.products?.externalClients || {};
    const clientsArray = externalClients.clientsArray || [0, 0, 2, 5, 10, 15, 20, 25, 30, 35];
    
    // Check if Tech division exit has occurred
    const exitConfig = assumptions.techDivision?.products?.divisionExit || {};
    const exitYear = exitConfig.exitYear || -1;
    const hasExited = exitYear >= 0 && year >= exitYear;
    
    const actualClients = hasExited ? (clientsArray[year] || 0) : 0;
    const prevYearClients = hasExited && year > 0 ? (clientsArray[year - 1] || 0) : 0;
    
    annualResults.metrics = {
      totalClients: actualClients,
      newClients: hasExited ? Math.max(0, actualClients - prevYearClients) : 0,
      avgRevenuePerClient: actualClients > 0 ? annualResults.totalRevenue / actualClients : 0,
      marginPercentage: ((externalClients.marginPercentage || 30)),
      hasExited: hasExited,
      exitYear: exitYear >= 0 ? exitYear : null
    };
    
    return annualResults;
  }
}

module.exports = TechServiceRevenueCalculator;