/**
 * Net Performing Assets Module
 * 
 * Esporta tutte le funzionalità per il calcolo dei Net Performing Assets
 */

export { calculateNetPerformingAssets, getNetPerformingBalanceSheetData } from './NetPerformingAssetsOrchestrator.js';
export { 
  calculateProductNetPerforming, 
  calculateAggregateNetPerforming,
  calculateByProductType,
  calculateQuarterlyChanges 
} from './NetPerformingAssetsCalculator.js';