/**
 * Calculate personnel costs using bottom-up approach from new structure
 * 
 * @param {Object} assumptions - Full assumptions object with personnel data distributed across divisions
 * @param {Array} years - Array of year indices
 * @returns {Object} Personnel costs by division and total
 */
export const calculatePersonnelCosts = (assumptions, years) => {
  console.log('=== calculatePersonnelCosts START ===');
  console.log('Years:', years);
  console.log('Years is array:', Array.isArray(years));
  console.log('Years length:', years?.length);
  console.log('Assumptions:', assumptions ? 'exists' : 'null');
  console.log('Assumptions keys:', Object.keys(assumptions || {}));
  
  // Test simple calculation
  const testCost = -1.5; // €1.5M for testing
  console.log('Test cost:', testCost);
  
  const personnel = assumptions.personnel || {};
  const { annualSalaryReview = 2.5, companyTaxMultiplier = 1.4 } = personnel;
  const salaryGrowth = years.map(i => Math.pow(1 + annualSalaryReview / 100, i));
  
  console.log('Salary growth factors:', salaryGrowth);
  
  
  const results = {
    byDivision: {},
    centralFunctionsTotal: years.map(() => 0),
    totalCosts: years.map(() => 0),
    totalHeadcount: years.map(() => 0),
    byDepartment: {}
  };

  // Helper function to calculate division costs
  const calculateDivisionCosts = (divisionData, salaryGrowth, companyTaxMultiplier, years) => {
    if (!divisionData || !divisionData.staffing) {
      return years.map(() => ({ 
        cost: 0, 
        headcount: 0, 
        details: [] 
      }));
    }
    
    const { headcountGrowth = 0, staffing = [] } = divisionData;
    const headcountMultiplier = years.map(i => Math.pow(1 + headcountGrowth / 100, i));
    
    return years.map((_, yearIndex) => {
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
        
        if (yearIndex === 0 && level.level === 'Junior') {
          console.log('Junior calculation detail:', {
            count: level.count,
            ralPerHead_input: level.ralPerHead,
            ralPerHead_calculated: ralPerHead,
            companyCostPerHead,
            headcount,
            levelCost
          });
        }
        
        
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
        cost: totalCost, 
        headcount: totalHeadcount,
        details: levelDetails
      };
    });
  };

  // Business Divisions
  // Real Estate Division
  console.log('RE Division check:', {
    hasRealEstateDivision: !!assumptions.realEstateDivision,
    staffing: assumptions.realEstateDivision?.staffing
  });
  
  if (assumptions.realEstateDivision) {
    const divisionCosts = calculateDivisionCosts(assumptions.realEstateDivision, salaryGrowth, companyTaxMultiplier, years);
    console.log('RE Division costs calculated:', divisionCosts[0]);
    
    results.byDivision.RealEstateFinancing = {
      costs: divisionCosts.map(d => -d.cost), // Negative for P&L
      headcount: divisionCosts.map(d => d.headcount),
      details: divisionCosts.map(d => d.details) // Store details for calculation trace
    };
    
  }

  // SME Division
  if (assumptions.smeDivision) {
    const divisionCosts = calculateDivisionCosts(assumptions.smeDivision, salaryGrowth, companyTaxMultiplier, years);
    results.byDivision.SMEFinancing = {
      costs: divisionCosts.map(d => -d.cost),
      headcount: divisionCosts.map(d => d.headcount),
      details: divisionCosts.map(d => d.details)
    };
  }

  // Wealth Division
  if (assumptions.wealthDivision) {
    const divisionCosts = calculateDivisionCosts(assumptions.wealthDivision, salaryGrowth, companyTaxMultiplier, years);
    results.byDivision.WealthAndAssetManagement = {
      costs: divisionCosts.map(d => -d.cost),
      headcount: divisionCosts.map(d => d.headcount),
      details: divisionCosts.map(d => d.details)
    };
  }

  // Incentive Division
  if (assumptions.incentiveDivision) {
    const divisionCosts = calculateDivisionCosts(assumptions.incentiveDivision, salaryGrowth, companyTaxMultiplier, years);
    results.byDivision.Incentives = {
      costs: divisionCosts.map(d => -d.cost),
      headcount: divisionCosts.map(d => d.headcount),
      details: divisionCosts.map(d => d.details)
    };
  }

  // Digital Banking Division
  if (assumptions.digitalBankingDivision) {
    const divisionCosts = calculateDivisionCosts(assumptions.digitalBankingDivision, salaryGrowth, companyTaxMultiplier, years);
    results.byDivision.DigitalBanking = {
      costs: divisionCosts.map(d => -d.cost),
      headcount: divisionCosts.map(d => d.headcount),
      details: divisionCosts.map(d => d.details)
    };
  }

  // Tech Division
  if (assumptions.techDivision) {
    const divisionCosts = calculateDivisionCosts(assumptions.techDivision, salaryGrowth, companyTaxMultiplier, years);
    results.byDivision.Tech = {
      costs: divisionCosts.map(d => -d.cost),
      headcount: divisionCosts.map(d => d.headcount),
      details: divisionCosts.map(d => d.details)
    };
  }

  // Treasury Division
  if (assumptions.treasury && assumptions.treasury.staffing) {
    const divisionCosts = calculateDivisionCosts(assumptions.treasury, salaryGrowth, companyTaxMultiplier, years);
    results.byDivision.Treasury = {
      costs: divisionCosts.map(d => -d.cost),
      headcount: divisionCosts.map(d => d.headcount),
      details: divisionCosts.map(d => d.details)
    };
  }

  // Central Functions departments
  if (assumptions.centralFunctions && assumptions.centralFunctions.departments) {
    Object.entries(assumptions.centralFunctions.departments).forEach(([deptKey, deptData]) => {
      const deptCosts = calculateDivisionCosts(deptData, salaryGrowth, companyTaxMultiplier, years);
      
      results.byDepartment[deptKey] = {
        costs: deptCosts.map(d => -d.cost), // Negative for P&L
        headcount: deptCosts.map(d => d.headcount),
        details: deptCosts.map(d => d.details)
      };
      
      // Add to central functions total
      results.centralFunctionsTotal = results.centralFunctionsTotal.map((total, i) => 
        total - deptCosts[i].cost
      );
    });
  }

  // Calculate total costs and headcount
  results.totalCosts = years.map((_, i) => {
    let totalCost = 0;
    
    // Add business and structural division costs
    Object.values(results.byDivision).forEach(division => {
      totalCost += division.costs[i];
    });
    
    // Add central functions costs
    totalCost += results.centralFunctionsTotal[i];
    
    return totalCost;
  });

  results.totalHeadcount = years.map((_, i) => {
    let totalHeadcount = 0;
    
    // Add business and structural division headcount
    Object.values(results.byDivision).forEach(division => {
      totalHeadcount += division.headcount[i];
    });
    
    // Add central functions headcount
    Object.values(results.byDepartment).forEach(dept => {
      totalHeadcount += dept.headcount[i];
    });
    
    return totalHeadcount;
  });

  
  console.log('=== calculatePersonnelCosts END ===');
  console.log('Final results summary:', {
    totalCostsY1: results.totalCosts[0],
    divisionCount: Object.keys(results.byDivision).length,
    divisions: Object.keys(results.byDivision)
  });
  
  return results;
};