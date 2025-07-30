import React from 'react';
import { Save, Download, Upload } from 'lucide-react';
import { exportData } from '../../utils/formatters';

const Header = ({ 
  editMode, 
  setEditMode, 
  lastSaved, 
  hasUnsavedChanges,
  lastFileExport,
  isAutoSaving,
  assumptions, 
  importData,
  exportToFile 
}) => {
  const handleExport = () => {
    exportData(assumptions);
  };

  return (
    <div className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Interactive Business Plan</h1>
            <p className="text-xs text-gray-600">New Bank S.p.A. | Financial Model</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-saving status */}
            {isAutoSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-300 rounded-md">
                <span className="text-xs text-blue-800 font-medium">
                  💾 Auto-saving...
                </span>
              </div>
            )}
            
            {/* Show success status when no unsaved changes and not auto-saving */}
            {!hasUnsavedChanges && !isAutoSaving && lastFileExport && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-300 rounded-md">
                <span className="text-xs text-green-800 font-medium">
                  ✅ Auto-saved
                </span>
              </div>
            )}
            
            {lastSaved && (
              <span className="text-xs text-gray-500">
                <Save className="w-3 h-3 inline mr-1" />
                Cache: {lastSaved.toLocaleTimeString('it-IT')}
              </span>
            )}
            
            {lastFileExport && (
              <span className="text-xs text-green-600">
                💾 File: {lastFileExport.toLocaleTimeString('it-IT')}
              </span>
            )}
            <button 
              onClick={() => setEditMode(!editMode)} 
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm transition-colors ${
                editMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {editMode ? 'Lock Editing' : 'Enable Editing'}
            </button>
            <button 
              onClick={handleExport} 
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import
              <input 
                type="file" 
                accept=".json" 
                onChange={importData} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;