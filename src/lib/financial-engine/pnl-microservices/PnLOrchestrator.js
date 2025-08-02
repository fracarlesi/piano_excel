/**
 * P&L Orchestrator
 * 
 * Main orchestrator that coordinates all P&L microservices
 * to produce the complete Profit & Loss statement
 */

import { calculateAllPersonnelCosts } from './personnel-calculators/personnelCalculator.js';
import { calculateDynamicInterestIncome } from './interest-income/DynamicProductInterestCalculator.js';
import { calculateCreditInterestExpense } from './interest-expense/CreditInterestExpenseCalculator.js';
import { calculateCommissionIncome } from './commission-calculators/commissionCalculator.js';
import { calculateLoanLossProvisions } from './llp-calculators/defaultCalculator.js';
import { 
  ALL_DIVISION_PREFIXES,
  getPersonnelKey
} from '../divisionMappings.js';

/**
 * Main P&L calculation - static method for clean interface
 */
export const PnLOrchestrator = {
  /**
   * Calculate complete P&L
   * @param {Object} assumptions - Complete assumptions
   * @param {Object} balanceSheetResults - Balance sheet results for interest calculations
   * @returns {Object} P&L results
   */
  calculate(assumptions, balanceSheetResults) {
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const quarters = 40;
    
    // Step 1: Personnel costs (calculated first as it's independent)
    const personnelCosts = calculateAllPersonnelCosts(assumptions, years);
    
    // Step 2: Interest Income (based on performing assets)
    const interestIncome = this.calculateInterestIncome(
      balanceSheetResults,
      assumptions,
      years
    );
    
    // Step 3: Interest Expense (based on deposits and funding)
    const interestExpense = this.calculateInterestExpense(
      balanceSheetResults,
      assumptions,
      years
    );
    
    // Step 4: Net Interest Income
    const netInterestIncome = this.calculateNetInterestIncome(
      interestIncome,
      interestExpense
    );
    
    // Step 5: Commission Income & Expense
    const commissionIncome = this.calculateCommissions(
      balanceSheetResults,
      assumptions,
      years
    );
    
    const commissionExpense = commissionIncome.consolidated.map(income => 
      -income * (assumptions.commissionExpenseRate || 0) / 100
    );
    
    const netCommissions = commissionIncome.consolidated.map((income, i) => 
      income + commissionExpense[i]
    );
    
    // Step 6: Total Revenues
    const totalRevenues = netInterestIncome.consolidated.map((nii, i) => 
      nii + netCommissions[i]
    );
    
    // Step 7: Operating Expenses
    const operatingExpenses = this.calculateOperatingExpenses(
      personnelCosts,
      assumptions,
      years
    );
    
    // Step 8: Loan Loss Provisions
    const loanLossProvisions = this.calculateLLP(
      balanceSheetResults,
      assumptions,
      years
    );
    
    // Step 9: Pre-tax and Net Profit
    const preTaxProfit = totalRevenues.map((revenue, i) => 
      revenue + operatingExpenses.total[i] + loanLossProvisions.consolidated[i]
    );
    
    const taxes = preTaxProfit.map(profit => 
      profit > 0 ? -profit * assumptions.taxRate / 100 : 0
    );
    
    const netProfit = preTaxProfit.map((profit, i) => 
      profit + taxes[i]
    );
    
    // Step 10: Organize results
    return {
      // Consolidated P&L
      consolidated: {
        // Revenue lines
        interestIncome: interestIncome.consolidated,
        interestExpenses: interestExpense.consolidated,
        netInterestIncome: netInterestIncome.consolidated,
        commissionIncome: commissionIncome.consolidated,
        commissionExpenses: commissionExpense,
        netCommissions: netCommissions,
        totalRevenues: totalRevenues,
        
        // Expense lines
        personnelCosts: personnelCosts.grandTotal.costs,
        otherOpex: operatingExpenses.other,
        totalOpex: operatingExpenses.total,
        
        // Provisions
        totalLLP: loanLossProvisions.consolidated,
        
        // Profit lines
        preTaxProfit: preTaxProfit,
        taxes: taxes,
        netProfit: netProfit
      },
      
      // Quarterly data
      quarterly: {
        interestIncome: interestIncome.quarterly || this.annualToQuarterly(interestIncome.consolidated),
        interestExpenses: this.annualToQuarterly(interestExpense.consolidated),
        netInterestIncome: this.annualToQuarterly(netInterestIncome.consolidated),
        totalRevenues: this.annualToQuarterly(totalRevenues),
        totalLLP: this.annualToQuarterly(loanLossProvisions.consolidated),
        netProfit: this.annualToQuarterly(netProfit),
        // Add personnel and opex quarterly data
        personnelCosts: this.annualToQuarterly(personnelCosts.grandTotal.costs),
        otherOpex: this.annualToQuarterly(operatingExpenses.other),
        totalOpex: this.annualToQuarterly(operatingExpenses.total),
        commissionIncome: this.annualToQuarterly(commissionIncome.consolidated),
        commissionExpenses: this.annualToQuarterly(commissionExpense)
      },
      
      // Division breakdown
      byDivision: this.organizeDivisionPnL(
        interestIncome,
        interestExpense,
        commissionIncome,
        personnelCosts,
        operatingExpenses,
        loanLossProvisions,
        assumptions
      ),
      
      // Personnel detail
      personnelDetail: personnelCosts,
      
      // Product P&L data from microservices
      productTableData: {
        interestIncome: interestIncome.tableData || {}
      },
      
      // Component details
      details: {
        interestIncome,
        interestExpense,
        netInterestIncome,
        commissionIncome,
        operatingExpenses,
        loanLossProvisions
      }
    };
  },
  
  /**
   * Calculate interest income from assets
   * @private
   */
  calculateInterestIncome(balanceSheetResults, assumptions, years) {
    // Use the new calculator that applies product-specific rates
    const netPerformingAssets = balanceSheetResults.details?.netPerformingAssets;
    
    if (!netPerformingAssets || !netPerformingAssets.byProduct) {
      console.warn('Net performing assets data not available', {
        hasDetails: !!balanceSheetResults.details,
        hasNPA: !!balanceSheetResults.details?.netPerformingAssets,
        hasByProduct: !!balanceSheetResults.details?.netPerformingAssets?.byProduct
      });
      return {
        consolidated: new Array(10).fill(0),
        byDivision: {},
        quarterly: {
          total: new Array(40).fill(0),
          byDivision: {}
        }
      };
    }
    
    // Get product data from balance sheet for dynamic products
    const productData = balanceSheetResults.productResults || {};
    
    // Use the new dynamic calculator that doesn't depend on hardcoded mappings
    const interestResults = calculateDynamicInterestIncome(
      netPerformingAssets,
      assumptions,
      productData,
      40 // quarters
    );
    
    return {
      consolidated: interestResults.annual.total,
      byDivision: interestResults.annual.byDivision,
      byProduct: interestResults.annual.byProduct,
      quarterly: {
        total: interestResults.quarterly.total,
        byDivision: interestResults.quarterly.byDivision,
        byProduct: interestResults.quarterly.byProduct
      },
      metrics: interestResults.metrics
    };
  },
  
  /**
   * Calculate interest expense on liabilities
   * @private
   */
  calculateInterestExpense(balanceSheetResults, assumptions, years) {
    const consolidated = new Array(10).fill(0);
    const byDivision = {};
    
    // Deposits cost
    const depositRate = assumptions.depositRate / 100;
    const deposits = balanceSheetResults.consolidated.customerDeposits;
    
    // Interbank funding cost
    const ftpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
    const interbankFunding = balanceSheetResults.consolidated.interbankFunding;
    
    years.forEach(year => {
      consolidated[year] = -(
        deposits[year] * depositRate +
        interbankFunding[year] * ftpRate
      );
    });
    
    return { consolidated, byDivision };
  },
  
  /**
   * Calculate net interest income
   * @private
   */
  calculateNetInterestIncome(interestIncome, interestExpense) {
    const consolidated = interestIncome.consolidated.map((income, i) => 
      income + interestExpense.consolidated[i]
    );
    
    const byDivision = {};
    Object.keys(interestIncome.byDivision).forEach(divKey => {
      byDivision[divKey] = interestIncome.byDivision[divKey].map((income, i) => 
        income + (interestExpense.byDivision[divKey]?.[i] || 0)
      );
    });
    
    return { consolidated, byDivision };
  },
  
  /**
   * Calculate commission income
   * @private
   */
  calculateCommissions(balanceSheetResults, assumptions, years) {
    const consolidated = new Array(10).fill(0);
    const byDivision = {};
    
    // Simplified commission calculation based on new volumes
    Object.entries(balanceSheetResults.productResults).forEach(([productKey, product]) => {
      const commissionRate = product.originalProduct?.commissionRate || 0.5;
      const volumes = product.originalProduct?.volumeArray || new Array(10).fill(0);
      
      volumes.forEach((volume, year) => {
        const commission = volume * commissionRate / 100;
        consolidated[year] += commission;
        
        // Add to division
        const divKey = this.getDivisionFromProductKey(productKey);
        if (divKey) {
          byDivision[divKey] = byDivision[divKey] || new Array(10).fill(0);
          byDivision[divKey][year] += commission;
        }
      });
    });
    
    return { consolidated, byDivision };
  },
  
  /**
   * Calculate operating expenses
   * @private
   */
  calculateOperatingExpenses(personnelCosts, assumptions, years) {
    const costGrowth = years.map(i => Math.pow(1 + assumptions.costGrowthRate / 100, i));
    
    // HQ allocation
    const hqAllocation = years.map(i => -assumptions.hqAllocationY1 * costGrowth[i]);
    
    // IT costs
    const itCosts = years.map(i => -assumptions.itCostsY1 * costGrowth[i]);
    
    // Central function costs
    const centralCosts = this.calculateCentralCosts(assumptions, costGrowth);
    
    // Other operating expenses
    const other = years.map(i => 
      hqAllocation[i] + itCosts[i] + centralCosts[i]
    );
    
    // Total including personnel
    const total = years.map(i => 
      personnelCosts.grandTotal.costs[i] + other[i]
    );
    
    return {
      personnel: personnelCosts.grandTotal.costs,
      other,
      total,
      breakdown: {
        hqAllocation,
        itCosts,
        centralCosts
      }
    };
  },
  
  /**
   * Calculate central function costs
   * @private
   */
  calculateCentralCosts(assumptions, costGrowth) {
    const cf = assumptions.centralFunctions || {};
    
    return costGrowth.map(growth => -(
      (cf.facilitiesCostsY1 || 0) * growth +
      (cf.externalServicesY1 || 0) * growth +
      (cf.regulatoryFeesY1 || 0) * growth +
      (cf.otherCentralCostsY1 || 0) * growth
    ));
  },
  
  /**
   * Calculate loan loss provisions
   * @private
   */
  calculateLLP(balanceSheetResults, assumptions, years) {
    const consolidated = new Array(10).fill(0);
    const byDivision = {};
    
    // Simplified LLP based on new NPLs and performing assets
    const avgPerformingAssets = this.calculateAverageAssets(
      balanceSheetResults.quarterly.netPerformingAssets
    );
    
    // Average danger rate across products
    const avgDangerRate = 1.5 / 100; // 1.5%
    
    avgPerformingAssets.forEach((avg, year) => {
      consolidated[year] = -avg * avgDangerRate * 0.45; // 45% LGD
    });
    
    return { consolidated, byDivision };
  },
  
  /**
   * Organize P&L by division
   * @private
   */
  organizeDivisionPnL(interestIncome, interestExpense, commissionIncome, 
                      personnelCosts, operatingExpenses, llp, assumptions) {
    const results = {};
    
    ALL_DIVISION_PREFIXES.forEach(divKey => {
      const divisionInterestIncome = interestIncome.byDivision[divKey] || new Array(10).fill(0);
      const divisionInterestExpense = interestExpense.byDivision[divKey] || new Array(10).fill(0);
      const divisionCommissions = commissionIncome.byDivision[divKey] || new Array(10).fill(0);
      
      // Net interest income
      const netInterestIncome = divisionInterestIncome.map((income, i) => 
        income + divisionInterestExpense[i]
      );
      
      // Total revenues
      const totalRevenues = netInterestIncome.map((nii, i) => 
        nii + divisionCommissions[i]
      );
      
      // Personnel costs
      const personnelKey = getPersonnelKey(divKey);
      const divisionPersonnel = personnelCosts[personnelKey]?.costs || new Array(10).fill(0);
      
      // Other opex allocation (simplified)
      const otherOpex = operatingExpenses.other.map(opex => opex * 0.1); // 10% allocation
      
      // Total opex
      const totalOpex = divisionPersonnel.map((personnel, i) => 
        personnel + otherOpex[i]
      );
      
      // LLP
      const divisionLLP = llp.byDivision[divKey] || new Array(10).fill(0);
      
      // Pre-tax profit
      const preTaxProfit = totalRevenues.map((revenue, i) => 
        revenue + totalOpex[i] + divisionLLP[i]
      );
      
      // Taxes
      const taxes = preTaxProfit.map(profit => 
        profit > 0 ? -profit * assumptions.taxRate / 100 : 0
      );
      
      // Net profit
      const netProfit = preTaxProfit.map((profit, i) => 
        profit + taxes[i]
      );
      
      results[divKey] = {
        // Annual data
        interestIncome: divisionInterestIncome,
        interestExpenses: divisionInterestExpense,
        netInterestIncome,
        commissionIncome: divisionCommissions,
        commissionExpenses: divisionCommissions.map(c => -c * 0.1), // 10% expense rate
        netCommissions: divisionCommissions.map(c => c * 0.9),
        totalRevenues,
        personnelCosts: divisionPersonnel,
        otherOpex,
        totalOpex,
        totalLLP: divisionLLP,
        preTaxProfit,
        taxes,
        netProfit,
        
        // Quarterly data
        quarterly: {
          interestIncome: interestIncome.quarterly?.byDivision?.[divKey] || this.annualToQuarterly(divisionInterestIncome),
          interestExpenses: this.annualToQuarterly(divisionInterestExpense),
          netInterestIncome: this.annualToQuarterly(netInterestIncome),
          commissionIncome: this.annualToQuarterly(divisionCommissions),
          commissionExpenses: this.annualToQuarterly(divisionCommissions.map(c => -c * 0.1)),
          totalRevenues: this.annualToQuarterly(totalRevenues),
          personnelCosts: this.annualToQuarterly(divisionPersonnel),
          otherOpex: this.annualToQuarterly(otherOpex),
          totalOpex: this.annualToQuarterly(totalOpex),
          totalLLP: this.annualToQuarterly(divisionLLP),
          preTaxProfit: this.annualToQuarterly(preTaxProfit),
          taxes: this.annualToQuarterly(taxes),
          netProfit: this.annualToQuarterly(netProfit)
        }
      };
    });
    
    return results;
  },
  
  /**
   * Calculate average assets from quarterly data
   * @private
   */
  calculateAverageAssets(quarterlyAssets) {
    const annual = [];
    
    for (let year = 0; year < 10; year++) {
      let sum = 0;
      for (let q = 0; q < 4; q++) {
        sum += quarterlyAssets[year * 4 + q] || 0;
      }
      annual.push(sum / 4);
    }
    
    return annual;
  },
  
  /**
   * Convert annual to quarterly
   * @private
   */
  annualToQuarterly(annualData) {
    const quarterly = [];
    annualData.forEach(value => {
      for (let q = 0; q < 4; q++) {
        quarterly.push(value / 4); // Distribute evenly
      }
    });
    return quarterly;
  },
  
  /**
   * Get division from product key
   * @private
   */
  getDivisionFromProductKey(productKey) {
    for (const prefix of ALL_DIVISION_PREFIXES) {
      if (productKey.startsWith(prefix)) {
        return prefix;
      }
    }
    return null;
  }
};