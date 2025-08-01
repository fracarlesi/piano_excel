/**
 * NPL Stock Unwinding Calculator Microservice
 * 
 * MICROSERVIZIO AUTONOMO per calcolare lo smontamento progressivo dello stock NPL
 * man mano che arrivano i recuperi effettivi
 * 
 * Input: NPL stock iniziale + flussi di recovery
 * Output: Stock NPL residuo per ogni trimestre
 */

/**
 * Calcola smontamento stock NPL con recuperi
 * @param {Object} nplNBVResults - Results da NPLNBVCalculator
 * @param {Object} recoveryResults - Results da NPLRecoveryCalculator
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero trimestri (default 40)
 * @returns {Object} Stock unwinding results
 */
export const calculateNPLStockUnwinding = (nplNBVResults, recoveryResults, assumptions, quarters = 40) => {
  const results = {
    // Stock NPL residuo dopo recuperi
    quarterlyResidualStock: new Array(quarters).fill(0),
    
    // Tracking smontamento per cohort
    cohortUnwindingSchedule: [],
    
    // Flussi di smontamento trimestrale
    quarterlyUnwindingFlows: new Array(quarters).fill(0),
    
    // Stock breakdown per vintage
    stockByVintage: new Array(quarters).fill(null).map(() => ({})),
    
    // Metrics di smontamento
    unwindingMetrics: {
      totalRecovered: 0,
      totalWriteOffs: 0,
      averageRecoverySpeed: 0,
      residualStockAtEnd: 0,
      peakStock: { quarter: 0, value: 0 }
    },
    
    // Recovery efficiency tracking
    recoveryEfficiency: {
      quarterly: new Array(quarters).fill(0),
      cumulative: new Array(quarters).fill(0)
    }
  };

  // Initialize cohort tracking
  const activeCohorts = initializeCohortTracking(nplNBVResults.nplCohorts);
  let cumulativeRecovered = 0;
  let cumulativeWriteOffs = 0;
  
  // Process each quarter
  for (let quarter = 0; quarter < quarters; quarter++) {
    // Get new NPLs for this quarter
    const newNPLs = nplNBVResults.newNPLsQuarterly[quarter] || 0;
    
    // Get recovery flows for this quarter
    const totalRecoveryFlow = recoveryResults.quarterlyRecoveryFlows[quarter] || 0;
    const stateGuaranteeRecovery = recoveryResults.stateGuaranteeRecovery[quarter] || 0;
    const collateralRecovery = recoveryResults.collateralRecovery[quarter] || 0;
    
    // Add new NPL cohorts
    if (newNPLs > 0) {
      const newCohorts = nplNBVResults.nplCohorts.filter(c => c.creationDate === quarter);
      newCohorts.forEach(cohort => {
        activeCohorts.set(cohort.creationDate, {
          ...cohort,
          remainingStock: cohort.nbvAmount,
          recoveredAmount: 0,
          writtenOff: false,
          age: 0
        });
      });
    }
    
    // Process recovery allocation to cohorts (FIFO approach)
    let remainingRecovery = totalRecoveryFlow;
    const cohortRecoveries = allocateRecoveryToCohorts(
      activeCohorts,
      remainingRecovery,
      quarter,
      stateGuaranteeRecovery,
      collateralRecovery
    );
    
    // Update cohort stocks
    let totalResidualStock = 0;
    let stockByVintage = {};
    
    cohortRecoveries.forEach(recovery => {
      const cohort = activeCohorts.get(recovery.cohortId);
      if (cohort) {
        // Update cohort
        cohort.remainingStock -= recovery.amount;
        cohort.recoveredAmount += recovery.amount;
        cohort.age = quarter - cohort.creationDate;
        
        // Track cumulative recovery
        cumulativeRecovered += recovery.amount;
        results.quarterlyUnwindingFlows[quarter] += recovery.amount;
        
        // Check if cohort should be written off (after 5 years)
        if (cohort.age >= 20 && cohort.remainingStock > 0) {
          cumulativeWriteOffs += cohort.remainingStock;
          cohort.writtenOff = true;
          cohort.remainingStock = 0;
        }
        
        // Aggregate remaining stock
        if (cohort.remainingStock > 0) {
          totalResidualStock += cohort.remainingStock;
          const vintageYear = Math.floor(cohort.creationDate / 4);
          stockByVintage[`Y${vintageYear}`] = (stockByVintage[`Y${vintageYear}`] || 0) + cohort.remainingStock;
        }
      }
    });
    
    // Store results for this quarter
    results.quarterlyResidualStock[quarter] = totalResidualStock;
    results.stockByVintage[quarter] = stockByVintage;
    
    // Calculate recovery efficiency
    const grossNPLStock = nplNBVResults.quarterlyNBV[quarter] || 0;
    results.recoveryEfficiency.quarterly[quarter] = grossNPLStock > 0 
      ? (totalRecoveryFlow / grossNPLStock) * 100 
      : 0;
    results.recoveryEfficiency.cumulative[quarter] = grossNPLStock > 0
      ? (cumulativeRecovered / grossNPLStock) * 100
      : 0;
    
    // Track peak stock
    if (totalResidualStock > results.unwindingMetrics.peakStock.value) {
      results.unwindingMetrics.peakStock = {
        quarter: quarter,
        value: totalResidualStock
      };
    }
  }
  
  // Store cohort unwinding schedule
  results.cohortUnwindingSchedule = Array.from(activeCohorts.values()).map(cohort => ({
    cohortId: cohort.creationDate,
    originalAmount: cohort.nbvAmount,
    recoveredAmount: cohort.recoveredAmount,
    remainingStock: cohort.remainingStock,
    recoveryRate: cohort.nbvAmount > 0 ? (cohort.recoveredAmount / cohort.nbvAmount) * 100 : 0,
    age: cohort.age,
    status: cohort.writtenOff ? 'Written Off' : cohort.remainingStock === 0 ? 'Fully Recovered' : 'Active'
  }));
  
  // Calculate final metrics
  results.unwindingMetrics = {
    totalRecovered: cumulativeRecovered,
    totalWriteOffs: cumulativeWriteOffs,
    averageRecoverySpeed: calculateAverageRecoverySpeed(results.cohortUnwindingSchedule),
    residualStockAtEnd: results.quarterlyResidualStock[quarters - 1],
    peakStock: results.unwindingMetrics.peakStock,
    totalRecoveryRate: calculateTotalRecoveryRate(nplNBVResults, cumulativeRecovered)
  };
  
  return results;
};

/**
 * Initialize cohort tracking map
 * @param {Array} nplCohorts - NPL cohorts from NBV calculator
 * @returns {Map} Cohort tracking map
 */
const initializeCohortTracking = (nplCohorts) => {
  const cohortMap = new Map();
  
  nplCohorts.forEach(cohort => {
    cohortMap.set(cohort.creationDate, {
      ...cohort,
      remainingStock: cohort.nbvAmount,
      recoveredAmount: 0,
      writtenOff: false,
      age: 0
    });
  });
  
  return cohortMap;
};

/**
 * Allocate recovery flows to cohorts (FIFO)
 * @param {Map} activeCohorts - Active cohort map
 * @param {number} totalRecovery - Total recovery amount
 * @param {number} currentQuarter - Current quarter
 * @param {number} stateGuaranteeRecovery - State guarantee portion
 * @param {number} collateralRecovery - Collateral portion
 * @returns {Array} Recovery allocations
 */
const allocateRecoveryToCohorts = (activeCohorts, totalRecovery, currentQuarter, stateGuaranteeRecovery, collateralRecovery) => {
  const allocations = [];
  let remainingRecovery = totalRecovery;
  
  // Sort cohorts by age (FIFO - oldest first)
  const sortedCohorts = Array.from(activeCohorts.values())
    .filter(c => c.remainingStock > 0 && !c.writtenOff)
    .sort((a, b) => a.creationDate - b.creationDate);
  
  // Allocate recovery to each cohort
  for (const cohort of sortedCohorts) {
    if (remainingRecovery <= 0) break;
    
    const recoveryAmount = Math.min(cohort.remainingStock, remainingRecovery);
    
    // Proportional allocation of recovery types
    const stateGuaranteePortion = totalRecovery > 0 
      ? (recoveryAmount / totalRecovery) * stateGuaranteeRecovery 
      : 0;
    const collateralPortion = totalRecovery > 0 
      ? (recoveryAmount / totalRecovery) * collateralRecovery 
      : 0;
    
    allocations.push({
      cohortId: cohort.creationDate,
      amount: recoveryAmount,
      stateGuarantee: stateGuaranteePortion,
      collateral: collateralPortion,
      quarter: currentQuarter
    });
    
    remainingRecovery -= recoveryAmount;
  }
  
  return allocations;
};

/**
 * Calculate average recovery speed across cohorts
 * @param {Array} cohortSchedule - Cohort unwinding schedule
 * @returns {number} Average recovery speed in quarters
 */
const calculateAverageRecoverySpeed = (cohortSchedule) => {
  const fullyRecoveredCohorts = cohortSchedule.filter(c => 
    c.status === 'Fully Recovered' && c.recoveryRate >= 90
  );
  
  if (fullyRecoveredCohorts.length === 0) return 0;
  
  const totalRecoveryTime = fullyRecoveredCohorts.reduce((sum, cohort) => 
    sum + cohort.age, 0
  );
  
  return totalRecoveryTime / fullyRecoveredCohorts.length;
};

/**
 * Calculate total recovery rate
 * @param {Object} nplNBVResults - NBV results
 * @param {number} totalRecovered - Total recovered amount
 * @returns {number} Total recovery rate percentage
 */
const calculateTotalRecoveryRate = (nplNBVResults, totalRecovered) => {
  const totalNPLGenerated = nplNBVResults.metrics.totalNPLGenerated || 0;
  return totalNPLGenerated > 0 ? (totalRecovered / totalNPLGenerated) * 100 : 0;
};

/**
 * Get stock unwinding profile for specific quarter
 * @param {Object} unwindingResults - Results from calculateNPLStockUnwinding
 * @param {number} quarter - Quarter index
 * @returns {Object} Unwinding profile
 */
export const getUnwindingProfile = (unwindingResults, quarter) => {
  return {
    residualStock: unwindingResults.quarterlyResidualStock[quarter] || 0,
    unwindingFlow: unwindingResults.quarterlyUnwindingFlows[quarter] || 0,
    stockByVintage: unwindingResults.stockByVintage[quarter] || {},
    recoveryEfficiency: unwindingResults.recoveryEfficiency.quarterly[quarter] || 0,
    cumulativeRecoveryRate: unwindingResults.recoveryEfficiency.cumulative[quarter] || 0
  };
};

/**
 * Calculate vintage concentration risk
 * @param {Object} unwindingResults - Unwinding results
 * @param {number} quarter - Quarter index
 * @returns {Object} Concentration metrics
 */
export const calculateVintageConcentration = (unwindingResults, quarter) => {
  const stockByVintage = unwindingResults.stockByVintage[quarter] || {};
  const totalStock = unwindingResults.quarterlyResidualStock[quarter] || 0;
  
  if (totalStock === 0) {
    return { maxConcentration: 0, vintageCount: 0, herfindahlIndex: 0 };
  }
  
  const concentrations = Object.values(stockByVintage).map(stock => stock / totalStock);
  const maxConcentration = Math.max(...concentrations) * 100;
  const vintageCount = Object.keys(stockByVintage).length;
  
  // Calculate Herfindahl Index for concentration
  const herfindahlIndex = concentrations.reduce((sum, c) => sum + Math.pow(c, 2), 0) * 10000;
  
  return {
    maxConcentration,
    vintageCount,
    herfindahlIndex
  };
};

/**
 * Format unwinding data for Balance Sheet
 * @param {Object} unwindingResults - Unwinding results
 * @param {Object} nplNBVResults - Original NBV results
 * @param {number} quarter - Quarter to display
 * @returns {Object} Formatted data
 */
export const formatUnwindingForBalanceSheet = (unwindingResults, nplNBVResults, quarter) => {
  const residualStock = unwindingResults.quarterlyResidualStock[quarter] || 0;
  const grossNPL = nplNBVResults.quarterlyNBV[quarter] || 0;
  const unwindingFlow = unwindingResults.quarterlyUnwindingFlows[quarter] || 0;
  
  return {
    // Main metrics
    grossNPLStock: grossNPL,
    recoveries: unwindingFlow,
    netNPLStock: residualStock,
    
    // Vintage breakdown
    vintageBreakdown: unwindingResults.stockByVintage[quarter] || {},
    
    // Recovery metrics
    recoveryMetrics: {
      quarterlyRecoveryRate: unwindingResults.recoveryEfficiency.quarterly[quarter] || 0,
      cumulativeRecoveryRate: unwindingResults.recoveryEfficiency.cumulative[quarter] || 0,
      averageRecoverySpeed: unwindingResults.unwindingMetrics.averageRecoverySpeed
    },
    
    // Risk indicators
    riskIndicators: calculateVintageConcentration(unwindingResults, quarter),
    
    // Formula explanation
    formula: `NPL Stock: ${formatNumber(grossNPL, 1)}€M - Recoveries: ${formatNumber(unwindingFlow, 1)}€M = Net Stock: ${formatNumber(residualStock, 1)}€M`
  };
};

/**
 * Project future unwinding based on historical patterns
 * @param {Object} unwindingResults - Historical unwinding results
 * @param {number} projectionQuarters - Quarters to project
 * @returns {Object} Projected unwinding
 */
export const projectFutureUnwinding = (unwindingResults, projectionQuarters = 8) => {
  const lastQuarter = unwindingResults.quarterlyResidualStock.length - 1;
  const lastStock = unwindingResults.quarterlyResidualStock[lastQuarter] || 0;
  
  // Calculate average recovery rate from last 4 quarters
  const recentQuarters = 4;
  let avgRecoveryRate = 0;
  let validQuarters = 0;
  
  for (let i = Math.max(0, lastQuarter - recentQuarters + 1); i <= lastQuarter; i++) {
    if (unwindingResults.recoveryEfficiency.quarterly[i] > 0) {
      avgRecoveryRate += unwindingResults.recoveryEfficiency.quarterly[i];
      validQuarters++;
    }
  }
  
  avgRecoveryRate = validQuarters > 0 ? avgRecoveryRate / validQuarters : 5; // Default 5% if no data
  
  // Project future stock
  const projectedStock = [];
  let currentStock = lastStock;
  
  for (let q = 0; q < projectionQuarters; q++) {
    const quarterlyRecovery = currentStock * (avgRecoveryRate / 100);
    currentStock = Math.max(0, currentStock - quarterlyRecovery);
    projectedStock.push(currentStock);
  }
  
  return {
    projectedStock,
    assumedRecoveryRate: avgRecoveryRate,
    expectedFullRecoveryQuarter: currentStock > 0 
      ? lastQuarter + Math.ceil(currentStock / (lastStock * avgRecoveryRate / 100))
      : lastQuarter
  };
};

/**
 * Utility function for number formatting
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted number
 */
const formatNumber = (value, decimals = 1) => {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};