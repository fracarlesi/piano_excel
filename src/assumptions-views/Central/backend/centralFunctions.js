// Central Functions Configuration
export const centralFunctionsAssumptions = {
  // Non-personnel costs that remain separate
  facilitiesCostsY1: 3.0, // Headquarters, central facilities
  externalServicesY1: 2.5, // External consultants, legal services, etc.
  regulatoryFeesY1: 1.8, // Regulatory fees and contributions
  otherCentralCostsY1: 1.2, // Other central costs
  
  // Staffing by department
  departments: {
    CEOOffice: {
      headcountGrowth: 1, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 1, ralPerHead: 40 },
        { level: 'Middle', count: 1, ralPerHead: 60 },
        { level: 'Senior', count: 1, ralPerHead: 100 },
        { level: 'Head of', count: 1, ralPerHead: 250 }
      ]
    },
    Finance: {
      headcountGrowth: 3, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 3, ralPerHead: 35 },
        { level: 'Middle', count: 2, ralPerHead: 50 },
        { level: 'Senior', count: 2, ralPerHead: 70 },
        { level: 'Head of', count: 1, ralPerHead: 120 }
      ]
    },
    Risk: {
      headcountGrowth: 4, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 2, ralPerHead: 35 },
        { level: 'Middle', count: 2, ralPerHead: 50 },
        { level: 'Senior', count: 1, ralPerHead: 70 },
        { level: 'Head of', count: 1, ralPerHead: 110 }
      ]
    },
    Legal: {
      headcountGrowth: 2, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 2, ralPerHead: 35 },
        { level: 'Middle', count: 1, ralPerHead: 50 },
        { level: 'Senior', count: 1, ralPerHead: 70 },
        { level: 'Head of', count: 1, ralPerHead: 100 }
      ]
    },
    Compliance: {
      headcountGrowth: 3, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 2, ralPerHead: 35 },
        { level: 'Middle', count: 1, ralPerHead: 50 },
        { level: 'Senior', count: 1, ralPerHead: 65 },
        { level: 'Head of', count: 1, ralPerHead: 100 }
      ]
    },
    HR: {
      headcountGrowth: 5, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 2, ralPerHead: 30 },
        { level: 'Middle', count: 1, ralPerHead: 45 },
        { level: 'Senior', count: 1, ralPerHead: 60 },
        { level: 'Head of', count: 1, ralPerHead: 90 }
      ]
    },
    Marketing: {
      headcountGrowth: 6, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 2, ralPerHead: 30 },
        { level: 'Middle', count: 1, ralPerHead: 45 },
        { level: 'Senior', count: 1, ralPerHead: 60 },
        { level: 'Head of', count: 1, ralPerHead: 90 }
      ]
    },
    Operations: {
      headcountGrowth: 4, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 3, ralPerHead: 30 },
        { level: 'Middle', count: 2, ralPerHead: 45 },
        { level: 'Senior', count: 1, ralPerHead: 60 },
        { level: 'Head of', count: 1, ralPerHead: 90 }
      ]
    },
    InternalAudit: {
      headcountGrowth: 2, // % annual headcount growth
      staffing: [
        { level: 'Junior', count: 1, ralPerHead: 35 },
        { level: 'Middle', count: 1, ralPerHead: 50 },
        { level: 'Senior', count: 1, ralPerHead: 65 },
        { level: 'Head of', count: 1, ralPerHead: 100 }
      ]
    }
  }
};