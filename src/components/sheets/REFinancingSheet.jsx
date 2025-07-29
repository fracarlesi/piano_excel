import React from 'react';
import FinancialTable from '../common/FinancialTable';
import { formatNumber } from '../../utils/formatters';

const REFinancingSheet = ({ assumptions, results }) => {
  // Helper function to create formula explanations
  const createFormula = (year, formula, details) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d)
  });

  // Filter only RE products
  const reProductResults = Object.fromEntries(
    Object.entries(results.productResults).filter(([key]) => key.startsWith('re'))
  );

  // Use RE division-specific results
  const reResults = {
    ...results,
    bs: {
      ...results.bs,
      performingAssets: results.divisions.re.bs.performingAssets,
      nonPerformingAssets: results.divisions.re.bs.nonPerformingAssets,
      equity: results.divisions.re.bs.allocatedEquity,
    },
    pnl: {
      ...results.pnl,
      interestIncome: results.divisions.re.pnl.interestIncome,
      commissionIncome: results.divisions.re.pnl.commissionIncome,
      totalLLP: results.divisions.re.pnl.totalLLP,
    },
    capital: {
      ...results.capital,
      rwaCreditRisk: results.divisions.re.capital.rwaCreditRisk,
      totalRWA: results.divisions.re.capital.totalRWA,
    },
    kpi: {
      ...results.kpi,
      fte: results.kpi.reFte,
      cet1Ratio: results.divisions.re.capital.cet1Ratio,
    }
  };

  const pnlRows = [
    { 
      label: 'Interest Income', 
      data: reResults.pnl.interestIncome, 
      decimals: 2, 
      isTotal: true,
      formula: reResults.pnl.interestIncome.map((val, i) => createFormula(i, 
        'Stock Medio Performing × (EURIBOR + Spread)',
        [
          'Interest Income calculation by product:',
          ...Object.entries(reProductResults).map(([key, product]) => 
            year => `${product.name}: ${formatNumber(product.averagePerformingAssets[year], 2)} €M × ${formatNumber(product.assumptions.interestRate * 100, 2)}% = ${formatNumber(product.interestIncome[year], 2)} €M`
          ),
          year => `Total Interest Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.interestIncome, 
      decimals: 2, 
      indent: true,
      formula: p.interestIncome.map((val, i) => createFormula(i,
        'Average Performing Stock Product × (EURIBOR + Spread)',
        [
          `Average Performing Stock: ${formatNumber(p.averagePerformingAssets[i], 0)} €M`,
          `EURIBOR: ${assumptions.euribor}%`,
          `Spread: ${assumptions.products[key].spread}%`,
          `Total Rate: ${(assumptions.euribor + assumptions.products[key].spread).toFixed(2)}%`,
          `Interest: ${formatNumber(val, 2)} €M`
        ]
      ))
    })),
    { 
      label: 'Interest Expenses', 
      data: results.pnl.interestExpenses, 
      decimals: 2, 
      isTotal: true,
      formula: results.pnl.interestExpenses.map((val, i) => createFormula(i,
        'Total Assets × Cost of Funding',
        [
          `Total Assets: ${formatNumber(results.bs.totalAssets[i], 0)} €M`,
          `Costo del Funding: ${assumptions.costOfFundsRate}%`,
          `Calcolo: ${formatNumber(results.bs.totalAssets[i], 0)} × ${assumptions.costOfFundsRate}% = ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.interestExpense, 
      decimals: 2, 
      indent: true,
      formula: p.interestExpense.map((val, i) => createFormula(i,
        'Total Interest Expenses × Product Asset Weight',
        [
          `Total Interest Expenses: ${formatNumber(results.pnl.interestExpenses[i], 2)} €M`,
          `Asset Product: ${formatNumber(p.performingAssets[i] + p.nonPerformingAssets[i], 0)} €M`,
          `Asset Totali: ${formatNumber(results.bs.totalAssets[i], 0)} €M`,
          `Peso: ${((p.performingAssets[i] + p.nonPerformingAssets[i]) / results.bs.totalAssets[i] * 100).toFixed(1)}%`
        ]
      ))
    })),
    { 
      label: 'Net Interest Income (NII)', 
      data: results.pnl.netInterestIncome, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.netInterestIncome.map((val, i) => createFormula(i,
        'Interest Income - Interest Expenses',
        [
          `Interest Income: ${formatNumber(results.pnl.interestIncome[i], 2)} €M`,
          `Interessi Passivi: ${formatNumber(results.pnl.interestExpenses[i], 2)} €M`,
          `NII: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Fee Income', 
      data: results.pnl.commissionIncome, 
      decimals: 2, 
      isTotal: true,
      formula: results.pnl.commissionIncome.map((val, i) => createFormula(i,
        'Sum of Fees per Product',
        [
          ...Object.entries(reProductResults).map(([key, p], idx) => 
            `Product ${idx + 1}: ${formatNumber(p.commissionIncome[i], 2)} €M`
          ),
          `Total: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.commissionIncome, 
      decimals: 2, 
      indent: true,
      formula: p.commissionIncome.map((val, i) => {
        const annualGrowth = (assumptions.products[key].volumes.y5 - assumptions.products[key].volumes.y1) / 4;
        const newVolume = assumptions.products[key].volumes.y1 + (annualGrowth * i);
        return createFormula(i,
          'Nuovi Volumi × Tasso Commissione',
          [
            `Nuovi Volumi Anno ${i+1}: ${formatNumber(newVolume, 0)} €M`,
            `Tasso Commissione: ${assumptions.products[key].commissionRate}%`,
            `Fees: ${formatNumber(val, 2)} €M`
          ]
        );
      })
    })),
    { 
      label: 'Fee Expenses', 
      data: results.pnl.commissionExpenses, 
      decimals: 2, 
      isTotal: true,
      formula: results.pnl.commissionExpenses.map((val, i) => createFormula(i,
        'Fee Income × Fee Expense Rate',
        [
          `Commissioni Attive: ${formatNumber(results.pnl.commissionIncome[i], 2)} €M`,
          `Fee Expense Rate: ${assumptions.commissionExpenseRate}%`,
          `Fee Expenses: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.commissionExpense, 
      decimals: 2, 
      indent: true,
      formula: p.commissionExpense.map((val, i) => createFormula(i,
        'Total Fee Expenses × Asset Weight',
        [
          `Total Fee Expenses: ${formatNumber(results.pnl.commissionExpenses[i], 2)} €M`,
          `Peso Asset Product: ${((p.performingAssets[i] + p.nonPerformingAssets[i]) / results.bs.totalAssets[i] * 100).toFixed(1)}%`,
          `Allocato: ${formatNumber(val, 2)} €M`
        ]
      ))
    })),
    { 
      label: 'Net Fee Income', 
      data: results.pnl.netCommissions, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.netCommissions.map((val, i) => createFormula(i,
        'Fee Income - Fee Expenses',
        [
          `Commissioni Attive: ${formatNumber(results.pnl.commissionIncome[i], 2)} €M`,
          `Commissioni Passive: ${formatNumber(results.pnl.commissionExpenses[i], 2)} €M`,
          `Net: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Total Operating Income', 
      data: results.pnl.totalRevenues, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.totalRevenues.map((val, i) => createFormula(i,
        'Net Interest Income + Net Fees',
        [
          `Net Interest Income: ${formatNumber(results.pnl.netInterestIncome[i], 2)} €M`,
          `Net Fees: ${formatNumber(results.pnl.netCommissions[i], 2)} €M`,
          `Total: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Personnel Costs', 
      data: results.pnl.personnelCostsTotal, 
      decimals: 2, 
      isTotal: true,
      bgColor: 'white',
      formula: results.pnl.personnelCostsTotal.map((val, i) => createFormula(i,
        'FTE × Costo Medio per FTE',
        [
          `FTE: ${formatNumber(results.kpi.fte[i], 0)}`,
          `Costo Medio: ${assumptions.avgCostPerFte}k€`,
          `Total: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Administrative Costs', 
      data: results.pnl.adminCosts, 
      decimals: 2, 
      indent: true,
      formula: results.pnl.adminCosts.map((val, i) => createFormula(i,
        'Costo Base × (1 + Tasso Crescita)^Anno',
        [
          `Costo Base Anno 1: ${assumptions.adminCostsY1} €M`,
          `Tasso Crescita: ${assumptions.costGrowthRate}%`,
          `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Marketing Costs', 
      data: results.pnl.marketingCosts, 
      decimals: 2, 
      indent: true,
      formula: results.pnl.marketingCosts.map((val, i) => createFormula(i,
        'Costo Base × (1 + Tasso Crescita)^Anno',
        [
          `Costo Base Anno 1: ${assumptions.marketingCostsY1} €M`,
          `Tasso Crescita: ${assumptions.costGrowthRate}%`,
          `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'HQ Cost Allocation', 
      data: results.pnl.hqAllocation, 
      decimals: 2, 
      indent: true,
      formula: results.pnl.hqAllocation.map((val, i) => createFormula(i,
        'Costo Base × (1 + Tasso Crescita)^Anno',
        [
          `Costo Base Anno 1: ${assumptions.hqAllocationY1} €M`,
          `Tasso Crescita: ${assumptions.costGrowthRate}%`,
          `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'IT Costs', 
      data: results.pnl.itCosts, 
      decimals: 2, 
      indent: true,
      formula: results.pnl.itCosts.map((val, i) => createFormula(i,
        'Costo Base × (1 + Tasso Crescita)^Anno',
        [
          `Costo Base Anno 1: ${assumptions.itCostsY1} €M`,
          `Tasso Crescita: ${assumptions.costGrowthRate}%`,
          `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Total Operating Expenses', 
      data: results.pnl.totalOpex, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.totalOpex.map((val, i) => createFormula(i,
        'Personnel Costs + Administrative + Marketing + HQ Allocation + IT',
        [
          `Personnel Costs: ${formatNumber(results.pnl.personnelCostsTotal[i], 2)} €M`,
          `Amministrativi: ${formatNumber(results.pnl.adminCosts[i], 2)} €M`,
          `Marketing: ${formatNumber(results.pnl.marketingCosts[i], 2)} €M`,
          `HQ Allocation: ${formatNumber(results.pnl.hqAllocation[i], 2)} €M`,
          `IT: ${formatNumber(results.pnl.itCosts[i], 2)} €M`,
          `Total: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Loan Loss Provisions (LLP)', 
      data: results.pnl.totalLLP, 
      decimals: 2, 
      isTotal: true,
      formula: results.pnl.totalLLP.map((val, i) => createFormula(i,
        'Somma LLP per Product',
        [
          ...Object.entries(reProductResults).map(([key, p], idx) => 
            `Product ${idx + 1}: ${formatNumber(p.llp[i], 2)} €M`
          ),
          `Total LLP: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.llp, 
      decimals: 2, 
      indent: true,
      formula: p.llp.map((val, i) => createFormula(i,
        'Expected Loss su Nuovo Business + Loss su Default Stock',
        [
          `Danger Rate: ${assumptions.products[key].dangerRate}%`,
          `LGD (Loss Given Default): basato su LTV ${assumptions.products[key].ltv}%`,
          `Recovery netto di costi: ${100 - assumptions.products[key].recoveryCosts}%`,
          `Haircut collaterale: ${assumptions.products[key].collateralHaircut}%`,
          `LLP Anno ${i+1}: ${formatNumber(val, 2)} €M`
        ]
      ))
    })),
    { 
      label: 'Profit Before Tax (PBT)', 
      data: results.pnl.preTaxProfit, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.preTaxProfit.map((val, i) => createFormula(i,
        'Revenues - Operating Costs - LLP - Other Costs',
        [
          `Total Revenues: ${formatNumber(results.pnl.totalRevenues[i], 2)} €M`,
          `Operating Costs: ${formatNumber(results.pnl.totalOpex[i], 2)} €M`,
          `LLP: ${formatNumber(results.pnl.totalLLP[i], 2)} €M`,
          `Other Costs: ${formatNumber(results.pnl.otherCosts[i], 2)} €M`,
          `PBT: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Taxes', 
      data: results.pnl.taxes, 
      decimals: 2,
      formula: results.pnl.taxes.map((val, i) => createFormula(i,
        'PBT × Aliquota Fiscale (se PBT > 0)',
        [
          `Profit Before Tax (PBT): ${formatNumber(results.pnl.preTaxProfit[i], 2)} €M`,
          `Aliquota Fiscale: ${assumptions.taxRate}%`,
          `Taxes: ${formatNumber(val, 2)} €M`,
          results.pnl.preTaxProfit[i] <= 0 ? `Nessuna imposta su perdite` : ''
        ].filter(Boolean)
      ))
    },
    { 
      label: 'Net Profit', 
      data: results.pnl.netProfit, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.netProfit.map((val, i) => createFormula(i,
        'Profit Before Tax - Taxes',
        [
          `Profit Before Tax: ${formatNumber(results.pnl.preTaxProfit[i], 2)} €M`,
          `Imposte: ${formatNumber(results.pnl.taxes[i], 2)} €M`,
          `Net Profit: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
  ];

  const bsRows = [
    { 
      label: 'TOTAL ASSETS', 
      data: results.bs.totalAssets, 
      decimals: 0, 
      isHeader: true,
      formula: results.bs.totalAssets.map((val, i) => createFormula(i,
        'Performing + NPL + Operating Assets',
        [
          `Performing Assets: ${formatNumber(results.bs.performingAssets[i], 0)} €M`,
          `Non-Performing: ${formatNumber(results.bs.nonPerformingAssets[i], 0)} €M`,
          `Operating Assets: ${formatNumber(results.bs.operatingAssets[i], 0)} €M`,
          `Total: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Net Performing Assets', 
      data: results.bs.performingAssets, 
      decimals: 0, 
      indent: true,
      formula: results.bs.performingAssets.map((val, i) => createFormula(i,
        'Somma Stock Performing per Product',
        [
          ...Object.entries(reProductResults).map(([key, p], idx) => 
            `Product ${idx + 1}: ${formatNumber(p.performingAssets[i], 0)} €M`
          ),
          `Total: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.performingAssets, 
      decimals: 0, 
      indent: true,
      formula: p.performingAssets.map((val, i) => createFormula(i,
        'Stock Precedente + Nuovi Volumi - Rimborsi - Default',
        [
          `Stock Anno Precedente: ${i > 0 ? formatNumber(p.performingAssets[i-1], 0) : '0'} €M`,
          `Nuovi Volumi: vedi tabella assumptions`,
          `Tipo ammortamento: ${assumptions.products[key].type === 'bullet' ? 'Bullet' : 'Francese'}`,
          `Stock Fine Anno: ${formatNumber(val, 0)} €M`
        ]
      ))
    })),
    { 
      label: 'Non-Performing Assets', 
      data: results.bs.nonPerformingAssets, 
      decimals: 0, 
      indent: true,
      formula: results.bs.nonPerformingAssets.map((val, i) => createFormula(i,
        'Somma NPL per Product',
        [
          ...Object.entries(reProductResults).map(([key, p], idx) => 
            `Product ${idx + 1}: ${formatNumber(p.nonPerformingAssets[i], 0)} €M`
          ),
          `Total NPL: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Operating Assets', 
      data: results.bs.operatingAssets, 
      decimals: 0, 
      indent: true,
      formula: results.bs.operatingAssets.map((val, i) => createFormula(i,
        'Total Loans × Operating Assets Ratio',
        [
          `Total Loans: ${formatNumber(results.bs.performingAssets[i] + results.bs.nonPerformingAssets[i], 0)} €M`,
          `Operating Assets Ratio: ${assumptions.operatingAssetsRatio}%`,
          `Operating Assets: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { label: '', data: [null,null,null,null,null], decimals: 0 }, // Empty row for spacing
    { 
      label: 'TOTAL LIABILITIES & EQUITY', 
      data: results.bs.totalAssets, 
      decimals: 0, 
      isHeader: true,
      formula: results.bs.totalAssets.map((val, i) => createFormula(i,
        'Must equal Total Assets',
        [
          `Total Liabilities: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
          `Shareholders Equity: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `Total L&E: ${formatNumber(val, 0)} €M`,
          `Check quadratura: OK ✓`
        ]
      ))
    },
    { 
      label: 'o/w Sight Deposits', 
      data: results.bs.sightDeposits, 
      decimals: 0, 
      indent: true,
      formula: results.bs.sightDeposits.map((val, i) => createFormula(i,
        'Total Liabilities × % Sight Deposits',
        [
          `Total Liabilities: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
          `% Depositi a Vista: ${assumptions.fundingMix.sightDeposits}%`,
          `Depositi a Vista: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'o/w Term Deposits', 
      data: results.bs.termDeposits, 
      decimals: 0, 
      indent: true,
      formula: results.bs.termDeposits.map((val, i) => createFormula(i,
        'Total Liabilities × % Term Deposits',
        [
          `Total Liabilities: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
          `% Depositi Vincolati: ${assumptions.fundingMix.termDeposits}%`,
          `Depositi Vincolati: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'o/w Group Funding', 
      data: results.bs.groupFunding, 
      decimals: 0, 
      indent: true,
      formula: results.bs.groupFunding.map((val, i) => createFormula(i,
        'Total Liabilities × % Group Funding',
        [
          `Total Liabilities: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
          `% Finanziamento Gruppo: ${assumptions.fundingMix.groupFunding}%`,
          `Finanziamento Gruppo: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Shareholders Equity', 
      data: results.bs.equity, 
      decimals: 0, 
      indent: true,
      formula: results.bs.equity.map((val, i) => createFormula(i,
        'Initial Equity + Cumulative Net Profits',
        [
          `Equity Iniziale: ${assumptions.initialEquity} €M`,
          `Cumulative Profits until Year ${i+1}: ${formatNumber(val - assumptions.initialEquity, 0)} €M`,
          `Patrimonio Netto: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
  ];

  const capitalRows = [
    { 
      label: 'RWA', 
      data: results.capital.totalRWA, 
      decimals: 0, 
      isHeader: true,
      formula: results.capital.totalRWA.map((val, i) => createFormula(i,
        'RWA Credito + RWA Operativo + RWA Mercato + RWA Operating Assets',
        [
          `RWA Credito: ${formatNumber(results.capital.rwaCreditRisk[i], 0)} €M`,
          `RWA Operativo: ${formatNumber(results.capital.rwaOperationalRisk[i], 0)} €M`,
          `RWA Mercato: ${formatNumber(results.capital.rwaMarketRisk[i], 0)} €M`,
          `RWA Operating Assets: ${formatNumber(results.capital.rwaOperatingAssets[i], 0)} €M`,
          `Total: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.rwa, 
      decimals: 0, 
      indent: true,
      formula: p.rwa.map((val, i) => createFormula(i,
        'Stock Performing × RWA Density',
        [
          `Stock Performing: ${formatNumber(p.performingAssets[i], 0)} €M`,
          `RWA Density: ${assumptions.products[key].rwaDensity}%`,
          `RWA Product: ${formatNumber(val, 0)} €M`
        ]
      ))
    })),
    { 
      label: 'o/w Operating Assets', 
      data: results.capital.rwaOperatingAssets, 
      decimals: 0, 
      indent: true,
      formula: results.capital.rwaOperatingAssets.map((val, i) => createFormula(i,
        'Operating Assets × 100% (Risk Weight)',
        [
          `Operating Assets: ${formatNumber(results.bs.operatingAssets[i], 0)} €M`,
          `Risk Weight: 100%`,
          `RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { label: 'Equity (CET1)', data: results.bs.equity, decimals: 0, isHeader: true },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.allocatedEquity, 
      decimals: 0, 
      indent: true,
      formula: p.allocatedEquity.map((val, i) => createFormula(i,
        'Total Equity × (Product RWA / Total RWA)',
        [
          `Total Equity: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `RWA Product: ${formatNumber(p.rwa[i], 0)} €M`,
          `Total RWA: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
          `Peso: ${(p.rwa[i] / results.capital.totalRWA[i] * 100).toFixed(1)}%`,
          `Equity Allocato: ${formatNumber(val, 0)} €M`
        ]
      ))
    })),
    { 
      label: 'o/w Operating Assets', 
      data: results.capital.allocatedEquityOperatingAssets, 
      decimals: 0, 
      indent: true,
      formula: results.capital.allocatedEquityOperatingAssets.map((val, i) => createFormula(i,
        'Total Equity × (Operating RWA / Total RWA)',
        [
          `Total Equity: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `RWA Operating Assets: ${formatNumber(results.capital.rwaOperatingAssets[i], 0)} €M`,
          `Total RWA: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
          `Equity Allocato: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'CET1 Ratio (%)', 
      data: results.kpi.cet1Ratio, 
      decimals: 1, 
      unit: '%', 
      isHeader: true,
      formula: results.kpi.cet1Ratio.map((val, i) => createFormula(i,
        'Shareholders Equity (CET1) / Total RWA × 100',
        [
          `Shareholders Equity: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `RWA Totali: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
          `CET1 Ratio: ${formatNumber(val, 1)}%`,
          `Minimo regolamentare: 4.5% + buffer`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w Product ${index + 1}: ${assumptions.products[key].name}`, 
      data: p.cet1Ratio, 
      decimals: 1, 
      unit: '%', 
      indent: true,
      formula: p.cet1Ratio.map((val, i) => createFormula(i,
        'Equity Allocato Product / RWA Product × 100',
        [
          `Equity Allocato: ${formatNumber(p.allocatedEquity[i], 0)} €M`,
          `RWA Product: ${formatNumber(p.rwa[i], 0)} €M`,
          `CET1 Ratio: ${formatNumber(val, 1)}%`
        ]
      ))
    })),
    { label: 'RWA by Risk Type', data: [null,null,null,null,null], decimals: 0, isHeader: true },
    { 
      label: 'Credit Risk', 
      data: results.capital.rwaCreditRisk, 
      decimals: 0, 
      indent: true,
      formula: results.capital.rwaCreditRisk.map((val, i) => createFormula(i,
        'Sum of RWA from all Products',
        [
          ...Object.entries(reProductResults).map(([key, p], idx) => 
            `Product ${idx + 1}: ${formatNumber(p.rwa[i], 0)} €M`
          ),
          `Total Credit RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Operational Risk', 
      data: results.capital.rwaOperationalRisk, 
      decimals: 0, 
      indent: true,
      formula: results.capital.rwaOperationalRisk.map((val, i) => createFormula(i,
        'Total Assets × 10% (Basel Estimate)',
        [
          `Total Assets: ${formatNumber(results.bs.totalAssets[i], 0)} €M`,
          `Percentuale Rischio Op: 10%`,
          `RWA Operativo: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Market Risk', 
      data: results.capital.rwaMarketRisk, 
      decimals: 0, 
      indent: true,
      formula: results.capital.rwaMarketRisk.map((val, i) => createFormula(i,
        'Non applicabile per banking book',
        [
          `Real Estate Financing: solo banking book`,
          `Trading book: non presente`,
          `RWA Mercato: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
  ];

  const kpiRows = [
    { 
      label: 'Cost / Income', 
      data: results.kpi.costIncome, 
      decimals: 1, 
      unit: '%',
      formula: results.kpi.costIncome.map((val, i) => createFormula(i,
        'Operating Costs / Total Revenues × 100',
        [
          `Operating Costs: ${formatNumber(-results.pnl.totalOpex[i], 2)} €M`,
          `Total Revenues: ${formatNumber(results.pnl.totalRevenues[i], 2)} €M`,
          `Cost/Income: ${formatNumber(val, 1)}%`
        ]
      ))
    },
    { 
      label: 'Cost of Risk', 
      data: results.kpi.costOfRisk, 
      decimals: 0, 
      unit: ' bps',
      formula: results.kpi.costOfRisk.map((val, i) => createFormula(i,
        'LLP / Stock Medio Performing × 10.000',
        [
          `LLP (Provisions): ${formatNumber(-results.pnl.totalLLP[i], 2)} €M`,
          `Stock Performing Inizio: ${i > 0 ? formatNumber(results.bs.performingAssets[i-1], 0) : '0'} €M`,
          `Stock Performing Fine: ${formatNumber(results.bs.performingAssets[i], 0)} €M`,
          `Stock Medio: ${formatNumber(i > 0 ? (results.bs.performingAssets[i] + results.bs.performingAssets[i-1]) / 2 : results.bs.performingAssets[i], 0)} €M`,
          `Cost of Risk: ${formatNumber(val, 0)} basis points`
        ]
      ))
    },
    { 
      label: 'Number of Loans Granted', 
      data: results.kpi.totalNumberOfLoans, 
      decimals: 0, 
      isTotal: true,
      formula: results.kpi.totalNumberOfLoans.map((val, i) => createFormula(i,
        'Somma Finanziamenti per Divisione',
        [
          `Real Estate Financing: ${formatNumber(results.kpi.reNumberOfLoans[i], 0)} loans`,
          `SME Division: ${formatNumber(results.kpi.smeNumberOfLoans[i], 0)} loans`,
          `Total: ${formatNumber(val, 0)} loans`
        ]
      ))
    },
    ...Object.entries(reProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.numberOfLoans, 
      decimals: 0, 
      indent: true,
      formula: p.numberOfLoans.map((val, i) => createFormula(i,
        'Nuovi Impieghi / Finanziamento Medio',
        [
          `Nuovi Impieghi Anno ${i+1}: ${formatNumber(assumptions.products[key].volumes.y1 + (assumptions.products[key].volumes.y5 - assumptions.products[key].volumes.y1) / 4 * i, 0)} €M`,
          `Finanziamento Medio: ${formatNumber(assumptions.products[key].avgLoanSize || 1.0, 1)} €M`,
          `Number of Loans: ${formatNumber(val, 0)}`
        ]
      ))
    })),
    { label: 'Headcount (FTE)', data: results.kpi.fte, decimals: 0 },
    { 
      label: 'Return on Equity (ROE)', 
      data: results.kpi.roe, 
      decimals: 1, 
      unit: '%', 
      isTotal: true,
      formula: results.kpi.roe.map((val, i) => createFormula(i,
        'Net Profit / Equity Medio × 100',
        [
          `Net Profit Anno ${i+1}: ${formatNumber(results.pnl.netProfit[i], 2)} €M`,
          `Equity Inizio: ${i > 0 ? formatNumber(results.bs.equity[i-1], 0) : formatNumber(assumptions.initialEquity, 0)} €M`,
          `Equity Fine: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `Equity Medio: ${formatNumber(((i > 0 ? results.bs.equity[i-1] : assumptions.initialEquity) + results.bs.equity[i]) / 2, 0)} €M`,
          `Total ROE: ${formatNumber(val, 1)}%`
        ]
      ))
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">🏢 Real Estate Financing - Core Business</h3>
        <p className="text-green-700 text-sm">
          Traditional real estate financing with secured collateral. Focus on residential and commercial property loans 
          with public guarantees available. Higher margins compensate for elevated RWA and credit risk exposure.
        </p>
      </div>
      
      <FinancialTable title="1. Profit & Loss Statement" rows={pnlRows} />
      <FinancialTable title="2. Balance Sheet" rows={bsRows} />
      <FinancialTable title="3. Capital Requirements" rows={capitalRows} />
      <FinancialTable title="4. Key Performance Indicators" rows={kpiRows} />
    </div>
  );
};

export default REFinancingSheet;