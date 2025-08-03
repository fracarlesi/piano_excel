// General bank-level assumptions
export const generalAssumptions = {
  version: '15.12', // Updated navigation order: credit divisions first
  initialEquity: 200,
  taxRate: 28,
  costOfFundsRate: 3.0,
  euribor: 2.0, // Default EURIBOR - overridden by Firebase value in General Settings
  quarterlyAllocation: [25, 25, 25, 25], // % di erogazioni per Q1, Q2, Q3, Q4
  hqAllocationY1: 2.5,
  itCostsY1: 4,
  costGrowthRate: 10,
  depositRate: 1.0, // Default deposit rate
  ftpSpread: 1.5, // Default FTP spread
};