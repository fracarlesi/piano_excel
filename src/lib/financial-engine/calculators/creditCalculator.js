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

  // Main calculation with quarterly distribution
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
  
  // Create quarterly vintages with maturity tracking
  for (let year = 0; year < years.length; year++) {
    if (volumes10Y[year] > 0) {
      const quarterlyDist = product.quarterlyDist || [25, 25, 25, 25];
      
      // Create 4 quarterly vintages for each year
      for (let quarter = 0; quarter < 4; quarter++) {
        const quarterVolume = volumes10Y[year] * (quarterlyDist[quarter] / 100);
        
        if (quarterVolume > 0) {
          vintages.push({
            startYear: year,
            startQuarter: quarter, // Q0, Q1, Q2, Q3
            initialAmount: quarterVolume,
            outstandingPrincipal: quarterVolume,
            type: productType,
            durata: durata,
            gracePeriod: gracePeriod,
            spread: spread,
            isFixedRate: product.isFixedRate || false,
            hasDefaulted: false,
            // Calculate maturity quarter (start + duration in quarters)
            maturityYear: year + Math.floor((quarter + durata * 4) / 4),
            maturityQuarter: (quarter + durata * 4) % 4
          });
        }
      }
    }
  }
  
  // Main calculation loop - calculate quarterly rolling stock
  for (let year = 0; year < years.length; year++) {
    let totalInterestIncomeForYear = 0;
    let totalPrincipalRepaymentsForYear = 0;
    let totalOutstandingStockForYear = 0;
    let totalAverageStockForYear = 0;
    let defaultsForYear = 0;
    
    // Calculate quarterly interest for each quarter of the year
    for (let quarter = 0; quarter < 4; quarter++) {
      let quarterlyOutstandingStock = 0;
      
      // Sum all active vintages in this quarter
      vintages.forEach((vintage) => {
        // Check if vintage is active in this quarter
        const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
        const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
        const currentQuarter = year * 4 + quarter;
        
        // Vintage is active if: started <= current < maturity
        if (currentQuarter >= vintageStartQuarter && currentQuarter < vintageMaturityQuarter) {
          quarterlyOutstandingStock += vintage.initialAmount;
        }
      });
      
      // Calculate quarterly interest
      const interestRate = getInterestRate(product, assumptions);
      const quarterlyInterestRate = interestRate / 4; // Convert annual to quarterly
      const quarterlyInterest = quarterlyOutstandingStock * quarterlyInterestRate;
      
      totalInterestIncomeForYear += quarterlyInterest;
      
      // Debug for short-term loans
      if (product.durata <= 2 && quarterlyOutstandingStock > 0) {
        console.log(`Year ${year + 1}, Q${quarter + 1}: Stock ${quarterlyOutstandingStock.toFixed(2)}M€, Interest ${quarterlyInterest.toFixed(3)}M€`);
      }
    }
    
    // Calculate end-of-year outstanding stock and principal repayments
    vintages.forEach((vintage) => {
      const currentYearEnd = (year + 1) * 4; // End of current year in quarters
      const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
      
      // Check if vintage matures this year
      if (vintageMaturityQuarter <= currentYearEnd && vintageMaturityQuarter > year * 4) {
        totalPrincipalRepaymentsForYear += vintage.initialAmount;
      }
      
      // Check if vintage is still outstanding at year end
      if (vintageMaturityQuarter > currentYearEnd) {
        totalOutstandingStockForYear += vintage.initialAmount;
      }
    });
    
    // Calculate average stock (simplified as outstanding stock)
    totalAverageStockForYear = totalOutstandingStockForYear;
    
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