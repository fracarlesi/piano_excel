import React from 'react';
import { Settings, TrendingUp, Sliders, Building, Wallet } from 'lucide-react';

const Navigation = ({ activeSheet, setActiveSheet }) => {
  // Divisioni business con vista finanziaria e assumptions
  const businessDivisions = [
    // Credit divisions first
    {
      key: 'reFinancing',
      name: 'Real Estate',
      shortName: 'RE',
      icon: TrendingUp,
      assumptionKey: 'reAssumptions'
    },
    {
      key: 'smeFinancing',
      name: 'PMI in Difficoltà',
      shortName: 'SME',
      icon: TrendingUp,
      assumptionKey: 'smeAssumptions'
    },
    {
      key: 'incentiveFinance',
      name: 'Finanza Agevolata',
      shortName: 'Incentive',
      icon: TrendingUp,
      assumptionKey: 'incentiveAssumptions'
    },
    // Digital divisions
    {
      key: 'digitalBankingFinancing',
      name: 'Digital Banking',
      shortName: 'Digital',
      icon: TrendingUp,
      assumptionKey: 'digitalAssumptions'
    },
    {
      key: 'wealthManagement',
      name: 'Wealth Management',
      shortName: 'Wealth',
      icon: TrendingUp,
      assumptionKey: 'wealthAssumptions'
    },
    {
      key: 'techPlatform',
      name: 'Tech Platform',
      shortName: 'Tech',
      icon: TrendingUp,
      assumptionKey: 'techAssumptions'
    }
  ];
  
  // Divisioni strutturali con vista finanziaria e assumptions
  const structuralDivisions = [
    {
      key: 'centralFunctions',
      name: 'Central Functions',
      shortName: 'Central',
      icon: Building,
      assumptionKey: 'centralAssumptions'
    },
    {
      key: 'treasury',
      name: 'Treasury / ALM',
      shortName: 'Treasury',
      icon: Wallet,
      assumptionKey: 'treasuryAssumptions'
    }
  ];

  const allDivisions = [...businessDivisions, ...structuralDivisions];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Griglia unica con tutto integrato */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Model Navigation</h3>
        </div>
        
        {/* Riga superiore - Bank Consolidated + Divisioni Financial */}
        <div className="grid grid-cols-9 gap-0">
          {/* Bank Consolidated View */}
          <button
            onClick={() => setActiveSheet('bankConsolidated')}
            className={`flex flex-col items-center gap-1 px-3 py-4 border-r border-gray-200 dark:border-gray-700 text-xs font-medium transition-colors ${
              activeSheet === 'bankConsolidated'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-center leading-tight">Bank</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Consolidated</span>
          </button>

          {/* Tutte le Divisioni Financial */}
          {allDivisions.map((division) => {
            const Icon = division.icon;
            return (
              <button
                key={division.key}
                onClick={() => setActiveSheet(division.key)}
                className={`flex flex-col items-center gap-1 px-3 py-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-xs font-medium transition-colors ${
                  activeSheet === division.key
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-center leading-tight">{division.shortName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Financial</span>
              </button>
            );
          })}
        </div>

        {/* Riga inferiore - General Settings + Assumptions divisioni business */}
        <div className="grid grid-cols-9 gap-0 border-t border-gray-200 dark:border-gray-700">
          {/* General Settings sotto Bank Consolidated */}
          <button
            onClick={() => setActiveSheet('assumptions')}
            className={`flex flex-col items-center gap-1 px-3 py-4 border-r border-gray-200 dark:border-gray-700 text-xs font-medium transition-colors ${
              activeSheet === 'assumptions'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-center leading-tight">General</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Settings</span>
          </button>

          {/* Assumptions per tutte le divisioni */}
          {allDivisions.map((division) => {
            return (
              <button
                key={division.assumptionKey}
                onClick={() => setActiveSheet(division.assumptionKey)}
                className={`flex flex-col items-center gap-1 px-3 py-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-xs font-medium transition-colors ${
                  activeSheet === division.assumptionKey
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span className="text-center leading-tight">{division.shortName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Assumptions</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Navigation;