import React, { useState, useEffect } from 'react';
import { Tooltip } from '../../tooltip-system';

// A smarter input field that handles numeric formatting for better UX.
const EditableNumberField = ({ 
  label, 
  value, 
  onChange, 
  unit = "", 
  disabled, 
  isPercentage = false, 
  isInteger = false,
  tooltip,
  tooltipTitle,
  tooltipImpact,
  tooltipFormula,
  error = false
}) => {
  const [inputValue, setInputValue] = useState((value ?? 0).toString());
  const [isFocused, setIsFocused] = useState(false);

  const formatOptions = {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  };

  useEffect(() => {
    if (!isFocused) {
      setInputValue((value ?? 0).toLocaleString('it-IT', formatOptions));
    }
  }, [value, isFocused, formatOptions]);

  const handleFocus = () => {
    // console.log('EditableNumberField handleFocus - current value:', value, 'type:', typeof value);
    setIsFocused(true);
    setInputValue((value ?? 0).toString());
  };

  const handleBlur = () => {
    // console.log('EditableNumberField handleBlur - inputValue:', inputValue);
    setIsFocused(false);
    const cleanValue = inputValue.replace(/,/g, '.');
    const numericValue = parseFloat(cleanValue);
    // Use 0 only if the value is actually NaN, not if it's 0
    const finalValue = isNaN(numericValue) ? 0 : numericValue;
    // console.log('EditableNumberField handleBlur - sending:', finalValue, 'type:', typeof finalValue);
    onChange(finalValue);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
        <span>{label} {unit && <span className="text-gray-500">({unit})</span>}</span>
        {(tooltip || tooltipTitle) && (
          <Tooltip 
            id={`tooltip-${label.toLowerCase().replace(/\s+/g, '-')}`}
            title={tooltipTitle || label}
            description={tooltip}
            impact={tooltipImpact}
            formula={tooltipFormula}
          />
        )}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isFocused ? inputValue : (value ?? 0).toLocaleString('it-IT', formatOptions)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error 
              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          disabled={disabled}
        />
        {isPercentage && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
            %
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableNumberField;