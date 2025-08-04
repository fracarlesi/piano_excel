/**
 * Digital Account Fees Calculator
 * Calculates commission income from account fees for Digital Banking Division
 */

export class DigitalAccountFeesCalculator {
  constructor() {
    this.quarters = 40;
  }

  /**
   * Calculate account fees for all digital products
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @param {Object} customerGrowth - Customer growth data from DepositGrowthCalculator
   * @returns {Object} Account fees data by product and total
   */
  calculateAccountFees(assumptions, globalAssumptions = {}, customerGrowth = {}) {
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

    // Calculate fees for each product
    digitalProducts.forEach(([productKey, product]) => {
      const productFees = this.calculateProductFees(
        productKey,
        product,
        customerGrowth.byProduct?.[productKey] || { activeCustomers: { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) } }
      );
      
      results.byProduct[productKey] = productFees;
      
      // Add to totals
      productFees.quarterly.forEach((value, q) => {
        results.total.quarterly[q] += value;
      });
      
      productFees.yearly.forEach((value, y) => {
        results.total.yearly[y] += value;
      });
    });

    return results;
  }

  /**
   * Calculate fees for a single product
   */
  calculateProductFees(productKey, product, productGrowth) {
    const quarterly = new Array(this.quarters).fill(0);
    const yearly = new Array(10).fill(0);

    // Only digital bank accounts have monthly fees
    if (productKey === 'digitalBankAccount' || productKey === 'premiumDigitalBankAccount') {
      const monthlyFee = product.baseAccount?.monthlyFee || 0;
      
      if (monthlyFee > 0) {
        const activeCustomers = productGrowth.activeCustomers || { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) };
        
        for (let q = 0; q < this.quarters; q++) {
          // Quarterly fees = active customers * monthly fee * 3 months / 1M (convert to millions)
          quarterly[q] = activeCustomers.quarterly[q] * monthlyFee * 3 / 1000000;
        }
        
        for (let y = 0; y < 10; y++) {
          // Yearly fees = active customers * monthly fee * 12 months / 1M
          yearly[y] = activeCustomers.yearly[y] * monthlyFee * 12 / 1000000;
        }
      }
    }
    // Deposit accounts typically don't have monthly fees

    return { quarterly, yearly };
  }
}

export default DigitalAccountFeesCalculator;