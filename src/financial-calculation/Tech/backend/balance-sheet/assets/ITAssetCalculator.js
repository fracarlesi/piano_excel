/**
 * ITAssetCalculator
 * 
 * Calculates IT asset values, depreciation, and net book values
 * Handles CAPEX investments and depreciation schedules
 */

export class ITAssetCalculator {
  /**
   * Calculate IT assets including depreciation
   * @param {Object} assumptions - Tech division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @returns {Object} IT asset breakdown with NBV
   */
  calculateITAssets(assumptions, globalAssumptions) {
    const results = {
      infrastructure: {
        grossValue: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        accumulatedDepreciation: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        netBookValue: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      software: {
        grossValue: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        accumulatedDepreciation: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        netBookValue: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      developmentProjects: {
        grossValue: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        accumulatedDepreciation: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        netBookValue: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      total: {
        grossValue: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        accumulatedDepreciation: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        netBookValue: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        quarterly: new Array(40).fill(0), // NBV for compatibility
        yearly: new Array(10).fill(0)      // NBV for compatibility
      },
      depreciation: {
        quarterly: new Array(40).fill(0),
        yearly: new Array(10).fill(0)
      }
    };

    // Get product configurations
    const products = assumptions.products || {};
    
    // Process each asset category
    this.processInfrastructure(products, results);
    this.processSoftware(products, results);
    this.processDevelopmentProjects(products, results);
    
    // Calculate totals
    this.calculateTotals(results);
    
    return results;
  }

  /**
   * Process infrastructure assets (servers, data centers, network)
   */
  processInfrastructure(products, results) {
    const infraProduct = products.infrastructure || {};
    const costArray = infraProduct.costArray || [5, 8, 12, 15, 18, 20, 22, 24, 26, 28];
    const depreciationYears = infraProduct.depreciationYears || 5;
    
    // Calculate gross value and depreciation
    for (let year = 0; year < 10; year++) {
      const annualCapex = costArray[year] || 0;
      
      // Add to gross value (cumulative)
      const previousGross = year > 0 ? results.infrastructure.grossValue.yearly[year - 1] : 0;
      results.infrastructure.grossValue.yearly[year] = previousGross + annualCapex;
      
      // Calculate depreciation for this year
      let yearlyDepreciation = 0;
      
      // Depreciate all previous investments
      for (let investYear = 0; investYear <= year; investYear++) {
        const investment = costArray[investYear] || 0;
        const yearsElapsed = year - investYear;
        
        if (yearsElapsed < depreciationYears) {
          yearlyDepreciation += investment / depreciationYears;
        }
      }
      
      // Update accumulated depreciation
      const previousAccumulated = year > 0 ? results.infrastructure.accumulatedDepreciation.yearly[year - 1] : 0;
      results.infrastructure.accumulatedDepreciation.yearly[year] = previousAccumulated + yearlyDepreciation;
      
      // Calculate NBV
      results.infrastructure.netBookValue.yearly[year] = 
        results.infrastructure.grossValue.yearly[year] - results.infrastructure.accumulatedDepreciation.yearly[year];
      
      // Distribute to quarters
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        const quarterlyCapex = annualCapex / 4;
        const quarterlyDepreciation = yearlyDepreciation / 4;
        
        // Gross value increases quarterly
        const prevQtrGross = quarterIndex > 0 ? results.infrastructure.grossValue.quarterly[quarterIndex - 1] : 0;
        results.infrastructure.grossValue.quarterly[quarterIndex] = prevQtrGross + quarterlyCapex;
        
        // Accumulated depreciation increases quarterly
        const prevQtrAccum = quarterIndex > 0 ? results.infrastructure.accumulatedDepreciation.quarterly[quarterIndex - 1] : 0;
        results.infrastructure.accumulatedDepreciation.quarterly[quarterIndex] = prevQtrAccum + quarterlyDepreciation;
        
        // NBV = Gross - Accumulated
        results.infrastructure.netBookValue.quarterly[quarterIndex] = 
          results.infrastructure.grossValue.quarterly[quarterIndex] - 
          results.infrastructure.accumulatedDepreciation.quarterly[quarterIndex];
      }
    }
  }

  /**
   * Process software licenses (mixed CAPEX/OPEX)
   */
  processSoftware(products, results) {
    const softwareProduct = products.softwareLicenses || {};
    const costArray = softwareProduct.costArray || [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const capexPercentage = (softwareProduct.capexPercentage !== undefined ? softwareProduct.capexPercentage : 40) / 100;
    const depreciationYears = softwareProduct.depreciationYears || 3;
    
    // Calculate gross value and depreciation
    for (let year = 0; year < 10; year++) {
      const totalCost = costArray[year] || 0;
      const annualCapex = totalCost * capexPercentage; // Only CAPEX portion is capitalized
      
      // Add to gross value (cumulative)
      const previousGross = year > 0 ? results.software.grossValue.yearly[year - 1] : 0;
      results.software.grossValue.yearly[year] = previousGross + annualCapex;
      
      // Calculate depreciation for this year
      let yearlyDepreciation = 0;
      
      // Depreciate all previous investments
      for (let investYear = 0; investYear <= year; investYear++) {
        const investment = (costArray[investYear] || 0) * capexPercentage;
        const yearsElapsed = year - investYear;
        
        if (yearsElapsed < depreciationYears) {
          yearlyDepreciation += investment / depreciationYears;
        }
      }
      
      // Update accumulated depreciation
      const previousAccumulated = year > 0 ? results.software.accumulatedDepreciation.yearly[year - 1] : 0;
      results.software.accumulatedDepreciation.yearly[year] = previousAccumulated + yearlyDepreciation;
      
      // Calculate NBV
      results.software.netBookValue.yearly[year] = 
        results.software.grossValue.yearly[year] - results.software.accumulatedDepreciation.yearly[year];
      
      // Distribute to quarters
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        const quarterlyCapex = annualCapex / 4;
        const quarterlyDepreciation = yearlyDepreciation / 4;
        
        // Gross value increases quarterly
        const prevQtrGross = quarterIndex > 0 ? results.software.grossValue.quarterly[quarterIndex - 1] : 0;
        results.software.grossValue.quarterly[quarterIndex] = prevQtrGross + quarterlyCapex;
        
        // Accumulated depreciation increases quarterly
        const prevQtrAccum = quarterIndex > 0 ? results.software.accumulatedDepreciation.quarterly[quarterIndex - 1] : 0;
        results.software.accumulatedDepreciation.quarterly[quarterIndex] = prevQtrAccum + quarterlyDepreciation;
        
        // NBV = Gross - Accumulated
        results.software.netBookValue.quarterly[quarterIndex] = 
          results.software.grossValue.quarterly[quarterIndex] - 
          results.software.accumulatedDepreciation.quarterly[quarterIndex];
      }
    }
  }

  /**
   * Process development projects (100% CAPEX)
   */
  processDevelopmentProjects(products, results) {
    const devProduct = products.developmentProjects || {};
    const costArray = devProduct.costArray || [15, 22, 28, 35, 40, 45, 50, 55, 60, 70];
    const depreciationYears = devProduct.depreciationYears || 5;
    
    // Calculate gross value and depreciation
    for (let year = 0; year < 10; year++) {
      const annualCapex = costArray[year] || 0;
      
      // Add to gross value (cumulative)
      const previousGross = year > 0 ? results.developmentProjects.grossValue.yearly[year - 1] : 0;
      results.developmentProjects.grossValue.yearly[year] = previousGross + annualCapex;
      
      // Calculate depreciation for this year
      let yearlyDepreciation = 0;
      
      // Depreciate all previous investments
      for (let investYear = 0; investYear <= year; investYear++) {
        const investment = costArray[investYear] || 0;
        const yearsElapsed = year - investYear;
        
        if (yearsElapsed < depreciationYears) {
          yearlyDepreciation += investment / depreciationYears;
        }
      }
      
      // Update accumulated depreciation
      const previousAccumulated = year > 0 ? results.developmentProjects.accumulatedDepreciation.yearly[year - 1] : 0;
      results.developmentProjects.accumulatedDepreciation.yearly[year] = previousAccumulated + yearlyDepreciation;
      
      // Calculate NBV
      results.developmentProjects.netBookValue.yearly[year] = 
        results.developmentProjects.grossValue.yearly[year] - results.developmentProjects.accumulatedDepreciation.yearly[year];
      
      // Distribute to quarters
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        const quarterlyCapex = annualCapex / 4;
        const quarterlyDepreciation = yearlyDepreciation / 4;
        
        // Gross value increases quarterly
        const prevQtrGross = quarterIndex > 0 ? results.developmentProjects.grossValue.quarterly[quarterIndex - 1] : 0;
        results.developmentProjects.grossValue.quarterly[quarterIndex] = prevQtrGross + quarterlyCapex;
        
        // Accumulated depreciation increases quarterly
        const prevQtrAccum = quarterIndex > 0 ? results.developmentProjects.accumulatedDepreciation.quarterly[quarterIndex - 1] : 0;
        results.developmentProjects.accumulatedDepreciation.quarterly[quarterIndex] = prevQtrAccum + quarterlyDepreciation;
        
        // NBV = Gross - Accumulated
        results.developmentProjects.netBookValue.quarterly[quarterIndex] = 
          results.developmentProjects.grossValue.quarterly[quarterIndex] - 
          results.developmentProjects.accumulatedDepreciation.quarterly[quarterIndex];
      }
    }
  }

  /**
   * Calculate total values across all asset categories
   */
  calculateTotals(results) {
    // Sum up quarterly values
    for (let q = 0; q < 40; q++) {
      results.total.grossValue.quarterly[q] = 
        results.infrastructure.grossValue.quarterly[q] +
        results.software.grossValue.quarterly[q] +
        results.developmentProjects.grossValue.quarterly[q];
      
      results.total.accumulatedDepreciation.quarterly[q] = 
        results.infrastructure.accumulatedDepreciation.quarterly[q] +
        results.software.accumulatedDepreciation.quarterly[q] +
        results.developmentProjects.accumulatedDepreciation.quarterly[q];
      
      results.total.netBookValue.quarterly[q] = 
        results.infrastructure.netBookValue.quarterly[q] +
        results.software.netBookValue.quarterly[q] +
        results.developmentProjects.netBookValue.quarterly[q];
      
      // For compatibility
      results.total.quarterly[q] = results.total.netBookValue.quarterly[q];
      
      // Calculate quarterly depreciation expense
      if (q > 0) {
        results.depreciation.quarterly[q] = 
          results.total.accumulatedDepreciation.quarterly[q] - 
          results.total.accumulatedDepreciation.quarterly[q - 1];
      } else {
        results.depreciation.quarterly[q] = results.total.accumulatedDepreciation.quarterly[0];
      }
    }
    
    // Sum up yearly values
    for (let y = 0; y < 10; y++) {
      results.total.grossValue.yearly[y] = 
        results.infrastructure.grossValue.yearly[y] +
        results.software.grossValue.yearly[y] +
        results.developmentProjects.grossValue.yearly[y];
      
      results.total.accumulatedDepreciation.yearly[y] = 
        results.infrastructure.accumulatedDepreciation.yearly[y] +
        results.software.accumulatedDepreciation.yearly[y] +
        results.developmentProjects.accumulatedDepreciation.yearly[y];
      
      results.total.netBookValue.yearly[y] = 
        results.infrastructure.netBookValue.yearly[y] +
        results.software.netBookValue.yearly[y] +
        results.developmentProjects.netBookValue.yearly[y];
      
      // For compatibility
      results.total.yearly[y] = results.total.netBookValue.yearly[y];
      
      // Calculate yearly depreciation expense
      if (y > 0) {
        results.depreciation.yearly[y] = 
          results.total.accumulatedDepreciation.yearly[y] - 
          results.total.accumulatedDepreciation.yearly[y - 1];
      } else {
        results.depreciation.yearly[y] = results.total.accumulatedDepreciation.yearly[0];
      }
    }
  }
}

export default ITAssetCalculator;