/**
 * Personnel Cost Calculator Module
 * 
 * This module handles all personnel cost calculations using a bottom-up approach.
 * It provides a clean, explicit interface for calculating costs for all divisions
 * and central function departments.
 */

/**
 * Calculate all personnel costs for every division and department
 * 
 * @param {Object} assumptions - Full assumptions object with personnel data
 * @param {Array} years - Array of year indices [0, 1, 2, ...]
 * @returns {Object} Structured object with all personnel costs
 */
export const calculateAllPersonnelCosts = (assumptions, years) => {
  // Extract global personnel parameters
  const personnel = assumptions.personnel || {};
  const { annualSalaryReview = 2.5, companyTaxMultiplier = 1.4 } = personnel;
  const salaryGrowth = years.map(i => Math.pow(1 + annualSalaryReview / 100, i));
  
  // Helper function to calculate costs for a single unit (division or department)
  const calculateUnitCosts = (unitData, salaryGrowth, companyTaxMultiplier, years) => {
    if (!unitData || !unitData.staffing) {
      return {
        costs: years.map(() => 0),
        headcount: years.map(() => 0),
        details: years.map(() => [])
      };
    }
    
    const { headcountGrowth = 0, staffing = [] } = unitData;
    const headcountMultiplier = years.map(i => Math.pow(1 + headcountGrowth / 100, i));
    
    const yearlyResults = years.map((_, yearIndex) => {
      let totalCost = 0;
      let totalHeadcount = 0;
      const levelDetails = [];
      
      staffing.forEach(level => {
        // Apply headcount growth only to Junior and Middle levels
        const growthMultiplier = (level.level === 'Junior' || level.level === 'Middle') 
          ? headcountMultiplier[yearIndex] 
          : 1; // Senior and Head of remain constant
        
        const headcount = level.count * growthMultiplier;
        const ralPerHead = (level.ralPerHead || 0) * 1000 * salaryGrowth[yearIndex]; // ralPerHead is in thousands
        const companyCostPerHead = ralPerHead * companyTaxMultiplier;
        const levelCost = headcount * companyCostPerHead / 1000000; // Convert to €M
        
        totalCost += levelCost;
        totalHeadcount += headcount;
        
        // Store details for calculation trace
        levelDetails.push({
          level: level.level,
          headcount: headcount,
          ralPerHead: ralPerHead / 1000, // Show in thousands for display
          companyCostPerHead: companyCostPerHead / 1000, // Show in thousands for display
          totalCost: levelCost
        });
      });
      
      return { 
        cost: -totalCost, // Negative for P&L
        headcount: totalHeadcount,
        details: levelDetails
      };
    });
    
    return {
      costs: yearlyResults.map(r => r.cost),
      headcount: yearlyResults.map(r => r.headcount),
      details: yearlyResults.map(r => r.details)
    };
  };
  
  // Initialize result structure
  const result = {
    // Business Divisions
    RealEstateFinancing: null,
    SMEFinancing: null,
    WealthAndAssetManagement: null,
    Incentives: null,
    DigitalBanking: null,
    Tech: null,
    Treasury: null,
    
    // Central Functions
    CentralFunctions: {
      total: years.map(() => 0),
      departments: {}
    },
    
    // Grand totals
    grandTotal: {
      costs: years.map(() => 0),
      headcount: years.map(() => 0)
    }
  };
  
  // Calculate costs for each business division
  if (assumptions.realEstateDivision) {
    result.RealEstateFinancing = calculateUnitCosts(assumptions.realEstateDivision, salaryGrowth, companyTaxMultiplier, years);
  }
  
  if (assumptions.smeDivision) {
    result.SMEFinancing = calculateUnitCosts(assumptions.smeDivision, salaryGrowth, companyTaxMultiplier, years);
  }
  
  if (assumptions.wealthDivision) {
    result.WealthAndAssetManagement = calculateUnitCosts(assumptions.wealthDivision, salaryGrowth, companyTaxMultiplier, years);
  }
  
  if (assumptions.incentiveDivision) {
    result.Incentives = calculateUnitCosts(assumptions.incentiveDivision, salaryGrowth, companyTaxMultiplier, years);
  }
  
  if (assumptions.digitalBankingDivision) {
    result.DigitalBanking = calculateUnitCosts(assumptions.digitalBankingDivision, salaryGrowth, companyTaxMultiplier, years);
  }
  
  if (assumptions.techDivision) {
    result.Tech = calculateUnitCosts(assumptions.techDivision, salaryGrowth, companyTaxMultiplier, years);
  }
  
  if (assumptions.treasury && assumptions.treasury.staffing) {
    result.Treasury = calculateUnitCosts(assumptions.treasury, salaryGrowth, companyTaxMultiplier, years);
  }
  
  // Calculate costs for Central Functions departments
  if (assumptions.centralFunctions && assumptions.centralFunctions.departments) {
    Object.entries(assumptions.centralFunctions.departments).forEach(([deptKey, deptData]) => {
      const deptResult = calculateUnitCosts(deptData, salaryGrowth, companyTaxMultiplier, years);
      result.CentralFunctions.departments[deptKey] = deptResult;
      
      // Add to central functions total
      result.CentralFunctions.total = result.CentralFunctions.total.map((total, i) => 
        total + deptResult.costs[i]
      );
    });
  }
  
  // Calculate grand totals
  // Business divisions
  ['RealEstateFinancing', 'SMEFinancing', 'WealthAndAssetManagement', 'Incentives', 'DigitalBanking', 'Tech', 'Treasury'].forEach(division => {
    if (result[division]) {
      result.grandTotal.costs = result.grandTotal.costs.map((total, i) => 
        total + result[division].costs[i]
      );
      result.grandTotal.headcount = result.grandTotal.headcount.map((total, i) => 
        total + result[division].headcount[i]
      );
    }
  });
  
  // Central functions
  result.grandTotal.costs = result.grandTotal.costs.map((total, i) => 
    total + result.CentralFunctions.total[i]
  );
  
  Object.values(result.CentralFunctions.departments).forEach(dept => {
    result.grandTotal.headcount = result.grandTotal.headcount.map((total, i) => 
      total + dept.headcount[i]
    );
  });
  
  return result;
};

/**
 * Get personnel costs for a specific division
 * 
 * @param {Object} allPersonnelCosts - Result from calculateAllPersonnelCosts
 * @param {string} divisionKey - Division key (e.g., 'RealEstateFinancing')
 * @returns {Object} Personnel costs and details for the division
 */
export const getDivisionPersonnelCosts = (allPersonnelCosts, divisionKey) => {
  if (divisionKey === 'CentralFunctions') {
    return {
      costs: allPersonnelCosts.CentralFunctions.total,
      details: allPersonnelCosts.CentralFunctions.departments,
      headcount: Object.values(allPersonnelCosts.CentralFunctions.departments)
        .reduce((acc, dept) => acc.map((val, i) => val + dept.headcount[i]), 
                allPersonnelCosts.CentralFunctions.total.map(() => 0))
    };
  }
  
  return allPersonnelCosts[divisionKey] || {
    costs: allPersonnelCosts.CentralFunctions.total.map(() => 0),
    details: [],
    headcount: allPersonnelCosts.CentralFunctions.total.map(() => 0)
  };
};