import Decimal from 'decimal.js';

/**
 * Base Strategy for Loan Amortization
 * All amortization strategies must extend this class
 */
export class BaseAmortizationStrategy {
  constructor() {
    // Configure Decimal for financial precision
    Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });
  }

  /**
   * Calculate amortization schedule
   * @param {Object} params - Loan parameters
   * @param {number} params.principal - Initial loan amount
   * @param {number} params.rate - Annual interest rate (%)
   * @param {number} params.years - Loan duration in years
   * @param {Array} params.quarterlyAllocation - Quarterly distribution [Q1%, Q2%, Q3%, Q4%]
   * @returns {Object} Amortization results by year
   */
  calculate(params) {
    throw new Error('Strategy must implement calculate method');
  }

  /**
   * Convert JS number to Decimal for precise calculation
   * @param {number} value 
   * @returns {Decimal}
   */
  toDecimal(value) {
    return new Decimal(value || 0);
  }

  /**
   * Convert Decimal to JS number for output
   * @param {Decimal} decimal 
   * @returns {number}
   */
  toNumber(decimal) {
    return decimal.toNumber();
  }

  /**
   * Calculate quarterly distribution of annual amount
   * @param {Decimal} annualAmount 
   * @param {Array} quarterlyAllocation 
   * @returns {Array<Decimal>}
   */
  distributeQuarterly(annualAmount, quarterlyAllocation) {
    const quarters = [];
    const total = quarterlyAllocation.reduce((sum, pct) => sum + pct, 0);
    
    for (let i = 0; i < 4; i++) {
      const pct = this.toDecimal(quarterlyAllocation[i]).div(total);
      quarters.push(annualAmount.mul(pct));
    }
    
    return quarters;
  }

  /**
   * Calculate interest for a period
   * @param {Decimal} principal - Outstanding principal
   * @param {Decimal} rate - Period interest rate
   * @returns {Decimal}
   */
  calculateInterest(principal, rate) {
    return principal.mul(rate);
  }
}