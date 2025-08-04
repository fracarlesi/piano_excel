/**
 * Digital P&L Orchestrator
 * Coordinates all P&L calculations for Digital Banking Division
 */

import { DigitalDepositInterestCalculator } from './interest-expense/DigitalDepositInterestCalculator';
import { DigitalAccountFeesCalculator } from './commission-income/DigitalAccountFeesCalculator';
import { DigitalPremiumServicesCalculator } from './commission-income/DigitalPremiumServicesCalculator';
import { calculateWealthReferralIncome } from './commission-income/WealthReferralIncome';
import { PersonnelCalculator } from './personnel-calculators/personnelCalculator';
import { CACCalculator } from './operating-costs/CACCalculator';

export class DigitalPnLOrchestrator {
  constructor() {
    this.depositInterestCalculator = new DigitalDepositInterestCalculator();
    this.accountFeesCalculator = new DigitalAccountFeesCalculator();
    this.premiumServicesCalculator = new DigitalPremiumServicesCalculator();
    this.cacCalculator = new CACCalculator();
    this.quarters = 40;
  }

  /**
   * Calculate all P&L items for Digital Banking Division
   * @param {Object} assumptions - Division assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @param {Object} balanceSheetData - Balance sheet data from orchestrator
   * @returns {Object} Complete P&L data
   */
  calculatePnL(assumptions, globalAssumptions, balanceSheetData) {
    
    const { customerDeposits, termDeposits } = balanceSheetData.liabilities || {};
    const customerGrowth = balanceSheetData.customerGrowth || {};
    
    
    // Calculate interest expense
    const interestExpense = this.depositInterestCalculator.calculateInterestExpense(
      assumptions,
      globalAssumptions,
      customerDeposits,
      termDeposits
    );
    
    // Calculate commission income - account fees
    const accountFees = this.accountFeesCalculator.calculateAccountFees(
      assumptions,
      globalAssumptions,
      customerGrowth
    );
    
    // Calculate commission income - premium services
    const premiumServices = this.premiumServicesCalculator.calculatePremiumServices(
      assumptions,
      globalAssumptions,
      customerGrowth
    );
    
    // Calculate commission income - wealth referral fees
    const wealthReferralIncome = calculateWealthReferralIncome(
      globalAssumptions,
      customerGrowth,
      this.quarters
    );
    
    // Calculate personnel costs
    const personnelCosts = this.calculatePersonnelCosts(assumptions, globalAssumptions);
    
    // Calculate customer acquisition costs
    
    const customerAcquisitionCosts = this.cacCalculator.calculateCAC(
      assumptions,
      globalAssumptions,
      customerGrowth
    );
    
    // Aggregate operating costs
    const operatingCosts = this.aggregateOperatingCosts(customerAcquisitionCosts);
    
    // Aggregate commission income
    const commissionIncome = this.aggregateCommissionIncome(accountFees, premiumServices, wealthReferralIncome);
    
    // Calculate aggregated P&L items
    const aggregatedPnL = this.aggregatePnL(interestExpense, commissionIncome, personnelCosts, operatingCosts);
    
    return {
      interestIncome: { // Digital has no interest income
        byProduct: {},
        total: { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) }
      },
      interestExpense: interestExpense,
      netInterestIncome: {
        byProduct: this.calculateNetInterestIncomeByProduct(interestExpense),
        total: {
          quarterly: interestExpense.total.quarterly.map(v => -v),
          yearly: interestExpense.total.yearly.map(v => -v)
        }
      },
      commissionIncome: commissionIncome,
      commissionExpense: { // Digital has no commission expense
        byProduct: {},
        total: { quarterly: new Array(this.quarters).fill(0), yearly: new Array(10).fill(0) }
      },
      netCommissionIncome: commissionIncome,
      personnelCosts: personnelCosts,
      operatingCosts: operatingCosts,
      totalRevenues: aggregatedPnL.totalRevenues,
      ebitda: aggregatedPnL.ebitda,
      productDetails: {
        accountFees: accountFees,
        premiumServices: premiumServices,
        wealthReferralIncome: wealthReferralIncome,
        customerAcquisitionCosts: customerAcquisitionCosts
      }
    };
  }

  /**
   * Calculate personnel costs using existing calculator
   */
  calculatePersonnelCosts(assumptions, globalAssumptions) {
    const divisionData = globalAssumptions.digitalBankingDivision || {};
    const personnelAssumptions = {
      positions: divisionData.positions || [],
      staffing: divisionData.staffing || [],
      headcountGrowth: divisionData.headcountGrowth || 0,
      companyTaxMultiplier: globalAssumptions.personnel?.companyTaxMultiplier || 1.4,
      annualSalaryReview: globalAssumptions.personnel?.annualSalaryReview || 2
    };
    
    const quarters = [];
    for (let y = 0; y < 10; y++) {
      for (let q = 1; q <= 4; q++) {
        quarters.push(`Q${q}_Y${y + 1}`);
      }
    }
    
    const calculator = new PersonnelCalculator(divisionData, personnelAssumptions, quarters);
    const costs = calculator.getPersonnelCostsByQuarter();
    
    // Convert to array format
    const quarterly = new Array(this.quarters).fill(0);
    const yearly = new Array(10).fill(0);
    
    quarters.forEach((quarter, index) => {
      quarterly[index] = costs[quarter]?.total || 0;
      const yearIndex = Math.floor(index / 4);
      yearly[yearIndex] += costs[quarter]?.total || 0;
    });
    
    return {
      quarterly: quarterly,
      yearly: yearly
    };
  }

  /**
   * Aggregate commission income from different sources
   */
  aggregateCommissionIncome(accountFees, premiumServices, wealthReferralIncome) {
    const byProduct = {};
    const total = {
      quarterly: new Array(this.quarters).fill(0),
      yearly: new Array(10).fill(0)
    };
    
    // Aggregate by product
    Object.entries(accountFees.byProduct).forEach(([productKey, fees]) => {
      if (!byProduct[productKey]) {
        byProduct[productKey] = {
          quarterly: new Array(this.quarters).fill(0),
          yearly: new Array(10).fill(0)
        };
      }
      
      fees.quarterly.forEach((value, q) => {
        byProduct[productKey].quarterly[q] += value;
        total.quarterly[q] += value;
      });
      
      fees.yearly.forEach((value, y) => {
        byProduct[productKey].yearly[y] += value;
        total.yearly[y] += value;
      });
    });
    
    Object.entries(premiumServices.byProduct).forEach(([productKey, services]) => {
      if (!byProduct[productKey]) {
        byProduct[productKey] = {
          quarterly: new Array(this.quarters).fill(0),
          yearly: new Array(10).fill(0)
        };
      }
      
      services.quarterly.forEach((value, q) => {
        byProduct[productKey].quarterly[q] += value;
        total.quarterly[q] += value;
      });
      
      services.yearly.forEach((value, y) => {
        byProduct[productKey].yearly[y] += value;
        total.yearly[y] += value;
      });
    });
    
    // Add wealth referral income (not by product, but total)
    if (wealthReferralIncome) {
      byProduct['wealthReferralFees'] = {
        quarterly: wealthReferralIncome.quarterly,
        yearly: wealthReferralIncome.yearly
      };
      
      wealthReferralIncome.quarterly.forEach((value, q) => {
        total.quarterly[q] += value;
      });
      
      wealthReferralIncome.yearly.forEach((value, y) => {
        total.yearly[y] += value;
      });
    }
    
    return { byProduct, total };
  }

  /**
   * Calculate net interest income by product
   */
  calculateNetInterestIncomeByProduct(interestExpense) {
    const byProduct = {};
    
    Object.entries(interestExpense.byProduct).forEach(([productKey, expense]) => {
      byProduct[productKey] = {
        quarterly: expense.quarterly.map(v => -v),
        yearly: expense.yearly.map(v => -v)
      };
    });
    
    return byProduct;
  }

  /**
   * Aggregate operating costs
   */
  aggregateOperatingCosts(customerAcquisitionCosts) {
    return {
      total: {
        quarterly: [...customerAcquisitionCosts.total.quarterly],
        yearly: [...customerAcquisitionCosts.total.yearly]
      },
      breakdown: {
        customerAcquisitionCost: customerAcquisitionCosts
      }
    };
  }

  /**
   * Aggregate P&L items
   */
  aggregatePnL(interestExpense, commissionIncome, personnelCosts, operatingCosts) {
    const totalRevenues = {
      quarterly: new Array(this.quarters).fill(0),
      yearly: new Array(10).fill(0)
    };
    
    const ebitda = {
      quarterly: new Array(this.quarters).fill(0),
      yearly: new Array(10).fill(0)
    };
    
    for (let q = 0; q < this.quarters; q++) {
      // Total revenues = Commission Income - Interest Expense
      totalRevenues.quarterly[q] = commissionIncome.total.quarterly[q] - interestExpense.total.quarterly[q];
      
      // EBITDA = Total Revenues - Personnel Costs - Operating Costs
      ebitda.quarterly[q] = totalRevenues.quarterly[q] - personnelCosts.quarterly[q] - operatingCosts.total.quarterly[q];
    }
    
    for (let y = 0; y < 10; y++) {
      // Total revenues = Commission Income - Interest Expense
      totalRevenues.yearly[y] = commissionIncome.total.yearly[y] - interestExpense.total.yearly[y];
      
      // EBITDA = Total Revenues - Personnel Costs - Operating Costs
      ebitda.yearly[y] = totalRevenues.yearly[y] - personnelCosts.yearly[y] - operatingCosts.total.yearly[y];
    }
    
    return { totalRevenues, ebitda };
  }
}

export default DigitalPnLOrchestrator;