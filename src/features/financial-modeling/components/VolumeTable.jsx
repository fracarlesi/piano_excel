import React from 'react';
import EditableNumberField from './EditableNumberField';

/**
 * Volume Table Component for yearly volume input
 * Allows direct input of new business volumes for each year
 */
const VolumeTable = ({ 
  volumes, 
  onChange, 
  productName, 
  disabled = false,
  unit = '€M' 
}) => {
  
  // Handle volume change for specific year
  const handleVolumeChange = (year, value) => {
    const updatedVolumes = { ...volumes };
    updatedVolumes[`y${year}`] = value;
    onChange(updatedVolumes);
  };

  // Get volume for specific year, with fallback to linear interpolation
  const getVolumeForYear = (year) => {
    // Direct value if exists
    if (volumes[`y${year}`] !== undefined) {
      return volumes[`y${year}`];
    }
    
    // Fallback to linear interpolation between y1 and y10
    if (volumes.y1 !== undefined && volumes.y10 !== undefined) {
      const growth = (volumes.y10 - volumes.y1) / 9;
      return volumes.y1 + (growth * (year - 1));
    }
    
    return 0;
  };

  // Calculate total volumes
  const totalVolumes = Array.from({ length: 10 }, (_, i) => getVolumeForYear(i + 1))
    .reduce((sum, vol) => sum + vol, 0);

  // Calculate average yearly volume
  const avgVolume = totalVolumes / 10;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-700">
          📊 New Business Volumes - {productName}
        </h4>
        <div className="text-xs text-gray-500">
          Total: {totalVolumes.toFixed(1)} {unit} | Avg: {avgVolume.toFixed(1)} {unit}/year
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-2 mb-3">
        {Array.from({ length: 10 }, (_, i) => {
          const year = i + 1;
          return (
            <div key={year} className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">
                Year {year}
              </div>
              <EditableNumberField
                label=""
                value={getVolumeForYear(year)}
                onChange={(value) => handleVolumeChange(year, value)}
                unit={unit}
                disabled={disabled}
                decimals={1}
              />
            </div>
          );
        })}
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => {
            // Linear growth from current y1 to y10
            const y1 = getVolumeForYear(1);
            const y10 = getVolumeForYear(10);
            const growth = (y10 - y1) / 9;
            
            const linearVolumes = {};
            for (let year = 1; year <= 10; year++) {
              linearVolumes[`y${year}`] = y1 + (growth * (year - 1));
            }
            onChange(linearVolumes);
          }}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Linear Growth
        </button>
        
        <button
          onClick={() => {
            // Constant volumes (same as year 1)
            const y1Value = getVolumeForYear(1);
            const constantVolumes = {};
            for (let year = 1; year <= 10; year++) {
              constantVolumes[`y${year}`] = y1Value;
            }
            onChange(constantVolumes);
          }}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Constant
        </button>
        
        <button
          onClick={() => {
            // S-curve: slow start, fast middle, slow end
            const y1 = getVolumeForYear(1);
            const y10 = getVolumeForYear(10);
            
            const sCurveVolumes = {};
            for (let year = 1; year <= 10; year++) {
              const t = (year - 1) / 9; // 0 to 1
              const sCurve = t * t * (3 - 2 * t); // S-curve formula
              sCurveVolumes[`y${year}`] = y1 + (y10 - y1) * sCurve;
            }
            onChange(sCurveVolumes);
          }}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          S-Curve
        </button>

        <button
          onClick={() => {
            // Reset to original y1, y10 only
            onChange({ y1: volumes.y1 || 0, y10: volumes.y10 || 0 });
          }}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset to Y1/Y10
        </button>
      </div>

      {/* Mini chart visualization */}
      <div className="mt-3 h-16 bg-white dark:bg-gray-800 rounded border relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-between px-1 pb-1">
          {Array.from({ length: 10 }, (_, i) => {
            const year = i + 1;
            const volume = getVolumeForYear(year);
            const maxVolume = Math.max(...Array.from({ length: 10 }, (_, j) => getVolumeForYear(j + 1)));
            const height = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;
            
            return (
              <div
                key={year}
                className="flex-1 bg-blue-200 mx-px rounded-t"
                style={{ height: `${height}%` }}
                title={`Year ${year}: ${volume.toFixed(1)} ${unit}`}
              />
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-1">
          <span>Y1</span>
          <span>Y5</span>
          <span>Y10</span>
        </div>
      </div>
    </div>
  );
};

export default VolumeTable;