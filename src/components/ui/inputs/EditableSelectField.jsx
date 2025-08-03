import React from 'react';

const EditableSelectField = ({ 
  label, 
  value, 
  onChange, 
  editMode = false, 
  options = []
}) => {
  if (!editMode) {
    // Find the selected option's label
    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : value;
    
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
        <div className="text-sm font-medium text-gray-900">
          {displayValue || '-'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EditableSelectField;