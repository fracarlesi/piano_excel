import React from 'react';
import FinancialTable from '../common/FinancialTable';
import StandardCapitalRequirements from '../common/StandardCapitalRequirements';
import { formatNumber } from '../../utils/formatters';
import { createFormula } from '../../utils/formulaHelpers';

/**
 * Treasury / ALM Division Sheet
 * Shows treasury operations, liquidity management, and funding activities
 */
const TreasurySheet = ({ divisionResults, assumptions, globalResults, productResults }) => {
  const treasury = divisionResults || {};
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // P&L Structure for Treasury
  const pnlRows = [
    // ========== REVENUES SECTION ==========
    {
      label: 'Treasury Income',
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'green'
    },
    
    {
      label: 'Liquidity Buffer Income',
      data: treasury.pnl?.liquidityBufferIncome || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (treasury.pnl?.liquidityBufferIncome || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Liquidity Buffer × Return Rate',
          [
            {
              name: 'Liquidity Buffer',
              value: (treasury.bs?.liquidAssets || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M',
              calculation: `${assumptions.treasury?.liquidityBufferRequirement || 0}% of deposits`
            },
            {
              name: 'Return Rate',
              value: assumptions.treasury?.liquidAssetReturnRate || 0,
              unit: '%',
              calculation: 'Return on liquid assets'
            }
          ],
          year => `${formatNumber((treasury.bs?.liquidAssets || [0,0,0,0,0,0,0,0,0,0])[year], 2)} × ${formatNumber(assumptions.treasury?.liquidAssetReturnRate || 0, 2)}% = ${formatNumber(val, 2)} €M`
        )
      )
    },
    
    {
      label: 'Trading Book Income',
      data: treasury.pnl?.tradingIncome || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (treasury.pnl?.tradingIncome || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Trading Book × Target Return',
          [
            {
              name: 'Trading Book Size',
              value: (treasury.bs?.tradingBook || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M',
              calculation: 'Trading portfolio size'
            },
            {
              name: 'Target Return',
              value: assumptions.treasury?.tradingBookReturnTarget || 0,
              unit: '%',
              calculation: 'Target trading return'
            }
          ],
          year => `${formatNumber((treasury.bs?.tradingBook || [0,0,0,0,0,0,0,0,0,0])[year], 2)} × ${formatNumber(assumptions.treasury?.tradingBookReturnTarget || 0, 2)}% = ${formatNumber(val, 2)} €M`
        )
      )
    },
    
    {
      label: 'FTP Spread Income',
      data: treasury.pnl?.ftpSpreadIncome || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (treasury.pnl?.ftpSpreadIncome || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'FTP Income from Divisions - Deposit Costs',
          [
            {
              name: 'Total Loans',
              value: (globalResults.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M',
              calculation: 'Total lending assets'
            },
            {
              name: 'FTP Rate',
              value: (assumptions.euribor || 0) + (assumptions.ftpSpread || 0),
              unit: '%',
              calculation: `EURIBOR ${assumptions.euribor || 0}% + Spread ${assumptions.ftpSpread || 0}%`
            },
            {
              name: 'Total Deposits',
              value: (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M',
              calculation: 'Customer deposits'
            },
            {
              name: 'Deposit Rate',
              value: assumptions.depositRate || 0,
              unit: '%',
              calculation: 'Rate paid to depositors'
            }
          ],
          year => {
            const ftpIncome = (globalResults.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0])[year] * ((assumptions.euribor || 0) + (assumptions.ftpSpread || 0)) / 100;
            const depositCost = (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[year] * (assumptions.depositRate || 0) / 100;
            return `FTP Income ${formatNumber(ftpIncome, 2)} - Deposit Cost ${formatNumber(depositCost, 2)} = ${formatNumber(val, 2)} €M`;
          }
        )
      )
    },
    
    {
      label: 'Total Interest Income',
      data: treasury.pnl?.interestIncome || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isSubTotal: true
    },
    
    // ========== COSTS SECTION ==========
    {
      label: 'Treasury Costs',
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'red'
    },
    
    {
      label: 'Interbank Funding Cost',
      data: treasury.pnl?.interbankFundingCost || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (treasury.pnl?.interbankFundingCost || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Funding Gap × Interbank Rate',
          [
            {
              name: 'Funding Gap',
              value: (treasury.bs?.interbankFunding || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M',
              calculation: 'Loans - Deposits (if positive)'
            },
            {
              name: 'Interbank Rate',
              value: assumptions.treasury?.interbankFundingRate || 0,
              unit: '%',
              calculation: 'Cost of interbank funding'
            }
          ],
          year => `${formatNumber((treasury.bs?.interbankFunding || [0,0,0,0,0,0,0,0,0,0])[year], 2)} × ${formatNumber(assumptions.treasury?.interbankFundingRate || 0, 2)}% = ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'Total Interest Expenses',
      data: treasury.pnl?.interestExpenses || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isSubTotal: true
    },
    
    {
      label: 'Net Interest Income',
      data: years.map(i => 
        (treasury.pnl?.interestIncome || [0,0,0,0,0,0,0,0,0,0])[i] + 
        (treasury.pnl?.interestExpenses || [0,0,0,0,0,0,0,0,0,0])[i]
      ),
      decimals: 2,
      isSubTotal: true,
      formula: years.map(i => {
        const income = (treasury.pnl?.interestIncome || [0,0,0,0,0,0,0,0,0,0])[i];
        const expenses = (treasury.pnl?.interestExpenses || [0,0,0,0,0,0,0,0,0,0])[i];
        const nii = income + expenses;
        
        return createFormula(
          i,
          'Interest Income - Interest Expenses',
          [
            {
              name: 'Interest Income',
              value: income,
              unit: '€M'
            },
            {
              name: 'Interest Expenses',
              value: expenses,
              unit: '€M'
            }
          ],
          year => `${formatNumber(income, 2)} - (${formatNumber(Math.abs(expenses), 2)}) = ${formatNumber(nii, 2)} €M`
        );
      })
    },
    
    {
      label: 'Trading Income',
      data: treasury.pnl?.commissionIncome || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2
    },
    
    {
      label: 'Total Revenues',
      data: treasury.pnl?.totalRevenues || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isTotal: true
    },
    
    // ========== OPERATING EXPENSES ==========
    {
      label: 'Personnel Costs',
      data: treasury.pnl?.personnelCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (treasury.pnl?.personnelCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
        const fteY1 = assumptions.treasury?.fteY1 || 0;
        const fteY5 = assumptions.treasury?.fteY5 || 0;
        const fteGrowth = (fteY5 - fteY1) / 4;
        const fte = fteY1 + (fteGrowth * Math.min(i, 4));
        
        return createFormula(
          i,
          'FTE × Average Cost per FTE',
          [
            {
              name: 'Treasury FTE',
              value: fte,
              unit: 'people'
            },
            {
              name: 'Average Cost per FTE',
              value: assumptions.avgCostPerFte || 0,
              unit: '€k'
            }
          ],
          year => `${formatNumber(fte, 0)} × €${formatNumber(assumptions.avgCostPerFte || 0, 0)}k = ${formatNumber(Math.abs(val), 2)} €M`
        );
      })
    },
    
    {
      label: 'Other OPEX',
      data: treasury.pnl?.otherOpex || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2
    },
    
    {
      label: 'Total OPEX',
      data: treasury.pnl?.totalOpex || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isSubTotal: true
    },
    
    // ========== PROFIT ==========
    {
      label: 'Pre-tax Profit',
      data: treasury.pnl?.preTaxProfit || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isTotal: true,
      formula: (treasury.pnl?.preTaxProfit || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Total Revenues + Total OPEX',
          [
            {
              name: 'Total Revenues',
              value: (treasury.pnl?.totalRevenues || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M'
            },
            {
              name: 'Total OPEX',
              value: (treasury.pnl?.totalOpex || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M'
            }
          ],
          year => {
            const revenues = (treasury.pnl?.totalRevenues || [0,0,0,0,0,0,0,0,0,0])[year];
            const opex = (treasury.pnl?.totalOpex || [0,0,0,0,0,0,0,0,0,0])[year];
            return `${formatNumber(revenues, 2)} + (${formatNumber(Math.abs(opex), 2)}) = ${formatNumber(val, 2)} €M`;
          }
        )
      )
    }
  ];

  // Balance Sheet Structure for Treasury
  const balanceSheetRows = [
    // ========== ASSETS ==========
    {
      label: 'Treasury Assets',
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Liquidity Buffer',
      data: treasury.bs?.liquidAssets || [0,0,0,0,0,0,0,0,0,0],
      decimals: 0,
      formula: (treasury.bs?.liquidAssets || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Required liquidity buffer',
          [
            {
              name: 'Total Deposits',
              value: (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M'
            },
            {
              name: 'Buffer Requirement',
              value: assumptions.treasury?.liquidityBufferRequirement || 0,
              unit: '%'
            }
          ],
          year => `${formatNumber((globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[year], 0)} × ${formatNumber(assumptions.treasury?.liquidityBufferRequirement || 0, 0)}% = ${formatNumber(val, 0)} €M`
        )
      )
    },
    
    {
      label: 'Trading Book',
      data: treasury.bs?.tradingBook || [0,0,0,0,0,0,0,0,0,0],
      decimals: 0,
      formula: (treasury.bs?.tradingBook || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Trading portfolio',
          [
            {
              name: 'Initial Size',
              value: assumptions.treasury?.tradingBookSize || 0,
              unit: '€M'
            },
            {
              name: 'Growth Rate',
              value: assumptions.treasury?.tradingBookGrowthRate || 0,
              unit: '%'
            }
          ],
          year => `${formatNumber(assumptions.treasury?.tradingBookSize || 0, 0)} × ${formatNumber(Math.pow(1 + (assumptions.treasury?.tradingBookGrowthRate || 0) / 100, year), 2)} = ${formatNumber(val, 0)} €M`
        )
      )
    },
    
    {
      label: 'Total Treasury Assets',
      data: treasury.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0],
      decimals: 0,
      isTotal: true
    },
    
    // ========== LIABILITIES ==========
    {
      label: 'Treasury Funding',
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'red'
    },
    
    {
      label: 'Interbank Funding',
      data: treasury.bs?.interbankFunding || [0,0,0,0,0,0,0,0,0,0],
      decimals: 0,
      formula: (treasury.bs?.interbankFunding || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Funding gap coverage',
          [
            {
              name: 'Total Loans',
              value: (globalResults.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M'
            },
            {
              name: 'Total Deposits',
              value: (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[i],
              unit: '€M'
            },
            {
              name: 'Funding Gap',
              value: val,
              unit: '€M',
              calculation: 'Max(0, Loans - Deposits)'
            }
          ],
          year => {
            const loans = (globalResults.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0])[year];
            const deposits = (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[year];
            return `Max(0, ${formatNumber(loans, 0)} - ${formatNumber(deposits, 0)}) = ${formatNumber(val, 0)} €M`;
          }
        )
      )
    }
  ];

  // KPI Section
  const kpiRows = [
    {
      label: 'Treasury KPIs',
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'purple'
    },
    
    {
      label: 'Funding Gap (%)',
      data: years.map(i => {
        const totalAssets = (globalResults.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const deposits = (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        return totalAssets > 0 ? ((totalAssets - deposits) / totalAssets) * 100 : 0;
      }),
      decimals: 1,
      unit: '%',
      formula: years.map(i => {
        const totalAssets = (globalResults.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const deposits = (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const gap = totalAssets - deposits;
        
        return createFormula(
          i,
          '(Loans - Deposits) / Loans',
          [
            {
              name: 'Funding Gap',
              value: gap,
              unit: '€M'
            },
            {
              name: 'Total Loans',
              value: totalAssets,
              unit: '€M'
            }
          ],
          year => totalAssets > 0 ? 
            `${formatNumber(gap, 0)} ÷ ${formatNumber(totalAssets, 0)} × 100 = ${formatNumber((gap / totalAssets) * 100, 1)}%` : 
            '0 ÷ 0 = 0%'
        );
      })
    },
    
    {
      label: 'Liquidity Ratio (%)',
      data: years.map(i => {
        const liquidAssets = (treasury.bs?.liquidAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const deposits = (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        return deposits > 0 ? (liquidAssets / deposits) * 100 : 0;
      }),
      decimals: 1,
      unit: '%',
      formula: years.map(i => {
        const liquidAssets = (treasury.bs?.liquidAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const deposits = (globalResults.bs?.digitalServiceDeposits || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        
        return createFormula(
          i,
          'Liquid Assets / Total Deposits',
          [
            {
              name: 'Liquid Assets',
              value: liquidAssets,
              unit: '€M'
            },
            {
              name: 'Total Deposits',
              value: deposits,
              unit: '€M'
            }
          ],
          year => deposits > 0 ? 
            `${formatNumber(liquidAssets, 0)} ÷ ${formatNumber(deposits, 0)} × 100 = ${formatNumber((liquidAssets / deposits) * 100, 1)}%` : 
            '0 ÷ 0 = 0%'
        );
      })
    },
    
    {
      label: 'Net FTP Margin (bps)',
      data: years.map(i => {
        const ftpSpreadIncome = (treasury.pnl?.ftpSpreadIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const totalAssets = (globalResults.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        return totalAssets > 0 ? (ftpSpreadIncome / totalAssets) * 10000 : 0;
      }),
      decimals: 0,
      unit: 'bps',
      formula: years.map(i => {
        const ftpSpreadIncome = (treasury.pnl?.ftpSpreadIncome || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const totalAssets = (globalResults.bs?.totalAssets || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        
        return createFormula(
          i,
          'FTP Spread Income / Total Assets × 10000',
          [
            {
              name: 'FTP Spread Income',
              value: ftpSpreadIncome,
              unit: '€M'
            },
            {
              name: 'Total Assets',
              value: totalAssets,
              unit: '€M'
            }
          ],
          year => totalAssets > 0 ? 
            `${formatNumber(ftpSpreadIncome, 2)} ÷ ${formatNumber(totalAssets, 0)} × 10000 = ${formatNumber((ftpSpreadIncome / totalAssets) * 10000, 0)} bps` : 
            '0 ÷ 0 = 0 bps'
        );
      })
    },
    
    {
      label: 'Treasury ROE (%)',
      data: years.map(i => {
        const netProfit = (treasury.pnl?.netProfit || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const allocatedEquity = (treasury.bs?.allocatedEquity || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        return allocatedEquity > 0 ? (netProfit / allocatedEquity) * 100 : 0;
      }),
      decimals: 1,
      unit: '%',
      formula: years.map(i => {
        const netProfit = (treasury.pnl?.netProfit || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        const allocatedEquity = (treasury.bs?.allocatedEquity || [0,0,0,0,0,0,0,0,0,0])[i] || 0;
        
        return createFormula(
          i,
          'Net Profit / Allocated Equity',
          [
            {
              name: 'Net Profit',
              value: netProfit,
              unit: '€M'
            },
            {
              name: 'Allocated Equity',
              value: allocatedEquity,
              unit: '€M'
            }
          ],
          year => allocatedEquity > 0 ? 
            `${formatNumber(netProfit, 2)} ÷ ${formatNumber(allocatedEquity, 0)} × 100 = ${formatNumber((netProfit / allocatedEquity) * 100, 1)}%` : 
            '0 ÷ 0 = 0%'
        );
      })
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <h2 className="text-2xl font-bold">Treasury / ALM Division</h2>
        <p className="text-gray-300 mt-2">
          Asset Liability Management, liquidity buffer, and funding operations
        </p>
      </div>
      
      <FinancialTable title="Treasury P&L" rows={pnlRows} />
      <FinancialTable title="Treasury Balance Sheet" rows={balanceSheetRows} />
      <StandardCapitalRequirements 
        divisionResults={treasury}
        productResults={{}} // Treasury has no products
        assumptions={assumptions}
        globalResults={globalResults}
        divisionName="Treasury"
        showProductDetail={false}
      />
      <FinancialTable title="Treasury KPIs" rows={kpiRows} />
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Treasury manages the bank's funding gap and liquidity requirements. 
          It receives FTP income from lending divisions and pays deposit costs to Digital Banking, 
          while maintaining the required liquidity buffer and managing interbank funding needs.
        </p>
      </div>
    </div>
  );
};

export default TreasurySheet;