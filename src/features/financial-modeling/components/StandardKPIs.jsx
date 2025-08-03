import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../../lib/utils';

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
      decimals: 2,
      unit: '%',
      isSubTotal: true,
      formula: null
    },

    // ========== COST OF RISK ==========
    {
      label: 'Cost of Risk',
      data: costOfRisk,
      decimals: 2,
      unit: ' bps',
      isSubTotal: true,
      formula: null
    },

    // ========== FTE ==========
    {
      label: 'FTE',
      data: fte,
      decimals: 2,
      isSubTotal: true,
      formula: null
    },

    // ========== FTE FRONT-OFFICE ==========
    {
      label: 'FTE front-office (for back-office costs)',
      data: fteFrontOffice,
      decimals: 2,
      isSubItem: true,
      formula: null
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