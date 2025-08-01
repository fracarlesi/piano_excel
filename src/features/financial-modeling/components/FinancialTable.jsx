import React, { useState } from 'react';
import { CalculationTooltip } from '../../../components/tooltip-system';
import { formatNumber } from '../../../components/shared/formatters';

// Financial Table Component with expandable rows (Quarterly View Only)
const FinancialTable = ({ title, rows }) => {
  // State to track which rows are expanded - initialize with all rows that have subRows
  const initialExpandedRows = new Set();
  rows.forEach((row, index) => {
    if (row.subRows && row.subRows.length > 0) {
      initialExpandedRows.add(index);
    }
  });
  const [expandedRows, setExpandedRows] = useState(initialExpandedRows);

  // Toggle row expansion
  const toggleRow = (rowIndex) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  // Process rows to include sub-rows when expanded
  const processedRows = [];
  rows.forEach((row, index) => {
    processedRows.push({ ...row, originalIndex: index });
    
    // If row is expanded and has subRows, add them
    if (expandedRows.has(index) && row.subRows && row.subRows.length > 0) {
      row.subRows.forEach((subRow, subIndex) => {
        processedRows.push({
          ...subRow,
          isSubItem: true,
          parentIndex: index,
          subIndex: subIndex
        });
      });
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
            const isExpanded = row.originalIndex !== undefined && expandedRows.has(row.originalIndex);
            
            return (
              <tr 
                key={row.originalIndex !== undefined ? `main-${row.originalIndex}` : `sub-${row.parentIndex}-${row.subIndex}`} 
                className={`
                  ${row.isTotal ? 'bg-blue-200 font-bold border-t-2 border-b-2 border-blue-300' : ''}
                  ${row.isSubTotal ? 'bg-blue-100 font-semibold border-t border-b border-blue-200' : ''}
                  ${row.isHeader ? 'bg-gray-100 font-semibold border-t border-gray-300' : ''}
                  ${!row.isTotal && !row.isSubTotal && !row.isHeader ? 'hover:bg-gray-50' : ''}
                  transition-colors duration-150
                `}
              >
                <td 
                  className={`py-2 text-gray-800 ${
                    row.isSubItem ? 'pl-12 pr-6 text-xs italic' : 'pl-6 pr-6'
                  } ${
                    row.isTotal ? 'text-blue-900 font-bold' : ''
                  } ${
                    row.isSubTotal ? 'text-blue-800 font-semibold' : ''
                  } ${
                    row.isHeader ? 'text-gray-800 font-semibold' : ''
                  } ${
                    row.isSubItem ? 'text-gray-600' : ''
                  }`}
                >
                  <div className="flex items-center">
                    {/* Expansion icon for rows with subRows */}
                    {hasSubRows && !row.isSubItem && (
                      <button
                        onClick={() => toggleRow(row.originalIndex)}
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
                    {/* Indent for sub-items without expansion button */}
                    {row.isSubItem && (
                      <span className="inline-block w-6 mr-2 text-gray-400">-</span>
                    )}
                    {/* Add space for alignment when no icon */}
                    {!hasSubRows && !row.isSubItem && (
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