import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';

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
  
  // Helper function to create formula explanations
  const createFormula = (year, formula, details) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d)
  });

  // Calculate derived KPI values
  const allocatedEquity = divisionResults.bs.allocatedEquity || [0,0,0,0,0,0,0,0,0,0];
  const netProfit = divisionResults.pnl.netProfit || [0,0,0,0,0,0,0,0,0,0];
  const totalRevenues = (divisionResults.pnl.interestIncome || [0,0,0,0,0,0,0,0,0,0]).map((ii, i) => {
    const ci = (divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const ie = (divisionResults.pnl.interestExpenses || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const ce = (divisionResults.pnl.commissionExpenses || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    return ii + ci + ie + ce; // ie and ce are negative
  });
  
  // Calculate operating expenses (allocated based on RWA)
  const totalOpex = [0,0,0,0,0,0,0,0,0,0].map((_, i) => {
    const divisionRwa = (divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const totalRwa = globalResults.capital.totalRWA[i] || 1;
    const rwaWeight = divisionRwa / totalRwa;
    
    const personnelCosts = (globalResults.pnl.personnelCostsTotal || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const adminCosts = (globalResults.pnl.adminCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const marketingCosts = (globalResults.pnl.marketingCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const itCosts = (globalResults.pnl.itCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const hqAllocation = (globalResults.pnl.hqAllocation || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    
    return (personnelCosts + adminCosts + marketingCosts + itCosts + hqAllocation) * rwaWeight;
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

  // FTE calculation (allocated based on RWA)
  const fte = [0,0,0,0,0,0,0,0,0,0].map((_, i) => {
    const divisionRwa = (divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const totalRwa = globalResults.capital.totalRWA[i] || 1;
    const totalFte = (globalResults.kpi.fte || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    return totalFte * (divisionRwa / totalRwa);
  });

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
      formula: costIncomeRatio.map((val, i) => createFormula(i,
        'Total Operating Expenses / Total Revenues × 100',
        [
          year => `Operating Expenses: ${formatNumber(Math.abs(totalOpex[year]), 2)} €M`,
          year => `Total Revenues: ${formatNumber(totalRevenues[year], 2)} €M`,
          year => `Cost/Income: ${formatNumber(val, 1)}%`,
          'Lower is better - indicates operational efficiency'
        ]
      ))
    },

    // ========== COST OF RISK ==========
    {
      label: 'Cost of Risk',
      data: costOfRisk,
      decimals: 0,
      unit: ' bps',
      formula: costOfRisk.map((val, i) => createFormula(i,
        'Loan Loss Provisions / Average Performing Assets × 10,000',
        [
          year => `LLP: ${formatNumber(Math.abs((divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0])[year]), 2)} €M`,
          year => `Avg Performing Assets: ${formatNumber(year > 0 ? ((divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[year] + (divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[year-1]) / 2 : (divisionResults.bs.performingAssets || [0,0,0,0,0,0,0,0,0,0])[year], 0)} €M`,
          year => `Cost of Risk: ${formatNumber(val, 0)} basis points`,
          'Measures credit risk - lower is better'
        ]
      ))
    },

    // ========== FTE ==========
    {
      label: 'FTE',
      data: fte,
      decimals: 0,
      formula: fte.map((val, i) => createFormula(i,
        'Total Bank FTE × Division RWA Weight',
        [
          year => `Total Bank FTE: ${formatNumber((globalResults.kpi.fte || [0,0,0,0,0,0,0,0,0,0])[year], 0)}`,
          year => `Division RWA: ${formatNumber((divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[year], 0)} €M`,
          year => `Total RWA: ${formatNumber(globalResults.capital.totalRWA[year], 0)} €M`,
          year => `RWA Weight: ${globalResults.capital.totalRWA[year] > 0 ? (((divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[year] / globalResults.capital.totalRWA[year]) * 100).toFixed(1) : 0}%`,
          year => `Division FTE: ${formatNumber(val, 0)}`
        ]
      ))
    },

    // ========== FTE FRONT-OFFICE ==========
    {
      label: 'FTE front-office (for back-office costs)',
      data: fteFrontOffice,
      decimals: 0,
      formula: fteFrontOffice.map((val, i) => createFormula(i,
        'Total Division FTE × Front-Office Ratio',
        [
          year => `Total Division FTE: ${formatNumber(fte[year], 0)}`,
          year => `Front-Office Ratio: 60%`,
          year => `Front-Office FTE: ${formatNumber(val, 0)}`,
          'Used for back-office cost allocation calculations'
        ]
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