/**
 * Customer Deposits Calculator for Digital Banking Division
 * Calculates total customer deposits for all digital products
 */

export class CustomerDepositsCalculator {
  constructor() {
    this.quarters = 40;
  }

  /**
   * Calculate customer deposits for all digital products
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @returns {Object} Customer deposits data by product and total
   */
  calculateCustomerDeposits(assumptions, globalAssumptions = {}) {
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

    // Calculate deposits for each product
    digitalProducts.forEach(([productKey, product]) => {
      const productDeposits = this.calculateProductDeposits(productKey, product, globalAssumptions);
      results.byProduct[productKey] = productDeposits;
      
      // Add to totals
      productDeposits.quarterly.forEach((value, q) => {
        results.total.quarterly[q] += value;
      });
      
      productDeposits.yearly.forEach((value, y) => {
        results.total.yearly[y] += value;
      });
    });

    return results;
  }

  /**
   * Calculate deposits for a single product
   */
  calculateProductDeposits(productKey, product, globalAssumptions) {
    const quarterly = new Array(this.quarters).fill(0);
    const yearly = new Array(10).fill(0);

    if (productKey === 'digitalBankAccount' || productKey === 'premiumDigitalBankAccount') {
      // For digital bank accounts, calculate based on active customers and average deposit
      const activeCustomers = this.calculateActiveCustomers(product);
      const avgDeposit = product.baseAccount?.avgDeposit || 0;
      
      for (let q = 0; q < this.quarters; q++) {
        quarterly[q] = activeCustomers.quarterly[q] * avgDeposit / 1000000; // Convert to millions
      }
      
      for (let y = 0; y < 10; y++) {
        yearly[y] = activeCustomers.yearly[y] * avgDeposit / 1000000;
      }
    } else if (productKey === 'depositAccount') {
      // For deposit accounts, calculate based on active customers and average deposit
      const activeCustomers = this.calculateActiveCustomers(product);
      const avgDeposit = product.savingsModule?.avgAdditionalDeposit || 0;
      
      for (let q = 0; q < this.quarters; q++) {
        quarterly[q] = activeCustomers.quarterly[q] * avgDeposit / 1000000;
      }
      
      for (let y = 0; y < 10; y++) {
        yearly[y] = activeCustomers.yearly[y] * avgDeposit / 1000000;
      }
    }

    return { quarterly, yearly };
  }

  /**
   * Calculate active customers considering churn
   */
  calculateActiveCustomers(product) {
    const quarterly = new Array(this.quarters).fill(0);
    const yearly = new Array(10).fill(0);
    
    const newCustomersArray = product.acquisition?.newCustomersArray || new Array(10).fill(0);
    const churnRate = (product.acquisition?.churnRate || 0) / 100;
    
    let cumulativeCustomers = 0;
    
    for (let y = 0; y < 10; y++) {
      // Add new customers
      cumulativeCustomers += newCustomersArray[y];
      
      // Apply churn to existing customers
      cumulativeCustomers = cumulativeCustomers * (1 - churnRate);
      
      yearly[y] = cumulativeCustomers;
      
      // Distribute evenly across quarters
      for (let q = 0; q < 4; q++) {
        const quarterIndex = y * 4 + q;
        if (quarterIndex < this.quarters) {
          quarterly[quarterIndex] = cumulativeCustomers;
        }
      }
    }
    
    return { quarterly, yearly };
  }

}

export default CustomerDepositsCalculator;