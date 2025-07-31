import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../lib/utils/formatters';
import { createFormula, createAggregateFormula } from '../lib/utils/formulaHelpers';

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

  // Calculate derived values
  const performingAssets = divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0];
  const nonPerformingAssets = divisionResults.bs.nonPerformingAssets || [0,0,0,0,0,0,0,0,0,0];
  
  const totalAssets = performingAssets.map((pa, i) => 
    pa + nonPerformingAssets[i]
  );

  const allocatedEquity = divisionResults.bs.allocatedEquity || [0,0,0,0,0,0,0,0,0,0];
  const totalLiabilities = totalAssets.map((ta, i) => ta - allocatedEquity[i]);

  // Breakdown of liabilities using configured funding mix
  const fundingMix = assumptions.fundingMix || { sightDeposits: 40, termDeposits: 40, groupFunding: 20 };
  const sightDeposits = totalLiabilities.map(tl => tl * (fundingMix.sightDeposits / 100));
  const termDeposits = totalLiabilities.map(tl => tl * (fundingMix.termDeposits / 100));
  const groupFunding = totalLiabilities.map(tl => tl * (fundingMix.groupFunding / 100));

  // Balance Sheet Rows following the exact schema
  const balanceSheetRows = [
    // ========== ASSETS SECTION ==========
    {
      label: 'Total Assets',
      data: totalAssets,
      decimals: 0,
      isHeader: true,
      formula: totalAssets.map((val, i) => createFormula(
        i,
        'Net Performing + Non-Performing Assets',
        [
          {
            name: 'Net Performing Assets',
            value: performingAssets[i],
            unit: '€M',
            calculation: 'Sum of all performing loans'
          },
          {
            name: 'Non-Performing Assets',
            value: nonPerformingAssets[i],
            unit: '€M',
            calculation: 'Accumulated defaulted loans'
          }
        ],
        () => `${formatNumber(performingAssets[i], 0)} + ${formatNumber(nonPerformingAssets[i], 0)} = ${formatNumber(val, 0)} €M`
      ))
    },

    {
      label: 'Net Performing Assets',
      data: performingAssets,
      decimals: 0,
      isHeader: true,
      formula: performingAssets.map((val, i) => createAggregateFormula(
        i,
        'Net Performing Assets',
        Object.entries(productResults).map(([key, product]) => ({
          name: product.name,
          value: (product.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i],
          unit: '€M'
        }))
      )),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.performingAssets || [0,0,0,0,0,0,0,0,0,0],
        decimals: 0,
        formula: (product.performingAssets || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => createFormula(
          i,
          'Stock = Previous + New Business - Repayments - Defaults',
          [
            {
              name: 'Previous Stock',
              value: i > 0 ? (product.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i-1] || 0 : 0,
              unit: '€M',
              calculation: 'End of previous year balance'
            },
            {
              name: 'New Business',
              value: (product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
              unit: '€M',
              calculation: 'New loans originated this year'
            },
            {
              name: 'Repayments',
              value: (product.principalRepayments || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
              unit: '€M',
              calculation: 'Principal repaid according to amortization schedule'
            },
            {
              name: 'Defaults',
              value: i > 0 ? ((product.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i-1] || 0) * ((product.assumptions?.pd || 0.015)) : 0,
              unit: '€M',
              calculation: `Previous Stock × Default Rate (${formatNumber((product.assumptions?.pd || 0.015) * 100, 2)}%)`
            }
          ],
          () => {
            const prev = i > 0 ? (product.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i-1] || 0 : 0;
            const newBusiness = (product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
            const repayments = (product.principalRepayments || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
            const defaults = i > 0 ? prev * (product.assumptions?.pd || 0.015) : 0;
            return `${formatNumber(prev, 0)} + ${formatNumber(newBusiness, 0)} - ${formatNumber(repayments, 0)} - ${formatNumber(defaults, 0)} = ${formatNumber(val, 0)} €M`;
          }
        ))
      })) : []
    },

    {
      label: 'Non Performing Assets',
      data: nonPerformingAssets,
      decimals: 0,
      isHeader: true,
      formula: nonPerformingAssets.map((val, i) => createFormula(i,
        'Sum of NPL by product',
        [
          year => `Total NPL: ${formatNumber(val, 0)} €M`
        ]
      )),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.nonPerformingAssets || [0,0,0,0,0,0,0,0,0,0],
        decimals: 0,
        formula: (product.nonPerformingAssets || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
          createFormula(
            i,
            'Cumulative defaults from loan portfolio',
            [
              {
                name: 'NPL Stock',
                value: val,
                unit: '€M',
                calculation: 'Accumulated non-performing loans'
              }
            ],
            year => `Cumulative NPL stock: ${formatNumber(val, 0)} €M`
          )
        )
      })) : []
    },


    // ========== TOTAL ASSETS SUMMARY ==========
    {
      label: 'Total Assets',
      data: totalAssets,
      decimals: 0,
      isTotal: true,
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
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'lightgreen'
    },

    {
      label: 'Equity',
      data: allocatedEquity,
      decimals: 0,
      isSubItem: true,
      formula: allocatedEquity.map((val, i) => createFormula(
        i,
        'Total Bank Equity × (Division RWA / Total Bank RWA)',
        [
          {
            name: 'Total Bank Equity',
            value: globalResults.bs.equity[i],
            unit: '€M',
            calculation: 'Total bank regulatory capital'
          },
          {
            name: 'Division RWA',
            value: (divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i],
            unit: '€M',
            calculation: 'Risk-weighted assets for this division'
          },
          {
            name: 'Total Bank RWA',
            value: globalResults.capital.totalRWA[i],
            unit: '€M',
            calculation: 'Total bank risk-weighted assets'
          },
          {
            name: 'RWA Weight',
            value: ((divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i] / globalResults.capital.totalRWA[i]) * 100,
            unit: '%',
            calculation: 'Division\'s share of total RWA'
          }
        ],
        () => `${formatNumber(globalResults.bs.equity[i], 0)} × (${formatNumber((divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i], 0)} / ${formatNumber(globalResults.capital.totalRWA[i], 0)}) = ${formatNumber(val, 0)} €M`
      ))
    },

    {
      label: 'Sight deposits',
      data: sightDeposits,
      decimals: 0,
      isSubItem: true,
      formula: sightDeposits.map((val, i) => createFormula(
        i,
        'Total Liabilities × Sight Deposits %',
        [
          {
            name: 'Total Liabilities',
            value: totalLiabilities[i],
            unit: '€M',
            calculation: 'Total Assets - Equity'
          },
          {
            name: 'Sight Deposits %',
            value: 40,
            unit: '%',
            calculation: 'Funding mix assumption'
          }
        ],
        () => `${formatNumber(totalLiabilities[i], 0)} × 40% = ${formatNumber(val, 0)} €M`
      ))
    },

    {
      label: 'Term deposits - Open Banking Solutions',
      data: termDeposits,
      decimals: 0,
      isSubItem: true,
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
      isSubItem: true,
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
      isTotal: true,
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