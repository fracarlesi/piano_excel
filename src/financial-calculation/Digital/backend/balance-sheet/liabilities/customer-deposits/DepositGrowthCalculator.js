/**
 * Deposit Growth Calculator for Digital Banking Division
 * Handles customer acquisition, churn, and deposit growth over time
 */

export class DepositGrowthCalculator {
  constructor() {
    this.quarters = 40;
  }

  /**
   * Calculate customer growth for all digital products
   * @param {Object} globalAssumptions - Global assumptions
   * @returns {Object} Customer growth data by product
   */
  calculateCustomerGrowth(globalAssumptions = {}) {
    const results = {
      byProduct: {},
      digitalBankTotalCustomers: {
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

    // Calculate growth for each product
    digitalProducts.forEach(([productKey, product]) => {
      if (productKey === 'digitalBankAccount') {
        // Only digitalBankAccount has customer acquisition data
        const customerGrowth = this.calculateProductCustomerGrowth(product);
        results.byProduct[productKey] = customerGrowth;
        
        // Store digital bank customers for use by other products
        results.digitalBankTotalCustomers = {
          quarterly: [...customerGrowth.activeCustomers.quarterly],
          yearly: [...customerGrowth.activeCustomers.yearly]
        };
      } else if (productKey === 'premiumDigitalBankAccount') {
        // Check if product has its own acquisition data
        if (product.acquisition?.newCustomersArray) {
          // Use direct acquisition data
          const customerGrowth = this.calculateProductCustomerGrowth(product);
          results.byProduct[productKey] = customerGrowth;
        } else {
          // Fallback to percentage of digital bank customers
          const premiumGrowth = this.calculatePremiumCustomerGrowth(
            product, 
            results.digitalBankTotalCustomers
          );
          results.byProduct[productKey] = premiumGrowth;
        }
      } else if (productKey === 'depositAccount') {
        // Deposit accounts have their own customer acquisition
        if (product.acquisition?.newCustomersArray) {
          const customerGrowth = this.calculateProductCustomerGrowth(product);
          results.byProduct[productKey] = customerGrowth;
        } else {
          // Fallback to percentage of digital bank customers
          const depositGrowth = this.calculateDepositAccountGrowth(
            product,
            results.digitalBankTotalCustomers
          );
          results.byProduct[productKey] = depositGrowth;
        }
      }
    });

    return results;
  }

  /**
   * Calculate customer growth for products with acquisition data
   */
  calculateProductCustomerGrowth(product) {
    const result = {
      newCustomers: {
        quarterly: new Array(this.quarters).fill(0),
        yearly: new Array(10).fill(0)
      },
      churnedCustomers: {
        quarterly: new Array(this.quarters).fill(0),
        yearly: new Array(10).fill(0)
      },
      activeCustomers: {
        quarterly: new Array(this.quarters).fill(0),
        yearly: new Array(10).fill(0)
      }
    };

    const newCustomersArray = product.acquisition?.newCustomersArray || new Array(10).fill(0);
    const churnRate = (product.acquisition?.churnRate || 0) / 100;
    
    
    let cumulativeCustomers = 0;
    let previousYearCustomers = 0;
    
    for (let y = 0; y < 10; y++) {
      // Store new customers for the year
      result.newCustomers.yearly[y] = newCustomersArray[y];
      
      // Calculate churned customers from previous year's base
      const churnedThisYear = previousYearCustomers * churnRate;
      result.churnedCustomers.yearly[y] = churnedThisYear;
      
      // Update cumulative customers
      cumulativeCustomers = previousYearCustomers + newCustomersArray[y] - churnedThisYear;
      result.activeCustomers.yearly[y] = cumulativeCustomers;
      
      // Distribute across quarters
      for (let q = 0; q < 4; q++) {
        const quarterIndex = y * 4 + q;
        if (quarterIndex < this.quarters) {
          // Assume linear distribution of new customers across quarters
          result.newCustomers.quarterly[quarterIndex] = newCustomersArray[y] / 4;
          result.churnedCustomers.quarterly[quarterIndex] = churnedThisYear / 4;
          
          
          // Active customers grow linearly through the year
          const startCustomers = previousYearCustomers;
          const endCustomers = cumulativeCustomers;
          const quarterProgress = (q + 1) / 4;
          result.activeCustomers.quarterly[quarterIndex] = 
            startCustomers + (endCustomers - startCustomers) * quarterProgress;
        }
      }
      
      previousYearCustomers = cumulativeCustomers;
    }
    
    return result;
  }

  /**
   * Calculate premium customer growth (fallback method)
   * In practice, premium accounts have their own acquisition data
   */
  calculatePremiumCustomerGrowth(product, digitalBankTotalCustomers) {
    // This is a fallback - should use direct acquisition data
    return this.calculateProductCustomerGrowth(product);
  }

  /**
   * Calculate deposit account growth (fallback method)
   * In practice, deposit accounts have their own acquisition data
   */
  calculateDepositAccountGrowth(product, digitalBankTotalCustomers) {
    // This is a fallback - should use direct acquisition data
    return this.calculateProductCustomerGrowth(product);
  }

}

export default DepositGrowthCalculator;