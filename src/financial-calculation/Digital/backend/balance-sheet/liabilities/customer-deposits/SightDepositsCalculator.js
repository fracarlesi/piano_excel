/**
 * Sight Deposits Calculator for Digital Banking Division
 * Calculates deposits that are available on demand (no time restrictions)
 */

export class SightDepositsCalculator {
  constructor() {
    this.quarters = 40;
  }

  /**
   * Calculate sight deposits for all digital products
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @param {Object} customerDeposits - Results from CustomerDepositsCalculator
   * @returns {Object} Sight deposits data by product and total
   */
  calculateSightDeposits(assumptions, globalAssumptions = {}, customerDeposits = {}) {
    const results = {
      byProduct: {},
      total: {
        quarterly: new Array(this.quarters).fill(0),
        yearly: new Array(10).fill(0)
      }
    };

    // Get digital products
    const digitalProducts = Object.entries(globalAssumptions.products || {})
      .filter(([key, product]) => {
        const lowerKey = key.toLowerCase();
        return lowerKey.startsWith('digital') || 
               product.division === 'digital' ||
               product.division === 'DigitalBanking';
      });

    // Calculate sight deposits for each product
    digitalProducts.forEach(([productKey, product]) => {
      const productSightDeposits = this.calculateProductSightDeposits(
        productKey, 
        product, 
        customerDeposits.byProduct?.[productKey] || { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) }
      );
      
      results.byProduct[productKey] = productSightDeposits;
      
      // Add to totals
      productSightDeposits.quarterly.forEach((value, q) => {
        results.total.quarterly[q] += value;
      });
      
      productSightDeposits.yearly.forEach((value, y) => {
        results.total.yearly[y] += value;
      });
    });

    return results;
  }

  /**
   * Calculate sight deposits for a single product
   */
  calculateProductSightDeposits(productKey, product, productDeposits) {
    const quarterly = new Array(this.quarters).fill(0);
    const yearly = new Array(10).fill(0);

    if (productKey === 'digitalBankAccount' || productKey === 'premiumDigitalBankAccount') {
      // 100% of deposits are sight deposits for bank accounts
      quarterly.forEach((_, q) => {
        quarterly[q] = productDeposits.quarterly[q];
      });
      
      yearly.forEach((_, y) => {
        yearly[y] = productDeposits.yearly[y];
      });
    } else if (productKey === 'depositAccount') {
      // For deposit accounts, only non-term deposits are sight deposits
      // Calculate based on deposit mix
      const sightPercentage = this.calculateSightPercentage(product);
      
      quarterly.forEach((_, q) => {
        quarterly[q] = productDeposits.quarterly[q] * sightPercentage;
      });
      
      yearly.forEach((_, y) => {
        yearly[y] = productDeposits.yearly[y] * sightPercentage;
      });
    }

    return { quarterly, yearly };
  }

  /**
   * Calculate percentage of deposits that are sight deposits based on deposit mix
   */
  calculateSightPercentage(product) {
    const depositMix = product.savingsModule?.depositMix || [];
    
    // If no deposit mix is defined, assume 100% sight deposits
    if (depositMix.length === 0) {
      return 1.0;
    }
    
    // Calculate percentage that is NOT term deposits
    const termPercentage = depositMix.reduce((sum, item) => {
      // Assume any deposit with a term (vincolo) is NOT a sight deposit
      if (item.name && item.name.includes('Vincolato')) {
        return sum + (item.percentage || 0) / 100;
      }
      return sum;
    }, 0);
    
    // Sight percentage is what's left
    return Math.max(0, 1 - termPercentage);
  }
}

export default SightDepositsCalculator;