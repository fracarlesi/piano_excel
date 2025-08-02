import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../../components/shared/formatters';
import { createFormula, createProductFormula, createAggregateFormula } from '../../../components/tooltip-system';

/**
 * Standardized P&L structure for all divisions
 * Following the exact schema provided
 */
const StandardPnL = ({ 
  divisionResults, 
  productResults, 
  assumptions, 
  globalResults,
  divisionName,
  showProductDetail = true,
  customRowTransformations = {}
}) => {
  
  // DEBUG: Log what we receive - DISABLED
  // console.log('🎯 StandardPnL - Data received:', {
  //   divisionName,
  //   productResultsKeys: Object.keys(productResults || {}),
  //   hasDivisionTotals: !!divisionResults.pnl?.divisionInterestIncomeTotals,
  //   divisionTotals: divisionResults.pnl?.divisionInterestIncomeTotals,
  //   commissionIncome: divisionResults.pnl?.commissionIncome?.slice(0, 3),
  //   hasProductCommissions: Object.values(productResults || {}).some(p => p.commissionIncome),
  //   sampleProduct: Object.entries(productResults || {})[0]
  // });
  
  // DEBUG: Check performing vs NPL products
  const performingProducts = Object.entries(productResults || {})
    .filter(([key, product]) => !key.includes('_NPL'));
  const nplProducts = Object.entries(productResults || {})
    .filter(([key, product]) => key.includes('_NPL'));
    
  // console.log('📊 Product breakdown:', {
  //   performingCount: performingProducts.length,
  //   performingKeys: performingProducts.map(([key]) => key),
  //   nplCount: nplProducts.length,
  //   nplKeys: nplProducts.map(([key]) => key),
  //   samplePerformingData: performingProducts[0]?.[1],
  //   sampleNPLData: nplProducts[0]?.[1]
  // });
  
  // SIMPLE DEBUG
  // console.log(`PnL for ${divisionName}:`, {
  //   hasPersonnelCosts: !!divisionResults.pnl?.personnelCosts,
  //   firstValue: divisionResults.pnl?.personnelCosts?.[0]
  // });
  
  // Use quarterly data directly (40 quarters)
  // Check if we have division totals from the microservice
  const hasDivisionTotals = !!divisionResults.divisionInterestIncomeTotals;
  
  const interestIncomeData = hasDivisionTotals 
    ? divisionResults.divisionInterestIncomeTotals.total 
    : (divisionResults.pnl.quarterly?.interestIncome ?? Array(40).fill(0));
    
  const interestIncomePerformingData = hasDivisionTotals
    ? divisionResults.divisionInterestIncomeTotals.performingSubtotal
    : (divisionResults.pnl.quarterly?.interestIncomePerforming ?? Array(40).fill(0));
    
  const interestIncomeNonPerformingData = hasDivisionTotals
    ? divisionResults.divisionInterestIncomeTotals.nplSubtotal
    : (divisionResults.pnl.quarterly?.interestIncomeNonPerforming ?? Array(40).fill(0));
  // Get ECL and Credit Impairment components
  // Note: components are at the top level of loanLossProvisions, not under details
  const eclMovementData = globalResults?.details?.loanLossProvisions?.components?.eclMovement?.quarterly || 
                         globalResults?.details?.loanLossProvisions?.eclMovements?.consolidated?.quarterly ||
                         divisionResults.pnl.components?.eclMovement?.quarterly || 
                         new Array(40).fill(0);
  const creditImpairmentData = globalResults?.details?.loanLossProvisions?.components?.creditImpairment?.quarterly || 
                              globalResults?.details?.loanLossProvisions?.creditImpairment?.consolidated?.quarterly ||
                              divisionResults.pnl.components?.creditImpairment?.quarterly || 
                              new Array(40).fill(0);
  
  // Total LLP will be calculated automatically by FinancialTable from subRows
  const llpData = new Array(40).fill(0); // Placeholder - FinancialTable will calculate actual sum
  const personnelCostsData = divisionResults.pnl.quarterly?.personnelCosts ?? Array(40).fill(0);
  
  // PERSONNEL DEBUG
  console.log('👥 PERSONNEL DEBUG in StandardPnL:');
  console.log('  - Division:', divisionName);
  console.log('  - Has personnel costs:', !!divisionResults.pnl?.personnelCosts);
  console.log('  - Has quarterly personnel costs:', !!divisionResults.pnl?.quarterly?.personnelCosts);
  console.log('  - Has personnel by seniority:', !!divisionResults.pnl?.personnelCostsBySeniority);
  console.log('  - Personnel by seniority data:', divisionResults.pnl?.personnelCostsBySeniority);
  console.log('  - First personnel cost value:', personnelCostsData[0]);
  const otherOpexData = divisionResults.pnl.quarterly?.otherOpex ?? Array(40).fill(0);
  const totalOpexData = divisionResults.pnl.quarterly?.totalOpex ?? Array(40).fill(0);

  // Net Revenues Risk-Adjusted will be calculated by FinancialTable
  const netRevenuesRiskAdjustedData = new Array(40).fill(0); // Placeholder - FinancialTable will calculate
  
  // Calculate derived values
  const netCommissionIncome = (() => {
    // Calculate NCI from product results to ensure consistency
    const totalCommissionIncome = Array(40).fill(0);
    const totalCommissionExpense = Array(40).fill(0);
    
    Object.entries(productResults).forEach(([key, product]) => {
      const productCommissionIncome = product.quarterly?.commissionIncome ?? Array(40).fill(0);
      const productCommissionExpense = product.quarterly?.commissionExpense ?? Array(40).fill(0);
      
      productCommissionIncome.forEach((val, i) => {
        totalCommissionIncome[i] += val;
      });
      
      productCommissionExpense.forEach((val, i) => {
        totalCommissionExpense[i] += val;
      });
    });
    
    // Calculate NCI for each quarter
    return totalCommissionIncome.map((income, i) => income + totalCommissionExpense[i]);
  })();

  // Total revenues = NII + NCI (simplified, removed other income and trading income)
  // Calculate NII from displayed values (Interest Income + FTP)
  const niiDisplayed = (() => {
    const niiData = Array(40).fill(0);
    
    // Add Interest Income data
    interestIncomeData.forEach((income, i) => {
      niiData[i] += income;
    });
    
    // Add FTP data (already negative)
    const ftpData = (() => {
      if (divisionResults.pnl?.creditInterestExpense?.rawResults?.quarterlyTotal) {
        return divisionResults.pnl.creditInterestExpense.rawResults.quarterlyTotal;
      }
      const ftpTotal = Array(40).fill(0);
      Object.entries(productResults).forEach(([key, product]) => {
        const productFTP = product.quarterly?.interestExpense ?? Array(40).fill(0);
        productFTP.forEach((val, i) => {
          ftpTotal[i] += val;
        });
      });
      return ftpTotal;
    })();
    
    ftpData.forEach((ftp, i) => {
      niiData[i] += ftp;
    });
    
    return niiData;
  })();
  
  const totalRevenues = niiDisplayed.map((nii, i) => nii + netCommissionIncome[i]);

  // Pre-tax profit = Net Revenues (Risk-Adjusted) + Total OPEX
  // Note: netRevenuesRiskAdjusted will be calculated by the table, so we use a temporary calculation here
  const preTaxProfit = totalRevenues.map((rev, i) => {
    const llp = eclMovementData[i] + creditImpairmentData[i];
    const netRevRiskAdj = rev + llp;
    return netRevRiskAdj + totalOpexData[i];
  });

  // const netProfit = divisionResults.pnl.netProfit || preTaxProfit.map((pbt, i) => {
  //   const taxRate = assumptions.taxRate || 0.3;
  //   const taxes = pbt > 0 ? pbt * taxRate : 0;
  //   return pbt - taxes;
  // }); // Currently unused - may be needed for net profit calculations

  // Debug logging - DISABLED
  // console.log('🔍 StandardPnL Debug:');
  // console.log('  - divisionName:', divisionName);
  // console.log('  - showProductDetail:', showProductDetail);
  // console.log('  - productResults keys:', Object.keys(productResults));
  // console.log('  - productResults:', productResults);
  // console.log('  - hasDivisionTotals:', hasDivisionTotals);
  // console.log('  - divisionInterestIncomeTotals:', divisionResults.divisionInterestIncomeTotals);
  
  // DEBUG LLP data - DISABLED
  // console.log('💰 LLP Debug:');
  // console.log('  - globalResults available:', !!globalResults);
  // console.log('  - productPnLTableData available:', !!globalResults?.productPnLTableData);
  // console.log('  - loanLossProvisions available:', !!globalResults?.productPnLTableData?.loanLossProvisions);
  // console.log('  - LLP products:', Object.keys(globalResults?.productPnLTableData?.loanLossProvisions || {}));
  // console.log('  - Full LLP data:', globalResults?.productPnLTableData?.loanLossProvisions);
  // 
  // // Check if we have NPL products (using already declared variables)
  // console.log('  - Performing products:', performingProducts.map(([k,p]) => `${k}: ${p.name}`));
  // console.log('  - NPL products:', nplProducts.map(([k,p]) => `${k}: ${p.name}`));
  // 
  // // Check what data products have
  // if (performingProducts.length > 0) {
  //   const [firstKey, firstProduct] = performingProducts[0];
  //   console.log(`  - Sample performing product (${firstKey}):`, {
  //     name: firstProduct.name,
  //     hasQuarterly: !!firstProduct.quarterly,
  //     hasInterestIncome: firstProduct.quarterly?.interestIncome?.length || 0,
  //     quarterlyData: firstProduct.quarterly
  //   });
  // }

  // P&L Rows following the exact schema
  const pnlRows = [
    // ========== INTEREST INCOME SECTION ==========
    {
      label: 'Interest Income (IC)',
      data: interestIncomeData,
      decimals: 1,
      isHeader: true,
      formula: interestIncomeData.map((val, i) => 
        createAggregateFormula(
          i,
          'Interest Income (Performing + NPL)',
          [
            {
              name: 'Performing Assets',
              value: interestIncomePerformingData[i] ?? 0,
              formula: 'Net Performing Assets × Interest Rate'
            },
            {
              name: 'Non-Performing Assets (NPL)',
              value: interestIncomeNonPerformingData[i] ?? 0,
              formula: 'NPL Stock × Interest Rate'
            }
          ]
        )
      ),
      // Add performing and NPL breakdown
      subRows: [
        // Performing Interest Section
        {
          label: 'o/w Performing Assets',
          data: interestIncomePerformingData,
          decimals: 1,
          isSecondarySubTotal: true,  // New flag for second-level subtotals
          formula: interestIncomePerformingData.map((val, i) => createFormula(i,
            'Interest on Performing Loans',
            [
              year => `Performing Interest: ${formatNumber(val, 2)} €M`,
              year => `% of Total: ${interestIncomeData[year] > 0 ? ((val / interestIncomeData[year]) * 100).toFixed(1) : 0}%`
            ]
          )),
          subRows: showProductDetail ? Object.entries(productResults)
            .filter(([key, product]) => !key.includes('_NPL'))
            .map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.quarterly?.interestIncome ?? Array(40).fill(0),
        decimals: 1,
        formula: (product.quarterly?.interestIncome ?? Array(40).fill(0)).map((val, i) => {
          const productKey = Object.keys(assumptions.products || {}).find(k => 
            assumptions.products[k].name === product.name
          );
          const originalProduct = productKey ? assumptions.products[productKey] : {};
          
          const isDigitalProduct = product.depositStock && product.depositStock.some(v => v > 0);
          
          // Calculate the actual interest rate used
          const actualInterestRate = originalProduct.isFixedRate ? 
            (originalProduct.fixedRate ?? 0) : 
            ((assumptions.euribor ?? 0) + (originalProduct.spread ?? 0));
          
          // Get the REAL average assets used in interest calculation
          const actualAvgAssets = product.actualAverageStock?.[i] ?? 
                                  product.averagePerformingAssets?.[i] ?? 
                                  product.performingAssets?.[i] ?? 0;
          
          return createProductFormula(i, product, 'interestIncome', {
            avgAssets: actualAvgAssets,
            depositStock: isDigitalProduct ? (product.depositStock?.[i] ?? 0) : 0,
            interestRate: actualInterestRate,
            ftpRate: assumptions.ftpRate ?? 0,
            depositRate: isDigitalProduct ? (originalProduct.baseAccount?.interestRate ?? originalProduct.savingsModule?.interestRate ?? 0) : 0,
            isFixed: originalProduct.isFixedRate ?? false,
            euribor: assumptions.euribor ?? 0,
            ftpSpread: assumptions.ftpSpread ?? 0,
            spread: originalProduct.spread ?? 0,
            result: val
          });
        })
      })) : []
    },
    // NPL Interest Section
    {
          label: 'o/w Non-Performing Assets (NPL)',
          data: interestIncomeNonPerformingData,
          decimals: 1,
          isSecondarySubTotal: true,  // New flag for second-level subtotals
          formula: interestIncomeNonPerformingData.map((val, i) => createFormula(i,
            'Interest on Non-Performing Loans (Time Value Unwinding)',
            [
              year => `NPL Interest: ${formatNumber(val, 2)} €M`,
              year => `% of Total: ${interestIncomeData[year] > 0 ? ((val / interestIncomeData[year]) * 100).toFixed(1) : 0}%`
            ]
          )),
          subRows: showProductDetail ? Object.entries(productResults)
            .filter(([key, product]) => key.includes('_NPL'))
            .map(([key, product], index) => ({
              label: `o/w ${product.name}`,
              data: product.quarterly?.interestIncome ?? Array(40).fill(0),
              decimals: 1,
              formula: (product.quarterly?.interestIncome ?? Array(40).fill(0)).map((val, i) => {
                const baseProductKey = key.replace('_NPL', '');
                const originalProduct = assumptions.products?.[baseProductKey] || {};
                
                const actualInterestRate = originalProduct.isFixedRate ? 
                  (originalProduct.fixedRate ?? 0) : 
                  ((assumptions.euribor ?? 0) + (originalProduct.spread ?? 0));
                
                const nplStock = product.averageNPLStock?.[i] ?? 
                               product.nplStock?.[i] ?? 0;
                
                return createProductFormula(i, product, 'nplInterestIncome', {
                  nplStock: nplStock,
                  interestRate: actualInterestRate,
                  isFixed: originalProduct.isFixedRate ?? false,
                  euribor: assumptions.euribor ?? 0,
                  spread: originalProduct.spread ?? 0,
                  result: val
                });
              })
            })) : []
        }
      ]
    },

    // ========== INTEREST EXPENSES SECTION ==========
    {
      label: 'FTP',
      data: (() => {
        // Calculate FTP total including both Bonis and NPL
        const ftpTotal = Array(40).fill(0);
        
        // Get FTP from divisionResults if available (from separated calculator)
        if (divisionResults.pnl?.creditInterestExpense?.rawResults?.quarterlyTotal) {
          return divisionResults.pnl.creditInterestExpense.rawResults.quarterlyTotal;
        }
        
        // Fallback: calculate from products
        Object.entries(productResults)
          .filter(([key, product]) => !key.includes('_NPL'))
          .forEach(([key, product]) => {
            const productFTP = product.quarterly?.interestExpense ?? Array(40).fill(0);
            productFTP.forEach((val, i) => {
              ftpTotal[i] += val;
            });
          });
        return ftpTotal;
      })(),
      decimals: 1,
      isHeader: true,
      formula: (() => {
        // Calculate FTP total for formula display
        const ftpTotal = Array(40).fill(0);
        Object.entries(productResults).forEach(([key, product]) => {
          const productFTP = product.quarterly?.interestExpense ?? Array(40).fill(0);
          productFTP.forEach((val, i) => {
            ftpTotal[i] += val;
          });
        });
        return ftpTotal.map((val, i) => createFormula(i,
          'Total FTP (Bonis + NPL)',
          [
            year => `FTP Rate: ${((assumptions.euribor ?? 0) + (assumptions.ftpSpread ?? 0)).toFixed(2)}% (EURIBOR ${(assumptions.euribor ?? 0).toFixed(1)}% + Spread ${(assumptions.ftpSpread ?? 0).toFixed(1)}%)`,
            year => `Total FTP Cost: ${formatNumber(val, 2)} €M`
          ]
        ));
      })(),
      // Add breakdown for Bonis and NPL
      subRows: [
        // FTP on Bonis
        {
          label: 'o/w FTP on Performing Assets (Bonis)',
          data: (() => {
            // Get Bonis FTP from divisionResults if available
            if (divisionResults.pnl?.creditInterestExpense?.rawResults?.quarterlyTotalBonis) {
              return divisionResults.pnl.creditInterestExpense.rawResults.quarterlyTotalBonis;
            }
            
            // Fallback: calculate from performing products only
            const ftpBonis = Array(40).fill(0);
            Object.entries(productResults)
              .filter(([key, product]) => !key.includes('_NPL'))
              .forEach(([key, product]) => {
                const productFTP = product.quarterly?.interestExpense ?? Array(40).fill(0);
                productFTP.forEach((val, i) => {
                  ftpBonis[i] += val;
                });
              });
            return ftpBonis;
          })(),
          decimals: 1,
          isSecondarySubTotal: true,
          formula: (() => {
            const ftpBonis = Array(40).fill(0);
            Object.entries(productResults)
              .filter(([key, product]) => !key.includes('_NPL'))
              .forEach(([key, product]) => {
                const productFTP = product.quarterly?.interestExpense ?? Array(40).fill(0);
                productFTP.forEach((val, i) => {
                  ftpBonis[i] += val;
                });
              });
            return ftpBonis.map((val, i) => createFormula(i,
              'FTP on Performing Assets',
              [
                year => `FTP Rate: ${((assumptions.euribor ?? 0) + (assumptions.ftpSpread ?? 0)).toFixed(2)}%`,
                year => `Bonis FTP Cost: ${formatNumber(val, 2)} €M`
              ]
            ));
          })(),
          subRows: showProductDetail ? Object.entries(productResults)
            .filter(([key, product]) => !key.includes('_NPL'))
            .map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.quarterly?.interestExpense ?? Array(40).fill(0),
        decimals: 1,
        formula: (product.quarterly?.interestExpense ?? Array(40).fill(0)).map((val, i) => {
          // const productKey = Object.keys(assumptions.products || {}).find(k => 
          //   assumptions.products[k].name === product.name
          // ); // Currently unused in this context
          // const originalProduct = productKey ? assumptions.products[productKey] : {}; // Currently unused in this context
          
          const isDigitalProduct = product.depositStock && product.depositStock.some(v => v > 0);
          
          let depositRate = 0;
          if (product.name && product.name.includes('Conto Corrente Base')) {
            depositRate = 0.1;
          } else if (product.name && product.name.includes('Conto Deposito')) {
            const baseProduct = assumptions.products.digitalRetailCustomer;
            if (baseProduct && baseProduct.savingsModule && baseProduct.savingsModule.depositMix) {
              depositRate = baseProduct.savingsModule.depositMix.reduce((sum, deposit) => 
                sum + (deposit.percentage / 100) * deposit.interestRate, 0
              );
            } else {
              depositRate = 0;
            }
          }
          
                return createProductFormula(i, product, 'interestExpense', {
                  avgAssets: (product.averagePerformingAssets ?? [0,0,0,0,0,0,0,0,0,0])[i] ?? 0,
                  depositStock: isDigitalProduct ? (product.depositStock ?? [0,0,0,0,0,0,0,0,0,0])[i] : 0,
                  interestRate: product.assumptions?.interestRate ?? 0,
                  depositRate: depositRate,
                  ftpRate: ((assumptions.euribor ?? 0) + (assumptions.ftpSpread ?? 0)),
                  euribor: assumptions.euribor ?? 0,
                  ftpSpread: assumptions.ftpSpread ?? 0,
                  result: val
                });
              })
            })) : []
        },
        // FTP on NPL
        {
          label: 'o/w FTP on Non-Performing Loans (NPL)',
          data: (() => {
            // Get NPL FTP from divisionResults if available
            if (divisionResults.pnl?.creditInterestExpense?.rawResults?.quarterlyTotalNPL) {
              return divisionResults.pnl.creditInterestExpense.rawResults.quarterlyTotalNPL;
            }
            
            // Fallback: For now return zeros as NPL FTP is calculated in the total
            return Array(40).fill(0);
          })(),
          decimals: 1,
          isSecondarySubTotal: true,
          formula: (() => {
            const nplFTP = divisionResults.pnl?.creditInterestExpense?.rawResults?.quarterlyTotalNPL || Array(40).fill(0);
            return nplFTP.map((val, i) => createFormula(i,
              'FTP on NPL Stock',
              [
                year => `FTP Rate: ${((assumptions.euribor ?? 0) + (assumptions.ftpSpread ?? 0)).toFixed(2)}%`,
                year => `NPL FTP Cost: ${formatNumber(val, 2)} €M`
              ]
            ));
          })(),
          subRows: showProductDetail && divisionResults.pnl?.creditInterestExpense?.rawResults?.byProduct ? 
            Object.entries(divisionResults.pnl.creditInterestExpense.rawResults.byProduct)
              .filter(([key, data]) => data.quarterlyFTPNPL?.some(v => v !== 0))
              .map(([key, data]) => ({
                label: `o/w ${data.name} NPL`,
                data: data.quarterlyFTPNPL || Array(40).fill(0),
                decimals: 1,
                formula: (data.quarterlyFTPNPL || Array(40).fill(0)).map((val, i) => {
                  const details = data.quarterlyDetails?.[i];
                  return createFormula(i,
                    'FTP on NPL Stock',
                    [
                      year => `NPL Stock: ${formatNumber(details?.nplAssets || 0, 2)} €M`,
                      year => `FTP Rate: ${((details?.ftpRate || 0) + (assumptions.euribor ?? 0)).toFixed(2)}%`,
                      year => `NPL FTP: ${formatNumber(val, 2)} €M`
                    ]
                  );
                })
              })) : []
        }
      ]
    },

    // ========== NET INTEREST INCOME ==========
    {
      label: 'Net Interest Income (NII)',
      data: (() => {
        // Calculate NII as sum of Interest Income (displayed) + FTP (displayed)
        const niiData = Array(40).fill(0);
        
        // Add Interest Income data
        interestIncomeData.forEach((income, i) => {
          niiData[i] += income;
        });
        
        // Add FTP data - Use the total FTP that includes both Bonis and NPL
        const ftpData = (() => {
          // First try to get FTP from divisionResults (includes both Bonis and NPL)
          if (divisionResults.pnl?.creditInterestExpense?.rawResults?.quarterlyTotal) {
            return divisionResults.pnl.creditInterestExpense.rawResults.quarterlyTotal;
          }
          
          // Fallback: calculate total FTP from all products (performing + NPL)
          const ftpTotal = Array(40).fill(0);
          Object.entries(productResults).forEach(([key, product]) => {
            const productFTP = product.quarterly?.interestExpense ?? Array(40).fill(0);
            productFTP.forEach((val, i) => {
              ftpTotal[i] += val;
            });
          });
          return ftpTotal;
        })();
        
        ftpData.forEach((ftp, i) => {
          niiData[i] += ftp;
        });
        
        return niiData;
      })(),
      decimals: 1,
      isSubTotal: true,
      formula: (() => {
        // Use the same FTP data as displayed above
        const ftpData = (() => {
          // First try to get FTP from divisionResults (includes both Bonis and NPL)
          if (divisionResults.pnl?.creditInterestExpense?.rawResults?.quarterlyTotal) {
            return divisionResults.pnl.creditInterestExpense.rawResults.quarterlyTotal;
          }
          
          // Fallback: calculate total FTP from all products (performing + NPL)
          const ftpTotal = Array(40).fill(0);
          Object.entries(productResults).forEach(([key, product]) => {
            const productFTP = product.quarterly?.interestExpense ?? Array(40).fill(0);
            productFTP.forEach((val, i) => {
              ftpTotal[i] += val;
            });
          });
          return ftpTotal;
        })();
        
        // Calculate NII for formula
        const niiData = Array(40).fill(0);
        interestIncomeData.forEach((income, i) => {
          niiData[i] = income + ftpData[i];
        });
        
        return niiData.map((val, i) => createFormula(
          i,
          'Interest Income + FTP',
          [
            {
              name: 'Interest Income',
              value: interestIncomeData[i] ?? 0,
              unit: '€M',
              calculation: 'Total interest income (performing + NPL)'
            },
            {
              name: 'FTP',
              value: ftpData[i] ?? 0,
              unit: '€M',
              calculation: 'Funds Transfer Pricing cost (Bonis + NPL)'
            }
          ],
          quarter => {
            const income = interestIncomeData[quarter] ?? 0;
            const ftp = ftpData[quarter] ?? 0;
            return `${formatNumber(income, 2)} + (${formatNumber(ftp, 2)}) = ${formatNumber(val, 2)} €M`;
          }
        ));
      })(),
      // Add product NII breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: (product.quarterly?.interestIncome ?? Array(40).fill(0)).map((income, i) => 
          income + (product.quarterly?.interestExpense ?? Array(40).fill(0))[i]
        ),
        decimals: 1,
        formula: (product.quarterly?.interestIncome ?? Array(40).fill(0)).map((income, i) => {
          const expense = (product.quarterly?.interestExpense ?? Array(40).fill(0))[i] ?? 0;
          const nii = income + expense;
          
          return createFormula(
            i,
            'Interest Income - Interest Expense',
            [
              {
                name: 'Interest Income',
                value: income,
                unit: '€M',
                calculation: 'Product interest income'
              },
              {
                name: 'Interest Expense',
                value: expense,
                unit: '€M',
                calculation: 'Product funding cost'
              }
            ],
            year => `${formatNumber(income, 2)} - (${formatNumber(Math.abs(expense), 2)}) = ${formatNumber(nii, 2)} €M`
          );
        })
      })) : []
    },

    // ========== COMMISSION INCOME SECTION ==========
    {
      label: 'Commission Income (CI)',
      data: (() => {
        const totalCommissionIncome = Array(40).fill(0);
        Object.entries(productResults).forEach(([key, product]) => {
          const productCommissionIncome = product.quarterly?.commissionIncome ?? Array(40).fill(0);
          productCommissionIncome.forEach((val, i) => {
            totalCommissionIncome[i] += val;
          });
        });
        return totalCommissionIncome;
      })(),
      decimals: 1,
      isHeader: true,
      formula: (() => {
        const totalCommissionIncome = Array(40).fill(0);
        Object.entries(productResults).forEach(([key, product]) => {
          const productCommissionIncome = product.quarterly?.commissionIncome ?? Array(40).fill(0);
          productCommissionIncome.forEach((val, i) => {
            totalCommissionIncome[i] += val;
          });
        });
        return totalCommissionIncome;
      })().map((val, i) => 
        createAggregateFormula(
          i,
          'Commission Income',
          Object.entries(productResults).map(([key, product]) => {
            const productKey = Object.keys(assumptions.products ?? {}).find(k => 
              assumptions.products[k].name === product.name
            );
            const originalProduct = productKey ? assumptions.products[productKey] : {};
            const commissionValue = (product.quarterly?.commissionIncome ?? Array(40).fill(0))[i] ?? 0;
            const newBusiness = (product.newBusiness ?? [0,0,0,0,0,0,0,0,0,0])[i] ?? 0;
            
            return {
              name: product.name,
              value: commissionValue,
              formula: commissionValue > 0 ? `${formatNumber(newBusiness, 2)} × ${((originalProduct.commissionRate ?? 0)).toFixed(2)}%` : 'No commission'
            };
          })
        )
      ),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.quarterly?.commissionIncome ?? Array(40).fill(0),
        decimals: 1,
        formula: (product.quarterly?.commissionIncome ?? Array(40).fill(0)).map((val, i) => {
          const productKey = Object.keys(assumptions.products ?? {}).find(k => 
            assumptions.products[k].name === product.name
          );
          const originalProduct = productKey ? assumptions.products[productKey] : {};
          
          // Check product type for digital products
          const isBaseAccount = product.name && product.name.includes('Conto Corrente Base');
          const isPremium = product.name && product.name.includes('Servizi Premium');
          const isReferral = product.name && product.name.includes('Referral Wealth Management');
          
          // Get base assumptions for digital products
          const baseProduct = assumptions.products.digitalRetailCustomer;
          
          return createProductFormula(i, product, 'commissionIncome', {
            volume: (product.newBusiness ?? [0,0,0,0,0,0,0,0,0,0])[i] ?? 0,
            commissionRate: (originalProduct.commissionRate ?? 0),
            // Digital product specific values
            isBaseAccount: isBaseAccount,
            isPremium: isPremium,
            isReferral: isReferral,
            avgCustomers: isBaseAccount ? (product.avgCustomers ?? [0,0,0,0,0,0,0,0,0,0])[i] : 0,
            monthlyFee: isBaseAccount && baseProduct ? baseProduct.baseAccount?.monthlyFee ?? 0 : 0,
            activeCustomers: isPremium ? ((product.totalCustomers ?? [0,0,0,0,0,0,0,0,0,0])[i] * 0.2) : 0,
            annualRevenue: isPremium && baseProduct ? baseProduct.premiumServicesModule?.avgAnnualRevenue ?? 0 : 0,
            newCustomers: isReferral ? (product.newBusiness ?? [0,0,0,0,0,0,0,0,0,0])[i] : 0,
            adoptionRate: isReferral && baseProduct ? baseProduct.wealthManagementReferral?.adoptionRate ?? 0 : 0,
            referralFee: isReferral && baseProduct ? baseProduct.wealthManagementReferral?.referralFee ?? 0 : 0,
            result: val
          });
        })
      })) : []
    },

    // ========== COMMISSION EXPENSES SECTION ==========
    {
      label: 'Commission Expenses (CE)',
      data: (() => {
        const totalCommissionExpense = Array(40).fill(0);
        Object.entries(productResults).forEach(([key, product]) => {
          const productCommissionExpense = product.quarterly?.commissionExpense ?? Array(40).fill(0);
          productCommissionExpense.forEach((val, i) => {
            totalCommissionExpense[i] += val;
          });
        });
        return totalCommissionExpense;
      })(),
      decimals: 1,
      isHeader: true,
      formula: (() => {
        const totalCommissionExpense = Array(40).fill(0);
        Object.entries(productResults).forEach(([key, product]) => {
          const productCommissionExpense = product.quarterly?.commissionExpense ?? Array(40).fill(0);
          productCommissionExpense.forEach((val, i) => {
            totalCommissionExpense[i] += val;
          });
        });
        return totalCommissionExpense;
      })().map((val, i) => 
        createAggregateFormula(
          i,
          'Commission Expense',
          Object.entries(productResults).map(([key, product]) => {
            const productKey = Object.keys(assumptions.products ?? {}).find(k => 
              assumptions.products[k].name === product.name
            );
            const originalProduct = productKey ? assumptions.products[productKey] : {};
            const expenseValue = (product.quarterly?.commissionExpense ?? Array(40).fill(0))[i] ?? 0;
            const newBusiness = (product.newBusiness ?? [0,0,0,0,0,0,0,0,0,0])[i] ?? 0;
            const commissionExpenseRate = originalProduct.commissionExpenseRate || 0;
            
            return {
              name: product.name,
              value: expenseValue,
              formula: expenseValue < 0 ? `-${formatNumber(newBusiness, 2)} × ${commissionExpenseRate.toFixed(2)}%` : 'No expense'
            };
          })
        )
      ),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.quarterly?.commissionExpense ?? Array(40).fill(0),
        decimals: 1,
        formula: (product.quarterly?.commissionExpense ?? Array(40).fill(0)).map((val, i) => {
          // Check if this is a CAC expense for digital products
          const isBaseAccount = product.name && product.name.includes('Conto Corrente Base');
          const isCacExpense = isBaseAccount && val < 0; // CAC is negative
          
          // Get base assumptions for digital products
          const baseProduct = assumptions.products.digitalRetailCustomer;
          
          // Get product config to access commission expense rate
          const productKey = Object.keys(assumptions.products ?? {}).find(k => 
            assumptions.products[k].name === product.name
          );
          const productConfig = productKey ? assumptions.products[productKey] : {};
          const commissionExpenseRate = productConfig.commissionExpenseRate || 0;
          
          return createProductFormula(i, product, 'commissionExpense', {
            newVolume: (product.newBusiness ?? [0,0,0,0,0,0,0,0,0,0])[i] ?? 0,
            expenseRate: commissionExpenseRate,
            // CAC specific values
            isCac: isCacExpense,
            newCustomers: isCacExpense ? ((product.newBusiness ?? [0,0,0,0,0,0,0,0,0,0])[i] * 1000) : 0, // Convert from thousands
            cac: isCacExpense && baseProduct ? baseProduct.acquisition?.cac ?? 0 : 0,
            result: val
          });
        })
      })) : []
    },

    // ========== NET COMMISSION INCOME ==========
    {
      label: 'Net Commission Income (NCI)',
      data: (() => {
        // Calculate NCI as Commission Income + Commission Expenses (expenses are already negative)
        const totalCommissionIncome = Array(40).fill(0);
        const totalCommissionExpense = Array(40).fill(0);
        
        Object.entries(productResults).forEach(([key, product]) => {
          const productCommissionIncome = product.quarterly?.commissionIncome ?? Array(40).fill(0);
          const productCommissionExpense = product.quarterly?.commissionExpense ?? Array(40).fill(0);
          
          productCommissionIncome.forEach((val, i) => {
            totalCommissionIncome[i] += val;
          });
          
          productCommissionExpense.forEach((val, i) => {
            totalCommissionExpense[i] += val;
          });
        });
        
        // Calculate NCI for each quarter
        return totalCommissionIncome.map((income, i) => income + totalCommissionExpense[i]);
      })(),
      decimals: 1,
      isSubTotal: true,
      formula: (() => {
        // Recalculate totals for formula display
        const totalCommissionIncome = Array(40).fill(0);
        const totalCommissionExpense = Array(40).fill(0);
        
        Object.entries(productResults).forEach(([key, product]) => {
          const productCommissionIncome = product.quarterly?.commissionIncome ?? Array(40).fill(0);
          const productCommissionExpense = product.quarterly?.commissionExpense ?? Array(40).fill(0);
          
          productCommissionIncome.forEach((val, i) => {
            totalCommissionIncome[i] += val;
          });
          
          productCommissionExpense.forEach((val, i) => {
            totalCommissionExpense[i] += val;
          });
        });
        
        const nciData = totalCommissionIncome.map((income, i) => income + totalCommissionExpense[i]);
        
        return nciData.map((val, i) => createFormula(i,
          'Commission Income - Commission Expenses',
          [
            year => `Commission Income: ${formatNumber(totalCommissionIncome[year], 2)} €M`,
            year => `Commission Expenses: ${formatNumber(totalCommissionExpense[year], 2)} €M`,
            year => `NCI: ${formatNumber(val, 2)} €M`
          ],
          year => {
            const income = totalCommissionIncome[year] ?? 0;
            const expenses = totalCommissionExpense[year] ?? 0;
            return `${formatNumber(income, 2)} - (${formatNumber(Math.abs(expenses), 2)}) = ${formatNumber(val, 2)} €M`;
          }
        ));
      })(),
      // Add product NCI breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: (product.quarterly?.commissionIncome ?? Array(40).fill(0)).map((income, i) => 
          income + (product.quarterly?.commissionExpense ?? Array(40).fill(0))[i]
        ),
        decimals: 1,
        formula: (product.quarterly?.commissionIncome ?? Array(40).fill(0)).map((income, i) => {
          const expense = (product.quarterly?.commissionExpense ?? Array(40).fill(0))[i] ?? 0;
          const nci = income + expense;
          
          return createFormula(
            i,
            'Commission Income - Commission Expense',
            [
              {
                name: 'Commission Income',
                value: income,
                unit: '€M',
                calculation: 'Product commission income'
              },
              {
                name: 'Commission Expense',
                value: expense,
                unit: '€M',
                calculation: 'Product commission expense'
              }
            ],
            year => `${formatNumber(income, 2)} - (${formatNumber(Math.abs(expense), 2)}) = ${formatNumber(nci, 2)} €M`
          );
        })
      })) : []
    },

    // ========== TOTAL REVENUES ==========
    {
      label: 'Total Revenues',
      data: totalRevenues,
      decimals: 1,
      isTotal: true,
      bgColor: 'gray',
      formula: totalRevenues.map((val, i) => createFormula(i,
        'NII + NCI',
        [
          year => `NII: ${formatNumber(niiDisplayed[year], 2)} €M`,
          year => `NCI: ${formatNumber(netCommissionIncome[year], 2)} €M`,
          year => `Total: ${formatNumber(val, 2)} €M`
        ],
        year => `${formatNumber(niiDisplayed[year], 2)} + ${formatNumber(netCommissionIncome[year], 2)} = ${formatNumber(val, 2)} €M`
      ))
    },

    // ========== LOAN LOSS PROVISIONS ==========
    {
      label: 'Loan loss provisions',
      data: llpData,
      autoSum: true, // Tell FinancialTable to calculate sum from subRows
      isHeader: true, // Gray background like other main sections
      decimals: 1,
      formula: llpData.map((val, i) => createFormula(i,
        'ECL Movement + Credit Impairment',
        [
          year => `Total LLP: ${formatNumber(val, 2)} €M`,
          year => `Combination of ECL provision changes and credit impairment`
        ]
      )),
      // Add ECL and Credit Impairment breakdown as primary subRows
      subRows: [
        // ECL Movement sub-item
        {
          label: 'o/w ECL Provision Movement',
          data: eclMovementData,
          isSecondarySubTotal: true, // Yellow background for sub-components
          decimals: 1,
          formula: eclMovementData.map((val, i) => createFormula(i,
            'Change in Expected Credit Loss provision',
            [
              year => `ECL Movement: ${formatNumber(val, 2)} €M`,
              year => `Quarterly change in ECL provision stock`
            ]
          )),
          // Add product breakdown for ECL movements
          subRows: showProductDetail && globalResults?.productPnLTableData?.eclMovements ? 
            Object.entries(globalResults.productPnLTableData.eclMovements)
              .filter(([key, eclData]) => {
                // Map division names to prefixes
                const divisionPrefixMap = {
                  'Real Estate': 're',
                  'SME': 'sme',
                  'Digital Banking': 'digital',
                  'Wealth & Asset Management': 'wealth',
                  'Tech & Innovation': 'tech',
                  'Incentive Finance': 'incentive'
                };
                
                const divisionPrefix = divisionPrefixMap[divisionName] || divisionName.toLowerCase();
                return key.startsWith(divisionPrefix);
              })
              .map(([key, eclData]) => ({
                label: `o/w ${eclData.productName}`,
                data: eclData.quarterlyMovements,
                decimals: 1,
                formula: eclData.quarterlyMovements.map((val, i) => createFormula(i,
                  'Product-specific ECL movement',
                  [
                    year => `Danger Rate: ${(eclData.dangerRate * 100)?.toFixed(2)}%`,
                    year => `LGD Effective: ${(eclData.lgdEffective * 100)?.toFixed(1)}%`,
                    year => `ECL Movement: ${formatNumber(val, 2)} €M`
                  ]
                ))
              })) : []
        },
        // Credit Impairment sub-item
        {
          label: 'o/w Credit Impairment',
          data: creditImpairmentData,
          isSecondarySubTotal: true, // Yellow background for sub-components
          decimals: 1,
          formula: creditImpairmentData.map((val, i) => createFormula(i,
            'GBV Defaulted - NPV Recovery',
            [
              year => `Credit Impairment: ${formatNumber(val, 2)} €M`,
              year => `Loss on new defaults this quarter`
            ]
          )),
          // Add product breakdown for credit impairment if available
          subRows: showProductDetail && globalResults?.productPnLTableData?.creditImpairment ? 
            Object.entries(globalResults.productPnLTableData.creditImpairment)
              .filter(([key, impairmentData]) => {
                // Map division names to prefixes
                const divisionPrefixMap = {
                  'Real Estate': 're',
                  'SME': 'sme',
                  'Digital Banking': 'digital',
                  'Wealth & Asset Management': 'wealth',
                  'Tech & Innovation': 'tech',
                  'Incentive Finance': 'incentive'
                };
                
                const divisionPrefix = divisionPrefixMap[divisionName] || divisionName.toLowerCase();
                return key.startsWith(divisionPrefix);
              })
              .map(([key, impairmentData]) => ({
                label: `o/w ${impairmentData.productName}`,
                data: impairmentData.quarterlyImpairment,
                decimals: 1,
                formula: impairmentData.quarterlyImpairment.map((val, i) => createFormula(i,
                  'Product-specific credit impairment',
                  [
                    year => `Danger Rate: ${impairmentData.dangerRate?.toFixed(2)}%`,
                    year => `Loss Rate: ${impairmentData.averageLossRate?.toFixed(1)}%`,
                    year => `Impairment: ${formatNumber(val, 2)} €M`
                  ]
                ))
              })) : []
        }
      ]
    },

    // ========== NET REVENUES (RISK-ADJUSTED) ==========
    {
      label: 'Net Revenues (Risk-Adjusted)',
      data: netRevenuesRiskAdjustedData, // Placeholder - will be calculated by table
      autoSum: true, // Tell FinancialTable to calculate from specific rows
      sumFromRows: ['Total Revenues', 'Loan loss provisions'], // Specify which rows to sum
      decimals: 1,
      isSubTotal: true,
      formula: netRevenuesRiskAdjustedData.map((val, i) => createFormula(
        i,
        'Total Revenues + Loan Loss Provisions',
        [
          {
            name: 'Total Revenues',
            value: totalRevenues[i],
            unit: '€M'
          },
          {
            name: 'Loan Loss Provisions',
            value: 0, // Will be filled by table calculation
            unit: '€M'
          }
        ],
        (year) => {
          const revenues = totalRevenues[year];
          return `Total Revenues + Loan Loss Provisions`;
        }
      ))
    },

    // ========== PERSONNEL COSTS ==========
    {
      label: 'Personnel cost',
      data: personnelCostsData,
      decimals: 1,
      isHeader: true,
      formula: personnelCostsData.map((val, i) => {
        // Get personnel cost details for calculation trace
        const personnelDetails = divisionResults.pnl.personnelCostDetails;
        
        if (divisionName === 'Central Functions' && personnelDetails) {
          // For Central Functions, show department-level aggregation with drill-down
          const deptPrecedents = Object.entries(personnelDetails)
            .map(([deptKey, dept]) => {
              const deptCost = dept.costs ? Math.abs(dept.costs[i] || 0) : 0;
              const deptDetails = dept.details ? dept.details[i] : null;
              
              // Build drill-down calculation for each department
              let deptCalculation = '';
              if (deptDetails && deptDetails.length > 0) {
                deptCalculation = deptDetails.map(level => 
                  `${level.level}: ${formatNumber(level.headcount, 1)} × ${formatNumber(level.companyCostPerHead / 1000, 0)}k = ${formatNumber(level.totalCost, 2)}€M`
                ).join('\n');
              }
              
              return {
                name: deptKey.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to readable
                value: `${formatNumber(deptCost, 2)} €M`,
                calculation: deptCalculation || 'Department personnel cost'
              };
            })
            .filter(d => parseFloat(d.value) > 0);
          
          return createFormula(
            i,
            'Sum of all Central Functions department costs',
            deptPrecedents,
            year => {
              const parts = deptPrecedents.map(d => `${d.name} (${d.value})`);
              return parts.join(' + ') + ` = ${formatNumber(Math.abs(val), 2)} €M`;
            }
          );
        } else if (personnelDetails && personnelDetails[i]) {
          // For business divisions, show level-based calculation
          const levelDetails = personnelDetails[i];
          const levelSummary = levelDetails.map(level => ({
            name: `${level.level}`,
            value: level.totalCost,
            unit: '€M',
            calculation: `${formatNumber(level.headcount, 1)} × ${formatNumber(level.companyCostPerHead / 1000, 0)}k`
          }));
          
          return createFormula(
            i,
            'Sum by seniority level',
            levelSummary,
            year => {
              const parts = levelDetails.map(level => 
                `(${level.level} (${formatNumber(level.headcount, 1)}) * Cost/Head (${formatNumber(level.companyCostPerHead / 1000, 0)}k))`
              );
              return parts.join(' + ') + ` = ${formatNumber(Math.abs(val), 2)} €M`;
            }
          );
        } else {
          // Fallback to simple formula
          return createFormula(i,
            'Personnel costs allocated to division',
            [
              year => `Division personnel costs based on bottom-up model`,
              year => `Personnel Costs: ${formatNumber(Math.abs(val), 2)} €M`
            ]
          );
        }
      }),
      // Add breakdown by seniority level as subRows
      subRows: showProductDetail && divisionResults.pnl?.personnelCostsBySeniority ? [
        {
          label: 'o/w Junior',
          data: divisionResults.pnl.personnelCostsBySeniority.junior || Array(40).fill(0),
          decimals: 1,
          formula: (divisionResults.pnl.personnelCostsBySeniority.junior || Array(40).fill(0)).map((val, i) => createFormula(i,
            'Junior level personnel costs',
            [
              year => `Junior staff costs: ${formatNumber(Math.abs(val), 2)} €M`
            ]
          ))
        },
        {
          label: 'o/w Middle',
          data: divisionResults.pnl.personnelCostsBySeniority.middle || Array(40).fill(0),
          decimals: 1,
          formula: (divisionResults.pnl.personnelCostsBySeniority.middle || Array(40).fill(0)).map((val, i) => createFormula(i,
            'Middle level personnel costs',
            [
              year => `Middle staff costs: ${formatNumber(Math.abs(val), 2)} €M`
            ]
          ))
        },
        {
          label: 'o/w Senior',
          data: divisionResults.pnl.personnelCostsBySeniority.senior || Array(40).fill(0),
          decimals: 1,
          formula: (divisionResults.pnl.personnelCostsBySeniority.senior || Array(40).fill(0)).map((val, i) => createFormula(i,
            'Senior level personnel costs',
            [
              year => `Senior staff costs: ${formatNumber(Math.abs(val), 2)} €M`
            ]
          ))
        },
        {
          label: 'o/w Head of',
          data: divisionResults.pnl.personnelCostsBySeniority.headOf || Array(40).fill(0),
          decimals: 1,
          formula: (divisionResults.pnl.personnelCostsBySeniority.headOf || Array(40).fill(0)).map((val, i) => createFormula(i,
            'Head of level personnel costs',
            [
              year => `Head of staff costs: ${formatNumber(Math.abs(val), 2)} €M`
            ]
          ))
        }
      ] : []
    },

    // ========== OTHER OPEX ==========
    {
      label: 'Other OPEX',
      data: otherOpexData,
      decimals: 1,
      isHeader: true,
      formula: otherOpexData.map((val, i) => createFormula(i,
        'IT Costs + HQ Allocation',
        [
          year => `Inter-division cost allocations`,
          year => `Other OPEX: ${formatNumber(val, 2)} €M`
        ]
      )),
      // Add breakdown as subRows
      subRows: showProductDetail ? [
        {
          label: 'IT costs (from Tech Division)',
          data: divisionResults.pnl.quarterly?.itCosts ?? Array(40).fill(0),
          decimals: 1,
          formula: (divisionResults.pnl.quarterly?.itCosts ?? Array(40).fill(0)).map((val, i) => createFormula(
            i,
            'Tech Division costs allocated to business divisions',
            [
              {
                name: 'IT Costs',
                value: val,
                unit: '€M',
                calculation: 'IT costs allocated based on division technology usage'
              }
            ],
            year => `IT costs allocated: ${formatNumber(Math.abs(val), 2)} €M`
          ))
        },
        {
          label: 'HQ Allocation (from Central Functions)',
          data: divisionResults.pnl.quarterly?.hqAllocation ?? Array(40).fill(0),
          decimals: 1,
          formula: (divisionResults.pnl.quarterly?.hqAllocation ?? Array(40).fill(0)).map((val, i) => createFormula(
            i,
            'Central Functions costs allocated to business divisions',
            [
              {
                name: 'HQ Allocation',
                value: val,
                unit: '€M',
                calculation: 'Central overhead allocated based on division size'
              }
            ],
            year => `HQ allocation: ${formatNumber(Math.abs(val), 2)} €M`
          ))
        }
      ] : []
    },

    // ========== TOTAL OPEX ==========
    {
      label: 'Total OPEX',
      data: totalOpexData,
      decimals: 1,
      isSubTotal: true,
      bgColor: 'gray',
      formula: totalOpexData.map((val, i) => createFormula(i,
        'Personnel Costs + Other OPEX',
        [
          year => `Personnel: ${formatNumber(personnelCostsData[year], 2)} €M`,
          year => `Other OPEX: ${formatNumber(otherOpexData[year], 2)} €M`,
          year => `Total: ${formatNumber(val, 2)} €M`
        ],
        year => `${formatNumber(personnelCostsData[year], 2)} + ${formatNumber(otherOpexData[year], 2)} = ${formatNumber(val, 2)} €M`
      ))
    },

    // ========== OTHER COSTS SECTION ==========
    {
      label: 'Other Costs',
      data: [0,0,0,0,0,0,0,0,0,0],
      decimals: 1,
      // Add breakdown as subRows
      subRows: showProductDetail ? [
        {
          label: 'Provisions for liabilities and charges (TFR)',
          data: [0,0,0,0,0,0,0,0,0,0],
          decimals: 1,
          formula: [0,0,0,0,0,0,0,0,0,0].map((val, i) => createFormula(
            i,
            'Employee termination provisions',
            [
              {
                name: 'TFR Provisions',
                value: 0,
                unit: '€M',
                calculation: 'Currently not modeled in business plan'
              }
            ],
            year => `TFR provisions: ${formatNumber(0, 2)} €M (not applicable)`
          ))
        }
      ] : []
    },

    // ========== PRE-TAX PROFIT ==========
    {
      label: 'Pre-tax profit',
      data: preTaxProfit,
      decimals: 1,
      isTotal: true,
      bgColor: 'gray',
      formula: preTaxProfit.map((val, i) => createFormula(i,
        'Net Revenues (Risk-Adjusted) + Total OPEX',
        [
          year => {
            const llp = eclMovementData[year] + creditImpairmentData[year];
            const netRevRiskAdj = totalRevenues[year] + llp;
            return `Net Revenues (Risk-Adjusted): ${formatNumber(netRevRiskAdj, 2)} €M`;
          },
          year => `OPEX: ${formatNumber(totalOpexData[year], 2)} €M`,
          year => `PBT: ${formatNumber(val, 2)} €M`
        ],
        year => {
          const llp = eclMovementData[year] + creditImpairmentData[year];
          const netRevRiskAdj = totalRevenues[year] + llp;
          return `${formatNumber(netRevRiskAdj, 2)} + (${formatNumber(Math.abs(totalOpexData[year]), 2)}) = ${formatNumber(val, 2)} €M`;
        }
      ))
    }
  ];

  // Apply custom row transformations
  const transformedRows = pnlRows.map(row => {
    const transformation = customRowTransformations[row.label];
    if (transformation) {
      return { ...row, ...transformation };
    }
    return row;
  });

  // Debug: Check Interest Income row and its subRows - DISABLED
  // const interestIncomeRow = transformedRows.find(row => row.label === 'Interest Income (IC)');
  // if (interestIncomeRow) {
  //   console.log('📊 Interest Income Row Debug:');
  //   console.log('  - Has subRows:', !!interestIncomeRow.subRows);
  //   console.log('  - SubRows count:', interestIncomeRow.subRows?.length || 0);
  //   if (interestIncomeRow.subRows) {
  //     interestIncomeRow.subRows.forEach((subRow, idx) => {
  //       console.log(`  - SubRow ${idx}: ${subRow.label}, has subRows: ${!!subRow.subRows}, subRows count: ${subRow.subRows?.length || 0}`);
  //     });
  //   }
  // }

  return <FinancialTable title="1. P&L (€M)" rows={transformedRows} />;
};

export default StandardPnL;