import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../../components/shared/formatters';
import { createFormula } from '../../../components/tooltip-system';

/**
 * Standardized KPIs structure for all divisions
 * Following the exact schema provided
 */
const StandardKPIs = ({ 
  divisionResults, 
  productResults, 
  assumptions, 
  globalResults,
  divisionName,
  showProductDetail = true,
  customRowTransformations = {}
}) => {

  // Calculate derived KPI values
  const totalRevenues = (divisionResults.pnl.interestIncome || [0,0,0,0,0,0,0,0,0,0]).map((ii, i) => {
    const ci = (divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const ie = (divisionResults.pnl.interestExpenses || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const ce = (divisionResults.pnl.commissionExpenses || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    return ii + ci + ie + ce; // ie and ce are negative
  });
  
  // Use pre-calculated total OPEX from division results
  const totalOpex = divisionResults.pnl.totalOpex || [0,0,0,0,0,0,0,0,0,0].map((_, i) => {
    // Fallback calculation if totalOpex not available
    const personnelCosts = (divisionResults.pnl.personnelCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const otherOpex = (divisionResults.pnl.otherOpex || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    return personnelCosts + otherOpex;
  });

  // Cost/Income Ratio
  const costIncomeRatio = totalRevenues.map((rev, i) => 
    rev > 0 ? (Math.abs(totalOpex[i]) / rev) * 100 : 0
  );

  // Cost of Risk
  const costOfRisk = (divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0]).map((llp, i) => {
    const performingAssets = (divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0]);
    const avgPerformingAssets = i > 0 
      ? (performingAssets[i] + performingAssets[i-1]) / 2 
      : performingAssets[i];
    return avgPerformingAssets > 0 ? (Math.abs(llp) / avgPerformingAssets) * 10000 : 0;
  });

  // FTE calculation - get actual division FTE from KPI data
  const divisionPrefix = divisionName.toLowerCase().includes('real estate') ? 're' :
                        divisionName.toLowerCase().includes('sme') || divisionName.toLowerCase().includes('pmi') ? 'sme' :
                        divisionName.toLowerCase().includes('digital') ? 'digital' :
                        divisionName.toLowerCase().includes('wealth') ? 'wealth' :
                        divisionName.toLowerCase().includes('incentive') || divisionName.toLowerCase().includes('finanza agevolata') ? 'incentive' :
                        divisionName.toLowerCase().includes('tech') ? 'tech' :
                        divisionName.toLowerCase().includes('central') ? 'central' :
                        divisionName.toLowerCase().includes('treasury') ? 'treasury' : '';
  
  const fte = globalResults.kpi[`${divisionPrefix}Fte`] || [0,0,0,0,0,0,0,0,0,0];

  // FTE front-office (assume 60% of total FTE for client-facing divisions)
  const fteFrontOffice = fte.map(f => f * 0.6);

  // KPI Rows following the exact schema
  const kpiRows = [
    // ========== COST/INCOME RATIO ==========
    {
      label: 'Cost / Income',
      data: costIncomeRatio,
      decimals: 1,
      unit: '%',
      isSubTotal: true,
      formula: costIncomeRatio.map((val, i) => createFormula(i,
        'Total Operating Expenses / Total Revenues × 100',
        [
          {
            name: 'Total Operating Expenses',
            value: Math.abs(totalOpex[i]),
            unit: '€M',
            calculation: 'Personnel + Admin + Marketing + IT + HQ costs allocated by RWA'
          },
          {
            name: 'Total Revenues',
            value: totalRevenues[i],
            unit: '€M',
            calculation: 'Interest Income + Commission Income - Interest Expenses - Commission Expenses'
          },
          {
            name: 'Cost/Income Ratio',
            value: val,
            unit: '%',
            calculation: 'Lower is better - indicates operational efficiency'
          }
        ],
        () => `${formatNumber(Math.abs(totalOpex[i]), 2)} / ${formatNumber(totalRevenues[i], 2)} × 100 = ${formatNumber(val, 1)}%`
      ))
    },

    // ========== COST OF RISK ==========
    {
      label: 'Cost of Risk',
      data: costOfRisk,
      decimals: 0,
      unit: ' bps',
      isSubTotal: true,
      formula: costOfRisk.map((val, i) => createFormula(i,
        'Loan Loss Provisions / Average Performing Assets × 10,000',
        [
          {
            name: 'Loan Loss Provisions',
            value: Math.abs((divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0])[i]),
            unit: '€M',
            calculation: 'Annual credit risk provisions'
          },
          {
            name: 'Average Performing Assets',
            value: i > 0 ? ((divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i] + (divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i-1]) / 2 : (divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i],
            unit: '€M',
            calculation: i > 0 ? 'Average of beginning and ending balance' : 'Year-end balance'
          },
          {
            name: 'Cost of Risk',
            value: val,
            unit: 'bps',
            calculation: 'Measures credit risk - lower is better'
          }
        ],
        () => {
          const llp = Math.abs((divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0])[i]);
          const avgAssets = i > 0 ? ((divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i] + (divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i-1]) / 2 : (divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[i];
          return `${formatNumber(llp, 2)} / ${formatNumber(avgAssets, 0)} × 10,000 = ${formatNumber(val, 0)} bps`;
        }
      ))
    },

    // ========== FTE ==========
    {
      label: 'FTE',
      data: fte,
      decimals: 0,
      isSubTotal: true,
      formula: fte.map((val, i) => createFormula(i,
        'Division Actual FTE from Bottom-up Personnel Model',
        [
          {
            name: 'Junior Count',
            value: 0, // Would need to pass detailed data
            unit: 'FTE',
            calculation: 'Entry-level positions (subject to growth)'
          },
          {
            name: 'Middle Count',
            value: 0, // Would need to pass detailed data
            unit: 'FTE',
            calculation: 'Mid-level positions (subject to growth)'
          },
          {
            name: 'Senior Count',
            value: 0, // Would need to pass detailed data
            unit: 'FTE',
            calculation: 'Senior positions (constant)'
          },
          {
            name: 'Head of Count',
            value: 0, // Would need to pass detailed data
            unit: 'FTE',
            calculation: 'Leadership positions (constant)'
          },
          {
            name: 'Total Division FTE',
            value: val,
            unit: 'FTE',
            calculation: 'Sum of all seniority levels in this division'
          }
        ],
        () => `Actual headcount from personnel staffing: ${formatNumber(val, 0)} FTE`
      ))
    },

    // ========== FTE FRONT-OFFICE ==========
    {
      label: 'FTE front-office (for back-office costs)',
      data: fteFrontOffice,
      decimals: 0,
      isSubItem: true,
      formula: fteFrontOffice.map((val, i) => createFormula(i,
        'Total Division FTE × Front-Office Ratio',
        [
          {
            name: 'Total Division FTE',
            value: fte[i],
            unit: 'FTE',
            calculation: 'Total allocated headcount'
          },
          {
            name: 'Front-Office Ratio',
            value: 60,
            unit: '%',
            calculation: 'Percentage of client-facing staff'
          },
          {
            name: 'Front-Office FTE',
            value: val,
            unit: 'FTE',
            calculation: 'Used for back-office cost allocation calculations'
          }
        ],
        () => `${formatNumber(fte[i], 0)} × 60% = ${formatNumber(val, 0)}`
      ))
    }
  ];

  // Apply custom row transformations
  const transformedRows = kpiRows.map(row => {
    const transformation = customRowTransformations[row.label];
    if (transformation) {
      return { ...row, ...transformation };
    }
    return row;
  });

  return <FinancialTable title="4. KPI principali" rows={transformedRows} />;
};

export default StandardKPIs;