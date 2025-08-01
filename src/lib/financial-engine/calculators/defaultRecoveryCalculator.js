/**
 * Default Recovery Calculator Microservice
 * 
 * Dedicated microservice for calculating recovery values on defaulted loans.
 * This service handles all recovery calculations including:
 * - Collateral-based recovery (real estate)
 * - State guarantee recovery
 * - Unsecured loan recovery
 * 
 * The output of this service feeds into the NBV calculator.
 */

/**
 * Calculate collateral recovery details
 * @param {number} defaultAmount - The defaulted amount
 * @param {Object} collateralParams - Collateral parameters
 * @returns {Object} Collateral recovery details
 */
export const calculateCollateralRecovery = (defaultAmount, collateralParams) => {
  const {
    ltv = 100,
    collateralHaircut = 0,
    recoveryCosts = 0
  } = collateralParams;

  // Calculate collateral value from LTV
  const collateralValue = defaultAmount / (ltv / 100);
  
  // Apply haircut to get liquidation value
  const liquidationValue = collateralValue * (1 - collateralHaircut / 100);
  
  // Deduct recovery costs
  const costAmount = defaultAmount * (recoveryCosts / 100);
  const netRecovery = Math.max(0, liquidationValue - costAmount);
  
  // Calculate recovery rate
  const recoveryRate = defaultAmount > 0 ? (netRecovery / defaultAmount) * 100 : 0;
  
  return {
    collateralValue,
    liquidationValue,
    recoveryCosts: costAmount,
    netRecovery,
    recoveryRate,
    type: 'collateral'
  };
};

/**
 * Calculate state guarantee recovery details
 * @param {number} guaranteedAmount - Amount covered by state guarantee
 * @param {Object} guaranteeParams - State guarantee parameters
 * @returns {Object} State guarantee recovery details
 */
export const calculateStateGuaranteeRecovery = (guaranteedAmount, guaranteeParams) => {
  const {
    coverage = 0,
    recoveryTime = 2, // quarters
    efficiency = 100 // % of guaranteed amount actually recovered
  } = guaranteeParams;

  if (coverage === 0 || guaranteedAmount === 0) {
    return {
      guaranteedAmount: 0,
      expectedRecovery: 0,
      recoveryRate: 0,
      recoveryTime: 0,
      type: 'stateGuarantee'
    };
  }

  // State guarantees typically have high recovery rates
  const expectedRecovery = guaranteedAmount * (efficiency / 100);
  const recoveryRate = 100 * (efficiency / 100);
  
  return {
    guaranteedAmount,
    expectedRecovery,
    recoveryRate,
    recoveryTime,
    efficiency,
    type: 'stateGuarantee'
  };
};

/**
 * Calculate unsecured recovery details
 * @param {number} unsecuredAmount - Unsecured portion of default
 * @param {Object} unsecuredParams - Unsecured recovery parameters
 * @returns {Object} Unsecured recovery details
 */
export const calculateUnsecuredRecovery = (unsecuredAmount, unsecuredParams) => {
  const {
    lgd = 45, // Loss Given Default %
    recoveryTime = 12 // quarters
  } = unsecuredParams;

  const recoveryRate = 100 - lgd;
  const expectedRecovery = unsecuredAmount * (recoveryRate / 100);
  
  return {
    unsecuredAmount,
    expectedRecovery,
    recoveryRate,
    lgd,
    recoveryTime,
    type: 'unsecured'
  };
};

/**
 * Main recovery calculation orchestrator
 * Calculates all recovery components for a defaulted loan
 * @param {number} defaultAmount - Total defaulted amount
 * @param {Object} product - Product configuration with all recovery parameters
 * @returns {Object} Complete recovery analysis
 */
export const calculateDefaultRecovery = (defaultAmount, product) => {
  if (defaultAmount <= 0) {
    return {
      totalDefault: 0,
      totalRecovery: 0,
      weightedRecoveryRate: 0,
      components: [],
      recoverySchedule: []
    };
  }

  const components = [];
  const recoverySchedule = [];
  let totalRecovery = 0;

  // Check for state guarantee
  const hasStateGuarantee = product.stateGuaranteeType === 'present';
  const stateGuaranteeCoverage = hasStateGuarantee ? (product.stateGuaranteeCoverage || 0) : 0;
  
  if (hasStateGuarantee && stateGuaranteeCoverage > 0) {
    // Calculate state-guaranteed portion
    const guaranteedAmount = defaultAmount * (stateGuaranteeCoverage / 100);
    const stateRecovery = calculateStateGuaranteeRecovery(guaranteedAmount, {
      coverage: stateGuaranteeCoverage,
      recoveryTime: product.stateGuaranteeRecoveryTime || 2,
      efficiency: 100 // Assume 100% efficiency for state guarantees
    });
    
    components.push(stateRecovery);
    totalRecovery += stateRecovery.expectedRecovery;
    
    // Add to recovery schedule
    recoverySchedule.push({
      quarter: product.stateGuaranteeRecoveryTime || 2,
      amount: stateRecovery.expectedRecovery,
      type: 'stateGuarantee',
      description: 'State guarantee recovery'
    });
    
    // Calculate non-guaranteed portion
    const nonGuaranteedAmount = defaultAmount * (1 - stateGuaranteeCoverage / 100);
    
    if (nonGuaranteedAmount > 0) {
      if (product.isUnsecured) {
        // Unsecured recovery
        const unsecuredRecovery = calculateUnsecuredRecovery(nonGuaranteedAmount, {
          lgd: product.unsecuredLGD || 45,
          recoveryTime: product.timeToRecover || 12
        });
        
        components.push(unsecuredRecovery);
        totalRecovery += unsecuredRecovery.expectedRecovery;
        
        recoverySchedule.push({
          quarter: product.timeToRecover || 12,
          amount: unsecuredRecovery.expectedRecovery,
          type: 'unsecured',
          description: 'Unsecured recovery'
        });
      } else {
        // Collateral recovery
        const collateralRecovery = calculateCollateralRecovery(nonGuaranteedAmount, {
          ltv: product.ltv,
          collateralHaircut: product.collateralHaircut,
          recoveryCosts: product.recoveryCosts
        });
        
        components.push(collateralRecovery);
        totalRecovery += collateralRecovery.netRecovery;
        
        recoverySchedule.push({
          quarter: product.timeToRecover || 12,
          amount: collateralRecovery.netRecovery,
          type: 'collateral',
          description: 'Collateral liquidation'
        });
      }
    }
  } else {
    // No state guarantee - full amount subject to collateral/unsecured recovery
    if (product.isUnsecured) {
      const unsecuredRecovery = calculateUnsecuredRecovery(defaultAmount, {
        lgd: product.unsecuredLGD || 45,
        recoveryTime: product.timeToRecover || 12
      });
      
      components.push(unsecuredRecovery);
      totalRecovery += unsecuredRecovery.expectedRecovery;
      
      recoverySchedule.push({
        quarter: product.timeToRecover || 12,
        amount: unsecuredRecovery.expectedRecovery,
        type: 'unsecured',
        description: 'Unsecured recovery'
      });
    } else {
      const collateralRecovery = calculateCollateralRecovery(defaultAmount, {
        ltv: product.ltv,
        collateralHaircut: product.collateralHaircut,
        recoveryCosts: product.recoveryCosts
      });
      
      components.push(collateralRecovery);
      totalRecovery += collateralRecovery.netRecovery;
      
      recoverySchedule.push({
        quarter: product.timeToRecover || 12,
        amount: collateralRecovery.netRecovery,
        type: 'collateral',
        description: 'Collateral liquidation'
      });
    }
  }

  // Sort recovery schedule by quarter
  recoverySchedule.sort((a, b) => a.quarter - b.quarter);
  
  // Calculate weighted recovery rate
  const weightedRecoveryRate = (totalRecovery / defaultAmount) * 100;
  
  return {
    totalDefault: defaultAmount,
    totalRecovery,
    weightedRecoveryRate,
    components,
    recoverySchedule,
    metrics: {
      immediateRecovery: components.filter(c => c.recoveryTime <= 2).reduce((sum, c) => sum + (c.expectedRecovery || c.netRecovery || 0), 0),
      delayedRecovery: components.filter(c => c.recoveryTime > 2).reduce((sum, c) => sum + (c.expectedRecovery || c.netRecovery || 0), 0),
      stateGuaranteeRecovery: components.filter(c => c.type === 'stateGuarantee').reduce((sum, c) => sum + c.expectedRecovery, 0),
      privateRecovery: components.filter(c => c.type !== 'stateGuarantee').reduce((sum, c) => sum + (c.expectedRecovery || c.netRecovery || 0), 0)
    }
  };
};

/**
 * Calculate recovery for a portfolio of defaults
 * @param {Array} defaults - Array of default events
 * @returns {Object} Portfolio recovery summary
 */
export const calculatePortfolioRecovery = (defaults) => {
  const results = defaults.map(({ amount, product, quarter }) => ({
    quarter,
    productName: product.name,
    ...calculateDefaultRecovery(amount, product)
  }));
  
  const totalDefaults = results.reduce((sum, r) => sum + r.totalDefault, 0);
  const totalRecoveries = results.reduce((sum, r) => sum + r.totalRecovery, 0);
  
  // Aggregate recovery schedule
  const aggregatedSchedule = {};
  results.forEach(result => {
    result.recoverySchedule.forEach(item => {
      const key = result.quarter + item.quarter; // Absolute recovery quarter
      if (!aggregatedSchedule[key]) {
        aggregatedSchedule[key] = {
          quarter: key,
          amount: 0,
          details: []
        };
      }
      aggregatedSchedule[key].amount += item.amount;
      aggregatedSchedule[key].details.push({
        product: result.productName,
        type: item.type,
        amount: item.amount
      });
    });
  });
  
  return {
    totalDefaults,
    totalRecoveries,
    portfolioRecoveryRate: totalDefaults > 0 ? (totalRecoveries / totalDefaults) * 100 : 0,
    defaultDetails: results,
    aggregatedSchedule: Object.values(aggregatedSchedule).sort((a, b) => a.quarter - b.quarter)
  };
};