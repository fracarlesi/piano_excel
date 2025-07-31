/**
 * Main Calculation Engine - Simplified Assembler
 * 
 * This module acts as an orchestrator, calling specialized calculators
 * and assembling the final results.
 */

import { calculateAllPersonnelCosts, getDivisionPersonnelCosts } from './calculators/personnelCalculator';
import { calculateCreditProduct } from './calculators/creditCalculator';
import { calculateDigitalProduct, calculateDigitalCustomerModel } from './calculators/digitalCalculator';
import { calculateTreasuryResults } from './calculators/treasuryCalculator';
import { calculateCommissionProduct } from './calculators/commissionCalculator';
import { 
  ALL_DIVISION_PREFIXES,
  BUSINESS_DIVISION_PREFIXES,
  // STRUCTURAL_DIVISION_PREFIXES, // Currently unused - may be needed for structural division calculations
  // getAssumptionKey, // Currently unused - may be needed for assumption mapping
  getPersonnelKey
} from './divisionMappings';

/**
 * Main calculation function - assembles results from all calculators
 * 
 * @param {Object} assumptions - Complete assumptions object
 * @returns {Object} Complete calculation results
 */
export const calculateResults = (assumptions) => {
  // Initialize results structure
  const results = {
    pnl: {},
    bs: {},
    capital: {},
    kpi: {},
    divisions: {},
    productResults: {},
    allPersonnelCosts: null
  };
  
  // Standard years array
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // Calculate rates
  const ftpRate = (assumptions.euribor + assumptions.ftpSpread) / 100;
  const depositRate = assumptions.depositRate / 100;
  
  // Step 1: Calculate all personnel costs upfront
  results.allPersonnelCosts = calculateAllPersonnelCosts(assumptions, years);
  
  // Step 2: Initialize divisions
  ALL_DIVISION_PREFIXES.forEach(prefix => {
    results.divisions[prefix] = {
      bs: {},
      pnl: {},
      capital: {},
      kpi: {}
    };
  });
  
  // Step 3: Calculate products by type
  const productResults = {};
  
  for (const [key, product] of Object.entries(assumptions.products)) {
    let productResult;
    
    // Route to appropriate calculator based on product type
    if (product.productType === 'Commission') {
      productResult = calculateCommissionProduct(product, assumptions, years);
    } else if (product.productType === 'DepositAndService' || product.isDigital) {
      if (product.acquisition) {
        // Unified digital customer model
        productResult = calculateDigitalCustomerModel(product, assumptions, years, ftpRate);
      } else {
        // Simple deposit product
        productResult = calculateDigitalProduct(product, assumptions, years, ftpRate, depositRate);
      }
    } else {
      // Default to credit product
      productResult = calculateCreditProduct(product, assumptions, years);
    }
    
    // Add product metadata to results
    productResult.name = product.name;
    productResult.key = key;
    productResult.productType = product.productType;
    
    productResults[key] = productResult;
  }
  
  results.productResults = productResults;
  
  // Step 4: Aggregate products by division
  const divisionProductResults = {};
  ALL_DIVISION_PREFIXES.forEach(prefix => {
    divisionProductResults[prefix] = Object.fromEntries(
      Object.entries(productResults).filter(([key]) => 
        key.startsWith(prefix) || key.startsWith(`${prefix}RetailCustomer_sub`)
      )
    );
  });
  
  // Step 5: Calculate division-level aggregates
  ALL_DIVISION_PREFIXES.forEach(prefix => {
    const divisionProducts = Object.values(divisionProductResults[prefix]);
    const division = results.divisions[prefix];
    
    // Balance sheet aggregates
    division.bs.performingAssets = years.map(i => 
      divisionProducts.reduce((sum, p) => sum + (p.performingAssets?.[i] || 0), 0)
    );
    division.bs.nonPerformingAssets = years.map(i => 
      divisionProducts.reduce((sum, p) => sum + (p.nonPerformingAssets?.[i] || 0), 0)
    );
    
    // P&L aggregates
    division.pnl.interestIncome = years.map(i => 
      divisionProducts.reduce((sum, p) => sum + (p.interestIncome?.[i] || 0), 0)
    );
    division.pnl.interestExpenses = years.map(i => 
      divisionProducts.reduce((sum, p) => sum + (p.interestExpense?.[i] || 0), 0)
    );
    division.pnl.commissionIncome = years.map(i => 
      divisionProducts.reduce((sum, p) => sum + (p.commissionIncome?.[i] || 0), 0)
    );
    division.pnl.commissionExpenses = years.map(i => 
      divisionProducts.reduce((sum, p) => sum + (p.commissionExpense?.[i] || 0), 0)
    );
    division.pnl.totalLLP = years.map(i => 
      divisionProducts.reduce((sum, p) => sum + (p.llp?.[i] || 0), 0)
    );
    
    // Personnel costs - explicit assignment
    const personnelKey = getPersonnelKey(prefix);
    const personnelData = getDivisionPersonnelCosts(results.allPersonnelCosts, personnelKey);
    division.pnl.personnelCosts = personnelData.costs;
    division.pnl.personnelCostDetails = personnelData.details;
    
    // Capital
    division.capital.rwaCreditRisk = years.map(i => 
      divisionProducts.reduce((sum, p) => sum + (p.rwa?.[i] || 0), 0)
    );
    
    // KPIs
    division.kpi.fte = personnelData.headcount;
  });
  
  // Step 6: Handle special divisions (Central Functions, Treasury)
  
  // Central Functions - cost center
  const cf = results.divisions.central;
  const costGrowth = years.map(i => Math.pow(1 + assumptions.costGrowthRate / 100, i));
  
  cf.pnl.facilitiesCosts = years.map(i => 
    -assumptions.centralFunctions.facilitiesCostsY1 * costGrowth[i]
  );
  cf.pnl.externalServices = years.map(i => 
    -assumptions.centralFunctions.externalServicesY1 * costGrowth[i]
  );
  cf.pnl.regulatoryFees = years.map(i => 
    -assumptions.centralFunctions.regulatoryFeesY1 * costGrowth[i]
  );
  cf.pnl.otherCentralCosts = years.map(i => 
    -assumptions.centralFunctions.otherCentralCostsY1 * costGrowth[i]
  );
  
  cf.pnl.totalCentralCosts = years.map(i => 
    cf.pnl.facilitiesCosts[i] +
    cf.pnl.externalServices[i] +
    cf.pnl.regulatoryFees[i] +
    cf.pnl.otherCentralCosts[i] +
    cf.pnl.personnelCosts[i]
  );
  
  // Treasury - calculate after we have bank totals
  const totalLoans = years.map(i => 
    BUSINESS_DIVISION_PREFIXES.reduce((sum, prefix) => 
      sum + results.divisions[prefix].bs.performingAssets[i] + 
      results.divisions[prefix].bs.nonPerformingAssets[i], 0
    )
  );
  
  // Get digital deposits
  const digitalDeposits = Object.values(productResults)
    .filter(p => p.depositStock)
    .reduce((acc, p) => {
      return years.map((_, i) => acc[i] + (p.depositStock[i] || 0));
    }, years.map(() => 0));
  
  // Calculate treasury results
  const treasuryCalcs = calculateTreasuryResults(assumptions, {
    totalLoans: totalLoans,
    totalDeposits: digitalDeposits, // For now, only digital deposits
    digitalDeposits: digitalDeposits
  }, years);
  
  // Assign treasury results
  const treasury = results.divisions.treasury;
  Object.assign(treasury.bs, treasuryCalcs.bs);
  Object.assign(treasury.pnl, treasuryCalcs.pnl);
  Object.assign(treasury.capital, treasuryCalcs.capital);
  Object.assign(treasury.kpi, treasuryCalcs.kpi);
  
  // Add personnel costs to treasury
  const treasuryPersonnelData = getDivisionPersonnelCosts(
    results.allPersonnelCosts, 
    'Treasury'
  );
  treasury.pnl.personnelCosts = treasuryPersonnelData.costs;
  treasury.pnl.otherOpex = years.map(i => -2); // Simplified
  treasury.pnl.totalOpex = years.map(i => 
    treasury.pnl.personnelCosts[i] + treasury.pnl.otherOpex[i]
  );
  
  // Step 7: Calculate bank-wide totals
  
  // Balance sheet totals
  results.bs.performingAssets = years.map(i => 
    ALL_DIVISION_PREFIXES.reduce((sum, prefix) => 
      sum + (results.divisions[prefix].bs.performingAssets?.[i] || 0), 0
    )
  );
  results.bs.nonPerformingAssets = years.map(i => 
    ALL_DIVISION_PREFIXES.reduce((sum, prefix) => 
      sum + (results.divisions[prefix].bs.nonPerformingAssets?.[i] || 0), 0
    )
  );
  results.bs.totalAssets = years.map(i => 
    results.bs.performingAssets[i] + results.bs.nonPerformingAssets[i]
  );
  
  // Digital deposits
  results.bs.digitalServiceDeposits = digitalDeposits;
  
  // P&L totals
  results.pnl.interestIncome = years.map(i => 
    ALL_DIVISION_PREFIXES.reduce((sum, prefix) => 
      sum + (results.divisions[prefix].pnl.interestIncome?.[i] || 0), 0
    )
  );
  results.pnl.interestExpenses = years.map(i => 
    ALL_DIVISION_PREFIXES.reduce((sum, prefix) => 
      sum + (results.divisions[prefix].pnl.interestExpenses?.[i] || 0), 0
    )
  );
  results.pnl.netInterestIncome = years.map(i => 
    results.pnl.interestIncome[i] + results.pnl.interestExpenses[i]
  );
  
  results.pnl.commissionIncome = years.map(i => 
    ALL_DIVISION_PREFIXES.reduce((sum, prefix) => 
      sum + (results.divisions[prefix].pnl.commissionIncome?.[i] || 0), 0
    )
  );
  results.pnl.commissionExpenses = results.pnl.commissionIncome.map(c => 
    -c * assumptions.commissionExpenseRate / 100
  );
  results.pnl.netCommissions = years.map(i => 
    results.pnl.commissionIncome[i] + results.pnl.commissionExpenses[i]
  );
  
  results.pnl.totalRevenues = years.map(i => 
    results.pnl.netInterestIncome[i] + results.pnl.netCommissions[i]
  );
  
  // Personnel costs total
  results.pnl.personnelCostsTotal = results.allPersonnelCosts.grandTotal.costs;
  
  // Inter-division cost allocations
  results.pnl.hqAllocation = years.map(i => -assumptions.hqAllocationY1 * costGrowth[i]);
  results.pnl.itCosts = years.map(i => -assumptions.itCostsY1 * costGrowth[i]);
  
  const otherOpex = years.map(i => 
    results.pnl.hqAllocation[i] + 
    results.pnl.itCosts[i]
  );
  
  // Total operating expenses
  results.pnl.totalOpex = years.map(i => 
    results.pnl.personnelCostsTotal[i] + 
    otherOpex[i] + 
    cf.pnl.totalCentralCosts[i] + 
    treasury.pnl.totalOpex[i]
  );
  
  // Total LLP
  results.pnl.totalLLP = years.map(i => 
    ALL_DIVISION_PREFIXES.reduce((sum, prefix) => 
      sum + (results.divisions[prefix].pnl.totalLLP?.[i] || 0), 0
    )
  );
  
  // Pre-tax profit
  results.pnl.preTaxProfit = years.map(i => 
    results.pnl.totalRevenues[i] + 
    results.pnl.totalOpex[i] + 
    results.pnl.totalLLP[i]
  );
  
  // Taxes
  results.pnl.taxes = results.pnl.preTaxProfit.map(profit => 
    profit > 0 ? -profit * assumptions.taxRate / 100 : 0
  );
  
  // Net profit
  results.pnl.netProfit = years.map(i => 
    results.pnl.preTaxProfit[i] + results.pnl.taxes[i]
  );
  
  // Equity calculation
  results.bs.equity = years.map(i => 
    assumptions.initialEquity + 
    results.pnl.netProfit.slice(0, i + 1).reduce((a, b) => a + b, 0)
  );
  
  // Capital ratios
  results.capital.rwaCreditRisk = years.map(i => 
    ALL_DIVISION_PREFIXES.reduce((sum, prefix) => 
      sum + (results.divisions[prefix].capital.rwaCreditRisk?.[i] || 0), 0
    )
  );
  results.capital.rwaOperationalRisk = results.bs.totalAssets.map(assets => 
    assets * 0.1
  );
  results.capital.rwaMarketRisk = years.map(i => 
    results.divisions.treasury.capital.rwaMarketRisk?.[i] || 0
  );
  results.capital.totalRWA = years.map(i => 
    results.capital.rwaCreditRisk[i] + 
    results.capital.rwaOperationalRisk[i] + 
    results.capital.rwaMarketRisk[i]
  );
  
  // KPIs
  results.kpi.fte = results.allPersonnelCosts.grandTotal.headcount;
  results.kpi.cet1Ratio = years.map(i => 
    results.capital.totalRWA[i] > 0 ? 
    (results.bs.equity[i] / results.capital.totalRWA[i]) * 100 : 0
  );
  results.kpi.roe = years.map(i => {
    const startEquity = i > 0 ? results.bs.equity[i-1] : assumptions.initialEquity;
    const endEquity = results.bs.equity[i];
    const avgEquity = (startEquity + endEquity) / 2;
    return avgEquity > 0 ? (results.pnl.netProfit[i] / avgEquity) * 100 : 0;
  });
  results.kpi.costIncome = years.map(i => 
    results.pnl.totalRevenues[i] > 0 ? 
    (-results.pnl.totalOpex[i] / results.pnl.totalRevenues[i]) * 100 : 0
  );
  results.kpi.costOfRisk = years.map(i => {
    const avgPerformingAssets = i > 0 ? 
      (results.bs.performingAssets[i] + results.bs.performingAssets[i-1]) / 2 : 
      results.bs.performingAssets[i];
    return avgPerformingAssets > 0 ? 
      (-results.pnl.totalLLP[i] / avgPerformingAssets) * 10000 : 0;
  });
  
  // Complete division P&L calculations
  ALL_DIVISION_PREFIXES.forEach(prefix => {
    const division = results.divisions[prefix];
    
    // Skip if already calculated (Treasury, Central)
    if (division.pnl.totalOpex) return;
    
    // Calculate other OPEX allocation based on RWA
    division.pnl.otherOpex = years.map(i => {
      const divisionRWA = division.capital.rwaCreditRisk[i] || 0;
      const totalRWA = results.capital.totalRWA[i] || 1;
      const rwaWeight = divisionRWA / totalRWA;
      return otherOpex[i] * rwaWeight;
    });
    
    // Breakdown of other OPEX into IT costs and HQ allocation
    division.pnl.itCosts = years.map(i => {
      const divisionRWA = division.capital.rwaCreditRisk[i] || 0;
      const totalRWA = results.capital.totalRWA[i] || 1;
      const rwaWeight = divisionRWA / totalRWA;
      return results.pnl.itCosts[i] * rwaWeight;
    });
    
    division.pnl.hqAllocation = years.map(i => {
      const divisionRWA = division.capital.rwaCreditRisk[i] || 0;
      const totalRWA = results.capital.totalRWA[i] || 1;
      const rwaWeight = divisionRWA / totalRWA;
      return results.pnl.hqAllocation[i] * rwaWeight;
    });
    
    // Total OPEX
    division.pnl.totalOpex = years.map(i => 
      (division.pnl.personnelCosts?.[i] || 0) + 
      (division.pnl.otherOpex?.[i] || 0)
    );
    
    // Net interest income
    division.pnl.netInterestIncome = years.map(i => 
      (division.pnl.interestIncome?.[i] || 0) + 
      (division.pnl.interestExpenses?.[i] || 0)
    );
    
    // Net commissions
    division.pnl.netCommissions = years.map(i => 
      (division.pnl.commissionIncome?.[i] || 0) + 
      (division.pnl.commissionExpenses?.[i] || 0)
    );
    
    // Total revenues
    division.pnl.totalRevenues = years.map(i => 
      division.pnl.netInterestIncome[i] + division.pnl.netCommissions[i]
    );
    
    // Pre-tax profit
    division.pnl.preTaxProfit = years.map(i => 
      division.pnl.totalRevenues[i] + 
      division.pnl.totalOpex[i] + 
      (division.pnl.totalLLP?.[i] || 0)
    );
    
    // Taxes
    division.pnl.taxes = division.pnl.preTaxProfit.map(profit => 
      profit > 0 ? -profit * assumptions.taxRate / 100 : 0
    );
    
    // Net profit
    division.pnl.netProfit = years.map(i => 
      division.pnl.preTaxProfit[i] + division.pnl.taxes[i]
    );
  });
  
  return results;
};

export default calculateResults;