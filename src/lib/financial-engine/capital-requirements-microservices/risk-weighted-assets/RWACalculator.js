/**
 * Risk Weighted Assets Calculator Module
 * 
 * Calculates RWA for performing and non-performing assets
 * Part of Capital Requirements microservice
 */

/**
 * Calculate RWA (Risk Weighted Assets)
 * @param {Array} performingAssets - Array of performing assets
 * @param {Array} nplStock - Array of NPL stock
 * @param {Object} product - Product configuration
 * @returns {Array} RWA array
 */
export const calculateRWA = (performingAssets, nplStock, product) => {
  return performingAssets.map((performing, i) => {
    const npl = nplStock[i] || 0;
    const performingRWA = performing * (product.rwaDensity || 75) / 100;
    const nplRWA = npl * 1.5; // 150% risk weight for NPLs
    return performingRWA + nplRWA;
  });
};

/**
 * Calculate RWA by asset class
 * @param {Object} assetsByClass - Assets grouped by class
 * @param {Object} riskWeights - Risk weights by asset class
 * @returns {Object} RWA breakdown by class
 */
export const calculateRWAByAssetClass = (assetsByClass, riskWeights) => {
  const rwaBreakdown = {};
  let totalRWA = 0;
  
  Object.entries(assetsByClass).forEach(([assetClass, assets]) => {
    const riskWeight = riskWeights[assetClass] || 100;
    const rwa = assets * (riskWeight / 100);
    
    rwaBreakdown[assetClass] = {
      assets: assets,
      riskWeight: riskWeight,
      rwa: rwa
    };
    
    totalRWA += rwa;
  });
  
  return {
    breakdown: rwaBreakdown,
    totalRWA: totalRWA
  };
};

/**
 * Calculate standardized approach RWA
 * @param {Object} exposures - Exposures by category
 * @returns {Object} Standardized RWA calculation
 */
export const calculateStandardizedRWA = (exposures) => {
  const standardWeights = {
    sovereign: 0,
    institutions: 20,
    corporates: 100,
    retail: 75,
    realEstate: 35,
    npl: 150,
    otherAssets: 100
  };
  
  let totalRWA = 0;
  const breakdown = {};
  
  Object.entries(exposures).forEach(([category, exposure]) => {
    const weight = standardWeights[category] || 100;
    const rwa = exposure * (weight / 100);
    
    breakdown[category] = {
      exposure: exposure,
      weight: weight,
      rwa: rwa
    };
    
    totalRWA += rwa;
  });
  
  return {
    method: 'Standardized Approach',
    totalRWA: totalRWA,
    breakdown: breakdown
  };
};

/**
 * Calculate RWA density
 * @param {number} rwa - Risk weighted assets
 * @param {number} totalAssets - Total assets
 * @returns {number} RWA density percentage
 */
export const calculateRWADensity = (rwa, totalAssets) => {
  return totalAssets > 0 ? (rwa / totalAssets) * 100 : 0;
};

/**
 * Calculate quarterly RWA
 * @param {Array} quarterlyPerforming - Quarterly performing assets
 * @param {Array} quarterlyNPL - Quarterly NPL stock
 * @param {Object} product - Product configuration
 * @returns {Array} Quarterly RWA (40 quarters)
 */
export const calculateQuarterlyRWA = (quarterlyPerforming, quarterlyNPL, product) => {
  const quarters = Math.max(quarterlyPerforming.length, quarterlyNPL.length);
  const quarterlyRWA = [];
  
  for (let q = 0; q < quarters; q++) {
    const performing = quarterlyPerforming[q] || 0;
    const npl = quarterlyNPL[q] || 0;
    
    const performingRWA = performing * (product.rwaDensity || 75) / 100;
    const nplRWA = npl * 1.5;
    
    quarterlyRWA.push(performingRWA + nplRWA);
  }
  
  return quarterlyRWA;
};

/**
 * Apply risk mitigation to RWA
 * @param {number} grossRWA - Gross RWA before mitigation
 * @param {Object} mitigants - Risk mitigants (guarantees, collateral)
 * @returns {Object} Net RWA after mitigation
 */
export const applyRiskMitigation = (grossRWA, mitigants) => {
  let netRWA = grossRWA;
  const mitigationBreakdown = [];
  
  // Apply state guarantees
  if (mitigants.stateGuarantees) {
    const reduction = grossRWA * (mitigants.stateGuarantees.coverage / 100) * 0.8; // 80% reduction
    netRWA -= reduction;
    mitigationBreakdown.push({
      type: 'State Guarantees',
      coverage: mitigants.stateGuarantees.coverage,
      reduction: reduction
    });
  }
  
  // Apply collateral
  if (mitigants.collateral) {
    const reduction = Math.min(
      mitigants.collateral.value * 0.5, // 50% of collateral value
      netRWA * 0.4 // Max 40% reduction
    );
    netRWA -= reduction;
    mitigationBreakdown.push({
      type: 'Collateral',
      value: mitigants.collateral.value,
      reduction: reduction
    });
  }
  
  return {
    grossRWA: grossRWA,
    netRWA: netRWA,
    totalMitigation: grossRWA - netRWA,
    breakdown: mitigationBreakdown
  };
};

/**
 * Format RWA data for Capital Requirements display
 * @param {Object} rwaResults - RWA calculation results
 * @param {number} quarter - Quarter to display
 * @returns {Object} Formatted RWA data
 */
export const formatRWAForCapitalRequirements = (rwaResults, quarter) => {
  const rwa = rwaResults[quarter] || 0;
  
  return {
    mainLine: {
      label: 'Risk Weighted Assets',
      value: rwa,
      unit: '€M'
    },
    details: {
      performingRWA: rwa * 0.8, // Approximate split
      nplRWA: rwa * 0.2,
      density: 'Calculated based on asset risk profiles'
    },
    capitalRequirement: {
      pillar1: rwa * 0.08, // 8% minimum
      conservationBuffer: rwa * 0.025, // 2.5%
      total: rwa * 0.105 // 10.5% total
    }
  };
};