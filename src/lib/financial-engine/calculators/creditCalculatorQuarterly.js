/**
 * Credit Product Calculator Module - Quarterly Granularity
 * 
 * This version exposes quarterly data for all calculations
 * instead of just annual aggregates
 */

import { createVintages, getInterestRate } from './vintageManager.js';
import { calculateFTPExpense } from './interestCalculator.js';
import { calculateAnnualRepayments, updateAllVintagePrincipals } from './amortizationCalculator.js';
import { 
  saveVintageStatesBeforeQuarter,
  calculateYearEndPerformingStock 
} from './defaultCalculatorAligned.js';
import { processQuarterlyRecoveries } from './recoveryCalculator.js';
import { processDangerRate } from './dangerRateCalculator.js';
import { 
  calculateVolumes, 
  calculateNumberOfLoans, 
  calculateCommissionIncome,
  calculateEquityUpsideIncome 
} from './volumeCalculator.js';
import { calculateNetPerformingAssets } from './netPerformingAssetsCalculator.js';
import { calculateInterestByType } from './interestCalculators/interestCalculatorOrchestrator.js';

/**
 * Calculate RWA (Risk Weighted Assets)
 */
const calculateRWA = (performingAssets, nplStock, product) => {
  return performingAssets.map((performing, i) => {
    const npl = nplStock[i];
    const performingRWA = performing * product.rwaDensity / 100;
    const nplRWA = npl * 1.5; // 150% for NPLs
    return performingRWA + nplRWA;
  });
};

/**
 * Calculate quarterly interest using specialized microservices
 * This function is now a wrapper around the orchestrator
 */
const calculateQuarterlyInterestFixed = (vintages, currentQuarter, nplStock, quarterlyRate, product) => {
  const result = calculateInterestByType(vintages, currentQuarter, quarterlyRate, nplStock);
  
  return {
    performingInterest: result.performingInterest,
    nplInterest: result.nplInterest,
    totalInterest: result.totalInterest,
    performingStock: result.performingPrincipal,
    breakdown: result.breakdown,
    details: result.allDetails
  };
};

/**
 * Main calculation function with QUARTERLY data exposure
 */
export const calculateCreditProductQuarterly = (product, assumptions, years) => {
  // Calculate volumes
  const volumes10Y = calculateVolumes(product, years);
  
  // Create vintages
  const vintages = createVintages(product, assumptions, volumes10Y);
  
  // Initialize quarterly arrays (40 quarters for 10 years)
  const totalQuarters = years.length * 4;
  const quarterlyPerformingStock = new Array(totalQuarters).fill(0);
  const quarterlyNPLStock = new Array(totalQuarters).fill(0);
  const quarterlyNewNPLs = new Array(totalQuarters).fill(0);
  const quarterlyInterestIncome = new Array(totalQuarters).fill(0);
  const quarterlyLLP = new Array(totalQuarters).fill(0);
  const quarterlyNewBusiness = new Array(totalQuarters).fill(0);
  const quarterlyPrincipalRepayments = new Array(totalQuarters).fill(0);
  
  // Annual arrays for backward compatibility
  const grossPerformingStock = new Array(10).fill(0);
  const nplStock = new Array(10).fill(0);
  const averagePerformingStock = new Array(10).fill(0);
  const newNPLs = new Array(10).fill(0);
  const totalInterestIncome = new Array(10).fill(0);
  const totalPrincipalRepayments = new Array(10).fill(0);
  const totalLLP = new Array(10).fill(0);
  
  // Track state
  let cumulativeNPLStockNet = 0;
  const nplCohorts = [];
  
  const quarterlyRate = getInterestRate(product, assumptions) / 4;
  
  // Process each quarter
  for (let year = 0; year < years.length; year++) {
    let annualLLP = 0;
    let annualNewDefaults = 0;
    let annualInterest = 0;
    let quarterlyPerformingStocksForAvg = [];
    
    for (let quarter = 0; quarter < 4; quarter++) {
      const currentQuarter = year * 4 + quarter;
      
      // Save vintage states
      saveVintageStatesBeforeQuarter(vintages);
      
      // Calculate new business this quarter
      const yearVolume = volumes10Y[year] || 0;
      const quarterAllocation = (assumptions.quarterlyAllocation?.[quarter] || 25) / 100;
      quarterlyNewBusiness[currentQuarter] = yearVolume * quarterAllocation;
      
      // Process NPL recoveries
      const { quarterlyRecoveries, recoveredCohortIndices } = processQuarterlyRecoveries(
        nplCohorts, 
        currentQuarter
      );
      cumulativeNPLStockNet -= quarterlyRecoveries;
      
      for (let i = recoveredCohortIndices.length - 1; i >= 0; i--) {
        nplCohorts.splice(recoveredCohortIndices[i], 1);
      }
      
      // Process danger rate defaults using new microservice
      const dangerRateResult = processDangerRate(vintages, currentQuarter, product);
      
      quarterlyNewNPLs[currentQuarter] = dangerRateResult.newDefaults;
      annualNewDefaults += dangerRateResult.newDefaults;
      
      quarterlyLLP[currentQuarter] = dangerRateResult.llp;
      annualLLP += dangerRateResult.llp;
      
      // Update NPL stock with new defaults
      cumulativeNPLStockNet += dangerRateResult.newDefaults;
      
      // Add NPL cohorts for recovery tracking
      if (dangerRateResult.newDefaults > 0) {
        const recoveryQuarter = currentQuarter + Math.round((product.timeToRecover || 3) * 4);
        nplCohorts.push({
          quarter: currentQuarter,
          amount: dangerRateResult.newDefaults,
          recoveryQuarter: recoveryQuarter,
          type: 'vintage_default'
        });
      }
      
      // Calculate interest AFTER defaults
      const interestResult = calculateQuarterlyInterestFixed(
        vintages,
        currentQuarter,
        cumulativeNPLStockNet,
        quarterlyRate,
        product
      );
      
      quarterlyInterestIncome[currentQuarter] = interestResult.totalInterest;
      annualInterest += interestResult.totalInterest;
      quarterlyPerformingStocksForAvg.push(interestResult.performingStock);
      
      // Calculate total principal BEFORE updates
      let principalBefore = 0;
      vintages.forEach(vintage => {
        const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
        const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
        if (vintageStartQuarter <= currentQuarter && currentQuarter < vintageMaturityQuarter) {
          principalBefore += vintage.outstandingPrincipal;
        }
      });
      
      // Update principal for amortizing loans
      updateAllVintagePrincipals(vintages, currentQuarter, product, assumptions);
      
      // Calculate total principal AFTER updates
      let principalAfter = 0;
      vintages.forEach(vintage => {
        const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
        const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
        if (vintageStartQuarter <= currentQuarter && currentQuarter < vintageMaturityQuarter) {
          principalAfter += vintage.outstandingPrincipal;
        }
      });
      
      // The repayment is the difference
      quarterlyPrincipalRepayments[currentQuarter] = principalBefore - principalAfter;
      
      // Calculate quarter-end performing stock AFTER principal updates
      const assetCalculation = calculateNetPerformingAssets(vintages, currentQuarter, cumulativeNPLStockNet);
      
      quarterlyPerformingStock[currentQuarter] = assetCalculation.performingStock;
      quarterlyNPLStock[currentQuarter] = assetCalculation.nplStock;
    }
    
    // Store annual aggregates
    const yearEndQuarter = (year + 1) * 4 - 1;
    grossPerformingStock[year] = quarterlyPerformingStock[yearEndQuarter];
    nplStock[year] = quarterlyNPLStock[yearEndQuarter];
    totalInterestIncome[year] = annualInterest;
    totalLLP[year] = -annualLLP;
    newNPLs[year] = annualNewDefaults;
    averagePerformingStock[year] = quarterlyPerformingStocksForAvg.reduce((sum, stock) => sum + stock, 0) / 4;
    
    // Sum quarterly repayments for annual total
    let annualRepayments = 0;
    for (let q = 0; q < 4; q++) {
      annualRepayments += quarterlyPrincipalRepayments[year * 4 + q];
    }
    totalPrincipalRepayments[year] = annualRepayments;
  }
  
  // Calculate derived metrics
  const commissionIncome = calculateCommissionIncome(volumes10Y, product.commissionRate);
  const numberOfLoans = calculateNumberOfLoans(volumes10Y, product.avgLoanSize);
  const equityUpsideIncome = calculateEquityUpsideIncome(grossPerformingStock, product.equityUpside, years);
  const rwa = calculateRWA(grossPerformingStock, nplStock, product);
  
  const interestExpense = averagePerformingStock.map(avgStock => 
    calculateFTPExpense(avgStock, assumptions)
  );
  
  // Calculate quarterly interest expense
  const quarterlyInterestExpense = quarterlyPerformingStock.map((stock, q) => {
    const ftpRate = (assumptions.euribor + assumptions.ftpSpread) / 100 / 4; // Quarterly rate
    return -stock * ftpRate;
  });
  
  return {
    // Annual data (backward compatibility)
    performingAssets: grossPerformingStock,
    nonPerformingAssets: nplStock,
    averagePerformingAssets: averagePerformingStock,
    actualAverageStock: averagePerformingStock,
    newNPLs: newNPLs,
    interestIncome: totalInterestIncome,
    interestExpense: interestExpense,
    commissionIncome: commissionIncome,
    llp: totalLLP,
    rwa: rwa,
    numberOfLoans: numberOfLoans,
    volumes: volumes10Y,
    equityUpsideIncome: equityUpsideIncome,
    principalRepayments: totalPrincipalRepayments,
    
    // NEW: Quarterly data
    quarterly: {
      performingStock: quarterlyPerformingStock,
      nplStock: quarterlyNPLStock,
      newNPLs: quarterlyNewNPLs,
      interestIncome: quarterlyInterestIncome,
      interestExpense: quarterlyInterestExpense,
      llp: quarterlyLLP,
      newBusiness: quarterlyNewBusiness,
      principalRepayments: quarterlyPrincipalRepayments,
      quarters: totalQuarters
    }
  };
};