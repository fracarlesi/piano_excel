/**
 * P&L Orchestrator
 * 
 * Main orchestrator that coordinates all P&L microservices
 * to produce the complete Profit & Loss statement
 */

import { calculateInterestIncome } from './InterestIncomeCalculator.js';
import { calculateInterestExpense, calculateNetInterestIncome } from './InterestExpenseCalculator.js';
import { calculateCommissionIncome } from './CommissionIncomeCalculator.js';
import { calculateCommissionExpense, calculateNetCommissionIncome } from './CommissionExpenseCalculator.js';
import { calculateLoanLossProvisions } from './LoanLossProvisionCalculator.js';
import { calculatePersonnelExpenses } from './PersonnelExpenseCalculator.js';
import { calculateOperatingExpenses, calculateTotalOperatingExpenses } from './OperatingExpenseCalculator.js';
import { calculateTaxes, calculatePreTaxProfit, calculateNetProfit } from './TaxCalculator.js';

/**
 * Calculate complete P&L for all divisions
 * @param {Object} divisions - Division data with products
 * @param {Object} assumptions - Global assumptions
 * @param {Array} years - Array of year indices
 * @returns {Object} Complete P&L results
 */
export const calculateProfitAndLoss = (divisions, assumptions, years) => {
  // Step 1: Interest Income & Expense
  const interestIncome = calculateInterestIncome(divisions, assumptions, years);
  const interestExpense = calculateInterestExpense(divisions, assumptions, years);
  const netInterestIncome = calculateNetInterestIncome(interestIncome, interestExpense);

  // Step 2: Commission Income & Expense  
  const commissionIncome = calculateCommissionIncome(divisions, assumptions, years);
  const commissionExpense = calculateCommissionExpense(commissionIncome, divisions, assumptions, years);
  const netCommissions = calculateNetCommissionIncome(commissionIncome, commissionExpense);

  // Step 3: Total Revenues
  const totalRevenues = {
    consolidated: {
      annual: netInterestIncome.consolidated.annual.map((nii, i) => 
        nii + netCommissions.consolidated.annual[i]
      ),
      quarterly: netInterestIncome.consolidated.quarterly.map((nii, i) => 
        nii + netCommissions.consolidated.quarterly[i]
      )
    },
    byDivision: {}
  };

  Object.keys(netInterestIncome.byDivision).forEach(divKey => {
    totalRevenues.byDivision[divKey] = {
      annual: netInterestIncome.byDivision[divKey].annual.map((nii, i) => 
        nii + (netCommissions.byDivision[divKey]?.annual[i] || 0)
      ),
      quarterly: netInterestIncome.byDivision[divKey].quarterly.map((nii, i) => 
        nii + (netCommissions.byDivision[divKey]?.quarterly[i] || 0)
      )
    };
  });

  // Step 4: Operating Expenses
  const personnelExpenses = calculatePersonnelExpenses(divisions, assumptions, years);
  const operatingExpenses = calculateOperatingExpenses(divisions, assumptions, years);
  const totalOpex = calculateTotalOperatingExpenses(personnelExpenses, operatingExpenses);

  // Step 5: Operating Profit before Provisions
  const operatingProfitBeforeLLP = {
    consolidated: {
      annual: totalRevenues.consolidated.annual.map((rev, i) => 
        rev + totalOpex.consolidated.annual[i]
      ),
      quarterly: totalRevenues.consolidated.quarterly.map((rev, i) => 
        rev + totalOpex.consolidated.quarterly[i]
      )
    },
    byDivision: {}
  };

  Object.keys(totalRevenues.byDivision).forEach(divKey => {
    operatingProfitBeforeLLP.byDivision[divKey] = {
      annual: totalRevenues.byDivision[divKey].annual.map((rev, i) => 
        rev + (totalOpex.byDivision[divKey]?.annual[i] || 0)
      ),
      quarterly: totalRevenues.byDivision[divKey].quarterly.map((rev, i) => 
        rev + (totalOpex.byDivision[divKey]?.quarterly[i] || 0)
      )
    };
  });

  // Step 6: Loan Loss Provisions
  const loanLossProvisions = calculateLoanLossProvisions(divisions, assumptions, years);

  // Step 7: Operating Profit after Provisions
  const operatingProfit = {
    consolidated: {
      annual: operatingProfitBeforeLLP.consolidated.annual.map((op, i) => 
        op + loanLossProvisions.consolidated.annual[i]
      ),
      quarterly: operatingProfitBeforeLLP.consolidated.quarterly.map((op, i) => 
        op + loanLossProvisions.consolidated.quarterly[i]
      )
    },
    byDivision: {}
  };

  Object.keys(operatingProfitBeforeLLP.byDivision).forEach(divKey => {
    operatingProfit.byDivision[divKey] = {
      annual: operatingProfitBeforeLLP.byDivision[divKey].annual.map((op, i) => 
        op + (loanLossProvisions.byDivision[divKey]?.annual[i] || 0)
      ),
      quarterly: operatingProfitBeforeLLP.byDivision[divKey].quarterly.map((op, i) => 
        op + (loanLossProvisions.byDivision[divKey]?.quarterly[i] || 0)
      )
    };
  });

  // Step 8: Pre-tax Profit (same as operating profit if no other items)
  const preTaxProfit = calculatePreTaxProfit(operatingProfit);

  // Step 9: Taxes
  const taxes = calculateTaxes(preTaxProfit, assumptions, years);

  // Step 10: Net Profit
  const netProfit = calculateNetProfit(preTaxProfit, taxes);

  // Return complete P&L structure
  return {
    // Revenue components
    interestIncome: interestIncome.consolidated.annual,
    interestExpense: interestExpense.consolidated.annual,
    netInterestIncome: netInterestIncome.consolidated.annual,
    commissionIncome: commissionIncome.consolidated.annual,
    commissionExpense: commissionExpense.consolidated.annual,
    netCommissions: netCommissions.consolidated.annual,
    totalRevenues: totalRevenues.consolidated.annual,
    
    // Expense components
    personnelCosts: personnelExpenses.consolidated.annual,
    otherOperatingExpenses: operatingExpenses.consolidated.annual,
    totalOperatingExpenses: totalOpex.consolidated.annual,
    
    // Profit measures
    operatingProfitBeforeLLP: operatingProfitBeforeLLP.consolidated.annual,
    loanLossProvisions: loanLossProvisions.consolidated.annual,
    operatingProfit: operatingProfit.consolidated.annual,
    preTaxProfit: preTaxProfit.consolidated.annual,
    taxes: taxes.consolidated.annual,
    netProfit: netProfit.consolidated.annual,
    
    // Quarterly data
    quarterly: {
      interestIncome: interestIncome.consolidated.quarterly,
      interestExpense: interestExpense.consolidated.quarterly,
      netInterestIncome: netInterestIncome.consolidated.quarterly,
      commissionIncome: commissionIncome.consolidated.quarterly,
      commissionExpense: commissionExpense.consolidated.quarterly,
      totalRevenues: totalRevenues.consolidated.quarterly,
      totalOperatingExpenses: totalOpex.consolidated.quarterly,
      loanLossProvisions: loanLossProvisions.consolidated.quarterly,
      netProfit: netProfit.consolidated.quarterly
    },
    
    // Division breakdown
    byDivision: Object.keys(divisions).reduce((acc, divKey) => {
      acc[divKey] = {
        interestIncome: interestIncome.byDivision[divKey]?.annual || new Array(10).fill(0),
        interestExpense: interestExpense.byDivision[divKey]?.annual || new Array(10).fill(0),
        netInterestIncome: netInterestIncome.byDivision[divKey]?.annual || new Array(10).fill(0),
        commissionIncome: commissionIncome.byDivision[divKey]?.annual || new Array(10).fill(0),
        commissionExpense: commissionExpense.byDivision[divKey]?.annual || new Array(10).fill(0),
        netCommissions: netCommissions.byDivision[divKey]?.annual || new Array(10).fill(0),
        totalRevenues: totalRevenues.byDivision[divKey]?.annual || new Array(10).fill(0),
        personnelCosts: personnelExpenses.byDivision[divKey]?.annual || new Array(10).fill(0),
        otherOperatingExpenses: operatingExpenses.byDivision[divKey]?.annual || new Array(10).fill(0),
        totalOperatingExpenses: totalOpex.byDivision[divKey]?.annual || new Array(10).fill(0),
        loanLossProvisions: loanLossProvisions.byDivision[divKey]?.annual || new Array(10).fill(0),
        preTaxProfit: preTaxProfit.byDivision[divKey]?.annual || new Array(10).fill(0),
        taxes: taxes.byDivision[divKey]?.annual || new Array(10).fill(0),
        netProfit: netProfit.byDivision[divKey]?.annual || new Array(10).fill(0)
      };
      return acc;
    }, {}),
    
    // Detailed breakdowns
    details: {
      interestIncome: interestIncome,
      interestExpense: interestExpense,
      commissionIncome: commissionIncome,
      commissionExpense: commissionExpense,
      personnelExpenses: personnelExpenses,
      operatingExpenses: operatingExpenses,
      loanLossProvisions: loanLossProvisions,
      taxes: taxes
    }
  };
};