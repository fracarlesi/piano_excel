import { AmortizingStrategy } from './AmortizingStrategy.js';
import { BulletStrategy } from './BulletStrategy.js';
import { PRODUCT_TYPES } from '../constants.js';

/**
 * Strategy Factory
 * Creates appropriate amortization strategy based on product type
 */
export class StrategyFactory {
  static strategies = {
    [PRODUCT_TYPES.AMORTIZING]: AmortizingStrategy,
    [PRODUCT_TYPES.BULLET]: BulletStrategy,
  };

  /**
   * Get strategy instance for product type
   * @param {string} productType 
   * @returns {BaseAmortizationStrategy}
   */
  static getStrategy(productType) {
    const StrategyClass = this.strategies[productType];
    
    if (!StrategyClass) {
      throw new Error(`No strategy found for product type: ${productType}`);
    }
    
    return new StrategyClass();
  }

  /**
   * Register a new strategy
   * @param {string} productType 
   * @param {Class} strategyClass 
   */
  static registerStrategy(productType, strategyClass) {
    this.strategies[productType] = strategyClass;
  }

  /**
   * Check if strategy exists for product type
   * @param {string} productType 
   * @returns {boolean}
   */
  static hasStrategy(productType) {
    return !!this.strategies[productType];
  }
}