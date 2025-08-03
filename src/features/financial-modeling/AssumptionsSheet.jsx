import React, { useState, useEffect } from 'react';
import { GeneralAssumptions } from '../../assumptions-views/General';
import { REAssumptions } from '../../assumptions-views/RealEstate';
import { SMEAssumptions } from '../../assumptions-views/SME';
import { DigitalAssumptions } from '../../assumptions-views/Digital';
import { WealthAssumptions } from '../../assumptions-views/Wealth';
import { IncentiveAssumptions } from '../../assumptions-views/Incentive';
import { TechAssumptions } from '../../assumptions-views/Tech';
import { CentralAssumptions } from '../../assumptions-views/Central';
import { TreasuryAssumptions } from '../../assumptions-views/Treasury';

const AssumptionsSheet = ({ assumptions, onAssumptionsChange, setAssumptions, editMode = true, initialTab = 'general' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update activeTab when initialTab changes (for navigation between assumption pages)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Helper function to handle assumption changes
  const handleAssumptionChange = (key, value) => {
    // Use onAssumptionsChange if provided (Zustand), otherwise use setAssumptions
    if (onAssumptionsChange) {
      onAssumptionsChange(key, value);
    } else if (setAssumptions) {
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
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    // Credit divisions first
    { id: 're', label: 'Real Estate', icon: '🏢' },
    { id: 'sme', label: 'PMI in Difficoltà', icon: '🏭' },
    { id: 'incentive', label: 'Finanza Agevolata', icon: '🌱' },
    // Digital divisions
    { id: 'digital', label: 'Digital Banking', icon: '📱' },
    { id: 'wealth', label: 'Wealth Management', icon: '💎' },
    { id: 'tech', label: 'Tech Platform', icon: '🔧' },
    // Support divisions
    { id: 'central', label: 'Central Functions', icon: '🏛️' },
    { id: 'treasury', label: 'Treasury / ALM', icon: '💰' }
  ];

  const renderGeneralAssumptions = () => (
    <GeneralAssumptions />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralAssumptions();
      case 're':
        return <REAssumptions />;
      case 'sme':
        return <SMEAssumptions />;
      case 'digital':
        return <DigitalAssumptions />;
      case 'wealth':
        return <WealthAssumptions />;
      case 'incentive':
        return <IncentiveAssumptions />;
      case 'tech':
        return <TechAssumptions />;
      case 'central':
        return <CentralAssumptions />;
      case 'treasury':
        return <TreasuryAssumptions />;
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
            Version: {assumptions.version} | Refactoring completato ✅
          </p>
        </div>
      )}
    </div>
  );
};

export default AssumptionsSheet;