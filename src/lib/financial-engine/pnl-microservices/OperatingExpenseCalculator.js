/**
 * Operating Expense Calculator Microservice
 * 
 * Responsible for calculating all non-personnel operating expenses
 * Includes IT costs, facilities, regulatory fees, external services, etc.
 */

/**
 * Main entry point for Operating Expense calculation
 * @param {Object} divisions - All division data
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Operating expenses by division and consolidated
 */
export const calculateOperatingExpenses = (divisions, assumptions, years) => {
  const results = {
    byDivision: {},
    consolidated: {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0)
    },
    byCategory: {
      itCosts: new Array(10).fill(0),
      facilities: new Array(10).fill(0),
      externalServices: new Array(10).fill(0),
      regulatoryFees: new Array(10).fill(0),
      marketing: new Array(10).fill(0),
      dataAndSystems: new Array(10).fill(0),
      otherOpex: new Array(10).fill(0)
    },
    allocations: {
      hqAllocation: new Array(10).fill(0),
      sharedServices: new Array(10).fill(0)
    }
  };

  // Cost growth rate
  const costGrowth = years.map(i => Math.pow(1 + (assumptions.costGrowthRate || 10) / 100, i));

  // Calculate central/shared costs first
  const centralCosts = calculateCentralCosts(assumptions, years, costGrowth);
  const itCosts = calculateITCosts(assumptions, years, costGrowth);
  const hqAllocation = calculateHQAllocation(assumptions, years, costGrowth);

  // Store central costs
  results.byCategory.facilities = centralCosts.facilities;
  results.byCategory.externalServices = centralCosts.externalServices;
  results.byCategory.regulatoryFees = centralCosts.regulatoryFees;
  results.byCategory.itCosts = itCosts.total;
  results.allocations.hqAllocation = hqAllocation;

  // Calculate total RWA for allocation
  const totalRWA = calculateTotalRWA(divisions, years);

  // Process each division
  Object.entries(divisions).forEach(([divisionKey, division]) => {
    const divisionExpenses = {
      annual: new Array(10).fill(0),
      quarterly: new Array(40).fill(0),
      categories: {},
      directCosts: new Array(10).fill(0),
      allocatedCosts: new Array(10).fill(0)
    };

    // Direct division costs (if any)
    if (division.directOpex) {
      divisionExpenses.directCosts = years.map(year => 
        -division.directOpex * costGrowth[year]
      );
    }

    // Allocated costs based on RWA
    if (divisionKey !== 'central' && divisionKey !== 'treasury') {
      const divisionRWA = division.capital?.rwaCreditRisk || new Array(10).fill(0);
      
      years.forEach(year => {
        const rwaWeight = totalRWA[year] > 0 ? divisionRWA[year] / totalRWA[year] : 0;
        
        // Allocate IT costs
        const allocatedIT = itCosts.total[year] * rwaWeight;
        
        // Allocate HQ costs
        const allocatedHQ = hqAllocation[year] * rwaWeight;
        
        divisionExpenses.allocatedCosts[year] = allocatedIT + allocatedHQ;
        divisionExpenses.categories.itCosts = allocatedIT;
        divisionExpenses.categories.hqAllocation = allocatedHQ;
      });
    }

    // Special handling for central division
    if (divisionKey === 'central') {
      divisionExpenses.annual = centralCosts.total;
      divisionExpenses.categories = {
        facilities: centralCosts.facilities,
        externalServices: centralCosts.externalServices,
        regulatoryFees: centralCosts.regulatoryFees,
        other: centralCosts.other
      };
    }

    // Special handling for treasury
    if (divisionKey === 'treasury') {
      divisionExpenses.annual = years.map(year => -2 * costGrowth[year]); // Simplified treasury opex
      divisionExpenses.categories.dataAndSystems = divisionExpenses.annual;
    }

    // Total division expenses
    if (divisionKey !== 'central' && divisionKey !== 'treasury') {
      divisionExpenses.annual = years.map(year => 
        divisionExpenses.directCosts[year] + divisionExpenses.allocatedCosts[year]
      );
    }

    // Quarterly distribution
    for (let q = 0; q < 40; q++) {
      const year = Math.floor(q / 4);
      if (year < 10) {
        divisionExpenses.quarterly[q] = divisionExpenses.annual[year] / 4;
      }
    }

    results.byDivision[divisionKey] = divisionExpenses;

    // Aggregate to consolidated
    divisionExpenses.annual.forEach((expense, year) => {
      results.consolidated.annual[year] += expense;
    });
    divisionExpenses.quarterly.forEach((expense, quarter) => {
      results.consolidated.quarterly[quarter] += expense;
    });
  });

  // Add other consolidated categories
  results.byCategory.otherOpex = years.map(year => 
    results.consolidated.annual[year] - 
    results.byCategory.itCosts[year] -
    results.byCategory.facilities[year] -
    results.byCategory.externalServices[year] -
    results.byCategory.regulatoryFees[year] -
    results.byCategory.marketing[year] -
    results.byCategory.dataAndSystems[year]
  );

  return results;
};

/**
 * Calculate central costs
 */
const calculateCentralCosts = (assumptions, years, costGrowth) => {
  const cf = assumptions.centralFunctions || {};
  
  return {
    facilities: years.map(i => -(cf.facilitiesCostsY1 || 3.0) * costGrowth[i]),
    externalServices: years.map(i => -(cf.externalServicesY1 || 2.5) * costGrowth[i]),
    regulatoryFees: years.map(i => -(cf.regulatoryFeesY1 || 1.8) * costGrowth[i]),
    other: years.map(i => -(cf.otherCentralCostsY1 || 1.2) * costGrowth[i]),
    total: years.map(i => 
      -(cf.facilitiesCostsY1 || 3.0) * costGrowth[i] +
      -(cf.externalServicesY1 || 2.5) * costGrowth[i] +
      -(cf.regulatoryFeesY1 || 1.8) * costGrowth[i] +
      -(cf.otherCentralCostsY1 || 1.2) * costGrowth[i]
    )
  };
};

/**
 * Calculate IT costs
 */
const calculateITCosts = (assumptions, years, costGrowth) => {
  const baseIT = assumptions.itCostsY1 || 4;
  
  return {
    infrastructure: years.map(i => -(baseIT * 0.4) * costGrowth[i]),
    applications: years.map(i => -(baseIT * 0.3) * costGrowth[i]),
    security: years.map(i => -(baseIT * 0.2) * costGrowth[i]),
    innovation: years.map(i => -(baseIT * 0.1) * costGrowth[i]),
    total: years.map(i => -baseIT * costGrowth[i])
  };
};

/**
 * Calculate HQ allocation
 */
const calculateHQAllocation = (assumptions, years, costGrowth) => {
  const baseHQ = assumptions.hqAllocationY1 || 2.5;
  return years.map(i => -baseHQ * costGrowth[i]);
};

/**
 * Calculate total RWA for allocation purposes
 */
const calculateTotalRWA = (divisions, years) => {
  const totalRWA = new Array(10).fill(0);
  
  Object.values(divisions).forEach(division => {
    if (division.capital?.rwaCreditRisk) {
      division.capital.rwaCreditRisk.forEach((rwa, year) => {
        totalRWA[year] += rwa;
      });
    }
  });
  
  return totalRWA;
};

/**
 * Calculate total operating expenses (personnel + other opex)
 */
export const calculateTotalOperatingExpenses = (personnelExpenses, operatingExpenses) => {
  return {
    annual: personnelExpenses.consolidated.annual.map((personnel, i) => 
      personnel + operatingExpenses.consolidated.annual[i]
    ),
    quarterly: personnelExpenses.consolidated.quarterly.map((personnel, i) => 
      personnel + operatingExpenses.consolidated.quarterly[i]
    ),
    byDivision: Object.keys(personnelExpenses.byDivision).reduce((acc, divKey) => {
      acc[divKey] = {
        annual: personnelExpenses.byDivision[divKey].annual.map((personnel, i) => 
          personnel + (operatingExpenses.byDivision[divKey]?.annual[i] || 0)
        ),
        quarterly: personnelExpenses.byDivision[divKey].quarterly.map((personnel, i) => 
          personnel + (operatingExpenses.byDivision[divKey]?.quarterly[i] || 0)
        )
      };
      return acc;
    }, {}),
    components: {
      personnel: personnelExpenses.consolidated.annual,
      otherOpex: operatingExpenses.consolidated.annual,
      byCategory: {
        ...personnelExpenses.byComponent,
        ...operatingExpenses.byCategory
      }
    }
  };
};