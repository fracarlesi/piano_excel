import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';

/**
 * Standardized P&L structure for all divisions
 * This component creates a consistent P&L view across all banking divisions
 */
const StandardPnL = ({ 
  divisionResults, 
  productResults, 
  assumptions, 
  globalResults,
  divisionName,
  showProductDetail = true,
  customRowTransformations = {}
}) => {
  
  // Helper function to create formula explanations
  const createFormula = (year, formula, details) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d)
  });

  // Standard P&L Row Structure
  const standardPnLRows = [
    // ========== REVENUES ==========
    {
      label: 'Interest Income',
      data: divisionResults.pnl.interestIncome,
      decimals: 2,
      isTotal: true,
      formula: divisionResults.pnl.interestIncome.map((val, i) => createFormula(i,
        'Σ(Average Performing Assets × Interest Rate)',
        [
          'Interest rate = EURIBOR + Product Spread',
          ...(showProductDetail ? Object.entries(productResults).map(([key, product]) =>
            year => `${product.name}: ${formatNumber(product.averagePerformingAssets?.[year] || 0, 2)} × ${formatNumber((product.assumptions?.interestRate || 0) * 100, 2)}% = ${formatNumber(product.interestIncome[year], 2)}`
          ) : []),
          year => `Total Interest Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    
    {
      label: 'Interest Expenses',
      data: divisionResults.pnl.interestExpenses || globalResults.pnl.interestExpenses.map((exp, i) => {
        // Allocate based on division's share of total assets
        const divisionAssets = (divisionResults.bs.performingAssets[i] || 0) + (divisionResults.bs.nonPerformingAssets[i] || 0);
        const totalAssets = globalResults.bs.totalAssets[i] || 1;
        return exp * (divisionAssets / totalAssets);
      }),
      decimals: 2,
      isNegative: true,
      formula: (divisionResults.pnl.interestExpenses || []).map((val, i) => createFormula(i,
        'Division Assets × Cost of Funding Rate',
        [
          year => `Division Assets: ${formatNumber((divisionResults.bs.performingAssets[year] || 0) + (divisionResults.bs.nonPerformingAssets[year] || 0), 0)} €M`,
          year => `Cost of Funding: ${assumptions.costOfFundsRate}%`,
          year => `Interest Expenses: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    
    {
      label: 'Net Interest Income',
      data: divisionResults.pnl.interestIncome.map((income, i) => {
        const expenses = divisionResults.pnl.interestExpenses?.[i] || 
          globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
        return income + expenses;
      }),
      decimals: 2,
      isHeader: true,
      formula: divisionResults.pnl.interestIncome.map((income, i) => createFormula(i,
        'Interest Income - Interest Expenses',
        [
          year => `Interest Income: ${formatNumber(divisionResults.pnl.interestIncome[year], 2)} €M`,
          year => `Interest Expenses: ${formatNumber(divisionResults.pnl.interestExpenses?.[year] || 0, 2)} €M`,
          year => `Net Interest Income: ${formatNumber(income + (divisionResults.pnl.interestExpenses?.[year] || 0), 2)} €M`
        ]
      ))
    },
    
    {
      label: 'Commission Income',
      data: divisionResults.pnl.commissionIncome,
      decimals: 2,
      isTotal: true,
      formula: divisionResults.pnl.commissionIncome.map((val, i) => createFormula(i,
        'Σ(New Business × Commission Rate)',
        [
          ...(showProductDetail ? Object.entries(productResults).map(([key, product]) =>
            year => `${product.name}: ${formatNumber(product.newBusiness?.[year] || 0, 0)} × ${formatNumber((product.assumptions?.commissionRate || 0) * 100, 2)}% = ${formatNumber(product.commissionIncome[year], 2)}`
          ) : []),
          year => `Total Commission Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    
    {
      label: 'Commission Expenses',
      data: divisionResults.pnl.commissionExpenses || divisionResults.pnl.commissionIncome.map(income => -income * (assumptions.commissionExpenseRate || 20) / 100),
      decimals: 2,
      isNegative: true,
      formula: (divisionResults.pnl.commissionExpenses || []).map((val, i) => createFormula(i,
        'Commission Income × Commission Expense Rate',
        [
          year => `Commission Income: ${formatNumber(divisionResults.pnl.commissionIncome[year], 2)} €M`,
          year => `Commission Expense Rate: ${assumptions.commissionExpenseRate || 20}%`,
          year => `Commission Expenses: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    
    {
      label: 'Net Commission Income',
      data: divisionResults.pnl.commissionIncome.map((income, i) => {
        const expenses = divisionResults.pnl.commissionExpenses?.[i] || -income * (assumptions.commissionExpenseRate || 20) / 100;
        return income + expenses;
      }),
      decimals: 2,
      isHeader: true
    },
    
    {
      label: 'Total Operating Income',
      data: divisionResults.pnl.interestIncome.map((interest, i) => {
        const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
          globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
        const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
          -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
        
        const netInterest = interest + interestExpenses;
        const netCommissions = divisionResults.pnl.commissionIncome[i] + commissionExpenses;
        return netInterest + netCommissions;
      }),
      decimals: 2,
      isHeader: true,
      bgColor: 'blue'
    },
    
    // ========== OPERATING EXPENSES ==========
    {
      label: 'Personnel Costs',
      data: divisionResults.pnl.personnelCosts || globalResults.kpi[`${divisionName}Fte`]?.map(fte => -fte * assumptions.avgCostPerFte / 1000) || [0, 0, 0, 0, 0],
      decimals: 2,
      isNegative: true,
      formula: (divisionResults.pnl.personnelCosts || []).map((val, i) => createFormula(i,
        'FTE × Average Cost per FTE',
        [
          year => `FTE: ${formatNumber(globalResults.kpi[`${divisionName}Fte`]?.[year] || 0, 0)}`,
          year => `Average Cost: ${formatNumber(assumptions.avgCostPerFte, 0)}k€`,
          year => `Personnel Costs: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    
    {
      label: 'Other Operating Expenses',
      data: divisionResults.pnl.otherOperatingExpenses || divisionResults.pnl.personnelCosts?.map(pc => pc * 0.5) || [0, 0, 0, 0, 0],
      decimals: 2,
      isNegative: true,
      formula: (divisionResults.pnl.otherOperatingExpenses || []).map((val, i) => createFormula(i,
        'Administrative + Marketing + IT + HQ Allocation',
        [
          'Allocated based on division size and complexity',
          year => `Total Other Operating Expenses: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    
    {
      label: 'Total Operating Expenses',
      data: (() => {
        const personnelCosts = divisionResults.pnl.personnelCosts || globalResults.kpi[`${divisionName}Fte`]?.map(fte => -fte * assumptions.avgCostPerFte / 1000) || [0, 0, 0, 0, 0];
        const otherOpex = divisionResults.pnl.otherOperatingExpenses || personnelCosts.map(pc => pc * 0.5);
        return personnelCosts.map((pc, i) => pc + otherOpex[i]);
      })(),
      decimals: 2,
      isHeader: true,
      isNegative: true
    },
    
    {
      label: 'Operating Profit Before Provisions',
      data: (() => {
        const totalIncome = divisionResults.pnl.interestIncome.map((interest, i) => {
          const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
            globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
          const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
            -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
          
          const netInterest = interest + interestExpenses;
          const netCommissions = divisionResults.pnl.commissionIncome[i] + commissionExpenses;
          return netInterest + netCommissions;
        });
        
        const personnelCosts = divisionResults.pnl.personnelCosts || globalResults.kpi[`${divisionName}Fte`]?.map(fte => -fte * assumptions.avgCostPerFte / 1000) || [0, 0, 0, 0, 0];
        const otherOpex = divisionResults.pnl.otherOperatingExpenses || personnelCosts.map(pc => pc * 0.5);
        const totalOpex = personnelCosts.map((pc, i) => pc + otherOpex[i]);
        
        return totalIncome.map((income, i) => income + totalOpex[i]);
      })(),
      decimals: 2,
      isHeader: true
    },
    
    // ========== PROVISIONS ==========
    {
      label: 'Loan Loss Provisions',
      data: divisionResults.pnl.totalLLP,
      decimals: 2,
      isNegative: true,
      formula: divisionResults.pnl.totalLLP.map((val, i) => createFormula(i,
        'Σ(Expected Loss on New Business + Loss on Stock Defaults)',
        [
          'Based on PD × LGD methodology',
          ...(showProductDetail ? Object.entries(productResults).map(([key, product]) =>
            year => `${product.name}: ${formatNumber(product.llp?.[year] || 0, 2)} €M`
          ) : []),
          year => `Total LLP: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    
    // ========== PRE-TAX PROFIT ==========
    {
      label: 'Profit Before Tax',
      data: (() => {
        const totalIncome = divisionResults.pnl.interestIncome.map((interest, i) => {
          const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
            globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
          const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
            -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
          
          const netInterest = interest + interestExpenses;
          const netCommissions = divisionResults.pnl.commissionIncome[i] + commissionExpenses;
          return netInterest + netCommissions;
        });
        
        const personnelCosts = divisionResults.pnl.personnelCosts || globalResults.kpi[`${divisionName}Fte`]?.map(fte => -fte * assumptions.avgCostPerFte / 1000) || [0, 0, 0, 0, 0];
        const otherOpex = divisionResults.pnl.otherOperatingExpenses || personnelCosts.map(pc => pc * 0.5);
        const totalOpex = personnelCosts.map((pc, i) => pc + otherOpex[i]);
        
        return totalIncome.map((income, i) => income + totalOpex[i] + divisionResults.pnl.totalLLP[i]);
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'yellow'
    },
    
    // ========== TAXES ==========
    {
      label: 'Income Tax',
      data: (() => {
        const pbt = (() => {
          const totalIncome = divisionResults.pnl.interestIncome.map((interest, i) => {
            const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
              globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
            const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
              -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
            
            const netInterest = interest + interestExpenses;
            const netCommissions = divisionResults.pnl.commissionIncome[i] + commissionExpenses;
            return netInterest + netCommissions;
          });
          
          const personnelCosts = divisionResults.pnl.personnelCosts || globalResults.kpi[`${divisionName}Fte`]?.map(fte => -fte * assumptions.avgCostPerFte / 1000) || [0, 0, 0, 0, 0];
          const otherOpex = divisionResults.pnl.otherOperatingExpenses || personnelCosts.map(pc => pc * 0.5);
          const totalOpex = personnelCosts.map((pc, i) => pc + otherOpex[i]);
          
          return totalIncome.map((income, i) => income + totalOpex[i] + divisionResults.pnl.totalLLP[i]);
        })();
        
        return pbt.map(profit => profit > 0 ? -profit * (assumptions.taxRate || 30) / 100 : 0);
      })(),
      decimals: 2,
      isNegative: true,
      formula: (() => {
        const pbt = (() => {
          const totalIncome = divisionResults.pnl.interestIncome.map((interest, i) => {
            const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
              globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
            const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
              -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
            
            const netInterest = interest + interestExpenses;
            const netCommissions = divisionResults.pnl.commissionIncome[i] + commissionExpenses;
            return netInterest + netCommissions;
          });
          
          const personnelCosts = divisionResults.pnl.personnelCosts || globalResults.kpi[`${divisionName}Fte`]?.map(fte => -fte * assumptions.avgCostPerFte / 1000) || [0, 0, 0, 0, 0];
          const otherOpex = divisionResults.pnl.otherOperatingExpenses || personnelCosts.map(pc => pc * 0.5);
          const totalOpex = personnelCosts.map((pc, i) => pc + otherOpex[i]);
          
          return totalIncome.map((income, i) => income + totalOpex[i] + divisionResults.pnl.totalLLP[i]);
        })();
        
        return pbt.map((profit, i) => createFormula(i,
          'PBT × Tax Rate (if PBT > 0)',
          [
            year => `Profit Before Tax: ${formatNumber(profit, 2)} €M`,
            year => `Tax Rate: ${assumptions.taxRate || 30}%`,
            year => profit > 0 ? `Tax: ${formatNumber(-profit * (assumptions.taxRate || 30) / 100, 2)} €M` : 'No tax on losses'
          ]
        ));
      })()
    },
    
    // ========== NET PROFIT ==========
    {
      label: 'Net Profit',
      data: (() => {
        const pbt = (() => {
          const totalIncome = divisionResults.pnl.interestIncome.map((interest, i) => {
            const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
              globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
            const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
              -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
            
            const netInterest = interest + interestExpenses;
            const netCommissions = divisionResults.pnl.commissionIncome[i] + commissionExpenses;
            return netInterest + netCommissions;
          });
          
          const personnelCosts = divisionResults.pnl.personnelCosts || globalResults.kpi[`${divisionName}Fte`]?.map(fte => -fte * assumptions.avgCostPerFte / 1000) || [0, 0, 0, 0, 0];
          const otherOpex = divisionResults.pnl.otherOperatingExpenses || personnelCosts.map(pc => pc * 0.5);
          const totalOpex = personnelCosts.map((pc, i) => pc + otherOpex[i]);
          
          return totalIncome.map((income, i) => income + totalOpex[i] + divisionResults.pnl.totalLLP[i]);
        })();
        
        const taxes = pbt.map(profit => profit > 0 ? -profit * (assumptions.taxRate || 30) / 100 : 0);
        return pbt.map((profit, i) => profit + taxes[i]);
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'green'
    }
  ];

  // Apply any custom row transformations
  const finalRows = standardPnLRows.map(row => ({
    ...row,
    ...(customRowTransformations[row.label] || {})
  }));

  return <FinancialTable title="Profit & Loss Statement" rows={finalRows} />;
};

export default StandardPnL;