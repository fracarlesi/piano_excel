/**
 * NPL Manager Module
 * 
 * Dedicated microservice for NPL (Non-Performing Loans) management
 * Handles NPL creation, tracking, recovery, and interest calculations
 */

/**
 * NPL Cohort class to track individual NPL cohorts
 */
class NPLCohort {
  constructor({
    creationQuarter,
    nominalAmount,
    nbvAmount,
    recoveryQuarter,
    expectedRecoveryAmount,
    type = 'collateral'
  }) {
    this.creationQuarter = creationQuarter;
    this.nominalAmount = nominalAmount;
    this.nbvAmount = nbvAmount; // Net Book Value
    this.recoveryQuarter = recoveryQuarter;
    this.expectedRecoveryAmount = expectedRecoveryAmount;
    this.type = type; // 'collateral', 'stateGuarantee', 'unsecured'
    this.recovered = false;
  }
}

/**
 * NPL Manager class to handle all NPL operations
 */
export class NPLManager {
  constructor() {
    this.cohorts = [];
    this.totalNBVStock = 0;
  }

  /**
   * Add a new NPL cohort
   * @param {Object} cohortData - Data for the new cohort
   */
  addCohort(cohortData) {
    const cohort = new NPLCohort(cohortData);
    this.cohorts.push(cohort);
    this.totalNBVStock += cohort.nbvAmount;
  }

  /**
   * Process recoveries for a given quarter
   * @param {number} currentQuarter - Current quarter number
   * @returns {Object} Recovery details
   */
  processQuarterlyRecoveries(currentQuarter) {
    let totalRecovered = 0;
    let recoveredCohorts = [];

    this.cohorts.forEach(cohort => {
      if (!cohort.recovered && currentQuarter >= cohort.recoveryQuarter) {
        // Recovery happens at the expected recovery amount
        totalRecovered += cohort.expectedRecoveryAmount;
        cohort.recovered = true;
        recoveredCohorts.push(cohort);
        
        // Reduce NBV stock by the cohort's NBV amount
        this.totalNBVStock -= cohort.nbvAmount;
      }
    });

    // Remove recovered cohorts
    this.cohorts = this.cohorts.filter(c => !c.recovered);

    return {
      totalRecovered,
      recoveredCohorts,
      remainingNBVStock: this.totalNBVStock
    };
  }

  /**
   * Calculate quarterly interest on NPL stock
   * @param {number} quarterlyRate - Quarterly interest rate
   * @returns {number} Interest amount
   */
  calculateQuarterlyInterest(quarterlyRate) {
    return this.totalNBVStock * quarterlyRate;
  }

  /**
   * Get current NPL stock (NBV)
   * @returns {number} Total NBV stock
   */
  getNBVStock() {
    return this.totalNBVStock;
  }

  /**
   * Get detailed cohort information
   * @returns {Array} Array of cohort details
   */
  getCohortDetails() {
    return this.cohorts.map(cohort => ({
      creationQuarter: cohort.creationQuarter,
      nominalAmount: cohort.nominalAmount,
      nbvAmount: cohort.nbvAmount,
      recoveryQuarter: cohort.recoveryQuarter,
      expectedRecoveryAmount: cohort.expectedRecoveryAmount,
      type: cohort.type,
      recovered: cohort.recovered
    }));
  }
}

/**
 * Create NPL from default with proper validation
 * @param {Object} params - Parameters for NPL creation
 * @returns {Object} NPL creation result
 */
export const createNPLFromDefault = ({
  defaultAmount,
  outstandingPrincipal,
  product,
  quarterlyRate,
  currentQuarter
}) => {
  // CRITICAL: Cannot create NPL greater than outstanding principal
  const actualDefaultAmount = Math.min(defaultAmount, outstandingPrincipal);
  
  if (actualDefaultAmount <= 0) {
    return {
      actualDefaultAmount: 0,
      nbvAmount: 0,
      llp: 0,
      cohorts: []
    };
  }

  // Calculate recovery based on product parameters
  const timeToRecover = product.timeToRecover || 3;
  const annualRate = quarterlyRate * 4;
  const cohorts = [];
  let totalNBV = 0;

  // State guarantee recovery if applicable
  if (product.stateGuaranteeType === 'present' && product.stateGuaranteeCoverage > 0) {
    const guaranteedAmount = actualDefaultAmount * (product.stateGuaranteeCoverage / 100);
    const stateRecoveryTime = product.stateGuaranteeRecoveryTime || 0.5;
    const stateRecoveryNBV = guaranteedAmount / Math.pow(1 + annualRate, stateRecoveryTime);
    
    cohorts.push({
      creationQuarter: currentQuarter,
      nominalAmount: guaranteedAmount,
      nbvAmount: stateRecoveryNBV,
      recoveryQuarter: currentQuarter + Math.round(stateRecoveryTime * 4),
      expectedRecoveryAmount: guaranteedAmount,
      type: 'stateGuarantee'
    });
    
    totalNBV += stateRecoveryNBV;
  }

  // Collateral or unsecured recovery
  const nonGuaranteedAmount = actualDefaultAmount * (1 - (product.stateGuaranteeCoverage || 0) / 100);
  
  if (nonGuaranteedAmount > 0) {
    if (!product.isUnsecured) {
      // Secured loan - collateral recovery
      const collateralValue = nonGuaranteedAmount / (product.ltv / 100);
      const valueAfterHaircut = collateralValue * (1 - product.collateralHaircut / 100);
      const recoveryCosts = nonGuaranteedAmount * (product.recoveryCosts / 100);
      const netRecovery = Math.max(0, valueAfterHaircut - recoveryCosts);
      const recoveryNBV = netRecovery / Math.pow(1 + annualRate, timeToRecover);
      
      cohorts.push({
        creationQuarter: currentQuarter,
        nominalAmount: nonGuaranteedAmount,
        nbvAmount: recoveryNBV,
        recoveryQuarter: currentQuarter + Math.round(timeToRecover * 4),
        expectedRecoveryAmount: netRecovery,
        type: 'collateral'
      });
      
      totalNBV += recoveryNBV;
    } else {
      // Unsecured loan
      const unsecuredLGD = product.unsecuredLGD || 45;
      const recoveryRate = (100 - unsecuredLGD) / 100;
      const recoveryAmount = nonGuaranteedAmount * recoveryRate;
      const recoveryNBV = recoveryAmount / Math.pow(1 + annualRate, timeToRecover);
      
      cohorts.push({
        creationQuarter: currentQuarter,
        nominalAmount: nonGuaranteedAmount,
        nbvAmount: recoveryNBV,
        recoveryQuarter: currentQuarter + Math.round(timeToRecover * 4),
        expectedRecoveryAmount: recoveryAmount,
        type: 'unsecured'
      });
      
      totalNBV += recoveryNBV;
    }
  }

  const llp = actualDefaultAmount - totalNBV;

  return {
    actualDefaultAmount,
    nbvAmount: totalNBV,
    llp,
    cohorts
  };
};