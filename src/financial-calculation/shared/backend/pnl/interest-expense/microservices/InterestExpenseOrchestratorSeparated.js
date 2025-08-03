/**
 * Interest Expense Orchestrator Separated Microservice
 * 
 * Coordina il calcolo FTP separato tra Bonis e NPL
 * utilizzando AssetAggregator e FTPCalculatorSeparated
 */

import { aggregateCreditAssets } from './AssetAggregator.js';
import { calculateDivisionFTPSeparated } from './FTPCalculatorSeparated.js';
import { aggregateDivisionFTP, validateDivisionTotals } from './FTPDivisionAggregator.js';

/**
 * Orchestrates FTP calculation with separate Bonis/NPL tracking
 * @param {Object} creditResults - Credit calculation results
 * @param {Object} assumptions - Global assumptions
 * @returns {Object} Complete FTP results with separated Bonis/NPL detail
 */
export const orchestrateFTPCalculationSeparated = (creditResults, assumptions) => {
  
  // Step 1: Aggregate assets (performing + NPL)
  const aggregatedAssets = aggregateCreditAssets(creditResults);
  
  // Step 2: Initialize results structure with separated tracking
  const ftpResults = {
    consolidated: {
      quarterlyTotalBonis: new Array(40).fill(0),
      quarterlyTotalNPL: new Array(40).fill(0),
      quarterlyTotal: new Array(40).fill(0),
      byProduct: {},
      details: {
        totalAssets: aggregatedAssets.consolidated.totalAssets,
        performingAssets: aggregatedAssets.consolidated.performingAssets,
        nplAssets: aggregatedAssets.consolidated.nplAssets,
        averageFTPRate: 0,
        averageFTPRateBonis: 0,
        averageFTPRateNPL: 0,
        euribor: assumptions.euribor
      }
    },
    byDivision: {}
  };
  
  // Step 3: Calculate FTP for each division
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
    
    // Calculate division FTP with separation
    const divisionFTP = calculateDivisionFTPSeparated(
      divisionData,
      enrichedDivisionAssumptions,
      assumptions.euribor
    );
    
    // Store raw division results for aggregation
    rawDivisionResults[dataKey] = {
      name: enrichedDivisionAssumptions.name,
      quarterlyTotalBonis: divisionFTP.quarterlyTotalBonis,
      quarterlyTotalNPL: divisionFTP.quarterlyTotalNPL,
      quarterlyTotal: divisionFTP.quarterlyTotal,
      byProduct: divisionFTP.byProduct,
      details: {
        totalAssets: aggregatedAssets.byDivision[dataKey]?.total.totalAssets || new Array(40).fill(0),
        performingAssets: aggregatedAssets.byDivision[dataKey]?.total.performingAssets || new Array(40).fill(0),
        nplAssets: aggregatedAssets.byDivision[dataKey]?.total.nplAssets || new Array(40).fill(0)
      }
    };
    
    // Aggregate to consolidated
    divisionFTP.quarterlyTotalBonis.forEach((value, quarter) => {
      ftpResults.consolidated.quarterlyTotalBonis[quarter] += value;
    });
    
    divisionFTP.quarterlyTotalNPL.forEach((value, quarter) => {
      ftpResults.consolidated.quarterlyTotalNPL[quarter] += value;
    });
    
    divisionFTP.quarterlyTotal.forEach((value, quarter) => {
      ftpResults.consolidated.quarterlyTotal[quarter] += value;
    });
    
    // Aggregate products to consolidated with separated detail
    Object.entries(divisionFTP.byProduct).forEach(([prodKey, prodData]) => {
      const consolidatedKey = `${dataKey}_${prodKey}`;
      ftpResults.consolidated.byProduct[consolidatedKey] = {
        division: enrichedDivisionAssumptions.name,
        product: prodData.name,
        quarterlyFTPBonis: prodData.quarterlyFTPBonis,
        quarterlyFTPNPL: prodData.quarterlyFTPNPL,
        quarterlyFTPTotal: prodData.quarterlyFTPTotal,
        quarterlyDetails: prodData.quarterlyDetails,
        ftpRate: prodData.ftpRate
      };
    });
  });
  
  // Replace division results with raw results (already includes separation)
  ftpResults.byDivision = rawDivisionResults;
  
  // Step 4: Calculate average FTP rates for first year
  const totalFTPBonisQ1toQ4 = Math.abs(
    ftpResults.consolidated.quarterlyTotalBonis[0] +
    ftpResults.consolidated.quarterlyTotalBonis[1] +
    ftpResults.consolidated.quarterlyTotalBonis[2] +
    ftpResults.consolidated.quarterlyTotalBonis[3]
  );
  
  const totalFTPNPLQ1toQ4 = Math.abs(
    ftpResults.consolidated.quarterlyTotalNPL[0] +
    ftpResults.consolidated.quarterlyTotalNPL[1] +
    ftpResults.consolidated.quarterlyTotalNPL[2] +
    ftpResults.consolidated.quarterlyTotalNPL[3]
  );
  
  const totalFTPQ1toQ4 = Math.abs(
    ftpResults.consolidated.quarterlyTotal[0] +
    ftpResults.consolidated.quarterlyTotal[1] +
    ftpResults.consolidated.quarterlyTotal[2] +
    ftpResults.consolidated.quarterlyTotal[3]
  );
  
  const totalPerformingQ1toQ4 = 
    aggregatedAssets.consolidated.performingAssets[0] +
    aggregatedAssets.consolidated.performingAssets[1] +
    aggregatedAssets.consolidated.performingAssets[2] +
    aggregatedAssets.consolidated.performingAssets[3];
    
  const totalNPLQ1toQ4 = 
    aggregatedAssets.consolidated.nplAssets[0] +
    aggregatedAssets.consolidated.nplAssets[1] +
    aggregatedAssets.consolidated.nplAssets[2] +
    aggregatedAssets.consolidated.nplAssets[3];
    
  const totalAssetsQ1toQ4 = totalPerformingQ1toQ4 + totalNPLQ1toQ4;
  
  if (totalAssetsQ1toQ4 > 0) {
    ftpResults.consolidated.details.averageFTPRate = (totalFTPQ1toQ4 / totalAssetsQ1toQ4) * 100 * 4;
  }
  
  if (totalPerformingQ1toQ4 > 0) {
    ftpResults.consolidated.details.averageFTPRateBonis = (totalFTPBonisQ1toQ4 / totalPerformingQ1toQ4) * 100 * 4;
  }
  
  if (totalNPLQ1toQ4 > 0) {
    ftpResults.consolidated.details.averageFTPRateNPL = (totalFTPNPLQ1toQ4 / totalNPLQ1toQ4) * 100 * 4;
  }
  
  
  return ftpResults;
};

/**
 * Format separated FTP results for P&L display
 * @param {Object} ftpResults - FTP calculation results with separation
 * @returns {Object} Formatted results for P&L with Bonis/NPL detail
 */
export const formatFTPForPnLSeparated = (ftpResults) => {
  return {
    // Totals
    consolidated: ftpResults.consolidated.quarterlyTotal,
    consolidatedBonis: ftpResults.consolidated.quarterlyTotalBonis,
    consolidatedNPL: ftpResults.consolidated.quarterlyTotalNPL,
    
    // By division
    byDivision: Object.entries(ftpResults.byDivision).reduce((acc, [divKey, divData]) => {
      acc[divKey] = {
        total: divData.quarterlyTotal,
        bonis: divData.quarterlyTotalBonis,
        npl: divData.quarterlyTotalNPL
      };
      return acc;
    }, {}),
    
    // Product details
    productDetails: ftpResults.consolidated.byProduct
  };
};