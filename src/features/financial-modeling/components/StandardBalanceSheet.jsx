import React from 'react';
import FinancialTable from './FinancialTable';

/**
 * Standardized Balance Sheet structure for all divisions
 * TEMPORARILY SIMPLIFIED - Complex calculations commented out
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
  // Define quarters constant
  const quarters = 40;
  
  // Get products from assumptions for this division
  const divisionProducts = Object.entries(assumptions.products || {})
    .filter(([key, product]) => {
      // Filter products belonging to this division - handle all variations
      const lowerKey = key.toLowerCase();
      
      if (divisionName === 're' || divisionName === 'realEstate') {
        // Check for all known Real Estate product keys - be precise
        return lowerKey.startsWith('re') || 
               product.division === 'realEstate' || 
               product.division === 're' ||
               product.division === 'RealEstateFinancing';
      } else if (divisionName === 'sme') {
        return lowerKey.startsWith('sme') || 
               product.division === 'sme' ||
               product.division === 'SMEFinancing';
      } else if (divisionName === 'digital') {
        return lowerKey.startsWith('digital') || 
               product.division === 'digital' ||
               product.division === 'DigitalBanking';
      } else if (divisionName === 'wealth') {
        return lowerKey.startsWith('wealth') || 
               product.division === 'wealth' ||
               product.division === 'WealthAndAssetManagement';
      } else if (divisionName === 'incentive') {
        return lowerKey.startsWith('incentive') || 
               product.division === 'incentive' ||
               product.division === 'Incentives';
      } else if (divisionName === 'tech') {
        return lowerKey.startsWith('tech') || 
               product.division === 'tech' ||
               product.division === 'Tech';
      }
      return lowerKey.startsWith(divisionName.toLowerCase());
    })
    .reduce((acc, [key, product]) => {
      acc[key] = product;
      return acc;
    }, {});

  // Temporary placeholder data
  const placeholderData = Array(quarters).fill(0);

  // Simplified Balance Sheet Rows
  const balanceSheetRows = [
    {
      label: 'New Loan Volumes',
      data: divisionResults?.bs?.quarterly?.newVolumes ?? placeholderData,
      decimals: 2,
      isPositive: true,
      isHeader: true,
      formula: null,
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: productResults?.[key]?.bs?.quarterly?.newVolumes ?? Array(quarters).fill(0),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'Principal Repayments',
      data: divisionResults?.bs?.quarterly?.repayments ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null,
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: productResults?.[key]?.bs?.quarterly?.repayments ?? Array(quarters).fill(0),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'Stock NBV (Net Book Value)',
      data: (() => {
        // Calculate division-level Stock NBV by summing product NBVs
        const divisionNBV = new Array(quarters).fill(0);
        Object.entries(productResults || {}).forEach(([key, product]) => {
          const productNBV = product?.quarterly?.totalStock || [];
          productNBV.forEach((value, q) => {
            divisionNBV[q] += value || 0;
          });
        });
        return divisionNBV;
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'lightyellow',
      formula: null,
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: productResults?.[key]?.quarterly?.totalStock ?? Array(quarters).fill(0),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'Defaults',
      data: divisionResults?.bs?.quarterly?.defaults ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null,
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: productResults?.[key]?.bs?.quarterly?.defaults ?? Array(quarters).fill(0),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'Stock NBV Performing',
      data: (() => {
        // Calculate division-level Stock NBV Performing by summing product values
        const divisionStockNBVPerforming = new Array(quarters).fill(0);
        Object.entries(divisionProducts).forEach(([key, product]) => {
          const productData = globalResults?.balanceSheet?.details?.stockNBVPerforming?.byProduct?.[key];
          const productQuarterly = productData?.quarterly || Array(quarters).fill(0);
          productQuarterly.forEach((value, q) => {
            divisionStockNBVPerforming[q] += value || 0;
          });
        });
        return divisionStockNBVPerforming;
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'lightcyan',
      formula: null,
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: (() => {
          // Get product-level Stock NBV Performing data
          const productData = globalResults?.balanceSheet?.details?.stockNBVPerforming?.byProduct?.[key];
          return productData?.quarterly || Array(quarters).fill(0);
        })(),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'ECL Provision',
      data: (() => {
        // Get ECL data from balance sheet results
        if (globalResults?.balanceSheet?.details?.eclProvision?.balanceSheetLine?.quarterly) {
          return globalResults.balanceSheet.details.eclProvision.balanceSheetLine.quarterly;
        }
        return placeholderData;
      })(),
      decimals: 2,
      isHeader: true,
      isNegative: true,
      bgColor: 'lightsalmon',
      formula: null,
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: (() => {
          // Get product-level ECL data
          const productData = globalResults?.balanceSheet?.details?.eclProvision?.byProduct?.[key];
          if (productData?.quarterlyProvision) {
            // ECL should be negative in balance sheet
            return productData.quarterlyProvision.map(val => -val);
          }
          return Array(quarters).fill(0);
        })(),
        decimals: 2,
        isSubRow: true,
        isNegative: true,
        formula: null
      })) : []
    },
    {
      label: 'Stock NBV Performing Post-ECL',
      data: (() => {
        // Calculate division-level Stock NBV Performing Post-ECL by summing product values
        const divisionStockNBVPerformingPostECL = new Array(quarters).fill(0);
        Object.entries(divisionProducts).forEach(([key, product]) => {
          const productData = globalResults?.balanceSheet?.details?.stockNBVPerformingPostECL?.byProduct?.[key];
          const productQuarterly = productData?.quarterly || Array(quarters).fill(0);
          productQuarterly.forEach((value, q) => {
            divisionStockNBVPerformingPostECL[q] += value || 0;
          });
        });
        return divisionStockNBVPerformingPostECL;
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'lightgreen',
      formula: null,
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: (() => {
          // Get product-level Stock NBV Performing Post-ECL data
          const productData = globalResults?.balanceSheet?.details?.stockNBVPerformingPostECL?.byProduct?.[key];
          return productData?.quarterly || Array(quarters).fill(0);
        })(),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'Non-Performing Assets (NPV)',
      data: (() => {
        // Get Non-Performing Assets data from balance sheet results
        if (globalResults?.balanceSheet?.details?.nonPerformingAssets?.balanceSheetLine?.quarterly) {
          return globalResults.balanceSheet.details.nonPerformingAssets.balanceSheetLine.quarterly;
        }
        return placeholderData;
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'lightcoral',
      formula: null,
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: (() => {
          // Get product-level Non-Performing Assets data
          const productData = globalResults?.balanceSheet?.details?.nonPerformingAssets?.byProduct?.[key];
          return productData?.quarterlyNPV || Array(quarters).fill(0);
        })(),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'Net Performing Assets',
      data: (() => {
        // Calculate division-level Net Performing Assets by summing product values
        const divisionNetPerformingAssets = new Array(quarters).fill(0);
        Object.entries(divisionProducts).forEach(([key, product]) => {
          const productData = globalResults?.balanceSheet?.details?.netPerformingAssets?.byProduct?.[key];
          const productQuarterly = productData?.quarterly || Array(quarters).fill(0);
          productQuarterly.forEach((value, q) => {
            divisionNetPerformingAssets[q] += value || 0;
          });
        });
        return divisionNetPerformingAssets;
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'lightblue',
      formula: null,
      subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: (() => {
          // Get product-level Net Performing Assets data
          const productData = globalResults?.balanceSheet?.details?.netPerformingAssets?.byProduct?.[key];
          return productData?.quarterly || Array(quarters).fill(0);
        })(),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
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

  return <FinancialTable title="1. Stato Patrimoniale" rows={transformedRows} />;
};

export default StandardBalanceSheet;