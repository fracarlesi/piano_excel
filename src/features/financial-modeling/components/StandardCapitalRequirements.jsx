import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../../lib/utils';

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
      decimals: 2,
      isHeader: true,
      formula: null,
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.rwa || [0,0,0,0,0,0,0,0,0,0],
        decimals: 2,
        formula: null
      })) : []
    },
    // ========== EQUITY SECTION ==========
    {
      label: 'Equity',
      data: allocatedEquity,
      decimals: 2,
      isHeader: true,
      bgColor: 'lightblue',
      // Add breakdown as subRows
      subRows: showProductDetail ? [
        ...Object.entries(productResults).map(([key, product], index) => ({
          label: `o/w ${product.name}`,
          data: product.allocatedEquity || [0,0,0,0,0,0,0,0,0,0],
          decimals: 2,
          formula: null
        })),
        {
          label: 'Operating assets',
          data: allocatedEquity.map((equity, i) => {
            const operatingRWA = operationalRiskRWA[i];
            const totalDivisionRWA = totalRWA[i];
            return totalDivisionRWA > 0 ? equity * (operatingRWA / totalDivisionRWA) : 0;
          }),
          decimals: 2,
          formula: null
        }
      ] : []
    },

    // ========== CET1 RATIO SECTION ==========
    {
      label: 'CET1 (%)',
      data: cet1Ratio,
      decimals: 2,
      unit: '%',
      isSubTotal: true,
      formula: null,
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: (product.allocatedEquity || [0,0,0,0,0,0,0,0,0,0]).map((equity, i) => {
          const productRWA = (product.rwa || [0,0,0,0,0,0,0,0,0,0])[i];
          return productRWA > 0 ? (equity / productRWA) * 100 : 0;
        }),
        decimals: 2,
        unit: '%',
        formula: null
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
      decimals: 2,
      isSubItem: true,
      formula: null
    },

    {
      label: 'Operative risk',
      data: operationalRiskRWA,
      decimals: 2,
      isSubItem: true,
      formula: null
    },

    {
      label: 'Market risk',
      data: marketRiskRWA,
      decimals: 2,
      isSubItem: true,
      formula: null
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