import React, { useState, useEffect } from 'react';
import EditableNumberField from '../common/EditableNumberField';
import REAssumptions from '../assumptions/REAssumptions';
import SMEAssumptions from '../assumptions/SMEAssumptions';
import DigitalAssumptions from '../assumptions/DigitalAssumptions';
import WealthAssumptions from '../assumptions/WealthAssumptions';
import IncentiveAssumptions from '../assumptions/IncentiveAssumptions';
import TechAssumptions from '../assumptions/TechAssumptions';
import CentralAssumptions from '../assumptions/CentralAssumptions';
import TreasuryAssumptions from '../assumptions/TreasuryAssumptions';

const AssumptionsSheet = ({ assumptions, setAssumptions, editMode, initialTab = 'general' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update activeTab when initialTab changes (for navigation between assumption pages)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Helper function to handle assumption changes
  const handleAssumptionChange = (key, value) => {
    const keys = key.split('.');
    let updatedAssumptions = { ...assumptions };
    
    // Navigate to the nested property
    let current = updatedAssumptions;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set the value
    current[keys[keys.length - 1]] = value;
    
    setAssumptions(updatedAssumptions);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 're', label: 'Real Estate', icon: '🏢' },
    { id: 'sme', label: 'PMI in Difficoltà', icon: '🏭' },
    { id: 'digital', label: 'Digital Banking', icon: '📱' },
    { id: 'wealth', label: 'Wealth Management', icon: '💎' },
    { id: 'incentive', label: 'Finanza Agevolata', icon: '🌱' },
    { id: 'tech', label: 'Tech Platform', icon: '🔧' },
    { id: 'central', label: 'Central Functions', icon: '🏛️' },
    { id: 'treasury', label: 'Treasury / ALM', icon: '💰' }
  ];

  const renderGeneralAssumptions = () => (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">General Assumptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">General Parameters</h4>
            <EditableNumberField 
              label="Initial Equity" 
              value={assumptions.initialEquity} 
              onChange={val => setAssumptions({...assumptions, initialEquity: val})} 
              unit="€M" 
              disabled={!editMode} 
              isInteger
              tooltip="Starting capital invested in the bank at inception"
              tooltipImpact="Determines the initial equity base for capital ratios and affects the bank's lending capacity"
              tooltipFormula="Used as starting point for equity evolution in balance sheet"
            />
            <EditableNumberField 
              label="Tax Rate" 
              value={assumptions.taxRate} 
              onChange={val => setAssumptions({...assumptions, taxRate: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
              tooltip="Corporate income tax rate applied to pre-tax profits"
              tooltipImpact="Reduces net income across all divisions and affects return on equity (ROE)"
              tooltipFormula="Tax = Pre-tax Profit × Tax Rate"
            />
            <EditableNumberField 
              label="EURIBOR" 
              value={assumptions.euribor} 
              onChange={val => setAssumptions({...assumptions, euribor: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
              tooltip="European Interbank Offered Rate - the reference rate for interbank lending"
              tooltipImpact="Base rate for internal funds transfer pricing (FTP) and affects Treasury's interbank operations"
              tooltipFormula="FTP Rate = EURIBOR + FTP Spread"
            />
            <EditableNumberField 
              label="FTP Spread" 
              value={assumptions.ftpSpread} 
              onChange={val => setAssumptions({...assumptions, ftpSpread: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
              tooltip="Spread over EURIBOR for internal funds transfer pricing. FTP Rate = EURIBOR + FTP Spread"
            />
            <EditableNumberField 
              label="Deposit Rate" 
              value={assumptions.depositRate} 
              onChange={val => setAssumptions({...assumptions, depositRate: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
              tooltip="Interest rate paid to customers on deposit accounts"
            />
            <EditableNumberField 
              label="Cost of External Funding" 
              value={assumptions.costOfFundsRate} 
              onChange={val => setAssumptions({...assumptions, costOfFundsRate: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
              tooltip="Cost of external market funding for Treasury operations"
            />
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Personnel Costs</h4>
            <EditableNumberField 
              label="Average Cost per FTE" 
              value={assumptions.avgCostPerFte} 
              onChange={val => setAssumptions({...assumptions, avgCostPerFte: val})} 
              unit="k€" 
              disabled={!editMode} 
              isInteger
              tooltip="Average annual cost per Full-Time Equivalent employee including salary, benefits, and social charges"
              tooltipImpact="Determines personnel costs across all divisions based on their FTE counts"
              tooltipFormula="Division Personnel Cost = FTE Count × Average Cost per FTE"
            />
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Operating Costs (Year 1)</h4>
            <EditableNumberField 
              label="Administrative Costs" 
              value={assumptions.adminCostsY1} 
              onChange={val => setAssumptions({...assumptions, adminCostsY1: val})} 
              unit="€M" 
              disabled={!editMode}
              tooltip="General administrative expenses for Year 1 including office, utilities, and professional services"
              tooltipImpact="Allocated to business divisions as Other OPEX, grows annually by cost growth rate"
              tooltipFormula="Year N = Year 1 × (1 + Cost Growth Rate)^(N-1)"
            />
            <EditableNumberField 
              label="Marketing Costs" 
              value={assumptions.marketingCostsY1} 
              onChange={val => setAssumptions({...assumptions, marketingCostsY1: val})} 
              unit="€M" 
              disabled={!editMode}
              tooltip="Marketing and advertising expenses for Year 1 to acquire customers and promote products"
              tooltipImpact="Allocated to business divisions, particularly important for Digital Banking and Wealth Management"
              tooltipFormula="Year N = Year 1 × (1 + Cost Growth Rate)^(N-1)"
            />
            <EditableNumberField 
              label="IT Costs" 
              value={assumptions.itCostsY1} 
              onChange={val => setAssumptions({...assumptions, itCostsY1: val})} 
              unit="€M" 
              disabled={!editMode}
              tooltip="Technology infrastructure and software costs for Year 1"
              tooltipImpact="Allocated across divisions, with higher allocation to Digital Banking and Tech Platform divisions"
              tooltipFormula="Year N = Year 1 × (1 + Cost Growth Rate)^(N-1)"
            />
            <EditableNumberField 
              label="HQ Allocation" 
              value={assumptions.hqAllocationY1} 
              onChange={val => setAssumptions({...assumptions, hqAllocationY1: val})} 
              unit="€M" 
              disabled={!editMode}
              tooltip="Headquarters overhead costs allocated to business divisions for Year 1"
              tooltipImpact="Distributed to business divisions based on their relative size and complexity"
              tooltipFormula="Year N = Year 1 × (1 + Cost Growth Rate)^(N-1)"
            />
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Other Parameters</h4>
            <EditableNumberField 
              label="Cost Growth Rate" 
              value={assumptions.costGrowthRate} 
              onChange={val => setAssumptions({...assumptions, costGrowthRate: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
              tooltip="Annual inflation rate applied to all operating costs"
              tooltipImpact="Increases all OPEX categories year-over-year across all divisions"
              tooltipFormula="Cost Year N = Cost Year 1 × (1 + Rate)^(N-1)"
            />
            <EditableNumberField 
              label="Commission Expense Rate" 
              value={assumptions.commissionExpenseRate} 
              onChange={val => setAssumptions({...assumptions, commissionExpenseRate: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
              tooltip="Percentage of commission income paid out as commission expenses"
              tooltipImpact="Reduces net commission income in divisions with fee-based products (Wealth Management, Tech Platform)"
              tooltipFormula="Commission Expense = Commission Income × Commission Expense Rate"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Quarterly Allocation of New Business</h3>
        <p className="text-gray-600 text-sm mb-4">
          Distribute new loan originations across quarters. Values must sum to 100%.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <EditableNumberField 
            label="Q1 Allocation" 
            value={assumptions.quarterlyAllocation?.[0] || 25} 
            onChange={val => {
              const newAllocation = [...(assumptions.quarterlyAllocation || [25, 25, 25, 25])];
              newAllocation[0] = val;
              setAssumptions({...assumptions, quarterlyAllocation: newAllocation});
            }} 
            unit="%" 
            disabled={!editMode} 
            isPercentage
            tooltip="Percentage of annual new business originated in Q1 (Jan-Mar)"
            tooltipImpact="Affects interest income calculation for first year - loans originated later in the year generate less annual interest"
            tooltipFormula="Q1 loans generate interest for ~87.5% of the year"
          />
          <EditableNumberField 
            label="Q2 Allocation" 
            value={assumptions.quarterlyAllocation?.[1] || 25} 
            onChange={val => {
              const newAllocation = [...(assumptions.quarterlyAllocation || [25, 25, 25, 25])];
              newAllocation[1] = val;
              setAssumptions({...assumptions, quarterlyAllocation: newAllocation});
            }} 
            unit="%" 
            disabled={!editMode} 
            isPercentage
            tooltip="Percentage of annual new business originated in Q2 (Apr-Jun)"
            tooltipImpact="Q2 loans generate interest for ~62.5% of the year"
          />
          <EditableNumberField 
            label="Q3 Allocation" 
            value={assumptions.quarterlyAllocation?.[2] || 25} 
            onChange={val => {
              const newAllocation = [...(assumptions.quarterlyAllocation || [25, 25, 25, 25])];
              newAllocation[2] = val;
              setAssumptions({...assumptions, quarterlyAllocation: newAllocation});
            }} 
            unit="%" 
            disabled={!editMode} 
            isPercentage
            tooltip="Percentage of annual new business originated in Q3 (Jul-Sep)"
            tooltipImpact="Q3 loans generate interest for ~37.5% of the year"
          />
          <EditableNumberField 
            label="Q4 Allocation" 
            value={assumptions.quarterlyAllocation?.[3] || 25} 
            onChange={val => {
              const newAllocation = [...(assumptions.quarterlyAllocation || [25, 25, 25, 25])];
              newAllocation[3] = val;
              setAssumptions({...assumptions, quarterlyAllocation: newAllocation});
            }} 
            unit="%" 
            disabled={!editMode} 
            isPercentage
            tooltip="Percentage of annual new business originated in Q4 (Oct-Dec)"
            tooltipImpact="Q4 loans generate interest for only ~12.5% of the year"
          />
        </div>
        {assumptions.quarterlyAllocation && 
         assumptions.quarterlyAllocation.reduce((a, b) => a + b, 0) !== 100 && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-700">
            ⚠️ Warning: Quarterly allocations must sum to 100% (current sum: {assumptions.quarterlyAllocation.reduce((a, b) => a + b, 0)}%)
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Funding Mix (Liabilities)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EditableNumberField 
            label="Sight Deposits" 
            value={assumptions.fundingMix?.sightDeposits || 40} 
            onChange={val => setAssumptions({
              ...assumptions, 
              fundingMix: {...(assumptions.fundingMix || {}), sightDeposits: val}
            })} 
            unit="%" 
            disabled={!editMode} 
            isPercentage
            tooltip="Percentage of funding from on-demand customer deposits"
            tooltipImpact="Lower cost funding source, affects net interest margin and liquidity ratios"
            tooltipFormula="Part of total funding mix (must sum to 100% with other sources)"
          />
          <EditableNumberField 
            label="Term Deposits" 
            value={assumptions.fundingMix?.termDeposits || 30} 
            onChange={val => setAssumptions({
              ...assumptions, 
              fundingMix: {...(assumptions.fundingMix || {}), termDeposits: val}
            })} 
            unit="%" 
            disabled={!editMode} 
            isPercentage
            tooltip="Percentage of funding from fixed-term customer deposits"
            tooltipImpact="Higher cost than sight deposits but more stable funding, affects interest expense"
            tooltipFormula="Part of total funding mix (must sum to 100% with other sources)"
          />
          <EditableNumberField 
            label="Group Funding" 
            value={assumptions.fundingMix?.groupFunding || 30} 
            onChange={val => setAssumptions({
              ...assumptions, 
              fundingMix: {...(assumptions.fundingMix || {}), groupFunding: val}
            })} 
            unit="%" 
            disabled={!editMode} 
            isPercentage
            tooltip="Percentage of funding from parent company or group entities"
            tooltipImpact="Internal funding at market rates, managed by Treasury division"
            tooltipFormula="Part of total funding mix (must sum to 100% with other sources)"
          />
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralAssumptions();
      case 're':
        return <REAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      case 'sme':
        return <SMEAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      case 'digital':
        return <DigitalAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      case 'wealth':
        return <WealthAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      case 'incentive':
        return <IncentiveAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      case 'tech':
        return <TechAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      case 'central':
        return <CentralAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      case 'treasury':
        return <TreasuryAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      default:
        return renderGeneralAssumptions();
    }
  };

  return (
    <div className="p-4 md:p-6">

      {/* Page Title */}
      <div className="mb-6">
        {initialTab === 'general' ? (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-4xl">⚙️</span>
              General Assumptions
            </h1>
            <p className="text-gray-600 mt-2">
              Configure global parameters, costs, funding mix, and bank-wide settings that apply to all divisions.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-3xl">
                {tabs.find(tab => tab.id === initialTab)?.icon}
              </span>
              {tabs.find(tab => tab.id === initialTab)?.label} - Assumptions
            </h1>
            <p className="text-gray-600 mt-2">
              Configure products and parameters for the {tabs.find(tab => tab.id === initialTab)?.label} division.
            </p>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
      
      {/* Real-time sync status */}
      {editMode && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-gray-600 text-xs">
            🔄 Real-time collaboration enabled: All changes are synchronized across all users via Firebase<br/>
            Version: {assumptions.version} | RE Products: {Object.keys(assumptions.products || {}).filter(k => k.startsWith('re')).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default AssumptionsSheet;