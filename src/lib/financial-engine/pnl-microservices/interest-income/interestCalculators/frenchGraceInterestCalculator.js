/**
 * French Loan with Grace Period Interest Calculator Microservice
 * 
 * For French loans with grace period:
 * - Grace period: Only interest payments on full principal
 * - After grace: Constant installments (principal + interest)
 * - Principal amortizes only after grace period ends
 */

/**
 * Calculate quarterly payment for French amortization (post-grace period)
 * @param {number} principal - Remaining principal amount
 * @param {number} quarterlyRate - Quarterly interest rate
 * @param {number} remainingQuarters - Quarters left in amortization period
 * @returns {number} Quarterly payment amount
 */
const calculateFrenchQuarterlyPayment = (principal, quarterlyRate, remainingQuarters) => {
  if (quarterlyRate === 0) {
    return principal / remainingQuarters;
  }
  
  const compound = Math.pow(1 + quarterlyRate, remainingQuarters);
  return principal * (quarterlyRate * compound) / (compound - 1);
};

/**
 * Calculate quarterly interest for French loans with grace period
 * @param {Array} vintages - Array of French loan vintages with grace period
 * @param {number} currentQuarter - Current quarter index
 * @param {number} quarterlyRate - Quarterly interest rate
 * @returns {Object} Interest calculation results
 */
export const calculateFrenchGraceInterest = (vintages, currentQuarter, quarterlyRate) => {
  let totalInterest = 0;
  let interestBearingPrincipal = 0;
  const details = [];
  
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    const gracePeriodQuarters = vintage.gracePeriod; // Already in quarters
    const graceEndQuarter = vintageStartQuarter + gracePeriodQuarters;
    
    // Interest accrues from the quarter AFTER disbursement until maturity
    if (vintageStartQuarter < currentQuarter && currentQuarter <= vintageMaturityQuarter) {
      let interestAmount = 0;
      let principal = vintage.outstandingPrincipal;
      
      if (currentQuarter < graceEndQuarter) {
        // GRACE PERIOD: Interest only on full principal
        interestAmount = vintage.initialAmount * quarterlyRate;
        principal = vintage.initialAmount;
        
        details.push({
          vintageId: `${vintage.startYear}Q${vintage.startQuarter + 1}`,
          principal: vintage.initialAmount,
          rate: quarterlyRate,
          interest: interestAmount,
          type: 'french_grace_period',
          phase: 'grace'
        });
      } else {
        // AMORTIZATION PERIOD: Interest on declining principal
        const totalAmortizationQuarters = vintageMaturityQuarter - graceEndQuarter;
        const quartersInAmortization = currentQuarter - graceEndQuarter;
        
        // Calculate remaining principal using French amortization
        const quarterlyPayment = calculateFrenchQuarterlyPayment(
          vintage.initialAmount, 
          quarterlyRate, 
          totalAmortizationQuarters
        );
        
        // Remaining principal after (quartersInAmortization - 1) payments
        // We calculate interest on principal at START of current quarter
        let remainingPrincipal = vintage.initialAmount;
        for (let i = 0; i < quartersInAmortization - 1; i++) {
          const interestPortion = remainingPrincipal * quarterlyRate;
          const principalPortion = quarterlyPayment - interestPortion;
          remainingPrincipal -= principalPortion;
        }
        
        interestAmount = remainingPrincipal * quarterlyRate;
        principal = remainingPrincipal;
        
        details.push({
          vintageId: `${vintage.startYear}Q${vintage.startQuarter + 1}`,
          principal: remainingPrincipal,
          rate: quarterlyRate,
          interest: interestAmount,
          type: 'french_amortization',
          phase: 'amortization',
          quarterlyPayment,
          quartersInAmortization
        });
      }
      
      totalInterest += interestAmount;
      interestBearingPrincipal += principal;
    }
  });
  
  return {
    totalInterest,
    interestBearingPrincipal,
    averageRate: interestBearingPrincipal > 0 ? totalInterest / interestBearingPrincipal : 0,
    details,
    calculationType: 'french_with_grace'
  };
};

/**
 * Calculate principal repayment for French loans with grace period
 * @param {Array} vintages - Array of French loan vintages with grace period
 * @param {number} currentQuarter - Current quarter index
 * @param {number} quarterlyRate - Quarterly interest rate
 * @returns {Object} Principal repayment results
 */
export const calculateFrenchGracePrincipalRepayment = (vintages, currentQuarter, quarterlyRate) => {
  let totalRepayment = 0;
  const details = [];
  
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    const gracePeriodQuarters = vintage.gracePeriod; // Already in quarters
    const graceEndQuarter = vintageStartQuarter + gracePeriodQuarters;
    
    if (vintageStartQuarter < currentQuarter && currentQuarter <= vintageMaturityQuarter) {
      if (currentQuarter < graceEndQuarter) {
        // GRACE PERIOD: No principal repayment
        details.push({
          vintageId: `${vintage.startYear}Q${vintage.startQuarter + 1}`,
          principalRepayment: 0,
          type: 'french_grace_no_repayment'
        });
      } else {
        // AMORTIZATION PERIOD: Principal portion of constant payment
        const totalAmortizationQuarters = vintageMaturityQuarter - graceEndQuarter;
        const quartersInAmortization = currentQuarter - graceEndQuarter;
        
        const quarterlyPayment = calculateFrenchQuarterlyPayment(
          vintage.initialAmount, 
          quarterlyRate, 
          totalAmortizationQuarters
        );
        
        // Calculate remaining principal at start of current quarter
        let remainingPrincipal = vintage.initialAmount;
        for (let i = 0; i < quartersInAmortization - 1; i++) {
          const interestPortion = remainingPrincipal * quarterlyRate;
          const principalPortion = quarterlyPayment - interestPortion;
          remainingPrincipal -= principalPortion;
        }
        
        const interestPortion = remainingPrincipal * quarterlyRate;
        const principalRepayment = quarterlyPayment - interestPortion;
        
        totalRepayment += principalRepayment;
        
        details.push({
          vintageId: `${vintage.startYear}Q${vintage.startQuarter + 1}`,
          principalRepayment,
          interestPortion,
          quarterlyPayment,
          type: 'french_amortization'
        });
      }
    }
  });
  
  return {
    totalRepayment,
    details,
    repaymentType: 'french_with_grace'
  };
};