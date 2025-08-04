/**
 * Firebase Data Diagnostic Component
 * 
 * Component temporaneo per diagnosticare e fixare i problemi di dati Firebase
 */

import React, { useState } from 'react';
import { useFirebaseDataMigrator } from '../hooks/useFirebaseDataMigrator.js';

const FirebaseDataDiagnostic = () => {
  const {
    diagnosticStatus,
    migrationStatus,
    isRealTimeSyncActive,
    runDiagnostic,
    runMigration,
    autoFixIssues,
    setupRealTimeSync,
    hasIssues,
    isHealthy,
    needsMigration
  } = useFirebaseDataMigrator();

  const [showDetails, setShowDetails] = useState(false);
  const [autoFixResult, setAutoFixResult] = useState(null);

  const handleAutoFix = async () => {
    try {
      const result = await autoFixIssues();
      setAutoFixResult(result);
    } catch (error) {
      setAutoFixResult({ success: false, error: error.message });
    }
  };

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🔍 Firebase Data Diagnostic
        </h3>
        <div className="flex items-center gap-2">
          {isHealthy && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              ✅ Healthy
            </span>
          )}
          {hasIssues && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              ❌ Issues Found
            </span>
          )}
          {isRealTimeSyncActive && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              🔄 Real-time Sync
            </span>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Last Diagnostic</div>
          <div className="font-medium">
            {diagnosticStatus.lastRun 
              ? diagnosticStatus.lastRun.toLocaleTimeString()
              : 'Never'
            }
          </div>
          {diagnosticStatus.isRunning && (
            <div className="text-xs text-blue-600">Running...</div>
          )}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Issues Found</div>
          <div className="font-medium">
            {diagnosticStatus.issues.length}
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Last Migration</div>
          <div className="font-medium">
            {migrationStatus.lastRun 
              ? migrationStatus.lastRun.toLocaleTimeString()
              : 'Never'
            }
          </div>
        </div>
      </div>

      {/* Issues List */}
      {hasIssues && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-medium text-red-800 mb-2">
            🚨 Issues Detected:
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {diagnosticStatus.issues.map((issue, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Migration Changes */}
      {migrationStatus.changes.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="font-medium text-green-800 mb-2">
            ✅ Recent Changes:
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            {migrationStatus.changes.map((change, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Auto-fix Result */}
      {autoFixResult && (
        <div className={`mb-4 p-3 border rounded-lg ${
          autoFixResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`font-medium mb-2 ${
            autoFixResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {autoFixResult.success ? '✅ Auto-fix Successful' : '❌ Auto-fix Failed'}
          </div>
          {autoFixResult.error && (
            <div className="text-sm text-red-700">
              Error: {autoFixResult.error}
            </div>
          )}
          {autoFixResult.message && (
            <div className="text-sm text-green-700">
              {autoFixResult.message}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={runDiagnostic}
          disabled={diagnosticStatus.isRunning}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {diagnosticStatus.isRunning ? 'Running...' : '🔍 Run Diagnostic'}
        </button>

        {needsMigration && (
          <button
            onClick={runMigration}
            disabled={migrationStatus.isRunning}
            className="px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {migrationStatus.isRunning ? 'Migrating...' : '🔧 Run Migration'}
          </button>
        )}

        {hasIssues && (
          <button
            onClick={handleAutoFix}
            disabled={migrationStatus.isRunning}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            ✨ Auto-fix Issues
          </button>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          {showDetails ? '📤 Hide Details' : '📥 Show Details'}
        </button>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">💡 Como Funciona:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Diagnostic:</strong> Verifica la struttura dei dati Tech in Firebase</li>
              <li>• <strong>Migration:</strong> Corregge automaticamente problemi di struttura</li>
              <li>• <strong>Auto-fix:</strong> Esegue diagnostic + migration in sequenza</li>
              <li>• <strong>Real-time Sync:</strong> Monitora cambiamenti in tempo reale</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">🎯 Problemi Comuni Risolti:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>missing_tech_division:</strong> Crea la struttura techDivision</li>
              <li>• <strong>missing_tech_products:</strong> Aggiunge i prodotti Tech mancanti</li>
              <li>• <strong>using_default_cloud_costs:</strong> Verifica se i costi cloud sono personalizzati</li>
              <li>• <strong>duplicate_tech_products_in_global:</strong> Rimuove duplicati dalla struttura globale</li>
            </ul>
          </div>

          {diagnosticStatus.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">❌ Diagnostic Error:</h4>
              <p className="text-sm text-red-700">{diagnosticStatus.error}</p>
            </div>
          )}

          {migrationStatus.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">❌ Migration Error:</h4>
              <p className="text-sm text-red-700">{migrationStatus.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Fix for Cloud Services Issue */}
      {diagnosticStatus.issues.includes('using_default_cloud_costs') && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">
            ⚠️ Cloud Services usando valori di default
          </h4>
          <p className="text-sm text-yellow-700 mb-3">
            Il sistema sta usando 8M invece dei tuoi 16M. Questo causa la discrepanza 2M vs 4M trimestrali.
          </p>
          <button
            onClick={handleAutoFix}
            className="px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            🔧 Fix Cloud Services Data
          </button>
        </div>
      )}
    </div>
  );
};

export default FirebaseDataDiagnostic;