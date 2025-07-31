import React, { useState } from 'react';

// Hooks
import { useFirebaseState } from './hooks/useFirebaseState';

// Components
import { TooltipProvider } from './components/common/TooltipProvider';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import AssumptionsSheet from './components/sheets/AssumptionsSheet';
import REFinancingSheet from './components/sheets/REFinancingSheet';
import SMEFinancingSheet from './components/sheets/SMEFinancingSheet';
import WealthManagementSheet from './components/sheets/WealthManagementSheet';
import TechPlatformSheet from './components/sheets/TechPlatformSheet';
import IncentiveFinanceSheet from './components/sheets/IncentiveFinanceSheet';
import DigitalBankingSheet from './components/sheets/DigitalBankingSheet';
import CentralFunctionsSheet from './components/divisions/CentralFunctionsSheet';
import TreasurySheet from './components/divisions/TreasurySheet';

// Utils
import { calculateResults } from './utils/calculations';

const ExcelLikeBankPlan = () => {
  const [activeSheet, setActiveSheet] = useState('reFinancing');
  const [editMode, setEditMode] = useState(true);
  
  // Use custom hooks for Firebase state management
  const { 
    assumptions, 
    setAssumptions, 
    lastSaved, 
    hasUnsavedChanges, 
    lastFileExport, 
    isAutoSaving,
    isLoading
  } = useFirebaseState();
  
  // Show loading screen while data is being loaded from Firebase
  if (isLoading || !assumptions) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Bank Plan</h2>
          <p className="text-gray-600">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }

  // Calculate results using the extracted calculation engine
  const results = calculateResults(assumptions);

  // Note: Auto-saving is now enabled, so no beforeunload warning needed

  const renderCurrentSheet = () => {
    switch (activeSheet) {
      case 'assumptions': 
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
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
                    💡 This view will automatically aggregate data from: Real Estate, SME, Digital Banking, Wealth Management, Tech Platform, and Incentive Finance divisions
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
      case 'incentiveFinance': 
        return (
          <IncentiveFinanceSheet 
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
      
      // ========== STRUCTURAL DIVISIONS ==========
      case 'centralFunctions':
        return (
          <CentralFunctionsSheet 
            divisionResults={results.divisions.central || {}}
            assumptions={assumptions}
            globalResults={results}
          />
        );
      
      case 'treasury':
        return (
          <TreasurySheet 
            divisionResults={results.divisions.treasury || {}}
            assumptions={assumptions}
            globalResults={results}
            productResults={results.productResults || {}}
          />
        );

      // ========== DIVISION ASSUMPTIONS VIEWS ==========
      case 'reAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            initialTab="re"
          />
        );
      case 'smeAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            initialTab="sme"
          />
        );
      case 'digitalAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            initialTab="digital"
          />
        );
      case 'wealthAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            initialTab="wealth"
          />
        );
      case 'techAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            initialTab="tech"
          />
        );
      case 'incentiveAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            initialTab="incentive"
          />
        );
      
      case 'centralAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            initialTab="central"
          />
        );
      
      case 'treasuryAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            setAssumptions={setAssumptions} 
            editMode={editMode}
            initialTab="treasury"
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
          hasUnsavedChanges={hasUnsavedChanges}
          lastFileExport={lastFileExport}
          isAutoSaving={isAutoSaving}
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