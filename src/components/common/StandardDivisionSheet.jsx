import React from 'react';
import StandardPnL from './StandardPnL';
import StandardBalanceSheet from './StandardBalanceSheet';
import StandardCapitalRequirements from './StandardCapitalRequirements';
import StandardKPIs from './StandardKPIs';

/**
 * Complete standardized division sheet that combines all financial statements
 * This is the main component that provides a unified view for all banking divisions
 */
const StandardDivisionSheet = ({
  assumptions,
  results,
  divisionKey, // e.g., 're', 'sme', 'digital', etc.
  divisionDisplayName,
  divisionDescription,
  divisionIcon = '🏦',
  customOverview = null,
  showProductDetail = true,
  customTransformations = {
    pnl: {},
    balanceSheet: {},
    capitalRequirements: {},
    kpis: {}
  }
}) => {
  
  // Get division-specific results
  const divisionResults = results.divisions[divisionKey] || {
    bs: { performingAssets: [0,0,0,0,0], nonPerformingAssets: [0,0,0,0,0], equity: [0,0,0,0,0] },
    pnl: { interestIncome: [0,0,0,0,0], commissionIncome: [0,0,0,0,0], totalLLP: [0,0,0,0,0] },
    capital: { rwaCreditRisk: [0,0,0,0,0], totalRWA: [0,0,0,0,0], cet1Ratio: [0,0,0,0,0] }
  };

  // Filter products for this division
  const productResults = Object.fromEntries(
    Object.entries(results.productResults || {}).filter(([key]) => key.startsWith(divisionKey))
  );

  const defaultOverview = [
    { 
      label: 'Division Focus', 
      value: divisionDescription || `Specialized banking services and financial products`
    },
    { 
      label: 'Products Portfolio', 
      value: `${Object.keys(productResults).length} active products`
    },
    { 
      label: 'Total Assets (Year 5)', 
      value: `${((divisionResults.bs.performingAssets[4] + divisionResults.bs.nonPerformingAssets[4]) / 1000).toFixed(1)}B €`
    },
    { 
      label: 'CET1 Ratio (Year 5)', 
      value: `${(divisionResults.capital.cet1Ratio[4] || 0).toFixed(1)}%`
    },
    { 
      label: 'Expected ROE (Year 5)', 
      value: 'Calculated in KPIs section'
    }
  ];

  const overviewData = customOverview || defaultOverview;

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Division Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">{divisionIcon}</span>
          <h1 className="text-2xl font-bold text-gray-800">{divisionDisplayName}</h1>
        </div>
        
        {/* Division Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Division Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewData.map((item, index) => (
              <div key={index} className="flex flex-col">
                <span className="font-medium text-gray-600 text-sm">{item.label}</span>
                <span className="text-gray-800 font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Portfolio Summary */}
        {showProductDetail && Object.keys(productResults).length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Product Portfolio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(productResults).map(([key, product]) => (
                <div key={key} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">{product.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Assets (Y5):</span>
                      <span className="font-medium text-blue-900">
                        {(product.performingAssets[4] / 1000).toFixed(1)}B €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Interest Rate:</span>
                      <span className="font-medium text-blue-900">
                        {((product.assumptions?.interestRate || 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Risk Weight:</span>
                      <span className="font-medium text-blue-900">
                        {((product.assumptions?.riskWeight || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Products Warning */}
        {Object.keys(productResults).length === 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-yellow-600 text-lg mr-2">⚠️</span>
              <div>
                <h3 className="font-medium text-yellow-800">No Products Configured</h3>
                <p className="text-yellow-700 text-sm">
                  Add products starting with "{divisionKey}" prefix in defaultAssumptions.js to see division-specific data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Statements */}
      <StandardPnL
        divisionResults={divisionResults}
        productResults={productResults}
        assumptions={assumptions}
        globalResults={results}
        divisionName={divisionKey}
        showProductDetail={showProductDetail}
        customRowTransformations={customTransformations.pnl}
      />
      
      <StandardBalanceSheet
        divisionResults={divisionResults}
        productResults={productResults}
        assumptions={assumptions}
        globalResults={results}
        divisionName={divisionKey}
        showProductDetail={showProductDetail}
        customRowTransformations={customTransformations.balanceSheet}
      />
      
      <StandardCapitalRequirements
        divisionResults={divisionResults}
        productResults={productResults}
        assumptions={assumptions}
        globalResults={results}
        divisionName={divisionKey}
        showProductDetail={showProductDetail}
        customRowTransformations={customTransformations.capitalRequirements}
      />
      
      <StandardKPIs
        divisionResults={divisionResults}
        productResults={productResults}
        assumptions={assumptions}
        globalResults={results}
        divisionName={divisionKey}
        showProductDetail={showProductDetail}
        customRowTransformations={customTransformations.kpis}
      />
    </div>
  );
};

export default StandardDivisionSheet;