/**
 * Credit Product Calculator Module
 * 
 * Handles all vintage-based credit product calculations including:
 * - Loan origination and amortization
 * - NPL formation and LLP calculations
 * - Interest income and commission calculations
 */

/**
 * Calculate credit product results using vintage approach
 * 
 * @param {Object} product - Product configuration
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Complete product calculation results
 */
export const calculateCreditProduct = (product, assumptions, years) => {
  // Get interest rate based on product type
  const getInterestRate = (product, assumptions) => {
    if (product.isFixedRate) {
      return (product.spread + 2.0) / 100; // Fixed rate: spread + 2%
    }
    return (assumptions.euribor + product.spread) / 100; // Variable rate: EURIBOR + spread
  };

  // Calculate volumes for each year
  const calculateVolumes = (product, years) => {
    return years.map(i => {
      let yearVolume;
      
      if (product.volumeArray && Array.isArray(product.volumeArray) && product.volumeArray.length === 10) {
        yearVolume = product.volumeArray[i] || 0;
      } else if (product.volumes) {
        const yearKey = `y${i + 1}`;
        if (product.volumes[yearKey] !== undefined) {
          yearVolume = product.volumes[yearKey];
        } else {
          const y1 = product.volumes.y1 || 0;
          const y10 = product.volumes.y10 || 0;
          yearVolume = y1 + ((y10 - y1) * i / 9);
        }
      } else {
        yearVolume = 0;
      }
      
      const quarterlyDist = product.quarterlyDist || [25, 25, 25, 25];
      const quarterlyMultiplier = quarterlyDist.reduce((sum, q) => sum + q, 0) / 100;
      return yearVolume * quarterlyMultiplier;
    });
  };

  // Main calculation
  const volumes10Y = calculateVolumes(product, years);
  const vintages = [];
  
  // Initialize result arrays
  const grossPerformingStock = new Array(10).fill(0);
  const nplStock = new Array(10).fill(0);
  const averagePerformingStock = new Array(10).fill(0);
  const newNPLs = new Array(10).fill(0);
  const totalInterestIncome = new Array(10).fill(0);
  const totalPrincipalRepayments = new Array(10).fill(0);
  
  // Apply credit classification impact on default rate
  const baseDefaultRate = product.dangerRate / 100;
  const classificationMultiplier = product.creditClassification === 'UTP' ? 2.5 : 1.0;
  const adjustedDefaultRate = baseDefaultRate * classificationMultiplier;
  
  // Normalize product type for consistent comparison
  const productType = (product.type || 'french').toLowerCase();
  const durata = Number(product.durata || 7);
  const gracePeriod = Number(product.gracePeriod || 0);
  const spread = product.spread || 0;
  
  // Main calculation loop - process each year
  for (let year = 0; year < years.length; year++) {
    // Step 1: Create new vintage for current year's originations
    if (volumes10Y[year] > 0) {
      vintages.push({
        startYear: year,
        initialAmount: volumes10Y[year],
        outstandingPrincipal: volumes10Y[year],
        type: productType,
        durata: durata,
        gracePeriod: gracePeriod,
        spread: spread,
        isFixedRate: product.isFixedRate || false,
        hasDefaulted: false
      });
    }
    
    // Step 2: Initialize aggregates for current year
    let totalInterestIncomeForYear = 0;
    let totalPrincipalRepaymentsForYear = 0;
    let totalOutstandingStockForYear = 0;
    let totalAverageStockForYear = 0;
    let defaultsForYear = 0;
    
    // Step 3: Process each active vintage
    vintages.forEach((vintage) => {
      const age = year - vintage.startYear;
      
      // Skip if vintage hasn't started yet or is fully repaid
      if (age < 0 || vintage.outstandingPrincipal <= 0.01) return;
      
      // Store beginning of year principal for average calculation
      const beginningPrincipal = vintage.outstandingPrincipal;
      
      // Calculate principal repayment based on loan type
      let principalRepayment = 0;
      
      if (vintage.type === 'bullet') {
        // Bullet loan: repay entire principal at maturity
        if (age === vintage.durata) {
          principalRepayment = vintage.outstandingPrincipal;
        }
      } else if (vintage.type === 'french' || vintage.type === 'amortizing') {
        // French/Amortizing: repay after grace period
        if (age > vintage.gracePeriod && age <= vintage.durata) {
          const remainingPeriods = vintage.durata - vintage.gracePeriod;
          const periodsElapsed = age - vintage.gracePeriod;
          
          if (periodsElapsed > 0 && periodsElapsed <= remainingPeriods) {
            // Calculate using French amortization formula
            const interestRate = getInterestRate({ 
              isFixedRate: vintage.isFixedRate, 
              spread: vintage.spread 
            }, assumptions);
            
            const r = interestRate;
            const n = remainingPeriods;
            const PV = vintage.initialAmount;
            
            // Calculate fixed payment amount
            const annuityPayment = PV * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
            
            // Interest portion of current payment
            const interestPortion = beginningPrincipal * r;
            
            // Principal portion is annuity minus interest
            principalRepayment = Math.min(annuityPayment - interestPortion, beginningPrincipal);
            
            // Ensure we don't overpay
            if (principalRepayment < 0) principalRepayment = 0;
          }
        }
      }
      
      // Apply principal repayment
      vintage.outstandingPrincipal -= principalRepayment;
      totalPrincipalRepaymentsForYear += principalRepayment;
      
      // Ensure outstanding principal doesn't go negative
      if (vintage.outstandingPrincipal < 0) {
        vintage.outstandingPrincipal = 0;
      }
      
      // Interest income calculation (on beginning balance)
      const interestRate = getInterestRate({ 
        isFixedRate: vintage.isFixedRate, 
        spread: vintage.spread 
      }, assumptions);
      const interestIncome = beginningPrincipal * interestRate;
      totalInterestIncomeForYear += interestIncome;
      
      // Track ending balance and average balance
      const endingPrincipal = vintage.outstandingPrincipal;
      const averagePrincipal = (beginningPrincipal + endingPrincipal) / 2;
      totalOutstandingStockForYear += endingPrincipal;
      totalAverageStockForYear += averagePrincipal;
      
      // Default calculation - happens after one year
      if (age === 1 && !vintage.hasDefaulted && vintage.outstandingPrincipal > 0) {
        const defaultAmount = vintage.outstandingPrincipal * adjustedDefaultRate;
        defaultsForYear += defaultAmount;
        vintage.hasDefaulted = true;
      }
    });
    
    // Step 4: Store results for this year
    grossPerformingStock[year] = totalOutstandingStockForYear;
    totalInterestIncome[year] = totalInterestIncomeForYear;
    totalPrincipalRepayments[year] = totalPrincipalRepaymentsForYear;
    averagePerformingStock[year] = totalAverageStockForYear;
    newNPLs[year] = defaultsForYear;
    
    // Update NPL stock (cumulative with recovery)
    if (year === 0) {
      nplStock[year] = newNPLs[year];
    } else {
      const recoveryRate = 0.10; // 10% annual recovery
      nplStock[year] = nplStock[year-1] * (1 - recoveryRate) + newNPLs[year];
    }
  }
  
  // Calculate LLP using average performing assets
  const totalLLP = years.map((_, i) => {
    const avgAssets = averagePerformingStock[i];
    const baseRate = (adjustedDefaultRate * 100); // Convert to percentage
    const coverageRatio = 0.6; // 60% coverage
    return -avgAssets * (baseRate / 100) * coverageRatio;
  });
  
  // Commission income
  const commissionIncome = years.map((_, i) => {
    const newLoans = volumes10Y[i];
    return newLoans * (product.commissionRate || 0) / 100;
  });
  
  // RWA calculation
  const rwa = years.map((_, i) => {
    const performing = grossPerformingStock[i];
    const npl = nplStock[i];
    const performingRWA = performing * (product.rwaDensity || 100) / 100;
    const nplRWA = npl * 1.5; // 150% for NPLs
    return performingRWA + nplRWA;
  });
  
  // Number of loans
  const numberOfLoans = volumes10Y.map(volume => 
    product.avgLoanSize > 0 ? Math.round(volume / product.avgLoanSize) : 0
  );
  
  // Equity upside income (if applicable)
  const equityUpsideIncome = years.map((_, i) => {
    if (product.equityUpside && product.equityUpside > 0) {
      const exitingLoans = i >= 3 ? grossPerformingStock[i-3] * 0.2 : 0;
      return exitingLoans * (product.equityUpside / 100);
    }
    return 0;
  });
  
  return {
    performingAssets: grossPerformingStock,
    nonPerformingAssets: nplStock,
    averagePerformingAssets: averagePerformingStock,
    newNPLs: newNPLs,
    interestIncome: totalInterestIncome,
    commissionIncome: commissionIncome,
    llp: totalLLP,
    rwa: rwa,
    numberOfLoans: numberOfLoans,
    volumes: volumes10Y,
    equityUpsideIncome: equityUpsideIncome,
    principalRepayments: totalPrincipalRepayments
  };
};