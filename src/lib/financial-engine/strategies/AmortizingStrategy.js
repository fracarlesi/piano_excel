import Decimal from 'decimal.js';
import { BaseAmortizationStrategy } from './BaseStrategy.js';

/**
 * Amortizing Loan Strategy
 * Implements French amortization with constant installments
 */
export class AmortizingStrategy extends BaseAmortizationStrategy {
  calculate(params) {
    const { principal, rate, years, quarterlyAllocation } = params;
    
    // Convert to Decimal
    const P = this.toDecimal(principal);
    const annualRate = this.toDecimal(rate).div(100);
    const quarterlyRate = annualRate.div(4);
    const numQuarters = years * 4;
    
    // Calculate quarterly installment using French amortization formula
    // PMT = P * r * (1 + r)^n / ((1 + r)^n - 1)
    let quarterlyPayment;
    if (quarterlyRate.equals(0)) {
      // No interest case
      quarterlyPayment = P.div(numQuarters);
    } else {
      const factor = quarterlyRate.mul(quarterlyRate.plus(1).pow(numQuarters));
      const divisor = quarterlyRate.plus(1).pow(numQuarters).minus(1);
      quarterlyPayment = P.mul(factor).div(divisor);
    }
    
    // Generate amortization schedule
    const schedule = [];
    let outstandingPrincipal = P;
    let quarterIndex = 0;
    
    for (let year = 0; year < years; year++) {
      const yearData = {
        year: year + 1,
        quarters: [],
        beginningBalance: this.toNumber(outstandingPrincipal),
        totalPrincipal: 0,
        totalInterest: 0,
        totalPayment: 0,
        endingBalance: 0
      };
      
      // Process each quarter
      for (let q = 0; q < 4; q++) {
        if (outstandingPrincipal.greaterThan(0) && quarterIndex < numQuarters) {
          // Calculate interest for the quarter
          const interestPayment = this.calculateInterest(outstandingPrincipal, quarterlyRate);
          
          // Principal repayment is the difference
          let principalPayment = quarterlyPayment.minus(interestPayment);
          
          // Ensure we don't overpay
          if (principalPayment.greaterThan(outstandingPrincipal)) {
            principalPayment = outstandingPrincipal;
          }
          
          // Update outstanding balance
          outstandingPrincipal = outstandingPrincipal.minus(principalPayment);
          
          // Store quarter data
          const quarterData = {
            quarter: q + 1,
            payment: this.toNumber(quarterlyPayment),
            principal: this.toNumber(principalPayment),
            interest: this.toNumber(interestPayment),
            balance: this.toNumber(outstandingPrincipal)
          };
          
          yearData.quarters.push(quarterData);
          yearData.totalPrincipal += quarterData.principal;
          yearData.totalInterest += quarterData.interest;
          yearData.totalPayment += quarterData.payment;
          
          quarterIndex++;
        } else {
          // No payment this quarter
          yearData.quarters.push({
            quarter: q + 1,
            payment: 0,
            principal: 0,
            interest: 0,
            balance: this.toNumber(outstandingPrincipal)
          });
        }
      }
      
      yearData.endingBalance = this.toNumber(outstandingPrincipal);
      schedule.push(yearData);
    }
    
    // Calculate summary statistics
    const summary = {
      totalPrincipal: this.toNumber(P),
      totalInterest: schedule.reduce((sum, year) => sum + year.totalInterest, 0),
      totalPayments: schedule.reduce((sum, year) => sum + year.totalPayment, 0),
      effectiveRate: annualRate.mul(100).toNumber(),
      monthlyPayment: this.toNumber(quarterlyPayment.mul(3)), // Approximate monthly
      schedule
    };
    
    return summary;
  }
}