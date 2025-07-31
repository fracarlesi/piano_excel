import Decimal from 'decimal.js';
import { DECIMAL_PRECISION, DISPLAY_PRECISION } from '../constants.js';

// Configure Decimal globally
Decimal.set({ 
  precision: DECIMAL_PRECISION, 
  rounding: Decimal.ROUND_HALF_UP 
});

/**
 * Utility functions for Decimal.js operations
 * Ensures consistent precision across all financial calculations
 */
export class DecimalUtils {
  /**
   * Convert value to Decimal
   * @param {number|string|Decimal} value 
   * @returns {Decimal}
   */
  static toDecimal(value) {
    if (value instanceof Decimal) return value;
    return new Decimal(value || 0);
  }

  /**
   * Convert Decimal to number
   * @param {Decimal} decimal 
   * @param {number} precision - Decimal places (default: DISPLAY_PRECISION)
   * @returns {number}
   */
  static toNumber(decimal, precision = DISPLAY_PRECISION) {
    if (!(decimal instanceof Decimal)) {
      decimal = this.toDecimal(decimal);
    }
    return decimal.toDecimalPlaces(precision).toNumber();
  }

  /**
   * Add multiple values
   * @param {...number|Decimal} values 
   * @returns {Decimal}
   */
  static add(...values) {
    return values.reduce((sum, val) => {
      return sum.plus(this.toDecimal(val));
    }, new Decimal(0));
  }

  /**
   * Subtract values
   * @param {number|Decimal} minuend 
   * @param {...number|Decimal} subtrahends 
   * @returns {Decimal}
   */
  static subtract(minuend, ...subtrahends) {
    let result = this.toDecimal(minuend);
    for (const val of subtrahends) {
      result = result.minus(this.toDecimal(val));
    }
    return result;
  }

  /**
   * Multiply values
   * @param {...number|Decimal} values 
   * @returns {Decimal}
   */
  static multiply(...values) {
    return values.reduce((product, val) => {
      return product.mul(this.toDecimal(val));
    }, new Decimal(1));
  }

  /**
   * Divide values
   * @param {number|Decimal} dividend 
   * @param {number|Decimal} divisor 
   * @returns {Decimal}
   */
  static divide(dividend, divisor) {
    const d = this.toDecimal(divisor);
    if (d.isZero()) {
      return new Decimal(0);
    }
    return this.toDecimal(dividend).div(d);
  }

  /**
   * Calculate percentage
   * @param {number|Decimal} value 
   * @param {number|Decimal} percentage 
   * @returns {Decimal}
   */
  static percentage(value, percentage) {
    return this.toDecimal(value).mul(this.toDecimal(percentage)).div(100);
  }

  /**
   * Round to specified decimal places
   * @param {number|Decimal} value 
   * @param {number} places 
   * @returns {Decimal}
   */
  static round(value, places = DISPLAY_PRECISION) {
    return this.toDecimal(value).toDecimalPlaces(places);
  }

  /**
   * Calculate compound interest
   * @param {number|Decimal} principal 
   * @param {number|Decimal} rate - Annual rate as percentage
   * @param {number} periods - Number of compounding periods
   * @param {number} periodsPerYear - Compounding frequency (default: 4 for quarterly)
   * @returns {Decimal}
   */
  static compoundInterest(principal, rate, periods, periodsPerYear = 4) {
    const P = this.toDecimal(principal);
    const r = this.toDecimal(rate).div(100).div(periodsPerYear);
    const n = periods;
    
    // A = P(1 + r)^n
    return P.mul(r.plus(1).pow(n));
  }

  /**
   * Calculate present value
   * @param {number|Decimal} futureValue 
   * @param {number|Decimal} rate - Discount rate as percentage
   * @param {number} periods 
   * @param {number} periodsPerYear 
   * @returns {Decimal}
   */
  static presentValue(futureValue, rate, periods, periodsPerYear = 4) {
    const FV = this.toDecimal(futureValue);
    const r = this.toDecimal(rate).div(100).div(periodsPerYear);
    const n = periods;
    
    // PV = FV / (1 + r)^n
    return FV.div(r.plus(1).pow(n));
  }

  /**
   * Sum an array of values
   * @param {Array<number|Decimal>} array 
   * @returns {Decimal}
   */
  static sum(array) {
    return array.reduce((sum, val) => sum.plus(this.toDecimal(val)), new Decimal(0));
  }

  /**
   * Calculate average
   * @param {Array<number|Decimal>} array 
   * @returns {Decimal}
   */
  static average(array) {
    if (array.length === 0) return new Decimal(0);
    return this.sum(array).div(array.length);
  }

  /**
   * Compare two decimals
   * @param {number|Decimal} a 
   * @param {number|Decimal} b 
   * @returns {number} -1 if a < b, 0 if a = b, 1 if a > b
   */
  static compare(a, b) {
    return this.toDecimal(a).comparedTo(this.toDecimal(b));
  }

  /**
   * Get maximum value
   * @param {...number|Decimal} values 
   * @returns {Decimal}
   */
  static max(...values) {
    return values.reduce((max, val) => {
      const d = this.toDecimal(val);
      return d.greaterThan(max) ? d : max;
    }, new Decimal(-Infinity));
  }

  /**
   * Get minimum value
   * @param {...number|Decimal} values 
   * @returns {Decimal}
   */
  static min(...values) {
    return values.reduce((min, val) => {
      const d = this.toDecimal(val);
      return d.lessThan(min) ? d : min;
    }, new Decimal(Infinity));
  }
}

// Export shorthand functions for convenience
export const D = DecimalUtils.toDecimal;
export const toNumber = DecimalUtils.toNumber.bind(DecimalUtils);
export const add = DecimalUtils.add.bind(DecimalUtils);
export const subtract = DecimalUtils.subtract.bind(DecimalUtils);
export const multiply = DecimalUtils.multiply.bind(DecimalUtils);
export const divide = DecimalUtils.divide.bind(DecimalUtils);
export const percentage = DecimalUtils.percentage.bind(DecimalUtils);
export const round = DecimalUtils.round.bind(DecimalUtils);