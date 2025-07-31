import React from 'react';
import EditableNumberField from '../common/EditableNumberField';

const PersonnelAssumptions = ({ 
  assumptions, 
  handleAssumptionChange, 
  editMode = false 
}) => {
  // Helper function to render a staffing table
  const renderStaffingTable = (divisionKey, divisionData, path) => {
    const staffing = divisionData.staffing || [];
    const totalCount = staffing.reduce((sum, level) => sum + level.count, 0);
    const totalRAL = staffing.reduce((sum, level) => sum + level.count * (level.ralPerHead || level.costPerHead || 0), 0);
    const companyTaxMultiplier = assumptions.personnel?.companyTaxMultiplier || 1.4;
    const totalCompanyCost = totalRAL * companyTaxMultiplier;

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-3">
          <EditableNumberField
            label="Annual Headcount Growth"
            value={divisionData.headcountGrowth}
            onChange={val => handleAssumptionChange(`${path}.headcountGrowth`, val)}
            unit="%"
            disabled={!editMode}
            isPercentage
            decimals={1}
            tooltip="Annual growth rate for headcount in this unit"
            tooltipImpact="Affects personnel costs projection over the plan period"
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
              {staffing.map((level, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="px-4 py-2 text-gray-700">{level.level}</td>
                  <td className="px-4 py-2">
                    <EditableNumberField
                      value={level.count}
                      onChange={val => {
                        const newStaffing = [...staffing];
                        newStaffing[index] = { ...level, count: val };
                        handleAssumptionChange(`${path}.staffing`, newStaffing);
                      }}
                      disabled={!editMode}
                      isInteger
                      inline
                      className="text-center"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <EditableNumberField
                      value={level.ralPerHead || level.costPerHead || 0}
                      onChange={val => {
                        const newStaffing = [...staffing];
                        newStaffing[index] = { ...level, ralPerHead: val };
                        handleAssumptionChange(`${path}.staffing`, newStaffing);
                      }}
                      disabled={!editMode}
                      inline
                      className="text-center"
                    />
                  </td>
                  <td className="px-4 py-2 text-center text-gray-700">
                    {(level.count * (level.ralPerHead || level.costPerHead || 0)).toFixed(0)}
                  </td>
                  <td className="px-4 py-2 text-center text-gray-700">
                    {(level.count * (level.ralPerHead || level.costPerHead || 0) * companyTaxMultiplier).toFixed(0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-center">{totalCount}</td>
                <td className="px-4 py-2 text-center">{totalCount > 0 ? (totalRAL / totalCount).toFixed(0) : 0}</td>
                <td className="px-4 py-2 text-center">{totalRAL.toFixed(0)}</td>
                <td className="px-4 py-2 text-center">{totalCompanyCost.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Staffing e Costi del Personale</h3>
        
        {/* Global Driver */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Global Personnel Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableNumberField
              label="Annual Salary Review"
              value={assumptions.personnel?.annualSalaryReview || 2.5}
              onChange={val => handleAssumptionChange('personnel.annualSalaryReview', val)}
              unit="%"
              disabled={!editMode}
              isPercentage
              decimals={1}
              tooltip="Annual salary increase applied to all personnel costs"
              tooltipImpact="Affects all personnel costs across the entire organization"
              tooltipFormula="Next Year Cost = Current Cost × (1 + Annual Salary Review %)"
            />
            <EditableNumberField
              label="Company Tax Multiplier"
              value={assumptions.personnel?.companyTaxMultiplier || 1.4}
              onChange={val => handleAssumptionChange('personnel.companyTaxMultiplier', val)}
              unit="x"
              disabled={!editMode}
              decimals={2}
              min={1}
              max={2}
              tooltip="Multiplier to convert RAL to company cost (social charges, TFR, etc.)"
              tooltipImpact="Converts gross salary (RAL) to total company cost including all charges"
              tooltipFormula="Company Cost = RAL × Company Tax Multiplier"
            />
          </div>
        </div>

        {/* Business Divisions */}
        <div>
          <h4 className="text-lg font-bold text-gray-700 mb-4">Business Divisions</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Real Estate Financing</h5>
              {renderStaffingTable('RealEstateFinancing', 
                assumptions.personnel?.businessDivisions?.RealEstateFinancing || {}, 
                'personnel.businessDivisions.RealEstateFinancing')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">SME Financing</h5>
              {renderStaffingTable('SMEFinancing', 
                assumptions.personnel?.businessDivisions?.SMEFinancing || {}, 
                'personnel.businessDivisions.SMEFinancing')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Wealth & Asset Management</h5>
              {renderStaffingTable('WealthAndAssetManagement', 
                assumptions.personnel?.businessDivisions?.WealthAndAssetManagement || {}, 
                'personnel.businessDivisions.WealthAndAssetManagement')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Incentives</h5>
              {renderStaffingTable('Incentives', 
                assumptions.personnel?.businessDivisions?.Incentives || {}, 
                'personnel.businessDivisions.Incentives')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Digital Banking</h5>
              {renderStaffingTable('DigitalBanking', 
                assumptions.personnel?.businessDivisions?.DigitalBanking || {}, 
                'personnel.businessDivisions.DigitalBanking')}
            </div>
          </div>
        </div>

        {/* Structural Divisions */}
        <div className="mt-8">
          <h4 className="text-lg font-bold text-gray-700 mb-4">Structural Divisions</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Tech</h5>
              {renderStaffingTable('Tech', 
                assumptions.personnel?.structuralDivisions?.Tech || {}, 
                'personnel.structuralDivisions.Tech')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Treasury</h5>
              {renderStaffingTable('Treasury', 
                assumptions.personnel?.structuralDivisions?.Treasury || {}, 
                'personnel.structuralDivisions.Treasury')}
            </div>
          </div>
        </div>

        {/* Central Functions */}
        <div className="mt-8">
          <h4 className="text-lg font-bold text-gray-700 mb-4">Central Functions</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">CEO Office</h5>
              {renderStaffingTable('CEOOffice', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.CEOOffice || {}, 
                'personnel.structuralDivisions.CentralFunctions.CEOOffice')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Operations</h5>
              {renderStaffingTable('Operations', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.Operations || {}, 
                'personnel.structuralDivisions.CentralFunctions.Operations')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">HR</h5>
              {renderStaffingTable('HR', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.HR || {}, 
                'personnel.structuralDivisions.CentralFunctions.HR')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">AFC (Admin, Finance & Control)</h5>
              {renderStaffingTable('AFC', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.AFC || {}, 
                'personnel.structuralDivisions.CentralFunctions.AFC')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Risk Management</h5>
              {renderStaffingTable('RiskManagement', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.RiskManagement || {}, 
                'personnel.structuralDivisions.CentralFunctions.RiskManagement')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Compliance & AML</h5>
              {renderStaffingTable('ComplianceAndAML', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.ComplianceAndAML || {}, 
                'personnel.structuralDivisions.CentralFunctions.ComplianceAndAML')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Legal</h5>
              {renderStaffingTable('Legal', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.Legal || {}, 
                'personnel.structuralDivisions.CentralFunctions.Legal')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Marketing & Communication</h5>
              {renderStaffingTable('MarketingAndCommunication', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.MarketingAndCommunication || {}, 
                'personnel.structuralDivisions.CentralFunctions.MarketingAndCommunication')}
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-600 mb-2">Internal Audit</h5>
              {renderStaffingTable('InternalAudit', 
                assumptions.personnel?.structuralDivisions?.CentralFunctions?.InternalAudit || {}, 
                'personnel.structuralDivisions.CentralFunctions.InternalAudit')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelAssumptions;