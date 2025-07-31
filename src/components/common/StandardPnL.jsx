import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';
import { createFormula, createProductFormula, createAggregateFormula } from '../../utils/formulaHelpers';

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

  // Calculate derived values
  const netInterestIncome = (divisionResults.pnl.interestIncome || [0,0,0,0,0,0,0,0,0,0]).map((income, i) => {
    const expenses = (divisionResults.pnl.interestExpenses || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    return income + expenses; // expenses are negative
  });

  const netCommissionIncome = (divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0]).map((income, i) => {
    const expenses = (divisionResults.pnl.commissionExpenses || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    return income + expenses; // expenses are negative
  });

  // Calculate other income (equity upside)
  const otherIncome = Object.values(productResults).reduce((acc, product) => {
    const equityUpside = product.equityUpsideIncome || [0,0,0,0,0,0,0,0,0,0];
    return acc.map((val, i) => val + equityUpside[i]);
  }, [0,0,0,0,0,0,0,0,0,0]);

  const totalRevenues = netInterestIncome.map((nii, i) => nii + netCommissionIncome[i] + otherIncome[i]);

  // Calculate total operating expenses
  const personnelCosts = divisionResults.pnl.personnelCosts || 
    globalResults.pnl.personnelCostsTotal.map((cost, i) => {
      const divisionRwa = (divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
      const totalRwa = globalResults.capital.totalRWA[i] || 1;
      return cost * (divisionRwa / totalRwa);
    });

  const otherOpex = divisionResults.pnl.otherOpex || [0,0,0,0,0,0,0,0,0,0].map((_, i) => {
    const adminCosts = (globalResults.pnl.adminCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const marketingCosts = (globalResults.pnl.marketingCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const itCosts = (globalResults.pnl.itCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const hqAllocation = (globalResults.pnl.hqAllocation || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const totalOtherOpex = adminCosts + marketingCosts + itCosts + hqAllocation;
    
    const divisionRwa = (divisionResults.capital.totalRWA || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
    const totalRwa = globalResults.capital.totalRWA[i] || 1;
    return totalOtherOpex * (divisionRwa / totalRwa);
  });

  const totalOpex = personnelCosts.map((pc, i) => pc + otherOpex[i]);

  const preTaxProfit = totalRevenues.map((rev, i) => 
    rev + totalOpex[i] + (divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0])[i]
  );

  const netProfit = divisionResults.pnl.netProfit || preTaxProfit.map((pbt, i) => {
    const taxRate = assumptions.taxRate || 0.3;
    const taxes = pbt > 0 ? pbt * taxRate : 0;
    return pbt - taxes;
  });

  // P&L Rows following the exact schema
  const pnlRows = [
    // ========== INTEREST INCOME SECTION ==========
    {
      label: 'Interest Income (IC)',
      data: divisionResults.pnl.interestIncome || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isHeader: true,
      formula: (divisionResults.pnl.interestIncome || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createAggregateFormula(
          i,
          'Interest Income',
          Object.entries(productResults).map(([key, product]) => ({
            name: product.name,
            value: (product.interestIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
            formula: `${formatNumber((product.averagePerformingAssets || [0,0,0,0,0,0,0,0,0,0])[i], 2)} × ${((product.assumptions?.interestRate || 0) * 100).toFixed(2)}%`
          }))
        )
      ),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.interestIncome || [0,0,0,0,0,0,0,0,0,0],
        decimals: 2,
        formula: (product.interestIncome || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
          const productKey = Object.keys(assumptions.products || {}).find(k => 
            assumptions.products[k].name === product.name
          );
          const originalProduct = productKey ? assumptions.products[productKey] : {};
          
          const isDigitalProduct = product.depositStock && product.depositStock.some(v => v > 0);
          
          return createProductFormula(i, product, 'interestIncome', {
            avgAssets: (product.averagePerformingAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
            depositStock: isDigitalProduct ? (product.depositStock || [0,0,0,0,0,0,0,0,0,0])[i] : 0,
            interestRate: product.assumptions?.interestRate || 0,
            ftpRate: product.assumptions?.ftpRate || 5.0,
            depositRate: isDigitalProduct ? (originalProduct.baseAccount?.interestRate || originalProduct.savingsModule?.interestRate || 0) : 0,
            isFixed: product.assumptions?.isFixedRate || false,
            euribor: assumptions.euribor || 3.5,
            ftpSpread: assumptions.ftpSpread || 1.5,
            spread: originalProduct.spread || 0,
            result: val
          });
        })
      })) : []
    },

    // ========== INTEREST EXPENSES SECTION ==========
    {
      label: 'FTP',
      data: divisionResults.pnl.interestExpenses || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isHeader: true,
      formula: (divisionResults.pnl.interestExpenses || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => createFormula(i,
        'Average Performing Assets × FTP Rate (EURIBOR + FTP Spread)',
        [
          year => `FTP Rate: ${((assumptions.euribor || 3.5) + (assumptions.ftpSpread || 1.5)).toFixed(2)}% (EURIBOR ${(assumptions.euribor || 3.5).toFixed(1)}% + Spread ${(assumptions.ftpSpread || 1.5).toFixed(1)}%)`,
          year => `FTP Cost: ${formatNumber(val, 2)} €M`
        ]
      )),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.interestExpense || [0,0,0,0,0,0,0,0,0,0],
        decimals: 2,
        formula: (product.interestExpense || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
          const productKey = Object.keys(assumptions.products || {}).find(k => 
            assumptions.products[k].name === product.name
          );
          const originalProduct = productKey ? assumptions.products[productKey] : {};
          
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
              depositRate = 3.0;
            }
          }
          
          return createProductFormula(i, product, 'interestExpense', {
            avgAssets: (product.averagePerformingAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
            depositStock: isDigitalProduct ? (product.depositStock || [0,0,0,0,0,0,0,0,0,0])[i] : 0,
            interestRate: product.assumptions?.interestRate || 0,
            depositRate: depositRate,
            ftpRate: ((assumptions.euribor || 3.5) + (assumptions.ftpSpread || 1.5)),
            result: val
          });
        })
      })) : []
    },

    // ========== NET INTEREST INCOME ==========
    {
      label: 'Net Interest Income (NII)',
      data: netInterestIncome,
      decimals: 2,
      isSubTotal: true,
      formula: netInterestIncome.map((val, i) => createFormula(
        i,
        'Interest Income - Interest Expenses',
        [
          {
            name: 'Interest Income',
            value: (divisionResults.pnl.interestIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
            unit: '€M',
            calculation: 'Sum of all product interest income'
          },
          {
            name: 'Interest Expenses',
            value: (divisionResults.pnl.interestExpenses || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
            unit: '€M',
            calculation: 'Sum of all product funding costs'
          }
        ],
        year => {
          const income = (divisionResults.pnl.interestIncome || [0,0,0,0,0,0,0,0,0,0])[year] || 0;
          const expenses = (divisionResults.pnl.interestExpenses || [0,0,0,0,0,0,0,0,0,0])[year] || 0;
          return `${formatNumber(income, 2)} - (${formatNumber(Math.abs(expenses), 2)}) = ${formatNumber(val, 2)} €M`;
        }
      )),
      // Add product NII breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: (product.interestIncome || [0,0,0,0,0,0,0,0,0,0]).map((income, i) => 
          income + (product.interestExpense || [0,0,0,0,0,0,0,0,0,0])[i]
        ),
        decimals: 2,
        formula: (product.interestIncome || [0,0,0,0,0,0,0,0,0,0]).map((income, i) => {
          const expense = (product.interestExpense || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
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
      data: divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isHeader: true,
      formula: (divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createAggregateFormula(
          i,
          'Commission Income',
          Object.entries(productResults).map(([key, product]) => {
            const productKey = Object.keys(assumptions.products || {}).find(k => 
              assumptions.products[k].name === product.name
            );
            const originalProduct = productKey ? assumptions.products[productKey] : {};
            const commissionValue = (product.commissionIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
            const newBusiness = (product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
            
            return {
              name: product.name,
              value: commissionValue,
              formula: commissionValue > 0 ? `${formatNumber(newBusiness, 2)} × ${((originalProduct.commissionRate || 0)).toFixed(2)}%` : 'No commission'
            };
          })
        )
      ),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.commissionIncome || [0,0,0,0,0,0,0,0,0,0],
        decimals: 2,
        formula: (product.commissionIncome || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
          const productKey = Object.keys(assumptions.products || {}).find(k => 
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
            volume: (product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
            commissionRate: (originalProduct.commissionRate || 0),
            // Digital product specific values
            isBaseAccount: isBaseAccount,
            isPremium: isPremium,
            isReferral: isReferral,
            avgCustomers: isBaseAccount ? (product.avgCustomers || [0,0,0,0,0,0,0,0,0,0])[i] : 0,
            monthlyFee: isBaseAccount && baseProduct ? baseProduct.baseAccount.monthlyFee : 0,
            activeCustomers: isPremium ? ((product.totalCustomers || [0,0,0,0,0,0,0,0,0,0])[i] * 0.2) : 0,
            annualRevenue: isPremium && baseProduct ? baseProduct.premiumServicesModule.avgAnnualRevenue : 0,
            newCustomers: isReferral ? (product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[i] : 0,
            adoptionRate: isReferral && baseProduct ? baseProduct.wealthManagementReferral.adoptionRate : 0,
            referralFee: isReferral && baseProduct ? baseProduct.wealthManagementReferral.referralFee : 0,
            result: val
          });
        })
      })) : []
    },

    // ========== COMMISSION EXPENSES SECTION ==========
    {
      label: 'Commission Expenses (CE)',
      data: divisionResults.pnl.commissionExpenses || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isHeader: true,
      formula: (divisionResults.pnl.commissionExpenses || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Commission Income × Expense Rate',
          [
            {
              name: 'Commission Income',
              value: (divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
              unit: '€M',
              calculation: 'Total commission income'
            },
            {
              name: 'Commission Expense Rate',
              value: assumptions.commissionExpenseRate || 0,
              unit: '%',
              calculation: 'General commission expense rate'
            }
          ],
          year => {
            const income = (divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0])[year] || 0;
            const rate = assumptions.commissionExpenseRate || 0;
            return `${formatNumber(income, 2)} × ${formatNumber(rate, 2)}% = ${formatNumber(Math.abs(val), 2)} €M (expense)`;
          }
        )
      ),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.commissionExpense || [0,0,0,0,0,0,0,0,0,0],
        decimals: 2,
        formula: (product.commissionExpense || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
          // Check if this is a CAC expense for digital products
          const isBaseAccount = product.name && product.name.includes('Conto Corrente Base');
          const isCacExpense = isBaseAccount && val < 0; // CAC is negative
          
          // Get base assumptions for digital products
          const baseProduct = assumptions.products.digitalRetailCustomer;
          
          return createProductFormula(i, product, 'commissionExpense', {
            commissionIncome: (product.commissionIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
            expenseRate: assumptions.commissionExpenseRate || 0,
            // CAC specific values
            isCac: isCacExpense,
            newCustomers: isCacExpense ? ((product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[i] * 1000) : 0, // Convert from thousands
            cac: isCacExpense && baseProduct ? baseProduct.acquisition.cac : 0,
            result: val
          });
        })
      })) : []
    },

    // ========== NET COMMISSION INCOME ==========
    {
      label: 'Net Commission Income (NCI)',
      data: netCommissionIncome,
      decimals: 2,
      isSubTotal: true,
      formula: netCommissionIncome.map((val, i) => createFormula(i,
        'Commission Income - Commission Expenses',
        [
          year => `Commission Income: ${formatNumber((divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0])[year], 2)} €M`,
          year => `Commission Expenses: ${formatNumber((divisionResults.pnl.commissionExpenses || [0,0,0,0,0,0,0,0,0,0])[year], 2)} €M`,
          year => `NCI: ${formatNumber(val, 2)} €M`
        ],
        year => {
          const income = (divisionResults.pnl.commissionIncome || [0,0,0,0,0,0,0,0,0,0])[year] || 0;
          const expenses = (divisionResults.pnl.commissionExpenses || [0,0,0,0,0,0,0,0,0,0])[year] || 0;
          return `${formatNumber(income, 2)} - (${formatNumber(Math.abs(expenses), 2)}) = ${formatNumber(val, 2)} €M`;
        }
      )),
      // Add product NCI breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: (product.commissionIncome || [0,0,0,0,0,0,0,0,0,0]).map((income, i) => 
          income + (product.commissionExpense || [0,0,0,0,0,0,0,0,0,0])[i]
        ),
        decimals: 2,
        formula: (product.commissionIncome || [0,0,0,0,0,0,0,0,0,0]).map((income, i) => {
          const expense = (product.commissionExpense || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
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

    // ========== OTHER INCOME ==========
    {
      label: 'Other Income',
      data: Object.values(productResults).reduce((acc, product) => {
        const equityUpside = product.equityUpsideIncome || [0,0,0,0,0,0,0,0,0,0];
        return acc.map((val, i) => val + equityUpside[i]);
      }, [0,0,0,0,0,0,0,0,0,0]),
      decimals: 2,
      isHeader: true,
      formula: Object.values(productResults).reduce((acc, product) => {
        const equityUpside = product.equityUpsideIncome || [0,0,0,0,0,0,0,0,0,0];
        return acc.map((val, i) => val + equityUpside[i]);
      }, [0,0,0,0,0,0,0,0,0,0]).map((val, i) => createFormula(i,
        'Equity Upside Income from products',
        [
          year => `Other Income: ${formatNumber(val, 2)} €M`
        ]
      )),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults)
        .filter(([key, product]) => product.equityUpsideIncome && product.equityUpsideIncome.some(val => val > 0))
        .map(([key, product], index) => ({
          label: `o/w ${product.name} (Equity Upside)`,
          data: product.equityUpsideIncome || [0,0,0,0,0,0,0,0,0,0],
          decimals: 2,
          formula: (product.equityUpsideIncome || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
            const productKey = Object.keys(assumptions.products || {}).find(k => 
              assumptions.products[k].name === product.name
            );
            const originalProduct = productKey ? assumptions.products[productKey] : {};
            
            return createFormula(
              i,
              'New Business Volume × Equity Upside Rate',
              [
                {
                  name: 'New Business Volume',
                  value: (product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
                  unit: '€M',
                  calculation: 'Volume of new business originated'
                },
                {
                  name: 'Equity Upside Rate',
                  value: originalProduct.equityUpside || 0,
                  unit: '%',
                  calculation: 'Potential equity participation rate'
                }
              ],
              year => {
                const volume = (product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[year] || 0;
                const rate = originalProduct.equityUpside || 0;
                return `${formatNumber(volume, 2)} × ${formatNumber(rate, 2)}% = ${formatNumber(val, 2)} €M`;
              }
            );
          })
        })) : []
    },

    {
      label: 'Trading Income',
      data: [0,0,0,0,0,0,0,0,0,0],
      decimals: 2
    },

    // ========== TOTAL REVENUES ==========
    {
      label: 'Total Revenues',
      data: totalRevenues,
      decimals: 2,
      isTotal: true,
      bgColor: 'gray',
      formula: totalRevenues.map((val, i) => createFormula(i,
        'NII + NCI + Other Income + Trading Income',
        [
          year => `NII: ${formatNumber(netInterestIncome[year], 2)} €M`,
          year => `NCI: ${formatNumber(netCommissionIncome[year], 2)} €M`,
          year => `Other Income: ${formatNumber(otherIncome[year], 2)} €M`,
          year => `Trading: 0 €M`,
          year => `Total: ${formatNumber(val, 2)} €M`
        ],
        year => `${formatNumber(netInterestIncome[year], 2)} + ${formatNumber(netCommissionIncome[year], 2)} + ${formatNumber(otherIncome[year], 2)} + 0 = ${formatNumber(val, 2)} €M`
      ))
    },

    // ========== PERSONNEL COSTS ==========
    {
      label: 'Personnel cost',
      data: personnelCosts,
      decimals: 2,
      isHeader: true,
      formula: personnelCosts.map((val, i) => createFormula(i,
        'FTE × Average Cost per FTE',
        [
          year => `Division FTE allocation based on RWA`,
          year => `Personnel Costs: ${formatNumber(val, 2)} €M`
        ]
      )),
      // Add product breakdown as subRows
      subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
        label: `o/w ${product.name}`,
        data: product.personnelCosts || [0,0,0,0,0,0,0,0,0,0],
        decimals: 2,
        formula: (product.personnelCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
          createFormula(
            i,
            'Total Personnel Costs × RWA Weight',
            [
              {
                name: 'Total Personnel Costs',
                value: personnelCosts[i] || 0,
                unit: '€M',
                calculation: 'Division total personnel costs'
              },
              {
                name: 'Product RWA Weight',
                value: globalResults.capital.totalRWA[i] > 0 ? 
                  ((product.rwa || [0,0,0,0,0,0,0,0,0,0])[i] / globalResults.capital.totalRWA[i] * 100) : 0,
                unit: '%',
                calculation: 'Product RWA as % of total RWA'
              }
            ],
            year => {
              const totalPersonnel = personnelCosts[year] || 0;
              const rwaWeight = globalResults.capital.totalRWA[year] > 0 ? 
                ((product.rwa || [0,0,0,0,0,0,0,0,0,0])[year] / globalResults.capital.totalRWA[year]) : 0;
              return `${formatNumber(totalPersonnel, 2)} × ${formatNumber(rwaWeight * 100, 2)}% = ${formatNumber(Math.abs(val), 2)} €M`;
            }
          )
        )
      })) : []
    },

    // ========== OTHER OPEX ==========
    {
      label: 'Other OPEX',
      data: otherOpex,
      decimals: 2,
      isHeader: true,
      formula: otherOpex.map((val, i) => createFormula(i,
        'Admin + Marketing + IT + HQ Allocation',
        [
          year => `Allocated based on division RWA share`,
          year => `Other OPEX: ${formatNumber(val, 2)} €M`
        ]
      )),
      // Add breakdown as subRows
      subRows: showProductDetail ? [
        {
          label: 'Back-office and other admin costs',
          data: otherOpex.map(o => o * 0.4), // Approximate split
          decimals: 2,
          formula: otherOpex.map((val, i) => createFormula(
            i,
            'Total Other OPEX × 40%',
            [
              {
                name: 'Total Other OPEX',
                value: val,
                unit: '€M',
                calculation: 'Sum of admin, marketing, IT, HQ costs'
              }
            ],
            year => `${formatNumber(val, 2)} × 40% = ${formatNumber(Math.abs(val * 0.4), 2)} €M`
          ))
        },
        {
          label: 'IT costs',
          data: otherOpex.map(o => o * 0.3), // Approximate split
          decimals: 2,
          formula: otherOpex.map((val, i) => createFormula(
            i,
            'Total Other OPEX × 30%',
            [
              {
                name: 'Total Other OPEX',
                value: val,
                unit: '€M',
                calculation: 'Sum of admin, marketing, IT, HQ costs'
              }
            ],
            year => `${formatNumber(val, 2)} × 30% = ${formatNumber(Math.abs(val * 0.3), 2)} €M`
          ))
        },
        {
          label: 'HQ Allocation',
          data: otherOpex.map(o => o * 0.2), // Approximate split
          decimals: 2,
          formula: otherOpex.map((val, i) => createFormula(
            i,
            'Total Other OPEX × 20%',
            [
              {
                name: 'Total Other OPEX',
                value: val,
                unit: '€M',
                calculation: 'Sum of admin, marketing, IT, HQ costs'
              }
            ],
            year => `${formatNumber(val, 2)} × 20% = ${formatNumber(Math.abs(val * 0.2), 2)} €M`
          ))
        },
        {
          label: 'Other Costs',
          data: otherOpex.map(o => o * 0.1), // Approximate split
          decimals: 2,
          formula: otherOpex.map((val, i) => createFormula(
            i,
            'Total Other OPEX × 10%',
            [
              {
                name: 'Total Other OPEX',
                value: val,
                unit: '€M',
                calculation: 'Sum of admin, marketing, IT, HQ costs'
              }
            ],
            year => `${formatNumber(val, 2)} × 10% = ${formatNumber(Math.abs(val * 0.1), 2)} €M`
          ))
        },
        // Product-level breakdown
        ...Object.entries(productResults).map(([key, product], index) => ({
          label: `o/w ${product.name}`,
          data: product.otherOpex || [0,0,0,0,0,0,0,0,0,0],
          decimals: 2,
          formula: (product.otherOpex || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
            createFormula(
              i,
              'Total Other OPEX × RWA Weight',
              [
                {
                  name: 'Total Other OPEX',
                  value: otherOpex[i] || 0,
                  unit: '€M',
                  calculation: 'Division total other OPEX'
                },
                {
                  name: 'Product RWA Weight',
                  value: globalResults.capital.totalRWA[i] > 0 ? 
                    ((product.rwa || [0,0,0,0,0,0,0,0,0,0])[i] / globalResults.capital.totalRWA[i] * 100) : 0,
                  unit: '%',
                  calculation: 'Product RWA as % of total RWA'
                }
              ],
              year => {
                const totalOtherOpex = otherOpex[year] || 0;
                const rwaWeight = globalResults.capital.totalRWA[year] > 0 ? 
                  ((product.rwa || [0,0,0,0,0,0,0,0,0,0])[year] / globalResults.capital.totalRWA[year]) : 0;
                return `${formatNumber(totalOtherOpex, 2)} × ${formatNumber(rwaWeight * 100, 2)}% = ${formatNumber(Math.abs(val), 2)} €M`;
              }
            )
          )
        }))
      ] : []
    },

    // ========== TOTAL OPEX ==========
    {
      label: 'Total OPEX',
      data: totalOpex,
      decimals: 2,
      isSubTotal: true,
      bgColor: 'gray',
      formula: totalOpex.map((val, i) => createFormula(i,
        'Personnel Costs + Other OPEX',
        [
          year => `Personnel: ${formatNumber(personnelCosts[year], 2)} €M`,
          year => `Other OPEX: ${formatNumber(otherOpex[year], 2)} €M`,
          year => `Total: ${formatNumber(val, 2)} €M`
        ],
        year => `${formatNumber(personnelCosts[year], 2)} + ${formatNumber(otherOpex[year], 2)} = ${formatNumber(val, 2)} €M`
      ))
    },

    // ========== OTHER COSTS SECTION ==========
    {
      label: 'Other Costs',
      data: [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      // Add breakdown as subRows
      subRows: showProductDetail ? [
        {
          label: 'Loan loss provisions',
          data: divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0],
          decimals: 2,
          formula: (divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => createFormula(i,
            'Expected Loss on New Business + NPL Provisions',
            [
              year => `Total LLP: ${formatNumber(val, 2)} €M`
            ]
          )),
          // Add product breakdown as nested subRows
          subRows: showProductDetail ? Object.entries(productResults).map(([key, product], index) => ({
            label: `o/w ${product.name}`,
            data: product.llp || [0,0,0,0,0,0,0,0,0,0],
            decimals: 2,
            formula: (product.llp || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
              const productKey = Object.keys(assumptions.products || {}).find(k => 
                assumptions.products[k].name === product.name
              );
              const originalProduct = productKey ? assumptions.products[productKey] : {};
              
              return createProductFormula(i, product, 'llp', {
                pd: (originalProduct.dangerRate || 0) / 100,
                lgd: 0.45, // Standard LGD assumption
                ead: (product.newBusiness || [0,0,0,0,0,0,0,0,0,0])[i] || 0,
                creditClass: 'Bonis',
                result: val
              });
            })
          })) : []
        },
        {
          label: 'Provisions for liabilities and charges (TFR)',
          data: [0,0,0,0,0,0,0,0,0,0],
          decimals: 2,
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
      decimals: 2,
      isTotal: true,
      bgColor: 'gray',
      formula: preTaxProfit.map((val, i) => createFormula(i,
        'Total Revenues - Total OPEX - Other Costs',
        [
          year => `Revenues: ${formatNumber(totalRevenues[year], 2)} €M`,
          year => `OPEX: ${formatNumber(totalOpex[year], 2)} €M`,
          year => `LLP: ${formatNumber((divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0])[year], 2)} €M`,
          year => `PBT: ${formatNumber(val, 2)} €M`
        ],
        year => {
          const llp = (divisionResults.pnl.totalLLP || [0,0,0,0,0,0,0,0,0,0])[year] || 0;
          return `${formatNumber(totalRevenues[year], 2)} - ${formatNumber(Math.abs(totalOpex[year]), 2)} - ${formatNumber(Math.abs(llp), 2)} = ${formatNumber(val, 2)} €M`;
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

  return <FinancialTable title="1. P&L (€M)" rows={transformedRows} />;
};

export default StandardPnL;