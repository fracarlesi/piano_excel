// IT Services and Infrastructure for Tech Division
export const techProducts = {
  // IT Infrastructure Costs
  infrastructure: {
    name: 'Infrastructure & Hardware',
    productType: 'ITService',
    category: 'infrastructure',
    costType: 'capex',
    depreciationYears: 5,
    costArray: [5, 8, 12, 15, 18, 20, 22, 24, 26, 28], // €M per year
    description: 'Server, data center, network equipment, storage systems',
    allocationMethod: 'transactions', // usage, headcount, transactions
    markupPercentage: 10, // Default markup for internal charging
  },
  
  softwareLicenses: {
    name: 'Software & Licenses',
    productType: 'ITService',
    category: 'software',
    costType: 'mixed', // some capex, some opex
    depreciationYears: 3,
    costArray: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55], // €M per year
    capexPercentage: 40, // % of costs that are capitalizable
    description: 'Enterprise licenses (Oracle, SAP, Microsoft), security software, development tools',
    allocationMethod: 'headcount',
    markupPercentage: 15,
  },
  
  developmentProjects: {
    name: 'Development & Digital Transformation',
    productType: 'ITService',
    category: 'development',
    costType: 'capex',
    depreciationYears: 5,
    costArray: [15, 25, 35, 40, 45, 50, 55, 60, 65, 70], // €M per year
    description: 'Application development, API integration, digital transformation projects',
    allocationMethod: 'usage', // Best for development projects
    markupPercentage: 20,
  },
  
  cloudServices: {
    name: 'Cloud & External Services',
    productType: 'ITService',
    category: 'cloud',
    costType: 'opex',
    depreciationYears: 0, // No depreciation for opex
    costArray: [8, 12, 18, 25, 35, 45, 55, 65, 75, 85], // €M per year
    description: 'AWS, Azure, GCP, SaaS subscriptions, external consultancy',
    allocationMethod: 'transactions', // Cloud scales with usage
    markupPercentage: 5,
  },
  
  maintenanceSupport: {
    name: 'Maintenance & Support',
    productType: 'ITService',
    category: 'maintenance',
    costType: 'opex',
    depreciationYears: 0,
    costArray: [5, 7, 10, 12, 15, 18, 20, 22, 25, 28], // €M per year
    description: 'System maintenance, helpdesk, technical support, security operations',
    allocationMethod: 'headcount',
    markupPercentage: 10,
  },
  
  // Unified IT Services Revenue Stream (Post-Exit)
  postExitServices: {
    name: 'Post-Exit IT Services',
    productType: 'ITRevenue',
    category: 'services',
    // Service pricing model - same for all clients
    setupFeePerClient: 0.5, // €M one-time setup per client
    annualFeePerClient: 50.0, // €M recurring per client per year
    annualGrowthRate: 3, // % annual fee increase
    marginPercentage: 30, // Profit margin on all services
    
    // Total clients array (bank mother is client #1)
    // Year 0-4: no external revenue (pre-exit)
    // Year 5+: bank mother + external clients
    totalClientsArray: [0, 0, 0, 0, 0, 1, 2, 4, 7, 10], // Total clients including bank
    
    description: 'IT services pricing: all clients have same contract terms, bank mother is the first client',
  },
  
  // Division Exit Strategy
  divisionExit: {
    name: 'Tech Division Exit',
    productType: 'Exit',
    exitYear: 5, // Year of planned exit (0 = no exit)
    exitPercentage: 40, // % of division to sell (0-100)
    valuationMultiple: 2.5, // Multiple of annual revenue
    retainedStakeRevenue: true, // Bank always receives % of profits from retained stake
    unamortizedAssetTreatment: 'transfer', // Always transfer to buyer at book value
    description: 'Partial sale of Tech division to external investor - 100% cash payment at closing',
  }
};

// Division-specific allocation keys
export const techAllocationKeys = {
  usage: {
    central: 10,
    digital: 25,
    wealth: 15,
    sme: 15,
    realEstate: 10,
    incentive: 5,
    treasury: 10,
    general: 10,
  },
  headcount: {
    central: 15,
    digital: 20,
    wealth: 20,
    sme: 15,
    realEstate: 10,
    incentive: 5,
    treasury: 5,
    general: 10,
  },
  transactions: {
    central: 5,
    digital: 40,
    wealth: 15,
    sme: 20,
    realEstate: 10,
    incentive: 3,
    treasury: 2,
    general: 5,
  }
};