import React from 'react';
import FinancialTable from '../common/FinancialTable';
import { formatNumber } from '../../utils/formatters';

const WealthManagementSheet = ({ assumptions, results }) => {
  // Helper function to create formula explanations
  const createFormula = (year, formula, details) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d)
  });

  // Filter only Wealth Management products
  const wealthProductResults = Object.fromEntries(
    Object.entries(results.productResults).filter(([key]) => key.startsWith('wealth'))
  );

  // Use Wealth Management division-specific results
  const wealthResults = {
    ...results,
    bs: {
      ...results.bs,
      performingAssets: results.divisions.wealth?.bs.performingAssets || [0, 0, 0, 0, 0],
      nonPerformingAssets: results.divisions.wealth?.bs.nonPerformingAssets || [0, 0, 0, 0, 0],
      equity: results.divisions.wealth?.bs.allocatedEquity || [0, 0, 0, 0, 0],
    },
    pnl: {
      ...results.pnl,
      interestIncome: results.divisions.wealth?.pnl.interestIncome || [0, 0, 0, 0, 0],
      commissionIncome: results.divisions.wealth?.pnl.commissionIncome || [0, 0, 0, 0, 0],
      totalLLP: results.divisions.wealth?.pnl.totalLLP || [0, 0, 0, 0, 0],
    },
    capital: {
      ...results.capital,
      rwaCreditRisk: results.divisions.wealth?.capital.rwaCreditRisk || [0, 0, 0, 0, 0],
      totalRWA: results.divisions.wealth?.capital.totalRWA || [0, 0, 0, 0, 0],
    },
    kpi: {
      ...results.kpi,
      fte: results.kpi.wealthFte || [0, 0, 0, 0, 0],
      cet1Ratio: results.divisions.wealth?.capital.cet1Ratio || [0, 0, 0, 0, 0],
    }
  };

  const pnlRows = [
    { 
      label: 'Management Fees', 
      data: wealthResults.pnl.commissionIncome, 
      decimals: 2, 
      isTotal: true,
      formula: wealthResults.pnl.commissionIncome.map((val, i) => createFormula(i,
        'Management Fees = ∑(AUM × Management Fee Rate)',
        [
          'Assets Under Management × Fee Rate',
          ...Object.entries(wealthProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.performingAssets[year])} × ${formatNumber(product.assumptions?.commissionRate * 100 || 0, 2)}% = ${formatNumber(product.commissionIncome[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Interest Income', 
      data: wealthResults.pnl.interestIncome, 
      decimals: 2, 
      isTotal: true,
      formula: wealthResults.pnl.interestIncome.map((val, i) => createFormula(i, 
        'Interest Income = ∑(Credit Facilities × Interest Rate)',
        [
          'Credit facilities for wealthy clients',
          ...Object.entries(wealthProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.performingAssets[year])} × ${formatNumber(product.assumptions?.interestRate * 100 || 0, 2)}% = ${formatNumber(product.interestIncome[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Total Income', 
      data: wealthResults.pnl.interestIncome.map((interest, i) => 
        interest + wealthResults.pnl.commissionIncome[i]
      ), 
      decimals: 2, 
      isTotal: true,
      formula: wealthResults.pnl.interestIncome.map((val, i) => createFormula(i,
        'Total Income = Management Fees + Interest Income',
        [
          year => `Management Fees: ${formatNumber(wealthResults.pnl.commissionIncome[year])}`,
          year => `Interest Income: ${formatNumber(wealthResults.pnl.interestIncome[year])}`,
          year => `Total: ${formatNumber(wealthResults.pnl.interestIncome[year] + wealthResults.pnl.commissionIncome[year])}`
        ]
      ))
    },
    { 
      label: 'Personnel Costs', 
      data: results.pnl.wealthPersonnelCosts || [0, 0, 0, 0, 0], 
      decimals: 2, 
      isNegative: true,
      formula: (results.pnl.wealthPersonnelCosts || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Personnel Costs = FTE × Average Personnel Cost',
        [
          year => `FTE: ${formatNumber(wealthResults.kpi.fte[year], 0)}`,
          year => `Average Cost: ${formatNumber((assumptions.personnel?.wealthAveragePersonnelCost || 120) * 1000)}`,
          year => `Total: ${formatNumber((results.pnl.wealthPersonnelCosts || [0, 0, 0, 0, 0])[year])}`
        ]
      ))
    },
    { 
      label: 'Other Operating Costs', 
      data: results.pnl.wealthOtherOperatingCosts || [0, 0, 0, 0, 0], 
      decimals: 2, 
      isNegative: true,
      formula: (results.pnl.wealthOtherOperatingCosts || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Other Operating Costs = Personnel Costs × Operating Cost Ratio',
        [
          year => `Personnel Costs: ${formatNumber((results.pnl.wealthPersonnelCosts || [0, 0, 0, 0, 0])[year])}`,
          year => `Operating Cost Ratio: ${formatNumber((assumptions.costs?.wealthOperatingCostRatio || 0.3) * 100, 1)}%`,
          year => `Total: ${formatNumber((results.pnl.wealthOtherOperatingCosts || [0, 0, 0, 0, 0])[year])}`
        ]
      ))
    },
    { 
      label: 'Gross Profit', 
      data: wealthResults.pnl.interestIncome.map((interest, i) => {
        const totalIncome = interest + wealthResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.wealthPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const otherCosts = (results.pnl.wealthOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        return totalIncome + personnelCosts + otherCosts; // personnelCosts and otherCosts are negative
      }), 
      decimals: 2, 
      isTotal: true,
      formula: wealthResults.pnl.interestIncome.map((val, i) => createFormula(i,
        'Gross Profit = Total Income - Operating Costs',
        [
          year => `Total Income: ${formatNumber(wealthResults.pnl.interestIncome[year] + wealthResults.pnl.commissionIncome[year])}`,
          year => `Personnel Costs: ${formatNumber((results.pnl.wealthPersonnelCosts || [0, 0, 0, 0, 0])[year])}`,
          year => `Other Operating Costs: ${formatNumber((results.pnl.wealthOtherOperatingCosts || [0, 0, 0, 0, 0])[year])}`,
          year => {
            const totalIncome = wealthResults.pnl.interestIncome[year] + wealthResults.pnl.commissionIncome[year];
            const personnelCosts = (results.pnl.wealthPersonnelCosts || [0, 0, 0, 0, 0])[year];
            const otherCosts = (results.pnl.wealthOtherOperatingCosts || [0, 0, 0, 0, 0])[year];
            return `Gross Profit: ${formatNumber(totalIncome + personnelCosts + otherCosts)}`;
          }
        ]
      ))
    },
    { 
      label: 'Loan Loss Provisions', 
      data: wealthResults.pnl.totalLLP, 
      decimals: 2, 
      isNegative: true,
      formula: wealthResults.pnl.totalLLP.map((val, i) => createFormula(i,
        'LLP = Minimal provisions for wealth management',
        [
          'Very low provisions due to high collateralization',
          ...Object.entries(wealthProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.newBusiness?.[year] || 0)} × ${formatNumber((product.assumptions?.pd || 0) * 100, 2)}% × ${formatNumber((product.assumptions?.lgd || 0) * 100, 0)}% = ${formatNumber(product.llp?.[year] || 0)}`
          )
        ]
      ))
    },
    { 
      label: 'Net Profit Before Tax', 
      data: wealthResults.pnl.interestIncome.map((interest, i) => {
        const totalIncome = interest + wealthResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.wealthPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const otherCosts = (results.pnl.wealthOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        const grossProfit = totalIncome + personnelCosts + otherCosts;
        return grossProfit + wealthResults.pnl.totalLLP[i]; // totalLLP is negative
      }), 
      decimals: 2, 
      isTotal: true
    }
  ];

  const bsRows = [
    { 
      label: 'Assets Under Management', 
      data: wealthResults.bs.performingAssets, 
      decimals: 2, 
      isTotal: true,
      formula: wealthResults.bs.performingAssets.map((val, i) => createFormula(i,
        'AUM = ∑(Client Portfolio Values)',
        [
          'Total assets under management',
          ...Object.entries(wealthProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.performingAssets[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Credit Facilities', 
      data: wealthResults.bs.nonPerformingAssets, 
      decimals: 2, 
      isTotal: true
    },
    { 
      label: 'Total Assets', 
      data: wealthResults.bs.performingAssets.map((perf, i) => 
        perf + wealthResults.bs.nonPerformingAssets[i]
      ), 
      decimals: 2, 
      isTotal: true
    },
    { 
      label: 'Allocated Equity', 
      data: wealthResults.bs.equity, 
      decimals: 2, 
      isTotal: true
    }
  ];

  const divisionOverview = [
    { label: 'Division Focus', value: 'Centro di profitto per la clientela di fascia alta' },
    { label: 'Target Market', value: 'High-net-worth individuals and affluent clients' },
    { label: 'Key Products', value: Object.keys(wealthProductResults).length + ' wealth management products' },
    { label: 'Strategic Role', value: 'Opportunità di co-investimento nelle operazioni delle divisioni di credito' }
  ];

  return (
    <div className="p-4">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">💎 Wealth Management Division</h1>
        
        {/* Division Overview */}
        <div className="mb-8 bg-purple-50 rounded-lg p-4">
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

        {/* Product Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Product Portfolio</h2>
          {Object.keys(wealthProductResults).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(wealthProductResults).map(([key, product]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Management Fee:</span>
                      <span className="font-medium">{((product.assumptions?.commissionRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium">{((product.assumptions?.interestRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">⚠️ No wealth management products configured yet. Add products starting with "wealth" in defaultAssumptions.js</p>
            </div>
          )}
        </div>

        {/* Financial Tables */}
        <FinancialTable title="Profit & Loss Statement" rows={pnlRows} />
        <FinancialTable title="Balance Sheet" rows={bsRows} />
      </div>
    </div>
  );
};

export default WealthManagementSheet;