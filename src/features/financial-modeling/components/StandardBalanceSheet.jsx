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
  const divisionProducts = (() => {
    if (divisionName === 'tech') {
      // For Tech division, get products from techDivision.products
      console.log('🔍 Tech Products Debug:');
      console.log('  assumptions.techDivision:', assumptions.techDivision);
      console.log('  assumptions.techDivision.products:', assumptions.techDivision?.products);
      console.log('  assumptions.products (global):', assumptions.products);
      
      // Try techDivision.products first, then fall back to global products
      const techProducts = assumptions.techDivision?.products || {};
      const globalTechProducts = Object.entries(assumptions.products || {})
        .filter(([key]) => {
          const lowerKey = key.toLowerCase();
          return lowerKey === 'infrastructure' || 
                 lowerKey === 'softwarelicenses' || 
                 lowerKey === 'developmentprojects' ||
                 lowerKey === 'cloudservices' ||
                 lowerKey === 'maintenancesupport' ||
                 lowerKey === 'externalclients' ||
                 lowerKey === 'divisionexit';
        })
        .reduce((acc, [key, product]) => {
          acc[key] = product;
          return acc;
        }, {});
      
      console.log('  techProducts from division:', techProducts);
      console.log('  globalTechProducts filtered:', globalTechProducts);
      
      // Merge both sources, preferring techDivision.products
      return { ...globalTechProducts, ...techProducts };
    }
    
    // Original logic for other divisions
    return Object.entries(assumptions.products || {})
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
        }
        return lowerKey.startsWith(divisionName.toLowerCase());
      })
      .reduce((acc, [key, product]) => {
        acc[key] = product;
        return acc;
      }, {});
  })();

  // Temporary placeholder data
  const placeholderData = Array(quarters).fill(0);

  // Helper function to determine visualization level based on row label
  const getVisualizationLevel = (label) => {
    // Level 1 - Main aggregates
    const level1Items = ['TOTAL ASSETS', 'TOTAL LIABILITIES'];
    
    // Level 2 - Sub-aggregates
    const level2Items = [
      'Net Performing Assets',
      'Non-Performing Assets (NPV)',
      'Sight deposits',
      'Term deposits',
      'Equity',
      'Group funding'
    ];
    
    if (level1Items.includes(label)) return 1;
    if (level2Items.includes(label)) return 2;
    return 4; // Default to level 4 (white) for calculation rows
  };

  // Simplified Balance Sheet Rows - Hierarchical Structure
  const balanceSheetRows = [
    // ASSETS SECTION
    {
      label: 'TOTAL ASSETS',
      data: null, // Will be calculated from subRows
      decimals: 2,
      isSubTotal: true,
      visualizationLevel: 1,
      formula: null,
      subRows: [
        // For Treasury division, show consolidated working capital
        ...(divisionName === 'treasury' ? [
          {
            label: 'Central Cash',
            data: divisionResults?.centralCash?.quarterly || placeholderData,
            decimals: 2,
            isSubTotal: true,
            visualizationLevel: 2,
            formula: null
          },
          {
            label: 'Consolidated Working Capital',
            data: divisionResults?.consolidatedWorkingCapital?.total?.quarterly || placeholderData,
            decimals: 2,
            isSubTotal: true,
            visualizationLevel: 2,
            formula: null,
            subRows: showProductDetail ? [
              {
                label: '  Cash Requirements',
                data: divisionResults?.consolidatedWorkingCapital?.cash?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Accounts Receivable',
                data: divisionResults?.consolidatedWorkingCapital?.accountsReceivable?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Prepaid Expenses',
                data: divisionResults?.consolidatedWorkingCapital?.prepaidExpenses?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Accounts Payable',
                data: (() => {
                  const accPayable = divisionResults?.consolidatedWorkingCapital?.accountsPayable?.quarterly || [];
                  return accPayable.map(v => -Math.abs(v)); // Show as negative
                })(),
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Accrued Expenses',
                data: (() => {
                  const accruedExp = divisionResults?.consolidatedWorkingCapital?.accruedExpenses?.quarterly || [];
                  return accruedExp.map(v => -Math.abs(v)); // Show as negative
                })(),
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              }
            ] : []
          }
        ] : divisionName === 'tech' ? [
          {
            label: 'IT Infrastructure Assets',
            data: (() => {
              console.log('🔍 Tech Division Debug:');
              console.log('  divisionResults:', divisionResults);
              console.log('  techAssets:', divisionResults?.techAssets);
              console.log('  itInfrastructure:', divisionResults?.techAssets?.itInfrastructure);
              return divisionResults?.techAssets?.itInfrastructure?.netBookValue?.quarterly || placeholderData;
            })(),
            decimals: 2,
            isSubTotal: true,
            visualizationLevel: 2,
            formula: null,
            subRows: showProductDetail ? [
              {
                label: '  Gross Value',
                data: divisionResults?.techAssets?.itInfrastructure?.grossValue?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Accumulated Depreciation',
                data: (() => {
                  const accDep = divisionResults?.techAssets?.itInfrastructure?.accumulatedDepreciation?.quarterly || [];
                  return accDep.map(v => -Math.abs(v)); // Show as negative
                })(),
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              }
            ] : []
          },
          {
            label: 'Software Licenses (CAPEX)',
            data: divisionResults?.techAssets?.software?.netBookValue?.quarterly || placeholderData,
            decimals: 2,
            isSubTotal: true,
            visualizationLevel: 2,
            formula: null,
            subRows: showProductDetail ? [
              {
                label: '  Gross Value',
                data: divisionResults?.techAssets?.software?.grossValue?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Accumulated Depreciation',
                data: (() => {
                  const accDep = divisionResults?.techAssets?.software?.accumulatedDepreciation?.quarterly || [];
                  return accDep.map(v => -Math.abs(v)); // Show as negative
                })(),
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              }
            ] : []
          },
          {
            label: 'Development Projects',
            data: divisionResults?.techAssets?.developmentProjects?.netBookValue?.quarterly || placeholderData,
            decimals: 2,
            isSubTotal: true,
            visualizationLevel: 2,
            formula: null,
            subRows: showProductDetail ? [
              {
                label: '  Gross Value',
                data: divisionResults?.techAssets?.developmentProjects?.grossValue?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Accumulated Depreciation',
                data: (() => {
                  const accDep = divisionResults?.techAssets?.developmentProjects?.accumulatedDepreciation?.quarterly || [];
                  return accDep.map(v => -Math.abs(v)); // Show as negative
                })(),
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              }
            ] : []
          }
        ] : [
          // Net Performing Assets (for credit divisions)
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
            isSubTotal: true,
            visualizationLevel: 2,
            formula: null,
            subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
              label: `  ${product.name}`,
              data: (() => {
                const productData = globalResults?.balanceSheet?.details?.netPerformingAssets?.byProduct?.[key];
                return productData?.quarterly || Array(quarters).fill(0);
              })(),
              decimals: 2,
              isDetail: true,
              visualizationLevel: 5,
              formula: null
            })) : []
          },
          // Non-Performing Assets
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
            isSubTotal: true,
            visualizationLevel: 2,
            formula: null,
            subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
              label: `  ${product.name}`,
              data: (() => {
                const productData = globalResults?.balanceSheet?.details?.nonPerformingAssets?.byProduct?.[key];
                return productData?.quarterlyNPV || Array(quarters).fill(0);
              })(),
              decimals: 2,
              isDetail: true,
              visualizationLevel: 5,
              formula: null
            })) : []
          }
        ])
      ]
    },
    
    // LIABILITIES SECTION
    {
      label: 'TOTAL LIABILITIES',
      data: null, // Will be calculated from subRows
      decimals: 2,
      isSubTotal: true,
      visualizationLevel: 1,
      formula: null,
      subRows: [
        // Sight deposits
        {
          label: 'Sight deposits',
          data: (() => {
            if (divisionResults?.bs?.quarterly?.sightDeposits) {
              return divisionResults.bs.quarterly.sightDeposits;
            }
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
          isSubTotal: true,
          visualizationLevel: 2,
          formula: null,
          subRows: showProductDetail && divisionName === 'digital' ? Object.entries(divisionProducts).map(([key, product]) => ({
            label: `  ${product.name}`,
            data: (() => {
              const sightDeposits = divisionResults?.liabilities?.sightDeposits?.byProduct?.[key];
              return sightDeposits?.quarterly || Array(quarters).fill(0);
            })(),
            decimals: 2,
            isDetail: true,
            visualizationLevel: 5,
            formula: null
          })) : []
        },
        // Term deposits
        {
          label: 'Term deposits',
          data: (() => {
            if (divisionResults?.bs?.quarterly?.termDeposits) {
              return divisionResults.bs.quarterly.termDeposits;
            }
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
          isSubTotal: true,
          visualizationLevel: 2,
          formula: null,
          subRows: showProductDetail && divisionName === 'digital' ? Object.entries(divisionProducts).map(([key, product]) => ({
            label: `  ${product.name}`,
            data: (() => {
              const termDeposits = divisionResults?.liabilities?.termDeposits?.byProduct?.[key];
              return termDeposits?.total?.quarterly || Array(quarters).fill(0);
            })(),
            decimals: 2,
            isDetail: true,
            visualizationLevel: 5,
            formula: null
          })) : []
        },
        // Equity
        {
          label: 'Equity',
          data: divisionResults?.bs?.quarterly?.equity ?? placeholderData,
          decimals: 2,
          isSubTotal: true,
          visualizationLevel: 2,
          formula: null
        },
        // Group funding
        {
          label: 'Group funding',
          data: (() => {
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
            
            const sightDeposits = divisionResults?.bs?.quarterly?.sightDeposits || Array(quarters).fill(0);
            const termDeposits = divisionResults?.bs?.quarterly?.termDeposits || Array(quarters).fill(0);
            const equity = divisionResults?.bs?.quarterly?.equity || Array(quarters).fill(0);
            
            for (let q = 0; q < quarters; q++) {
              const assets = totalAssets[q];
              const deposits = sightDeposits[q] + termDeposits[q];
              const equityAmount = equity[q] || 0;
              groupFunding[q] = assets - deposits - equityAmount;
            }
            
            return groupFunding;
          })(),
          decimals: 2,
          isSubTotal: true,
          visualizationLevel: 2,
          formula: null
        }
      ]
    },
    
    // SPACER
    {
      label: '',
      data: Array(quarters).fill(null),
      decimals: 0,
      isSpacer: true,
      formula: null
    },
    
    // EXIT STRATEGY SECTION (only for Tech division)
    ...(divisionName === 'tech' && divisionResults?.exitStrategy ? [{
      label: 'EXIT STRATEGY IMPACT',
      data: null,
      decimals: 2,
      isSubTotal: true,
      visualizationLevel: 1,
      formula: null,
      subRows: [
        {
          label: `Exit Year`,
          data: (() => {
            const exitYear = divisionResults.exitStrategy.exitYear;
            const exitQuarter = divisionResults.exitStrategy.exitQuarter;
            const data = new Array(quarters).fill(null);
            if (exitQuarter < quarters) {
              data[exitQuarter] = exitYear;
            }
            return data;
          })(),
          decimals: 0,
          visualizationLevel: 3,
          formula: null
        },
        {
          label: `Exit Percentage`,
          data: (() => {
            const exitPercentage = divisionResults.exitStrategy.exitPercentage * 100;
            const exitQuarter = divisionResults.exitStrategy.exitQuarter;
            const data = new Array(quarters).fill(null);
            if (exitQuarter < quarters) {
              data[exitQuarter] = exitPercentage;
            }
            return data;
          })(),
          decimals: 0,
          suffix: '%',
          visualizationLevel: 3,
          formula: null
        },
        {
          label: 'Assets Transferred',
          data: divisionResults.exitStrategy.assetsTransferred?.quarterly || placeholderData,
          decimals: 2,
          visualizationLevel: 2,
          formula: null
        },
        {
          label: 'Retained Assets',
          data: divisionResults.exitStrategy.retainedAssets?.quarterly || placeholderData,
          decimals: 2,
          visualizationLevel: 2,
          formula: null
        },
        {
          label: 'Exit Valuation (Calculated)',
          data: (() => {
            const exitQuarter = divisionResults.exitStrategy?.exitQuarter || -1;
            const data = new Array(quarters).fill(null);
            if (exitQuarter >= 0 && exitQuarter < quarters) {
              // Get from P&L results if available
              const exitGain = divisionResults.techPnLResults?.exitGain;
              if (exitGain?.breakdown?.valuation) {
                data[exitQuarter] = exitGain.breakdown.valuation.totalValuation;
              } else {
                // Fallback calculation
                const annualRevenue = 50; // This should come from actual revenue
                const multiple = assumptions?.products?.divisionExit?.valuationMultiple || 2.5;
                data[exitQuarter] = annualRevenue * multiple;
              }
            }
            return data;
          })(),
          decimals: 2,
          visualizationLevel: 3,
          formula: null
        },
        {
          label: 'Cash Proceeds (100% at Closing)',
          data: (() => {
            const exitQuarter = divisionResults.exitStrategy?.exitQuarter || -1;
            const data = new Array(quarters).fill(null);
            if (exitQuarter >= 0 && exitQuarter < quarters) {
              // Get from P&L calculations if available
              const exitGain = divisionResults.techPnLResults?.exitGain;
              if (exitGain?.breakdown?.proceeds) {
                data[exitQuarter] = exitGain.breakdown.proceeds.total;
              } else {
                // Fallback: use exit strategy data
                const exitPercentage = divisionResults.exitStrategy?.exitPercentage || 0.4;
                const annualRevenue = 50;
                const multiple = assumptions?.products?.divisionExit?.valuationMultiple || 2.5;
                const valuation = annualRevenue * multiple;
                data[exitQuarter] = valuation * exitPercentage; // 100% immediate payment
              }
            }
            return data;
          })(),
          decimals: 2,
          visualizationLevel: 2,
          formula: null
        }
      ]
    }] : []),
    
    // DEBUG SECTION - Collapsed by default
    {
      label: 'DEBUG SECTION',
      data: null,
      decimals: 2,
      isSubTotal: true,
      visualizationLevel: 3,
      formula: null,
      isCollapsedByDefault: true, // This will be used by FinancialTable
      subRows: [
        // Tech-specific debug rows
        ...(divisionName === 'tech' ? [
          {
            label: 'Quarterly Depreciation',
            data: divisionResults?.depreciation?.quarterly || placeholderData,
            decimals: 2,
            visualizationLevel: 4,
            formula: null
          },
          {
            label: 'Total IT Assets (NBV)',
            data: divisionResults?.techAssets?.total?.netBookValue?.quarterly || placeholderData,
            decimals: 2,
            visualizationLevel: 4,
            formula: null
          },
          {
            label: 'Working Capital Requirements (Treasury-Managed)',
            data: divisionResults?.operationalRequirements?.cashRequirements?.quarterly || placeholderData,
            decimals: 2,
            visualizationLevel: 4,
            formula: null,
            subRows: showProductDetail ? [
              {
                label: '  Cash Needs',
                data: divisionResults?.operationalRequirements?.workingCapitalNeeds?.cash?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Receivables Cycle',
                data: divisionResults?.operationalRequirements?.workingCapitalNeeds?.accountsReceivable?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Prepaid Expenses',
                data: divisionResults?.operationalRequirements?.workingCapitalNeeds?.prepaidExpenses?.quarterly || placeholderData,
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              }
            ] : []
          },
          {
            label: 'Post-Exit External Revenue Potential',
            data: (() => {
              const exitQuarter = divisionResults?.exitStrategy?.exitQuarter || 20;
              const data = new Array(quarters).fill(0);
              
              // Calculate potential revenue from external clients post-exit
              const clientsGrowth = [0, 0, 2, 5, 10, 15, 20, 25, 30, 35]; // From products config
              const setupFee = 0.5; // €M per client
              const annualFee = 2.0; // €M per client per year
              
              for (let q = exitQuarter; q < quarters; q++) {
                const year = Math.floor(q / 4);
                if (year < clientsGrowth.length) {
                  const clients = clientsGrowth[year] || 0;
                  const quarterlyRevenue = (clients * annualFee) / 4;
                  data[q] = quarterlyRevenue;
                }
              }
              
              return data;
            })(),
            decimals: 2,
            visualizationLevel: 4,
            formula: null
          },
          {
            label: 'Post-Exit Service Contract Revenue',
            data: (() => {
              const exitQuarter = divisionResults?.exitStrategy?.exitQuarter || 20;
              const data = new Array(quarters).fill(0);
              
              // Get contract parameters from user inputs
              const contractConfig = assumptions?.techDivision?.products?.divisionExit?.postExitServiceContract;
              const baseAnnualFee = contractConfig?.annualFee || 50; // User input or default
              const growthRate = (contractConfig?.annualGrowthRate || 3) / 100; // Convert % to decimal
              const contractDuration = contractConfig?.contractDuration || 10; // Contract duration in years
              const initialFee = contractConfig?.initialFee || 10; // One-time setup fee
              
              // Calculate contract revenue post-exit
              for (let q = exitQuarter; q < quarters; q++) {
                const yearsFromExit = Math.floor((q - exitQuarter) / 4);
                
                // Add initial fee in the exit quarter
                if (q === exitQuarter) {
                  data[q] += initialFee;
                }
                
                // Only generate recurring revenue during contract duration
                if (yearsFromExit < contractDuration) {
                  const annualFee = baseAnnualFee * Math.pow(1 + growthRate, yearsFromExit);
                  data[q] += annualFee / 4; // Quarterly recurring
                }
              }
              
              return data;
            })(),
            decimals: 2,
            visualizationLevel: 4,
            formula: null,
            subRows: showProductDetail ? [
              {
                label: '  Initial Setup Fee',
                data: (() => {
                  const exitQuarter = divisionResults?.exitStrategy?.exitQuarter || 20;
                  const contractConfig = assumptions?.techDivision?.products?.divisionExit?.postExitServiceContract;
                  const initialFee = contractConfig?.initialFee || 10;
                  const data = new Array(quarters).fill(0);
                  if (exitQuarter < quarters) {
                    data[exitQuarter] = initialFee;
                  }
                  return data;
                })(),
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              },
              {
                label: '  Annual Recurring Revenue',
                data: (() => {
                  const exitQuarter = divisionResults?.exitStrategy?.exitQuarter || 20;
                  const data = new Array(quarters).fill(0);
                  
                  const contractConfig = assumptions?.techDivision?.products?.divisionExit?.postExitServiceContract;
                  const baseAnnualFee = contractConfig?.annualFee || 50;
                  const growthRate = (contractConfig?.annualGrowthRate || 3) / 100;
                  const contractDuration = contractConfig?.contractDuration || 10;
                  
                  for (let q = exitQuarter; q < quarters; q++) {
                    const yearsFromExit = Math.floor((q - exitQuarter) / 4);
                    if (yearsFromExit < contractDuration) {
                      const annualFee = baseAnnualFee * Math.pow(1 + growthRate, yearsFromExit);
                      data[q] = annualFee / 4;
                    }
                  }
                  
                  return data;
                })(),
                decimals: 2,
                isDetail: true,
                visualizationLevel: 5,
                formula: null
              }
            ] : []
          }
        ] : [
          {
            label: 'New Loan Volumes',
            data: divisionResults?.bs?.quarterly?.newVolumes ?? placeholderData,
            decimals: 2,
            visualizationLevel: 4,
            formula: null,
            subRows: showProductDetail ? Object.entries(productResults || {}).map(([key, product]) => ({
              label: `  ${product.name || product.productName || key}`,
              data: product?.bs?.quarterly?.newVolumes || Array(quarters).fill(0),
              decimals: 2,
              isDetail: true,
              visualizationLevel: 3,
              formula: null
            })) : []
          },
        ]),
        {
          label: 'Principal Repayments',
          data: divisionResults?.bs?.quarterly?.repayments ?? placeholderData,
          decimals: 2,
          visualizationLevel: 4,
          formula: null,
          subRows: showProductDetail ? Object.entries(productResults || {}).map(([key, product]) => ({
            label: `  ${product.name || product.productName || key}`,
            data: product?.bs?.quarterly?.repayments || Array(quarters).fill(0),
            decimals: 2,
            isDetail: true,
            visualizationLevel: 3,
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
          visualizationLevel: 4,
          formula: null,
          subRows: showProductDetail ? Object.entries(productResults || {}).map(([key, product]) => ({
            label: `  ${product.name || product.productName || key}`,
            data: product?.quarterly?.totalStock || Array(quarters).fill(0),
            decimals: 2,
            isDetail: true,
            visualizationLevel: 3,
            formula: null
          })) : []
        },
        {
          label: 'Defaults',
          data: divisionResults?.bs?.quarterly?.defaults ?? placeholderData,
          decimals: 2,
          visualizationLevel: 4,
          formula: null,
          subRows: showProductDetail ? Object.entries(productResults || {}).map(([key, product]) => ({
            label: `  ${product.name || product.productName || key}`,
            data: product?.bs?.quarterly?.defaults || Array(quarters).fill(0),
            decimals: 2,
            isDetail: true,
            visualizationLevel: 3,
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
          visualizationLevel: 4,
          formula: null,
          subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
            label: `  ${product.name}`,
            data: (() => {
              const productData = globalResults?.balanceSheet?.details?.stockNBVPerforming?.byProduct?.[key];
              return productData?.quarterly || Array(quarters).fill(0);
            })(),
            decimals: 2,
            isDetail: true,
            visualizationLevel: 3,
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
          visualizationLevel: 4,
          formula: null,
          subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
            label: `  ${product.name}`,
            data: (() => {
              const productData = globalResults?.balanceSheet?.details?.eclProvision?.byProduct?.[key];
              if (productData?.quarterlyProvision) {
                return productData.quarterlyProvision.map(v => -v); // ECL should be negative
              }
              return Array(quarters).fill(0);
            })(),
            decimals: 2,
            isDetail: true,
            visualizationLevel: 3,
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
          visualizationLevel: 4,
          formula: null,
          subRows: showProductDetail ? Object.entries(divisionProducts).map(([key, product]) => ({
            label: `  ${product.name}`,
            data: (() => {
              const productData = globalResults?.balanceSheet?.details?.stockNBVPerformingPostECL?.byProduct?.[key];
              return productData?.quarterly || Array(quarters).fill(0);
            })(),
            decimals: 2,
            isDetail: true,
            visualizationLevel: 3,
            formula: null
          })) : []
        }
      ]
    },
  ];

  // Transform and filter rows recursively
  const transformAndFilterRows = (rows) => {
    return rows.map(row => {
      const transformation = customRowTransformations[row.label];
      const baseRow = transformation ? { ...row, ...transformation } : row;
      
      // Apply visualization level only if not already set
      const transformedRow = {
        ...baseRow,
        visualizationLevel: baseRow.visualizationLevel || getVisualizationLevel(baseRow.label)
      };
      
      // If row has subRows, transform and filter them recursively
      if (transformedRow.subRows) {
        transformedRow.subRows = transformAndFilterRows(transformedRow.subRows);
        
        // Calculate sum if row has null data and subRows
        if (transformedRow.data === null && transformedRow.subRows.length > 0) {
          const sumData = new Array(quarters).fill(0);
          transformedRow.subRows.forEach(subRow => {
            if (subRow.data && Array.isArray(subRow.data)) {
              subRow.data.forEach((value, index) => {
                sumData[index] += (value || 0);
              });
            }
          });
          transformedRow.data = sumData;
        }
      }
      
      return transformedRow;
    });
  };
  
  const transformedRows = transformAndFilterRows(balanceSheetRows);

  return <FinancialTable title="1. Stato Patrimoniale" rows={transformedRows} />;
};

export default StandardBalanceSheet;