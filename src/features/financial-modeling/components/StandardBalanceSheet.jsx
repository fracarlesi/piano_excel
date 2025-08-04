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
        // Calculate division-level ECL by summing product ECLs
        const divisionECL = new Array(quarters).fill(0);
        Object.entries(divisionProducts).forEach(([key, product]) => {
          const productData = globalResults?.balanceSheet?.details?.eclProvision?.byProduct?.[key];
          if (productData?.quarterlyProvision) {
            productData.quarterlyProvision.forEach((value, q) => {
              divisionECL[q] += -value; // ECL should be negative in balance sheet
            });
          }
        });
        return divisionECL;
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
        // Calculate division-level NPV by summing product NPVs
        const divisionNPV = new Array(quarters).fill(0);
        Object.entries(divisionProducts).forEach(([key, product]) => {
          const productData = globalResults?.balanceSheet?.details?.nonPerformingAssets?.byProduct?.[key];
          const productNPV = productData?.quarterlyNPV || Array(quarters).fill(0);
          productNPV.forEach((value, q) => {
            divisionNPV[q] += value || 0;
          });
        });
        return divisionNPV;
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
    },
    {
      label: 'TOTAL ASSETS',
      data: (() => {
        // Calculate Total Assets = Net Performing Assets + Non-Performing Assets (NPV)
        const totalAssets = new Array(quarters).fill(0);
        
        // Get Net Performing Assets
        const netPerformingAssets = new Array(quarters).fill(0);
        Object.entries(divisionProducts).forEach(([key, product]) => {
          const productData = globalResults?.balanceSheet?.details?.netPerformingAssets?.byProduct?.[key];
          const productQuarterly = productData?.quarterly || Array(quarters).fill(0);
          productQuarterly.forEach((value, q) => {
            netPerformingAssets[q] += value || 0;
          });
        });
        
        // Get Non-Performing Assets (NPV)
        const nonPerformingAssets = new Array(quarters).fill(0);
        Object.entries(divisionProducts).forEach(([key, product]) => {
          const productData = globalResults?.balanceSheet?.details?.nonPerformingAssets?.byProduct?.[key];
          const productNPV = productData?.quarterlyNPV || Array(quarters).fill(0);
          productNPV.forEach((value, q) => {
            nonPerformingAssets[q] += value || 0;
          });
        });
        
        // Sum them up
        for (let q = 0; q < quarters; q++) {
          totalAssets[q] = netPerformingAssets[q] + nonPerformingAssets[q];
        }
        
        return totalAssets;
      })(),
      decimals: 2,
      isHeader: true,
      isSection: true,
      bgColor: '#e3f2fd',
      formula: 'Net Performing Assets + Non-Performing Assets',
      subRows: []
    },
    // Liabilities Section
    {
      label: 'Equity',
      data: divisionResults?.bs?.quarterly?.equity ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null
    },
    {
      label: 'Sight deposits',
      data: (() => {
        // Get sight deposits from division results
        if (divisionResults?.bs?.quarterly?.sightDeposits) {
          return divisionResults.bs.quarterly.sightDeposits;
        }
        // For Digital division, calculate sum from products
        if (divisionName === 'digital') {
          const sightDepositsByQuarter = new Array(quarters).fill(0);
          Object.entries(divisionProducts).forEach(([key, product]) => {
            const productSightDeposits = divisionResults?.liabilities?.sightDeposits?.byProduct?.[key]?.quarterly || [];
            productSightDeposits.forEach((value, q) => {
              sightDepositsByQuarter[q] += value || 0;
            });
          });
          return sightDepositsByQuarter;
        }
        return placeholderData;
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'lightsteelblue',
      formula: null,
      subRows: showProductDetail && divisionName === 'digital' ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: (() => {
          const sightDeposits = divisionResults?.liabilities?.sightDeposits?.byProduct?.[key];
          return sightDeposits?.quarterly || Array(quarters).fill(0);
        })(),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'Term deposits',
      data: (() => {
        // Get term deposits from division results
        if (divisionResults?.bs?.quarterly?.termDeposits) {
          return divisionResults.bs.quarterly.termDeposits;
        }
        // For Digital division, calculate sum from products
        if (divisionName === 'digital') {
          const termDepositsByQuarter = new Array(quarters).fill(0);
          Object.entries(divisionProducts).forEach(([key, product]) => {
            const productTermDeposits = divisionResults?.liabilities?.termDeposits?.byProduct?.[key]?.quarterly || [];
            productTermDeposits.forEach((value, q) => {
              termDepositsByQuarter[q] += value || 0;
            });
          });
          return termDepositsByQuarter;
        }
        return placeholderData;
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'lightcyan',
      formula: null,
      subRows: showProductDetail && divisionName === 'digital' ? Object.entries(divisionProducts).map(([key, product]) => ({
        label: `• ${product.name}`,
        data: (() => {
          const termDeposits = divisionResults?.liabilities?.termDeposits?.byProduct?.[key];
          return termDeposits?.total?.quarterly || Array(quarters).fill(0);
        })(),
        decimals: 2,
        isSubRow: true,
        formula: null
      })) : []
    },
    {
      label: 'Group funding',
      data: (() => {
        // Calculate Group Funding based on division's funding needs
        const groupFunding = new Array(quarters).fill(0);
        
        // Get total assets for this division
        const totalAssets = new Array(quarters).fill(0);
        Object.entries(divisionProducts).forEach(([key, product]) => {
          // Net Performing Assets
          const netPerformingData = globalResults?.balanceSheet?.details?.netPerformingAssets?.byProduct?.[key];
          const netPerformingQuarterly = netPerformingData?.quarterly || Array(quarters).fill(0);
          
          // Non-Performing Assets
          const nonPerformingData = globalResults?.balanceSheet?.details?.nonPerformingAssets?.byProduct?.[key];
          const nonPerformingQuarterly = nonPerformingData?.quarterlyNPV || Array(quarters).fill(0);
          
          for (let q = 0; q < quarters; q++) {
            totalAssets[q] += (netPerformingQuarterly[q] || 0) + (nonPerformingQuarterly[q] || 0);
          }
        });
        
        // Get customer deposits (sight + term)
        const sightDeposits = divisionResults?.bs?.quarterly?.sightDeposits || Array(quarters).fill(0);
        const termDeposits = divisionResults?.bs?.quarterly?.termDeposits || Array(quarters).fill(0);
        const equity = divisionResults?.bs?.quarterly?.equity || Array(quarters).fill(0);
        
        // Calculate funding need: Assets - Deposits - Equity
        for (let q = 0; q < quarters; q++) {
          const assets = totalAssets[q];
          const deposits = sightDeposits[q] + termDeposits[q];
          const equityAmount = equity[q] || 0;
          
          // If assets > deposits + equity, division needs group funding
          // If assets < deposits + equity, division provides funding to group (negative)
          groupFunding[q] = assets - deposits - equityAmount;
        }
        
        return groupFunding;
      })(),
      decimals: 2,
      isHeader: true,
      bgColor: 'lightgoldenrodyellow',
      formula: 'Total Assets - Customer Deposits - Equity'
    },
    {
      label: 'TOTAL LIABILITIES',
      data: (() => {
        // Calculate Total Liabilities = Equity + Sight deposits + Term deposits + Group funding
        const totalLiabilities = new Array(quarters).fill(0);
        
        // Get all liability components
        const equity = divisionResults?.bs?.quarterly?.equity || Array(quarters).fill(0);
        const sightDeposits = divisionResults?.bs?.quarterly?.sightDeposits || Array(quarters).fill(0);
        const termDeposits = divisionResults?.bs?.quarterly?.termDeposits || Array(quarters).fill(0);
        
        // Calculate group funding (same logic as above)
        const groupFunding = new Array(quarters).fill(0);
        const totalAssets = new Array(quarters).fill(0);
        
        Object.entries(divisionProducts).forEach(([key, product]) => {
          const netPerformingData = globalResults?.balanceSheet?.details?.netPerformingAssets?.byProduct?.[key];
          const netPerformingQuarterly = netPerformingData?.quarterly || Array(quarters).fill(0);
          const nonPerformingData = globalResults?.balanceSheet?.details?.nonPerformingAssets?.byProduct?.[key];
          const nonPerformingQuarterly = nonPerformingData?.quarterlyNPV || Array(quarters).fill(0);
          
          for (let q = 0; q < quarters; q++) {
            totalAssets[q] += (netPerformingQuarterly[q] || 0) + (nonPerformingQuarterly[q] || 0);
          }
        });
        
        for (let q = 0; q < quarters; q++) {
          const assets = totalAssets[q];
          const deposits = sightDeposits[q] + termDeposits[q];
          const equityAmount = equity[q] || 0;
          groupFunding[q] = assets - deposits - equityAmount;
        }
        
        // Sum all components
        for (let q = 0; q < quarters; q++) {
          totalLiabilities[q] = equity[q] + sightDeposits[q] + termDeposits[q] + groupFunding[q];
        }
        
        return totalLiabilities;
      })(),
      decimals: 2,
      isHeader: true,
      isSection: true,
      bgColor: '#f0f0f0',
      formula: 'Equity + Sight deposits + Term deposits + Group funding'
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

  return <FinancialTable title="1. Stato Patrimoniale (€M)" rows={transformedRows} />;
};

export default StandardBalanceSheet;