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
  const { assumptions, setAssumptions, lastSaved, importData } = useLocalStorage();
  
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
          />
        );
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