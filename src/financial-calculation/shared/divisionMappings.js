/**
 * Centralized Division Mappings
 * 
 * This file contains all the division mappings used throughout the application.
 * Having a single source of truth prevents inconsistencies and bugs.
 */

// Division prefixes used in products and throughout the app
export const DIVISION_PREFIXES = {
  REAL_ESTATE: 're',
  SME: 'sme',
  DIGITAL: 'digital',
  WEALTH: 'wealth',
  TECH: 'tech',
  INCENTIVE: 'incentive',
  CENTRAL: 'central',
  CF: 'cf', // Central Functions alias
  TREASURY: 'treasury'
};

// All division prefixes as an array (excluding aliases)
export const ALL_DIVISION_PREFIXES = [
  DIVISION_PREFIXES.REAL_ESTATE,
  DIVISION_PREFIXES.SME,
  DIVISION_PREFIXES.DIGITAL,
  DIVISION_PREFIXES.WEALTH,
  DIVISION_PREFIXES.TECH,
  DIVISION_PREFIXES.INCENTIVE,
  DIVISION_PREFIXES.CF, // Use 'cf' as the main identifier for central functions
  DIVISION_PREFIXES.TREASURY
];

// Business divisions (revenue-generating)
export const BUSINESS_DIVISION_PREFIXES = [
  DIVISION_PREFIXES.REAL_ESTATE,
  DIVISION_PREFIXES.SME,
  DIVISION_PREFIXES.DIGITAL,
  DIVISION_PREFIXES.WEALTH,
  DIVISION_PREFIXES.TECH,
  DIVISION_PREFIXES.INCENTIVE
];

// Structural divisions (support functions)
export const STRUCTURAL_DIVISION_PREFIXES = [
  DIVISION_PREFIXES.CENTRAL,
  DIVISION_PREFIXES.TREASURY
];

// Mapping from division prefix to assumption key in the data
export const DIVISION_TO_ASSUMPTION_KEY = {
  [DIVISION_PREFIXES.REAL_ESTATE]: 'realEstateDivision',
  [DIVISION_PREFIXES.SME]: 'smeDivision',
  [DIVISION_PREFIXES.DIGITAL]: 'digitalBankingDivision',
  [DIVISION_PREFIXES.WEALTH]: 'wealthDivision',  // NOTA: era 'wealthManagementDivision' in alcuni punti
  [DIVISION_PREFIXES.TECH]: 'techDivision',      // NOTA: era 'techPlatformDivision' in alcuni punti
  [DIVISION_PREFIXES.INCENTIVE]: 'incentiveDivision', // NOTA: era 'incentiveFinanceDivision' in alcuni punti
  [DIVISION_PREFIXES.CENTRAL]: 'centralFunctions',
  [DIVISION_PREFIXES.CF]: 'centralFunctions', // Alias for central functions
  [DIVISION_PREFIXES.TREASURY]: 'treasury'
};

// Mapping from division prefix to personnel calculator key
export const DIVISION_TO_PERSONNEL_KEY = {
  [DIVISION_PREFIXES.REAL_ESTATE]: 'RealEstateFinancing',
  [DIVISION_PREFIXES.SME]: 'SMEFinancing',
  [DIVISION_PREFIXES.DIGITAL]: 'DigitalBanking',
  [DIVISION_PREFIXES.WEALTH]: 'WealthAndAssetManagement',
  [DIVISION_PREFIXES.TECH]: 'Tech',
  [DIVISION_PREFIXES.INCENTIVE]: 'Incentives',
  [DIVISION_PREFIXES.CENTRAL]: 'CentralFunctions',
  [DIVISION_PREFIXES.CF]: 'CentralFunctions', // Alias
  [DIVISION_PREFIXES.TREASURY]: 'Treasury'
};

// Human-readable division names
export const DIVISION_DISPLAY_NAMES = {
  [DIVISION_PREFIXES.REAL_ESTATE]: 'Real Estate Financing',
  [DIVISION_PREFIXES.SME]: 'SME Financing',
  [DIVISION_PREFIXES.DIGITAL]: 'Digital Banking',
  [DIVISION_PREFIXES.WEALTH]: 'Wealth & Asset Management',
  [DIVISION_PREFIXES.TECH]: 'Tech Platform',
  [DIVISION_PREFIXES.INCENTIVE]: 'Incentive Finance',
  [DIVISION_PREFIXES.CENTRAL]: 'Central Functions',
  [DIVISION_PREFIXES.CF]: 'Central Functions', // Alias
  [DIVISION_PREFIXES.TREASURY]: 'Treasury / ALM'
};

// Helper function to get assumption key from prefix
export const getAssumptionKey = (prefix) => DIVISION_TO_ASSUMPTION_KEY[prefix];

// Helper function to get personnel key from prefix
export const getPersonnelKey = (prefix) => DIVISION_TO_PERSONNEL_KEY[prefix];

// Helper function to get display name from prefix
export const getDisplayName = (prefix) => DIVISION_DISPLAY_NAMES[prefix];