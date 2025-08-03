import React from 'react';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const GeneralAssumptions = () => {
  const { assumptions, updateAssumption } = useAssumptionsStore();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚙️</span>
        <h2 className="text-xl font-semibold">General Settings</h2>
      </div>

      {/* Financial Parameters */}
      <div>
        <h3 className="text-lg font-medium mb-4">📊 Parametri Finanziari</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Initial Equity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Equity (€M) 💰
              <span className="text-xs text-gray-500 ml-1">Capitale iniziale della banca</span>
            </label>
            <input
              type="number"
              value={assumptions.initialEquity || 200}
              onChange={(e) => updateAssumption('initialEquity', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="10"
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%) 🏛️
              <span className="text-xs text-gray-500 ml-1">Aliquota fiscale</span>
            </label>
            <input
              type="number"
              value={assumptions.taxRate || 28}
              onChange={(e) => updateAssumption('taxRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          {/* EURIBOR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              EURIBOR (%) 📈
              <span className="text-xs text-gray-500 ml-1">Tasso di riferimento</span>
            </label>
            <input
              type="number"
              value={assumptions.euribor || 2.0}
              onChange={(e) => updateAssumption('euribor', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          {/* Cost of Funds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost of Funds (%) 💸
              <span className="text-xs text-gray-500 ml-1">Costo della raccolta</span>
            </label>
            <input
              type="number"
              value={assumptions.costOfFundsRate || 3.0}
              onChange={(e) => updateAssumption('costOfFundsRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Operational Parameters */}
      <div>
        <h3 className="text-lg font-medium mb-4 mt-8">🏢 Parametri Operativi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* HQ Allocation Y1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HQ Costs Y1 (€M) 🏛️
              <span className="text-xs text-gray-500 ml-1">Costi sede centrale anno 1</span>
            </label>
            <input
              type="number"
              value={assumptions.hqAllocationY1 || 2.5}
              onChange={(e) => updateAssumption('hqAllocationY1', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          {/* IT Costs Y1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IT Costs Y1 (€M) 💻
              <span className="text-xs text-gray-500 ml-1">Costi IT anno 1</span>
            </label>
            <input
              type="number"
              value={assumptions.itCostsY1 || 4}
              onChange={(e) => updateAssumption('itCostsY1', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          {/* Cost Growth Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Growth Rate (%) 📈
              <span className="text-xs text-gray-500 ml-1">Crescita annua costi</span>
            </label>
            <input
              type="number"
              value={assumptions.costGrowthRate || 10}
              onChange={(e) => updateAssumption('costGrowthRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Personnel Parameters */}
      <div>
        <h3 className="text-lg font-medium mb-4 mt-8">👥 Parametri HR Globali</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Annual Salary Review */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Salary Review (%) 💰
              <span className="text-xs text-gray-500 ml-1">Incremento annuo stipendi</span>
            </label>
            <input
              type="number"
              value={assumptions.personnel?.annualSalaryReview || 2.5}
              onChange={(e) => updateAssumption('personnel.annualSalaryReview', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          {/* Company Tax Multiplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Tax Multiplier 🏛️
              <span className="text-xs text-gray-500 ml-1">Moltiplicatore oneri aziendali (RAL → Costo)</span>
            </label>
            <input
              type="number"
              value={assumptions.personnel?.companyTaxMultiplier || 1.4}
              onChange={(e) => updateAssumption('personnel.companyTaxMultiplier', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Quarterly Allocation */}
      <div>
        <h3 className="text-lg font-medium mb-4 mt-8">📅 Allocazione Trimestrale Erogazioni</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => (
            <div key={quarter}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {quarter} (%)
              </label>
              <input
                type="number"
                value={assumptions.quarterlyAllocation?.[index] || 25}
                onChange={(e) => {
                  const newAllocation = [...(assumptions.quarterlyAllocation || [25, 25, 25, 25])];
                  newAllocation[index] = parseFloat(e.target.value);
                  updateAssumption('quarterlyAllocation', newAllocation);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                min="0"
                max="100"
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Totale: {(assumptions.quarterlyAllocation || [25, 25, 25, 25]).reduce((a, b) => a + b, 0)}% 
          {(assumptions.quarterlyAllocation || [25, 25, 25, 25]).reduce((a, b) => a + b, 0) !== 100 && 
            <span className="text-red-500 ml-2">⚠️ Deve essere 100%</span>
          }
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Note:</strong> Questi parametri sono globali e influenzano tutti i calcoli del piano industriale. 
          Le modifiche vengono salvate automaticamente su Firebase e sincronizzate in tempo reale.
        </p>
      </div>

    </div>
  );
};

export default GeneralAssumptions;