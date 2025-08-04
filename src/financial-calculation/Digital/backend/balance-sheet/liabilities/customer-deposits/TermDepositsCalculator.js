/**
 * Term Deposits Calculator for Digital Banking Division
 * Calculates deposits with fixed terms (time deposits)
 */

export class TermDepositsCalculator {
  constructor() {
    this.quarters = 40;
  }

  /**
   * Calculate term deposits for all digital products
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @param {Object} customerDeposits - Results from CustomerDepositsCalculator
   * @returns {Object} Term deposits data by product, duration and total
   */
  calculateTermDeposits(assumptions, globalAssumptions = {}, customerDeposits = {}) {
    const results = {
      byProduct: {},
      byDuration: {
        '6_months': { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) },
        '12_months': { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) },
        '18_months': { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) },
        '24_months': { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) },
        '36_months': { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) },
        '48_months': { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) },
        '60_months': { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) }
      },
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

    // Calculate term deposits for each product
    digitalProducts.forEach(([productKey, product]) => {
      const productTermDeposits = this.calculateProductTermDeposits(
        productKey, 
        product, 
        customerDeposits.byProduct?.[productKey] || { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) }
      );
      
      results.byProduct[productKey] = productTermDeposits;
      
      // Add to totals and duration buckets
      productTermDeposits.total.quarterly.forEach((value, q) => {
        results.total.quarterly[q] += value;
      });
      
      productTermDeposits.total.yearly.forEach((value, y) => {
        results.total.yearly[y] += value;
      });
      
      // Add to duration buckets
      if (productTermDeposits.byDuration) {
        Object.entries(productTermDeposits.byDuration).forEach(([duration, data]) => {
          if (results.byDuration[duration]) {
            data.quarterly.forEach((value, q) => {
              results.byDuration[duration].quarterly[q] += value;
            });
            data.yearly.forEach((value, y) => {
              results.byDuration[duration].yearly[y] += value;
            });
          }
        });
      }
    });

    return results;
  }

  /**
   * Calculate term deposits for a single product
   */
  calculateProductTermDeposits(productKey, product, productDeposits) {
    const result = {
      byDuration: {},
      total: {
        quarterly: new Array(this.quarters).fill(0),
        yearly: new Array(10).fill(0)
      }
    };

    if (productKey === 'digitalBankAccount' || productKey === 'premiumDigitalBankAccount') {
      // No term deposits for basic bank accounts
      return result;
    } else if (productKey === 'depositAccount') {
      // Calculate term deposits based on deposit mix
      const depositMix = product.savingsModule?.depositMix || [];
      
      depositMix.forEach((mixItem) => {
        if (mixItem.name && mixItem.name.includes('Vincolato')) {
          const duration = this.extractDuration(mixItem.name);
          const percentage = (mixItem.percentage || 0) / 100;
          
          if (duration) {
            result.byDuration[duration] = {
              quarterly: new Array(this.quarters).fill(0),
              yearly: new Array(10).fill(0),
              interestRate: mixItem.interestRate || 0
            };
            
            // Calculate deposits for this duration
            for (let q = 0; q < this.quarters; q++) {
              const amount = productDeposits.quarterly[q] * percentage;
              result.byDuration[duration].quarterly[q] = amount;
              result.total.quarterly[q] += amount;
            }
            
            for (let y = 0; y < 10; y++) {
              const amount = productDeposits.yearly[y] * percentage;
              result.byDuration[duration].yearly[y] = amount;
              result.total.yearly[y] += amount;
            }
          }
        }
      });
    }

    return result;
  }

  /**
   * Extract duration from deposit mix name
   */
  extractDuration(name) {
    if (name.includes('6 mesi')) return '6_months';
    if (name.includes('12 mesi')) return '12_months';
    if (name.includes('18 mesi')) return '18_months';
    if (name.includes('24 mesi')) return '24_months';
    if (name.includes('36 mesi')) return '36_months';
    if (name.includes('48 mesi')) return '48_months';
    if (name.includes('60 mesi')) return '60_months';
    return null;
  }
}

export default TermDepositsCalculator;