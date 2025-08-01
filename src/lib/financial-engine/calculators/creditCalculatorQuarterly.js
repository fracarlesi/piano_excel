/**
 * Credit Product Calculator Module - True Quarterly Default Logic
 * 
 * This version applies default rates on beginning-of-quarter stock only
 */

import { createVintages, getInterestRate } from './vintageManager.js';
import { calculateAnnualInterest, calculateFTPExpense } from './interestCalculator.js';
import { calculateAnnualRepayments, updateAllVintagePrincipals } from './amortizationCalculator.js';
import { 
  processQuarterlyDefaultsAligned,
  saveVintageStatesBeforeQuarter,
  calculateYearEndPerformingStock 
} from './defaultCalculatorAligned.js';
import { processQuarterlyRecoveries } from './recoveryCalculator.js';
import { calculateLLP } from './llpCalculator.js';
import { 
  calculateVolumes, 
  calculateNumberOfLoans, 
  calculateCommissionIncome,
  calculateEquityUpsideIncome 
} from './volumeCalculator.js';

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
 * Main calculation function with true quarterly default logic
 */
export const calculateCreditProductQuarterly = (product, assumptions, years) => {
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
  
  // Get quarterly rate for interest
  const quarterlyRate = getInterestRate(product, assumptions) / 4;
  
  // Main calculation loop by year
  for (let year = 0; year < years.length; year++) {
    let annualLLP = 0;
    let annualNewDefaults = 0;
    
    // NPL stock updater function for interest calculation
    const getNPLStockForQuarter = (quarter) => cumulativeNPLStockNet;
    
    // Process each quarter
    for (let quarter = 0; quarter < 4; quarter++) {
      const currentQuarter = year * 4 + quarter;
      
      // CRITICAL: Save vintage states BEFORE any quarter processing
      saveVintageStatesBeforeQuarter(vintages);
      
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
      
      // Process defaults using beginning-of-quarter stock
      const { newDefaults, newNPLCohorts } = processQuarterlyDefaultsAligned(
        vintages,
        currentQuarter,
        year,
        quarter,
        product
      );
      
      annualNewDefaults += newDefaults;
      
      // Calculate LLP using dedicated calculator
      // Get total performing stock at beginning of quarter
      let totalPerformingStock = 0;
      vintages.forEach(vintage => {
        const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
        const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
        
        if (vintageStartQuarter < currentQuarter && currentQuarter < vintageMaturityQuarter) {
          const beginningStock = vintage.outstandingPrincipalBeforeQuarter || vintage.outstandingPrincipal;
          totalPerformingStock += beginningStock;
        }
      });
      
      // Calculate quarterly LLP
      const llpResult = calculateLLP({
        performingStock: totalPerformingStock,
        dangerRate: product.dangerRate || 0,
        productParameters: product,
        quarterlyInterestRate: quarterlyRate
      });
      
      annualLLP += llpResult.llp;
      
      // Update NPL stock with recovery NPV
      cumulativeNPLStockNet += llpResult.recoveryNPV;
      
      // Add recovery cohorts for future tracking
      if (llpResult.newDefaults > 0) {
        const recoveryQuarter = currentQuarter + Math.round((product.timeToRecover || 3) * 4);
        nplCohorts.push({
          quarter: currentQuarter,
          amount: llpResult.recoveryNPV,
          recoveryQuarter: recoveryQuarter,
          type: 'standard'
        });
      }
      
      // Update principal for amortizing loans (includes new disbursements)
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
    principalRepayments: totalPrincipalRepayments
  };
};