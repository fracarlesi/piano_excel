import React from 'react';
import FinancialTable from './FinancialTable';
import { formatNumber } from '../../utils/formatters';

/**
 * Standardized KPI structure for all divisions
 * This component creates a consistent KPI view across all banking divisions
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

  // Calculate derived metrics for KPIs
  const calculateNetProfit = () => {
    return divisionResults.pnl.interestIncome.map((interest, i) => {
      const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
        globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
      const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
        -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
      
      const netInterest = interest + interestExpenses;
      const netCommissions = divisionResults.pnl.commissionIncome[i] + commissionExpenses;
      const totalIncome = netInterest + netCommissions;
      
      const personnelCosts = divisionResults.pnl.personnelCosts?.[i] || 
        -(globalResults.kpi[`${divisionName}Fte`]?.[i] || 0) * assumptions.avgCostPerFte / 1000;
      const otherOpex = divisionResults.pnl.otherOperatingExpenses?.[i] || personnelCosts * 0.5;
      const totalOpex = personnelCosts + otherOpex;
      
      const pbt = totalIncome + totalOpex + divisionResults.pnl.totalLLP[i];
      const tax = pbt > 0 ? -pbt * (assumptions.taxRate || 30) / 100 : 0;
      
      return pbt + tax;
    });
  };

  const netProfit = calculateNetProfit();

  // Standard KPI Row Structure
  const standardKPIRows = [
    // ========== PROFITABILITY ==========
    {
      label: 'PROFITABILITY METRICS',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Return on Equity (ROE) %',
      data: netProfit.map((profit, i) => {
        const avgEquity = i > 0 ? 
          (divisionResults.bs.equity[i] + divisionResults.bs.equity[i-1]) / 2 : 
          divisionResults.bs.equity[i];
        return avgEquity > 0 ? (profit / avgEquity) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: netProfit.map((profit, i) => createFormula(i,
        'Net Profit / Average Shareholders Equity × 100',
        [
          year => `Net Profit: ${formatNumber(profit, 2)} €M`,
          year => `Equity Start: ${year > 0 ? formatNumber(divisionResults.bs.equity[year-1], 0) : formatNumber(divisionResults.bs.equity[year], 0)} €M`,
          year => `Equity End: ${formatNumber(divisionResults.bs.equity[year], 0)} €M`,
          year => `Average Equity: ${formatNumber(year > 0 ? (divisionResults.bs.equity[year] + divisionResults.bs.equity[year-1]) / 2 : divisionResults.bs.equity[year], 0)} €M`,
          year => `ROE: ${formatNumber(profit / (year > 0 ? (divisionResults.bs.equity[year] + divisionResults.bs.equity[year-1]) / 2 : divisionResults.bs.equity[year]) * 100, 1)}%`
        ]
      ))
    },
    
    {
      label: 'Return on Assets (ROA) %',
      data: netProfit.map((profit, i) => {
        const totalAssets = divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        const avgAssets = i > 0 ? 
          (totalAssets + (divisionResults.bs.performingAssets[i-1] + divisionResults.bs.nonPerformingAssets[i-1] + (divisionResults.bs.otherAssets?.[i-1] || 0))) / 2 : 
          totalAssets;
        return avgAssets > 0 ? (profit / avgAssets) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: netProfit.map((profit, i) => createFormula(i,
        'Net Profit / Average Total Assets × 100',
        [
          year => `Net Profit: ${formatNumber(profit, 2)} €M`,
          year => `Average Assets: ${formatNumber(i > 0 ? ((divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year]) + (divisionResults.bs.performingAssets[year-1] + divisionResults.bs.nonPerformingAssets[year-1])) / 2 : divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year], 0)} €M`,
          year => `ROA: ${formatNumber(profit / (i > 0 ? ((divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year]) + (divisionResults.bs.performingAssets[year-1] + divisionResults.bs.nonPerformingAssets[year-1])) / 2 : divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year]) * 100, 1)}%`
        ]
      ))
    },
    
    {
      label: 'Net Interest Margin (NIM) %',
      data: divisionResults.pnl.interestIncome.map((income, i) => {
        const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
          globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
        const netInterest = income + interestExpenses;
        const avgAssets = i > 0 ? 
          ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) + 
           (divisionResults.bs.performingAssets[i-1] + divisionResults.bs.nonPerformingAssets[i-1])) / 2 : 
          divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i];
        return avgAssets > 0 ? (netInterest / avgAssets) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: divisionResults.pnl.interestIncome.map((income, i) => createFormula(i,
        'Net Interest Income / Average Interest-Earning Assets',
        [
          year => `Interest Income: ${formatNumber(income, 2)} €M`,
          year => `Interest Expenses: ${formatNumber(divisionResults.pnl.interestExpenses?.[year] || 0, 2)} €M`,
          year => `Net Interest Income: ${formatNumber(income + (divisionResults.pnl.interestExpenses?.[year] || 0), 2)} €M`,
          year => `Average Assets: ${formatNumber(i > 0 ? ((divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year]) + (divisionResults.bs.performingAssets[year-1] + divisionResults.bs.nonPerformingAssets[year-1])) / 2 : divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year], 0)} €M`,
          year => `NIM: ${formatNumber((income + (divisionResults.pnl.interestExpenses?.[year] || 0)) / (i > 0 ? ((divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year]) + (divisionResults.bs.performingAssets[year-1] + divisionResults.bs.nonPerformingAssets[year-1])) / 2 : divisionResults.bs.performingAssets[year] + divisionResults.bs.nonPerformingAssets[year]) * 100, 1)}%`
        ]
      ))
    },
    
    // ========== EFFICIENCY ==========
    {
      label: 'EFFICIENCY METRICS',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Cost-to-Income Ratio %',
      data: divisionResults.pnl.interestIncome.map((interest, i) => {
        const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
          globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
        const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
          -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
        
        const totalIncome = (interest + interestExpenses) + (divisionResults.pnl.commissionIncome[i] + commissionExpenses);
        
        const personnelCosts = Math.abs(divisionResults.pnl.personnelCosts?.[i] || 
          (globalResults.kpi[`${divisionName}Fte`]?.[i] || 0) * assumptions.avgCostPerFte / 1000);
        const otherOpex = Math.abs(divisionResults.pnl.otherOperatingExpenses?.[i] || personnelCosts * 0.5);
        const totalOpex = personnelCosts + otherOpex;
        
        return totalIncome > 0 ? (totalOpex / totalIncome) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: divisionResults.pnl.interestIncome.map((interest, i) => createFormula(i,
        'Operating Costs / Operating Income × 100',
        [
          year => {
            const interestExpenses = divisionResults.pnl.interestExpenses?.[year] || 0;
            const commissionExpenses = divisionResults.pnl.commissionExpenses?.[year] || 0;
            const totalIncome = (interest + interestExpenses) + (divisionResults.pnl.commissionIncome[year] + commissionExpenses);
            const personnelCosts = Math.abs(divisionResults.pnl.personnelCosts?.[year] || 0);
            const otherOpex = Math.abs(divisionResults.pnl.otherOperatingExpenses?.[year] || personnelCosts * 0.5);
            const totalOpex = personnelCosts + otherOpex;
            return `Total Income: ${formatNumber(totalIncome, 2)} €M`;
          },
          year => {
            const personnelCosts = Math.abs(divisionResults.pnl.personnelCosts?.[year] || 0);
            const otherOpex = Math.abs(divisionResults.pnl.otherOperatingExpenses?.[year] || personnelCosts * 0.5);
            return `Total Operating Costs: ${formatNumber(personnelCosts + otherOpex, 2)} €M`;
          },
          year => {
            const interestExpenses = divisionResults.pnl.interestExpenses?.[year] || 0;
            const commissionExpenses = divisionResults.pnl.commissionExpenses?.[year] || 0;
            const totalIncome = (interest + interestExpenses) + (divisionResults.pnl.commissionIncome[year] + commissionExpenses);
            const personnelCosts = Math.abs(divisionResults.pnl.personnelCosts?.[year] || 0);
            const otherOpex = Math.abs(divisionResults.pnl.otherOperatingExpenses?.[year] || personnelCosts * 0.5);
            const totalOpex = personnelCosts + otherOpex;
            return `Cost/Income: ${formatNumber((totalOpex / totalIncome) * 100, 1)}%`;
          }
        ]
      ))
    },
    
    {
      label: 'Revenue per FTE (€000)',
      data: divisionResults.pnl.interestIncome.map((interest, i) => {
        const interestExpenses = divisionResults.pnl.interestExpenses?.[i] || 
          globalResults.pnl.interestExpenses[i] * ((divisionResults.bs.performingAssets[i] + divisionResults.bs.nonPerformingAssets[i]) / globalResults.bs.totalAssets[i]);
        const commissionExpenses = divisionResults.pnl.commissionExpenses?.[i] || 
          -divisionResults.pnl.commissionIncome[i] * (assumptions.commissionExpenseRate || 20) / 100;
        
        const totalIncome = (interest + interestExpenses) + (divisionResults.pnl.commissionIncome[i] + commissionExpenses);
        const fte = globalResults.kpi[`${divisionName}Fte`]?.[i] || 1;
        
        return (totalIncome * 1000) / fte; // Convert to thousands
      }),
      decimals: 0,
      formula: divisionResults.pnl.interestIncome.map((interest, i) => createFormula(i,
        'Total Operating Income / FTE × 1000',
        [
          year => {
            const interestExpenses = divisionResults.pnl.interestExpenses?.[year] || 0;
            const commissionExpenses = divisionResults.pnl.commissionExpenses?.[year] || 0;
            const totalIncome = (interest + interestExpenses) + (divisionResults.pnl.commissionIncome[year] + commissionExpenses);
            return `Total Income: ${formatNumber(totalIncome, 2)} €M`;
          },
          year => `FTE: ${formatNumber(globalResults.kpi[`${divisionName}Fte`]?.[year] || 0, 0)}`,
          year => {
            const interestExpenses = divisionResults.pnl.interestExpenses?.[year] || 0;
            const commissionExpenses = divisionResults.pnl.commissionExpenses?.[year] || 0;
            const totalIncome = (interest + interestExpenses) + (divisionResults.pnl.commissionIncome[year] + commissionExpenses);
            const fte = globalResults.kpi[`${divisionName}Fte`]?.[year] || 1;
            return `Revenue per FTE: ${formatNumber((totalIncome * 1000) / fte, 0)}k€`;
          }
        ]
      ))
    },
    
    {
      label: 'Assets per FTE (€M)',
      data: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i] + (divisionResults.bs.otherAssets?.[i] || 0);
        const fte = globalResults.kpi[`${divisionName}Fte`]?.[i] || 1;
        return totalAssets / fte;
      }),
      decimals: 1,
      formula: divisionResults.bs.performingAssets.map((perf, i) => createFormula(i,
        'Total Assets / FTE',
        [
          year => {
            const totalAssets = perf + divisionResults.bs.nonPerformingAssets[year] + (divisionResults.bs.otherAssets?.[year] || 0);
            return `Total Assets: ${formatNumber(totalAssets, 0)} €M`;
          },
          year => `FTE: ${formatNumber(globalResults.kpi[`${divisionName}Fte`]?.[year] || 0, 0)}`,
          year => {
            const totalAssets = perf + divisionResults.bs.nonPerformingAssets[year] + (divisionResults.bs.otherAssets?.[year] || 0);
            const fte = globalResults.kpi[`${divisionName}Fte`]?.[year] || 1;
            return `Assets per FTE: ${formatNumber(totalAssets / fte, 1)} €M`;
          }
        ]
      ))
    },
    
    // ========== RISK METRICS ==========
    {
      label: 'RISK METRICS',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Cost of Risk (bps)',
      data: divisionResults.pnl.totalLLP.map((llp, i) => {
        const avgPerformingAssets = i > 0 ? 
          (divisionResults.bs.performingAssets[i] + divisionResults.bs.performingAssets[i-1]) / 2 : 
          divisionResults.bs.performingAssets[i];
        return avgPerformingAssets > 0 ? (-llp / avgPerformingAssets) * 10000 : 0;
      }),
      decimals: 0,
      unit: ' bps',
      formula: divisionResults.pnl.totalLLP.map((llp, i) => createFormula(i,
        'Loan Loss Provisions / Average Performing Assets × 10,000',
        [
          year => `LLP: ${formatNumber(llp, 2)} €M`,
          year => `Performing Assets Start: ${year > 0 ? formatNumber(divisionResults.bs.performingAssets[year-1], 0) : '0'} €M`,
          year => `Performing Assets End: ${formatNumber(divisionResults.bs.performingAssets[year], 0)} €M`,
          year => `Average Performing: ${formatNumber(year > 0 ? (divisionResults.bs.performingAssets[year] + divisionResults.bs.performingAssets[year-1]) / 2 : divisionResults.bs.performingAssets[year], 0)} €M`,
          year => `Cost of Risk: ${formatNumber((-llp / (year > 0 ? (divisionResults.bs.performingAssets[year] + divisionResults.bs.performingAssets[year-1]) / 2 : divisionResults.bs.performingAssets[year])) * 10000, 0)} bps`
        ]
      ))
    },
    
    {
      label: 'NPL Ratio %',
      data: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalLoans = perf + divisionResults.bs.nonPerformingAssets[i];
        return totalLoans > 0 ? (divisionResults.bs.nonPerformingAssets[i] / totalLoans) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: divisionResults.bs.performingAssets.map((perf, i) => createFormula(i,
        'Non-Performing Loans / Total Loans × 100',
        [
          year => `NPL: ${formatNumber(divisionResults.bs.nonPerformingAssets[year], 0)} €M`,
          year => `Total Loans: ${formatNumber(perf + divisionResults.bs.nonPerformingAssets[year], 0)} €M`,
          year => `NPL Ratio: ${formatNumber((divisionResults.bs.nonPerformingAssets[year] / (perf + divisionResults.bs.nonPerformingAssets[year])) * 100, 1)}%`
        ]
      ))
    },
    
    {
      label: 'Coverage Ratio %',
      data: divisionResults.bs.nonPerformingAssets.map((npl, i) => {
        // Assume 50% coverage ratio as example - this should be calculated from provisions
        return npl > 0 ? 50.0 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: divisionResults.bs.nonPerformingAssets.map((npl, i) => createFormula(i,
        'Provisions / Non-Performing Loans × 100',
        [
          'Standard coverage assumption of 50%',
          year => `NPL: ${formatNumber(npl, 0)} €M`,
          year => `Coverage: 50%`
        ]
      ))
    },
    
    // ========== CAPITAL EFFICIENCY ==========
    {
      label: 'CAPITAL EFFICIENCY',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'CET1 Ratio %',
      data: divisionResults.capital.cet1Ratio || divisionResults.bs.equity.map((equity, i) => 
        divisionResults.capital.totalRWA[i] > 0 ? (equity / divisionResults.capital.totalRWA[i]) * 100 : 0
      ),
      decimals: 1,
      isPercentage: true,
      formula: (divisionResults.capital.cet1Ratio || []).map((val, i) => createFormula(i,
        'CET1 Capital / Risk Weighted Assets × 100',
        [
          year => `CET1 Capital: ${formatNumber(divisionResults.bs.equity[year], 0)} €M`,
          year => `RWA: ${formatNumber(divisionResults.capital.totalRWA[year], 0)} €M`,
          year => `CET1 Ratio: ${formatNumber(val || 0, 1)}%`,
          'Regulatory minimum: 4.5% + buffers'
        ]
      ))
    },
    
    {
      label: 'RWA Density %',
      data: divisionResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + divisionResults.bs.nonPerformingAssets[i];
        return totalAssets > 0 ? (divisionResults.capital.rwaCreditRisk[i] / totalAssets) * 100 : 0;
      }),
      decimals: 1,
      isPercentage: true,
      formula: divisionResults.bs.performingAssets.map((perf, i) => createFormula(i,
        'Credit Risk RWA / Total Assets × 100',
        [
          year => `Credit RWA: ${formatNumber(divisionResults.capital.rwaCreditRisk[year], 0)} €M`,
          year => `Total Assets: ${formatNumber(perf + divisionResults.bs.nonPerformingAssets[year], 0)} €M`,
          year => `RWA Density: ${formatNumber((divisionResults.capital.rwaCreditRisk[year] / (perf + divisionResults.bs.nonPerformingAssets[year])) * 100, 1)}%`
        ]
      ))
    },
    
    // ========== OPERATIONAL METRICS ==========
    {
      label: 'OPERATIONAL METRICS',
      data: [null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'Full-Time Employees (FTE)',
      data: globalResults.kpi[`${divisionName}Fte`] || [0, 0, 0, 0, 0],
      decimals: 0,
      formula: (globalResults.kpi[`${divisionName}Fte`] || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Division headcount',
        [
          year => `FTE Year ${year + 1}: ${formatNumber(val, 0)}`,
          'Growth based on business expansion plans'
        ]
      ))
    },
    
    {
      label: 'Loans Outstanding (# of loans)',
      data: (() => {
        if (showProductDetail && Object.keys(productResults).length > 0) {
          return [0, 1, 2, 3, 4].map(year => 
            Object.values(productResults).reduce((sum, product) => 
              sum + (product.numberOfLoans?.[year] || 0), 0
            )
          );
        }
        return [0, 0, 0, 0, 0];
      })(),
      decimals: 0,
      formula: (() => {
        if (showProductDetail && Object.keys(productResults).length > 0) {
          return [0, 1, 2, 3, 4].map(year => createFormula(year,
            'Σ(New Loans per Product)',
            [
              ...Object.entries(productResults).map(([key, product]) =>
                `${product.name}: ${formatNumber(product.numberOfLoans?.[year] || 0, 0)} loans`
              ),
              `Total: ${formatNumber(Object.values(productResults).reduce((sum, product) => sum + (product.numberOfLoans?.[year] || 0), 0), 0)} loans`
            ]
          ));
        }
        return [0, 0, 0, 0, 0].map(() => createFormula(0, 'No product data available', []));
      })()
    },
    
    {
      label: 'Average Loan Size (€000)',
      data: (() => {
        if (showProductDetail && Object.keys(productResults).length > 0) {
          return divisionResults.bs.performingAssets.map((assets, i) => {
            const totalLoans = Object.values(productResults).reduce((sum, product) => 
              sum + (product.numberOfLoans?.[i] || 0), 0
            );
            return totalLoans > 0 ? (assets * 1000) / totalLoans : 0;
          });
        }
        return [0, 0, 0, 0, 0];
      })(),
      decimals: 0,
      formula: (() => {
        if (showProductDetail && Object.keys(productResults).length > 0) {
          return divisionResults.bs.performingAssets.map((assets, i) => createFormula(i,
            'Total Performing Assets / Number of Loans × 1000',
            [
              year => `Performing Assets: ${formatNumber(assets, 0)} €M`,
              year => {
                const totalLoans = Object.values(productResults).reduce((sum, product) => 
                  sum + (product.numberOfLoans?.[year] || 0), 0
                );
                return `Number of Loans: ${formatNumber(totalLoans, 0)}`;
              },
              year => {
                const totalLoans = Object.values(productResults).reduce((sum, product) => 
                  sum + (product.numberOfLoans?.[year] || 0), 0
                );
                return `Average Size: ${formatNumber(totalLoans > 0 ? (assets * 1000) / totalLoans : 0, 0)}k€`;
              }
            ]
          ));
        }
        return [0, 0, 0, 0, 0].map(() => createFormula(0, 'No product data available', []));
      })()
    }
  ];

  // Apply any custom row transformations
  const finalRows = standardKPIRows.map(row => ({
    ...row,
    ...(customRowTransformations[row.label] || {})
  }));

  return <FinancialTable title="Key Performance Indicators" rows={finalRows} />;
};

export default StandardKPIs;