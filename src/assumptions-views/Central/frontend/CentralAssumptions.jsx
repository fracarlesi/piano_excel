import React, { useState } from 'react';
import StaffingTable from '../../shared/frontend/StaffingTable';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const CentralAssumptions = () => {
  const [expandedPersonnel, setExpandedPersonnel] = useState(false);
  const { assumptions, updateAssumption } = useAssumptionsStore();
  const centralFunctions = assumptions.centralFunctions;

  const departments = [
    { key: 'CEOOffice', name: 'CEO Office', icon: '👔' },
    { key: 'Finance', name: 'Finance', icon: '💹' },
    { key: 'Risk', name: 'Risk Management', icon: '⚡' },
    { key: 'Legal', name: 'Legal & Compliance', icon: '⚖️' },
    { key: 'Compliance', name: 'Compliance', icon: '📋' },
    { key: 'HR', name: 'Human Resources', icon: '👥' },
    { key: 'Marketing', name: 'Marketing & Communications', icon: '📢' },
    { key: 'Operations', name: 'Operations', icon: '⚙️' },
    { key: 'InternalAudit', name: 'Internal Audit', icon: '🔍' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Division Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🏛️</span>
        <h2 className="text-xl font-semibold">Central Functions - Assumptions</h2>
      </div>

      {/* Non-Personnel Costs Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          💼 Costi Centrali Non-Personnel (Year 1)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facilities Costs Y1 (€M) 🏢
            </label>
            <input
              type="number"
              value={centralFunctions?.facilitiesCostsY1 || 3.0}
              onChange={(e) => updateAssumption('centralFunctions.facilitiesCostsY1', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              External Services Y1 (€M) 🤝
            </label>
            <input
              type="number"
              value={centralFunctions?.externalServicesY1 || 2.5}
              onChange={(e) => updateAssumption('centralFunctions.externalServicesY1', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Regulatory Fees Y1 (€M) 📊
            </label>
            <input
              type="number"
              value={centralFunctions?.regulatoryFeesY1 || 1.8}
              onChange={(e) => updateAssumption('centralFunctions.regulatoryFeesY1', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Central Costs Y1 (€M) 📋
            </label>
            <input
              type="number"
              value={centralFunctions?.otherCentralCostsY1 || 1.2}
              onChange={(e) => updateAssumption('centralFunctions.otherCentralCostsY1', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Questi costi cresceranno annualmente secondo il Cost Growth Rate definito nei General Assumptions
          </p>
        </div>
      </div>

      {/* Personnel by Department Section */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            👥 Personale per Dipartimento
          </h3>
          <button
            onClick={() => setExpandedPersonnel(!expandedPersonnel)}
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${
                expandedPersonnel ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>{expandedPersonnel ? 'Chiudi' : 'Espandi'}</span>
          </button>
        </div>
        {expandedPersonnel && (
          <div className="p-4">
            <div className="space-y-6">
              {departments.map(dept => {
                const deptData = centralFunctions?.departments?.[dept.key];
                if (!deptData) return null;

                return (
                  <div key={dept.key} className="border rounded-lg p-4">
                    <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                      <span className="text-2xl">{dept.icon}</span>
                      {dept.name}
                    </h4>
                    
                    <StaffingTable
                      divisionData={deptData}
                      path={`centralFunctions.departments.${dept.key}`}
                      handleAssumptionChange={updateAssumption}
                      editMode={true}
                      companyTaxMultiplier={assumptions.personnel?.companyTaxMultiplier || 1.4}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>ℹ️ Allocazione Costi:</strong> I costi delle Central Functions (sia personnel che non-personnel) 
          vengono allocati alle divisioni business in base alla loro dimensione e complessità operativa.
        </p>
      </div>
    </div>
  );
};

export default CentralAssumptions;