/**
 * French Loan without Grace Period Interest Calculator Microservice
 * 
 * For French loans without grace period:
 * - Constant installments (principal + interest) from the first quarter after disbursement
 * - Principal amortizes immediately from start
 * - Each payment contains both interest and principal portions
 */

/**
 * Calculate quarterly payment for French amortization
 * @param {number} principal - Principal amount
 * @param {number} quarterlyRate - Quarterly interest rate
 * @param {number} totalQuarters - Total quarters in loan term
 * @returns {number} Quarterly payment amount
 */
const calculateFrenchQuarterlyPayment = (principal, quarterlyRate, totalQuarters) => {
  if (quarterlyRate === 0) {
    return principal / totalQuarters;
  }
  
  const compound = Math.pow(1 + quarterlyRate, totalQuarters);
  return principal * (quarterlyRate * compound) / (compound - 1);
};

/**
 * Calculate quarterly interest for French loans without grace period
 * @param {Array} vintages - Array of French loan vintages without grace period
 * @param {number} currentQuarter - Current quarter index
 * @param {number} quarterlyRate - Quarterly interest rate
 * @returns {Object} Interest calculation results
 */
export const calculateFrenchNoGraceInterest = (vintages, currentQuarter, quarterlyRate) => {
  let totalInterest = 0;
  let interestBearingPrincipal = 0;
  const details = [];
  
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    const totalLoanQuarters = vintageMaturityQuarter - vintageStartQuarter;
    
    // Interest accrues from the quarter AFTER disbursement until maturity
    if (vintageStartQuarter < currentQuarter && currentQuarter <= vintageMaturityQuarter) {
      const quartersElapsed = currentQuarter - vintageStartQuarter;
      
      // Calculate remaining principal at start of current quarter
      const quarterlyPayment = calculateFrenchQuarterlyPayment(
        vintage.initialAmount, 
        quarterlyRate, 
        totalLoanQuarters
      );
      
      // Amortization: calculate remaining principal after (quartersElapsed - 1) payments
      let remainingPrincipal = vintage.initialAmount;
      for (let i = 0; i < quartersElapsed - 1; i++) {
        const interestPortion = remainingPrincipal * quarterlyRate;
        const principalPortion = quarterlyPayment - interestPortion;
        remainingPrincipal -= principalPortion;
      }
      
      // Interest for current quarter is calculated on remaining principal
      const interestAmount = remainingPrincipal * quarterlyRate;
      
      totalInterest += interestAmount;
      interestBearingPrincipal += remainingPrincipal;
      
      details.push({
        vintageId: `${vintage.startYear}Q${vintage.startQuarter + 1}`,
        principal: remainingPrincipal,
        rate: quarterlyRate,
        interest: interestAmount,
        type: 'french_no_grace',
        quarterlyPayment,
        quartersElapsed,
        totalQuarters: totalLoanQuarters
      });
    }
  });
  
  return {
    totalInterest,
    interestBearingPrincipal,
    averageRate: interestBearingPrincipal > 0 ? totalInterest / interestBearingPrincipal : 0,
    details,
    calculationType: 'french_no_grace'
  };
};

/**
 * Calculate principal repayment for French loans without grace period
 * @param {Array} vintages - Array of French loan vintages without grace period
 * @param {number} currentQuarter - Current quarter index
 * @param {number} quarterlyRate - Quarterly interest rate
 * @returns {Object} Principal repayment results
 */
export const calculateFrenchNoGracePrincipalRepayment = (vintages, currentQuarter, quarterlyRate) => {
  let totalRepayment = 0;
  const details = [];
  
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    const totalLoanQuarters = vintageMaturityQuarter - vintageStartQuarter;
    
    if (vintageStartQuarter < currentQuarter && currentQuarter <= vintageMaturityQuarter) {
      const quartersElapsed = currentQuarter - vintageStartQuarter;
      
      const quarterlyPayment = calculateFrenchQuarterlyPayment(
        vintage.initialAmount, 
        quarterlyRate, 
        totalLoanQuarters
      );
      
      // Calculate remaining principal at start of current quarter
      let remainingPrincipal = vintage.initialAmount;
      for (let i = 0; i < quartersElapsed - 1; i++) {
        const interestPortion = remainingPrincipal * quarterlyRate;
        const principalPortion = quarterlyPayment - interestPortion;
        remainingPrincipal -= principalPortion;
      }
      
      // Principal repayment for current quarter
      const interestPortion = remainingPrincipal * quarterlyRate;
      const principalRepayment = quarterlyPayment - interestPortion;
      
      totalRepayment += principalRepayment;
      
      details.push({
        vintageId: `${vintage.startYear}Q${vintage.startQuarter + 1}`,
        principalRepayment,
        interestPortion,
        quarterlyPayment,
        remainingPrincipal: remainingPrincipal - principalRepayment,
        type: 'french_no_grace'
      });
    }
  });
  
  return {
    totalRepayment,
    details,
    repaymentType: 'french_no_grace'
  };
};