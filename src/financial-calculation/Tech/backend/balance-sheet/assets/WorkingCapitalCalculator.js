/**
 * WorkingCapitalCalculator
 * 
 * Calculates working capital components for Tech division
 * Includes cash, receivables, payables
 */

export class WorkingCapitalCalculator {
  /**
   * Calculate working capital for Tech division
   * @param {Object} assumptions - Tech division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @returns {Object} Working capital breakdown
   */
  calculateWorkingCapital(assumptions, globalAssumptions) {
    const results = {
      cash: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      accountsReceivable: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      prepaidExpenses: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      accountsPayable: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      accruedExpenses: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      netWorkingCapital: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      total: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
    };

    // Get product configurations
    const products = assumptions.products || {};
    
    // Calculate working capital based on operational needs
    for (let year = 0; year < 10; year++) {
      // Calculate annual operating costs to determine working capital needs
      const annualOperatingCosts = this.calculateAnnualOperatingCosts(products, year);
      
      // Working capital assumptions (as % of annual operating costs)
      const cashDays = 30; // 30 days of operating expenses
      const receivableDays = 60; // 60 days for external clients
      const prepaidDays = 90; // Software licenses often prepaid quarterly
      const payableDays = 45; // 45 days payment terms
      const accruedDays = 30; // 30 days of accruals
      
      // Calculate components
      const dailyOperatingCost = annualOperatingCosts / 365;
      
      results.cash.yearly[year] = dailyOperatingCost * cashDays;
      results.accountsReceivable.yearly[year] = this.calculateReceivables(products, year);
      results.prepaidExpenses.yearly[year] = dailyOperatingCost * prepaidDays * 0.3; // 30% of costs are prepayable
      results.accountsPayable.yearly[year] = dailyOperatingCost * payableDays;
      results.accruedExpenses.yearly[year] = dailyOperatingCost * accruedDays;
      
      // Net working capital = Current Assets - Current Liabilities
      const currentAssets = results.cash.yearly[year] + 
                           results.accountsReceivable.yearly[year] + 
                           results.prepaidExpenses.yearly[year];
      
      const currentLiabilities = results.accountsPayable.yearly[year] + 
                                results.accruedExpenses.yearly[year];
      
      results.netWorkingCapital.yearly[year] = currentAssets - currentLiabilities;
      results.total.yearly[year] = currentAssets; // Total assets side of working capital
      
      // Distribute to quarters (linear interpolation for smooth growth)
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        const quarterFraction = (q + 1) / 4;
        
        if (year === 0) {
          // First year: gradual build-up
          results.cash.quarterly[quarterIndex] = results.cash.yearly[year] * quarterFraction;
          results.accountsReceivable.quarterly[quarterIndex] = results.accountsReceivable.yearly[year] * quarterFraction;
          results.prepaidExpenses.quarterly[quarterIndex] = results.prepaidExpenses.yearly[year] * quarterFraction;
          results.accountsPayable.quarterly[quarterIndex] = results.accountsPayable.yearly[year] * quarterFraction;
          results.accruedExpenses.quarterly[quarterIndex] = results.accruedExpenses.yearly[year] * quarterFraction;
        } else {
          // Subsequent years: interpolate between year-end values
          const prevYearValue = (component) => component.yearly[year - 1];
          const currYearValue = (component) => component.yearly[year];
          
          results.cash.quarterly[quarterIndex] = 
            prevYearValue(results.cash) + (currYearValue(results.cash) - prevYearValue(results.cash)) * quarterFraction;
          
          results.accountsReceivable.quarterly[quarterIndex] = 
            prevYearValue(results.accountsReceivable) + (currYearValue(results.accountsReceivable) - prevYearValue(results.accountsReceivable)) * quarterFraction;
          
          results.prepaidExpenses.quarterly[quarterIndex] = 
            prevYearValue(results.prepaidExpenses) + (currYearValue(results.prepaidExpenses) - prevYearValue(results.prepaidExpenses)) * quarterFraction;
          
          results.accountsPayable.quarterly[quarterIndex] = 
            prevYearValue(results.accountsPayable) + (currYearValue(results.accountsPayable) - prevYearValue(results.accountsPayable)) * quarterFraction;
          
          results.accruedExpenses.quarterly[quarterIndex] = 
            prevYearValue(results.accruedExpenses) + (currYearValue(results.accruedExpenses) - prevYearValue(results.accruedExpenses)) * quarterFraction;
        }
        
        // Calculate quarterly net working capital and total
        const qCurrentAssets = results.cash.quarterly[quarterIndex] + 
                              results.accountsReceivable.quarterly[quarterIndex] + 
                              results.prepaidExpenses.quarterly[quarterIndex];
        
        const qCurrentLiabilities = results.accountsPayable.quarterly[quarterIndex] + 
                                   results.accruedExpenses.quarterly[quarterIndex];
        
        results.netWorkingCapital.quarterly[quarterIndex] = qCurrentAssets - qCurrentLiabilities;
        results.total.quarterly[quarterIndex] = qCurrentAssets;
      }
    }
    
    return results;
  }

  /**
   * Calculate annual operating costs
   */
  calculateAnnualOperatingCosts(products, year) {
    let totalCosts = 0;
    
    // Cloud services (100% OPEX)
    const cloudCosts = products.cloudServices?.costArray || [8, 12, 18, 25, 35, 45, 55, 65, 75, 85];
    totalCosts += cloudCosts[year] || 0;
    
    // Maintenance & support (100% OPEX)
    const maintenanceCosts = products.maintenanceSupport?.costArray || [5, 7, 10, 12, 15, 18, 20, 22, 25, 28];
    totalCosts += maintenanceCosts[year] || 0;
    
    // Software licenses (OPEX portion)
    const softwareCosts = products.softwareLicenses?.costArray || [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const capexPercentage = (products.softwareLicenses?.capexPercentage !== undefined ? products.softwareLicenses.capexPercentage : 40) / 100;
    const opexPercentage = 1 - capexPercentage;
    totalCosts += (softwareCosts[year] || 0) * opexPercentage;
    
    return totalCosts;
  }

  /**
   * Calculate accounts receivable based on external revenue
   */
  calculateReceivables(products, year) {
    const externalClients = products.externalClients || {};
    const clientsArray = externalClients.clientsArray || [0, 0, 2, 5, 10, 15, 20, 25, 30, 35];
    
    // Check if Tech division exit has occurred
    const exitConfig = products.divisionExit || {};
    const exitYear = exitConfig.exitYear || -1;
    const hasExited = exitYear >= 0 && year >= exitYear;
    
    if (!hasExited) {
      return 0; // No external revenue before exit
    }
    
    // Calculate annual external revenue
    const currentYearClients = clientsArray[year] || 0;
    const previousYearClients = year > 0 ? (clientsArray[year - 1] || 0) : 0;
    const newClients = Math.max(0, currentYearClients - previousYearClients);
    
    const setupFeePerClient = externalClients.setupFeePerClient || 0.5;
    const annualFeePerClient = externalClients.annualFeePerClient || 2.0;
    
    const annualSetupRevenue = newClients * setupFeePerClient;
    const annualRecurringRevenue = currentYearClients * annualFeePerClient;
    const totalAnnualRevenue = annualSetupRevenue + annualRecurringRevenue;
    
    // Assume 60 days receivables
    const receivableDays = 60;
    return (totalAnnualRevenue * receivableDays) / 365;
  }
}

export default WorkingCapitalCalculator;