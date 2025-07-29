import React from 'react';
import FinancialTable from '../common/FinancialTable';
import { formatNumber } from '../../utils/formatters';

const TechPlatformSheet = ({ assumptions, results }) => {
  // Helper function to create formula explanations
  const createFormula = (year, formula, details) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d)
  });

  // Filter only Tech Platform products
  const techProductResults = Object.fromEntries(
    Object.entries(results.productResults).filter(([key]) => key.startsWith('tech'))
  );

  // Use Tech Platform division-specific results
  const techResults = {
    ...results,
    bs: {
      ...results.bs,
      performingAssets: results.divisions.tech?.bs.performingAssets || [0, 0, 0, 0, 0],
      nonPerformingAssets: results.divisions.tech?.bs.nonPerformingAssets || [0, 0, 0, 0, 0],
      equity: results.divisions.tech?.bs.allocatedEquity || [0, 0, 0, 0, 0],
    },
    pnl: {
      ...results.pnl,
      interestIncome: results.divisions.tech?.pnl.interestIncome || [0, 0, 0, 0, 0],
      commissionIncome: results.divisions.tech?.pnl.commissionIncome || [0, 0, 0, 0, 0],
      totalLLP: results.divisions.tech?.pnl.totalLLP || [0, 0, 0, 0, 0],
    },
    capital: {
      ...results.capital,
      rwaCreditRisk: results.divisions.tech?.capital.rwaCreditRisk || [0, 0, 0, 0, 0],
      totalRWA: results.divisions.tech?.capital.totalRWA || [0, 0, 0, 0, 0],
    },
    kpi: {
      ...results.kpi,
      fte: results.kpi.techFte || [0, 0, 0, 0, 0],
      cet1Ratio: results.divisions.tech?.capital.cet1Ratio || [0, 0, 0, 0, 0],
    }
  };

  const pnlRows = [
    { 
      label: 'SaaS Subscription Revenue', 
      data: techResults.pnl.commissionIncome, 
      decimals: 2, 
      isTotal: true,
      formula: techResults.pnl.commissionIncome.map((val, i) => createFormula(i,
        'SaaS Revenue = ∑(Clients × Monthly Recurring Revenue × 12)',
        [
          'Core Banking as-a-Service revenue streams',
          ...Object.entries(techProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.newBusiness?.[year] || 0)} clients × ${formatNumber((product.assumptions?.commissionRate || 0) * 100, 2)}% = ${formatNumber(product.commissionIncome[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Implementation Fees', 
      data: techResults.pnl.interestIncome, 
      decimals: 2, 
      isTotal: true,
      formula: techResults.pnl.interestIncome.map((val, i) => createFormula(i, 
        'Implementation Fees = One-time setup and integration fees',
        [
          'Setup fees for new banking clients',
          ...Object.entries(techProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.performingAssets[year])} × ${formatNumber((product.assumptions?.interestRate || 0) * 100, 2)}% = ${formatNumber(product.interestIncome[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Total Revenue', 
      data: techResults.pnl.interestIncome.map((impl, i) => 
        impl + techResults.pnl.commissionIncome[i]
      ), 
      decimals: 2, 
      isTotal: true,
      formula: techResults.pnl.interestIncome.map((val, i) => createFormula(i,
        'Total Revenue = SaaS Revenue + Implementation Fees',
        [
          year => `SaaS Revenue: ${formatNumber(techResults.pnl.commissionIncome[year])}`,
          year => `Implementation Fees: ${formatNumber(techResults.pnl.interestIncome[year])}`,
          year => `Total: ${formatNumber(techResults.pnl.interestIncome[year] + techResults.pnl.commissionIncome[year])}`
        ]
      ))
    },
    { 
      label: 'Personnel Costs', 
      data: results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0], 
      decimals: 2, 
      isNegative: true,
      formula: (results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Personnel Costs = FTE × Average Personnel Cost',
        [
          year => `FTE: ${formatNumber(techResults.kpi.fte[year], 0)}`,
          year => `Average Cost: ${formatNumber((assumptions.personnel?.techAveragePersonnelCost || 130) * 1000)} (Higher for tech talent)`,
          year => `Total: ${formatNumber((results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0])[year])}`
        ]
      ))
    },
    { 
      label: 'Technology & Infrastructure', 
      data: results.pnl.techOtherOperatingCosts || [0, 0, 0, 0, 0], 
      decimals: 2, 
      isNegative: true,
      formula: (results.pnl.techOtherOperatingCosts || [0, 0, 0, 0, 0]).map((val, i) => createFormula(i,
        'Tech Costs = Personnel Costs × Operating Cost Ratio',
        [
          year => `Personnel Costs: ${formatNumber((results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0])[year])}`,
          year => `Operating Cost Ratio: ${formatNumber((assumptions.costs?.techOperatingCostRatio || 0.4) * 100, 1)}% (Higher for R&D)`,
          year => `Total: ${formatNumber((results.pnl.techOtherOperatingCosts || [0, 0, 0, 0, 0])[year])}`
        ]
      ))
    },
    { 
      label: 'EBITDA', 
      data: techResults.pnl.interestIncome.map((impl, i) => {
        const totalRevenue = impl + techResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const techCosts = (results.pnl.techOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        return totalRevenue + personnelCosts + techCosts; // costs are negative
      }), 
      decimals: 2, 
      isTotal: true,
      formula: techResults.pnl.interestIncome.map((val, i) => createFormula(i,
        'EBITDA = Total Revenue - Operating Costs',
        [
          year => `Total Revenue: ${formatNumber(techResults.pnl.interestIncome[year] + techResults.pnl.commissionIncome[year])}`,
          year => `Personnel Costs: ${formatNumber((results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0])[year])}`,
          year => `Technology Costs: ${formatNumber((results.pnl.techOtherOperatingCosts || [0, 0, 0, 0, 0])[year])}`,
          year => {
            const totalRevenue = techResults.pnl.interestIncome[year] + techResults.pnl.commissionIncome[year];
            const personnelCosts = (results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0])[year];
            const techCosts = (results.pnl.techOtherOperatingCosts || [0, 0, 0, 0, 0])[year];
            return `EBITDA: ${formatNumber(totalRevenue + personnelCosts + techCosts)}`;
          }
        ]
      ))
    },
    { 
      label: 'Depreciation & Amortization', 
      data: techResults.pnl.totalLLP, 
      decimals: 2, 
      isNegative: true,
      formula: techResults.pnl.totalLLP.map((val, i) => createFormula(i,
        'D&A = Technology assets depreciation',
        [
          'Depreciation of technology infrastructure and software development',
          year => `D&A: ${formatNumber(techResults.pnl.totalLLP[year])}`
        ]
      ))
    },
    { 
      label: 'Net Profit Before Tax', 
      data: techResults.pnl.interestIncome.map((impl, i) => {
        const totalRevenue = impl + techResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const techCosts = (results.pnl.techOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        const ebitda = totalRevenue + personnelCosts + techCosts;
        return ebitda + techResults.pnl.totalLLP[i]; // totalLLP is negative (D&A)
      }), 
      decimals: 2, 
      isTotal: true
    }
  ];

  const bsRows = [
    { 
      label: 'Technology Assets', 
      data: techResults.bs.performingAssets, 
      decimals: 2, 
      isTotal: true,
      formula: techResults.bs.performingAssets.map((val, i) => createFormula(i,
        'Technology Assets = Software + Infrastructure + IP',
        [
          'Core banking platform, infrastructure and intellectual property',
          ...Object.entries(techProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.performingAssets[year])}`
          )
        ]
      ))
    },
    { 
      label: 'Working Capital', 
      data: techResults.bs.nonPerformingAssets, 
      decimals: 2, 
      isTotal: true,
      formula: techResults.bs.nonPerformingAssets.map((val, i) => createFormula(i,
        'Working Capital = Accounts Receivable + Inventory',
        [
          year => `Working Capital: ${formatNumber(techResults.bs.nonPerformingAssets[year])}`
        ]
      ))
    },
    { 
      label: 'Total Assets', 
      data: techResults.bs.performingAssets.map((tech, i) => 
        tech + techResults.bs.nonPerformingAssets[i]
      ), 
      decimals: 2, 
      isTotal: true
    },
    { 
      label: 'Allocated Equity', 
      data: techResults.bs.equity, 
      decimals: 2, 
      isTotal: true,
      formula: techResults.bs.equity.map((val, i) => createFormula(i,
        'Allocated Equity = Based on business risk profile',
        [
          year => `Allocated Equity: ${formatNumber(techResults.bs.equity[year])}`,
          'Lower capital requirements as tech business vs traditional banking'
        ]
      ))
    }
  ];

  const kpiRows = [
    { 
      label: 'Revenue Growth (%)', 
      data: techResults.pnl.commissionIncome.map((revenue, i) => {
        if (i === 0 || techResults.pnl.commissionIncome[i-1] === 0) return 0;
        return ((revenue - techResults.pnl.commissionIncome[i-1]) / Math.abs(techResults.pnl.commissionIncome[i-1])) * 100;
      }), 
      decimals: 1, 
      isPercentage: true
    },
    { 
      label: 'EBITDA Margin (%)', 
      data: techResults.pnl.interestIncome.map((impl, i) => {
        const totalRevenue = impl + techResults.pnl.commissionIncome[i];
        const personnelCosts = (results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0])[i];
        const techCosts = (results.pnl.techOtherOperatingCosts || [0, 0, 0, 0, 0])[i];
        const ebitda = totalRevenue + personnelCosts + techCosts;
        return totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
      }), 
      decimals: 1, 
      isPercentage: true
    },
    { 
      label: 'FTE', 
      data: techResults.kpi.fte, 
      decimals: 0,
      formula: techResults.kpi.fte.map((val, i) => createFormula(i,
        'FTE = Personnel Costs / Average Personnel Cost',
        [
          year => `Personnel Costs: ${formatNumber((results.pnl.techPersonnelCosts || [0, 0, 0, 0, 0])[year])}`,
          year => `Average Personnel Cost: ${formatNumber((assumptions.personnel?.techAveragePersonnelCost || 130) * 1000)}`,
          year => `FTE: ${formatNumber(techResults.kpi.fte[year], 0)}`
        ]
      ))
    },
    { 
      label: 'Revenue per FTE', 
      data: techResults.pnl.interestIncome.map((impl, i) => {
        const totalRevenue = impl + techResults.pnl.commissionIncome[i];
        const fte = techResults.kpi.fte[i];
        return fte > 0 ? totalRevenue / fte : 0;
      }), 
      decimals: 0,
      formula: techResults.pnl.interestIncome.map((val, i) => createFormula(i,
        'Revenue per FTE = Total Revenue / FTE',
        [
          year => {
            const totalRevenue = techResults.pnl.interestIncome[year] + techResults.pnl.commissionIncome[year];
            const fte = techResults.kpi.fte[year];
            return `${formatNumber(totalRevenue)} / ${formatNumber(fte, 0)} = ${formatNumber(fte > 0 ? totalRevenue / fte : 0)}`;
          }
        ]
      ))
    }
  ];

  const divisionOverview = [
    { label: 'Business Model', value: 'Tech-Company che offre soluzioni di core banking as-a-service' },
    { label: 'Target Market', value: 'Piccole e medie banche che necessitano di infrastruttura tecnologica' },
    { label: 'Key Products', value: Object.keys(techProductResults).length + ' tech platform services' },
    { label: 'Revenue Model', value: 'SaaS subscriptions + implementation fees' },
    { label: 'Strategic Role', value: 'Nuovo flusso di ricavi attraverso monetizzazione della tecnologia bancaria' }
  ];

  return (
    <div className="p-4">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">🚀 Piattaforma Tecnologica</h1>
        
        {/* Division Overview */}
        <div className="mb-8 bg-indigo-50 rounded-lg p-4">
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

        {/* Business Model Highlight */}
        <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">🏗️ Core Banking as-a-Service</h3>
          <p className="text-indigo-100">
            Monetizzazione della nostra infrastruttura tecnologica bancaria attraverso servizi SaaS 
            per piccole e medie banche che necessitano di soluzioni moderne e scalabili.
          </p>
        </div>

        {/* Product Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Service Portfolio</h2>
          {Object.keys(techProductResults).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(techProductResults).map(([key, product]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Recurring Revenue:</span>
                      <span className="font-medium">{((product.assumptions?.commissionRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Setup Fee:</span>
                      <span className="font-medium">{((product.assumptions?.interestRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">⚠️ No tech platform services configured yet. Add products starting with "tech" in defaultAssumptions.js</p>
            </div>
          )}
        </div>

        {/* Financial Tables */}
        <FinancialTable title="Profit & Loss Statement" rows={pnlRows} />
        <FinancialTable title="Balance Sheet" rows={bsRows} />
        <FinancialTable title="Key Performance Indicators" rows={kpiRows} />
      </div>
    </div>
  );
};

export default TechPlatformSheet;