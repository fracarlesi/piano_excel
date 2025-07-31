import React from 'react';
import EditableNumberField from '../../components/EditableNumberField';
import StaffingTable from './StaffingTable';

const CentralAssumptions = ({ assumptions, onAssumptionChange }) => {
  const centralFunctions = assumptions.centralFunctions || {};
  const companyTaxMultiplier = assumptions.personnel?.companyTaxMultiplier || 1.4;

  // List of departments
  const departments = [
    { key: 'CEOOffice', name: 'CEO Office', icon: '👔' },
    { key: 'Operations', name: 'Operations', icon: '⚙️' },
    { key: 'HR', name: 'Human Resources', icon: '👥' },
    { key: 'AFC', name: 'Administration, Finance & Control', icon: '💰' },
    { key: 'RiskManagement', name: 'Risk Management', icon: '⚖️' },
    { key: 'ComplianceAndAML', name: 'Compliance & AML', icon: '🛡️' },
    { key: 'Legal', name: 'Legal', icon: '⚖️' },
    { key: 'MarketingAndCommunication', name: 'Marketing & Communication', icon: '📢' },
    { key: 'InternalAudit', name: 'Internal Audit', icon: '🔍' }
  ];

  return (
    <div className="space-y-8">
      {/* Non-Personnel Central Costs */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Central Functions - Non-Personnel Costs</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Infrastructure & Facilities</h4>
            <EditableNumberField
              label="Facilities Costs (Year 1)"
              value={centralFunctions.facilitiesCostsY1 || 3.0}
              onChange={val => onAssumptionChange('centralFunctions.facilitiesCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Headquarters and central facilities costs"
              tooltipTitle="Facilities Costs"
              tooltipImpact="Fixed infrastructure costs not attributable to specific divisions"
              tooltipFormula="Year N = Year 1 × (1 + Cost Growth Rate)^(N-1)"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">External Services</h4>
            <EditableNumberField
              label="External Services (Year 1)"
              value={centralFunctions.externalServicesY1 || 2.5}
              onChange={val => onAssumptionChange('centralFunctions.externalServicesY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="External consultants, legal services, professional fees"
              tooltipTitle="External Services"
              tooltipImpact="Professional services supporting all bank functions"
              tooltipFormula="Year N = Year 1 × (1 + Cost Growth Rate)^(N-1)"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Regulatory & Other</h4>
            <EditableNumberField
              label="Regulatory Fees (Year 1)"
              value={centralFunctions.regulatoryFeesY1 || 1.8}
              onChange={val => onAssumptionChange('centralFunctions.regulatoryFeesY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Regulatory fees, contributions, and supervisory charges"
              tooltipTitle="Regulatory Fees"
              tooltipImpact="Mandatory fees paid to regulatory authorities"
              tooltipFormula="Year N = Year 1 × (1 + Cost Growth Rate)^(N-1)"
            />
            <EditableNumberField
              label="Other Central Costs (Year 1)"
              value={centralFunctions.otherCentralCostsY1 || 1.2}
              onChange={val => onAssumptionChange('centralFunctions.otherCentralCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Other miscellaneous central costs"
              tooltipTitle="Other Central Costs"
              tooltipImpact="Catch-all for unallocated central expenses"
              tooltipFormula="Year N = Year 1 × (1 + Cost Growth Rate)^(N-1)"
            />
          </div>
        </div>
      </div>

      {/* Department-based Personnel Staffing */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Central Functions - Personnel by Department</h3>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Configure staffing for each central department. Personnel costs are calculated based on RAL × {companyTaxMultiplier}x multiplier.
          </p>
        </div>

        <div className="space-y-6">
          {departments.map(dept => (
            <div key={dept.key} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-xl">{dept.icon}</span>
                  {dept.name}
                </h4>
              </div>
              <div className="p-4">
                <StaffingTable
                  divisionData={centralFunctions.departments?.[dept.key] || {}}
                  path={`centralFunctions.departments.${dept.key}`}
                  handleAssumptionChange={onAssumptionChange}
                  editMode={true}
                  companyTaxMultiplier={companyTaxMultiplier}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Central Functions costs are not allocated to business divisions and directly impact bank-level profitability. 
          Both personnel and non-personnel costs grow at the general cost growth rate defined in General Assumptions.
        </p>
      </div>
    </div>
  );
};

export default CentralAssumptions;