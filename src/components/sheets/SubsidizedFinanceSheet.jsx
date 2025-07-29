import React from 'react';
import FinancialTable from '../common/FinancialTable';
import { formatNumber } from '../../utils/formatters';

const SubsidizedFinanceSheet = ({ assumptions, results }) => {
  // Helper function to create formula explanations
  const createFormula = (year, formula, details) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d)
  });

  // Filter only Subsidized Finance products
  const subsidizedProductResults = Object.fromEntries(
    Object.entries(results.productResults).filter(([key]) => key.startsWith('subsidized'))
  );

  // Use Subsidized Finance division-specific results
  const subsidizedResults = {
    ...results,
    bs: {
      ...results.bs,
      performingAssets: results.divisions.subsidized?.bs.performingAssets || [0, 0, 0, 0, 0],
      nonPerformingAssets: results.divisions.subsidized?.bs.nonPerformingAssets || [0, 0, 0, 0, 0],
      equity: results.divisions.subsidized?.bs.allocatedEquity || [0, 0, 0, 0, 0],
    },
    pnl: {
      ...results.pnl,
      interestIncome: results.divisions.subsidized?.pnl.interestIncome || [0, 0, 0, 0, 0],
      commissionIncome: results.divisions.subsidized?.pnl.commissionIncome || [0, 0, 0, 0, 0],
      totalLLP: results.divisions.subsidized?.pnl.totalLLP || [0, 0, 0, 0, 0],
    },
    capital: {
      ...results.capital,
      rwaCreditRisk: results.divisions.subsidized?.capital.rwaCreditRisk || [0, 0, 0, 0, 0],
      totalRWA: results.divisions.subsidized?.capital.totalRWA || [0, 0, 0, 0, 0],
    },
    kpi: {
      ...results.kpi,
      fte: results.kpi.subsidizedFte || [0, 0, 0, 0, 0],
      cet1Ratio: results.divisions.subsidized?.capital.cet1Ratio || [0, 0, 0, 0, 0],
    }
  };

  const pnlRows = [
    { 
      label: 'Interest Income', 
      data: subsidizedResults.pnl.interestIncome, 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.pnl.interestIncome.map((val, i) => createFormula(i, 
        'Interest Income = ∑(Performing Assets × Interest Rate)',
        [
          'Lower interest rates due to government subsidies',
          ...Object.entries(subsidizedProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.performingAssets[year])} × ${formatNumber((product.assumptions?.interestRate || 0) * 100, 2)}% = ${formatNumber(product.interestIncome[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Advisory & Commission Income', 
      data: subsidizedResults.pnl.commissionIncome, 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.pnl.commissionIncome.map((val, i) => createFormula(i,
        'Advisory Income = ∑(New Business × Advisory Fee)',
        [
          'Higher advisory fees for government incentive expertise',
          ...Object.entries(subsidizedProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.newBusiness?.[year] || 0)} × ${formatNumber((product.assumptions?.commissionRate || 0) * 100, 2)}% = ${formatNumber(product.commissionIncome[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Total Income', 
      data: subsidizedResults.pnl.interestIncome.map((interest, i) => 
        interest + subsidizedResults.pnl.commissionIncome[i]
      ), 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.pnl.interestIncome.map((val, i) => createFormula(i,
        'Total Income = Interest Income + Advisory Income',
        [
          year => `Interest Income: ${formatNumber(subsidizedResults.pnl.interestIncome[year])}`,
          year => `Advisory Income: ${formatNumber(subsidizedResults.pnl.commissionIncome[year])}`,
          year => `Total: ${formatNumber(subsidizedResults.pnl.interestIncome[year] + subsidizedResults.pnl.commissionIncome[year])}`
        ]
      ))
    },
    { 
      label: 'Personnel Costs', 
      data: results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0], 
      decimals: 2, 
      isNegative: true,
      formula: (results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Personnel Costs = FTE × Average Personnel Cost',
        [
          year => `FTE: ${formatNumber(subsidizedResults.kpi.fte[year], 0)}`,
          year => `Average Cost: ${formatNumber((assumptions.personnel?.subsidizedAveragePersonnelCost || 95) * 1000)} (Specialists in government incentives)`,
          year => `Total: ${formatNumber((results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[year])}`
        ]
      ))
    },
    { 
      label: 'Other Operating Costs', 
      data: results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0], 
      decimals: 2, 
      isNegative: true,
      formula: (results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Other Operating Costs = Personnel Costs × Operating Cost Ratio',
        [
          year => `Personnel Costs: ${formatNumber((results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[year])}`,
          year => `Operating Cost Ratio: ${formatNumber((assumptions.costs?.subsidizedOperatingCostRatio || 0.4) * 100, 1)}% (Lower due to government support)`,
          year => `Total: ${formatNumber((results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0])[year])}`
        ]
      ))
    },
    { 
      label: 'Gross Profit', 
      data: subsidizedResults.pnl.interestIncome.map((interest, i) => {
        const totalIncome = interest + subsidizedResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const otherCosts = (results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        return totalIncome + personnelCosts + otherCosts; // costs are negative
      }), 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.pnl.interestIncome.map((val, i) => createFormula(i,
        'Gross Profit = Total Income - Operating Costs',
        [
          year => `Total Income: ${formatNumber(subsidizedResults.pnl.interestIncome[year] + subsidizedResults.pnl.commissionIncome[year])}`,
          year => `Personnel Costs: ${formatNumber((results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[year])}`,
          year => `Other Operating Costs: ${formatNumber((results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0])[year])}`,
          year => {
            const totalIncome = subsidizedResults.pnl.interestIncome[year] + subsidizedResults.pnl.commissionIncome[year];
            const personnelCosts = (results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[year];
            const otherCosts = (results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0])[year];
            return `Gross Profit: ${formatNumber(totalIncome + personnelCosts + otherCosts)}`;
          }
        ]
      ))
    },
    { 
      label: 'Loan Loss Provisions', 
      data: subsidizedResults.pnl.totalLLP, 
      decimals: 2, 
      isNegative: true,
      formula: subsidizedResults.pnl.totalLLP.map((val, i) => createFormula(i,
        'LLP = ∑(New Business × PD × LGD) - Lower due to government guarantees',
        [
          'Reduced provisions thanks to state backing',
          ...Object.entries(subsidizedProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.newBusiness?.[year] || 0)} × ${formatNumber((product.assumptions?.pd || 0) * 100, 2)}% × ${formatNumber((product.assumptions?.lgd || 0) * 100, 0)}% = ${formatNumber(product.llp?.[year] || 0)}`
          )
        ]
      ))
    },
    { 
      label: 'Net Profit Before Tax', 
      data: subsidizedResults.pnl.interestIncome.map((interest, i) => {
        const totalIncome = interest + subsidizedResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const otherCosts = (results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        const grossProfit = totalIncome + personnelCosts + otherCosts;
        return grossProfit + subsidizedResults.pnl.totalLLP[i]; // totalLLP is negative
      }), 
      decimals: 2, 
      isTotal: true
    }
  ];

  const bsRows = [
    { 
      label: 'Performing Assets', 
      data: subsidizedResults.bs.performingAssets, 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.bs.performingAssets.map((val, i) => createFormula(i,
        'Performing Assets = ∑(Government-backed loans)',
        [
          'Assets backed by government guarantees and incentives',
          ...Object.entries(subsidizedProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.performingAssets[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Non-Performing Assets', 
      data: subsidizedResults.bs.nonPerformingAssets, 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.bs.nonPerformingAssets.map((val, i) => createFormula(i,
        'NPL = Minimal due to government backing',
        [
          year => `NPL: ${formatNumber(subsidizedResults.bs.nonPerformingAssets[year])}`,
          'Government guarantees significantly reduce NPL risk'
        ]
      ))
    },
    { 
      label: 'Total Assets', 
      data: subsidizedResults.bs.performingAssets.map((perf, i) => 
        perf + subsidizedResults.bs.nonPerformingAssets[i]
      ), 
      decimals: 2, 
      isTotal: true
    },
    { 
      label: 'Allocated Equity', 
      data: subsidizedResults.bs.equity, 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.bs.equity.map((val, i) => createFormula(i,
        'Allocated Equity = RWA × Target CET1 Ratio',
        [
          year => `Total RWA: ${formatNumber(subsidizedResults.capital.totalRWA[year])}`,
          year => `Target CET1 Ratio: ${formatNumber((assumptions.capital?.targetCET1Ratio || 0.135) * 100, 1)}%`,
          year => `Allocated Equity: ${formatNumber(subsidizedResults.bs.equity[year])}`
        ]
      ))
    }
  ];

  const capitalRows = [
    { 
      label: 'RWA - Credit Risk', 
      data: subsidizedResults.capital.rwaCreditRisk, 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.capital.rwaCreditRisk.map((val, i) => createFormula(i,
        'RWA Credit = ∑(Assets × Risk Weight) - Reduced weights for government backing',
        [
          'Lower risk weights due to government guarantees',
          ...Object.entries(subsidizedProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.performingAssets[year] + product.nonPerformingAssets[year])} × ${formatNumber((product.assumptions?.riskWeight || 0) * 100, 0)}% = ${formatNumber(product.rwa?.[year] || 0)}`
          )
        ]
      ))
    },
    { 
      label: 'Total RWA', 
      data: subsidizedResults.capital.totalRWA, 
      decimals: 2, 
      isTotal: true,
      formula: subsidizedResults.capital.totalRWA.map((val, i) => createFormula(i,
        'Total RWA = RWA Credit Risk + Operational Risk',
        [
          year => `RWA Credit Risk: ${formatNumber(subsidizedResults.capital.rwaCreditRisk[year])}`,
          'Note: Simplified calculation - excludes market risk'
        ]
      ))
    },
    { 
      label: 'CET1 Ratio (%)', 
      data: subsidizedResults.kpi.cet1Ratio.map(ratio => ratio * 100), 
      decimals: 1, 
      isPercentage: true,
      formula: subsidizedResults.kpi.cet1Ratio.map((val, i) => createFormula(i,
        'CET1 Ratio = Allocated Equity / Total RWA',
        [
          year => `Allocated Equity: ${formatNumber(subsidizedResults.bs.equity[year])}`,
          year => `Total RWA: ${formatNumber(subsidizedResults.capital.totalRWA[year])}`,
          year => `CET1 Ratio: ${formatNumber(subsidizedResults.kpi.cet1Ratio[year] * 100, 1)}%`
        ]
      ))
    }
  ];

  const kpiRows = [
    { 
      label: 'ROE (%)', 
      data: subsidizedResults.bs.equity.map((equity, i) => {
        const totalIncome = subsidizedResults.pnl.interestIncome[i] + subsidizedResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const otherCosts = (results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        const grossProfit = totalIncome + personnelCosts + otherCosts;
        const netProfit = grossProfit + subsidizedResults.pnl.totalLLP[i];
        const afterTaxProfit = netProfit * (1 - (assumptions.tax?.corporateTaxRate || 0.28));
        return equity > 0 ? (afterTaxProfit / equity) * 100 : 0;
      }), 
      decimals: 1, 
      isPercentage: true
    },
    { 
      label: 'Cost/Income Ratio (%)', 
      data: subsidizedResults.pnl.interestIncome.map((interest, i) => {
        const totalIncome = interest + subsidizedResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const otherCosts = (results.pnl.subsidizedOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        const totalCosts = Math.abs(personnelCosts) + Math.abs(otherCosts);
        return totalIncome > 0 ? (totalCosts / totalIncome) * 100 : 0;
      }), 
      decimals: 1, 
      isPercentage: true
    },
    { 
      label: 'FTE', 
      data: subsidizedResults.kpi.fte, 
      decimals: 0,
      formula: subsidizedResults.kpi.fte.map((val, i) => createFormula(i,
        'FTE = Personnel Costs / Average Personnel Cost',
        [
          year => `Personnel Costs: ${formatNumber((results.pnl.subsidizedPersonnelCosts || [0, 0, 0, 0, 0])[year])}`,
          year => `Average Personnel Cost: ${formatNumber((assumptions.personnel?.subsidizedAveragePersonnelCost || 95) * 1000)}`,
          year => `FTE: ${formatNumber(subsidizedResults.kpi.fte[year], 0)}`
        ]
      ))
    },
    { 
      label: 'NPL Ratio (%)', 
      data: subsidizedResults.bs.performingAssets.map((perf, i) => {
        const totalAssets = perf + subsidizedResults.bs.nonPerformingAssets[i];
        return totalAssets > 0 ? (subsidizedResults.bs.nonPerformingAssets[i] / totalAssets) * 100 : 0;
      }), 
      decimals: 1, 
      isPercentage: true
    },
    { 
      label: 'Government Guarantee Coverage (%)', 
      data: [80, 82, 85, 87, 90], // Example progressive coverage
      decimals: 1, 
      isPercentage: true,
      formula: [80, 82, 85, 87, 90].map((val, i) => createFormula(i,
        'Government Coverage = Assets with state guarantees / Total Assets',
        [
          year => `Coverage: ${val}%`,
          'Progressive increase in government-backed financing'
        ]
      ))
    }
  ];

  const divisionOverview = [
    { label: 'Division Focus', value: 'Focalizzata sull\'erogazione di credito alle PMI ottimizzando l\'uso di garanzie e incentivi pubblici' },
    { label: 'Target Market', value: 'PMI che necessitano di finanziamenti con supporto governativo' },
    { label: 'Key Products', value: Object.keys(subsidizedProductResults).length + ' subsidized financing products' },
    { label: 'Competitive Advantage', value: 'Expertise in navigating government incentive programs and guarantee schemes' },
    { label: 'Risk Profile', value: 'Lower risk thanks to government backing and guarantees' }
  ];

  return (
    <div className="p-4">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">🏛️ Finanza Agevolata PMI</h1>
        
        {/* Division Overview */}
        <div className="mb-8 bg-green-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Division Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            {divisionOverview.map((item, index) => (
              <div key={index} className="flex">
                <span className="font-medium text-gray-700 w-1/3">{item.label}:</span>
                <span className="text-gray-600">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Government Incentives Highlight */}
        <div className="mb-8 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">🎯 Government Incentives Expertise</h3>
          <p className="text-green-100">
            Specializzazione nell'ottimizzazione di garanzie pubbliche, incentivi statali e bandi europei 
            per massimizzare l'accessibilità al credito delle PMI riducendo contemporaneamente il rischio.
          </p>
        </div>

        {/* Product Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Product Portfolio</h2>
          {Object.keys(subsidizedProductResults).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(subsidizedProductResults).map(([key, product]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium">{((product.assumptions?.interestRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advisory Fee:</span>
                      <span className="font-medium">{((product.assumptions?.commissionRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Weight:</span>
                      <span className="font-medium">{((product.assumptions?.riskWeight || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">⚠️ No subsidized finance products configured yet. Add products starting with "subsidized" in defaultAssumptions.js</p>
            </div>
          )}
        </div>

        {/* Financial Tables */}
        <FinancialTable title="Profit & Loss Statement" rows={pnlRows} />
        <FinancialTable title="Balance Sheet" rows={bsRows} />
        <FinancialTable title="Capital Requirements" rows={capitalRows} />
        <FinancialTable title="Key Performance Indicators" rows={kpiRows} />
      </div>
    </div>
  );
};

export default SubsidizedFinanceSheet;