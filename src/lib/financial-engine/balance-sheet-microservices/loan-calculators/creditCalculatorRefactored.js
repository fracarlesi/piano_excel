/**
 * Credit Product Calculator Module (Refactored)
 * 
 * Main orchestrator that uses specialized modules for credit calculations
 * This modular approach ensures better maintainability and isolation of functionality
 */

import { createVintages, getInterestRate } from './vintageManager.js';
import { calculateAnnualInterest, calculateFTPExpense } from '../../pnl-microservices/interest-income/interestCalculator.js';
import { calculateAnnualRepayments, updateAllVintagePrincipals } from './amortizationCalculator.js';
import { 
  getAdjustedDefaultRate, 
  calculateVintageAnnualDefaults,
  processQuarterlyDefaults,
  calculateYearEndPerformingStock 
} from '../../pnl-microservices/llp-calculators/defaultCalculator.js';
import { calculateTotalRecovery, processQuarterlyRecoveries } from '../../pnl-microservices/llp-calculators/recoveryCalculator.js';
import { 
  calculateVolumes, 
  calculateNumberOfLoans, 
  calculateCommissionIncome,
  calculateEquityUpsideIncome 
} from './volumeCalculator.js';
import { calculateNetPerformingAssets } from './netPerformingAssetsCalculator.js';

/**
 * Calculate RWA (Risk Weighted Assets)
 * @param {Array} performingAssets - Array of performing assets
 * @param {Array} nplStock - Array of NPL stock
 * @param {Object} product - Product configuration
 * @returns {Array} RWA array
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
 * Main calculation function using modular approach
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Complete product calculation results
 */
export const calculateCreditProduct = (product, assumptions, years) => {
  // Step 1: Calculate volumes
  const volumes10Y = calculateVolumes(product, years);
  
  // Step 2: Create vintages
  const vintages = createVintages(product, assumptions, volumes10Y);
  
  // Step 3: Initialize result arrays
  const grossPerformingStock = new Array(10).fill(0);
  const nplStock = new Array(10).fill(0);
  const averagePerformingStock = new Array(10).fill(0);
  const newNPLs = new Array(10).fill(0);
  const totalInterestIncome = new Array(10).fill(0);
  const totalPrincipalRepayments = new Array(10).fill(0);
  const totalLLP = new Array(10).fill(0);
  
  // Track state across quarters
  let cumulativeNPLStockNet = 0;
  const nplCohorts = [];
  
  // Get adjusted default rate
  const adjustedDefaultRate = getAdjustedDefaultRate(product);
  const quarterlyRate = getInterestRate(product, assumptions) / 4;
  
  // Main calculation loop by year
  for (let year = 0; year < years.length; year++) {
    let annualLLP = 0;
    let annualNewDefaults = 0;
    
    // Save vintage states at year start
    const vintageStateAtYearStart = new Map();
    vintages.forEach(vintage => {
      vintageStateAtYearStart.set(vintage, {
        outstandingPrincipal: vintage.outstandingPrincipal
      });
    });
    
    // Pre-calculate annual defaults for each vintage
    const annualDefaultsByVintage = new Map();
    const defaultsAppliedByVintage = new Map();
    
    vintages.forEach(vintage => {
      const startBalance = vintageStateAtYearStart.get(vintage).outstandingPrincipal;
      
      // Check if vintage is active and not matured
      const vintageMaturityYear = vintage.maturityYear;
      const isMaturedThisYear = vintage.type === 'bullet' && vintageMaturityYear <= year;
      
      if (startBalance > 0 && !isMaturedThisYear) {
        // Calculate annual defaults based on start-of-year balance
        let annualDefaults;
        
        // Adjust for partial year if this is the vintage's first year
        if (year === vintage.startYear) {
          const quartersActive = 4 - vintage.startQuarter;
          const effectiveRate = adjustedDefaultRate * (quartersActive / 4);
          annualDefaults = startBalance * effectiveRate;
        } else {
          // Full year: apply annual rate to start balance
          annualDefaults = startBalance * adjustedDefaultRate;
        }
        
        annualDefaultsByVintage.set(vintage, annualDefaults);
        defaultsAppliedByVintage.set(vintage, 0);
      }
    });
    
    // NPL stock updater function for interest calculation
    const getNPLStockForQuarter = (quarter) => cumulativeNPLStockNet;
    
    // Process each quarter
    for (let quarter = 0; quarter < 4; quarter++) {
      const currentQuarter = year * 4 + quarter;
      
      // Process NPL recoveries
      const { quarterlyRecoveries, recoveredCohortIndices } = processQuarterlyRecoveries(
        nplCohorts, 
        currentQuarter
      );
      cumulativeNPLStockNet -= quarterlyRecoveries;
      
      // Remove recovered cohorts
      for (let i = recoveredCohortIndices.length - 1; i >= 0; i--) {
        nplCohorts.splice(recoveredCohortIndices[i], 1);
      }
      
      // Process defaults
      const { newDefaults, newNPLCohorts } = processQuarterlyDefaults(
        vintages,
        currentQuarter,
        year,
        quarter,
        product,
        annualDefaultsByVintage,
        defaultsAppliedByVintage
      );
      
      annualNewDefaults += newDefaults;
      
      // Calculate recovery and LLP for new defaults
      newNPLCohorts.forEach(nplData => {
        const recovery = calculateTotalRecovery(
          nplData.amount,
          product,
          quarterlyRate,
          currentQuarter
        );
        
        annualLLP += recovery.llp;
        cumulativeNPLStockNet += recovery.totalNPVRecovery;
        
        // Add recovery cohorts
        recovery.nplCohorts.forEach(cohort => nplCohorts.push(cohort));
      });
      
      // Update principal for amortizing loans
      updateAllVintagePrincipals(vintages, currentQuarter, product, assumptions);
    }
    
    // Calculate annual interest
    const interestResults = calculateAnnualInterest(
      vintages,
      year,
      cumulativeNPLStockNet,
      product,
      assumptions,
      getNPLStockForQuarter
    );
    
    // Calculate annual repayments
    const { totalRepayments } = calculateAnnualRepayments(vintages, year, product, assumptions);
    
    // Calculate year-end performing stock
    const yearEndPerformingStock = calculateYearEndPerformingStock(vintages, year);
    
    // Store annual results
    grossPerformingStock[year] = yearEndPerformingStock;
    nplStock[year] = cumulativeNPLStockNet;
    totalInterestIncome[year] = interestResults.totalInterest;
    totalPrincipalRepayments[year] = Math.abs(totalRepayments);
    totalLLP[year] = -annualLLP; // Negative sign for cost
    newNPLs[year] = annualNewDefaults;
    averagePerformingStock[year] = interestResults.averagePerformingStock;
  }
  
  // Calculate derived metrics
  const commissionIncome = calculateCommissionIncome(volumes10Y, product.commissionRate);
  const numberOfLoans = calculateNumberOfLoans(volumes10Y, product.avgLoanSize);
  const equityUpsideIncome = calculateEquityUpsideIncome(grossPerformingStock, product.equityUpside, years);
  const rwa = calculateRWA(grossPerformingStock, nplStock, product);
  
  // Calculate interest expense (FTP)
  const interestExpense = averagePerformingStock.map(avgStock => 
    calculateFTPExpense(avgStock, assumptions)
  );
  
  // Calculate quarterly data using detailed tracking
  const quarterlyPeriods = 40; // 10 years * 4 quarters
  const quarterlyData = {
    performingStock: new Array(quarterlyPeriods).fill(0),
    nplStock: new Array(quarterlyPeriods).fill(0),
    interestIncome: new Array(quarterlyPeriods).fill(0),
    interestExpense: new Array(quarterlyPeriods).fill(0),
    llp: new Array(quarterlyPeriods).fill(0),
    newDefaults: new Array(quarterlyPeriods).fill(0)
  };
  
  // Need to recreate the quarterly simulation to get accurate quarterly values
  // Reset vintages to initial state for quarterly calculation
  const quarterlyVintages = vintages.map(v => ({
    ...v,
    outstandingPrincipal: v.initialAmount
  }));
  
  let quarterlyNPLStock = 0;
  const quarterlyNPLCohorts = [];
  
  for (let q = 0; q < quarterlyPeriods; q++) {
    const year = Math.floor(q / 4);
    const quarter = q % 4;
    
    // Process quarterly amortization for all vintages
    quarterlyVintages.forEach(vintage => {
      const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
      
      if (q > vintageStartQuarter && vintage.type === 'french' && vintage.quarterlyPayment) {
        const gracePeriodQuarters = vintage.gracePeriod || 0;
        const graceEndQuarter = vintageStartQuarter + gracePeriodQuarters;
        
        if (q > graceEndQuarter) {
          // Apply quarterly payment (reduces principal)
          const quarterlyInterest = vintage.outstandingPrincipal * (getInterestRate(product, assumptions) / 4);
          const principalPayment = Math.max(0, vintage.quarterlyPayment - quarterlyInterest);
          vintage.outstandingPrincipal = Math.max(0, vintage.outstandingPrincipal - principalPayment);
        }
      }
    });
    
    // Calculate quarterly performing stock using the microservice
    const { performingStock } = calculateNetPerformingAssets(quarterlyVintages, q, quarterlyNPLStock);
    
    quarterlyData.performingStock[q] = performingStock;
    quarterlyData.nplStock[q] = quarterlyNPLStock;
    
    // Interest income/expense (simplified for now - should be recalculated quarterly)
    if (year < 10) {
      quarterlyData.interestIncome[q] = totalInterestIncome[year] / 4;
      quarterlyData.interestExpense[q] = interestExpense[year] / 4;
      quarterlyData.llp[q] = totalLLP[year] / 4;
    }
  }
  
  return {
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
    quarterly: quarterlyData
  };
};