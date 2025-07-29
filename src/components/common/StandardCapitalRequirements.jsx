import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';

/**
 * Standardized Capital Requirements structure for all divisions
 * This component creates a consistent Capital Requirements view across all banking divisions
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
  
  // Helper function to create formula explanations
  const createFormula = (year, formula, details) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d)
  });

  // Standard Capital Requirements Row Structure
  const standardCapitalRows = [
    // ========== RISK WEIGHTED ASSETS ==========
    {
      label: 'RISK WEIGHTED ASSETS',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Credit Risk RWA',
      data: divisionResults.capital.rwaCreditRisk,
      decimals: 0,
      isTotal: true,
      formula: divisionResults.capital.rwaCreditRisk.map((val, i) => createFormula(i,
        'Σ(Product Exposures × Risk Weights)',
        [
          'Basel III standardized approach for credit risk',
          ...(showProductDetail ? Object.entries(productResults).map(([key, product]) =>
            year => `${product.name}: ${formatNumber(product.performingAssets[year] + (product.nonPerformingAssets?.[year] || 0), 0)} × ${formatNumber((product.assumptions?.riskWeight || 0) * 100, 0)}% = ${formatNumber(product.rwa?.[year] || 0, 0)}`
          ) : []),
          year => `Total Credit RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    ...(showProductDetail ? Object.entries(productResults).map(([key, product]) => ({
      label: `  ${product.name}`,
      data: product.rwa || [0, 0, 0, 0, 0],
      decimals: 0,
      indent: true,
      formula: (product.rwa || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Exposure × Risk Weight',
        [
          year => `Exposure: ${formatNumber(product.performingAssets[year] + (product.nonPerformingAssets?.[year] || 0), 0)} €M`,
          year => `Risk Weight: ${formatNumber((product.assumptions?.riskWeight || 0) * 100, 0)}%`,
          year => `Product Type: ${assumptions.products[key]?.type || 'Standard'}`,
          year => `RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    })) : []),
    
    {
      label: 'Operational Risk RWA',
      data: divisionResults.capital.rwaOperationalRisk || divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        const operationalRiskWeight = 0.15; // 15% of total assets as proxy
        return totalAssets * operationalRiskWeight;
      }),
      decimals: 0,
      formula: (divisionResults.capital.rwaOperationalRisk || []).map((val, i) => createFormula(i,
        'Basic Indicator Approach',
        [
          'Based on average gross income over 3 years',
          year => `Division Assets: ${formatNumber(divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year], 0)} €M`,
          year => `Operational Risk Factor: 15%`,
          year => `Operational Risk RWA: ${formatNumber(val || 0, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Market Risk RWA',
      data: divisionResults.capital.rwaMarketRisk || [0, 0, 0, 0, 0],
      decimals: 0,
      formula: (divisionResults.capital.rwaMarketRisk || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Trading book positions',
        [
          `${divisionName} operates primarily in banking book`,
          'Limited trading activity',
          year => `Market Risk RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'CVA Risk RWA',
      data: divisionResults.capital.rwaCVA || [0, 0, 0, 0, 0],
      decimals: 0,
      formula: (divisionResults.capital.rwaCVA || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Credit Valuation Adjustment',
        [
          'Counterparty credit risk for derivatives',
          year => `CVA RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'TOTAL RWA',
      data: divisionResults.capital.totalRWA,
      decimals: 0,
      isHeader: true,
      bgColor: 'yellow',
      formula: divisionResults.capital.totalRWA.map((val, i) => createFormula(i,
        'Credit + Operational + Market + CVA Risk',
        [
          year => `Credit Risk: ${formatNumber(divisionResults.capital.rwaCreditRisk[year], 0)} €M`,
          year => `Operational Risk: ${formatNumber((divisionResults.capital.rwaOperationalRisk || [])[year] || 0, 0)} €M`,
          year => `Market Risk: ${formatNumber((divisionResults.capital.rwaMarketRisk || [])[year] || 0, 0)} €M`,
          year => `CVA Risk: ${formatNumber((divisionResults.capital.rwaCVA || [])[year] || 0, 0)} €M`,
          year => `Total RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    // Spacing
    {
      label: '',
      data: [null, null, null, null, null],
      decimals: 0
    },
    
    // ========== CAPITAL ==========
    {
      label: 'REGULATORY CAPITAL',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Common Equity Tier 1 (CET1)',
      data: divisionResults.bs.equity,
      decimals: 0,
      isTotal: true,
      formula: divisionResults.bs.equity.map((val, i) => createFormula(i,
        'Shareholders equity allocated to division',
        [
          year => `Total Bank CET1: ${formatNumber(globalResults.bs.equity[year], 0)} €M`,
          year => `Division RWA Weight: ${((divisionResults.capital.totalRWA[year] / globalResults.capital.totalRWA[year]) * 100).toFixed(1)}%`,
          year => `Allocated CET1: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Additional Tier 1 (AT1)',
      data: divisionResults.capital.additionalTier1 || [0, 0, 0, 0, 0],
      decimals: 0,
      formula: (divisionResults.capital.additionalTier1 || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Contingent convertible instruments',
        [
          'CoCo bonds and other AT1 instruments',
          year => `AT1 Capital: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Tier 1 Capital',
      data: divisionResults.bs.equity.map((cet1, i) => 
        cet1 + (divisionResults.capital.additionalTier1?.[i] || 0)
      ),
      decimals: 0,
      isHeader: true,
      formula: divisionResults.bs.equity.map((cet1, i) => createFormula(i,
        'CET1 + Additional Tier 1',
        [
          year => `CET1: ${formatNumber(cet1, 0)} €M`,
          year => `AT1: ${formatNumber((divisionResults.capital.additionalTier1 || [])[year] || 0, 0)} €M`,
          year => `Tier 1: ${formatNumber(cet1 + ((divisionResults.capital.additionalTier1 || [])[year] || 0), 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Tier 2 Capital',
      data: divisionResults.capital.tier2 || [0, 0, 0, 0, 0],
      decimals: 0,
      formula: (divisionResults.capital.tier2 || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Subordinated debt and hybrid instruments',
        [
          'Limited to 100% of Tier 1 capital',
          year => `Tier 2 Capital: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    
    {
      label: 'Total Capital',
      data: divisionResults.bs.equity.map((cet1, i) => 
        cet1 + (divisionResults.capital.additionalTier1?.[i] || 0) + (divisionResults.capital.tier2?.[i] || 0)
      ),
      decimals: 0,
      isHeader: true,
      bgColor: 'green',
      formula: divisionResults.bs.equity.map((cet1, i) => createFormula(i,
        'Tier 1 + Tier 2 Capital',
        [
          year => `Tier 1: ${formatNumber(cet1 + ((divisionResults.capital.additionalTier1 || [])[year] || 0), 0)} €M`,
          year => `Tier 2: ${formatNumber((divisionResults.capital.tier2 || [])[year] || 0, 0)} €M`,
          year => `Total Capital: ${formatNumber(cet1 + ((divisionResults.capital.additionalTier1 || [])[year] || 0) + ((divisionResults.capital.tier2 || [])[year] || 0), 0)} €M`
        ]
      ))
    },
    
    // Spacing
    {
      label: '',
      data: [null, null, null, null, null],
      decimals: 0
    },
    
    // ========== CAPITAL RATIOS ==========
    {
      label: 'CAPITAL RATIOS',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'CET1 Ratio (%)',
      data: divisionResults.capital.cet1Ratio || divisionResults.bs.equity.map((equity, i) => 
        divisionResults.capital.totalRWA[i] > 0 ? (equity / divisionResults.capital.totalRWA[i]) * 100 : 0
      ),
      decimals: 1,
      isPercentage: true,
      formula: (divisionResults.capital.cet1Ratio || []).map((val, i) => createFormula(i,
        'CET1 Capital / Total RWA × 100',
        [
          year => `CET1 Capital: ${formatNumber(divisionResults.bs.equity[year], 0)} €M`,
          year => `Total RWA: ${formatNumber(divisionResults.capital.totalRWA[year], 0)} €M`,
          year => `CET1 Ratio: ${formatNumber(val || 0, 1)}%`,
          'Regulatory minimum: 4.5% + buffers'
        ]
      ))
    },
    
    {
      label: 'Tier 1 Ratio (%)',
      data: divisionResults.bs.equity.map((cet1, i) => {
        const tier1 = cet1 + (divisionResults.capital.additionalTier1?.[i] || 0);
        return divisionResults.capital.totalRWA[i] > 0 ? (tier1 / divisionResults.capital.totalRWA[i]) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: divisionResults.bs.equity.map((cet1, i) => createFormula(i,
        'Tier 1 Capital / Total RWA × 100',
        [
          year => `Tier 1 Capital: ${formatNumber(cet1 + ((divisionResults.capital.additionalTier1 || [])[year] || 0), 0)} €M`,
          year => `Total RWA: ${formatNumber(divisionResults.capital.totalRWA[year], 0)} €M`,
          year => `Tier 1 Ratio: ${formatNumber((cet1 + ((divisionResults.capital.additionalTier1 || [])[year] || 0)) / divisionResults.capital.totalRWA[year] * 100, 1)}%`,
          'Regulatory minimum: 6.0% + buffers'
        ]
      ))
    },
    
    {
      label: 'Total Capital Ratio (%)',
      data: divisionResults.bs.equity.map((cet1, i) => {
        const totalCapital = cet1 + (divisionResults.capital.additionalTier1?.[i] || 0) + (divisionResults.capital.tier2?.[i] || 0);
        return divisionResults.capital.totalRWA[i] > 0 ? (totalCapital / divisionResults.capital.totalRWA[i]) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: divisionResults.bs.equity.map((cet1, i) => createFormula(i,
        'Total Capital / Total RWA × 100',
        [
          year => `Total Capital: ${formatNumber(cet1 + ((divisionResults.capital.additionalTier1 || [])[year] || 0) + ((divisionResults.capital.tier2 || [])[year] || 0), 0)} €M`,
          year => `Total RWA: ${formatNumber(divisionResults.capital.totalRWA[year], 0)} €M`,
          year => `Total Capital Ratio: ${formatNumber((cet1 + ((divisionResults.capital.additionalTier1 || [])[year] || 0) + ((divisionResults.capital.tier2 || [])[year] || 0)) / divisionResults.capital.totalRWA[year] * 100, 1)}%`,
          'Regulatory minimum: 8.0% + buffers'
        ]
      ))
    },
    
    {
      label: 'Leverage Ratio (%)',
      data: divisionResults.bs.equity.map((equity, i) => {
        const totalAssets = divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        return totalAssets > 0 ? (equity / totalAssets) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: divisionResults.bs.equity.map((equity, i) => createFormula(i,
        'Tier 1 Capital / Total Exposure × 100',
        [
          year => `Tier 1 Capital: ${formatNumber(equity, 0)} €M`,
          year => `Total Exposure: ${formatNumber(divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year] + (divisionResults.bs.otherAssets?.[year] || 0), 0)} €M`,
          year => `Leverage Ratio: ${formatNumber((equity / (divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year] + (divisionResults.bs.otherAssets?.[year] || 0))) * 100, 1)}%`,
          'Regulatory minimum: 3.0%'
        ]
      ))
    },
    
    // Spacing  
    {
      label: '',
      data: [null, null, null, null, null],
      decimals: 0
    },
    
    // ========== BUFFER REQUIREMENTS ==========
    {
      label: 'REGULATORY BUFFERS',
      data: [null, null, null, null, null],
      isHeader: true
    },
    
    {
      label: 'Capital Conservation Buffer',
      data: [2.5, 2.5, 2.5, 2.5, 2.5],
      decimals: 1,
      unit: '%',
      formula: [2.5, 2.5, 2.5, 2.5, 2.5].map((val, i) => createFormula(i,
        'Regulatory requirement',
        [
          'Basel III capital conservation buffer',
          year => `CCB: ${val}%`
        ]
      ))
    },
    
    {
      label: 'Countercyclical Buffer',
      data: [0.0, 0.5, 1.0, 1.5, 2.0],
      decimals: 1,
      unit: '%',
      formula: [0.0, 0.5, 1.0, 1.5, 2.0].map((val, i) => createFormula(i,
        'Economic cycle adjustment',
        [
          'Set by national authorities',
          year => `CCyB: ${val}%`
        ]
      ))
    },
    
    {
      label: 'Combined Buffer Requirement',
      data: [2.5, 3.0, 3.5, 4.0, 4.5],
      decimals: 1,
      unit: '%',
      isHeader: true,
      formula: [2.5, 3.0, 3.5, 4.0, 4.5].map((val, i) => createFormula(i,
        'CCB + CCyB + Other buffers',
        [
          year => `Total Buffer: ${val}%`,
          'Applied to CET1 minimum requirement'
        ]
      ))
    }
  ];

  // Apply any custom row transformations
  const finalRows = standardCapitalRows.map(row => ({
    ...row,
    ...(customRowTransformations[row.label] || {})
  }));

  return <FinancialTable title="Capital Requirements" rows={finalRows} />;
};

export default StandardCapitalRequirements;