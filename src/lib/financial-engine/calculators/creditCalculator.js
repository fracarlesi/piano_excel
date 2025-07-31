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
  // Calculate FTP rate for interest expense
  const ftpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
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
        yearVolume = product.volumeArray[i];
      } else if (product.volumes) {
        const yearKey = `y${i + 1}`;
        if (product.volumes[yearKey] !== undefined) {
          yearVolume = product.volumes[yearKey];
        } else {
          const y1 = product.volumes.y1;
          const y10 = product.volumes.y10;
          yearVolume = y1 + ((y10 - y1) * i / 9);
        }
      } else {
        yearVolume = 0;
      }
      
      const quarterlyDist = assumptions.quarterlyAllocation;
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
  const durata = Number(product.durata);
  const gracePeriod = Number(product.gracePeriod);
  const spread = product.spread;
  
  // Create quarterly vintages with detailed amortization schedule
  for (let year = 0; year < years.length; year++) {
    if (volumes10Y[year] > 0) {
      const quarterlyDist = assumptions.quarterlyAllocation;
      
      // Create 4 quarterly vintages for each year
      for (let quarter = 0; quarter < 4; quarter++) {
        const quarterVolume = volumes10Y[year] * (quarterlyDist[quarter] / 100);
        
        if (quarterVolume > 0) {
          const vintage = {
            startYear: year,
            startQuarter: quarter, // Q0, Q1, Q2, Q3
            initialAmount: quarterVolume,
            outstandingPrincipal: quarterVolume,
            type: productType,
            durata: durata,
            gracePeriod: gracePeriod,
            spread: spread,
            isFixedRate: product.isFixedRate,
            hasDefaulted: false,
            // Calculate maturity quarter (start + duration in quarters)
            maturityYear: year + Math.floor((quarter + durata * 4) / 4),
            maturityQuarter: (quarter + durata * 4) % 4
          };
          
          // For French loans, calculate quarterly payment
          if (productType === 'french' || productType === 'amortizing') {
            const quarterlyRate = getInterestRate(product, assumptions) / 4;
            const totalQuarters = durata * 4;
            const gracePeriodQuarters = gracePeriod * 4;
            const amortizationQuarters = totalQuarters - gracePeriodQuarters; // Exclude grace period from amortization
            
            if (quarterlyRate > 0 && amortizationQuarters > 0) {
              // French amortization formula for quarterly payments (excluding grace period)
              // During grace period: no payments
              // After grace period: amortize over remaining quarters
              const compoundFactor = Math.pow(1 + quarterlyRate, amortizationQuarters);
              vintage.quarterlyPayment = quarterVolume * 
                (quarterlyRate * compoundFactor) / (compoundFactor - 1);
            } else {
              vintage.quarterlyPayment = amortizationQuarters > 0 ? quarterVolume / amortizationQuarters : 0;
            }
            
            // Initialize amortization schedule
            vintage.amortizationSchedule = [];
          }
          
          vintages.push(vintage);
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
    
    // Calculate quarterly interest and update amortization for each quarter
    for (let quarter = 0; quarter < 4; quarter++) {
      let quarterlyOutstandingStock = 0;
      const currentQuarter = year * 4 + quarter;
      
      // Process each vintage for this quarter
      vintages.forEach((vintage) => {
        const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
        const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
        
        // Check if vintage is active in this quarter
        // Interest starts from the quarter AFTER disbursement (banking convention)
        // For Bullet loans, include the maturity quarter (<=) to calculate interest until maturity
        // For amortizing loans, exclude maturity quarter (<) as loan is fully repaid
        const includeMaturityQuarter = vintage.type === 'bullet' ? currentQuarter <= vintageMaturityQuarter : currentQuarter < vintageMaturityQuarter;
        if (currentQuarter > vintageStartQuarter && includeMaturityQuarter) {
          
          // For French loans, update outstanding principal each quarter
          // First payment is in the quarter AFTER disbursement (standard banking practice)
          if ((vintage.type === 'french' || vintage.type === 'amortizing') && currentQuarter > vintageStartQuarter) {
            const quartersElapsed = currentQuarter - vintageStartQuarter;
            const gracePeriodQuarters = gracePeriod * 4; // Convert years to quarters
            const quarterlyRate = getInterestRate(product, assumptions) / 4;
            
            // During grace period, no principal repayment occurs
            if (quartersElapsed <= gracePeriodQuarters) {
              // Grace period: capital remains constant, only interest accumulates
              // No principal repayment during grace period
            } else {
              // Post grace period: normal amortization
              // Calculate interest on current outstanding balance
              const interestPayment = vintage.outstandingPrincipal * quarterlyRate;
              const principalPayment = vintage.quarterlyPayment - interestPayment;
              
              // Update outstanding principal
              vintage.outstandingPrincipal = Math.max(0, vintage.outstandingPrincipal - principalPayment);
            }
            
            // Debug for French loans
            if (product.durata <= 10 && quartersElapsed <= 4) {
            }
          }
          
          quarterlyOutstandingStock += vintage.outstandingPrincipal;
        }
      });
      
      // Calculate quarterly interest on actual outstanding stock
      const interestRate = getInterestRate(product, assumptions);
      const quarterlyInterestRate = interestRate / 4;
      const quarterlyInterest = quarterlyOutstandingStock * quarterlyInterestRate;
      
      totalInterestIncomeForYear += quarterlyInterest;
      
      // Debug for all loans
      if (product.durata <= 5 && quarterlyOutstandingStock > 0) {
      }
    }
    
    // Calculate end-of-year outstanding stock and principal repayments
    vintages.forEach((vintage) => {
      const currentYearEnd = (year + 1) * 4; // End of current year in quarters
      const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
      const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
      
      // Calculate principal repayments during the year
      if (vintage.type === 'bullet') {
        // Bullet: full repayment at maturity
        if (vintageMaturityQuarter <= currentYearEnd && vintageMaturityQuarter > year * 4) {
          totalPrincipalRepaymentsForYear += vintage.initialAmount;
        }
      } else if (vintage.type === 'french' || vintage.type === 'amortizing') {
        // French: calculate exact principal repayments for each quarter
        const startOfYear = Math.max(year * 4, vintageStartQuarter);
        const endOfYear = Math.min(currentYearEnd, vintageMaturityQuarter);
        
        if (endOfYear > startOfYear) {
          // Track the outstanding principal at start of year
          let outstandingAtYearStart = vintage.initialAmount;
          const quarterlyRate = getInterestRate(product, assumptions) / 4;
          
          // Calculate principal repaid up to start of year
          for (let q = vintageStartQuarter + 1; q < startOfYear; q++) {
            if (q > vintageStartQuarter) {
              const interestPayment = outstandingAtYearStart * quarterlyRate;
              const principalPayment = vintage.quarterlyPayment - interestPayment;
              outstandingAtYearStart -= principalPayment;
            }
          }
          
          // Now calculate principal repayments during this year
          let yearlyPrincipalRepayment = 0;
          let currentOutstanding = outstandingAtYearStart;
          
          for (let q = startOfYear; q < endOfYear; q++) {
            if (q > vintageStartQuarter) {
              const interestPayment = currentOutstanding * quarterlyRate;
              const principalPayment = vintage.quarterlyPayment - interestPayment;
              yearlyPrincipalRepayment += principalPayment;
              currentOutstanding -= principalPayment;
            }
          }
          
          totalPrincipalRepaymentsForYear += yearlyPrincipalRepayment;
        }
      }
      
      // Outstanding stock at year end (use actual outstanding principal)
      // For Bullet loans: include if maturity is after year end (loan still outstanding)
      // For amortizing loans: same logic
      if (vintageMaturityQuarter > currentYearEnd && vintage.outstandingPrincipal > 0) {
        totalOutstandingStockForYear += vintage.outstandingPrincipal;
        
        // Debug for first year of 5-year loans
        if (year === 0 && product.durata === 5 && product.name && product.name.includes('ipotecario')) {
          console.log('Year-end stock debug:', {
            year: year + 1,
            vintageOutstanding: vintage.outstandingPrincipal,
            totalStock: totalOutstandingStockForYear,
            initialAmount: vintage.initialAmount
          });
        }
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
    return newLoans * product.commissionRate / 100;
  });
  
  // RWA calculation
  const rwa = years.map((_, i) => {
    const performing = grossPerformingStock[i];
    const npl = nplStock[i];
    const performingRWA = performing * product.rwaDensity / 100;
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
  
  // Calculate actual average quarterly outstanding stock used for interest calculation
  const actualAverageStock = totalInterestIncome.map((interest, i) => {
    // Reverse engineer from interest calculation: interest = avgStock * rate
    // getInterestRate already returns a decimal (e.g., 0.10 for 10%), so don't divide by 100 again!
    const annualRate = getInterestRate(product, assumptions);
    // The interest is already in millions, so the result is in millions too
    const avgStock = annualRate > 0 ? interest / annualRate : 0;
    return avgStock;
  });

  // Calculate interest expense (FTP cost of funding)
  // Apply FTP rate to the same average stock used for interest income
  const interestExpense = actualAverageStock.map(avgStock => -avgStock * ftpRate);

  return {
    performingAssets: grossPerformingStock,
    nonPerformingAssets: nplStock,
    averagePerformingAssets: averagePerformingStock,
    actualAverageStock: actualAverageStock, // The REAL average stock used for interest calc
    newNPLs: newNPLs,
    interestIncome: totalInterestIncome,
    interestExpense: interestExpense, // FTP cost of funding
    commissionIncome: commissionIncome,
    llp: totalLLP,
    rwa: rwa,
    numberOfLoans: numberOfLoans,
    volumes: volumes10Y,
    equityUpsideIncome: equityUpsideIncome,
    principalRepayments: totalPrincipalRepayments
  };
};