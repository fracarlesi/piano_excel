import Decimal from 'decimal.js';
import { BaseAmortizationStrategy } from './BaseStrategy.js';

/**
 * Bullet Loan Strategy
 * Interest-only payments with principal repaid at maturity
 */
export class BulletStrategy extends BaseAmortizationStrategy {
  calculate(params) {
    const { principal, rate, years, quarterlyAllocation } = params;
    
    // Convert to Decimal
    const P = this.toDecimal(principal);
    const annualRate = this.toDecimal(rate).div(100);
    const quarterlyRate = annualRate.div(4);
    const numQuarters = years * 4;
    
    // For bullet loans, quarterly payment is interest only
    const quarterlyInterest = this.calculateInterest(P, quarterlyRate);
    
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
        endingBalance: this.toNumber(outstandingPrincipal)
      };
      
      // Process each quarter
      for (let q = 0; q < 4; q++) {
        quarterIndex++;
        const isLastQuarter = quarterIndex === numQuarters;
        
        // Calculate payments
        const interestPayment = this.toNumber(quarterlyInterest);
        const principalPayment = isLastQuarter ? this.toNumber(P) : 0;
        const totalPayment = interestPayment + principalPayment;
        
        // Update balance only on final payment
        if (isLastQuarter) {
          outstandingPrincipal = this.toDecimal(0);
        }
        
        // Store quarter data
        const quarterData = {
          quarter: q + 1,
          payment: totalPayment,
          principal: principalPayment,
          interest: interestPayment,
          balance: this.toNumber(outstandingPrincipal)
        };
        
        yearData.quarters.push(quarterData);
        yearData.totalPrincipal += principalPayment;
        yearData.totalInterest += interestPayment;
        yearData.totalPayment += totalPayment;
      }
      
      yearData.endingBalance = this.toNumber(outstandingPrincipal);
      schedule.push(yearData);
    }
    
    // Calculate summary statistics
    const totalInterest = this.toNumber(quarterlyInterest.mul(numQuarters));
    const summary = {
      totalPrincipal: this.toNumber(P),
      totalInterest: totalInterest,
      totalPayments: this.toNumber(P.plus(totalInterest)),
      effectiveRate: annualRate.mul(100).toNumber(),
      quarterlyInterestPayment: this.toNumber(quarterlyInterest),
      balloonPayment: this.toNumber(P),
      schedule
    };
    
    return summary;
  }
}