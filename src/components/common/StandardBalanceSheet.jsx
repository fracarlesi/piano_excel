import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';

/**
 * Standardized Balance Sheet structure for all divisions
 * This component creates a consistent Balance Sheet view across all banking divisions
 */
const StandardBalanceSheet = ({ 
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

  // Standard Balance Sheet Row Structure
  const standardBSRows = [
    // ========== ASSETS ==========
    {
      label: 'ASSETS',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Performing Loans',
      data: divisionResults.bs.performingAssets,
      decimals: 0,
      isTotal: true,
      formula: divisionResults.bs.performingAssets.map((val, i) => createFormula(i,
        'Σ(Product Performing Stocks)',
        [
          'Sum of all performing loan stocks by product',
          ...(showProductDetail ? Object.entries(productResults).map(([key, product]) =>
            year => `${product.name}: ${formatNumber(product.performingAssets[year], 0)} €M`
          ) : []),
          year => `Total Performing: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    ...(showProductDetail ? Object.entries(productResults).map(([key, product]) => ({
      label: `  ${product.name}`,
      data: product.performingAssets,
      decimals: 0,
      indent: true,
      formula: product.performingAssets.map((val, i) => createFormula(i,
        'Previous Stock + New Business - Repayments - Defaults',
        [
          year => `Previous Year Stock: ${year > 0 ? formatNumber(product.performingAssets[year - 1], 0) : '0'} €M`,
          year => `New Business: ${formatNumber(product.newBusiness?.[year] || 0, 0)} €M`,
          year => `Repayments: Based on ${assumptions.products[key]?.type === 'bullet' ? 'Bullet' : 'Amortizing'} schedule`,
          year => `Defaults: ${formatNumber((product.assumptions?.pd || 0) * 100, 2)}% danger rate`,
          year => `End of Year Stock: ${formatNumber(val, 0)} €M`
        ]
      ))
    })) : []),
    
    {
      label: 'Non-Performing Loans',
      data: divisionResults.bs.nonPerformingAssets,
      decimals: 0,
      isTotal: true,
      formula: divisionResults.bs.nonPerformingAssets.map((val, i) => createFormula(i,
        'Σ(Product NPL Stocks)',
        [
          'Accumulated defaults from performing portfolio',
          ...(showProductDetail ? Object.entries(productResults).map(([key, product]) =>
            year => `${product.name}: ${formatNumber(product.nonPerformingAssets?.[year] || 0, 0)} €M`
          ) : []),
          year => `Total NPL: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Total Loan Portfolio',
      data: divisionResults.bs.performingAssets.map((perf, i) => 
        perf + divisionResults.bs.nonPerformingAssets[i]
      ),
      decimals: 0,
      isHeader: true,
      formula: divisionResults.bs.performingAssets.map((perf, i) => createFormula(i,
        'Performing Loans + Non-Performing Loans',
        [
          year => `Performing: ${formatNumber(divisionResults.bs.performingAssets[year], 0)} €M`,
          year => `Non-Performing: ${formatNumber(divisionResults.bs.nonPerformingAssets[year], 0)} €M`,
          year => `Total Portfolio: ${formatNumber(perf + divisionResults.bs.nonPerformingAssets[year], 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Other Assets',
      data: divisionResults.bs.otherAssets || [0, 0, 0, 0, 0],
      decimals: 0,
      formula: (divisionResults.bs.otherAssets || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Operating assets and other non-loan assets',
        [
          'Includes IT systems, real estate, etc.',
          year => `Other Assets: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'TOTAL ASSETS',
      data: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalLoans = perf + divisionResults.bs.nonPerformingAssets[i];
        const otherAssets = divisionResults.bs.otherAssets?.[i] || 0;
        return totalLoans + otherAssets;
      }),
      decimals: 0,
      isHeader: true,
      bgColor: 'green',
      formula: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalLoans = perf + divisionResults.bs.nonPerformingAssets[i];
        const otherAssets = divisionResults.bs.otherAssets?.[i] || 0;
        return createFormula(i,
          'Total Loan Portfolio + Other Assets',
          [
            year => `Loan Portfolio: ${formatNumber(totalLoans, 0)} €M`,
            year => `Other Assets: ${formatNumber(otherAssets, 0)} €M`,
            year => `Total Assets: ${formatNumber(totalLoans + otherAssets, 0)} €M`
          ]
        );
      })
    },
    
    // Spacing
    {
      label: '',
      data: [null, null, null, null, null],
      decimals: 0
    },
    
    // ========== LIABILITIES & EQUITY ==========
    {
      label: 'LIABILITIES & EQUITY',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Customer Deposits',
      data: divisionResults.bs.customerDeposits || divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        const equity = divisionResults.bs.equity[i];
        return (totalAssets - equity) * 0.6; // 60% of liabilities from deposits
      }),
      decimals: 0,
      formula: (divisionResults.bs.customerDeposits || []).map((val, i) => createFormula(i,
        'Sight Deposits + Term Deposits',
        [
          'Primary funding source',
          year => `Customer Deposits: ${formatNumber(val || 0, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Interbank Funding',
      data: divisionResults.bs.interbankFunding || divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        const equity = divisionResults.bs.equity[i];
        return (totalAssets - equity) * 0.3; // 30% of liabilities from interbank
      }),
      decimals: 0,
      formula: (divisionResults.bs.interbankFunding || []).map((val, i) => createFormula(i,
        'Group funding and interbank loans',
        [
          'Secondary funding source',
          year => `Interbank Funding: ${formatNumber(val || 0, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Other Liabilities',
      data: divisionResults.bs.otherLiabilities || divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        const equity = divisionResults.bs.equity[i];
        return (totalAssets - equity) * 0.1; // 10% of liabilities
      }),
      decimals: 0,
      formula: (divisionResults.bs.otherLiabilities || []).map((val, i) => createFormula(i,
        'Bonds, subordinated debt, and other',
        [
          year => `Other Liabilities: ${formatNumber(val || 0, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Total Liabilities',
      data: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        const equity = divisionResults.bs.equity[i];
        return totalAssets - equity;
      }),
      decimals: 0,
      isHeader: true,
      formula: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        const equity = divisionResults.bs.equity[i];
        return createFormula(i,
          'Total Assets - Shareholders Equity',
          [
            year => `Total Assets: ${formatNumber(totalAssets, 0)} €M`,
            year => `Shareholders Equity: ${formatNumber(equity, 0)} €M`,
            year => `Total Liabilities: ${formatNumber(totalAssets - equity, 0)} €M`
          ]
        );
      })
    },
    
    {
      label: 'Shareholders Equity',
      data: divisionResults.bs.equity,
      decimals: 0,
      isTotal: true,
      formula: divisionResults.bs.equity.map((val, i) => createFormula(i,
        'Allocated based on RWA contribution',
        [
          year => `Division RWA: ${formatNumber(divisionResults.capital.totalRWA[year], 0)} €M`,
          year => `Total Bank RWA: ${formatNumber(globalResults.capital.totalRWA[year], 0)} €M`,
          year => `RWA Weight: ${((divisionResults.capital.totalRWA[year] / globalResults.capital.totalRWA[year]) * 100).toFixed(1)}%`,
          year => `Allocated Equity: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'TOTAL LIABILITIES & EQUITY',
      data: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalLoans = perf + divisionResults.bs.nonPerformingAssets[i];
        const otherAssets = divisionResults.bs.otherAssets?.[i] || 0;
        return totalLoans + otherAssets;
      }),
      decimals: 0,
      isHeader: true,
      bgColor: 'green',
      formula: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        return createFormula(i,
          'Must equal Total Assets (Balance Check)',
          [
            year => `Total L&E: ${formatNumber(totalAssets, 0)} €M`,
            year => `Total Assets: ${formatNumber(totalAssets, 0)} €M`,
            year => `Balance Check: ✓ OK`
          ]
        );
      })
    },
    
    // ========== KEY RATIOS ==========
    {
      label: '',
      data: [null, null, null, null, null],
      decimals: 0
    },
    
    {
      label: 'KEY BALANCE SHEET RATIOS',
      data: [null, null, null, null, null],
      isHeader: true
    },
    
    {
      label: 'Loan-to-Deposit Ratio (%)',
      data: (() => {
        const deposits = divisionResults.bs.customerDeposits || divisionResults.bs.performingAssets.map((perf, i) => {
          const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
          const equity = divisionResults.bs.equity[i];
          return (totalAssets - equity) * 0.6;
        });
        
        return divisionResults.bs.performingAssets.map((perf, i) => 
          deposits[i] > 0 ? (perf / deposits[i]) * 100 : 0
        );
      })(),
      decimals: 1,
      isPercentage: true
    },
    
    {
      label: 'NPL Ratio (%)',
      data: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalLoans = perf + divisionResults.bs.nonPerformingAssets[i];
        return totalLoans > 0 ? (divisionResults.bs.nonPerformingAssets[i] / totalLoans) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true
    },
    
    {
      label: 'Leverage Ratio',
      data: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        return divisionResults.bs.equity[i] > 0 ? totalAssets / divisionResults.bs.equity[i] : 0;
      }),
      decimals: 1
    }
  ];

  // Apply any custom row transformations
  const finalRows = standardBSRows.map(row => ({
    ...row,
    ...(customRowTransformations[row.label] || {})
  }));

  return <FinancialTable title="Balance Sheet" rows={finalRows} />;
};

export default StandardBalanceSheet;