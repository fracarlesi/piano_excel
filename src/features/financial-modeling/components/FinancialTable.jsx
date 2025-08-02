import React, { useState } from 'react';
import { CalculationTooltip } from '../../../components/tooltip-system';
import { formatNumber } from '../../../components/shared/formatters';

// Financial Table Component with expandable rows (Quarterly View Only)
const FinancialTable = ({ title, rows }) => {
  // State to track which rows are expanded - use a string key for nested rows
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Initialize with all rows expanded (including nested)
  React.useEffect(() => {
    const allExpandedKeys = new Set();
    
    // Helper to add all expandable rows recursively
    const addExpandableRows = (rows, prefix = '') => {
      rows.forEach((row, index) => {
        const key = prefix ? `${prefix}-${index}` : `${index}`;
        if (row.subRows && row.subRows.length > 0) {
          allExpandedKeys.add(key);
          // Recursively add nested subRows
          addExpandableRows(row.subRows, key);
        }
      });
    };
    
    addExpandableRows(rows);
    setExpandedRows(allExpandedKeys);
    
  }, [rows, title]);

  // Toggle row expansion
  const toggleRow = (rowKey) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  // Process rows to include sub-rows when expanded (recursive)
  const processedRows = [];
  
  const processRowsRecursive = (rows, level = 0, parentKey = '') => {
    rows.forEach((row, index) => {
      const rowKey = parentKey ? `${parentKey}-${index}` : `${index}`;
      
      // Calculate sum from subRows if they exist and row should auto-sum
      let rowData = row.data;
      
      // Auto-calculate sum if:
      // 1. Row has subRows AND either has no data, all zeros, or explicitly marked for auto-sum
      // 2. OR row has sumFromRows specified
      const shouldAutoSum = (row.subRows && 
                           row.subRows.length > 0 && 
                           (!rowData || rowData.every(v => v === 0) || row.autoSum)) ||
                          (row.sumFromRows && row.sumFromRows.length > 0);
      
      if (shouldAutoSum) {
        // Initialize sum array with zeros
        rowData = new Array(40).fill(0);
        
        if (row.sumFromRows && row.sumFromRows.length > 0) {
          // Sum from specific rows by label
          // This will be filled after all rows are processed
          rowData.sumFromRows = row.sumFromRows;
        } else {
          // Recursively calculate sum from all subRows
          const sumSubRows = (subRows) => {
            subRows.forEach(subRow => {
              if (subRow.data) {
                subRow.data.forEach((value, i) => {
                  rowData[i] += value || 0;
                });
              }
              // If subRow has its own subRows, sum those too
              if (subRow.subRows && subRow.subRows.length > 0) {
                sumSubRows(subRow.subRows);
              }
            });
          };
          
          sumSubRows(row.subRows);
        }
      }
      
      processedRows.push({ 
        ...row, 
        data: rowData,
        rowKey,
        level,
        isSubItem: level > 0
      });
      
      // If row is expanded and has subRows, process them recursively
      if (expandedRows.has(rowKey) && row.subRows && row.subRows.length > 0) {
        processRowsRecursive(row.subRows, level + 1, rowKey);
      }
    });
  };
  
  processRowsRecursive(rows);
  
  // Post-process rows that need to sum from specific other rows
  processedRows.forEach((row, index) => {
    if (row.data && row.data.sumFromRows) {
      const sumFromLabels = row.data.sumFromRows;
      const newData = new Array(40).fill(0);
      
      // Find all rows with matching labels and sum their data
      processedRows.forEach(otherRow => {
        if (sumFromLabels.includes(otherRow.label)) {
          if (otherRow.data && Array.isArray(otherRow.data)) {
            otherRow.data.forEach((value, i) => {
              newData[i] += value || 0;
            });
          }
        }
      });
      
      // Update the row's data
      processedRows[index] = {
        ...row,
        data: newData
      };
    }
  });

  return (
  <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
    <div className="bg-gray-800 text-white px-6 py-3 border-b border-gray-700">
      <h3 className="text-lg font-semibold">{title} (€M)</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 w-2/5">Item</th>
            {Array.from({ length: 40 }, (_, i) => {
              const year = Math.floor(i / 4) + 1;
              const quarter = (i % 4) + 1;
              return (
                <th key={i} className="px-2 py-3 text-right font-semibold text-gray-700 text-xs">
                  Y{year}Q{quarter}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {processedRows.map((row, displayIndex) => {
            const hasSubRows = row.subRows && row.subRows.length > 0;
            const isExpanded = expandedRows.has(row.rowKey);
            
            return (
              <tr 
                key={row.rowKey} 
                className={`
                  ${row.isTotal ? 'bg-blue-200 font-bold border-t-2 border-b-2 border-blue-300' : ''}
                  ${row.isSubTotal ? 'bg-blue-100 font-semibold border-t border-b border-blue-200' : ''}
                  ${row.isSecondarySubTotal ? 'bg-amber-50 font-medium border-t border-b border-amber-200' : ''}
                  ${row.isHeader ? 'bg-gray-100 font-semibold border-t border-gray-300' : ''}
                  ${!row.isTotal && !row.isSubTotal && !row.isSecondarySubTotal && !row.isHeader ? 'hover:bg-gray-50' : ''}
                  transition-colors duration-150
                `}
              >
                <td 
                  className={`py-2 text-gray-800 pr-6 ${
                    row.level === 0 ? 'pl-6' : 
                    row.level === 1 ? 'pl-12 text-xs' : 
                    row.level === 2 ? 'pl-16 text-xs italic' : 
                    'pl-20 text-xs italic'
                  } ${
                    row.isTotal ? 'text-blue-900 font-bold' : ''
                  } ${
                    row.isSubTotal ? 'text-blue-800 font-semibold' : ''
                  } ${
                    row.isSecondarySubTotal ? 'text-amber-800 font-medium' : ''
                  } ${
                    row.isHeader ? 'text-gray-800 font-semibold' : ''
                  } ${
                    row.isSubItem && !row.isSecondarySubTotal ? 'text-gray-600' : ''
                  }`}
                >
                  <div className="flex items-center">
                    {/* Expansion icon for rows with subRows */}
                    {hasSubRows && (
                      <button
                        onClick={() => toggleRow(row.rowKey)}
                        className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {isExpanded ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    )}
                    {/* Add space for alignment when no icon */}
                    {!hasSubRows && (
                      <span className="inline-block w-6 mr-2"></span>
                    )}
                    {row.label}
                  </div>
                </td>
              {row.data && row.data.map((value, i) => (
                <td 
                  key={i} 
                  className={`px-2 py-2 text-right text-xs ${
                    row.isTotal ? 'font-bold text-blue-900' : ''
                  } ${
                    row.isSubTotal ? 'font-semibold text-blue-800' : ''
                  } ${
                    row.isHeader ? 'font-semibold text-gray-800' : ''
                  } ${
                    row.isSubItem ? 'text-xs text-gray-600' : ''
                  } ${
                    !row.isTotal && !row.isSubTotal && !row.isHeader && !row.isSubItem ? 
                      'text-gray-900' : ''
                  }`}
                >
                  {row.formula && row.formula[i] ? (
                    <CalculationTooltip 
                      id={`${title}-${displayIndex}-${i}`}
                      formula={row.formula[i].formula} 
                      details={row.formula[i].details}
                      calculation={row.formula[i].calculation}
                      precedents={row.formula[i].precedents}
                      year={row.formula[i].year}
                    >
                      {formatNumber(value, row.decimals, row.unit)}
                    </CalculationTooltip>
                  ) : (
                    formatNumber(value, row.decimals, row.unit)
                  )}
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
  );
};

export default FinancialTable;