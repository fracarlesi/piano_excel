import React, { useMemo } from 'react';

/**
 * Customer Acquisition Grid Component
 * Allows editing of customer acquisition over 10 years with CAC and churn calculations
 */
const CustomerAcquisitionGrid = ({ 
  values = [], 
  onChange,
  cac = 30,
  churnRate = 5,
  onCacChange,
  onChurnChange,
  editMode = true
}) => {
  const years = Array.from({ length: 10 }, (_, i) => `Y${i + 1}`);
  
  // Calculate cumulative customers considering churn
  const cumulativeCustomers = useMemo(() => {
    let cumulative = [];
    let totalCustomers = 0;
    
    for (let i = 0; i < 10; i++) {
      // Apply churn on existing customers
      totalCustomers = totalCustomers * (1 - churnRate / 100);
      // Add new customers
      totalCustomers += values[i] || 0;
      cumulative.push(Math.round(totalCustomers));
    }
    
    return cumulative;
  }, [values, churnRate]);
  
  // Handle value change
  const handleValueChange = (index, value) => {
    const newValues = [...values];
    newValues[index] = Math.max(0, parseInt(value) || 0);
    onChange(newValues);
  };
  
  // Handle Excel paste
  const handlePaste = (e, startIndex) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const parsedValues = pastedData
      .split(/[\t\n,]/)
      .map(val => parseInt(val.replace(/[^\d]/g, '')) || 0);
    
    const newValues = [...values];
    parsedValues.forEach((value, i) => {
      if (startIndex + i < 10) {
        newValues[startIndex + i] = value;
      }
    });
    
    onChange(newValues);
  };
  
  return (
    <div className="space-y-4">
      {/* Global Parameters */}
      {editMode && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded">
          <div>
            <label className="text-sm font-medium text-gray-700">
              CAC - Customer Acquisition Cost (€)
            </label>
            <input
              type="text"
              value={cac}
              onChange={(e) => onCacChange && onCacChange(Number(e.target.value))}
              className="w-full mt-1 px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500"
              title="Costo medio per acquisire un nuovo cliente"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Churn Rate Annuale (%)
            </label>
            <input
              type="text"
              value={churnRate}
              onChange={(e) => onChurnChange && onChurnChange(Number(e.target.value))}
              className="w-full mt-1 px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500"
              title="Percentuale di clienti che abbandonano ogni anno"
            />
          </div>
        </div>
      )}
      
      {/* Customer Acquisition Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border px-3 py-2 text-left font-medium">Metrica</th>
              {years.map(year => (
                <th key={year} className="border px-3 py-2 text-center font-medium">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* New Customers Row */}
            <tr>
              <td className="border px-3 py-2 font-medium bg-gray-50 dark:bg-gray-800">
                Nuovi Clienti
              </td>
              {values.map((value, index) => (
                <td key={index} className="border p-1">
                  {editMode ? (
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      onPaste={(e) => handlePaste(e, index)}
                      className="w-full px-2 py-1 text-center focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  ) : (
                    <div className="px-2 py-1 text-center">
                      {(value || 0).toLocaleString()}
                    </div>
                  )}
                </td>
              ))}
            </tr>
            
            {/* Total Customers Row (calculated) */}
            <tr className="bg-gray-50 dark:bg-gray-800">
              <td className="border px-3 py-2 font-medium">
                Clienti Totali
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(dopo churn {churnRate}%)</span>
              </td>
              {cumulativeCustomers.map((value, index) => (
                <td key={index} className="border px-3 py-2 text-center font-medium">
                  {value.toLocaleString()}
                </td>
              ))}
            </tr>
            
            {/* CAC Cost Row (calculated) */}
            <tr className="bg-yellow-50">
              <td className="border px-3 py-2 font-medium">
                Costo CAC (€M)
              </td>
              {values.map((value, index) => (
                <td key={index} className="border px-3 py-2 text-center">
                  {((value * cac) / 1000000).toFixed(2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Helper text */}
      <div className="text-xs text-gray-600 italic">
        💡 Tip: Puoi incollare dati da Excel direttamente nelle celle. I clienti totali sono calcolati considerando il churn rate del {churnRate}% annuo.
      </div>
    </div>
  );
};

export default CustomerAcquisitionGrid;