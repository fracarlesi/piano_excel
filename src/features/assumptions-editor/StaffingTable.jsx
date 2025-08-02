import React from 'react';
import { EditableNumberField } from '../../components/ui/inputs';

const StaffingTable = ({ 
  divisionData, 
  path, 
  handleAssumptionChange, 
  editMode = false,
  companyTaxMultiplier = 1.4 
}) => {
  // Standard seniority levels with default RAL ranges
  const standardLevels = [
    { level: 'Junior', defaultRAL: 30 },
    { level: 'Middle', defaultRAL: 45 },
    { level: 'Senior', defaultRAL: 65 },
    { level: 'Head of', defaultRAL: 120 }
  ];
  
  // Get existing staffing data or create empty structure
  const existingStaffing = divisionData?.staffing || [];
  
  // Create complete staffing array with all levels
  const completeStaffing = standardLevels.map(({ level, defaultRAL }) => {
    const existing = existingStaffing.find(s => s.level === level);
    return existing || { level, count: 0, ralPerHead: defaultRAL };
  });
  
  // Calculate totals
  const totalCount = completeStaffing.reduce((sum, level) => sum + (level.count || 0), 0);
  const totalRAL = completeStaffing.reduce((sum, level) => sum + (level.count || 0) * (level.ralPerHead || 0), 0);
  const totalCompanyCost = totalRAL * companyTaxMultiplier;

  // Update staffing array
  const updateStaffing = (index, field, value) => {
    const updatedStaffing = [...completeStaffing];
    updatedStaffing[index] = { ...updatedStaffing[index], [field]: value };
    
    // Keep all entries that have been modified from defaults or have values
    const cleanedStaffing = updatedStaffing.filter(level => {
      const defaultLevel = standardLevels.find(s => s.level === level.level);
      const hasCount = level.count > 0;
      const hasModifiedRAL = level.ralPerHead !== defaultLevel?.defaultRAL;
      return hasCount || hasModifiedRAL;
    });
    
    handleAssumptionChange(`${path}.staffing`, cleanedStaffing);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-3">
        <EditableNumberField
          label="Annual Headcount Growth (Junior & Middle only)"
          value={divisionData?.headcountGrowth || 0}
          onChange={val => handleAssumptionChange(`${path}.headcountGrowth`, val)}
          unit="%"
          disabled={!editMode}
          isPercentage
          decimals={1}
          tooltip="Annual growth rate for Junior and Middle positions only. Senior and Head of positions remain constant."
          tooltipImpact="Increases headcount for entry and mid-level positions over the plan period"
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">RAL/Head (€k)</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total RAL (€k)</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Company Cost (€k)</th>
            </tr>
          </thead>
          <tbody>
            {completeStaffing.map((level, index) => {
              const hasGrowth = level.level === 'Junior' || level.level === 'Middle';
              return (
              <tr key={level.level} className="border-b border-gray-200">
                <td className="px-4 py-2 text-gray-700">
                  {level.level}
                  {hasGrowth && (
                    <span className="ml-2 text-xs text-green-600" title="Subject to headcount growth">
                      ↗
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <EditableNumberField
                    value={level.count || 0}
                    onChange={val => updateStaffing(index, 'count', val)}
                    disabled={!editMode}
                    isInteger
                    inline
                    className="text-center"
                    min={0}
                  />
                </td>
                <td className="px-4 py-2">
                  <EditableNumberField
                    value={level.ralPerHead || 0}
                    onChange={val => updateStaffing(index, 'ralPerHead', val)}
                    disabled={!editMode}
                    inline
                    className="text-center"
                    min={0}
                  />
                </td>
                <td className="px-4 py-2 text-center text-gray-700">
                  {((level.count || 0) * (level.ralPerHead || 0)).toFixed(1)}
                </td>
                <td className="px-4 py-2 text-center text-gray-700">
                  {((level.count || 0) * (level.ralPerHead || 0) * companyTaxMultiplier).toFixed(1)}
                </td>
              </tr>
            );
            })}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-center">{totalCount.toFixed(1)}</td>
              <td className="px-4 py-2 text-center">{totalCount > 0 ? (totalRAL / totalCount).toFixed(1) : 0}</td>
              <td className="px-4 py-2 text-center">{totalRAL.toFixed(1)}</td>
              <td className="px-4 py-2 text-center">{totalCompanyCost.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffingTable;