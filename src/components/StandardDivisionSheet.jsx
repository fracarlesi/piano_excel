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
  const divisionResults = results?.divisions?.[divisionKey] || {
    bs: { performingAssets: [0,0,0,0,0,0,0,0,0,0], nonPerformingAssets: [0,0,0,0,0,0,0,0,0,0], equity: [0,0,0,0,0,0,0,0,0,0] },
    pnl: { interestIncome: [0,0,0,0,0,0,0,0,0,0], commissionIncome: [0,0,0,0,0,0,0,0,0,0], totalLLP: [0,0,0,0,0,0,0,0,0,0] },
    capital: { rwaCreditRisk: [0,0,0,0,0,0,0,0,0,0], totalRWA: [0,0,0,0,0,0,0,0,0,0], cet1Ratio: [0,0,0,0,0,0,0,0,0,0] }
  };

  // Filter products for this division
  const productResults = Object.fromEntries(
    Object.entries(results.productResults || {}).filter(([key]) => key.startsWith(divisionKey))
  );

  // const defaultOverview = [
  //   { 
  //     label: 'Division Focus', 
  //     value: divisionDescription || `Specialized banking services and financial products`
  //   },
  //   { 
  //     label: 'Products Portfolio', 
  //     value: `${Object.keys(productResults).length} active products`
  //   },
  //   { 
  //     label: 'Total Assets (Year 5)', 
  //     value: `${((divisionResults.bs.performingAssets[4] + divisionResults.bs.nonPerformingAssets[4]) / 1000).toFixed(1)}B €`
  //   },
  //   { 
  //     label: 'CET1 Ratio (Year 5)', 
  //     value: `${(divisionResults.capital.cet1Ratio[4] || 0).toFixed(1)}%`
  //   },
  //   { 
  //     label: 'Expected ROE (Year 5)', 
  //     value: 'Calculated in KPIs section'
  //   }
  // ]; // Currently unused - may be needed for future overview section

  // const overviewData = customOverview || defaultOverview; // Currently unused - may be needed for future overview section

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Financial Statements Only */}
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