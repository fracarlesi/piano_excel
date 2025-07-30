import React from 'react';
import CalculationTooltip from './CalculationTooltip';
import { formatNumber } from '../../utils/formatters';

// Financial Table Component for flat, indented layouts
const FinancialTable = ({ title, rows }) => (
  <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
    <div className="bg-gray-800 text-white px-6 py-3 border-b border-gray-700">
      <h3 className="text-lg font-semibold">{title} (€M)</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 w-2/5">Item</th>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(y => (
              <th key={y} className="px-4 py-3 text-right font-semibold text-gray-700">
                Year {y + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr 
              key={index} 
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
                  row.isSubItem ? 'pl-10 pr-6' : 'px-6'
                } ${
                  row.isTotal ? 'text-blue-900 font-bold' : ''
                } ${
                  row.isSubTotal ? 'text-blue-800 font-semibold' : ''
                } ${
                  row.isHeader ? 'text-gray-800 font-semibold' : ''
                } ${
                  row.isSubItem ? 'text-gray-600 text-sm' : ''
                }`}
              >
                {row.isSubItem ? `└─ ${row.label}` : row.label}
              </td>
              {row.data && row.data.map((value, i) => (
                <td 
                  key={i} 
                  className={`px-4 py-2 text-right ${
                    row.isTotal ? 'font-bold text-blue-900' : ''
                  } ${
                    row.isSubTotal ? 'font-semibold text-blue-800' : ''
                  } ${
                    row.isHeader ? 'font-semibold text-gray-800' : ''
                  } ${
                    row.isSubItem ? 'text-sm text-gray-600' : ''
                  } ${
                    !row.isTotal && !row.isSubTotal && !row.isHeader && !row.isSubItem ? 
                      (value < 0 ? 'text-red-600' : 'text-gray-900') : ''
                  }`}
                >
                  {row.formula && row.formula[i] ? (
                    <CalculationTooltip 
                      id={`${title}-${index}-${i}`}
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
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default FinancialTable;