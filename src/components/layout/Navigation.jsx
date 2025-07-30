import React from 'react';
import { Settings, TrendingUp, Sliders } from 'lucide-react';

const Navigation = ({ activeSheet, setActiveSheet }) => {
  // Divisioni con vista finanziaria e assumptions
  const divisions = [
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
    },
    {
      key: 'subsidizedFinance',
      name: 'Finanza Agevolata',
      shortName: 'Subsidized',
      icon: TrendingUp,
      assumptionKey: 'subsidizedAssumptions'
    }
  ];


  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Griglia unica con tutto integrato */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Bank Navigation</h3>
        </div>
        
        {/* Riga superiore - Bank Consolidated + Divisioni Financial */}
        <div className="grid grid-cols-7 gap-0">
          {/* Bank Consolidated View */}
          <button
            onClick={() => setActiveSheet('bankConsolidated')}
            className={`flex flex-col items-center gap-1 px-3 py-4 border-r border-gray-200 text-xs font-medium transition-colors ${
              activeSheet === 'bankConsolidated'
                ? 'bg-purple-100 text-purple-700 border-purple-300'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-center leading-tight">Bank</span>
            <span className="text-xs text-gray-500">Consolidated</span>
          </button>

          {/* Divisioni Financial */}
          {divisions.map((division) => {
            const Icon = division.icon;
            return (
              <button
                key={division.key}
                onClick={() => setActiveSheet(division.key)}
                className={`flex flex-col items-center gap-1 px-3 py-4 border-r border-gray-200 last:border-r-0 text-xs font-medium transition-colors ${
                  activeSheet === division.key
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-center leading-tight">{division.shortName}</span>
                <span className="text-xs text-gray-500">Financial</span>
              </button>
            );
          })}
        </div>

        {/* Riga inferiore - General Settings + Assumptions divisioni */}
        <div className="grid grid-cols-7 gap-0 border-t border-gray-200">
          {/* General Settings sotto Bank Consolidated */}
          <button
            onClick={() => setActiveSheet('assumptions')}
            className={`flex flex-col items-center gap-1 px-3 py-4 border-r border-gray-200 text-xs font-medium transition-colors ${
              activeSheet === 'assumptions'
                ? 'bg-gray-100 text-gray-700 border-gray-300'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-center leading-tight">General</span>
            <span className="text-xs text-gray-500">Settings</span>
          </button>

          {/* Assumptions divisioni */}
          {divisions.map((division) => {
            return (
              <button
                key={division.assumptionKey}
                onClick={() => setActiveSheet(division.assumptionKey)}
                className={`flex flex-col items-center gap-1 px-3 py-4 border-r border-gray-200 last:border-r-0 text-xs font-medium transition-colors ${
                  activeSheet === division.assumptionKey
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span className="text-center leading-tight">{division.shortName}</span>
                <span className="text-xs text-gray-500">Assumptions</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Navigation;