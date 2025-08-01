/**
 * Recovery-Default Microservices Index
 * 
 * CENTRAL EXPORT per tutti i microservizi recovery-default
 * Utilizzato dal financial engine per calcolare recovery su nuovi defaults
 */

// Main orchestrator
export { 
  calculateRecoveryDefault, 
  getRecoveryBalanceSheetData 
} from './RecoveryOrchestrator.js';

// Individual calculators
export { 
  calculateCollateralRecovery,
  calculateCollateralRecoveryDistribution,
  validateCollateralRecoveryParams,
  formatCollateralRecoveryReport
} from './CollateralRecoveryCalculator.js';

export { 
  calculateStateGuaranteeRecovery,
  calculateStateGuaranteeRecoveryDistribution,
  validateStateGuaranteeParams,
  formatStateGuaranteeRecoveryReport,
  getAvailableStateGuaranteeTypes
} from './StateGuaranteeRecoveryCalculator.js';

export { 
  calculateRecoveryTiming,
  validateRecoveryTiming,
  formatRecoveryTimingReport,
  getRecoveryTimingBenchmarks
} from './RecoveryTimingCalculator.js';

/**
 * USAGE EXAMPLE:
 * 
 * import { calculateRecoveryDefault } from './recovery-default/index.js';
 * 
 * const recoveryResults = calculateRecoveryDefault(
 *   divisions,          // Divisions with products and default flows
 *   assumptions,        // Global assumptions
 *   quarters,           // Number of quarters to project
 *   totalAssetsResults  // Results from TotalAssetsOrchestrator (with GBV defaulted data)
 * );
 * 
 * // Results include:
 * // - recoveryResults.balanceSheetLine.quarterly = array of recovery amounts per quarter
 * // - recoveryResults.byRecoveryType = breakdown by collateral vs state guarantee
 * // - recoveryResults.byProduct = product-level recovery details
 * // - recoveryResults.consolidatedMetrics = summary metrics
 */