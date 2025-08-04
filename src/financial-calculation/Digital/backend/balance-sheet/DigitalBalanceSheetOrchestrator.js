/**
 * Digital Balance Sheet Orchestrator
 * Coordinates all balance sheet calculations for Digital Banking Division
 */

import { 
  CustomerDepositsCalculator,
  SightDepositsCalculator,
  TermDepositsCalculator,
  DepositGrowthCalculator 
} from './liabilities/customer-deposits';

export class DigitalBalanceSheetOrchestrator {
  constructor() {
    this.depositGrowthCalculator = new DepositGrowthCalculator();
    this.customerDepositsCalculator = new CustomerDepositsCalculator();
    this.sightDepositsCalculator = new SightDepositsCalculator();
    this.termDepositsCalculator = new TermDepositsCalculator();
  }

  /**
   * Calculate all balance sheet items for Digital Banking Division
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @returns {Object} Complete balance sheet data
   */
  calculateBalanceSheet(assumptions, globalAssumptions) {
    // Step 1: Calculate customer growth
    const customerGrowth = this.depositGrowthCalculator.calculateCustomerGrowth(globalAssumptions);
    
    // Step 2: Calculate total customer deposits
    const customerDeposits = this.customerDepositsCalculator.calculateCustomerDeposits(
      assumptions,
      globalAssumptions
    );
    
    // Update customer deposits with proper growth data
    const updatedCustomerDeposits = this.updateDepositsWithGrowth(customerDeposits, customerGrowth, globalAssumptions);
    
    // Step 3: Calculate sight deposits
    const sightDeposits = this.sightDepositsCalculator.calculateSightDeposits(
      assumptions,
      globalAssumptions,
      updatedCustomerDeposits
    );
    
    // Step 4: Calculate term deposits
    const termDeposits = this.termDepositsCalculator.calculateTermDeposits(
      assumptions,
      globalAssumptions,
      updatedCustomerDeposits
    );
    

    // Return structured balance sheet data
    return {
      assets: {
        // Digital division has no lending assets
        newVolumes: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        repayments: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        stockNBV: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        netPerformingAssets: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      liabilities: {
        customerDeposits: updatedCustomerDeposits,
        sightDeposits: sightDeposits,
        termDeposits: termDeposits,
        equity: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        groupFunding: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      customerGrowth: customerGrowth
    };
  }

  /**
   * Update customer deposits with proper growth calculations
   */
  updateDepositsWithGrowth(customerDeposits, customerGrowth, globalAssumptions) {
    const updated = {
      byProduct: {},
      total: {
        quarterly: new Array(40).fill(0),
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

    digitalProducts.forEach(([productKey, product]) => {
      const quarterly = new Array(40).fill(0);
      const yearly = new Array(10).fill(0);

      if (productKey === 'digitalBankAccount') {
        const avgDeposit = product.baseAccount?.avgDeposit || 0;
        const growth = customerGrowth.byProduct[productKey];
        
        if (growth) {
          for (let q = 0; q < 40; q++) {
            quarterly[q] = growth.activeCustomers.quarterly[q] * avgDeposit / 1000000;
          }
          for (let y = 0; y < 10; y++) {
            yearly[y] = growth.activeCustomers.yearly[y] * avgDeposit / 1000000;
          }
        }
      } else if (productKey === 'premiumDigitalBankAccount') {
        const avgDeposit = product.baseAccount?.avgDeposit || 5000; // Premium default
        const growth = customerGrowth.byProduct[productKey];
        
        if (growth) {
          for (let q = 0; q < 40; q++) {
            quarterly[q] = growth.activeCustomers.quarterly[q] * avgDeposit / 1000000;
          }
          for (let y = 0; y < 10; y++) {
            yearly[y] = growth.activeCustomers.yearly[y] * avgDeposit / 1000000;
          }
        }
      } else if (productKey === 'depositAccount') {
        const avgDeposit = product.savingsModule?.avgAdditionalDeposit || 0;
        const growth = customerGrowth.byProduct[productKey];
        
        if (growth) {
          for (let q = 0; q < 40; q++) {
            quarterly[q] = growth.activeCustomers.quarterly[q] * avgDeposit / 1000000;
          }
          for (let y = 0; y < 10; y++) {
            yearly[y] = growth.activeCustomers.yearly[y] * avgDeposit / 1000000;
          }
        }
      }

      updated.byProduct[productKey] = { quarterly, yearly };
      
      // Add to totals
      quarterly.forEach((value, q) => {
        updated.total.quarterly[q] += value;
      });
      yearly.forEach((value, y) => {
        updated.total.yearly[y] += value;
      });
    });

    return updated;
  }
}

export default DigitalBalanceSheetOrchestrator;