/**
 * P&L Orchestrator
 * 
 * Main orchestrator that coordinates all P&L microservices
 * to produce the complete Profit & Loss statement
 */

import { PersonnelCalculator } from './personnel-calculators/personnelCalculator.js';
import { calculateInterestIncome } from './interest-income/index.js';
import { calculateCreditInterestExpense } from './interest-expense/CreditInterestExpenseCalculator.js';
import { calculateCommissionIncome } from './commission-income/commissionCalculator.js';
import { calculateCommissionExpense } from './commission-expense/commissionExpenseCalculator.js';
import { calculateCreditImpairment } from './llp-calculators/creditImpairmentCalculator.js';
import { calculateECLMovements } from './llp-calculators/eclPnLCalculator.js';
import { calculateTotalLLP } from './llp-calculators/totalLLPCalculator.js';
import { 
  ALL_DIVISION_PREFIXES,
  getPersonnelKey,
  getAssumptionKey
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
    const quarterList = [];
    for (let i = 0; i < quarters; i++) {
      quarterList.push(`Q${i + 1}`);
    }
    
    // Step 1: Personnel costs (calculated first as it's independent)
    const personnelCosts = this.calculateAllPersonnelCosts(assumptions, quarterList, years);
    
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
    const commissionIncomeResults = calculateCommissionIncome(
      balanceSheetResults,
      assumptions,
      40 // quarters
    );
    
    const commissionExpenseResults = calculateCommissionExpense(
      balanceSheetResults,
      assumptions,
      40 // quarters
    );
    
    // Logging disabled
    
    // Extract annual data for P&L
    const commissionIncome = {
      consolidated: commissionIncomeResults.annual.total,
      byDivision: commissionIncomeResults.annual.byDivision
    };
    
    const commissionExpense = {
      consolidated: commissionExpenseResults.annual.total,
      byDivision: commissionExpenseResults.annual.byDivision
    };
    
    const netCommissions = commissionIncome.consolidated.map((income, i) => 
      income + commissionExpense.consolidated[i]
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
        commissionExpenses: commissionExpense.consolidated,
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
        interestIncome: interestIncome.quarterly?.total || this.annualToQuarterly(interestIncome.consolidated),
        interestIncomePerforming: interestIncome.performing?.quarterly || new Array(40).fill(0),
        interestIncomeNonPerforming: interestIncome.nonPerforming?.quarterly || new Array(40).fill(0),
        interestExpenses: interestExpense.consolidated,
        netInterestIncome: this.annualToQuarterly(netInterestIncome.consolidated),
        commissionIncome: commissionIncomeResults.quarterly.total,
        commissionExpenses: commissionExpenseResults.quarterly.total,
        // Calculate net commissions quarterly
        netCommissions: commissionIncomeResults.quarterly.total.map((income, i) => 
          income + commissionExpenseResults.quarterly.total[i]
        ),
        totalRevenues: this.annualToQuarterly(totalRevenues),
        totalLLP: loanLossProvisions.quarterly || this.annualToQuarterly(loanLossProvisions.consolidated),
        // Calculate net revenues quarterly (totalRevenues + LLP)
        netRevenues: this.annualToQuarterly(totalRevenues).map((revenue, i) => 
          revenue + (loanLossProvisions.quarterly?.[i] || this.annualToQuarterly(loanLossProvisions.consolidated)[i] || 0)
        ),
        netProfit: this.annualToQuarterly(netProfit),
        // Add personnel and opex quarterly data
        personnelCosts: this.annualToQuarterly(personnelCosts.grandTotal.costs),
        otherOpex: new Array(40).fill(0), // Temporarily disabled until implementation
        totalOpex: this.annualToQuarterly(operatingExpenses.total)
      },
      
      // Division breakdown
      byDivision: this.organizeDivisionPnL(
        interestIncome,
        interestExpense,
        commissionIncome,
        commissionExpense,
        personnelCosts,
        operatingExpenses,
        loanLossProvisions,
        assumptions,
        commissionIncomeResults,
        commissionExpenseResults
      ),
      
      // Personnel detail
      personnelDetail: personnelCosts,
      
      // Product P&L data from microservices
      productTableData: {
        interestIncome: interestIncome.tableData || {},
        interestExpense: interestExpense.productDetails || {},
        commissionIncome: commissionIncomeResults.byProduct || {},
        commissionExpense: commissionExpenseResults.byProduct || {},
        loanLossProvisions: loanLossProvisions.byProduct || {},
        eclMovements: loanLossProvisions.eclMovements?.byProduct || {},
        creditImpairment: loanLossProvisions.creditImpairment?.byProduct || {}
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
    // Use the new Interest Income Orchestrator
    const interestResults = calculateInterestIncome(
      balanceSheetResults,
      assumptions,
      40 // quarters
    );
    
    return {
      consolidated: interestResults.annual.total,
      byDivision: interestResults.annual.byDivision,
      byProduct: interestResults.annual.byProduct,
      quarterly: interestResults.quarterly,
      tableData: interestResults.tableData,
      metrics: interestResults.metrics,
      // Separate performing and NPL data
      performing: {
        annual: interestResults.annual.performing,
        quarterly: interestResults.quarterly.performing
      },
      nonPerforming: {
        annual: interestResults.annual.nonPerforming,
        quarterly: interestResults.quarterly.nonPerforming
      },
      // Add division totals for UI display
      divisionTotals: interestResults.divisionTotals
    };
  },
  
  /**
   * Calculate interest expense on liabilities and FTP on credit assets
   * @private
   */
  calculateInterestExpense(balanceSheetResults, assumptions, years) {
    const consolidated = new Array(40).fill(0); // Changed to quarterly
    const byDivision = {};
    let productDetails = {};
    
    // FTP on credit assets (performing + NPL)
    // Logging disabled
    
    // Build credit data structure from balance sheet results and product results
    const creditDataForFTP = {
      byDivision: {}
    };
    
    // Use productResults from balance sheet which contains the actual product data
    Object.entries(balanceSheetResults.productResults || {}).forEach(([prodKey, prodData]) => {
      // Determine division from product key (e.g., 'reCartoImmobiliare' -> 're')
      let divKey = '';
      if (prodKey.startsWith('re')) divKey = 're';
      else if (prodKey.startsWith('sme')) divKey = 'sme';
      else if (prodKey.startsWith('wealth')) divKey = 'wealth';
      else if (prodKey.startsWith('incentive')) divKey = 'incentive';
      else if (prodKey.startsWith('digital')) divKey = 'digital';
      
      if (divKey) {
        if (!creditDataForFTP.byDivision[divKey]) {
          creditDataForFTP.byDivision[divKey] = {
            creditProducts: {}
          };
        }
        
        // Add product data with performing and NPL assets
        const performingData = prodData.quarterly?.performingStock || 
                              prodData.quarterly?.netPerformingAssets || 
                              new Array(40).fill(0);
        const nplData = prodData.quarterly?.nplStock || 
                       prodData.quarterly?.nonPerformingStock ||
                       prodData.quarterly?.nonPerformingAssets || 
                       new Array(40).fill(0);
        
        // Logging disabled
        
        creditDataForFTP.byDivision[divKey].creditProducts[prodKey] = {
          performingAssets: performingData,
          nplStock: nplData
        };
      }
    });
    
    // Logging disabled
    
    const creditFTPResults = calculateCreditInterestExpense(
      creditDataForFTP,
      assumptions
    );
    
    // Initialize division results
    ALL_DIVISION_PREFIXES.forEach(prefix => {
      byDivision[prefix] = new Array(40).fill(0); // Changed to quarterly
    });
    
    // FTP should only include credit products, not deposits or interbank funding
    for (let quarter = 0; quarter < 40; quarter++) {
      // Total FTP = only FTP on credit assets
      consolidated[quarter] = creditFTPResults.consolidated?.[quarter] || 0;
      
      // Update division results with FTP
      Object.entries(creditFTPResults.byDivision || {}).forEach(([divKey, divFTP]) => {
        if (byDivision[divKey]) {
          // divFTP is an object with {total, bonis, npl} arrays
          byDivision[divKey][quarter] = divFTP.total?.[quarter] || 0;
        }
      });
    }
    
    // Include product details if available
    if (creditFTPResults.productDetails) {
      productDetails = creditFTPResults.productDetails;
    }
    
    return { 
      consolidated, 
      byDivision, 
      productDetails,
      // Include raw results for detailed FTP breakdown
      rawResults: creditFTPResults.rawResults
    };
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
    
    // Other operating expenses - temporarily set to zero until properly implemented
    const other = years.map(i => 0); // Temporarily disabled until implementation
    // Original calculation: hqAllocation[i] + itCosts[i] + centralCosts[i]
    
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
    // Get GBV Defaulted and Non-Performing Assets from balance sheet details
    const gbvDefaultedResults = balanceSheetResults.details?.gbvDefaulted || 
                               balanceSheetResults.gbvDefaulted;
    const nonPerformingAssetsResults = balanceSheetResults.details?.nonPerformingAssets || 
                                      balanceSheetResults.nonPerformingAssets;
    
    // Check if we have the required data
    if (!gbvDefaultedResults || !nonPerformingAssetsResults) {
      // Return placeholder values
      return {
        consolidated: new Array(10).fill(0),
        byDivision: {},
        quarterly: new Array(40).fill(0),
        byProduct: {},
        metrics: {
          totalLLP: 0,
          totalECLMovement: 0,
          totalCreditImpairment: 0,
          eclPercentage: 0,
          impairmentPercentage: 0
        }
      };
    }
    
    // Get ECL provision data from balance sheet
    const eclProvisionResults = balanceSheetResults.details?.eclProvision?.details || 
                               balanceSheetResults.eclProvision?.details;
    
    // Calculate Credit Impairment (ex-LLPs)
    const creditImpairmentResults = calculateCreditImpairment(
      gbvDefaultedResults,
      nonPerformingAssetsResults,
      assumptions,
      40 // quarters
    );
    
    // Calculate ECL Movements for P&L
    const eclMovementResults = calculateECLMovements(
      eclProvisionResults,
      assumptions,
      40 // quarters
    );
    
    // Calculate Total LLP (ECL + Credit Impairment)
    const totalLLPResults = calculateTotalLLP(
      eclMovementResults,
      creditImpairmentResults,
      assumptions,
      40 // quarters
    );
    
    return {
      consolidated: totalLLPResults.consolidated.annual,
      byDivision: Object.entries(totalLLPResults.byDivision).reduce((acc, [divKey, divData]) => {
        acc[divKey] = divData.annual;
        return acc;
      }, {}),
      quarterly: totalLLPResults.consolidated.quarterly,
      byProduct: totalLLPResults.byProduct,
      
      // Component breakdown
      eclMovements: eclMovementResults,
      creditImpairment: creditImpairmentResults,
      
      // Formatted data for UI
      components: totalLLPResults.consolidated.components,
      
      // Metrics
      metrics: totalLLPResults.metrics
    };
  },
  
  
  /**
   * Organize P&L by division
   * @private
   */
  organizeDivisionPnL(interestIncome, interestExpense, commissionIncome, commissionExpense,
                      personnelCosts, operatingExpenses, llp, assumptions, 
                      commissionIncomeResults, commissionExpenseResults) {
    const results = {};
    
    ALL_DIVISION_PREFIXES.forEach(divKey => {
      const divisionInterestIncome = interestIncome.byDivision[divKey] || new Array(10).fill(0);
      const divisionInterestExpense = interestExpense.byDivision[divKey] || new Array(10).fill(0);
      const divisionCommissionIncome = commissionIncome.byDivision[divKey] || new Array(10).fill(0);
      const divisionCommissionExpense = commissionExpense.byDivision[divKey] || new Array(10).fill(0);
      
      // Get division interest income totals
      const divisionTotals = interestIncome.divisionTotals?.[divKey];
      
      // Net interest income
      const netInterestIncome = divisionInterestIncome.map((income, i) => 
        income + divisionInterestExpense[i]
      );
      
      // Net commissions
      const netCommissionsDivision = divisionCommissionIncome.map((income, i) => 
        income + divisionCommissionExpense[i]
      );
      
      // Total revenues
      const totalRevenues = netInterestIncome.map((nii, i) => 
        nii + netCommissionsDivision[i]
      );
      
      // Personnel costs
      const personnelKey = getPersonnelKey(divKey);
      const divisionPersonnel = personnelCosts[personnelKey]?.costs || new Array(10).fill(0);
      const divisionPersonnelQuarterly = personnelCosts[personnelKey]?.quarterly || new Array(40).fill(0);
      const divisionPersonnelBySeniority = personnelCosts[personnelKey]?.bySeniority || {
        junior: new Array(10).fill(0),
        middle: new Array(10).fill(0),
        senior: new Array(10).fill(0),
        headOf: new Array(10).fill(0)
      };
      
      
      // Convert annual seniority data to quarterly
      const personnelBySeniorityQuarterly = {
        junior: this.annualToQuarterly(divisionPersonnelBySeniority.junior),
        middle: this.annualToQuarterly(divisionPersonnelBySeniority.middle),
        senior: this.annualToQuarterly(divisionPersonnelBySeniority.senior),
        headOf: this.annualToQuarterly(divisionPersonnelBySeniority.headOf)
      };
      
      // Other opex allocation - temporarily set to zero until IT costs and HQ allocation are properly implemented
      const otherOpex = new Array(10).fill(0); // Temporarily disabled until implementation
      
      // Total opex
      const totalOpex = divisionPersonnel.map((personnel, i) => 
        personnel + otherOpex[i]
      );
      
      // LLP
      const divisionLLP = llp.byDivision[divKey] || new Array(10).fill(0);
      
      // Get LLP components for division (quarterly data)
      const divisionLLPComponents = {
        eclMovement: {
          quarterly: llp.byDivision[divKey]?.components?.eclMovement?.quarterly || new Array(40).fill(0),
          annual: llp.byDivision[divKey]?.components?.eclMovement?.annual || new Array(10).fill(0)
        },
        creditImpairment: {
          quarterly: llp.byDivision[divKey]?.components?.creditImpairment?.quarterly || new Array(40).fill(0),
          annual: llp.byDivision[divKey]?.components?.creditImpairment?.annual || new Array(10).fill(0)
        }
      };
      
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
        commissionIncome: divisionCommissionIncome,
        commissionExpenses: divisionCommissionExpense,
        netCommissions: netCommissionsDivision,
        totalRevenues,
        personnelCosts: divisionPersonnel,
        otherOpex,
        totalOpex,
        totalLLP: divisionLLP,
        preTaxProfit,
        taxes,
        netProfit,
        
        // LLP Components
        components: divisionLLPComponents,
        
        // Quarterly data
        quarterly: {
          interestIncome: divisionTotals?.total || interestIncome.quarterly?.byDivision?.[divKey] || this.annualToQuarterly(divisionInterestIncome),
          interestIncomePerforming: divisionTotals?.performingSubtotal || interestIncome.performing?.quarterly || new Array(40).fill(0),
          interestIncomeNonPerforming: divisionTotals?.nplSubtotal || interestIncome.nonPerforming?.quarterly || new Array(40).fill(0),
          interestExpenses: this.annualToQuarterly(divisionInterestExpense),
          netInterestIncome: this.annualToQuarterly(netInterestIncome),
          commissionIncome: commissionIncomeResults.quarterly.byDivision[divKey] || this.annualToQuarterly(divisionCommissionIncome),
          commissionExpenses: commissionExpenseResults.quarterly.byDivision[divKey] || this.annualToQuarterly(divisionCommissionExpense),
          // Calculate net commissions quarterly for division
          netCommissions: (commissionIncomeResults.quarterly.byDivision[divKey] || this.annualToQuarterly(divisionCommissionIncome)).map((income, i) => 
            income + (commissionExpenseResults.quarterly.byDivision[divKey]?.[i] || this.annualToQuarterly(divisionCommissionExpense)[i] || 0)
          ),
          totalRevenues: this.annualToQuarterly(totalRevenues),
          personnelCosts: divisionPersonnelQuarterly,
          otherOpex: new Array(40).fill(0), // Temporarily disabled until implementation
          totalOpex: this.annualToQuarterly(totalOpex),
          totalLLP: llp.quarterly ? (llp.byDivision[divKey]?.quarterly || new Array(40).fill(0)) : this.annualToQuarterly(divisionLLP),
          // Calculate net revenues quarterly for division (totalRevenues + LLP)
          netRevenues: this.annualToQuarterly(totalRevenues).map((revenue, i) => {
            const llpValue = llp.quarterly 
              ? (llp.byDivision[divKey]?.quarterly?.[i] || 0)
              : this.annualToQuarterly(divisionLLP)[i] || 0;
            return revenue + llpValue;
          }),
          components: divisionLLPComponents,
          preTaxProfit: this.annualToQuarterly(preTaxProfit),
          taxes: this.annualToQuarterly(taxes),
          netProfit: this.annualToQuarterly(netProfit),
          pbt: this.annualToQuarterly(preTaxProfit)
        },
        
        // Personnel costs by seniority
        personnelCostsBySeniority: personnelBySeniorityQuarterly,
        
        // Add division totals for product details
        divisionInterestIncomeTotals: divisionTotals,
        
        // Add credit interest expense details for FTP breakdown
        creditInterestExpense: {
          rawResults: interestExpense.rawResults?.byDivision?.[divKey] || null
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
  },

  /**
   * Calculate all personnel costs
   * @private
   */
  calculateAllPersonnelCosts(assumptions, quarterList, years) {
    
    const results = {
      grandTotal: {
        costs: new Array(10).fill(0),
        quarterly: new Array(40).fill(0),
        bySeniority: {
          junior: new Array(10).fill(0),
          middle: new Array(10).fill(0),
          senior: new Array(10).fill(0),
          headOf: new Array(10).fill(0)
        }
      }
    };
    
    // Calculate for each division
    ALL_DIVISION_PREFIXES.forEach(divKey => {
      const personnelKey = getPersonnelKey(divKey);
      
      
      // Get staffing data based on the division type
      let staffingData = {};
      let personnelDivisionData = {};
      
      if (divKey === 'cf') {
        // Central Functions has multiple departments
        personnelDivisionData = assumptions.centralFunctions || {};
        staffingData = personnelDivisionData;
      } else {
        // Business divisions - personnel data is directly in division assumptions
        const assumptionKey = getAssumptionKey(divKey);
        personnelDivisionData = assumptions[assumptionKey] || {};
        
        
        staffingData = {
          staffing: personnelDivisionData.staffing || [],
          positions: [], // Will be converted by PersonnelCalculator
          companyTaxMultiplier: assumptions.personnel?.companyTaxMultiplier || 1.4,
          annualSalaryReview: assumptions.personnel?.annualSalaryReview || 0,
          headcountGrowth: personnelDivisionData.headcountGrowth || 0
        };
      }
      
      
      const calculator = new PersonnelCalculator(
        personnelDivisionData,
        staffingData,
        quarterList
      );
      
      const divisionResults = calculator.getPersonnelCostsForPnL();
      
      // Store division results
      results[personnelKey] = {
        costs: new Array(10).fill(0),
        quarterly: new Array(40).fill(0),
        bySeniority: {
          junior: new Array(10).fill(0),
          middle: new Array(10).fill(0),
          senior: new Array(10).fill(0),
          headOf: new Array(10).fill(0)
        }
      };
      
      // Aggregate quarterly to annual
      quarterList.forEach((quarter, qIndex) => {
        const yearIndex = Math.floor(qIndex / 4);
        const quarterData = divisionResults[quarter];
        
        if (quarterData) {
          // Annual totals
          results[personnelKey].costs[yearIndex] += quarterData['Personnel costs'];
          results.grandTotal.costs[yearIndex] += quarterData['Personnel costs'];
          
          // Quarterly data
          results[personnelKey].quarterly[qIndex] = quarterData['Personnel costs'];
          results.grandTotal.quarterly[qIndex] += quarterData['Personnel costs'];
          
          // By seniority annual
          results[personnelKey].bySeniority.junior[yearIndex] += quarterData['Personnel costs - Junior'];
          results[personnelKey].bySeniority.middle[yearIndex] += quarterData['Personnel costs - Middle'];
          results[personnelKey].bySeniority.senior[yearIndex] += quarterData['Personnel costs - Senior'];
          results[personnelKey].bySeniority.headOf[yearIndex] += quarterData['Personnel costs - Head of'];
          
          results.grandTotal.bySeniority.junior[yearIndex] += quarterData['Personnel costs - Junior'];
          results.grandTotal.bySeniority.middle[yearIndex] += quarterData['Personnel costs - Middle'];
          results.grandTotal.bySeniority.senior[yearIndex] += quarterData['Personnel costs - Senior'];
          results.grandTotal.bySeniority.headOf[yearIndex] += quarterData['Personnel costs - Head of'];
        }
      });
    });
    
    
    return results;
  }
};