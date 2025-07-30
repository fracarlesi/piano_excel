import React, { useState } from 'react';

// Hooks
import { useLocalStorage } from './hooks/useLocalStorage';

// Components
import { TooltipProvider } from './components/common/TooltipProvider';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import AssumptionsSheet from './components/sheets/AssumptionsSheet';
import REFinancingSheet from './components/sheets/REFinancingSheet';
import SMEFinancingSheet from './components/sheets/SMEFinancingSheet';
import WealthManagementSheet from './components/sheets/WealthManagementSheet';
import TechPlatformSheet from './components/sheets/TechPlatformSheet';
import SubsidizedFinanceSheet from './components/sheets/SubsidizedFinanceSheet';
import DigitalBankingSheet from './components/sheets/DigitalBankingSheet';

// Utils
import { calculateResults } from './utils/calculations';

const ExcelLikeBankPlan = () => {
  const [activeSheet, setActiveSheet] = useState('reFinancing');
  const [editMode, setEditMode] = useState(true);
  
  // Use custom hooks for localStorage management
  const { assumptions, setAssumptions, lastSaved, importData, resetToDefaults, exportToFile } = useLocalStorage();
  
  // Calculate results using the extracted calculation engine
  const results = calculateResults(assumptions);

  const renderCurrentSheet = () => {
    switch (activeSheet) {
      case 'assumptions': 
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            resetToDefaults={resetToDefaults}
            exportToFile={exportToFile}
          />
        );

      // ========== BANK CONSOLIDATED VIEW ==========
      case 'bankConsolidated':
        return (
          <div className="p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-4xl">🏦</span>
                Bank Consolidated View
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive financial overview aggregating all division results
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚧</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Consolidated View Coming Soon
                </h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  This section will display the aggregated financial statements combining all division data:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">📊 Consolidated P&L</h3>
                    <p className="text-sm text-blue-700">Sum of all division revenues, costs, and profits</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">💰 Consolidated Balance Sheet</h3>
                    <p className="text-sm text-green-700">Aggregated assets, liabilities, and equity</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">🛡️ Capital Requirements</h3>
                    <p className="text-sm text-purple-700">Total bank RWA and capital ratios</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">📈 Key Performance Indicators</h3>
                    <p className="text-sm text-orange-700">Bank-wide ROE, Cost/Income, CET1 ratio</p>
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-sm text-gray-500">
                    💡 This view will automatically aggregate data from: Real Estate, SME, Digital Banking, Wealth Management, Tech Platform, and Subsidized Finance divisions
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      // ========== DIVISION FINANCIAL VIEWS ==========
      case 'reFinancing': 
        return (
          <REFinancingSheet 
            assumptions={assumptions} 
            results={results} 
          />
        );
      case 'smeFinancing': 
        return (
          <SMEFinancingSheet 
            assumptions={assumptions} 
            results={results} 
          />
        );
      case 'wealthManagement': 
        return (
          <WealthManagementSheet 
            assumptions={assumptions} 
            results={results} 
          />
        );
      case 'techPlatform': 
        return (
          <TechPlatformSheet 
            assumptions={assumptions} 
            results={results} 
          />
        );
      case 'subsidizedFinance': 
        return (
          <SubsidizedFinanceSheet 
            assumptions={assumptions} 
            results={results} 
          />
        );
      case 'digitalBankingFinancing': 
        return (
          <DigitalBankingSheet 
            assumptions={assumptions} 
            results={results} 
          />
        );

      // ========== DIVISION ASSUMPTIONS VIEWS ==========
      case 'reAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            resetToDefaults={resetToDefaults}
            exportToFile={exportToFile}
            initialTab="re"
          />
        );
      case 'smeAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            resetToDefaults={resetToDefaults}
            exportToFile={exportToFile}
            initialTab="sme"
          />
        );
      case 'digitalAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            resetToDefaults={resetToDefaults}
            exportToFile={exportToFile}
            initialTab="digital"
          />
        );
      case 'wealthAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            resetToDefaults={resetToDefaults}
            exportToFile={exportToFile}
            initialTab="wealth"
          />
        );
      case 'techAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            resetToDefaults={resetToDefaults}
            exportToFile={exportToFile}
            initialTab="tech"
          />
        );
      case 'subsidizedAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            resetToDefaults={resetToDefaults}
            exportToFile={exportToFile}
            initialTab="subsidized"
          />
        );

      default: 
        return <div>Sheet not found</div>;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-200 font-sans">
        <Header 
          editMode={editMode}
          setEditMode={setEditMode}
          lastSaved={lastSaved}
          assumptions={assumptions}
          importData={importData}
        />
        
        <Navigation 
          activeSheet={activeSheet}
          setActiveSheet={setActiveSheet}
        />

        <div className="max-w-screen-2xl mx-auto">
          {renderCurrentSheet()}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ExcelLikeBankPlan;