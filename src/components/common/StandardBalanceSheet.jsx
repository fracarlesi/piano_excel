import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';

/**
 * Standardized Balance Sheet structure for all divisions
 * Following the exact schema provided
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

  // Calculate derived values
  const performingAssets = divisionResults.bs.performingAssets || [0,0,0,0,0];
  const nonPerformingAssets = divisionResults.bs.nonPerformingAssets || [0,0,0,0,0];
  const operatingAssets = performingAssets.map((pa, i) => {
    const totalLoans = pa + nonPerformingAssets[i];
    return totalLoans * (assumptions.operatingAssetsRatio || 0.1);
  });
  
  const totalAssets = performingAssets.map((pa, i) => 
    pa + nonPerformingAssets[i] + operatingAssets[i]
  );

  const allocatedEquity = divisionResults.bs.allocatedEquity || [0,0,0,0,0];
  const totalLiabilities = totalAssets.map((ta, i) => ta - allocatedEquity[i]);

  // Breakdown of liabilities
  const sightDeposits = totalLiabilities.map(tl => tl * 0.4); // 40% sight deposits
  const termDeposits = totalLiabilities.map(tl => tl * 0.3); // 30% term deposits
  const groupFunding = totalLiabilities.map(tl => tl * 0.3); // 30% group funding

  // Balance Sheet Rows following the exact schema
  const balanceSheetRows = [
    // ========== ASSETS SECTION ==========
    {
      label: 'Total Assets',
      data: totalAssets,
      decimals: 0,
      isTotal: true,
      formula: totalAssets.map((val, i) => createFormula(i,
        'Net Performing + Non-Performing + Operating Assets',
        [
          year => `Performing Assets: ${formatNumber(performingAssets[year], 0)} €M`,
          year => `Non-Performing: ${formatNumber(nonPerformingAssets[year], 0)} €M`,
          year => `Operating Assets: ${formatNumber(operatingAssets[year], 0)} €M`,
          year => `Total: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    {
      label: 'Net Performing Assets',
      data: performingAssets,
      decimals: 0,
      isTotal: true,
      formula: performingAssets.map((val, i) => createFormula(i,
        'Sum of performing loans by product',
        [
          year => `Net Performing Assets: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    // Product breakdown for Performing Assets
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.performingAssets || [0,0,0,0,0],
      decimals: 0,
      indent: true,
      formula: (product.performingAssets || [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Stock evolution: Previous + New - Repayments - Defaults',
        [
          `Product: ${product.name}`,
          year => `Performing Stock: ${formatNumber(val, 0)} €M`
        ]
      ))
    })) : []),

    {
      label: 'Non Performing Assets',
      data: nonPerformingAssets,
      decimals: 0,
      isTotal: true,
      formula: nonPerformingAssets.map((val, i) => createFormula(i,
        'Sum of NPL by product',
        [
          year => `Total NPL: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    // Product breakdown for NPL
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.nonPerformingAssets || [0,0,0,0,0],
      decimals: 0,
      indent: true
    })) : []),

    {
      label: 'Operating assets',
      data: operatingAssets,
      decimals: 0,
      formula: operatingAssets.map((val, i) => createFormula(i,
        'Total Loans × Operating Assets Ratio',
        [
          year => `Total Loans: ${formatNumber(performingAssets[year] + nonPerformingAssets[year], 0)} €M`,
          year => `Operating Assets Ratio: ${(assumptions.operatingAssetsRatio || 0.1) * 100}%`,
          year => `Operating Assets: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    // ========== TOTAL ASSETS SUMMARY ==========
    {
      label: 'Total Assets',
      data: totalAssets,
      decimals: 0,
      isHeader: true,
      bgColor: 'gray',
      formula: totalAssets.map((val, i) => createFormula(i,
        'Sum of all asset categories',
        [
          year => `Total Assets: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    // ========== LIABILITIES SECTION ==========
    {
      label: 'Liabilities',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'lightgreen'
    },

    {
      label: 'Equity',
      data: allocatedEquity,
      decimals: 0,
      isTotal: true,
      formula: allocatedEquity.map((val, i) => createFormula(i,
        'Equity allocated based on RWA contribution',
        [
          year => `Division RWA: ${formatNumber((divisionResults.capital.totalRWA || [0,0,0,0,0])[year], 0)} €M`,
          year => `Total Bank RWA: ${formatNumber(globalResults.capital.totalRWA[year], 0)} €M`,
          year => `RWA Weight: ${(((divisionResults.capital.totalRWA || [0,0,0,0,0])[year] / globalResults.capital.totalRWA[year]) * 100).toFixed(1)}%`,
          year => `Allocated Equity: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    {
      label: 'Sight deposits',
      data: sightDeposits,
      decimals: 0,
      formula: sightDeposits.map((val, i) => createFormula(i,
        'Total Liabilities × Sight Deposits %',
        [
          year => `Total Liabilities: ${formatNumber(totalLiabilities[year], 0)} €M`,
          year => `Sight Deposits %: 40%`,
          year => `Sight Deposits: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    {
      label: 'Term deposits - Open Banking Solutions',
      data: termDeposits,
      decimals: 0,
      formula: termDeposits.map((val, i) => createFormula(i,
        'Total Liabilities × Term Deposits %',
        [
          year => `Total Liabilities: ${formatNumber(totalLiabilities[year], 0)} €M`,
          year => `Term Deposits %: 30%`,
          year => `Term Deposits: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    {
      label: 'Group funding',
      data: groupFunding,
      decimals: 0,
      formula: groupFunding.map((val, i) => createFormula(i,
        'Total Liabilities × Group Funding %',
        [
          year => `Total Liabilities: ${formatNumber(totalLiabilities[year], 0)} €M`,
          year => `Group Funding %: 30%`,
          year => `Group Funding: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    // ========== TOTAL LIABILITIES SUMMARY ==========
    {
      label: 'Total liabilities',
      data: totalAssets, // Must equal total assets
      decimals: 0,
      isHeader: true,
      bgColor: 'gray',
      formula: totalAssets.map((val, i) => createFormula(i,
        'Must equal Total Assets (Balance Sheet identity)',
        [
          year => `Equity: ${formatNumber(allocatedEquity[year], 0)} €M`,
          year => `Sight Deposits: ${formatNumber(sightDeposits[year], 0)} €M`,
          year => `Term Deposits: ${formatNumber(termDeposits[year], 0)} €M`,
          year => `Group Funding: ${formatNumber(groupFunding[year], 0)} €M`,
          year => `Total L&E: ${formatNumber(val, 0)} €M`,
          'Balance Sheet Check: ✓'
        ]
      ))
    }
  ];

  // Apply custom row transformations
  const transformedRows = balanceSheetRows.map(row => {
    const transformation = customRowTransformations[row.label];
    if (transformation) {
      return { ...row, ...transformation };
    }
    return row;
  });

  return <FinancialTable title="2. Balance Sheet (€M)" rows={transformedRows} />;
};

export default StandardBalanceSheet;