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
            {[0, 1, 2, 3, 4].map(y => (
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
              className={`${
                row.isTotal ? 'font-bold bg-cyan-100 border-cyan-200' : ''
              } ${
                row.isHeader ? 'font-semibold bg-cyan-50 border-cyan-100' : 'hover:bg-gray-50'
              }`}
            >
              <td 
                className="px-6 py-2 text-gray-800" 
                style={{ paddingLeft: row.indent ? '2.5rem' : '1.5rem' }}
              >
                {row.label}
              </td>
              {row.data && row.data.map((value, i) => (
                <td 
                  key={i} 
                  className={`px-4 py-2 text-right ${
                    value < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  {row.formula && row.formula[i] ? (
                    <CalculationTooltip 
                      id={`${title}-${index}-${i}`}
                      formula={row.formula[i].formula} 
                      details={row.formula[i].details}
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