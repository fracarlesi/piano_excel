import React from 'react';
import EditableNumberField from '../../components/EditableNumberField';
import StaffingTable from './StaffingTable';

const TreasuryAssumptions = ({ assumptions, onAssumptionChange }) => {
  const treasury = assumptions.treasury || {};
  const companyTaxMultiplier = assumptions.personnel?.companyTaxMultiplier || 1.4;

  return (
    <div className="space-y-8">
      {/* Treasury/ALM Parameters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Treasury / ALM Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Liquidity Management */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Liquidity Management</h4>
            <EditableNumberField
              label="Liquidity Buffer Requirement"
              value={treasury.liquidityBufferRequirement}
              onChange={val => onAssumptionChange('treasury.liquidityBufferRequirement', val)}
              unit="%"
              isPercentage={true}
              tooltip="Required liquidity buffer as % of total deposits"
              tooltipTitle="Liquidity Buffer Requirement"
              tooltipImpact="Determines minimum liquid assets the bank must hold for regulatory compliance"
              tooltipFormula="Liquidity Buffer = Total Deposits × Buffer Requirement %"
            />
            <EditableNumberField
              label="Liquid Asset Return Rate"
              value={treasury.liquidAssetReturnRate}
              onChange={val => onAssumptionChange('treasury.liquidAssetReturnRate', val)}
              unit="%"
              isPercentage={true}
              decimals={2}
              tooltip="Annual return on liquid assets (government bonds, ECB deposits)"
              tooltipTitle="Liquid Asset Return Rate"
              tooltipImpact="Generates interest income on mandatory liquidity holdings"
              tooltipFormula="Liquidity Income = Liquidity Buffer × Return Rate"
            />
          </div>

          {/* Funding */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Funding Management</h4>
            <EditableNumberField
              label="Interbank Funding Rate"
              value={treasury.interbankFundingRate}
              onChange={val => onAssumptionChange('treasury.interbankFundingRate', val)}
              unit="%"
              isPercentage={true}
              decimals={2}
              tooltip="Cost of interbank funding for covering funding gaps"
              tooltipTitle="Interbank Funding Rate"
              tooltipImpact="Cost of external funding when loans exceed deposits"
              tooltipFormula="Interbank Cost = Funding Gap × Interbank Rate"
            />
          </div>

          {/* Trading Book */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Trading Book</h4>
            <EditableNumberField
              label="Trading Book Size (Initial)"
              value={treasury.tradingBookSize}
              onChange={val => onAssumptionChange('treasury.tradingBookSize', val)}
              unit="€M"
              isPercentage={false}
              tooltip="Initial size of trading portfolio"
              tooltipTitle="Trading Book Size"
              tooltipImpact="Proprietary trading assets generate additional income"
              tooltipFormula="Trading Income = Trading Book × Return Target ± Volatility"
            />
            <EditableNumberField
              label="Trading Book Growth Rate"
              value={treasury.tradingBookGrowthRate}
              onChange={val => onAssumptionChange('treasury.tradingBookGrowthRate', val)}
              unit="%"
              isPercentage={true}
              tooltip="Annual growth rate of trading book"
              tooltipTitle="Trading Book Growth Rate"
              tooltipImpact="Increases trading assets and potential income over time"
              tooltipFormula="Trading Book Year N = Initial Size × (1 + Growth Rate)^(N-1)"
            />
            <EditableNumberField
              label="Trading Book Return Target"
              value={treasury.tradingBookReturnTarget}
              onChange={val => onAssumptionChange('treasury.tradingBookReturnTarget', val)}
              unit="%"
              isPercentage={true}
              tooltip="Target annual return on trading activities"
              tooltipTitle="Trading Book Return Target"
              tooltipImpact="Expected income from proprietary trading operations"
              tooltipFormula="Expected Trading Income = Trading Book × Return Target"
            />
            <EditableNumberField
              label="Trading Book Volatility"
              value={treasury.tradingBookVolatility}
              onChange={val => onAssumptionChange('treasury.tradingBookVolatility', val)}
              unit="%"
              isPercentage={true}
              tooltip="Expected volatility of trading returns"
              tooltipTitle="Trading Book Volatility"
              tooltipImpact="Risk measure for trading activities, affects capital requirements"
              tooltipFormula="Actual Return = Target Return ± Volatility adjustments"
            />
          </div>
        </div>

        {/* FTP Information */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Funds Transfer Pricing (FTP)</h4>
          <p className="text-sm text-blue-700">
            The Treasury acts as the central funding hub:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
            <li>Receives funds from deposit-taking divisions at deposit rate ({assumptions.depositRate || 0}%)</li>
            <li>Provides funding to lending divisions at FTP rate (EURIBOR {assumptions.euribor || 0}% + Spread {assumptions.ftpSpread || 0}% = {((assumptions.euribor || 0) + (assumptions.ftpSpread || 0)).toFixed(2)}%)</li>
            <li>Earns the spread between FTP rate and deposit rate</li>
            <li>Manages funding gaps through interbank market</li>
          </ul>
        </div>
      </div>

      {/* Personnel Staffing */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Treasury Personnel Staffing</h3>
        
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Configure the Treasury division staffing levels and compensation. Personnel costs are calculated based on RAL × {companyTaxMultiplier}x multiplier.
          </p>
        </div>

        <StaffingTable
          divisionData={treasury}
          path="treasury"
          handleAssumptionChange={onAssumptionChange}
          editMode={true}
          companyTaxMultiplier={companyTaxMultiplier}
        />
      </div>
    </div>
  );
};

export default TreasuryAssumptions;