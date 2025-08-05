import React, { useState } from 'react';
import { formatNumber } from '../../../lib/utils';

// Financial Table Component with expandable rows (Quarterly View Only)
const FinancialTable = ({ title, rows }) => {
  // State to track which rows are expanded - use a string key for nested rows
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Initialize with all rows collapsed by default, except those marked as isCollapsedByDefault
  React.useEffect(() => {
    const initialExpandedKeys = new Set();
    
    // Process rows to check for isCollapsedByDefault flag
    const processRowsForInitialState = (rows, parentKey = '') => {
      rows.forEach((row, index) => {
        const key = parentKey ? `${parentKey}-${index}` : `${index}`;
        
        // If row has subRows and is NOT marked as collapsed by default, keep it collapsed
        // If row has isCollapsedByDefault = true, it stays collapsed
        // All other rows start collapsed
        if (row.subRows && row.subRows.length > 0 && row.isCollapsedByDefault !== true) {
          // Don't add to expanded set - keep collapsed
        }
        
        // Recursively process subRows
        if (row.subRows) {
          processRowsForInitialState(row.subRows, key);
        }
      });
    };
    
    processRowsForInitialState(rows);
    setExpandedRows(initialExpandedKeys);
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
  
  const processRowsRecursive = (rows, level = 0, parentKey = '', parentIsLast = false, ancestorLevels = []) => {
    rows.forEach((row, index) => {
      const rowKey = parentKey ? `${parentKey}-${index}` : `${index}`;
      const isLastInGroup = index === rows.length - 1;
      
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
      
      // Build the ancestor information for tree lines
      const newAncestorLevels = [...ancestorLevels];
      if (level > 0) {
        newAncestorLevels[level - 1] = !isLastInGroup;
      }
      
      processedRows.push({ 
        ...row, 
        data: rowData,
        rowKey,
        level,
        isSubItem: level > 0,
        isLastInGroup: isLastInGroup,
        parentIsLast: parentIsLast,
        ancestorLevels: newAncestorLevels,
        actualLevel: level
      });
      
      // If row is expanded and has subRows, process them recursively
      if (expandedRows.has(rowKey) && row.subRows && row.subRows.length > 0) {
        processRowsRecursive(row.subRows, level + 1, rowKey, isLastInGroup, newAncestorLevels);
      }
    });
  };
  
  processRowsRecursive(rows);
  
  // Post-process rows that need to sum from specific other rows
  processedRows.forEach((row, index) => {
    if (row.sumFromRows) {
      const sumFromLabels = row.sumFromRows;
      const newData = new Array(40).fill(0);
      
      // Special handling for PBT calculation
      if (row.label === 'PBT' && row.sumOperation === 'custom') {
        // PBT = Total Revenues - LLPs - Total OPEX
        const totalRevenues = processedRows.find(r => r.label === 'Total Revenues');
        const llps = processedRows.find(r => r.label === 'LLPs');
        const totalOpex = processedRows.find(r => r.label === 'Total OPEX');
        
        if (totalRevenues?.data && llps?.data && totalOpex?.data) {
          for (let i = 0; i < 40; i++) {
            newData[i] = (totalRevenues.data[i] || 0) + (llps.data[i] || 0) + (totalOpex.data[i] || 0);
          }
        }
      } else {
        // Standard sum operation
        processedRows.forEach(otherRow => {
          if (sumFromLabels.includes(otherRow.label)) {
            if (otherRow.data && Array.isArray(otherRow.data)) {
              otherRow.data.forEach((value, i) => {
                newData[i] += value || 0;
              });
            }
          }
        });
      }
      
      // Update the row's data
      processedRows[index] = {
        ...row,
        data: newData
      };
    }
  });

  return (
  <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div className="bg-gray-800 dark:bg-gray-900 text-white px-6 py-3 border-b border-gray-700 dark:border-gray-600">
      <h3 className="text-lg font-semibold">{title} (€M)</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-2/5">Item</th>
            <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 border-r-2 border-gray-400 dark:border-gray-500">
              Total 10Y
            </th>
            {Array.from({ length: 40 }, (_, i) => {
              const year = Math.floor(i / 4) + 1;
              const quarter = (i % 4) + 1;
              return (
                <th key={i} className="px-2 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 text-xs">
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
                  ${row.isTotal ? 'font-bold bg-gray-100 dark:bg-gray-700' : ''}
                  ${row.isSubTotal ? 'font-semibold bg-gray-50 dark:bg-gray-800' : ''}
                  ${row.isSecondarySubTotal ? 'font-medium' : ''}
                  ${row.isHeader ? 'font-medium' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150
                `}
              >
                <td 
                  className={`py-3 pr-6 ${
                    // Padding based on actual hierarchy level
                    row.actualLevel === 0 ? 'pl-6' : 
                    row.actualLevel === 1 ? 'pl-8' : 
                    row.actualLevel === 2 ? 'pl-12' : 
                    row.actualLevel === 3 ? 'pl-16' :
                    row.actualLevel === 4 ? 'pl-20' :
                    'pl-24'
                  } ${
                    // Text size based on visualization level
                    row.visualizationLevel === 1 ? 'text-base font-bold' :
                    row.visualizationLevel === 2 ? 'text-sm font-semibold' :
                    row.visualizationLevel === 3 ? 'text-sm' :
                    row.visualizationLevel === 4 ? 'text-xs font-medium' :
                    row.visualizationLevel === 5 ? 'text-xs' :
                    'text-xs'
                  } text-gray-800 dark:text-gray-200`}
                >
                  <div className="flex items-center">
                    {/* For level 0: show expansion button or spacer */}
                    {row.actualLevel === 0 && (
                      <>
                        {hasSubRows ? (
                          <button
                            onClick={() => toggleRow(row.rowKey)}
                            className="mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
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
                        ) : (
                          <span className="inline-block w-6 mr-2"></span>
                        )}
                      </>
                    )}
                    
                    {/* For levels > 0: show tree lines with integrated expansion */}
                    {row.actualLevel > 0 && (
                      <span className="font-mono text-gray-400 dark:text-gray-500">
                        {/* Draw vertical lines for all ancestor levels */}
                        {row.ancestorLevels.map((hasMore, idx) => (
                          <span key={idx} className="text-gray-300 dark:text-gray-600">
                            {hasMore ? '│  ' : '   '}
                          </span>
                        ))}
                        {/* Draw the connector for this level */}
                        {hasSubRows ? (
                          <button
                            onClick={() => toggleRow(row.rowKey)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                          >
                            {expandedRows.has(row.rowKey) ? '▼ ' : '▶ '}
                          </button>
                        ) : (
                          row.isLastInGroup ? '└─ ' : '├─ '
                        )}
                      </span>
                    )}
                    {row.label}
                  </div>
                </td>
                {/* Total 10Y column */}
                <td 
                  className={`px-3 py-3 text-right bg-gray-50 dark:bg-gray-800 border-r-2 border-gray-300 dark:border-gray-600 ${
                    // Text size based on visualization level
                    row.visualizationLevel === 1 ? 'text-sm font-bold' :
                    row.visualizationLevel === 2 ? 'text-sm font-semibold' :
                    row.visualizationLevel === 3 ? 'text-xs' :
                    row.visualizationLevel === 4 ? 'text-xs font-medium' :
                    row.visualizationLevel === 5 ? 'text-xs' :
                    'text-xs'
                  } ${
                    // Color for negative values
                    row.data && row.data.reduce((sum, val) => sum + (val || 0), 0) < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {row.data ? formatNumber(row.data.reduce((sum, val) => sum + (val || 0), 0), row.decimals, row.unit) : ''}
                </td>
              {row.data && row.data.map((value, i) => (
                <td 
                  key={i} 
                  className={`px-3 py-3 text-right ${
                    // Text size based on visualization level
                    row.visualizationLevel === 1 ? 'text-sm font-bold' :
                    row.visualizationLevel === 2 ? 'text-sm font-semibold' :
                    row.visualizationLevel === 3 ? 'text-xs' :
                    row.visualizationLevel === 4 ? 'text-xs font-medium' :
                    row.visualizationLevel === 5 ? 'text-xs' :
                    'text-xs'
                  } ${
                    // Color for negative values
                    typeof value === 'number' && value < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {formatNumber(value, row.decimals, row.unit)}
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