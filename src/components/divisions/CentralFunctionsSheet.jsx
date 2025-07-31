import React from 'react';
import FinancialTable from '../common/FinancialTable';
import { formatNumber } from '../../utils/formatters';
import { createFormula } from '../../utils/formulaHelpers';

/**
 * Central Functions Division Sheet
 * Shows only costs (no revenues) for central administrative functions
 */
const CentralFunctionsSheet = ({ divisionResults, assumptions, globalResults }) => {
  const cf = divisionResults || {};
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // Calculate FTE
  const centralFte = years.map(i => {
    const fteY1 = assumptions.centralFunctions?.fteY1 || 0;
    const fteY5 = assumptions.centralFunctions?.fteY5 || 0;
    const fteGrowth = (fteY5 - fteY1) / 4;
    return fteY1 + (fteGrowth * Math.min(i, 4));
  });

  // P&L Structure for Central Functions
  const pnlRows = [
    // ========== COSTS SECTION ==========
    {
      label: 'Central Functions Costs',
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'red'
    },
    
    {
      label: 'Board & Executive Costs',
      data: cf.pnl?.boardAndExecutiveCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.boardAndExecutiveCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Board, CEO, and executive management compensation',
          [
            {
              name: 'Base Cost Year 1',
              value: assumptions.centralFunctions?.boardAndExecutiveCostsY1 || 0,
              unit: '€M',
              calculation: 'Initial annual cost'
            },
            {
              name: 'Cost Growth',
              value: Math.pow(1 + (assumptions.costGrowthRate || 0) / 100, i),
              unit: 'x',
              calculation: `${assumptions.costGrowthRate || 0}% annual growth`
            }
          ],
          year => `${formatNumber(assumptions.centralFunctions?.boardAndExecutiveCostsY1 || 0, 2)} × ${formatNumber(Math.pow(1 + (assumptions.costGrowthRate || 0) / 100, year), 2)} = ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'Compliance & Regulatory Costs',
      data: cf.pnl?.complianceCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.complianceCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Compliance, AML, regulatory reporting',
          [
            {
              name: 'Base Cost Year 1',
              value: assumptions.centralFunctions?.complianceCostsY1 || 0,
              unit: '€M',
              calculation: 'Initial annual cost'
            }
          ],
          year => `Compliance costs: ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'Audit Costs',
      data: cf.pnl?.auditCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.auditCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Internal and external audit costs',
          [
            {
              name: 'Base Cost Year 1',
              value: assumptions.centralFunctions?.auditCostsY1 || 0,
              unit: '€M',
              calculation: 'Initial annual cost'
            }
          ],
          year => `Audit costs: ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'Legal Costs',
      data: cf.pnl?.legalCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.legalCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Legal department and external counsel',
          [
            {
              name: 'Base Cost Year 1',
              value: assumptions.centralFunctions?.legalCostsY1 || 0,
              unit: '€M',
              calculation: 'Initial annual cost'
            }
          ],
          year => `Legal costs: ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'Risk Management Costs',
      data: cf.pnl?.riskManagementCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.riskManagementCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Central risk management function',
          [
            {
              name: 'Base Cost Year 1',
              value: assumptions.centralFunctions?.riskManagementCostsY1 || 0,
              unit: '€M',
              calculation: 'Initial annual cost'
            }
          ],
          year => `Risk management costs: ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'Strategy & Planning Costs',
      data: cf.pnl?.strategyAndPlanningCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.strategyAndPlanningCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Strategic planning, M&A, investor relations',
          [
            {
              name: 'Base Cost Year 1',
              value: assumptions.centralFunctions?.strategyAndPlanningCostsY1 || 0,
              unit: '€M',
              calculation: 'Initial annual cost'
            }
          ],
          year => `Strategy costs: ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'HR Central Costs',
      data: cf.pnl?.hrCentralCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.hrCentralCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Central HR, training, recruitment',
          [
            {
              name: 'Base Cost Year 1',
              value: assumptions.centralFunctions?.hrCentralCostsY1 || 0,
              unit: '€M',
              calculation: 'Initial annual cost'
            }
          ],
          year => `HR costs: ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'Facilities Costs',
      data: cf.pnl?.facilitiesCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.facilitiesCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Headquarters and central facilities',
          [
            {
              name: 'Base Cost Year 1',
              value: assumptions.centralFunctions?.facilitiesCostsY1 || 0,
              unit: '€M',
              calculation: 'Initial annual cost'
            }
          ],
          year => `Facilities costs: ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    {
      label: 'Personnel Costs',
      data: cf.pnl?.personnelCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      formula: (cf.pnl?.personnelCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'FTE × Average Cost per FTE',
          [
            {
              name: 'Central Functions FTE',
              value: centralFte[i],
              unit: 'people',
              calculation: 'Headcount for central functions'
            },
            {
              name: 'Average Cost per FTE',
              value: assumptions.avgCostPerFte || 0,
              unit: '€k',
              calculation: 'Average fully loaded cost'
            }
          ],
          year => `${formatNumber(centralFte[year], 0)} × €${formatNumber(assumptions.avgCostPerFte || 0, 0)}k = ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    // ========== TOTAL COSTS ==========
    {
      label: 'Total Central Functions Costs',
      data: cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isTotal: true,
      formula: (cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Sum of all central function costs',
          [
            {
              name: 'Total Costs',
              value: val,
              unit: '€M',
              calculation: 'All central costs combined'
            }
          ],
          year => `Total central costs: ${formatNumber(Math.abs(val), 2)} €M`
        )
      )
    },
    
    // ========== IMPACT ==========
    {
      label: 'Pre-tax Impact',
      data: cf.pnl?.preTaxProfit || [0,0,0,0,0,0,0,0,0,0],
      decimals: 2,
      isSubTotal: true,
      formula: (cf.pnl?.preTaxProfit || [0,0,0,0,0,0,0,0,0,0]).map((val, i) => 
        createFormula(
          i,
          'Total costs (negative impact on bank P&L)',
          [
            {
              name: 'Pre-tax Impact',
              value: val,
              unit: '€M',
              calculation: 'Reduces bank pre-tax profit'
            }
          ],
          year => `Pre-tax impact: ${formatNumber(val, 2)} €M`
        )
      )
    }
  ];

  // KPI Section
  const kpiRows = [
    {
      label: 'Key Metrics',
      data: [null, null, null, null, null, null, null, null, null, null],
      isHeader: true,
      bgColor: 'blue'
    },
    
    {
      label: 'FTE (Headcount)',
      data: centralFte,
      decimals: 0,
      unit: '',
      formula: centralFte.map((val, i) => 
        createFormula(
          i,
          'Central Functions headcount',
          [
            {
              name: 'FTE Year 1',
              value: assumptions.centralFunctions?.fteY1 || 0,
              unit: 'people',
              calculation: 'Starting headcount'
            },
            {
              name: 'FTE Year 5',
              value: assumptions.centralFunctions?.fteY5 || 0,
              unit: 'people',
              calculation: 'Target headcount'
            }
          ],
          year => `Headcount: ${formatNumber(val, 0)} people`
        )
      )
    },
    
    {
      label: 'Cost per FTE',
      data: years.map(i => 
        centralFte[i] > 0 ? Math.abs((cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0])[i]) / centralFte[i] * 1000 : 0
      ),
      decimals: 0,
      unit: '€k',
      formula: years.map(i => 
        createFormula(
          i,
          'Total Costs / FTE',
          [
            {
              name: 'Total Costs',
              value: Math.abs((cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0])[i]),
              unit: '€M',
              calculation: 'All central costs'
            },
            {
              name: 'FTE',
              value: centralFte[i],
              unit: 'people',
              calculation: 'Central headcount'
            }
          ],
          year => centralFte[year] > 0 ? 
            `${formatNumber(Math.abs((cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0])[year]), 2)} ÷ ${formatNumber(centralFte[year], 0)} × 1000 = €${formatNumber(Math.abs((cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0])[year]) / centralFte[year] * 1000, 0)}k` : 
            '0 ÷ 0 = €0k'
        )
      )
    },
    
    {
      label: '% of Bank Total Costs',
      data: years.map(i => {
        const totalBankCosts = Math.abs((globalResults.pnl?.totalOpex || [0,0,0,0,0,0,0,0,0,0])[i] || 0) + 
                             Math.abs((cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0);
        return totalBankCosts > 0 ? 
          (Math.abs((cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0])[i]) / totalBankCosts) * 100 : 0;
      }),
      decimals: 1,
      unit: '%',
      formula: years.map(i => {
        const centralCosts = Math.abs((cf.pnl?.totalCentralCosts || [0,0,0,0,0,0,0,0,0,0])[i] || 0);
        const totalBankCosts = Math.abs((globalResults.pnl?.totalOpex || [0,0,0,0,0,0,0,0,0,0])[i] || 0) + centralCosts;
        
        return createFormula(
          i,
          'Central Costs / Total Bank Costs',
          [
            {
              name: 'Central Costs',
              value: centralCosts,
              unit: '€M',
              calculation: 'Central functions costs'
            },
            {
              name: 'Total Bank Costs',
              value: totalBankCosts,
              unit: '€M',
              calculation: 'All bank operating costs'
            }
          ],
          year => totalBankCosts > 0 ? 
            `${formatNumber(centralCosts, 2)} ÷ ${formatNumber(totalBankCosts, 2)} × 100 = ${formatNumber((centralCosts / totalBankCosts) * 100, 1)}%` : 
            '0 ÷ 0 = 0%'
        );
      })
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <h2 className="text-2xl font-bold">Central Functions Division</h2>
        <p className="text-gray-300 mt-2">
          Non-allocated central costs including board, compliance, risk management, and corporate functions
        </p>
      </div>
      
      <FinancialTable title="Central Functions P&L" rows={pnlRows} />
      <FinancialTable title="Key Performance Indicators" rows={kpiRows} />
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Central Functions costs are not allocated to business divisions and directly impact bank profitability.
          These costs represent essential corporate functions that cannot be directly attributed to specific business activities.
        </p>
      </div>
    </div>
  );
};

export default CentralFunctionsSheet;