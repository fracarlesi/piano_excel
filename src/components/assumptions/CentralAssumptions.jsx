import React from 'react';
import EditableNumberField from '../common/EditableNumberField';

const CentralAssumptions = ({ assumptions, onAssumptionChange }) => {
  const centralFunctions = assumptions.centralFunctions || {};

  return (
    <div className="space-y-8">
      {/* Central Functions Costs */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Central Functions Costs</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cost Components */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Executive & Governance</h4>
            <EditableNumberField
              label="Board & Executive Costs (Year 1)"
              value={centralFunctions.boardAndExecutiveCostsY1}
              onChange={val => onAssumptionChange('centralFunctions.boardAndExecutiveCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Annual cost for board of directors, CEO, and executive management"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Compliance & Risk</h4>
            <EditableNumberField
              label="Compliance Costs (Year 1)"
              value={centralFunctions.complianceCostsY1}
              onChange={val => onAssumptionChange('centralFunctions.complianceCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Annual compliance, AML, and regulatory reporting costs"
            />
            <EditableNumberField
              label="Risk Management Costs (Year 1)"
              value={centralFunctions.riskManagementCostsY1}
              onChange={val => onAssumptionChange('centralFunctions.riskManagementCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Central risk management function costs"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Control Functions</h4>
            <EditableNumberField
              label="Audit Costs (Year 1)"
              value={centralFunctions.auditCostsY1}
              onChange={val => onAssumptionChange('centralFunctions.auditCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Internal and external audit costs"
            />
            <EditableNumberField
              label="Legal Costs (Year 1)"
              value={centralFunctions.legalCostsY1}
              onChange={val => onAssumptionChange('centralFunctions.legalCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Legal department and external counsel costs"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Corporate Functions</h4>
            <EditableNumberField
              label="Strategy & Planning Costs (Year 1)"
              value={centralFunctions.strategyAndPlanningCostsY1}
              onChange={val => onAssumptionChange('centralFunctions.strategyAndPlanningCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Strategic planning, M&A, and investor relations"
            />
            <EditableNumberField
              label="HR Central Costs (Year 1)"
              value={centralFunctions.hrCentralCostsY1}
              onChange={val => onAssumptionChange('centralFunctions.hrCentralCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Central HR, training, and recruitment costs"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Infrastructure</h4>
            <EditableNumberField
              label="Facilities Costs (Year 1)"
              value={centralFunctions.facilitiesCostsY1}
              onChange={val => onAssumptionChange('centralFunctions.facilitiesCostsY1', val)}
              unit="€M"
              isPercentage={false}
              decimals={1}
              tooltip="Headquarters and central facilities costs"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Staffing</h4>
            <EditableNumberField
              label="FTE Year 1"
              value={centralFunctions.fteY1}
              onChange={val => onAssumptionChange('centralFunctions.fteY1', val)}
              unit="people"
              isInteger={true}
              tooltip="Number of employees in central functions at year 1"
            />
            <EditableNumberField
              label="FTE Year 5"
              value={centralFunctions.fteY5}
              onChange={val => onAssumptionChange('centralFunctions.fteY5', val)}
              unit="people"
              isInteger={true}
              tooltip="Target number of employees in central functions by year 5"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Central Functions costs are not allocated to business divisions and directly impact bank-level profitability. 
            These costs grow at the general cost growth rate defined in General Assumptions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CentralAssumptions;