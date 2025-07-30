import React, { useState, useEffect, createContext } from 'react';
import { Settings, TrendingUp, Save, Download, Upload } from 'lucide-react';
import { calculateResults } from './utils/calculations';
import AssumptionsSheet from './components/sheets/AssumptionsSheet';
import REFinancingSheet from './components/sheets/REFinancingSheet';

// Context for managing tooltip state globally
const TooltipContext = createContext();

// Tooltip Provider to ensure only one tooltip is open at a time
const TooltipProvider = ({ children }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  const openTooltip = (id, data) => {
    setActiveTooltip(id);
    setTooltipData(data);
  };

  const closeTooltip = () => {
    setActiveTooltip(null);
    setTooltipData(null);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is not on a tooltip or tooltip trigger
      if (!e.target.closest('.cursor-help') && !e.target.closest('.z-50')) {
        closeTooltip();
      }
    };

    if (activeTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeTooltip]);

  return (
    <TooltipContext.Provider value={{ activeTooltip, tooltipData, openTooltip, closeTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
};




const ExcelLikeBankPlan = () => {
  const [activeSheet, setActiveSheet] = useState('reFinancing');
  const [editMode, setEditMode] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

  // Default assumptions
  const defaultAssumptions = {
    initialEquity: 200, taxRate: 28, costOfFundsRate: 3.0,
    avgCostPerFte: 100, 
    backOfficeCostsY1: 2, adminCostsY1: 1.5,
    marketingCostsY1: 1, hqAllocationY1: 2.5, itCostsY1: 4, costGrowthRate: 10, otherCostsY1: 0.5,
    provisionsY1: 0.2, commissionExpenseRate: 0.0,
    fundingMix: {
        sightDeposits: 40,
        termDeposits: 40,
        groupFunding: 20,
    },
    realEstateDivision: {
        fteY1: 100,
        fteY5: 150,
        frontOfficeRatio: 70, // % of FTE in front office
    },
    products: {
      reNoGaranzia: {
        name: 'Senza Garanzia Pubblica',
        volumes: { y1: 100, y10: 1300 },
        tasso: 8.5, rwaDensity: 100, durata: 3, commissionRate: 1.0,
        dangerRate: 5.0, ltv: 75.0, recoveryCosts: 15.0, collateralHaircut: 30.0,
        quarterlyDist: [25, 25, 25, 25], type: 'bullet'
      },
      reConGaranzia: {
        name: 'Con Garanzia Pubblica',
        volumes: { y1: 50, y10: 1100 },
        tasso: 6.5, rwaDensity: 20, durata: 5, commissionRate: 0.5,
        dangerRate: 1.5, ltv: 80.0, recoveryCosts: 10.0, collateralHaircut: 20.0,
        quarterlyDist: [25, 25, 25, 25], type: 'amortizing'
      }
    }
  };

  // Load saved data from localStorage or use defaults
  const loadSavedData = () => {
    const saved = localStorage.getItem('bankPlanAssumptions');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Check if the saved data has the expected structure for single Real Estate Division
        if (!parsedData.products || !parsedData.realEstateDivision || parsedData.divisions) {
          console.warn('Saved data structure is incompatible with current version, using defaults');
          localStorage.removeItem('bankPlanAssumptions'); // Clear incompatible data
          return defaultAssumptions;
        }
        return parsedData;
      } catch (e) {
        console.error('Error loading saved data:', e);
        localStorage.removeItem('bankPlanAssumptions'); // Clear corrupted data
        return defaultAssumptions;
      }
    }
    return defaultAssumptions;
  };

  // Initialize state with saved data
  const [assumptions, setAssumptions] = useState(loadSavedData);

  // Auto-save to localStorage whenever assumptions change
  useEffect(() => {
    localStorage.setItem('bankPlanAssumptions', JSON.stringify(assumptions));
    setLastSaved(new Date());
  }, [assumptions]);

  // Export data as JSON file
  const exportData = () => {
    const dataStr = JSON.stringify(assumptions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `piano_industriale_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import data from JSON file
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setAssumptions(imported);
          alert('Dati importati con successo!');
        } catch (error) {
          alert('Errore nell\'importazione del file. Assicurati che sia un file JSON valido.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Sheet definitions
  const sheets = {
    assumptions: { name: 'Assumptions', icon: Settings },
    reFinancing: { name: 'RE Division Details', icon: TrendingUp }
  };


  const results = calculateResults(assumptions);

  


  const renderCurrentSheet = () => {
    switch (activeSheet) {
      case 'assumptions': return <AssumptionsSheet assumptions={assumptions} setAssumptions={setAssumptions} editMode={editMode} />;
      case 'reFinancing': return <REFinancingSheet assumptions={assumptions} results={results} />;
      default: return <div>Sheet non trovato</div>;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-200 font-sans">
        <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Interactive Business Plan</h1>
              <p className="text-xs text-gray-600">New Bank S.p.A. | Financial Model</p>
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  <Save className="w-3 h-3 inline mr-1" />
                  Saved: {lastSaved.toLocaleTimeString('it-IT')}
                </span>
              )}
              <button onClick={() => setEditMode(!editMode)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm transition-colors ${editMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                {editMode ? 'Lock Editing' : 'Enable Editing'}
              </button>
              <button onClick={exportData} className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Import
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-b">
            {Object.entries(sheets).map(([key, sheet]) => {
              const Icon = sheet.icon;
              const isActive = activeSheet === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSheet(key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{sheet.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderCurrentSheet()}
      </main>
    </div>
    </TooltipProvider>
  );
};

export default ExcelLikeBankPlan;