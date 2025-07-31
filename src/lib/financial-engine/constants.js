/**
 * Financial Engine Constants
 * Central repository for all business constants and configurations
 */

// Time Constants
export const YEARS = [2025, 2026, 2027, 2028, 2029];
export const QUARTERS_PER_YEAR = 4;
export const MONTHS_PER_YEAR = 12;

// Business Rules
export const DEFAULT_TAX_RATE = 28;
export const DEFAULT_COST_OF_FUNDS = 3.0;
export const DEFAULT_EURIBOR = 3.5;
export const DEFAULT_FTP_SPREAD = 1.5;

// Capital Requirements
export const MINIMUM_CET1_RATIO = 10.5;
export const MINIMUM_TOTAL_CAPITAL_RATIO = 14.0;

// Risk Weights
export const RISK_WEIGHTS = {
  SECURED_REAL_ESTATE: 35,
  SECURED_SME: 50,
  UNSECURED_CORPORATE: 100,
  UNSECURED_RETAIL: 75,
  DIGITAL_DEPOSITS: 0,
  TREASURY_BONDS: 0,
  LIQUIDITY_BUFFER: 20
};

// Product Types
export const PRODUCT_TYPES = {
  AMORTIZING: 'Amortizing',
  BULLET: 'Bullet',
  DEPOSIT_AND_SERVICE: 'DepositAndService',
  COMMISSION: 'Commission',
  CREDIT_LINE: 'CreditLine'
};

// Division Types
export const DIVISION_TYPES = {
  BUSINESS: 'business',
  STRUCTURAL: 'structural',
  SUPPORT: 'support'
};

// Precision Settings
export const DECIMAL_PRECISION = 10; // Decimal places for calculations
export const DISPLAY_PRECISION = 2;  // Decimal places for display

export default {
  YEARS,
  QUARTERS_PER_YEAR,
  MONTHS_PER_YEAR,
  DEFAULT_TAX_RATE,
  DEFAULT_COST_OF_FUNDS,
  DEFAULT_EURIBOR,
  DEFAULT_FTP_SPREAD,
  MINIMUM_CET1_RATIO,
  MINIMUM_TOTAL_CAPITAL_RATIO,
  RISK_WEIGHTS,
  PRODUCT_TYPES,
  DIVISION_TYPES,
  DECIMAL_PRECISION,
  DISPLAY_PRECISION
};