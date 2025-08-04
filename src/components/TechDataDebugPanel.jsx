/**
 * Tech Data Debug Panel
 * 
 * Panel temporaneo per debuggare il flusso dei dati cloud services
 */

import React, { useState } from 'react';
import useAssumptionsStore from '../firebase/assumptionsStore';
import FirebaseDataDiagnostic from './FirebaseDataDiagnostic';

const TechDataDebugPanel = () => {
  const { assumptions, results } = useAssumptionsStore();
  const [showRawData, setShowRawData] = useState(false);
  const [showCalculationTrace, setShowCalculationTrace] = useState(false);

  // Extract relevant data
  const techDivision = assumptions.techDivision;
  const globalProducts = assumptions.products;
  const techPnLResults = results?.pnl?.details?.techPnLResults;

  // Get cloud services data from different sources
  const cloudFromTechDivision = techDivision?.products?.cloudServices;
  const cloudFromGlobal = globalProducts?.cloudServices;

  // Current calculations
  const currentQuarterCloudCost = techPnLResults?.quarterly?.[0]?.operatingCosts?.cloudServices;
  const currentQuarterCloudRevenue = techPnLResults?.quarterly?.[0]?.internalAllocationRevenue?.totalAllocationRevenue;

  return (
    <div className="space-y-6">
      {/* Main Status */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🔧 Tech Division Data Debug Panel
        </h2>
        
        {/* Quick Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">Cloud Services Q1 Cost</div>
            <div className="text-lg font-bold text-blue-800">
              {currentQuarterCloudCost || 'N/A'}M
            </div>
            <div className="text-xs text-blue-600">
              {currentQuarterCloudCost === 2 ? '⚠️ Using default' : 
               currentQuarterCloudCost === 4 ? '✅ Using user input' : 
               '❓ Unknown source'}
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600">Cloud Services Q1 Revenue</div>
            <div className="text-lg font-bold text-green-800">
              {currentQuarterCloudRevenue ? currentQuarterCloudRevenue.toFixed(2) : 'N/A'}M
            </div>
            <div className="text-xs text-green-600">
              With markup and allocation
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600">Expected Annual</div>
            <div className="text-lg font-bold text-purple-800">
              16M cost → 16.8M revenue
            </div>
            <div className="text-xs text-purple-600">
              With 5% markup
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Status</div>
            <div className="font-bold">
              {currentQuarterCloudCost === 4 ? (
                <span className="text-green-600">✅ Working</span>
              ) : (
                <span className="text-red-600">❌ Issue</span>
              )}
            </div>
          </div>
        </div>

        {/* Data Sources Comparison */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">📊 Data Sources Comparison:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tech Division Data */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">
                techDivision.products.cloudServices
              </h4>
              {cloudFromTechDivision ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">costArray:</span> [{cloudFromTechDivision.costArray?.slice(0, 3).join(', ')}...]
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">First year:</span> {cloudFromTechDivision.costArray?.[0] || 'N/A'}M
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Markup:</span> {cloudFromTechDivision.markupPercentage || 'N/A'}%
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    cloudFromTechDivision.costArray?.[0] === 16 ? 'bg-green-100 text-green-800' : 
                    cloudFromTechDivision.costArray?.[0] === 8 ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cloudFromTechDivision.costArray?.[0] === 16 ? '✅ User modified (16M)' : 
                     cloudFromTechDivision.costArray?.[0] === 8 ? '⚠️ Default value (8M)' : 
                     '❓ Unknown value'}
                  </div>
                </div>
              ) : (
                <div className="text-red-600 text-sm">❌ Not found</div>
              )}
            </div>

            {/* Global Products Data */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">
                products.cloudServices (Global)
              </h4>
              {cloudFromGlobal ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">costArray:</span> [{cloudFromGlobal.costArray?.slice(0, 3).join(', ')}...]
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">First year:</span> {cloudFromGlobal.costArray?.[0] || 'N/A'}M
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Markup:</span> {cloudFromGlobal.markupPercentage || 'N/A'}%
                  </div>
                  <div className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                    ⚠️ Legacy structure (should be moved to techDivision)
                  </div>
                </div>
              ) : (
                <div className="text-green-600 text-sm">✅ Not found (correct for new structure)</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-6">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {showRawData ? '📤 Hide Raw Data' : '📥 Show Raw Data'}
          </button>
          
          <button
            onClick={() => setShowCalculationTrace(!showCalculationTrace)}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showCalculationTrace ? '📤 Hide Calculation Trace' : '📥 Show Calculation Trace'}
          </button>
        </div>

        {/* Raw Data */}
        {showRawData && (
          <div className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs overflow-auto">
            <h4 className="text-white mb-2">Raw Assumptions Data:</h4>
            <pre>{JSON.stringify({
              techDivision: techDivision,
              globalProducts: Object.keys(globalProducts || {}),
              cloudFromTechDivision,
              cloudFromGlobal
            }, null, 2)}</pre>
          </div>
        )}

        {/* Calculation Trace */}
        {showCalculationTrace && techPnLResults?.quarterly?.[0] && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Q1 Calculation Results:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Operating Costs:</div>
                <ul className="space-y-1 text-blue-700">
                  <li>Cloud Services: {techPnLResults.quarterly[0].operatingCosts?.cloudServices}M</li>
                  <li>Maintenance: {techPnLResults.quarterly[0].operatingCosts?.maintenanceSupport}M</li>
                  <li>Software OPEX: {techPnLResults.quarterly[0].operatingCosts?.softwareLicensesOpex}M</li>
                  <li>Total: {techPnLResults.quarterly[0].operatingCosts?.totalOperatingCosts}M</li>
                </ul>
              </div>
              <div>
                <div className="font-medium">Allocation Revenue:</div>
                <ul className="space-y-1 text-blue-700">
                  <li>Total Allocation: {techPnLResults.quarterly[0].internalAllocationRevenue?.totalAllocationRevenue?.toFixed(2)}M</li>
                  <li>Markup Revenue: {techPnLResults.quarterly[0].internalAllocationRevenue?.totalMarkupRevenue?.toFixed(2)}M</li>
                  <li>Total Operating: {techPnLResults.quarterly[0].totalOperatingRevenue?.toFixed(2)}M</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Firebase Diagnostic Component */}
      <FirebaseDataDiagnostic />

      {/* Instructions */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">🎯 Come risolvere il problema:</h4>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Usa il "Firebase Data Diagnostic" sopra per identificare problemi</li>
          <li>2. Clicca "Auto-fix Issues" se vengono trovati problemi</li>
          <li>3. Verifica che "Cloud Services Q1 Cost" mostri 4M invece di 2M</li>
          <li>4. Controlla che i tuoi 16M siano salvati correttamente in techDivision.products.cloudServices</li>
          <li>5. Rimuovi questo pannello quando tutto funziona</li>
        </ol>
      </div>
    </div>
  );
};

export default TechDataDebugPanel;