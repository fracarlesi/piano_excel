/**
 * Bullet Loan Interest Calculator Microservice
 * 
 * For bullet loans:
 * - Interest calculated on full principal amount each quarter
 * - Principal remains constant until maturity
 * - At maturity: full principal repayment + final interest payment
 */

/**
 * Calculate quarterly interest for bullet loans
 * @param {Array} vintages - Array of bullet loan vintages
 * @param {number} currentQuarter - Current quarter index
 * @param {number} quarterlyRate - Quarterly interest rate
 * @returns {Object} Interest calculation results
 */
export const calculateBulletInterest = (vintages, currentQuarter, quarterlyRate) => {
  let totalInterest = 0;
  let interestBearingPrincipal = 0;
  const details = [];
  
  vintages.forEach(vintage => {
    const vintageStartQuarter = vintage.startYear * 4 + vintage.startQuarter;
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Interest accrues from the quarter AFTER disbursement until maturity (inclusive)
    if (vintageStartQuarter < currentQuarter && currentQuarter <= vintageMaturityQuarter) {
      const interestAmount = vintage.outstandingPrincipal * quarterlyRate;
      totalInterest += interestAmount;
      interestBearingPrincipal += vintage.outstandingPrincipal;
      
      details.push({
        vintageId: `${vintage.startYear}Q${vintage.startQuarter + 1}`,
        principal: vintage.outstandingPrincipal,
        rate: quarterlyRate,
        interest: interestAmount,
        type: 'bullet'
      });
    }
  });
  
  return {
    totalInterest,
    interestBearingPrincipal,
    averageRate: interestBearingPrincipal > 0 ? totalInterest / interestBearingPrincipal : 0,
    details,
    calculationType: 'bullet'
  };
};

/**
 * Calculate principal repayment for bullet loans
 * @param {Array} vintages - Array of bullet loan vintages  
 * @param {number} currentQuarter - Current quarter index
 * @returns {Object} Principal repayment results
 */
export const calculateBulletPrincipalRepayment = (vintages, currentQuarter) => {
  let totalRepayment = 0;
  const details = [];
  
  vintages.forEach(vintage => {
    const vintageMaturityQuarter = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Principal is repaid ONLY at maturity quarter
    if (currentQuarter === vintageMaturityQuarter) {
      totalRepayment += vintage.outstandingPrincipal;
      
      details.push({
        vintageId: `${vintage.startYear}Q${vintage.startQuarter + 1}`,
        principalRepayment: vintage.outstandingPrincipal,
        type: 'bullet_maturity'
      });
    }
  });
  
  return {
    totalRepayment,
    details,
    repaymentType: 'bullet_maturity'
  };
};