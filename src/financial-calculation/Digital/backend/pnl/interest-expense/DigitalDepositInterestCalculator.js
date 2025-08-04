/**
 * Digital Deposit Interest Calculator
 * Calculates interest expense on customer deposits for Digital Banking Division
 */

export class DigitalDepositInterestCalculator {
  constructor() {
    this.quarters = 40;
  }

  /**
   * Calculate interest expense for all digital deposits
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @param {Object} customerDeposits - Customer deposits data
   * @param {Object} termDeposits - Term deposits data with interest rates
   * @returns {Object} Interest expense data by product and total
   */
  calculateInterestExpense(assumptions, globalAssumptions = {}, customerDeposits = {}, termDeposits = {}) {
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

    // Calculate interest expense for each product
    digitalProducts.forEach(([productKey, product]) => {
      const productInterestExpense = this.calculateProductInterestExpense(
        productKey,
        product,
        customerDeposits.byProduct?.[productKey] || { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) },
        termDeposits.byProduct?.[productKey] || { byDuration: {}, total: { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) } }
      );
      
      results.byProduct[productKey] = productInterestExpense;
      
      // Add to totals
      productInterestExpense.quarterly.forEach((value, q) => {
        results.total.quarterly[q] += value;
      });
      
      productInterestExpense.yearly.forEach((value, y) => {
        results.total.yearly[y] += value;
      });
    });

    return results;
  }

  /**
   * Calculate interest expense for a single product
   */
  calculateProductInterestExpense(productKey, product, productDeposits, productTermDeposits) {
    const quarterly = new Array(this.quarters).fill(0);
    const yearly = new Array(10).fill(0);
    const byDuration = {};

    if (productKey === 'digitalBankAccount' || productKey === 'premiumDigitalBankAccount') {
      // Calculate interest on sight deposits
      const interestRate = (product.baseAccount?.interestRate || 0) / 100;
      
      for (let q = 0; q < this.quarters; q++) {
        // Quarterly interest = deposit amount * rate / 4
        quarterly[q] = productDeposits.quarterly[q] * interestRate / 4;
      }
      
      for (let y = 0; y < 10; y++) {
        // Yearly interest = deposit amount * rate
        yearly[y] = productDeposits.yearly[y] * interestRate;
      }
    } else if (productKey === 'depositAccount') {
      // Calculate interest based on deposit mix and term rates
      const sightRate = (product.baseAccount?.interestRate || 0) / 100;
      
      // Calculate sight deposit interest
      const sightPercentage = this.calculateSightPercentage(product);
      
      // Initialize sight deposits tracking
      byDuration['sight'] = {
        quarterly: new Array(this.quarters).fill(0),
        yearly: new Array(10).fill(0),
        interestRate: sightRate * 100
      };
      
      for (let q = 0; q < this.quarters; q++) {
        // Sight deposit interest
        const sightInterest = productDeposits.quarterly[q] * sightPercentage * sightRate / 4;
        byDuration['sight'].quarterly[q] = sightInterest;
        quarterly[q] += sightInterest;
        
        // Term deposit interest
        if (productTermDeposits.byDuration) {
          Object.entries(productTermDeposits.byDuration).forEach(([duration, data]) => {
            const termRate = (data.interestRate || 0) / 100;
            const termInterest = (data.quarterly?.[q] || 0) * termRate / 4;
            
            // Initialize duration tracking if not exists
            if (!byDuration[duration]) {
              byDuration[duration] = {
                quarterly: new Array(this.quarters).fill(0),
                yearly: new Array(10).fill(0),
                interestRate: data.interestRate || 0
              };
            }
            
            byDuration[duration].quarterly[q] = termInterest;
            quarterly[q] += termInterest;
          });
        }
      }
      
      for (let y = 0; y < 10; y++) {
        // Sight deposit interest
        const sightInterest = productDeposits.yearly[y] * sightPercentage * sightRate;
        byDuration['sight'].yearly[y] = sightInterest;
        yearly[y] += sightInterest;
        
        // Term deposit interest
        if (productTermDeposits.byDuration) {
          Object.entries(productTermDeposits.byDuration).forEach(([duration, data]) => {
            const termRate = (data.interestRate || 0) / 100;
            const termInterest = (data.yearly?.[y] || 0) * termRate;
            
            if (byDuration[duration]) {
              byDuration[duration].yearly[y] = termInterest;
            }
            
            yearly[y] += termInterest;
          });
        }
      }
    }

    return { quarterly, yearly, byDuration };
  }

  /**
   * Calculate percentage of deposits that are sight deposits
   */
  calculateSightPercentage(product) {
    const depositMix = product.savingsModule?.depositMix || [];
    
    if (depositMix.length === 0) {
      return 1.0;
    }
    
    const termPercentage = depositMix.reduce((sum, item) => {
      if (item.name && item.name.includes('Vincolato')) {
        return sum + (item.percentage || 0) / 100;
      }
      return sum;
    }, 0);
    
    return Math.max(0, 1 - termPercentage);
  }
}

export default DigitalDepositInterestCalculator;