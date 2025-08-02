import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../../components/shared/formatters';
import { createFormula, createAggregateFormula } from '../../../components/tooltip-system';

/**
 * Standardized Balance Sheet structure for all divisions
 * Following the exact schema provided
 */
// Helper function to calculate quarterly volumes from product data
// Helper to ensure array has correct length
const ensureQuarterlyArray = (data, quarters) => {
  if (!data) return Array(quarters).fill(0);
  if (data.length >= quarters) return data;
  return [...data, ...Array(quarters - data.length).fill(0)];
};

const calculateProductVolumes = (product, assumptions) => {
  const quarters = 40;
  const quarterlyVolumes = new Array(quarters).fill(0);
  
  // Get yearly volumes - check for volumes in originalProduct or at root level
  const yearlyVolumes = [];
  const volumeSource = product.originalProduct || product;
  
  for (let i = 0; i < 10; i++) {
    let volume = 0;
    
    // Try different volume sources
    if (volumeSource.volumeArray && Array.isArray(volumeSource.volumeArray)) {
      volume = volumeSource.volumeArray[i] || 0;
    } else if (volumeSource.volumes) {
      const yearKey = `y${i + 1}`;
      volume = volumeSource.volumes[yearKey] || 0;
    } else {
      // Try direct year properties
      const yearKey = `y${i + 1}`;
      volume = volumeSource[yearKey] || 0;
    }
    
    yearlyVolumes.push(volume);
  }
  
  // Distribute across quarters
  yearlyVolumes.forEach((yearVolume, year) => {
    if (yearVolume > 0) {
      const quarterlyAllocation = product.quarterlyAllocation || 
                                  assumptions.quarterlyAllocation || 
                                  [25, 25, 25, 25];
      
      quarterlyAllocation.forEach((percentage, quarter) => {
        const quarterIndex = year * 4 + quarter;
        if (quarterIndex < quarters) {
          quarterlyVolumes[quarterIndex] = yearVolume * percentage / 100;
        }
      });
    }
  });
  
  return quarterlyVolumes;
};

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

  // DEBUG: Log what we receive for Balance Sheet
  console.log('🏦 StandardBalanceSheet - Data received:', {
    divisionName,
    productResultsKeys: Object.keys(productResults || {}),
    showProductDetail,
    hasProductResults: !!productResults,
    productResultsCount: Object.keys(productResults || {}).length
  });
  
  // DEBUG: Log each product and its filtering status
  Object.entries(productResults || {}).forEach(([key, product]) => {
    const passesFilter = product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
    console.log(`  - Product ${key}: ${product.name}`, {
      productType: product.productType,
      type: product.type,
      passesFilter,
      hasQuarterly: !!product.quarterly
    });
  });

  // Use quarterly data directly (40 quarters)
  const performingAssets = divisionResults.bs.quarterly?.performingAssets ?? Array(quarters).fill(0);
  const nonPerformingAssets = divisionResults.bs.quarterly?.nonPerformingAssets ?? Array(quarters).fill(0);
  const allocatedEquity = divisionResults.bs.quarterly?.allocatedEquity ?? Array(quarters).fill(0);
  
  const totalAssets = performingAssets.map((pa, i) => 
    pa + nonPerformingAssets[i]
  );

  // Calculate derived values
  const totalLiabilities = totalAssets.map((ta, i) => ta - allocatedEquity[i]);

  // Breakdown of liabilities using configured funding mix
  const fundingMix = assumptions.fundingMix || { sightDeposits: 40, termDeposits: 40, groupFunding: 20 };
  const sightDeposits = totalLiabilities.map(tl => tl * (fundingMix.sightDeposits / 100));
  const termDeposits = totalLiabilities.map(tl => tl * (fundingMix.termDeposits / 100));
  const groupFunding = totalLiabilities.map(tl => tl * (fundingMix.groupFunding / 100));

  // Variables removed - now calculated directly from product details in each section
  
  // Try to get product-level data from multiple possible locations
  const volumesByProduct = globalResults?.bs?.details?.newVolumesByProduct || {};
  const repaymentsByProduct = globalResults?.bs?.details?.repaymentsByProduct || {};
  

  // Helper function to calculate totals from product details
  const calculateTotalFromProducts = (productResults, dataExtractor, quarterIndex) => {
    return Object.entries(productResults || {})
      .filter(([key, product]) => {
        return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
      })
      .reduce((sum, [key, product]) => {
        const data = dataExtractor(key, product);
        return sum + (data[quarterIndex] || 0);
      }, 0);
  };

  // Balance Sheet Rows following the exact schema
  const balanceSheetRows = [
    // ========== ASSETS SECTION ==========
    // STEP 1: New Loan Volumes (Inflows)
    {
      label: 'New Loan Volumes',
      data: Array(quarters).fill(0).map((_, i) => 
        calculateTotalFromProducts(productResults, (key, product) => {
          if (volumesByProduct[key]?.quarterlyVolumes) {
            return volumesByProduct[key].quarterlyVolumes;
          } else if (product.quarterly?.newBusiness) {
            return product.quarterly.newBusiness;
          } else {
            return calculateProductVolumes(product, assumptions);
          }
        }, i)
      ),
      decimals: 0,
      isPositive: true,
      isHeader: true,
      formula: Array(quarters).fill(0).map((_, i) => createFormula(
        i,
        'New credit disbursements this quarter',
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const volData = volumesByProduct[key];
          const quarterlyVolumes = volData?.quarterlyVolumes || calculateProductVolumes(product, assumptions);
          return {
            name: product.name || key,
            value: quarterlyVolumes[i] || 0,
            unit: '€M',
            calculation: 'New loans disbursed'
          };
        }),
        () => {
          const total = calculateTotalFromProducts(productResults, (key, product) => {
            if (volumesByProduct[key]?.quarterlyVolumes) {
              return volumesByProduct[key].quarterlyVolumes;
            } else if (product.quarterly?.newBusiness) {
              return product.quarterly.newBusiness;
            } else {
              return calculateProductVolumes(product, assumptions);
            }
          }, i);
          return `Total new volumes: ${formatNumber(total, 0)} €M`;
        }
      )),
      // Add product breakdown
      subRows: showProductDetail ? 
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          // Try multiple sources for volume data
          let quarterlyVolumes = Array(quarters).fill(0);
          
          // 1. Try volumesByProduct from microservice
          if (volumesByProduct[key]?.quarterlyVolumes) {
            quarterlyVolumes = volumesByProduct[key].quarterlyVolumes;
          }
          // 2. Try product.quarterly.newBusiness (if available)
          else if (product.quarterly?.newBusiness) {
            quarterlyVolumes = product.quarterly.newBusiness;
          }
          // 3. Calculate from product configuration
          else {
            quarterlyVolumes = calculateProductVolumes(product, assumptions);
          }
          
          return {
            label: `o/w ${product.name || key}`,
            data: quarterlyVolumes,
            decimals: 0,
            isPositive: true,
            isSubItem: true
          };
        }) : []
    },
    
    // STEP 2: Principal Repayments (Outflows)
    {
      label: 'Principal Repayments',
      data: Array(quarters).fill(0).map((_, i) => {
        const total = calculateTotalFromProducts(productResults, (key, product) => {
          if (repaymentsByProduct[key]?.quarterlyRepayments) {
            return repaymentsByProduct[key].quarterlyRepayments;
          } else if (product.quarterly?.principalRepayments) {
            return product.quarterly.principalRepayments;
          } else if (product.quarterly?.repayments) {
            return product.quarterly.repayments;
          } else if (product.quarterly?.performingStock) {
            // Calculate repayments from stock changes
            const quarterlyRepayments = Array(quarters).fill(0);
            const stock = product.quarterly.performingStock;
            const newBusiness = product.quarterly?.newBusiness || Array(quarters).fill(0);
            const defaults = product.quarterly?.defaults || Array(quarters).fill(0);
            
            for (let q = 1; q < quarters; q++) {
              const stockChange = stock[q] - stock[q-1];
              const repayment = newBusiness[q] - defaults[q] - stockChange;
              quarterlyRepayments[q] = Math.max(0, repayment);
            }
            return quarterlyRepayments;
          }
          return Array(quarters).fill(0);
        }, i);
        return -Math.abs(total); // Ensure negative display
      }),
      decimals: 0,
      isHeader: true,
      formula: Array(quarters).fill(0).map((_, i) => createFormula(
        i,
        'Principal repayments this quarter',
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const repData = repaymentsByProduct[key];
          const quarterlyRepayments = repData?.quarterlyRepayments || Array(40).fill(0);
          return {
            name: product.name || key,
            value: quarterlyRepayments[i] || 0,
            unit: '€M',
            calculation: 'Principal repaid'
          };
        }),
        () => {
          const total = calculateTotalFromProducts(productResults, (key, product) => {
            if (repaymentsByProduct[key]?.quarterlyRepayments) {
              return repaymentsByProduct[key].quarterlyRepayments;
            } else if (product.quarterly?.principalRepayments) {
              return product.quarterly.principalRepayments;
            } else if (product.quarterly?.repayments) {
              return product.quarterly.repayments;
            } else if (product.quarterly?.performingStock) {
              const quarterlyRepayments = Array(quarters).fill(0);
              const stock = product.quarterly.performingStock;
              const newBusiness = product.quarterly?.newBusiness || Array(quarters).fill(0);
              const defaults = product.quarterly?.defaults || Array(quarters).fill(0);
              
              for (let q = 1; q < quarters; q++) {
                const stockChange = stock[q] - stock[q-1];
                const repayment = newBusiness[q] - defaults[q] - stockChange;
                quarterlyRepayments[q] = Math.max(0, repayment);
              }
              return quarterlyRepayments;
            }
            return Array(quarters).fill(0);
          }, i);
          return `Total repayments: ${formatNumber(total, 0)} €M`;
        }
      )),
      // Add product breakdown
      subRows: showProductDetail ?
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          // Try multiple sources for repayment data
          let quarterlyRepayments = Array(quarters).fill(0);
          
          // 1. Try repaymentsByProduct from microservice
          if (repaymentsByProduct[key]?.quarterlyRepayments) {
            quarterlyRepayments = repaymentsByProduct[key].quarterlyRepayments;
          }
          // 2. Try product.quarterly.principalRepayments (if available)
          else if (product.quarterly?.principalRepayments) {
            quarterlyRepayments = product.quarterly.principalRepayments;
          }
          // 3. Try product.quarterly.repayments (alternative name)
          else if (product.quarterly?.repayments) {
            quarterlyRepayments = product.quarterly.repayments;
          }
          // 4. Check if we have stock changes to infer repayments
          else if (product.quarterly?.performingStock) {
            // Calculate repayments from stock changes + new business - defaults
            const stock = product.quarterly.performingStock;
            const newBusiness = product.quarterly?.newBusiness || Array(quarters).fill(0);
            const defaults = product.quarterly?.defaults || Array(quarters).fill(0);
            
            for (let q = 1; q < quarters; q++) {
              const stockChange = stock[q] - stock[q-1];
              const repayment = newBusiness[q] - defaults[q] - stockChange;
              quarterlyRepayments[q] = Math.max(0, repayment);
            }
          }
          
          return {
            label: `o/w ${product.name || key}`,
            data: quarterlyRepayments.map(r => -Math.abs(r)),
            decimals: 0,
            isSubItem: true
          };
        }) : []
    },
    
    // Separator
    { isSeparator: true },
    
    // STEP 3: Total Assets (NBV)
    {
      label: 'Stock NBV',
      data: Array(quarters).fill(0).map((_, i) => 
        calculateTotalFromProducts(productResults, (key, product) => {
          const totalAssetsData = globalResults?.bs?.details?.totalAssetsNBV;
          const productNBV = totalAssetsData?.byProduct?.[key];
          return productNBV?.quarterlyNBV || Array(quarters).fill(0);
        }, i)
      ),
      decimals: 0,
      isHeader: true,
      formula: Array(quarters).fill(0).map((_, i) => {
        const total = calculateTotalFromProducts(productResults, (key, product) => {
          const totalAssetsData = globalResults?.bs?.details?.totalAssetsNBV;
          const productNBV = totalAssetsData?.byProduct?.[key];
          return productNBV?.quarterlyNBV || Array(quarters).fill(0);
        }, i);
        
        return createFormula(
          i,
          'Sum of all loan types at gross book value',
          Object.entries(productResults || {}).filter(([key, product]) => {
            return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
          }).map(([key, product]) => {
            const totalAssetsData = globalResults?.bs?.details?.totalAssetsNBV;
            const productNBV = totalAssetsData?.byProduct?.[key];
            const quarterlyNBV = productNBV?.quarterlyNBV || Array(quarters).fill(0);
            return {
              name: product.name || key,
              value: quarterlyNBV[i] || 0,
              unit: '€M',
              calculation: 'Outstanding principal'
            };
          }),
          () => `Total Stock NBV: ${formatNumber(total, 0)} €M`
        );
      }),
      // Add product breakdown as subRows
      subRows: showProductDetail ? 
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          // Get NBV data from totalAssetsNBV.byProduct
          const totalAssetsData = globalResults?.bs?.details?.totalAssetsNBV;
          const productNBV = totalAssetsData?.byProduct?.[key];
          const quarterlyNBV = productNBV?.quarterlyNBV || Array(quarters).fill(0);
          
          return {
            label: `o/w ${product.name || key}`,
            data: quarterlyNBV,
            decimals: 0
          };
        }) : []
    },
    
    // Separator  
    { isSeparator: true },
    
    // STEP 4: GBV Defaulted (applying danger rate at default timing)
    {
      label: 'GBV Defaulted',
      data: Array(quarters).fill(0).map((_, i) => 
        calculateTotalFromProducts(productResults, (key, product) => {
          const gbvDefaultedData = globalResults?.bs?.details?.gbvDefaulted;
          const productGbvDefaulted = gbvDefaultedData?.byProduct?.[key];
          return productGbvDefaulted?.quarterlyGrossNPL || Array(quarters).fill(0);
        }, i)
      ),
      decimals: 0,
      isHeader: true,
      formula: Array(quarters).fill(0).map((_, i) => {
        const total = calculateTotalFromProducts(productResults, (key, product) => {
          const gbvDefaultedData = globalResults?.bs?.details?.gbvDefaulted;
          const productGbvDefaulted = gbvDefaultedData?.byProduct?.[key];
          return productGbvDefaulted?.quarterlyGrossNPL || Array(quarters).fill(0);
        }, i);
        
        return createFormula(
        i,
        'Stock GBV × Danger Rate at Default Timing',
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const gbvDefaultedData = globalResults?.bs?.details?.gbvDefaulted;
          const productGbvDefaulted = gbvDefaultedData?.byProduct?.[key];
          return {
            name: product.name || key,
            value: productGbvDefaulted?.quarterlyGrossNPL?.[i] || 0,
            unit: '€M',
            calculation: `Danger Rate: ${(product.dangerRate || 1.5).toFixed(1)}% annual`
          };
        }),
        () => `Total Gross NPL: ${formatNumber(total, 0)} €M`
        );
      }),
      // Add product breakdown
      subRows: showProductDetail ? 
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const gbvDefaultedData = globalResults?.bs?.details?.gbvDefaulted;
          const productGbvDefaulted = gbvDefaultedData?.byProduct?.[key];
          const quarterlyGbvDefaulted = productGbvDefaulted?.quarterlyGrossNPL || Array(quarters).fill(0);
          
          return {
            label: `o/w ${product.name || key}`,
            data: quarterlyGbvDefaulted,
            decimals: 0,
            isSubItem: true
          };
        }) : []
    },
    
    // STEP 5: Stock NBV Performing (NEW)
    {
      label: 'Stock NBV Performing',
      data: Array(quarters).fill(0).map((_, i) => 
        calculateTotalFromProducts(productResults, (key, product) => {
          const stockNBVPerformingData = globalResults?.bs?.details?.stockNBVPerforming;
          const productStockNBVPerforming = stockNBVPerformingData?.byProduct?.[key];
          return productStockNBVPerforming?.quarterly || Array(quarters).fill(0);
        }, i)
      ),
      decimals: 0,
      isHeader: true,
      formula: Array(quarters).fill(0).map((_, i) => {
        const total = calculateTotalFromProducts(productResults, (key, product) => {
          const stockNBVPerformingData = globalResults?.bs?.details?.stockNBVPerforming;
          const productStockNBVPerforming = stockNBVPerformingData?.byProduct?.[key];
          return productStockNBVPerforming?.quarterly || Array(quarters).fill(0);
        }, i);
        
        return createFormula(
          i,
          'Stock NBV - GBV Defaulted Cumulativo',
          Object.entries(productResults || {}).filter(([key, product]) => {
            return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
          }).map(([key, product]) => {
            const stockNBVPerformingData = globalResults?.bs?.details?.stockNBVPerforming;
            const productStockNBVPerforming = stockNBVPerformingData?.byProduct?.[key];
            return {
              name: product.name || key,
              value: productStockNBVPerforming?.quarterly?.[i] || 0,
              unit: '€M',
              calculation: 'Performing loans at book value'
            };
          }),
          () => `Total Stock NBV Performing: ${formatNumber(total, 0)} €M`
        );
      }),
      // Add product breakdown
      subRows: showProductDetail ? 
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const stockNBVPerformingData = globalResults?.bs?.details?.stockNBVPerforming;
          const productStockNBVPerforming = stockNBVPerformingData?.byProduct?.[key];
          const quarterlyStockNBVPerforming = productStockNBVPerforming?.quarterly || Array(quarters).fill(0);
          
          return {
            label: `o/w ${product.name || key}`,
            data: quarterlyStockNBVPerforming,
            decimals: 0,
            isSubItem: true
          };
        }) : []
    },
    
    // STEP 6: Recovery on Defaulted Assets
    {
      label: 'Recovery on Defaulted Assets',
      data: Array(quarters).fill(0).map((_, i) => 
        calculateTotalFromProducts(productResults, (key, product) => {
          const recoveryData = globalResults?.bs?.details?.recoveryOnDefaultedAssets;
          const productRecovery = recoveryData?.byProduct?.[key];
          return productRecovery?.quarterly || Array(quarters).fill(0);
        }, i)
      ),
      decimals: 0,
      isHeader: true,
      isPositive: true,
      formula: Array(quarters).fill(0).map((_, i) => {
        const total = calculateTotalFromProducts(productResults, (key, product) => {
          const recoveryData = globalResults?.bs?.details?.recoveryOnDefaultedAssets;
          const productRecovery = recoveryData?.byProduct?.[key];
          return productRecovery?.quarterly || Array(quarters).fill(0);
        }, i);
        
        return createFormula(
        i,
        'Expected recovery from collateral and state guarantees on defaulted loans',
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const recoveryData = globalResults?.bs?.details?.recoveryOnDefaultedAssets;
          const productRecovery = recoveryData?.byProduct?.[key];
          return {
            name: product.name || key,
            value: productRecovery?.quarterly?.[i] || 0,
            unit: '€M',
            calculation: `Recovery rate: ${((productRecovery?.fullResults?.metrics?.averageRecoveryRate || 0)).toFixed(1)}%`
          };
        }),
        () => `Total Recovery: ${formatNumber(total, 0)} €M`
        );
      }),
      // Add product breakdown
      subRows: showProductDetail ? 
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const recoveryData = globalResults?.bs?.details?.recoveryOnDefaultedAssets;
          const productRecovery = recoveryData?.byProduct?.[key];
          const quarterlyRecovery = productRecovery?.quarterly || Array(quarters).fill(0);
          
          return {
            label: `o/w ${product.name || key}`,
            data: quarterlyRecovery,
            decimals: 0,
            isSubItem: true,
            isPositive: true
          };
        }) : []
    },
    
    // STEP 7: Non-Performing Assets
    {
      label: 'Non-Performing Assets',
      data: Array(quarters).fill(0).map((_, i) => 
        calculateTotalFromProducts(productResults, (key, product) => {
          const npaData = globalResults?.bs?.details?.nonPerformingAssets;
          const productNPA = npaData?.byProduct?.[key];
          return productNPA?.quarterlyNPV || Array(quarters).fill(0);
        }, i)
      ),
      decimals: 0,
      isHeader: true,
      formula: Array(quarters).fill(0).map((_, i) => {
        const total = calculateTotalFromProducts(productResults, (key, product) => {
          const npaData = globalResults?.bs?.details?.nonPerformingAssets;
          const productNPA = npaData?.byProduct?.[key];
          return productNPA?.quarterlyNPV || Array(quarters).fill(0);
        }, i);
        
        return createFormula(
        i,
        'Net Present Value of expected recoveries on defaulted loans',
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const npaData = globalResults?.bs?.details?.nonPerformingAssets;
          const productNPA = npaData?.byProduct?.[key];
          const discountRate = productNPA?.discountRate || (product.spread + (assumptions.euribor || 3.5));
          return {
            name: product.name || key,
            value: productNPA?.quarterlyNPV?.[i] || 0,
            unit: '€M',
            calculation: `Discount rate: ${discountRate.toFixed(2)}% (Spread + Euribor)`
          };
        }),
        () => `Total NPV: ${formatNumber(total, 0)} €M`
        );
      }),
      // Add product breakdown
      subRows: showProductDetail ? 
        Object.entries(productResults || {}).filter(([key, product]) => {
          return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
        }).map(([key, product]) => {
          const npaData = globalResults?.bs?.details?.nonPerformingAssets;
          const productNPA = npaData?.byProduct?.[key];
          const quarterlyNPV = productNPA?.quarterlyNPV || Array(quarters).fill(0);
          
          return {
            label: `o/w ${product.name || key}`,
            data: quarterlyNPV,
            decimals: 0,
            isSubItem: true
          };
        }) : []
    },
    
    
    // Separator
    { isSeparator: true },
    
    // STEP 8: Net Performing Assets (Result)
    {
      label: 'Net Performing Assets',
      data: Array(quarters).fill(0).map((_, i) => 
        calculateTotalFromProducts(productResults, (key, product) => {
          return product.quarterly?.performingStock || Array(quarters).fill(0);
        }, i)
      ),
      decimals: 0,
      isHeader: true,
      formula: Array(quarters).fill(0).map((_, i) => {
        return createAggregateFormula(
          i,
          'Net Performing Assets',
          Object.entries(productResults || {}).filter(([key, product]) => {
            return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
          }).map(([key, product]) => ({
            name: product.name,
            value: (product.quarterly?.performingStock || Array(40).fill(0))[i],
            unit: '€M'
          }))
        );
      }),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults || {}).filter(([key, product]) => {
        return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
      }).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.quarterly?.performingStock ?? Array(quarters).fill(0),
        decimals: 0,
        formula: (product.quarterly?.performingStock ?? Array(quarters).fill(0)).map((val, i) => createFormula(
          i,
          'Stock = Previous + New Business - Repayments - Defaults',
          [
            {
              name: 'Previous Stock',
              value: i > 0 ? (ensureQuarterlyArray(product.quarterly?.performingStock, quarters))[i-1] || 0 : 0,
              unit: '€M',
              calculation: 'End of previous quarter balance'
            },
            {
              name: 'New Business',
              value: (ensureQuarterlyArray(product.quarterly?.newBusiness, quarters))[i] || 0,
              unit: '€M',
              calculation: 'New loans originated this quarter'
            },
            {
              name: 'Repayments',
              value: (ensureQuarterlyArray(product.quarterly?.principalRepayments, quarters))[i] || 0,
              unit: '€M',
              calculation: 'Principal repaid according to amortization schedule'
            },
            {
              name: 'Defaults',
              value: i > 0 ? ((ensureQuarterlyArray(product.quarterly?.performingStock, quarters))[i-1] || 0) * ((product.assumptions?.pd || 0.015) / 4) : 0,
              unit: '€M',
              calculation: `Previous Stock × Default Rate (${formatNumber((product.assumptions?.pd || 0.015) * 100 / 4, 2)}% quarterly)`
            }
          ],
          () => {
            const prev = i > 0 ? (ensureQuarterlyArray(product.quarterly?.performingStock, quarters))[i-1] || 0 : 0;
            const newBusiness = (ensureQuarterlyArray(product.quarterly?.newBusiness, quarters))[i] || 0;
            const repayments = (ensureQuarterlyArray(product.quarterly?.principalRepayments, quarters))[i] || 0;
            const defaults = i > 0 ? prev * (product.assumptions?.pd || 0.015) / 4 : 0;
            return `${formatNumber(prev, 0)} + ${formatNumber(newBusiness, 0)} - ${formatNumber(repayments, 0)} - ${formatNumber(defaults, 0)} = ${formatNumber(val, 0)} €M`;
          }
        ))
      })) : []
    },


    // ========== TOTAL ASSETS SUMMARY ==========
    {
      label: 'Total Assets',
      data: totalAssets,
      decimals: 0,
      isTotal: true,
      bgColor: 'gray',
      formula: totalAssets.map((val, i) => createFormula(
        i,
        'Net Performing Assets + Non-Performing Assets',
        [
          {
            name: 'Net Performing Assets',
            value: performingAssets[i],
            unit: '€M',
            calculation: 'Performing loans net of provisions'
          },
          {
            name: 'Non-Performing Assets',
            value: nonPerformingAssets[i],
            unit: '€M',
            calculation: 'Non-performing loans (NPV of expected recoveries)'
          }
        ],
        () => `${formatNumber(performingAssets[i], 0)} + ${formatNumber(nonPerformingAssets[i], 0)} = ${formatNumber(val, 0)} €M`
      )),
      // Add product breakdown
      subRows: showProductDetail ? Object.entries(productResults).filter(([key, product]) => {
        return product.productType === 'Credit' || product.type === 'french' || product.type === 'bullet' || product.type === 'bridge';
      }).map(([key, product]) => {
        const productPerforming = product.quarterly?.performingStock || Array(quarters).fill(0);
        const productNonPerforming = product.quarterly?.nonPerformingStock || Array(quarters).fill(0);
        const productTotal = productPerforming.map((perf, q) => perf + productNonPerforming[q]);
        
        return {
          label: `o/w ${product.name}`,
          data: productTotal,
          decimals: 0,
          isSubItem: true,
          formula: productTotal.map((val, i) => createFormula(
            i,
            'Product Total Assets',
            [
              {
                name: 'Net Performing',
                value: productPerforming[i],
                unit: '€M'
              },
              {
                name: 'Non-Performing',
                value: productNonPerforming[i],
                unit: '€M'
              }
            ],
            () => `${formatNumber(productPerforming[i], 0)} + ${formatNumber(productNonPerforming[i], 0)} = ${formatNumber(val, 0)} €M`
          ))
        };
      }) : []
    },

    // ========== LIABILITIES SECTION ==========
    {
      label: 'Liabilities',
      data: Array(quarters).fill(null),
      isHeader: true,
      bgColor: 'lightgreen'
    },

    {
      label: 'Equity',
      data: allocatedEquity,
      decimals: 0,
      isSubItem: true,
      formula: allocatedEquity.map((val, i) => createFormula(
        i,
        'Total Bank Equity × (Division RWA / Total Bank RWA)',
        [
          {
            name: 'Total Bank Equity',
            value: globalResults.bs.equity[i],
            unit: '€M',
            calculation: 'Total bank regulatory capital'
          },
          {
            name: 'Division RWA',
            value: (divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i],
            unit: '€M',
            calculation: 'Risk-weighted assets for this division'
          },
          {
            name: 'Total Bank RWA',
            value: globalResults.capital.totalRWA[i],
            unit: '€M',
            calculation: 'Total bank risk-weighted assets'
          },
          {
            name: 'RWA Weight',
            value: ((divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i] / globalResults.capital.totalRWA[i]) * 100,
            unit: '%',
            calculation: 'Division\'s share of total RWA'
          }
        ],
        () => `${formatNumber(globalResults.bs.equity[i], 0)} × (${formatNumber((divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i], 0)} / ${formatNumber(globalResults.capital.totalRWA[i], 0)}) = ${formatNumber(val, 0)} €M`
      ))
    },

    {
      label: 'Sight deposits',
      data: sightDeposits,
      decimals: 0,
      isSubItem: true,
      formula: sightDeposits.map((val, i) => createFormula(
        i,
        'Total Liabilities × Sight Deposits %',
        [
          {
            name: 'Total Liabilities',
            value: totalLiabilities[i],
            unit: '€M',
            calculation: 'Total Assets - Equity'
          },
          {
            name: 'Sight Deposits %',
            value: 40,
            unit: '%',
            calculation: 'Funding mix assumption'
          }
        ],
        () => `${formatNumber(totalLiabilities[i], 0)} × 40% = ${formatNumber(val, 0)} €M`
      ))
    },

    {
      label: 'Term deposits - Open Banking Solutions',
      data: termDeposits,
      decimals: 0,
      isSubItem: true,
      formula: termDeposits.map((val, i) => createFormula(i,
        'Total Liabilities × Term Deposits %',
        [
          year => `Total Liabilities: ${formatNumber(totalLiabilities[year], 0)} €M`,
          year => `Term Deposits %: 30%`,
          year => `Term Deposits: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    {
      label: 'Group funding',
      data: groupFunding,
      decimals: 0,
      isSubItem: true,
      formula: groupFunding.map((val, i) => createFormula(i,
        'Total Liabilities × Group Funding %',
        [
          year => `Total Liabilities: ${formatNumber(totalLiabilities[year], 0)} €M`,
          year => `Group Funding %: 30%`,
          year => `Group Funding: ${formatNumber(val, 0)} €M`
        ]
      ))
    },

    // ========== TOTAL LIABILITIES SUMMARY ==========
    {
      label: 'Total liabilities',
      data: totalAssets, // Must equal total assets
      decimals: 0,
      isTotal: true,
      bgColor: 'gray',
      formula: totalAssets.map((val, i) => createFormula(i,
        'Must equal Total Assets (Balance Sheet identity)',
        [
          year => `Equity: ${formatNumber(allocatedEquity[year], 0)} €M`,
          year => `Sight Deposits: ${formatNumber(sightDeposits[year], 0)} €M`,
          year => `Term Deposits: ${formatNumber(termDeposits[year], 0)} €M`,
          year => `Group Funding: ${formatNumber(groupFunding[year], 0)} €M`,
          year => `Total L&E: ${formatNumber(val, 0)} €M`,
          'Balance Sheet Check: ✓'
        ]
      ))
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

  return <FinancialTable title="2. Balance Sheet (€M)" rows={transformedRows} />;
};

export default StandardBalanceSheet;