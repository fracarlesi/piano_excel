/**
 * Credit Product Calculator - FIXED VERSION
 * 
 * Corrects the interest calculation to ensure defaults properly reduce
 * the interest-bearing base within each quarter
 */

import { createVintages, getInterestRate } from './vintageManager.js';
import { calculateFTPExpense } from './interestCalculator.js';
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
 * Calculate quarterly interest with proper timing
 * Interest is calculated AFTER defaults are processed
 */
const calculateQuarterlyInterestFixed = (vintages, currentQuarter, nplStock, quarterlyRate, product) => {
  let performingInterest = 0;
  let totalPerformingStock = 0;
  
  // Calculate interest on current performing stock (AFTER defaults)
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Check if vintage is active and interest-bearing
    if (vintageStartQuarter <= currentQuarter && currentQuarter < vintageMaturityQuarter) {
      // Interest starts from quarter AFTER disbursement
      if (currentQuarter > vintageStartQuarter) {
        performingInterest += vintage.outstandingPrincipal * quarterlyRate;
        totalPerformingStock += vintage.outstandingPrincipal;
      }
    }
  });
  
  // Calculate NPL interest on NBV
  const nplInterest = nplStock * quarterlyRate;
  
  return {
    performingInterest,
    nplInterest,
    totalInterest: performingInterest + nplInterest,
    performingStock: totalPerformingStock
  };
};

/**
 * Main calculation function with FIXED interest logic
 */
export const calculateCreditProductFixed = (product, assumptions, years) => {
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
    let annualInterest = 0;
    let quarterlyPerformingStocks = [];
    
    // Process each quarter
    for (let quarter = 0; quarter < 4; quarter++) {
      const currentQuarter = year * 4 + quarter;
      
      // STEP 1: Save vintage states BEFORE any processing
      saveVintageStatesBeforeQuarter(vintages);
      
      // STEP 2: Process NPL recoveries
      const { quarterlyRecoveries, recoveredCohortIndices } = processQuarterlyRecoveries(
        nplCohorts, 
        currentQuarter
      );
      cumulativeNPLStockNet -= quarterlyRecoveries;
      
      // Remove recovered cohorts
      for (let i = recoveredCohortIndices.length - 1; i >= 0; i--) {
        nplCohorts.splice(recoveredCohortIndices[i], 1);
      }
      
      // STEP 3: Process defaults (this reduces vintage.outstandingPrincipal)
      const { newDefaults, newNPLCohorts } = processQuarterlyDefaultsAligned(
        vintages,
        currentQuarter,
        year,
        quarter,
        product
      );
      
      annualNewDefaults += newDefaults;
      
      // STEP 4: Calculate LLP on new defaults
      let totalPerformingStockBeforeDefaults = 0;
      vintages.forEach(vintage => {
        const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
        const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
        
        if (vintageStartQuarter < currentQuarter && currentQuarter < vintageMaturityQuarter) {
          const beginningStock = vintage.outstandingPrincipalBeforeQuarter || vintage.outstandingPrincipal;
          totalPerformingStockBeforeDefaults += beginningStock;
        }
      });
      
      const llpResult = calculateLLP({
        performingStock: totalPerformingStockBeforeDefaults,
        dangerRate: product.dangerRate || 0,
        productParameters: product,
        quarterlyInterestRate: quarterlyRate
      });
      
      annualLLP += llpResult.llp;
      cumulativeNPLStockNet += llpResult.recoveryNPV;
      
      // Add recovery cohorts
      if (llpResult.newDefaults > 0) {
        const recoveryQuarter = currentQuarter + Math.round((product.timeToRecover || 3) * 4);
        nplCohorts.push({
          quarter: currentQuarter,
          amount: llpResult.recoveryNPV,
          recoveryQuarter: recoveryQuarter,
          type: 'standard'
        });
      }
      
      // STEP 5: Calculate interest AFTER defaults are processed
      const interestResult = calculateQuarterlyInterestFixed(
        vintages,
        currentQuarter,
        cumulativeNPLStockNet,
        quarterlyRate,
        product
      );
      
      annualInterest += interestResult.totalInterest;
      quarterlyPerformingStocks.push(interestResult.performingStock);
      
      // STEP 6: Update principal for amortizing loans (includes new disbursements)
      updateAllVintagePrincipals(vintages, currentQuarter, product, assumptions);
    }
    
    // Calculate year-end performing stock
    const yearEndPerformingStock = calculateYearEndPerformingStock(vintages, year);
    
    // Store annual results
    grossPerformingStock[year] = yearEndPerformingStock;
    nplStock[year] = cumulativeNPLStockNet;
    totalInterestIncome[year] = annualInterest;
    totalPrincipalRepayments[year] = 0; // Will be calculated separately
    totalLLP[year] = -annualLLP; // Negative sign for cost
    newNPLs[year] = annualNewDefaults;
    
    // Calculate average performing stock for the year
    averagePerformingStock[year] = quarterlyPerformingStocks.reduce((sum, stock) => sum + stock, 0) / 4;
  }
  
  // Calculate annual repayments
  for (let year = 0; year < years.length; year++) {
    const { totalRepayments } = calculateAnnualRepayments(vintages, year, product, assumptions);
    totalPrincipalRepayments[year] = Math.abs(totalRepayments);
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