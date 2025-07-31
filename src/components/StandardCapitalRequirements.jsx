import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../lib/utils/formatters';
import { createFormula } from '../lib/utils/formulaHelpers';

/**
 * Standardized Capital Requirements structure for all divisions
 * Following the exact schema provided
 */
const StandardCapitalRequirements = ({ 
  divisionResults, 
  productResults, 
  assumptions, 
  globalResults,
  divisionName,
  showProductDetail = true,
  customRowTransformations = {}
}) => {

  // Calculate derived values
  const totalRWA = divisionResults?.capital?.totalRWA || [0,0,0,0,0,0,0,0,0,0];
  const allocatedEquity = divisionResults?.bs?.allocatedEquity || [0,0,0,0,0,0,0,0,0,0];
  
  // Calculate CET1 ratio
  const cet1Ratio = totalRWA.map((rwa, i) => 
    rwa > 0 ? (allocatedEquity[i] / rwa) * 100 : 0
  );

  // RWA breakdown by risk type
  const creditRiskRWA = divisionResults?.capital?.rwaCreditRisk || totalRWA.map(rwa => rwa * 0.85);
  const operationalRiskRWA = totalRWA.map(rwa => rwa * 0.10);
  const marketRiskRWA = totalRWA.map(rwa => rwa * 0.05);

  // Capital Requirements Rows following the exact schema
  const capitalRows = [
    // ========== RWA SECTION ==========
    {
      label: 'RWA',
      data: totalRWA,
      decimals: 0,
      isHeader: true,
      formula: totalRWA.map((val, i) => createFormula(i,
        'Credit Risk + Operational Risk + Market Risk RWA',
        [
          {
            name: 'Credit Risk RWA',
            value: creditRiskRWA[i],
            unit: '€M',
            calculation: 'RWA from credit exposures (~85% of total)'
          },
          {
            name: 'Operational Risk RWA',
            value: operationalRiskRWA[i],
            unit: '€M',
            calculation: 'RWA from operational risks (~10% of total)'
          },
          {
            name: 'Market Risk RWA',
            value: marketRiskRWA[i],
            unit: '€M',
            calculation: 'RWA from market risks (~5% of total)'
          }
        ],
        () => `${formatNumber(creditRiskRWA[i], 0)} + ${formatNumber(operationalRiskRWA[i], 0)} + ${formatNumber(marketRiskRWA[i], 0)} = ${formatNumber(val, 0)} €M`
      )),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.rwa || [0,0,0,0,0,0,0,0,0,0],
        decimals: 0,
        formula: (product.rwa || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => createFormula(i,
          'Performing Assets × RWA Density',
          [
            {
              name: 'Performing Assets',
              value: (product.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M',
              calculation: `${product.name} outstanding loans`
            },
            {
              name: 'RWA Density',
              value: (product.assumptions?.riskWeight || 0.75) * 100,
              unit: '%',
              calculation: 'Risk weight for this product type'
            }
          ],
          () => {
            const assets = (product.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
            const density = (product.assumptions?.riskWeight || 0.75) * 100;
            return `${formatNumber(assets, 0)} × ${density.toFixed(0)}% = ${formatNumber(val, 0)} €M`;
          }
        ))
      })) : []
    },

    // ========== EQUITY SECTION ==========
    {
      label: 'Equity',
      data: allocatedEquity,
      decimals: 0,
      isHeader: true,
      bgColor: 'lightblue',
      // Add breakdown as subRows
      subRows: showProductDetail ? [
        ...Object.entries(productResults).map(([key, product], index) => ({
          label: `o/w ${product.name}`,
          data: product.allocatedEquity || [0,0,0,0,0,0,0,0,0,0],
          decimals: 0,
          formula: (product.allocatedEquity || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => createFormula(i,
            'Total Division Equity × (Product RWA / Division RWA)',
            [
              {
                name: 'Division Equity',
                value: allocatedEquity[i],
                unit: '€M',
                calculation: 'Total equity allocated to division'
              },
              {
                name: 'Product RWA',
                value: (product.rwa || [0,0,0,0,0,0,0,0,0,0])[i],
                unit: '€M',
                calculation: `RWA for ${product.name}`
              },
              {
                name: 'Division RWA',
                value: totalRWA[i],
                unit: '€M',
                calculation: 'Total division risk-weighted assets'
              },
              {
                name: 'RWA Weight',
                value: totalRWA[i] > 0 ? ((product.rwa || [0,0,0,0,0,0,0,0,0,0])[i] / totalRWA[i]) * 100 : 0,
                unit: '%',
                calculation: 'Product share of division RWA'
              }
            ],
            () => {
              const prodRwa = (product.rwa || [0,0,0,0,0,0,0,0,0,0])[i];
              const weight = totalRWA[i] > 0 ? (prodRwa / totalRWA[i]) : 0;
              return `${formatNumber(allocatedEquity[i], 0)} × ${formatNumber(weight * 100, 1)}% = ${formatNumber(val, 0)} €M`;
            }
          ))
        })),
        {
          label: 'Operating assets',
          data: allocatedEquity.map((equity, i) => {
            const operatingRWA = operationalRiskRWA[i];
            const totalDivisionRWA = totalRWA[i];
            return totalDivisionRWA > 0 ? equity * (operatingRWA / totalDivisionRWA) : 0;
          }),
          decimals: 0,
          formula: allocatedEquity.map((equity, i) => createFormula(i,
            'Division Equity × (Operating RWA / Total RWA)',
            [
              {
                name: 'Division Equity',
                value: equity,
                unit: '€M',
                calculation: 'Total equity allocated to division'
              },
              {
                name: 'Operational Risk RWA',
                value: operationalRiskRWA[i],
                unit: '€M',
                calculation: 'RWA for operational risks'
              },
              {
                name: 'Total RWA',
                value: totalRWA[i],
                unit: '€M',
                calculation: 'Total division risk-weighted assets'
              }
            ],
            () => {
              const weight = totalRWA[i] > 0 ? (operationalRiskRWA[i] / totalRWA[i]) : 0;
              const result = equity * weight;
              return `${formatNumber(equity, 0)} × ${formatNumber(weight * 100, 1)}% = ${formatNumber(result, 0)} €M`;
            }
          ))
        }
      ] : []
    },

    // ========== CET1 RATIO SECTION ==========
    {
      label: 'CET1 (%)',
      data: cet1Ratio,
      decimals: 1,
      unit: '%',
      isSubTotal: true,
      formula: cet1Ratio.map((val, i) => createFormula(i,
        'Allocated Equity / Total RWA × 100',
        [
          {
            name: 'Allocated Equity',
            value: allocatedEquity[i],
            unit: '€M',
            calculation: 'CET1 capital allocated to division'
          },
          {
            name: 'Total RWA',
            value: totalRWA[i],
            unit: '€M',
            calculation: 'Total risk-weighted assets'
          },
          {
            name: 'CET1 Ratio',
            value: val,
            unit: '%',
            calculation: 'Regulatory minimum: 4.5% + buffers'
          }
        ],
        () => totalRWA[i] > 0 ? `${formatNumber(allocatedEquity[i], 0)} ÷ ${formatNumber(totalRWA[i], 0)} × 100 = ${formatNumber(val, 1)}%` : '0 ÷ 0 = 0%'
      )),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: (product.allocatedEquity || [0,0,0,0,0,0,0,0,0,0]).map((equity, i) => {
          const productRWA = (product.rwa || [0,0,0,0,0,0,0,0,0,0])[i];
          return productRWA > 0 ? (equity / productRWA) * 100 : 0;
        }),
        decimals: 1,
        unit: '%',
        formula: (product.allocatedEquity || [0,0,0,0,0,0,0,0,0,0]).map((equity, i) => {
          const productRWA = (product.rwa || [0,0,0,0,0,0,0,0,0,0])[i];
          const productCET1 = productRWA > 0 ? (equity / productRWA) * 100 : 0;
          return createFormula(i,
            'Product Equity / Product RWA × 100',
            [
              {
                name: 'Product Equity',
                value: equity,
                unit: '€M',
                calculation: `Equity allocated to ${product.name}`
              },
              {
                name: 'Product RWA',
                value: productRWA,
                unit: '€M',
                calculation: `Risk-weighted assets for ${product.name}`
              },
              {
                name: 'Product CET1',
                value: productCET1,
                unit: '%',
                calculation: 'Product-level capital ratio'
              }
            ],
            () => productRWA > 0 ? `${formatNumber(equity, 0)} ÷ ${formatNumber(productRWA, 0)} × 100 = ${formatNumber(productCET1, 1)}%` : '0 ÷ 0 = 0%'
          );
        })
      })) : []
    },

    // ========== RWA BY RISK TYPE SECTION ==========
    {
      label: 'RWA by risk type',
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'lightgray'
    },

    {
      label: 'Credit Risk',
      data: creditRiskRWA,
      decimals: 0,
      isSubItem: true,
      formula: creditRiskRWA.map((val, i) => createFormula(i,
        'Sum of Credit RWA from all products',
        [
          {
            name: 'Credit Risk RWA',
            value: val,
            unit: '€M',
            calculation: 'Sum of all product-level credit RWA'
          },
          {
            name: '% of Total RWA',
            value: totalRWA[i] > 0 ? (val / totalRWA[i]) * 100 : 0,
            unit: '%',
            calculation: 'Typically ~85% for lending-focused divisions'
          }
        ],
        () => `Credit Risk RWA: ${formatNumber(val, 0)} €M (${totalRWA[i] > 0 ? ((val / totalRWA[i]) * 100).toFixed(1) : 0}% of total)`
      ))
    },

    {
      label: 'Operative risk',
      data: operationalRiskRWA,
      decimals: 0,
      isSubItem: true,
      formula: operationalRiskRWA.map((val, i) => createFormula(i,
        'Total Assets × Operational Risk %',
        [
          {
            name: 'Operational Risk RWA',
            value: val,
            unit: '€M',
            calculation: 'Basel standardized approach'
          },
          {
            name: '% of Total RWA',
            value: totalRWA[i] > 0 ? (val / totalRWA[i]) * 100 : 0,
            unit: '%',
            calculation: 'Typically ~10% of total RWA'
          }
        ],
        () => `Operational Risk RWA: ${formatNumber(val, 0)} €M (${totalRWA[i] > 0 ? ((val / totalRWA[i]) * 100).toFixed(1) : 0}% of total)`
      ))
    },

    {
      label: 'Market risk',
      data: marketRiskRWA,
      decimals: 0,
      isSubItem: true,
      formula: marketRiskRWA.map((val, i) => createFormula(i,
        'Market Risk RWA (minimal for banking book)',
        [
          {
            name: 'Market Risk RWA',
            value: val,
            unit: '€M',
            calculation: 'Minimal for banking book focus'
          },
          {
            name: '% of Total RWA',
            value: totalRWA[i] > 0 ? (val / totalRWA[i]) * 100 : 0,
            unit: '%',
            calculation: 'Typically ~5% for banking book'
          }
        ],
        () => `Market Risk RWA: ${formatNumber(val, 0)} €M (${totalRWA[i] > 0 ? ((val / totalRWA[i]) * 100).toFixed(1) : 0}% of total)`
      ))
    }
  ];

  // Apply custom row transformations
  const transformedRows = capitalRows.map(row => {
    const transformation = customRowTransformations[row.label];
    if (transformation) {
      return { ...row, ...transformation };
    }
    return row;
  });

  return <FinancialTable title="3. Requisiti di capitale" rows={transformedRows} />;
};

export default StandardCapitalRequirements;