/**
 * ECL Orchestrator - Balance Sheet Microservice
 * 
 * Coordina il calcolo delle ECL provisions per il Balance Sheet
 * ECL viene calcolata all'erogazione e memorizzata come provision
 */

import { calculateECLProvision } from './ECLCalculator.js';

/**
 * Orchestratore principale per ECL provisions
 * @param {Object} newVolumesResults - Risultati nuove erogazioni
 * @param {Object} stockNBVPerformingResults - Risultati stock NBV performing
 * @param {Object} assumptions - Assumptions complete
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} ECL provision results
 */
export const calculateECL = (newVolumesResults, stockNBVPerformingResults, assumptions, quarters = 40) => {
  console.log('🎯 ECL Orchestrator - Start');
  console.log('  - New Volumes data available:', !!newVolumesResults);
  console.log('  - Stock NBV Performing data available:', !!stockNBVPerformingResults);
  
  // Calculate ECL provisions based on stock NBV performing
  const eclProvisions = calculateECLProvision(newVolumesResults, stockNBVPerformingResults, assumptions, quarters);
  
  // Organize results for Balance Sheet display
  const results = {
    // Main balance sheet line item
    balanceSheetLine: {
      name: 'ECL Provision',
      quarterly: eclProvisions.consolidated.quarterlyProvision.map(val => -val), // Negative for balance sheet
      annual: eclProvisions.consolidated.annual.map(val => -val)
    },
    
    // Detailed results
    details: eclProvisions,
    
    // Metrics for reporting
    metrics: {
      ...eclProvisions.metrics,
      finalProvision: eclProvisions.consolidated.quarterlyProvision[quarters - 1],
      totalNewECL: eclProvisions.consolidated.quarterlyAddition.reduce((sum, val) => sum + val, 0)
    }
  };
  
  console.log('🎯 ECL Orchestrator - Complete');
  console.log(`  - Final ECL Provision: €${results.metrics.finalProvision.toFixed(1)}M`);
  console.log(`  - Average ECL Rate: ${(results.metrics.averageECLRate * 100).toFixed(2)}%`);
  
  return results;
};

/**
 * Get ECL provision for specific quarter
 * @param {Object} eclResults - ECL orchestrator results
 * @param {number} quarter - Quarter index
 * @returns {Object} ECL data for the quarter
 */
export const getECLQuarterData = (eclResults, quarter) => {
  const details = eclResults.details;
  
  return {
    provision: details.consolidated.quarterlyProvision[quarter],
    newAddition: details.consolidated.quarterlyAddition[quarter],
    byDivision: Object.entries(details.byDivision).reduce((acc, [divKey, divData]) => {
      acc[divKey] = {
        provision: divData.quarterlyProvision[quarter],
        addition: divData.quarterlyAddition[quarter]
      };
      return acc;
    }, {}),
    byProduct: Object.entries(details.byProduct).reduce((acc, [prodKey, prodData]) => {
      if (prodData.quarterlyProvision[quarter] > 0) {
        acc[prodKey] = {
          name: prodData.productName,
          provision: prodData.quarterlyProvision[quarter],
          addition: prodData.quarterlyAddition[quarter],
          eclRate: prodData.dangerRate * prodData.lgdEffective
        };
      }
      return acc;
    }, {})
  };
};