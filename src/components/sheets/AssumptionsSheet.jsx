import React, { useState, useEffect } from 'react';
import EditableNumberField from '../common/EditableNumberField';
import REAssumptions from '../assumptions/REAssumptions';
import SMEAssumptions from '../assumptions/SMEAssumptions';
import DigitalAssumptions from '../assumptions/DigitalAssumptions';
import WealthAssumptions from '../assumptions/WealthAssumptions';
import SubsidizedAssumptions from '../assumptions/SubsidizedAssumptions';
import TechAssumptions from '../assumptions/TechAssumptions';

const AssumptionsSheet = ({ assumptions, setAssumptions, editMode, resetToDefaults, exportToFile, initialTab = 'general' }) => {
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
    { id: 'subsidized', label: 'Finanza Agevolata', icon: '🌱' },
    { id: 'tech', label: 'Tech Platform', icon: '🔧' }
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
            />
            <EditableNumberField 
              label="Tax Rate" 
              value={assumptions.taxRate} 
              onChange={val => setAssumptions({...assumptions, taxRate: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
            />
            <EditableNumberField 
              label="EURIBOR" 
              value={assumptions.euribor} 
              onChange={val => setAssumptions({...assumptions, euribor: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
            />
            <EditableNumberField 
              label="Cost of Funding" 
              value={assumptions.costOfFundsRate} 
              onChange={val => setAssumptions({...assumptions, costOfFundsRate: val})} 
              unit="% on Assets" 
              disabled={!editMode} 
              isPercentage
            />
            <EditableNumberField 
              label="Operating Assets Ratio" 
              value={assumptions.operatingAssetsRatio} 
              onChange={val => setAssumptions({...assumptions, operatingAssetsRatio: val})} 
              unit="% on Loans" 
              disabled={!editMode} 
              isPercentage
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
            />
            <EditableNumberField 
              label="Marketing Costs" 
              value={assumptions.marketingCostsY1} 
              onChange={val => setAssumptions({...assumptions, marketingCostsY1: val})} 
              unit="€M" 
              disabled={!editMode}
            />
            <EditableNumberField 
              label="IT Costs" 
              value={assumptions.itCostsY1} 
              onChange={val => setAssumptions({...assumptions, itCostsY1: val})} 
              unit="€M" 
              disabled={!editMode}
            />
            <EditableNumberField 
              label="HQ Allocation" 
              value={assumptions.hqAllocationY1} 
              onChange={val => setAssumptions({...assumptions, hqAllocationY1: val})} 
              unit="€M" 
              disabled={!editMode}
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
            />
            <EditableNumberField 
              label="Commission Expense Rate" 
              value={assumptions.commissionExpenseRate} 
              onChange={val => setAssumptions({...assumptions, commissionExpenseRate: val})} 
              unit="%" 
              disabled={!editMode} 
              isPercentage
            />
          </div>
        </div>
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
      case 'subsidized':
        return <SubsidizedAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
      case 'tech':
        return <TechAssumptions assumptions={assumptions} onAssumptionChange={handleAssumptionChange} />;
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
      
      {/* Save and Debug Tools */}
      {editMode && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Save & Tools</h4>
          <div className="flex gap-3 mb-4">
            {exportToFile && (
              <button
                onClick={exportToFile}
                className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                💾 Save to Project Folder
              </button>
            )}
            {resetToDefaults && (
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                🔄 Reset to Defaults
              </button>
            )}
            <button
              onClick={() => console.log('Current assumptions:', assumptions)}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              📊 Log Current Data
            </button>
          </div>
          <p className="text-gray-600 text-xs">
            Version: {assumptions.version} | RE Products: {Object.keys(assumptions.products || {}).filter(k => k.startsWith('re')).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default AssumptionsSheet;