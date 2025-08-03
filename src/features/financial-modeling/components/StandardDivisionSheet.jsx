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
  const allCommissionIncomeData = results.productPnLTableData?.commissionIncome || {};
  const allCommissionExpenseData = results.productPnLTableData?.commissionExpense || {};
  const allLoanLossProvisionsData = results.productPnLTableData?.loanLossProvisions || {};
  const allECLMovementsData = results.productPnLTableData?.eclMovements || {};
  const allCreditImpairmentData = results.productPnLTableData?.creditImpairment || {};
  
  //   division: divisionKey,
  //   hasCommissionData: Object.keys(allCommissionIncomeData).length > 0,
  //   commissionProducts: Object.keys(allCommissionIncomeData)
  // });
  
  // DEBUG: Check P&L structure - DISABLED
  //   hasResults: !!results,
  //   hasPnL: !!results?.pnl,
  //   hasProductTableData: !!results?.pnl?.productTableData,
  //   hasLoanLossProvisions: !!results?.pnl?.productTableData?.loanLossProvisions,
  //   llpProducts: Object.keys(results?.pnl?.productTableData?.loanLossProvisions || {}),
  //   fullPnLStructure: results?.pnl
  // });
  
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
      // Use quarterly FTP data directly - for bonis section we need quarterlyFTPBonis
      productPnLData[productKey].quarterly.interestExpense = expenseData.quarterlyFTPBonis || Array(40).fill(0);
      productPnLData[productKey].quarterly.interestExpenseTotal = expenseData.quarterlyFTPTotal || Array(40).fill(0);
      productPnLData[productKey].quarterly.interestExpenseNPL = expenseData.quarterlyFTPNPL || Array(40).fill(0);
      productPnLData[productKey].ftpRate = expenseData.ftpRate || 0;
    }
  });
  
  // Merge commission income data into product P&L data
  Object.entries(allCommissionIncomeData).forEach(([key, commissionData]) => {
    if (key.startsWith(divisionKey)) {
      // Find if this product already exists in productPnLData
      let targetKey = key;
      if (!productPnLData[targetKey]) {
        // For commission income, we need to match with interest income products
        // Look for a matching product in the existing productPnLData
        const matchingKey = Object.keys(productPnLData).find(k => k === key || k === `${key}_NPL`);
        if (matchingKey) {
          targetKey = matchingKey;
        } else {
          // Create new entry if product doesn't exist
          productPnLData[key] = {
            name: key,
            quarterly: {}
          };
        }
      }
      
      //   quarterlyData: commissionData?.slice(0, 4),
      //   hasData: Array.isArray(commissionData)
      // });
      
      // Add commission income quarterly data
      productPnLData[targetKey].quarterly = productPnLData[targetKey].quarterly || {};
      productPnLData[targetKey].quarterly.commissionIncome = commissionData || Array(40).fill(0);
    }
  });
  
  // Merge commission expense data into product P&L data
  Object.entries(allCommissionExpenseData).forEach(([key, commissionExpenseData]) => {
    if (key.startsWith(divisionKey)) {
      // Find if this product already exists in productPnLData
      let targetKey = key;
      if (!productPnLData[targetKey]) {
        // For commission expense, we need to match with existing products
        const matchingKey = Object.keys(productPnLData).find(k => k === key || k === `${key}_NPL`);
        if (matchingKey) {
          targetKey = matchingKey;
        } else {
          // Create new entry if product doesn't exist
          productPnLData[key] = {
            name: key,
            quarterly: {}
          };
        }
      }
      // Debug commission expense data - removed
      
      // Add commission expense quarterly data
      productPnLData[targetKey].quarterly = productPnLData[targetKey].quarterly || {};
      productPnLData[targetKey].quarterly.commissionExpense = commissionExpenseData || Array(40).fill(0);
    }
  });
  
  // Merge ECL Movements data into product P&L data
  Object.entries(allECLMovementsData).forEach(([key, eclData]) => {
    if (key.startsWith(divisionKey) && !key.includes('_NPL')) {
      if (!productPnLData[key]) {
        productPnLData[key] = {
          name: eclData.productName || key,
          quarterly: {}
        };
      }
      productPnLData[key].quarterly = productPnLData[key].quarterly || {};
      productPnLData[key].quarterly.eclMovement = eclData.quarterlyMovements || eclData || Array(40).fill(0);
    }
  });
  
  // Merge Credit Impairment data into product P&L data
  Object.entries(allCreditImpairmentData).forEach(([key, impairmentData]) => {
    // Check if this product belongs to the current division
    if (key.startsWith(divisionKey)) {
      // Create the NPL key for this product
      const nplKey = key + '_NPL';
      
      if (!productPnLData[nplKey]) {
        productPnLData[nplKey] = {
          name: impairmentData.productName || key,
          quarterly: {}
        };
      }
      productPnLData[nplKey].quarterly = productPnLData[nplKey].quarterly || {};
      productPnLData[nplKey].quarterly.creditImpairment = impairmentData.quarterlyImpairment || impairmentData || Array(40).fill(0);
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
      <StandardBalanceSheet
        divisionResults={divisionResults}
        productResults={productResults}
        assumptions={assumptions}
        globalResults={results}
        divisionName={divisionKey}
        showProductDetail={showProductDetail}
        customRowTransformations={customTransformations.balanceSheet}
      />
      
      <StandardPnL
        divisionResults={divisionResults}
        productResults={productPnLData}
        assumptions={assumptions}
        globalResults={results}
        divisionName={divisionKey}
        showProductDetail={showProductDetail}
        customRowTransformations={customTransformations.pnl}
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