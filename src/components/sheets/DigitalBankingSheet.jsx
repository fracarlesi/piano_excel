import React from 'react';
import FinancialTable from '../common/FinancialTable';
import { formatNumber } from '../../utils/formatters';

const DigitalBankingSheet = ({ assumptions, results }) => {
  // Helper function to create formula explanations
  const createFormula = (year, formula, details) => ({
    formula,
    details: details.map(d => typeof d === 'function' ? d(year) : d)
  });

  // Filter only Digital Banking products
  const digitalProductResults = Object.fromEntries(
    Object.entries(results.productResults).filter(([key]) => key.startsWith('digital'))
  );

  // Use Digital Banking division-specific results
  const digitalResults = {
    ...results,
    bs: {
      ...results.bs,
      performingAssets: results.divisions.digital.bs.performingAssets,
      nonPerformingAssets: results.divisions.digital.bs.nonPerformingAssets,
      equity: results.divisions.digital.bs.allocatedEquity,
    },
    pnl: {
      ...results.pnl,
      interestIncome: results.divisions.digital.pnl.interestIncome,
      commissionIncome: results.divisions.digital.pnl.commissionIncome,
      totalLLP: results.divisions.digital.pnl.totalLLP,
    },
    capital: {
      ...results.capital,
      rwaCreditRisk: results.divisions.digital.capital.rwaCreditRisk,
      totalRWA: results.divisions.digital.capital.totalRWA,
    },
    kpi: {
      ...results.kpi,
      fte: results.kpi.digitalFte,
      cet1Ratio: results.divisions.digital.capital.cet1Ratio,
    }
  };

  const pnlRows = [
    { 
      label: 'Interest Income (Digital Services)', 
      data: digitalResults.pnl.interestIncome, 
      decimals: 2, 
      isTotal: true,
      formula: digitalResults.pnl.interestIncome.map((val, i) => createFormula(i, 
        'Digital Services × Interest Spread (Payment Services)',
        [
          `Payment Services Revenue: ${formatNumber(digitalProductResults.digitalPaymentServices?.interestIncome[i] || 0, 2)} €M`,
          `International Transfer Spread: 0.4%`,
          `Total Interest Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.interestIncome, 
      decimals: 2, 
      indent: true,
      formula: p.interestIncome.map((val, i) => createFormula(i,
        'Service Volume × Interest Rate (where applicable)',
        [
          `Service Volume: ${formatNumber(p.performingAssets[i], 0)} €M`,
          `Interest Rate: ${(assumptions.euribor + assumptions.products[key].spread).toFixed(2)}%`,
          `Interest Income: ${formatNumber(val, 2)} €M`
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
          `Cost of Funding: ${assumptions.costOfFundsRate}%`,
          `Interest Expenses: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.interestExpense, 
      decimals: 2, 
      indent: true,
      formula: p.interestExpense.map((val, i) => createFormula(i,
        'Allocated Interest Expenses × Service Weight',
        [
          `Total Interest Expenses: ${formatNumber(results.pnl.interestExpenses[i], 2)} €M`,
          `Service Asset Weight: ${((p.performingAssets[i] + p.nonPerformingAssets[i]) / results.bs.totalAssets[i] * 100).toFixed(1)}%`,
          `Allocated Expense: ${formatNumber(val, 2)} €M`
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
          `Interest Expenses: ${formatNumber(results.pnl.interestExpenses[i], 2)} €M`,
          `NII: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Fee & Commission Income (Main Revenue)', 
      data: digitalResults.pnl.commissionIncome, 
      decimals: 2, 
      isTotal: true,
      formula: digitalResults.pnl.commissionIncome.map((val, i) => createFormula(i,
        'Sum of Digital Banking Fees & Commissions',
        [
          ...Object.entries(digitalProductResults).map(([key, p], idx) => 
            `${assumptions.products[key].name}: ${formatNumber(p.commissionIncome[i], 2)} €M`
          ),
          `Total Fee Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.commissionIncome, 
      decimals: 2, 
      indent: true,
      formula: p.commissionIncome.map((val, i) => {
        const annualGrowth = (assumptions.products[key].volumes.y5 - assumptions.products[key].volumes.y1) / 4;
        const serviceVolume = assumptions.products[key].volumes.y1 + (annualGrowth * i);
        return createFormula(i,
          'Service Volume × Commission Rate',
          [
            `Service Volume Year ${i+1}: ${formatNumber(serviceVolume, 0)} €M`,
            `Commission Rate: ${assumptions.products[key].commissionRate}%`,
            `Fee Revenue: ${formatNumber(val, 2)} €M`,
            assumptions.products[key].name.includes('SaaS') ? 'High-margin SaaS revenue model' : 
            assumptions.products[key].name.includes('Marketplace') ? 'Commission from third-party services' :
            assumptions.products[key].name.includes('Payment') ? 'Interchange fees + processing' :
            'Digital banking service fees'
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
          `Total Fee Income: ${formatNumber(results.pnl.commissionIncome[i], 2)} €M`,
          `Fee Expense Rate: ${assumptions.commissionExpenseRate}%`,
          `Fee Expenses: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.commissionExpense, 
      decimals: 2, 
      indent: true,
      formula: p.commissionExpense.map((val, i) => createFormula(i,
        'Total Fee Expenses × Service Weight',
        [
          `Total Fee Expenses: ${formatNumber(results.pnl.commissionExpenses[i], 2)} €M`,
          `Service Weight: ${((p.performingAssets[i] + p.nonPerformingAssets[i]) / results.bs.totalAssets[i] * 100).toFixed(1)}%`,
          `Allocated: ${formatNumber(val, 2)} €M`
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
          `Fee Income: ${formatNumber(results.pnl.commissionIncome[i], 2)} €M`,
          `Fee Expenses: ${formatNumber(results.pnl.commissionExpenses[i], 2)} €M`,
          `Net Fee Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Total Operating Income', 
      data: results.pnl.totalRevenues, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.totalRevenues.map((val, i) => createFormula(i,
        'Net Interest Income + Net Fee Income',
        [
          `Net Interest Income: ${formatNumber(results.pnl.netInterestIncome[i], 2)} €M`,
          `Net Fee Income: ${formatNumber(results.pnl.netCommissions[i], 2)} €M`,
          `Total Operating Income: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Personnel Costs (Tech-Heavy)', 
      data: results.pnl.personnelCostsTotal, 
      decimals: 2, 
      isTotal: true,
      bgColor: 'white',
      formula: results.pnl.personnelCostsTotal.map((val, i) => createFormula(i,
        'Digital Division FTE × Average Cost per FTE',
        [
          `Digital FTE: ${formatNumber(results.kpi.digitalFte[i], 0)}`,
          `Avg Cost per FTE: ${assumptions.avgCostPerFte}k€ (Tech premium)`,
          `Total Personnel Costs: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Technology & Cloud Costs', 
      data: results.pnl.itCosts, 
      decimals: 2, 
      indent: true,
      formula: results.pnl.itCosts.map((val, i) => createFormula(i,
        'Base IT Costs × Growth Rate (Infrastructure scaling)',
        [
          `Base IT Costs Year 1: ${assumptions.itCostsY1} €M`,
          `Growth Rate: ${assumptions.costGrowthRate}% (Cloud scaling)`,
          `Year ${i+1} IT Costs: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Marketing & Customer Acquisition', 
      data: results.pnl.marketingCosts, 
      decimals: 2, 
      indent: true,
      formula: results.pnl.marketingCosts.map((val, i) => createFormula(i,
        'Base Marketing × Growth Rate (Digital acquisition)',
        [
          `Base Marketing Year 1: ${assumptions.marketingCostsY1} €M`,
          `Growth Rate: ${assumptions.costGrowthRate}% (Scaling acquisition)`,
          `Year ${i+1} Marketing: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Administrative Costs', 
      data: results.pnl.adminCosts, 
      decimals: 2, 
      indent: true,
      formula: results.pnl.adminCosts.map((val, i) => createFormula(i,
        'Base Admin Costs × Growth Rate',
        [
          `Base Admin Year 1: ${assumptions.adminCostsY1} €M`,
          `Growth Rate: ${assumptions.costGrowthRate}%`,
          `Year ${i+1} Admin: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'HQ Cost Allocation', 
      data: results.pnl.hqAllocation, 
      decimals: 2, 
      indent: true,
      formula: results.pnl.hqAllocation.map((val, i) => createFormula(i,
        'HQ Shared Services Allocation',
        [
          `Base HQ Allocation: ${assumptions.hqAllocationY1} €M`,
          `Growth Rate: ${assumptions.costGrowthRate}%`,
          `Allocated HQ Costs: ${formatNumber(-val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Total Operating Expenses', 
      data: results.pnl.totalOpex, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.totalOpex.map((val, i) => createFormula(i,
        'Personnel + Technology + Marketing + Admin + HQ',
        [
          `Personnel: ${formatNumber(results.pnl.personnelCostsTotal[i], 2)} €M`,
          `Technology: ${formatNumber(results.pnl.itCosts[i], 2)} €M`,
          `Marketing: ${formatNumber(results.pnl.marketingCosts[i], 2)} €M`,
          `Admin: ${formatNumber(results.pnl.adminCosts[i], 2)} €M`,
          `HQ Allocation: ${formatNumber(results.pnl.hqAllocation[i], 2)} €M`,
          `Total OpEx: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Loan Loss Provisions (Minimal)', 
      data: digitalResults.pnl.totalLLP, 
      decimals: 2, 
      isTotal: true,
      formula: digitalResults.pnl.totalLLP.map((val, i) => createFormula(i,
        'Minimal LLP (Service-based model)',
        [
          `Digital services have minimal credit risk`,
          `LLP mainly from Payment Services counterparty risk`,
          `Total LLP Digital: ${formatNumber(val, 2)} €M`
        ]
      ))
    },
    { 
      label: 'Profit Before Tax (PBT)', 
      data: results.pnl.preTaxProfit, 
      decimals: 2, 
      isHeader: true,
      formula: results.pnl.preTaxProfit.map((val, i) => createFormula(i,
        'Total Revenue - Operating Costs - LLP',
        [
          `Total Revenue: ${formatNumber(results.pnl.totalRevenues[i], 2)} €M`,
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
        'PBT × Tax Rate (if PBT > 0)',
        [
          `Profit Before Tax: ${formatNumber(results.pnl.preTaxProfit[i], 2)} €M`,
          `Tax Rate: ${assumptions.taxRate}%`,
          `Taxes: ${formatNumber(val, 2)} €M`,
          results.pnl.preTaxProfit[i] <= 0 ? `No tax on losses` : ''
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
          `Taxes: ${formatNumber(results.pnl.taxes[i], 2)} €M`,
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
        'Digital Services + Operating Assets',
        [
          `Digital Service Assets: ${formatNumber(results.bs.performingAssets[i], 0)} €M`,
          `Operating Assets: ${formatNumber(results.bs.operatingAssets[i], 0)} €M`,
          `Total Assets: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Digital Service Assets', 
      data: digitalResults.bs.performingAssets, 
      decimals: 0, 
      indent: true,
      formula: digitalResults.bs.performingAssets.map((val, i) => createFormula(i,
        'Sum of Digital Service Asset Equivalents',
        [
          ...Object.entries(digitalProductResults).map(([key, p], idx) => 
            `${assumptions.products[key].name}: ${formatNumber(p.performingAssets[i], 0)} €M`
          ),
          `Total Digital Assets: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.performingAssets, 
      decimals: 0, 
      indent: true,
      formula: p.performingAssets.map((val, i) => createFormula(i,
        'Service Volume (Asset Equivalent for Digital Services)',
        [
          `Service represents fee-generating capacity`,
          `Type: ${assumptions.products[key].type}`,
          `Asset Equivalent: ${formatNumber(val, 0)} €M`
        ]
      ))
    })),
    { 
      label: 'Operating Assets (Tech Infrastructure)', 
      data: results.bs.operatingAssets, 
      decimals: 0, 
      indent: true,
      formula: results.bs.operatingAssets.map((val, i) => createFormula(i,
        'Technology Infrastructure & Platform Assets',
        [
          `Total Service Assets: ${formatNumber(results.bs.performingAssets[i], 0)} €M`,
          `Operating Assets Ratio: ${assumptions.operatingAssetsRatio}%`,
          `Tech Infrastructure: ${formatNumber(val, 0)} €M`
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
          `Equity: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `Total L&E: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Customer Deposits (Digital Accounts)', 
      data: results.bs.sightDeposits, 
      decimals: 0, 
      indent: true,
      formula: results.bs.sightDeposits.map((val, i) => createFormula(i,
        'Digital Banking Customer Deposits',
        [
          `Total Liabilities: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
          `% Sight Deposits: ${assumptions.fundingMix.sightDeposits}%`,
          `Customer Deposits: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Term Deposits', 
      data: results.bs.termDeposits, 
      decimals: 0, 
      indent: true,
      formula: results.bs.termDeposits.map((val, i) => createFormula(i,
        'Term Deposits from Digital Platform',
        [
          `Total Liabilities: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
          `% Term Deposits: ${assumptions.fundingMix.termDeposits}%`,
          `Term Deposits: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Group Funding', 
      data: results.bs.groupFunding, 
      decimals: 0, 
      indent: true,
      formula: results.bs.groupFunding.map((val, i) => createFormula(i,
        'Funding from Parent Bank',
        [
          `Total Liabilities: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
          `% Group Funding: ${assumptions.fundingMix.groupFunding}%`,
          `Group Funding: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    { 
      label: 'Allocated Equity (Digital Division)', 
      data: digitalResults.bs.equity, 
      decimals: 0, 
      indent: true,
      formula: digitalResults.bs.equity.map((val, i) => createFormula(i,
        'Total Equity × Digital RWA Weight',
        [
          `Total Bank Equity: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `Digital RWA: ${formatNumber(results.divisions.digital.capital.totalRWA[i], 0)} €M`,
          `Total RWA: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
          `Digital Allocated Equity: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
  ];

  const capitalRows = [
    { 
      label: 'RWA (Low for Digital Services)', 
      data: digitalResults.capital.totalRWA, 
      decimals: 0, 
      isHeader: true,
      formula: digitalResults.capital.totalRWA.map((val, i) => createFormula(i,
        'Digital RWA (mainly Operational Risk)',
        [
          `Credit RWA: ${formatNumber(digitalResults.capital.rwaCreditRisk[i], 0)} €M`,
          `Operational RWA: ~${formatNumber(digitalResults.capital.totalRWA[i] - digitalResults.capital.rwaCreditRisk[i], 0)} €M`,
          `Total Digital RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.rwa, 
      decimals: 0, 
      indent: true,
      formula: p.rwa.map((val, i) => createFormula(i,
        'Service Assets × RWA Density',
        [
          `Service Assets: ${formatNumber(p.performingAssets[i], 0)} €M`,
          `RWA Density: ${assumptions.products[key].rwaDensity}%`,
          `Service RWA: ${formatNumber(val, 0)} €M`
        ]
      ))
    })),
    { 
      label: 'Allocated Equity (CET1)', 
      data: digitalResults.bs.equity, 
      decimals: 0, 
      isHeader: true,
      formula: digitalResults.bs.equity.map((val, i) => createFormula(i,
        'RWA-based Equity Allocation',
        [
          `Total Bank Equity: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `Digital RWA Weight: ${(digitalResults.capital.totalRWA[i] / results.capital.totalRWA[i] * 100).toFixed(1)}%`,
          `Digital Allocated Equity: ${formatNumber(val, 0)} €M`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.allocatedEquity, 
      decimals: 0, 
      indent: true,
      formula: p.allocatedEquity.map((val, i) => createFormula(i,
        'Total Equity × (Service RWA / Total RWA)',
        [
          `Total Equity: ${formatNumber(results.bs.equity[i], 0)} €M`,
          `Service RWA: ${formatNumber(p.rwa[i], 0)} €M`,
          `Total RWA: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
          `Service Allocated Equity: ${formatNumber(val, 0)} €M`
        ]
      ))
    })),
    { 
      label: 'CET1 Ratio (%) - Digital Division', 
      data: digitalResults.kpi.cet1Ratio, 
      decimals: 1, 
      unit: '%', 
      isHeader: true,
      formula: digitalResults.kpi.cet1Ratio.map((val, i) => createFormula(i,
        'Digital Allocated Equity / Digital RWA × 100',
        [
          `Digital Allocated Equity: ${formatNumber(digitalResults.bs.equity[i], 0)} €M`,
          `Digital RWA: ${formatNumber(digitalResults.capital.totalRWA[i], 0)} €M`,
          `Digital CET1 Ratio: ${formatNumber(val, 1)}%`,
          `Regulatory Minimum: 4.5% + buffers`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.cet1Ratio, 
      decimals: 1, 
      unit: '%', 
      indent: true,
      formula: p.cet1Ratio.map((val, i) => createFormula(i,
        'Service Allocated Equity / Service RWA × 100',
        [
          `Service Allocated Equity: ${formatNumber(p.allocatedEquity[i], 0)} €M`,
          `Service RWA: ${formatNumber(p.rwa[i], 0)} €M`,
          `Service CET1 Ratio: ${formatNumber(val, 1)}%`
        ]
      ))
    })),
  ];

  const kpiRows = [
    { 
      label: 'Cost / Income Ratio', 
      data: results.kpi.costIncome, 
      decimals: 1, 
      unit: '%',
      formula: results.kpi.costIncome.map((val, i) => createFormula(i,
        'Operating Costs / Total Revenues × 100',
        [
          `Operating Costs: ${formatNumber(-results.pnl.totalOpex[i], 2)} €M`,
          `Total Revenues: ${formatNumber(results.pnl.totalRevenues[i], 2)} €M`,
          `Cost/Income: ${formatNumber(val, 1)}% (Target: <50% for digital banks)`
        ]
      ))
    },
    { 
      label: 'Cost of Risk (Minimal)', 
      data: results.kpi.costOfRisk, 
      decimals: 0, 
      unit: ' bps',
      formula: results.kpi.costOfRisk.map((val, i) => createFormula(i,
        'LLP / Average Service Assets × 10.000',
        [
          `LLP: ${formatNumber(-results.pnl.totalLLP[i], 2)} €M`,
          `Avg Service Assets: ${formatNumber(i > 0 ? (results.bs.performingAssets[i] + results.bs.performingAssets[i-1]) / 2 : results.bs.performingAssets[i], 0)} €M`,
          `Cost of Risk: ${formatNumber(val, 0)} bps (Very low for services)`
        ]
      ))
    },
    { 
      label: 'Digital Services Delivered', 
      data: results.kpi.digitalNumberOfLoans, 
      decimals: 0, 
      isTotal: true,
      formula: results.kpi.digitalNumberOfLoans.map((val, i) => createFormula(i,
        'Number of Digital Services/Accounts Delivered',
        [
          ...Object.entries(digitalProductResults).map(([key, p], idx) => 
            `${assumptions.products[key].name}: ${formatNumber(p.numberOfLoans[i], 0)} services`
          ),
          `Total Digital Services: ${formatNumber(val, 0)}`
        ]
      ))
    },
    ...Object.entries(digitalProductResults).map(([key, p], index) => ({ 
      label: `o/w ${assumptions.products[key].name}`, 
      data: p.numberOfLoans, 
      decimals: 0, 
      indent: true,
      formula: p.numberOfLoans.map((val, i) => createFormula(i,
        'Service Volume / Average Service Size',
        [
          `Service Volume Year ${i+1}: ${formatNumber(assumptions.products[key].volumes.y1 + (assumptions.products[key].volumes.y5 - assumptions.products[key].volumes.y1) / 4 * i, 0)} €M`,
          `Average Service Size: ${formatNumber(assumptions.products[key].avgLoanSize || 1.0, 3)} €M`,
          `Number of Services: ${formatNumber(val, 0)}`
        ]
      ))
    })),
    { 
      label: 'Headcount (FTE) - Tech Focus', 
      data: results.kpi.digitalFte, 
      decimals: 0,
      formula: results.kpi.digitalFte.map((val, i) => createFormula(i,
        'Digital Division FTE Growth',
        [
          `Initial FTE: ${assumptions.digitalBankingDivision.fteY1}`,
          `Target FTE Year 5: ${assumptions.digitalBankingDivision.fteY5}`,
          `Current FTE: ${formatNumber(val, 0)} (Tech-heavy team)`
        ]
      ))
    },
    { 
      label: 'Return on Equity (ROE)', 
      data: results.kpi.roe, 
      decimals: 1, 
      unit: '%', 
      isTotal: true,
      formula: results.kpi.roe.map((val, i) => createFormula(i,
        'Net Profit / Average Equity × 100',
        [
          `Net Profit Year ${i+1}: ${formatNumber(results.pnl.netProfit[i], 2)} €M`,
          `Average Equity: ${formatNumber(((i > 0 ? results.bs.equity[i-1] : assumptions.initialEquity) + results.bs.equity[i]) / 2, 0)} €M`,
          `Total ROE: ${formatNumber(val, 1)}% (Digital banks target 15-25%)`
        ]
      ))
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🏦 Digital Banking Division - Starling Bank Model</h3>
        <p className="text-blue-700 text-sm">
          Fee-based digital banking services with minimal credit risk. Revenue from account services, payment processing, 
          marketplace commissions, and Banking-as-a-Service platform. High-margin, scalable business model.
        </p>
      </div>
      
      <FinancialTable title="1. Profit & Loss Statement" rows={pnlRows} />
      <FinancialTable title="2. Balance Sheet" rows={bsRows} />
      <FinancialTable title="3. Capital Requirements" rows={capitalRows} />
      <FinancialTable title="4. Key Performance Indicators" rows={kpiRows} />
    </div>
  );
};

export default DigitalBankingSheet;