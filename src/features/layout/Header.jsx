import React from 'react';
import { Save } from 'lucide-react';

const Header = ({ 
  editMode, 
  setEditMode, 
  lastSaved, 
  hasUnsavedChanges,
  lastFileExport,
  isAutoSaving,
  version
}) => {

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Interactive Business Plan</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">New Bank S.p.A. | Financial Model</p>
            </div>
            <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-md">
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">v{version || '10.01'}</span>
            </div>
            {isDevelopment && (
              <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md">
                <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">🛠️ Local Dev Mode</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Real-time sync status */}
            {!isDevelopment && isAutoSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md">
                <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                  🔄 Syncing...
                </span>
              </div>
            )}
            
            {/* Show success status when synced */}
            {!isDevelopment && !hasUnsavedChanges && !isAutoSaving && lastSaved && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
                <span className="text-xs text-green-800 dark:text-green-300 font-medium">
                  ✅ Synced with Firebase
                </span>
              </div>
            )}
            
            {lastSaved && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                <Save className="w-3 h-3 inline mr-1" />
                Last sync: {new Date(lastSaved).toLocaleTimeString('it-IT')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;