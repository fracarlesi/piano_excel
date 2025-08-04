/**
 * Digital Premium Services Calculator
 * Calculates commission income from premium services for Digital Banking Division
 */

export class DigitalPremiumServicesCalculator {
  constructor() {
    this.quarters = 40;
  }

  /**
   * Calculate premium services revenue for all digital products
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @param {Object} customerGrowth - Customer growth data from DepositGrowthCalculator
   * @returns {Object} Premium services revenue data by product and total
   */
  calculatePremiumServices(assumptions, globalAssumptions = {}, customerGrowth = {}) {
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

    // Calculate premium services for each product
    digitalProducts.forEach(([productKey, product]) => {
      const productPremiumRevenue = this.calculateProductPremiumRevenue(
        productKey,
        product,
        customerGrowth
      );
      
      results.byProduct[productKey] = productPremiumRevenue;
      
      // Add to totals
      productPremiumRevenue.quarterly.forEach((value, q) => {
        results.total.quarterly[q] += value;
      });
      
      productPremiumRevenue.yearly.forEach((value, y) => {
        results.total.yearly[y] += value;
      });
    });

    return results;
  }

  /**
   * Calculate premium revenue for a single product
   */
  calculateProductPremiumRevenue(productKey, product, customerGrowth) {
    const quarterly = new Array(this.quarters).fill(0);
    const yearly = new Array(10).fill(0);

    // Only premium digital bank accounts have premium services revenue
    if (productKey === 'premiumDigitalBankAccount') {
      // Premium services revenue is now included in the monthly fee
      const avgMonthlyRevenue = 0;
      
      // Get premium account customers directly
      const productGrowth = customerGrowth.byProduct?.[productKey];
      const activeCustomers = productGrowth?.activeCustomers || 
                             { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) };
      
      for (let q = 0; q < this.quarters; q++) {
        // Quarterly revenue = active customers * monthly revenue * 3 months / 1M
        quarterly[q] = activeCustomers.quarterly[q] * avgMonthlyRevenue * 3 / 1000000;
      }
      
      for (let y = 0; y < 10; y++) {
        // Yearly revenue = active customers * monthly revenue * 12 months / 1M
        yearly[y] = activeCustomers.yearly[y] * avgMonthlyRevenue * 12 / 1000000;
      }
    }
    // Other products don't have premium services

    return { quarterly, yearly };
  }
}

export default DigitalPremiumServicesCalculator;