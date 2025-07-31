import React, { useState } from 'react';

// Context
import { BankProvider, useBankContext } from './contexts/BankContext';

// Components
import { TooltipProvider } from './components/common/TooltipProvider';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import AssumptionsSheet from './components/sheets/AssumptionsSheet';
import StandardDivisionSheet from './components/common/StandardDivisionSheet';
// Keep legacy sheets for now - can be migrated later
import REFinancingSheet from './components/sheets/REFinancingSheet';
import SMEFinancingSheet from './components/sheets/SMEFinancingSheet';
import WealthManagementSheet from './components/sheets/WealthManagementSheet';
import IncentiveFinanceSheet from './components/sheets/IncentiveFinanceSheet';
import DigitalBankingSheet from './components/sheets/DigitalBankingSheet';

/**
 * Main Bank Plan Component
 * Now simplified using Context
 */
const BankPlanContent = () => {
  const [activeSheet, setActiveSheet] = useState('reFinancing');
  const [editMode, setEditMode] = useState(true);
  
  // Get context values
  const { 
    assumptions, 
    results, 
    handleAssumptionChange,
    getDivisionResults,
    getDivisionProducts,
    lastSaved,
    hasUnsavedChanges,
    isAutoSaving,
    exportToFile,
    importData
  } = useBankContext();

  // Render active sheet
  const renderActiveSheet = () => {
    if (!assumptions || !results) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      );
    }

    switch (activeSheet) {
      // Global views
      case 'consolidated':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            onAssumptionsChange={handleAssumptionChange} 
          />
        );
      
      // Business divisions - using legacy components for now
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
      
      // Tech Platform - using new approach
      case 'techPlatform': 
        return (
          <StandardDivisionSheet
            divisionName="Tech Platform"
            divisionResults={getDivisionResults('tech')}
            productResults={getDivisionProducts('tech')}
            assumptions={assumptions}
            globalResults={results}
            onAssumptionsChange={handleAssumptionChange}
            editMode={editMode}
            showProductDetail={true}
            divisionConfig={{
              hasProducts: true,
              hasCapitalRequirements: true
            }}
          />
        );
      
      // Structural divisions
      case 'centralFunctions':
        return (
          <StandardDivisionSheet
            divisionName="Central Functions"
            divisionResults={getDivisionResults('central')}
            productResults={{}}
            assumptions={assumptions}
            globalResults={results}
            onAssumptionsChange={handleAssumptionChange}
            editMode={editMode}
            showProductDetail={false}
            divisionConfig={{
              hasProducts: false,
              hasCapitalRequirements: false
            }}
          />
        );
      
      case 'treasury':
        return (
          <StandardDivisionSheet
            divisionName="Treasury / ALM"
            divisionResults={getDivisionResults('treasury')}
            productResults={{}}
            assumptions={assumptions}
            globalResults={results}
            onAssumptionsChange={handleAssumptionChange}
            editMode={editMode}
            showProductDetail={false}
            divisionConfig={{
              hasProducts: false,
              hasCapitalRequirements: true
            }}
          />
        );

      // Division assumptions views (future implementation)
      default:
        if (activeSheet.endsWith('Assumptions')) {
          return (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Division Assumptions View (To Be Implemented)
              </h2>
              <p className="text-gray-600">
                This view will show detailed assumptions for the selected division.
              </p>
            </div>
          );
        }
        
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">View Not Found</h2>
            <p className="text-gray-600">
              The requested view "{activeSheet}" is not available.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header 
        editMode={editMode}
        onEditModeToggle={() => setEditMode(!editMode)}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        isAutoSaving={isAutoSaving}
        onExportData={exportToFile}
        onImportData={importData}
        currentVersion={assumptions?.version}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Navigation 
          activeSheet={activeSheet} 
          onSheetChange={setActiveSheet}
          showAssumptionsMenu={editMode}
        />
        
        <main className="flex-1 overflow-auto bg-white">
          {renderActiveSheet()}
        </main>
      </div>
    </div>
  );
};

/**
 * Main App Component with Context Provider
 */
const ExcelLikeBankPlan = () => {
  return (
    <BankProvider>
      <TooltipProvider>
        <BankPlanContent />
      </TooltipProvider>
    </BankProvider>
  );
};

export default ExcelLikeBankPlan;