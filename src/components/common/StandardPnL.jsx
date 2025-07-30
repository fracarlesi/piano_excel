import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';

/**
 * Standardized P&L structure for all divisions
 * Following the exact schema provided
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
  
  // Helper function to create formula explanations with numerical calculations
  const createFormula = (year, formula, details, calculation = null) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d),
    calculation: typeof calculation === 'function' ? calculation(year) : calculation
  });

  // Calculate derived values
  const netInterestIncome = (divisionResults.pnl.interestIncome || [0,0,0,0,0]).map((income, i) => {
    const expenses = (divisionResults.pnl.interestExpenses || [0,0,0,0,0])[i] || 0;
    return income + expenses; // expenses are negative
  });

  const netCommissionIncome = (divisionResults.pnl.commissionIncome || [0,0,0,0,0]).map((income, i) => {
    const expenses = (divisionResults.pnl.commissionExpenses || [0,0,0,0,0])[i] || 0;
    return income + expenses; // expenses are negative
  });

  // Calculate other income (equity upside)
  const otherIncome = Object.values(productResults).reduce((acc, product) => {
    const equityUpside = product.equityUpsideIncome || [0,0,0,0,0];
    return acc.map((val, i) => val + equityUpside[i]);
  }, [0,0,0,0,0]);

  const totalRevenues = netInterestIncome.map((nii, i) => nii + netCommissionIncome[i] + otherIncome[i]);

  // Calculate total operating expenses
  const personnelCosts = divisionResults.pnl.personnelCosts || 
    globalResults.pnl.personnelCostsTotal.map((cost, i) => {
      const divisionRwa = (divisionResults.capital.totalRWA || [0,0,0,0,0])[i] || 0;
      const totalRwa = globalResults.capital.totalRWA[i] || 1;
      return cost * (divisionRwa / totalRwa);
    });

  const otherOpex = divisionResults.pnl.otherOpex || [0,0,0,0,0].map((_, i) => {
    const adminCosts = (globalResults.pnl.adminCosts || [0,0,0,0,0])[i] || 0;
    const marketingCosts = (globalResults.pnl.marketingCosts || [0,0,0,0,0])[i] || 0;
    const itCosts = (globalResults.pnl.itCosts || [0,0,0,0,0])[i] || 0;
    const hqAllocation = (globalResults.pnl.hqAllocation || [0,0,0,0,0])[i] || 0;
    const totalOtherOpex = adminCosts + marketingCosts + itCosts + hqAllocation;
    
    const divisionRwa = (divisionResults.capital.totalRWA || [0,0,0,0,0])[i] || 0;
    const totalRwa = globalResults.capital.totalRWA[i] || 1;
    return totalOtherOpex * (divisionRwa / totalRwa);
  });

  const totalOpex = personnelCosts.map((pc, i) => pc + otherOpex[i]);

  const preTaxProfit = totalRevenues.map((rev, i) => 
    rev + totalOpex[i] + (divisionResults.pnl.totalLLP || [0,0,0,0,0])[i]
  );

  const netProfit = divisionResults.pnl.netProfit || preTaxProfit.map((pbt, i) => {
    const taxRate = assumptions.taxRate || 0.3;
    const taxes = pbt > 0 ? pbt * taxRate : 0;
    return pbt - taxes;
  });

  // P&L Rows following the exact schema
  const pnlRows = [
    // ========== INTEREST INCOME SECTION ==========
    {
      label: 'Interest Income (IC)',
      data: divisionResults.pnl.interestIncome || [0,0,0,0,0],
      decimals: 2,
      isTotal: true,
      formula: (divisionResults.pnl.interestIncome || [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Σ(Average Performing Assets × Interest Rate)',
        [
          'Interest rate = EURIBOR + Product Spread',
          year => `Total Interest Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    
    // Product breakdown for Interest Income
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.interestIncome || [0,0,0,0,0],
      decimals: 2,
      indent: true,
      formula: (product.interestIncome || [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Average Performing Stock × Interest Rate',
        [
          `Product: ${product.name}`,
          year => `Average Stock: ${formatNumber((product.averagePerformingAssets || [0,0,0,0,0])[year], 0)} €M`,
          year => `Interest Rate: ${((product.assumptions?.interestRate || 0) * 100).toFixed(2)}%`,
          year => `Interest Income: ${formatNumber(val, 2)} €M`
        ],
        year => {
          const avgStock = (product.averagePerformingAssets || [0,0,0,0,0])[year] || 0;
          const rate = (product.assumptions?.interestRate || 0) * 100;
          return `${formatNumber(avgStock, 0)} × ${rate.toFixed(2)}% = ${formatNumber(val, 2)} €M`;
        }
      ))
    })) : []),

    // ========== INTEREST EXPENSES SECTION ==========
    {
      label: 'Interest Expenses (IE)',
      data: divisionResults.pnl.interestExpenses || [0,0,0,0,0],
      decimals: 2,
      isTotal: true,
      formula: (divisionResults.pnl.interestExpenses || [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Division Liabilities × Cost of Funding',
        [
          year => `Cost of Funding: ${assumptions.costOfFundsRate}%`,
          year => `Interest Expenses: ${formatNumber(val, 2)} €M`
        ]
      ))
    },

    // Product breakdown for Interest Expenses
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.interestExpense || [0,0,0,0,0],
      decimals: 2,
      indent: true
    })) : []),

    // ========== NET INTEREST INCOME ==========
    {
      label: 'Net Interest Income (NII)',
      data: netInterestIncome,
      decimals: 2,
      isHeader: true,
      formula: netInterestIncome.map((val, i) => createFormula(i,
        'Interest Income - Interest Expenses',
        [
          year => `Interest Income: ${formatNumber((divisionResults.pnl.interestIncome || [0,0,0,0,0])[year], 2)} €M`,
          year => `Interest Expenses: ${formatNumber((divisionResults.pnl.interestExpenses || [0,0,0,0,0])[year], 2)} €M`,
          year => `NII: ${formatNumber(val, 2)} €M`
        ],
        year => {
          const income = (divisionResults.pnl.interestIncome || [0,0,0,0,0])[year] || 0;
          const expenses = (divisionResults.pnl.interestExpenses || [0,0,0,0,0])[year] || 0;
          return `${formatNumber(income, 2)} - (${formatNumber(Math.abs(expenses), 2)}) = ${formatNumber(val, 2)} €M`;
        }
      ))
    },

    // Product NII breakdown
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: (product.interestIncome || [0,0,0,0,0]).map((income, i) => 
        income + (product.interestExpense || [0,0,0,0,0])[i]
      ),
      decimals: 2,
      indent: true
    })) : []),

    // ========== COMMISSION INCOME SECTION ==========
    {
      label: 'Commission Income (CI)',
      data: divisionResults.pnl.commissionIncome || [0,0,0,0,0],
      decimals: 2,
      isTotal: true,
      formula: (divisionResults.pnl.commissionIncome || [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Σ(New Business × Commission Rate)',
        [
          year => `Total Commission Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },

    // Product breakdown for Commission Income
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.commissionIncome || [0,0,0,0,0],
      decimals: 2,
      indent: true
    })) : []),

    // ========== COMMISSION EXPENSES SECTION ==========
    {
      label: 'Commission Expenses (CE)',
      data: divisionResults.pnl.commissionExpenses || [0,0,0,0,0],
      decimals: 2,
      isTotal: true
    },

    // Product breakdown for Commission Expenses
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.commissionExpense || [0,0,0,0,0],
      decimals: 2,
      indent: true
    })) : []),

    // ========== NET COMMISSION INCOME ==========
    {
      label: 'Net Commission Income (NCI)',
      data: netCommissionIncome,
      decimals: 2,
      isHeader: true,
      formula: netCommissionIncome.map((val, i) => createFormula(i,
        'Commission Income - Commission Expenses',
        [
          year => `Commission Income: ${formatNumber((divisionResults.pnl.commissionIncome || [0,0,0,0,0])[year], 2)} €M`,
          year => `Commission Expenses: ${formatNumber((divisionResults.pnl.commissionExpenses || [0,0,0,0,0])[year], 2)} €M`,
          year => `NCI: ${formatNumber(val, 2)} €M`
        ],
        year => {
          const income = (divisionResults.pnl.commissionIncome || [0,0,0,0,0])[year] || 0;
          const expenses = (divisionResults.pnl.commissionExpenses || [0,0,0,0,0])[year] || 0;
          return `${formatNumber(income, 2)} - (${formatNumber(Math.abs(expenses), 2)}) = ${formatNumber(val, 2)} €M`;
        }
      ))
    },

    // Product NCI breakdown
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: (product.commissionIncome || [0,0,0,0,0]).map((income, i) => 
        income + (product.commissionExpense || [0,0,0,0,0])[i]
      ),
      decimals: 2,
      indent: true
    })) : []),

    // ========== OTHER INCOME ==========
    {
      label: 'Other Income',
      data: Object.values(productResults).reduce((acc, product) => {
        const equityUpside = product.equityUpsideIncome || [0,0,0,0,0];
        return acc.map((val, i) => val + equityUpside[i]);
      }, [0,0,0,0,0]),
      decimals: 2,
      isTotal: true,
      formula: Object.values(productResults).reduce((acc, product) => {
        const equityUpside = product.equityUpsideIncome || [0,0,0,0,0];
        return acc.map((val, i) => val + equityUpside[i]);
      }, [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Equity Upside Income from products',
        [
          year => `Other Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },

    // Product breakdown for Other Income (Equity Upside)
    ...(showProductDetail ? Object.entries(productResults)
      .filter(([key, product]) => product.equityUpsideIncome && product.equityUpsideIncome.some(val => val > 0))
      .map(([key, product], index) => ({
        label: `- o/w ${product.name} (Equity Upside)`,
        data: product.equityUpsideIncome || [0,0,0,0,0],
        decimals: 2,
        indent: true
      })) : []),

    {
      label: 'Trading Income',
      data: [0,0,0,0,0],
      decimals: 2
    },

    // ========== TOTAL REVENUES ==========
    {
      label: 'Total Revenues',
      data: totalRevenues,
      decimals: 2,
      isHeader: true,
      bgColor: 'gray',
      formula: totalRevenues.map((val, i) => createFormula(i,
        'NII + NCI + Other Income + Trading Income',
        [
          year => `NII: ${formatNumber(netInterestIncome[year], 2)} €M`,
          year => `NCI: ${formatNumber(netCommissionIncome[year], 2)} €M`,
          year => `Other Income: ${formatNumber(otherIncome[year], 2)} €M`,
          year => `Trading: 0 €M`,
          year => `Total: ${formatNumber(val, 2)} €M`
        ],
        year => `${formatNumber(netInterestIncome[year], 2)} + ${formatNumber(netCommissionIncome[year], 2)} + ${formatNumber(otherIncome[year], 2)} + 0 = ${formatNumber(val, 2)} €M`
      ))
    },

    // ========== PERSONNEL COSTS ==========
    {
      label: 'Personnel cost',
      data: personnelCosts,
      decimals: 2,
      isTotal: true,
      formula: personnelCosts.map((val, i) => createFormula(i,
        'FTE × Average Cost per FTE',
        [
          year => `Division FTE allocation based on RWA`,
          year => `Personnel Costs: ${formatNumber(val, 2)} €M`
        ]
      ))
    },

    // Product breakdown for Personnel
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.personnelCosts || [0,0,0,0,0],
      decimals: 2,
      indent: true
    })) : []),

    // ========== OTHER OPEX ==========
    {
      label: 'Other OPEX',
      data: otherOpex,
      decimals: 2,
      isTotal: true,
      formula: otherOpex.map((val, i) => createFormula(i,
        'Admin + Marketing + IT + HQ Allocation',
        [
          year => `Allocated based on division RWA share`,
          year => `Other OPEX: ${formatNumber(val, 2)} €M`
        ]
      ))
    },

    {
      label: 'Back-office and other admin costs',
      data: otherOpex.map(o => o * 0.4), // Approximate split
      decimals: 2,
      indent: true
    },

    {
      label: 'IT costs',
      data: otherOpex.map(o => o * 0.3), // Approximate split
      decimals: 2,
      indent: true
    },

    {
      label: 'HQ Allocation',
      data: otherOpex.map(o => o * 0.2), // Approximate split
      decimals: 2,
      indent: true
    },

    {
      label: 'Other Costs',
      data: otherOpex.map(o => o * 0.1), // Approximate split
      decimals: 2,
      indent: true
    },

    // ========== TOTAL OPEX ==========
    {
      label: 'Total OPEX',
      data: totalOpex,
      decimals: 2,
      isHeader: true,
      bgColor: 'gray',
      formula: totalOpex.map((val, i) => createFormula(i,
        'Personnel Costs + Other OPEX',
        [
          year => `Personnel: ${formatNumber(personnelCosts[year], 2)} €M`,
          year => `Other OPEX: ${formatNumber(otherOpex[year], 2)} €M`,
          year => `Total: ${formatNumber(val, 2)} €M`
        ],
        year => `${formatNumber(personnelCosts[year], 2)} + ${formatNumber(otherOpex[year], 2)} = ${formatNumber(val, 2)} €M`
      ))
    },

    // ========== OTHER COSTS SECTION ==========
    {
      label: 'Other Costs',
      data: [0,0,0,0,0],
      decimals: 2
    },

    {
      label: 'Loan loss provisions',
      data: divisionResults.pnl.totalLLP || [0,0,0,0,0],
      decimals: 2,
      indent: true,
      formula: (divisionResults.pnl.totalLLP || [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Expected Loss on New Business + NPL Provisions',
        [
          year => `Total LLP: ${formatNumber(val, 2)} €M`
        ]
      ))
    },

    // Product breakdown for LLP
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `  - o/w ${product.name}`,
      data: product.llp || [0,0,0,0,0],
      decimals: 2,
      indent: true,
      subIndent: true
    })) : []),

    {
      label: 'Provisions for liabilities and charges (TFR)',
      data: [0,0,0,0,0],
      decimals: 2,
      indent: true
    },

    // ========== PRE-TAX PROFIT ==========
    {
      label: 'Pre-tax profit',
      data: preTaxProfit,
      decimals: 2,
      isHeader: true,
      bgColor: 'gray',
      formula: preTaxProfit.map((val, i) => createFormula(i,
        'Total Revenues - Total OPEX - Other Costs',
        [
          year => `Revenues: ${formatNumber(totalRevenues[year], 2)} €M`,
          year => `OPEX: ${formatNumber(totalOpex[year], 2)} €M`,
          year => `LLP: ${formatNumber((divisionResults.pnl.totalLLP || [0,0,0,0,0])[year], 2)} €M`,
          year => `PBT: ${formatNumber(val, 2)} €M`
        ],
        year => {
          const llp = (divisionResults.pnl.totalLLP || [0,0,0,0,0])[year] || 0;
          return `${formatNumber(totalRevenues[year], 2)} - ${formatNumber(Math.abs(totalOpex[year]), 2)} - ${formatNumber(Math.abs(llp), 2)} = ${formatNumber(val, 2)} €M`;
        }
      ))
    }
  ];

  // Apply custom row transformations
  const transformedRows = pnlRows.map(row => {
    const transformation = customRowTransformations[row.label];
    if (transformation) {
      return { ...row, ...transformation };
    }
    return row;
  });

  return <FinancialTable title="1. P&L (€M)" rows={transformedRows} />;
};

export default StandardPnL;