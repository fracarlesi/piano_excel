/**
 * Tech Division Backend Exports
 * 
 * Main entry point for Tech division financial calculations
 */

const TechPnLOrchestrator = require('./pnl/TechPnLOrchestrator');

module.exports = {
  // P&L Orchestrator - use specialized Tech version
  PnLOrchestrator: TechPnLOrchestrator,
  
  // Individual calculators for external use
  TechServiceRevenueCalculator: require('./pnl/commission-income/TechServiceRevenueCalculator'),
  TechAllocationRevenueCalculator: require('./pnl/commission-income/TechAllocationRevenueCalculator'),
  TechOperatingCostsCalculator: require('./pnl/operating-costs/TechOperatingCostsCalculator'),
  TechDepreciationCalculator: require('./pnl/operating-costs/TechDepreciationCalculator'),
  TechExitGainCalculator: require('./pnl/extraordinary-items/TechExitGainCalculator')
};