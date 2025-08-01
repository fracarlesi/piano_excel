/**
 * NPL Net Book Value Calculator Microservice
 * 
 * MICROSERVIZIO AUTONOMO per calcolare NBV (Net Book Value) dei NPL
 * Input: Defaults trimestrali da performing loans
 * Output: NBV stock NPL per Balance Sheet
 */

import { processQuarterlyDefaults } from '../../../pnl-microservices/llp-calculators/defaultCalculator.js';

/**
 * Calcola NBV stock NPL trimestrale
 * @param {Object} product - Configurazione prodotto
 * @param {Object} vintages - Vintages attive
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero trimestri (default 40)
 * @returns {Object} NBV NPL results
 */
export const calculateNPLNBV = (product, vintages, assumptions, quarters = 40) => {
  const results = {
    // Stock NPL per Balance Sheet
    quarterlyNBV: new Array(quarters).fill(0),
    
    // Breakdown annuale per analisi
    annualNBV: new Array(10).fill(0),
    
    // Dettaglio nuovi NPL per trimestre
    newNPLsQuarterly: new Array(quarters).fill(0),
    
    // Cohorts NPL per recovery tracking
    nplCohorts: [],
    
    // Metrics per reporting
    metrics: {
      totalNPLGenerated: 0,
      averageNBV: 0,
      peakNBV: { quarter: 0, value: 0 }
    }
  };

  // Track cumulative NPL stock
  let cumulativeNPLStockNet = 0;
  const nplCohorts = [];
  
  // Main calculation loop per quarter
  for (let quarter = 0; quarter < quarters; quarter++) {
    const year = Math.floor(quarter / 4);
    const quarterInYear = quarter % 4;
    
    // Calcola nuovi NPL da defaults trimestrali
    const quarterlyDefaults = processQuarterlyDefaults(
      vintages,
      quarter,
      product,
      assumptions
    );
    
    // Process defaults to create NPL cohorts
    quarterlyDefaults.forEach(defaultData => {
      if (defaultData.amount > 0) {
        // Create NPL cohort
        const nplCohort = {
          quarter: quarter,
          originalAmount: defaultData.amount,
          nbvAmount: defaultData.amount, // Initial NBV = default amount
          vintageOrigin: defaultData.vintageId,
          productType: product.type || 'french',
          creationDate: quarter,
          
          // Recovery parameters
          lgd: product.lgd || 45,
          collateralHaircut: product.collateralHaircut || 15,
          recoveryCosts: product.recoveryCosts || 10,
          hasStateGuarantee: product.hasStateGuarantee || false,
          stateGuaranteeType: product.stateGuaranteeType || null
        };
        
        nplCohorts.push(nplCohort);
        cumulativeNPLStockNet += nplCohort.nbvAmount;
        
        // Track new NPLs for this quarter
        results.newNPLsQuarterly[quarter] += nplCohort.nbvAmount;
        results.metrics.totalNPLGenerated += nplCohort.nbvAmount;
      }
    });
    
    // Store quarterly NBV
    results.quarterlyNBV[quarter] = cumulativeNPLStockNet;
    
    // Update annual NBV at year end
    if (quarterInYear === 3) { // End of year
      results.annualNBV[year] = cumulativeNPLStockNet;
    }
    
    // Track peak NPL for metrics
    if (cumulativeNPLStockNet > results.metrics.peakNBV.value) {
      results.metrics.peakNBV = {
        quarter: quarter,
        value: cumulativeNPLStockNet
      };
    }
  }
  
  // Store NPL cohorts for next microservice
  results.nplCohorts = nplCohorts;
  
  // Calculate average NBV
  const nonZeroQuarters = results.quarterlyNBV.filter(val => val > 0);
  results.metrics.averageNBV = nonZeroQuarters.length > 0 
    ? nonZeroQuarters.reduce((sum, val) => sum + val, 0) / nonZeroQuarters.length 
    : 0;
  
  return results;
};

/**
 * Get quarterly NBV for a specific quarter
 * @param {Object} nplResults - Results from calculateNPLNBV
 * @param {number} quarter - Quarter index
 * @returns {number} NBV for specified quarter
 */
export const getNBVForQuarter = (nplResults, quarter) => {
  return nplResults.quarterlyNBV[quarter] || 0;
};

/**
 * Get NPL cohorts active at specific quarter
 * @param {Object} nplResults - Results from calculateNPLNBV
 * @param {number} quarter - Quarter index
 * @returns {Array} Active NPL cohorts
 */
export const getActiveCohorts = (nplResults, quarter) => {
  return nplResults.nplCohorts.filter(cohort => 
    cohort.creationDate <= quarter
  );
};

/**
 * Format NBV data for Balance Sheet display
 * @param {Object} nplResults - Results from calculateNPLNBV
 * @param {number} quarter - Quarter to display
 * @returns {Object} Formatted data
 */
export const formatNBVForBalanceSheet = (nplResults, quarter) => {
  const nbv = getNBVForQuarter(nplResults, quarter);
  const newNPLs = nplResults.newNPLsQuarterly[quarter] || 0;
  
  return {
    // Main Balance Sheet line
    mainLine: {
      label: 'Non-Performing Assets (NBV)',
      value: nbv,
      unit: '€M'
    },
    
    // Drill-down details
    details: {
      newNPLsThisQuarter: newNPLs,
      activeCohorts: getActiveCohorts(nplResults, quarter).length,
      averageAge: quarter > 0 ? calculateAverageAge(nplResults, quarter) : 0
    },
    
    // Formula explanation
    formula: `Cumulative NPL defaults (NBV basis): ${formatNumber(nbv, 1)} €M`
  };
};

/**
 * Calculate average age of NPL cohorts
 * @param {Object} nplResults - Results from calculateNPLNBV
 * @param {number} currentQuarter - Current quarter
 * @returns {number} Average age in quarters
 */
const calculateAverageAge = (nplResults, currentQuarter) => {
  const activeCohorts = getActiveCohorts(nplResults, currentQuarter);
  
  if (activeCohorts.length === 0) return 0;
  
  const totalAge = activeCohorts.reduce((sum, cohort) => 
    sum + (currentQuarter - cohort.creationDate), 0
  );
  
  return totalAge / activeCohorts.length;
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