import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';

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
  
  // Helper function to create formula explanations with numerical calculations
  const createFormula = (year, formula, details, calculation = null) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d),
    calculation: typeof calculation === 'function' ? calculation(year) : calculation
  });

  // Calculate derived values
  const totalRWA = divisionResults.capital.totalRWA || [0,0,0,0,0];
  const allocatedEquity = divisionResults.bs.allocatedEquity || [0,0,0,0,0];
  
  // Calculate CET1 ratio
  const cet1Ratio = totalRWA.map((rwa, i) => 
    rwa > 0 ? (allocatedEquity[i] / rwa) * 100 : 0
  );

  // RWA breakdown by risk type
  const creditRiskRWA = divisionResults.capital.rwaCreditRisk || totalRWA.map(rwa => rwa * 0.85);
  const operationalRiskRWA = totalRWA.map(rwa => rwa * 0.10);
  const marketRiskRWA = totalRWA.map(rwa => rwa * 0.05);

  // Capital Requirements Rows following the exact schema
  const capitalRows = [
    // ========== RWA SECTION ==========
    {
      label: 'RWA',
      data: totalRWA,
      decimals: 0,
      isTotal: true,
      formula: totalRWA.map((val, i) => createFormula(i,
        'Credit Risk + Operational Risk + Market Risk RWA',
        [
          year => `Credit Risk RWA: ${formatNumber(creditRiskRWA[year], 0)} €M`,
          year => `Operational Risk RWA: ${formatNumber(operationalRiskRWA[year], 0)} €M`,
          year => `Market Risk RWA: ${formatNumber(marketRiskRWA[year], 0)} €M`,
          year => `Total RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    // Product breakdown for RWA
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.rwa || [0,0,0,0,0],
      decimals: 0,
      indent: true,
      formula: (product.rwa || [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Performing Assets × RWA Density',
        [
          `Product: ${product.name}`,
          year => `Performing Assets: ${formatNumber((product.performingAssets || [0,0,0,0,0])[year], 0)} €M`,
          year => `RWA Density: ${((product.assumptions?.riskWeight || 0.75) * 100).toFixed(0)}%`,
          year => `Product RWA: ${formatNumber(val, 0)} €M`
        ],
        year => {
          const assets = (product.performingAssets || [0,0,0,0,0])[year] || 0;
          const density = (product.assumptions?.riskWeight || 0.75) * 100;
          return `${formatNumber(assets, 0)} × ${density.toFixed(0)}% = ${formatNumber(val, 0)} €M`;
        }
      ))
    })) : []),

    // ========== EQUITY SECTION ==========
    {
      label: 'Equity',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'lightblue'
    },

    // Product breakdown for Equity
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: product.allocatedEquity || [0,0,0,0,0],
      decimals: 0,
      indent: true,
      formula: (product.allocatedEquity || [0,0,0,0,0]).map((val, i) => createFormula(i,
        'Total Division Equity × (Product RWA / Division RWA)',
        [
          `Product: ${product.name}`,
          year => `Product RWA: ${formatNumber((product.rwa || [0,0,0,0,0])[year], 0)} €M`,
          year => `Division RWA: ${formatNumber(totalRWA[year], 0)} €M`,
          year => `RWA Weight: ${totalRWA[year] > 0 ? (((product.rwa || [0,0,0,0,0])[year] / totalRWA[year]) * 100).toFixed(1) : 0}%`,
          year => `Allocated Equity: ${formatNumber(val, 0)} €M`
        ]
      ))
    })) : []),

    {
      label: '- o/w operating assets',
      data: allocatedEquity.map((equity, i) => {
        const operatingRWA = operationalRiskRWA[i];
        const totalDivisionRWA = totalRWA[i];
        return totalDivisionRWA > 0 ? equity * (operatingRWA / totalDivisionRWA) : 0;
      }),
      decimals: 0,
      indent: true,
      formula: allocatedEquity.map((equity, i) => createFormula(i,
        'Division Equity × (Operating RWA / Total RWA)',
        [
          year => `Division Equity: ${formatNumber(equity, 0)} €M`,
          year => `Operating RWA: ${formatNumber(operationalRiskRWA[year], 0)} €M`,
          year => `Total RWA: ${formatNumber(totalRWA[year], 0)} €M`,
          year => `Operating Equity: ${formatNumber(totalRWA[year] > 0 ? equity * (operationalRiskRWA[year] / totalRWA[year]) : 0, 0)} €M`
        ]
      ))
    },

    // ========== CET1 RATIO SECTION ==========
    {
      label: 'CET1 (%)',
      data: cet1Ratio,
      decimals: 1,
      unit: '%',
      isTotal: true,
      formula: cet1Ratio.map((val, i) => createFormula(i,
        'Allocated Equity / Total RWA × 100',
        [
          year => `Allocated Equity: ${formatNumber(allocatedEquity[year], 0)} €M`,
          year => `Total RWA: ${formatNumber(totalRWA[year], 0)} €M`,
          year => `CET1 Ratio: ${formatNumber(val, 1)}%`,
          'Regulatory minimum: 4.5% + buffers'
        ],
        year => totalRWA[year] > 0 ? `${formatNumber(allocatedEquity[year], 0)} ÷ ${formatNumber(totalRWA[year], 0)} × 100 = ${formatNumber(val, 1)}%` : '0 ÷ 0 = 0%'
      ))
    },

    // Product breakdown for CET1
    ...(showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
      label: `- o/w ${product.name}`,
      data: (product.allocatedEquity || [0,0,0,0,0]).map((equity, i) => {
        const productRWA = (product.rwa || [0,0,0,0,0])[i];
        return productRWA > 0 ? (equity / productRWA) * 100 : 0;
      }),
      decimals: 1,
      unit: '%',
      indent: true,
      formula: (product.allocatedEquity || [0,0,0,0,0]).map((equity, i) => createFormula(i,
        'Product Equity / Product RWA × 100',
        [
          `Product: ${product.name}`,
          year => `Product Equity: ${formatNumber(equity, 0)} €M`,
          year => `Product RWA: ${formatNumber((product.rwa || [0,0,0,0,0])[year], 0)} €M`,
          year => `Product CET1: ${formatNumber((product.rwa || [0,0,0,0,0])[year] > 0 ? (equity / (product.rwa || [0,0,0,0,0])[year]) * 100 : 0, 1)}%`
        ]
      ))
    })) : []),

    // ========== RWA BY RISK TYPE SECTION ==========
    {
      label: 'RWA by risk type',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'lightgray'
    },

    {
      label: '- o/w Credit Risk',
      data: creditRiskRWA,
      decimals: 0,
      indent: true,
      formula: creditRiskRWA.map((val, i) => createFormula(i,
        'Sum of Credit RWA from all products',
        [
          year => `Credit Risk RWA: ${formatNumber(val, 0)} €M`,
          year => `% of Total RWA: ${totalRWA[year] > 0 ? ((val / totalRWA[year]) * 100).toFixed(1) : 0}%`
        ]
      ))
    },

    {
      label: '- o/w Operative risk',
      data: operationalRiskRWA,
      decimals: 0,
      indent: true,
      formula: operationalRiskRWA.map((val, i) => createFormula(i,
        'Total Assets × Operational Risk %',
        [
          year => `Operational Risk RWA: ${formatNumber(val, 0)} €M`,
          year => `% of Total RWA: ${totalRWA[year] > 0 ? ((val / totalRWA[year]) * 100).toFixed(1) : 0}%`,
          'Basel standardized approach: ~10% of total assets'
        ]
      ))
    },

    {
      label: '- o/w Market risk',
      data: marketRiskRWA,
      decimals: 0,
      indent: true,
      formula: marketRiskRWA.map((val, i) => createFormula(i,
        'Market Risk RWA (minimal for banking book)',
        [
          year => `Market Risk RWA: ${formatNumber(val, 0)} €M`,
          year => `% of Total RWA: ${totalRWA[year] > 0 ? ((val / totalRWA[year]) * 100).toFixed(1) : 0}%`,
          'Banking book focus: minimal trading book exposure'
        ]
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