/**
 * TechOperatingCostsCalculator
 * 
 * Calculates direct operating costs (OPEX) for IT services
 * Includes cloud services, maintenance, and OPEX portion of mixed costs
 */

class TechOperatingCostsCalculator {
  /**
   * Calculate operating costs for Tech division
   * @param {Object} assumptions - Tech division assumptions
   * @param {number} year - Current year (0-9)
   * @param {number} quarter - Current quarter (0-39)
   * @returns {Object} Operating costs breakdown
   */
  static calculate(assumptions, year, quarter) {
    const results = {
      cloudServices: 0,
      maintenanceSupport: 0,
      softwareLicensesOpex: 0, // OPEX portion of mixed costs
      externalServiceCosts: 0, // Costs for serving external clients
      totalOperatingCosts: 0,
      breakdown: {},
      metrics: {
        opexAsPercentOfTotal: 0,
        quarterlyGrowthRate: 0
      }
    };
    
    // Get product configurations - support both new structure (techDivision.products) and legacy (assumptions.products)
    const products = assumptions.products || {};
    
    // Debug logging to trace data source - COMMENTED OUT
    // if (products.cloudServices) {
    //   console.log('🔍 Tech Operating Costs - Using products from assumptions.products');
    //   console.log('   cloudServices costArray:', products.cloudServices.costArray);
    // } else {
    //   console.log('⚠️ Tech Operating Costs - No products found in assumptions.products');
    //   console.log('   Available keys in assumptions:', Object.keys(assumptions));
    // }
    
    // 1. Cloud Services (100% OPEX)
    const cloudProduct = products.cloudServices || {};
    const cloudCosts = cloudProduct.costArray || [8, 12, 18, 25, 35, 45, 55, 65, 75, 85];
    
    // Debug rimosso - problema risolto
    
    // Enhanced debug logging for cloud services specifically - COMMENTED OUT
    // console.log('💰 Cloud Services Calculation Debug:');
    // console.log(`   Year: ${year}, Quarter: ${quarter}`);
    // console.log(`   cloudProduct:`, cloudProduct);
    // console.log(`   cloudCosts array:`, cloudCosts);
    // console.log(`   cloudCosts[${year}]:`, cloudCosts[year]);
    // console.log(`   Using default fallback:`, !cloudProduct.costArray ? 'YES (🚨 PROBLEM!)' : 'NO');
    
    results.cloudServices = (cloudCosts[year] || 0) / 4; // Quarterly amount
    
    // console.log(`   Final quarterly result: ${results.cloudServices}M (expected 4M if input was 16M)`);
    // if (results.cloudServices === 2 && cloudCosts[year] === 8) {
    //   console.log('   🚨 FOUND THE ISSUE: Using default 8M instead of user input 16M!');
    // }
    
    // 2. Maintenance & Support (100% OPEX)
    const maintenanceProduct = products.maintenanceSupport || {};
    const maintenanceCosts = maintenanceProduct.costArray || [5, 7, 10, 12, 15, 18, 20, 22, 25, 28];
    results.maintenanceSupport = (maintenanceCosts[year] || 0) / 4;
    
    // 3. Software Licenses - OPEX portion
    const softwareProduct = products.softwareLicenses || {};
    const softwareCosts = softwareProduct.costArray || [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const capexPercentage = (softwareProduct.capexPercentage !== undefined ? softwareProduct.capexPercentage : 40) / 100;
    const opexPercentage = 1 - capexPercentage;
    results.softwareLicensesOpex = ((softwareCosts[year] || 0) * opexPercentage) / 4;
    
    // 4. External Service Costs (based on external revenue and margin)
    const externalClients = products.externalClients || {};
    const marginPercentage = (externalClients.marginPercentage || 30) / 100;
    
    // Check if Tech division exit has occurred
    const exitConfig = products.divisionExit || {};
    const exitYear = exitConfig.exitYear || -1;
    const hasExited = exitYear >= 0 && year >= exitYear;
    
    // Calculate external revenue for this quarter
    const clientsArray = externalClients.clientsArray || [0, 0, 2, 5, 10, 15, 20, 25, 30, 35];
    const currentYearClients = hasExited ? (clientsArray[year] || 0) : 0;
    const previousYearClients = hasExited && year > 0 ? (clientsArray[year - 1] || 0) : 0;
    const newClients = hasExited ? Math.max(0, currentYearClients - previousYearClients) : 0;
    
    const setupFeePerClient = externalClients.setupFeePerClient || 0.5;
    const annualFeePerClient = externalClients.annualFeePerClient || 2.0;
    
    // Only calculate costs if we have external clients (post-exit)
    if (hasExited && currentYearClients > 0) {
      const quarterlySetupRevenue = (newClients / 4) * setupFeePerClient;
      const quarterlyRecurringRevenue = currentYearClients * annualFeePerClient / 4;
      const totalExternalRevenue = quarterlySetupRevenue + quarterlyRecurringRevenue;
      
      // External costs = revenue * (1 - margin)
      results.externalServiceCosts = totalExternalRevenue * (1 - marginPercentage);
    } else {
      results.externalServiceCosts = 0;
    }
    
    // Total operating costs
    results.totalOperatingCosts = 
      results.cloudServices + 
      results.maintenanceSupport + 
      results.softwareLicensesOpex + 
      results.externalServiceCosts;
    
    // Create detailed breakdown
    results.breakdown = {
      cloudServices: {
        amount: results.cloudServices,
        category: 'Infrastructure',
        type: 'OPEX'
      },
      maintenanceSupport: {
        amount: results.maintenanceSupport,
        category: 'Operations',
        type: 'OPEX'
      },
      softwareLicensesOpex: {
        amount: results.softwareLicensesOpex,
        category: 'Licenses',
        type: 'OPEX',
        note: `${opexPercentage * 100}% of total software costs`
      },
      externalServiceCosts: {
        amount: results.externalServiceCosts,
        category: 'External Services',
        type: 'OPEX',
        note: `Supporting ${currentYearClients} external clients`
      }
    };
    
    // Calculate metrics
    const totalITCosts = this.calculateTotalITCosts(assumptions, year) / 4;
    results.metrics.opexAsPercentOfTotal = totalITCosts > 0 ? 
      (results.totalOperatingCosts / totalITCosts) * 100 : 0;
    
    // Growth rate vs previous quarter
    if (quarter > 0) {
      const previousQuarter = quarter - 1;
      const previousYear = Math.floor(previousQuarter / 4);
      
      // Calculate previous quarter costs directly to avoid recursion
      const products = assumptions.products || {};
      
      // Previous quarter cloud services
      const prevCloudCosts = products.cloudServices?.costArray || [8, 12, 18, 25, 35, 45, 55, 65, 75, 85];
      const prevCloudServices = (prevCloudCosts[previousYear] || 0) / 4;
      
      // Previous quarter maintenance
      const prevMaintenanceCosts = products.maintenanceSupport?.costArray || [5, 7, 10, 12, 15, 18, 20, 22, 25, 28];
      const prevMaintenanceSupport = (prevMaintenanceCosts[previousYear] || 0) / 4;
      
      // Previous quarter software OPEX
      const prevSoftwareCosts = products.softwareLicenses?.costArray || [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      const prevCapexPercentage = (products.softwareLicenses?.capexPercentage !== undefined ? products.softwareLicenses.capexPercentage : 40) / 100;
      const prevOpexPercentage = 1 - prevCapexPercentage;
      const prevSoftwareLicensesOpex = ((prevSoftwareCosts[previousYear] || 0) * prevOpexPercentage) / 4;
      
      // Previous quarter external service costs
      const externalClients = products.externalClients || {};
      const marginPercentage = (externalClients.marginPercentage || 30) / 100;
      const clientsArray = externalClients.clientsArray || [0, 0, 2, 5, 10, 15, 20, 25, 30, 35];
      const prevYearClients = clientsArray[previousYear] || 0;
      const prevPrevYearClients = previousYear > 0 ? (clientsArray[previousYear - 1] || 0) : 0;
      const prevNewClients = Math.max(0, prevYearClients - prevPrevYearClients);
      
      const setupFeePerClient = externalClients.setupFeePerClient || 0.5;
      const annualFeePerClient = externalClients.annualFeePerClient || 2.0;
      
      const prevQuarterlySetupRevenue = (prevNewClients / 4) * setupFeePerClient;
      const prevQuarterlyRecurringRevenue = prevYearClients * annualFeePerClient / 4;
      const prevTotalExternalRevenue = prevQuarterlySetupRevenue + prevQuarterlyRecurringRevenue;
      const prevExternalServiceCosts = prevTotalExternalRevenue * (1 - marginPercentage);
      
      // Previous total operating costs
      const previousTotalOperatingCosts = prevCloudServices + prevMaintenanceSupport + 
                                         prevSoftwareLicensesOpex + prevExternalServiceCosts;
      
      results.metrics.quarterlyGrowthRate = previousTotalOperatingCosts > 0 ?
        ((results.totalOperatingCosts - previousTotalOperatingCosts) / previousTotalOperatingCosts) * 100 : 0;
    }
    
    return results;
  }
  
  /**
   * Calculate total IT costs for metrics
   */
  static calculateTotalITCosts(assumptions, year) {
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
   * Calculate annual operating costs
   */
  static calculateAnnual(assumptions, year) {
    const annualResults = {
      cloudServices: 0,
      maintenanceSupport: 0,
      softwareLicensesOpex: 0,
      externalServiceCosts: 0,
      totalOperatingCosts: 0,
      quarterlyBreakdown: []
    };
    
    // Calculate for each quarter
    for (let q = 0; q < 4; q++) {
      const quarterResults = this.calculate(assumptions, year, year * 4 + q);
      
      annualResults.cloudServices += quarterResults.cloudServices;
      annualResults.maintenanceSupport += quarterResults.maintenanceSupport;
      annualResults.softwareLicensesOpex += quarterResults.softwareLicensesOpex;
      annualResults.externalServiceCosts += quarterResults.externalServiceCosts;
      annualResults.totalOperatingCosts += quarterResults.totalOperatingCosts;
      
      annualResults.quarterlyBreakdown.push(quarterResults);
    }
    
    // Annual metrics
    annualResults.metrics = {
      opexAsPercentOfTotal: this.calculateTotalITCosts(assumptions, year) > 0 ?
        (annualResults.totalOperatingCosts / this.calculateTotalITCosts(assumptions, year)) * 100 : 0,
      yearOverYearGrowth: 0 // Will be calculated at orchestrator level to avoid recursion
    };
    
    return annualResults;
  }
}

module.exports = TechOperatingCostsCalculator;