import React, { useState, useRef, useEffect } from 'react';

/**
 * Excel-like Volume Input Grid Component
 * Manages 10-year volume input with Excel paste functionality
 */
const VolumeInputGrid = ({ 
  values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
  onChange,
  label = "Volume Projections",
  unit = "€M",
  disabled = false 
}) => {
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputRefs = useRef([]);

  // Ensure values array has exactly 10 elements
  const normalizedValues = Array.from({ length: 10 }, (_, i) => values[i] || 0);

  useEffect(() => {
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, 10);
  }, []);

  const handleCellChange = (index, newValue) => {
    const updatedValues = [...normalizedValues];
    // Remove thousand separators before parsing
    const cleanValue = newValue.replace(/,/g, '');
    updatedValues[index] = parseFloat(cleanValue) || 0;
    onChange(updatedValues);
  };

  const handleKeyDown = (index, e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        const nextIndex = e.shiftKey 
          ? Math.max(0, index - 1)
          : Math.min(9, index + 1);
        inputRefs.current[nextIndex]?.focus();
        break;
      
      case 'ArrowRight':
        if (index < 9) {
          e.preventDefault();
          inputRefs.current[index + 1]?.focus();
        }
        break;
      
      case 'ArrowLeft':
        if (index > 0) {
          e.preventDefault();
          inputRefs.current[index - 1]?.focus();
        }
        break;
      
      case 'Enter':
        e.preventDefault();
        if (index < 9) {
          inputRefs.current[index + 1]?.focus();
        }
        break;
    }
  };

  const handlePaste = (index, e) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    if (!pastedData) return;

    // Split by tabs (Excel format) or spaces/commas
    const values = pastedData
      .split(/[\t\n,\s]+/)
      .map(val => val.trim())
      .filter(val => val !== '')
      .map(val => {
        const num = parseFloat(val.replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
      });

    if (values.length === 0) return;

    const updatedValues = [...normalizedValues];
    
    // Fill from current index onwards, respecting array bounds
    for (let i = 0; i < values.length && (index + i) < 10; i++) {
      updatedValues[index + i] = values[i];
    }

    onChange(updatedValues);

    // Focus the cell after the last pasted value
    const nextFocusIndex = Math.min(9, index + values.length);
    setTimeout(() => {
      inputRefs.current[nextFocusIndex]?.focus();
    }, 0);
  };

  const formatValue = (value) => {
    if (value === 0) return '';
    // Add thousand separators for customer units
    if (unit === 'customers' || unit === 'units') {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toString();
  };

  const calculateSum = () => {
    return normalizedValues.reduce((sum, val) => sum + val, 0);
  };

  const calculateAverage = () => {
    const sum = calculateSum();
    return sum / 10;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          {label} ({unit})
        </label>
        <div className="text-xs text-gray-500">
          Total: {unit === 'customers' || unit === 'units' 
            ? calculateSum().toLocaleString('en-US', { maximumFractionDigits: 0 })
            : calculateSum().toFixed(1)
          } {unit} | 
          Avg: {unit === 'customers' || unit === 'units'
            ? calculateAverage().toLocaleString('en-US', { maximumFractionDigits: 0 })
            : calculateAverage().toFixed(1)
          } {unit}/year
        </div>
      </div>

      {/* Year Headers */}
      <div className="grid grid-cols-10 gap-1 mb-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="text-xs font-medium text-gray-600 text-center px-1">
            Y{i + 1}
          </div>
        ))}
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-10 gap-1">
        {normalizedValues.map((value, index) => (
          <div key={index} className="relative">
            <input
              ref={el => inputRefs.current[index] = el}
              type="text"
              value={formatValue(value)}
              onChange={(e) => handleCellChange(index, e.target.value)}
              onFocus={(e) => {
                setFocusedIndex(index);
                e.target.select(); // Auto-select all content on focus
              }}
              onBlur={() => setFocusedIndex(null)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              disabled={disabled}
              className={`
                w-full px-2 py-1.5 text-sm text-center border rounded
                transition-colors duration-150
                ${focusedIndex === index 
                  ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${disabled 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : 'bg-white text-gray-900'
                }
                focus:outline-none
              `}
              placeholder="0"
            />
            
            {/* Year indicator on hover */}
            {focusedIndex === index && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 
                            bg-gray-800 text-white text-xs px-2 py-1 rounded 
                            pointer-events-none z-10">
                Year {index + 1}
              </div>
            )}
          </div>
        ))}
      </div>


      {/* Help Text */}
      <div className="text-xs text-gray-500 mt-2">
        💡 <strong>Excel Integration:</strong> Copy 10 values from Excel and paste into any cell. 
        Use Tab/Arrow keys to navigate between cells.
      </div>
    </div>
  );
};

export default VolumeInputGrid;