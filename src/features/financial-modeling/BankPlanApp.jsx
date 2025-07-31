import React, { useEffect } from 'react';
import { useState } from 'react';
import useAssumptionsStore from '../../store/assumptionsStore';

// Components
import { TooltipProvider } from '../../components/TooltipProvider';
import Header from '../../components/layout/Header';
import Navigation from '../../components/layout/Navigation';
import AssumptionsSheet from './AssumptionsSheet';
import StandardDivisionSheet from '../../components/StandardDivisionSheet';

// Division sheets (to be migrated)
import REFinancingSheet from './REFinancingSheet';
import SMEFinancingSheet from './SMEFinancingSheet';
import WealthManagementSheet from './WealthManagementSheet';
import IncentiveFinanceSheet from './IncentiveFinanceSheet';
import DigitalBankingSheet from './DigitalBankingSheet';

/**
 * Main Bank Plan Application
 * Uses Zustand for state management
 */
const BankPlanApp = () => {
  const [activeSheet, setActiveSheet] = useState('reFinancing');
  const [editMode, setEditMode] = useState(true);
  
  // Zustand store
  const {
    assumptions,
    results,
    isLoading,
    hasUnsavedChanges,
    lastSaved,
    isAutoSaving,
    initialize,
    cleanup,
    updateAssumption,
    exportToFile,
    importData
  } = useAssumptionsStore();
  
  // Helper functions for division data
  const getDivisionResults = (key) => {
    const divisionMapping = {
      're': 'RealEstateFinancing',
      'sme': 'SMEFinancing',
      'digital': 'DigitalBanking',
      'wealth': 'WealthAndAssetManagement',
      'tech': 'Tech',
      'incentive': 'Incentives',
      'central': 'CentralFunctions',
      'treasury': 'Treasury'
    };
    
    if (!results || !results.divisions) return null;
    return results.divisions[key] || results.divisions[divisionMapping[key]];
  };
  
  const getDivisionProducts = (key) => {
    if (!results || !results.productResults) return {};
    return Object.fromEntries(
      Object.entries(results.productResults)
        .filter(([k]) => k.startsWith(key))
    );
  };
  
  // Initialize store on mount
  useEffect(() => {
    initialize();
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initialize, cleanup]);
  
  // Handle file import
  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        importData(e.target.result);
      };
      reader.readAsText(file);
    }
  };
  
  // Render active sheet
  const renderActiveSheet = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      );
    }
    
    if (!assumptions || !results) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Initializing...</div>
        </div>
      );
    }
    
    switch (activeSheet) {
      // Global views
      case 'consolidated':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            onAssumptionsChange={updateAssumption} 
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
            divisionKey="tech"
            divisionResults={getDivisionResults('tech')}
            productResults={getDivisionProducts('tech')}
            assumptions={assumptions}
            results={results}
            onAssumptionsChange={updateAssumption}
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
            divisionKey="central"
            divisionResults={getDivisionResults('central')}
            productResults={{}}
            assumptions={assumptions}
            results={results}
            onAssumptionsChange={updateAssumption}
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
            divisionKey="treasury"
            divisionResults={getDivisionResults('treasury')}
            productResults={{}}
            assumptions={assumptions}
            results={results}
            onAssumptionsChange={updateAssumption}
            editMode={editMode}
            showProductDetail={false}
            divisionConfig={{
              hasProducts: false,
              hasCapitalRequirements: true
            }}
          />
        );
      
      // Assumption views
      case 'reAssumptions':
      case 'smeAssumptions':
      case 'digitalAssumptions':
      case 'wealthAssumptions':
      case 'techAssumptions':
      case 'incentiveAssumptions':
      case 'centralAssumptions':
      case 'treasuryAssumptions':
        return (
          <AssumptionsSheet 
            assumptions={assumptions} 
            onAssumptionsChange={updateAssumption}
            editMode={editMode}
            initialTab={activeSheet.replace('Assumptions', '')}
          />
        );
        
      default:
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
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-gray-100">
        <Header 
          editMode={editMode}
          onEditModeToggle={() => setEditMode(!editMode)}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          isAutoSaving={isAutoSaving}
          onExportData={exportToFile}
          onImportData={handleImportData}
          version={assumptions?.version}
        />
        
        <Navigation 
          activeSheet={activeSheet} 
          setActiveSheet={setActiveSheet}
          showAssumptionsMenu={editMode}
        />
        
        <main className="flex-1 overflow-auto bg-white">
          {renderActiveSheet()}
        </main>
      </div>
    </TooltipProvider>
  );
};

export default BankPlanApp;