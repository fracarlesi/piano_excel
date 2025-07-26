import React from 'react';
import { Settings, TrendingUp } from 'lucide-react';

const Navigation = ({ activeSheet, setActiveSheet }) => {
  const sheets = {
    assumptions: { name: 'Assumptions', icon: Settings },
    reFinancing: { name: 'RE Division Details', icon: TrendingUp },
    smeFinancing: { name: 'SME Division Details', icon: TrendingUp }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex border-b">
        {Object.entries(sheets).map(([key, sheet]) => {
          const Icon = sheet.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveSheet(key)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeSheet === key
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {sheet.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;