/**
 * Non-Performing Assets Module
 * 
 * Esporta tutte le funzionalità per il calcolo dei Non-Performing Assets
 */

export { calculateNonPerformingAssets, getNPABalanceSheetData } from './NonPerformingAssetsOrchestrator.js';
export { calculateRecoveryNPV, calculateCohortNPV, calculateNPVEvolution } from './NPVCalculator.js';