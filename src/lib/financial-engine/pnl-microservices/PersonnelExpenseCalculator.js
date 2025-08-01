/**
 * Personnel Expense Calculator Microservice
 * 
 * Responsible for calculating all personnel-related costs across all divisions
 * Includes salaries, social charges, bonuses, and other employee benefits
 */

/**
 * Main entry point for Personnel Expense calculation
 * @param {Object} divisions - Division configurations with staffing
 * @param {Object} assumptions - Global assumptions including personnel parameters
 * @param {Array} years - Array of year indices
 * @returns {Object} Personnel expenses by division and consolidated
 */
export const calculatePersonnelExpenses = (divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      headcount: new Array(10).fill(0)
    },
    byComponent: {
      baseSalaries: new Array(10).fill(0),
      socialCharges: new Array(10).fill(0),
      bonuses: new Array(10).fill(0),
      otherBenefits: new Array(10).fill(0)
    },
    byLevel: {
      junior: { costs: new Array(10).fill(0), headcount: new Array(10).fill(0) },
      middle: { costs: new Array(10).fill(0), headcount: new Array(10).fill(0) },
      senior: { costs: new Array(10).fill(0), headcount: new Array(10).fill(0) },
      headOf: { costs: new Array(10).fill(0), headcount: new Array(10).fill(0) }
    }
  };

  // Global personnel parameters
  const annualSalaryReview = assumptions.personnel?.annualSalaryReview / 100 || 0.025;
  const companyTaxMultiplier = assumptions.personnel?.companyTaxMultiplier || 1.4;

  // Process each division
  Object.entries(divisions).forEach(([divisionKey, divisionConfig]) => {
    const divisionResults = calculateDivisionPersonnelCosts(
      divisionKey,
      divisionConfig,
      assumptions,
      years,
      annualSalaryReview,
      companyTaxMultiplier
    );

    results.byDivision[divisionKey] = divisionResults;

    // Aggregate to consolidated level
    divisionResults.annual.forEach((cost, year) => {
      results.consolidated.annual[year] += cost;
      results.consolidated.headcount[year] += divisionResults.headcount[year];

      // By component
      results.byComponent.baseSalaries[year] += divisionResults.components.baseSalaries[year];
      results.byComponent.socialCharges[year] += divisionResults.components.socialCharges[year];
      results.byComponent.bonuses[year] += divisionResults.components.bonuses[year];
      results.byComponent.otherBenefits[year] += divisionResults.components.otherBenefits[year];

      // By level
      Object.entries(divisionResults.byLevel).forEach(([level, data]) => {
        results.byLevel[level].costs[year] += data.costs[year];
        results.byLevel[level].headcount[year] += data.headcount[year];
      });
    });

    // Quarterly aggregation
    divisionResults.quarterly.forEach((cost, quarter) => {
      results.consolidated.quarterly[quarter] += cost;
    });
  });

  return results;
};

/**
 * Calculate personnel costs for a specific division
 */
const calculateDivisionPersonnelCosts = (
  divisionKey,
  divisionConfig,
  assumptions,
  years,
  annualSalaryReview,
  companyTaxMultiplier
) => {
  const result = {
    annual: new Array(10).fill(0),
    quarterly: new Array(40).fill(0),
    headcount: new Array(10).fill(0),
    components: {
      baseSalaries: new Array(10).fill(0),
      socialCharges: new Array(10).fill(0),
      bonuses: new Array(10).fill(0),
      otherBenefits: new Array(10).fill(0)
    },
    byLevel: {
      junior: { costs: new Array(10).fill(0), headcount: new Array(10).fill(0) },
      middle: { costs: new Array(10).fill(0), headcount: new Array(10).fill(0) },
      senior: { costs: new Array(10).fill(0), headcount: new Array(10).fill(0) },
      headOf: { costs: new Array(10).fill(0), headcount: new Array(10).fill(0) }
    }
  };

  // Get division-specific configuration
  const divisionData = getDivisionConfiguration(divisionKey, divisionConfig, assumptions);
  if (!divisionData) return result;

  const { staffing, headcountGrowth } = divisionData;
  const growthRate = headcountGrowth / 100 || 0;

  // Calculate for each year
  years.forEach(year => {
    let totalHeadcount = 0;
    let totalBaseSalary = 0;

    // Process each staffing level
    staffing.forEach(({ level, count, ralPerHead }) => {
      // Calculate headcount with growth (only Junior and Middle grow)
      let headcount = count;
      if (year > 0 && (level === 'Junior' || level === 'Middle')) {
        headcount = count * Math.pow(1 + growthRate, year);
      }

      // Calculate RAL with annual salary increases
      const adjustedRAL = ralPerHead * Math.pow(1 + annualSalaryReview, year);

      // Calculate costs
      const baseSalary = headcount * adjustedRAL / 1000; // Convert to millions
      const totalCost = baseSalary * companyTaxMultiplier;

      // Store by level
      const levelKey = level.toLowerCase().replace(/\s+/g, '').replace('headof', 'headOf');
      if (result.byLevel[levelKey]) {
        result.byLevel[levelKey].headcount[year] = Math.round(headcount);
        result.byLevel[levelKey].costs[year] = -totalCost; // Negative for expense
      }

      totalHeadcount += headcount;
      totalBaseSalary += baseSalary;
    });

    // Calculate components
    result.components.baseSalaries[year] = -totalBaseSalary;
    result.components.socialCharges[year] = -totalBaseSalary * (companyTaxMultiplier - 1);
    
    // Simple bonus calculation (could be more sophisticated)
    const bonusRate = divisionKey === 'wealth' ? 0.2 : 0.1; // Higher bonus for wealth division
    result.components.bonuses[year] = -totalBaseSalary * bonusRate;

    // Total costs
    result.annual[year] = -totalBaseSalary * companyTaxMultiplier * (1 + bonusRate);
    result.headcount[year] = Math.round(totalHeadcount);
  });

  // Quarterly distribution
  for (let q = 0; q < 40; q++) {
    const year = Math.floor(q / 4);
    if (year < 10) {
      result.quarterly[q] = result.annual[year] / 4;
    }
  }

  return result;
};

/**
 * Get division configuration from various possible locations
 */
const getDivisionConfiguration = (divisionKey, divisionConfig, assumptions) => {
  // Map division keys to assumption keys
  const divisionMappings = {
    're': 'realEstateDivision',
    'realEstate': 'realEstateDivision',
    'sme': 'smeDivision',
    'wealth': 'wealthDivision',
    'incentive': 'incentiveDivision',
    'digital': 'digitalBankingDivision',
    'tech': 'techDivision',
    'central': 'centralFunctions',
    'treasury': 'treasuryDivision'
  };

  const assumptionKey = divisionMappings[divisionKey];
  if (!assumptionKey) return null;

  const divisionAssumptions = assumptions[assumptionKey];
  if (!divisionAssumptions) return null;

  // For central functions, aggregate all departments
  if (divisionKey === 'central' && divisionAssumptions.departments) {
    const aggregatedStaffing = [];
    const levelMap = new Map();

    Object.values(divisionAssumptions.departments).forEach(dept => {
      if (dept.staffing) {
        dept.staffing.forEach(({ level, count, ralPerHead }) => {
          if (levelMap.has(level)) {
            const existing = levelMap.get(level);
            existing.count += count;
            // Weighted average RAL
            existing.totalRAL += count * ralPerHead;
            existing.totalCount += count;
          } else {
            levelMap.set(level, {
              level,
              count,
              totalRAL: count * ralPerHead,
              totalCount: count
            });
          }
        });
      }
    });

    // Convert map to array with weighted average RAL
    levelMap.forEach(data => {
      aggregatedStaffing.push({
        level: data.level,
        count: data.count,
        ralPerHead: data.totalRAL / data.totalCount
      });
    });

    return {
      staffing: aggregatedStaffing,
      headcountGrowth: divisionAssumptions.departments.CEOOffice?.headcountGrowth || 2
    };
  }

  // Treasury might need special handling
  if (divisionKey === 'treasury' && !divisionAssumptions.staffing) {
    // Default treasury staffing if not defined
    return {
      staffing: [
        { level: 'Junior', count: 3, ralPerHead: 35 },
        { level: 'Middle', count: 2, ralPerHead: 50 },
        { level: 'Senior', count: 2, ralPerHead: 70 },
        { level: 'Head of', count: 1, ralPerHead: 120 }
      ],
      headcountGrowth: 3
    };
  }

  return {
    staffing: divisionAssumptions.staffing || [],
    headcountGrowth: divisionAssumptions.headcountGrowth || 0
  };
};