/**
 * Interest Expense Orchestrator Microservice
 * 
 * Coordina il calcolo FTP utilizzando AssetAggregator e FTPCalculator
 * per produrre risultati consolidati e per prodotto
 */

import { aggregateCreditAssets } from './AssetAggregator.js';
import { calculateDivisionFTP } from './FTPCalculator.js';
import { aggregateDivisionFTP, validateDivisionTotals } from './FTPDivisionAggregator.js';

/**
 * Orchestrates FTP calculation across all divisions
 * @param {Object} creditResults - Credit calculation results
 * @param {Object} assumptions - Global assumptions
 * @returns {Object} Complete FTP results with quarterly detail
 */
export const orchestrateFTPCalculation = (creditResults, assumptions) => {
  
  // Step 1: Aggregate assets (performing + NPL)
  const aggregatedAssets = aggregateCreditAssets(creditResults);
  
  // Step 2: Initialize results structure
  const ftpResults = {
    consolidated: {
      quarterlyTotal: new Array(40).fill(0),
      byProduct: {},
      details: {
        totalAssets: aggregatedAssets.consolidated.totalAssets,
        performingAssets: aggregatedAssets.consolidated.performingAssets,
        nplAssets: aggregatedAssets.consolidated.nplAssets,
        averageFTPRate: 0,
        euribor: assumptions.euribor
      }
    },
    byDivision: {}
  };
  
  // Step 3: Calculate FTP for each division
  // Map division keys to match the actual data structure
  const divisionMappings = {
    'realEstateDivision': 're',
    'smeDivision': 'sme', 
    'wealthDivision': 'wealth',
    'incentiveDivision': 'incentive',
    'digitalBankingDivision': 'digital'
  };
  
  // Temporary storage for raw division results
  const rawDivisionResults = {};
  
  Object.entries(divisionMappings).forEach(([assumptionKey, dataKey]) => {
    const divisionAssumptions = assumptions[assumptionKey];
    const divisionData = creditResults.byDivision?.[dataKey];
    
    if (!divisionAssumptions || !divisionData) {
      return;
    }
    
    // Add credit products from assumptions to division assumptions
    const divisionProducts = Object.entries(assumptions.products || {})
      .filter(([prodKey]) => {
        // Match products based on division prefix
        if (dataKey === 're' && prodKey.startsWith('re')) return true;
        if (dataKey === 'sme' && prodKey.startsWith('sme')) return true;
        if (dataKey === 'wealth' && prodKey.startsWith('wealth')) return true;
        if (dataKey === 'incentive' && prodKey.startsWith('incentive')) return true;
        if (dataKey === 'digital' && prodKey.startsWith('digital')) return true;
        return false;
      })
      .reduce((acc, [prodKey, product]) => {
        acc[prodKey] = { ...product, key: prodKey };
        return acc;
      }, {});
    
    const enrichedDivisionAssumptions = {
      ...divisionAssumptions,
      creditProducts: divisionProducts,
      name: divisionAssumptions.name || assumptionKey.replace('Division', '')
    };
    
    // Calculate division FTP
    const divisionFTP = calculateDivisionFTP(
      divisionData,
      enrichedDivisionAssumptions,
      assumptions.euribor
    );
    
    // Store raw division results for aggregation
    rawDivisionResults[dataKey] = {
      name: enrichedDivisionAssumptions.name,
      quarterlyTotal: divisionFTP.quarterlyTotal,
      byProduct: divisionFTP.byProduct,
      details: {
        totalAssets: aggregatedAssets.byDivision[dataKey]?.total.totalAssets || new Array(40).fill(0),
        performingAssets: aggregatedAssets.byDivision[dataKey]?.total.performingAssets || new Array(40).fill(0),
        nplAssets: aggregatedAssets.byDivision[dataKey]?.total.nplAssets || new Array(40).fill(0)
      }
    };
    
    // Aggregate to consolidated
    divisionFTP.quarterlyTotal.forEach((value, quarter) => {
      ftpResults.consolidated.quarterlyTotal[quarter] += value;
    });
    
    // Aggregate products to consolidated
    Object.entries(divisionFTP.byProduct).forEach(([prodKey, prodData]) => {
      const consolidatedKey = `${dataKey}_${prodKey}`;
      ftpResults.consolidated.byProduct[consolidatedKey] = {
        division: enrichedDivisionAssumptions.name,
        product: prodData.name,
        quarterlyFTP: prodData.quarterlyFTP,
        ftpRate: prodData.ftpRate
      };
    });
  });
  
  // Step 3.5: Aggregate division FTP from product sums
  
  // Validate current totals before aggregation
  const validationBefore = validateDivisionTotals(rawDivisionResults);
  if (!validationBefore.isValid) {
  }
  
  // Aggregate division FTP to ensure totals match product sums
  const aggregatedDivisionResults = aggregateDivisionFTP(rawDivisionResults);
  
  // Replace division results with aggregated values
  ftpResults.byDivision = aggregatedDivisionResults;
  
  // Recalculate consolidated totals from aggregated division totals
  ftpResults.consolidated.quarterlyTotal = new Array(40).fill(0);
  Object.values(aggregatedDivisionResults).forEach(divData => {
    divData.quarterlyTotal.forEach((value, quarter) => {
      ftpResults.consolidated.quarterlyTotal[quarter] += value;
    });
  });
  
  // Step 4: Calculate average FTP rate for first year
  const totalFTPQ1toQ4 = Math.abs(
    ftpResults.consolidated.quarterlyTotal[0] +
    ftpResults.consolidated.quarterlyTotal[1] +
    ftpResults.consolidated.quarterlyTotal[2] +
    ftpResults.consolidated.quarterlyTotal[3]
  );
  const totalAssetsQ1toQ4 = 
    aggregatedAssets.consolidated.totalAssets[0] +
    aggregatedAssets.consolidated.totalAssets[1] +
    aggregatedAssets.consolidated.totalAssets[2] +
    aggregatedAssets.consolidated.totalAssets[3];
  
  if (totalAssetsQ1toQ4 > 0) {
    ftpResults.consolidated.details.averageFTPRate = (totalFTPQ1toQ4 / totalAssetsQ1toQ4) * 100 * 4; // Annualized
  }
  
  
  return ftpResults;
};

/**
 * Format FTP results for P&L display
 * @param {Object} ftpResults - FTP calculation results
 * @returns {Object} Formatted results for P&L
 */
export const formatFTPForPnL = (ftpResults) => {
  return {
    consolidated: ftpResults.consolidated.quarterlyTotal,
    byDivision: Object.entries(ftpResults.byDivision).reduce((acc, [divKey, divData]) => {
      acc[divKey] = divData.quarterlyTotal;
      return acc;
    }, {}),
    productDetails: ftpResults.consolidated.byProduct
  };
};