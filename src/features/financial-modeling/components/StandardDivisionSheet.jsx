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
  
  // Get P&L table data for products in this division (including NPL)
  const allInterestIncomeData = results.productPnLTableData?.interestIncome || {};
  const allInterestExpenseData = results.productPnLTableData?.interestExpense || {};
  
  const productPnLData = Object.fromEntries(
    Object.entries(allInterestIncomeData).filter(([key]) => {
      // Include both performing products (e.g., "RE-Commercial") 
      // and NPL products (e.g., "RE-Commercial_NPL")
      const baseKey = key.replace('_NPL', '');
      return baseKey.startsWith(divisionKey);
    })
  );
  
  // Merge interest expense data into product P&L data
  Object.entries(allInterestExpenseData).forEach(([key, expenseData]) => {
    // Extract the product key from the consolidated key (e.g., "re_reSecuritization" -> "reSecuritization")
    const parts = key.split('_');
    const productKey = parts.length > 1 ? parts[1] : key;
    
    if (productKey.startsWith(divisionKey) && productPnLData[productKey]) {
      productPnLData[productKey].quarterly = productPnLData[productKey].quarterly || {};
      // Use quarterly FTP data directly
      productPnLData[productKey].quarterly.interestExpense = expenseData.quarterlyFTP || Array(40).fill(0);
      productPnLData[productKey].ftpRate = expenseData.ftpRate || 0;
    }
  });
  

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
      {/* Division Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{divisionDisplayName || divisionKey}</h2>
        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
          Vista Trimestrale (40 Trimestri)
        </div>
      </div>
      
      {/* Financial Statements Only */}
      <StandardPnL
        divisionResults={divisionResults}
        productResults={productPnLData}
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