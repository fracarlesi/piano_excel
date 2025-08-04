/**
 * Customer Acquisition Cost (CAC) Calculator for Digital Banking Division
 * Calculates the cost of acquiring new customers
 */

export class CACCalculator {
  constructor() {
    this.quarters = 40;
  }

  /**
   * Calculate customer acquisition costs for all digital products
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @param {Object} customerGrowth - Customer growth data from DepositGrowthCalculator
   * @returns {Object} CAC data by product and total
   */
  calculateCAC(assumptions, globalAssumptions = {}, customerGrowth = {}) {
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

    // Calculate CAC for each product
    digitalProducts.forEach(([productKey, product]) => {
      const productCAC = this.calculateProductCAC(
        productKey,
        product,
        customerGrowth.byProduct?.[productKey] || { newCustomers: { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) } }
      );
      
      results.byProduct[productKey] = productCAC;
      
      // Add to totals
      productCAC.quarterly.forEach((value, q) => {
        results.total.quarterly[q] += value;
      });
      
      productCAC.yearly.forEach((value, y) => {
        results.total.yearly[y] += value;
      });
    });

    
    return results;
  }

  /**
   * Calculate CAC for a single product
   */
  calculateProductCAC(productKey, product, productGrowth) {
    const quarterly = new Array(this.quarters).fill(0);
    const yearly = new Array(10).fill(0);

    // Calculate CAC for any product that has acquisition costs defined
    const cacPerCustomer = product.acquisition?.cac || 0;
    
    if (cacPerCustomer > 0) {
      const newCustomers = productGrowth.newCustomers || { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) };
      
      
      for (let q = 0; q < this.quarters; q++) {
        // CAC = new customers * cost per customer / 1M (convert to millions)
        quarterly[q] = newCustomers.quarterly[q] * cacPerCustomer / 1000000;
      }
      
      for (let y = 0; y < 10; y++) {
        // CAC = new customers * cost per customer / 1M
        yearly[y] = newCustomers.yearly[y] * cacPerCustomer / 1000000;
      }
    }

    return { quarterly, yearly };
  }
}

export default CACCalculator;