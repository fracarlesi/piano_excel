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
  // Removed expansion/compression functionality - all tables always visible

  // Get division-specific results
  const divisionResults = results?.divisions?.[divisionKey] || {
    bs: { performingAssets: [0,0,0,0,0,0,0,0,0,0], nonPerformingAssets: [0,0,0,0,0,0,0,0,0,0], equity: [0,0,0,0,0,0,0,0,0,0] },
    pnl: { interestIncome: [0,0,0,0,0,0,0,0,0,0], commissionIncome: [0,0,0,0,0,0,0,0,0,0], totalLLP: [0,0,0,0,0,0,0,0,0,0] },
    capital: { rwaCreditRisk: [0,0,0,0,0,0,0,0,0,0], totalRWA: [0,0,0,0,0,0,0,0,0,0], cet1Ratio: [0,0,0,0,0,0,0,0,0,0] }
  };

  // Filter products for this division
  let productResults = Object.fromEntries(
    Object.entries(results.productResults || {}).filter(([key]) => key.startsWith(divisionKey))
  );
  
  // Get P&L table data for products in this division (including NPL)
  const allInterestIncomeData = results.productPnLTableData?.interestIncome || {};
  const allInterestExpenseData = results.productPnLTableData?.interestExpense || {};
  let allCommissionIncomeData = results.productPnLTableData?.commissionIncome || {};
  
  // For Tech division, merge data from global commission income
  if (divisionKey === 'tech' && results?.pnl?.commissionIncome?.quarterly?.byProduct) {
    const techProductsFromGlobal = {};
    Object.entries(results.pnl.commissionIncome.quarterly.byProduct).forEach(([key, data]) => {
      if (key.startsWith('tech')) {
        techProductsFromGlobal[key] = data;
      }
    });
    allCommissionIncomeData = { ...allCommissionIncomeData, ...techProductsFromGlobal };
    console.log('Tech Division - Merged commission income data:', allCommissionIncomeData);
  }
  const allCommissionExpenseData = results.productPnLTableData?.commissionExpense || {};
  const allLoanLossProvisionsData = results.productPnLTableData?.loanLossProvisions || {};
  const allECLMovementsData = results.productPnLTableData?.eclMovements || {};
  const allCreditImpairmentData = results.productPnLTableData?.creditImpairment || {};
  
  // For Digital division, ensure all digital products are in productResults
  if (divisionKey === 'digital') {
    const digitalProductKeys = ['digitalBankAccount', 'premiumDigitalBankAccount', 'depositAccount'];
    digitalProductKeys.forEach(key => {
      if (!productResults[key]) {
        const product = assumptions.products?.[key];
        if (product) {
          productResults[key] = {
            name: product.name || key,
            productName: product.name || key,
            quarterly: {}
          };
        }
      }
    });
  }
  
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
    // Check if this is a digital product (format: "digital_productName")
    if (key.startsWith('digital_') && divisionKey === 'digital') {
      const productKey = key.replace('digital_', '');
      if (!productPnLData[productKey]) {
        productPnLData[productKey] = {
          name: expenseData.productName || productKey.replace(/([A-Z])/g, ' $1').trim(),
          quarterly: {}
        };
      }
      productPnLData[productKey].quarterly = productPnLData[productKey].quarterly || {};
      productPnLData[productKey].quarterly.interestExpense = expenseData.quarterlyFTPBonis || Array(40).fill(0);
      productPnLData[productKey].quarterly.interestExpenseTotal = expenseData.quarterlyFTPTotal || Array(40).fill(0);
      // Add duration breakdown if available
      if (expenseData.quarterlyByDuration) {
        productPnLData[productKey].quarterly.interestExpenseByDuration = expenseData.quarterlyByDuration;
      }
    } else {
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
    }
  });
  
  // Merge commission income data into product P&L data
  Object.entries(allCommissionIncomeData).forEach(([key, commissionData]) => {
    // For digital division, check against known digital products
    let isDivisionProduct = false;
    if (divisionKey === 'digital') {
      const digitalProducts = ['digitalBankAccount', 'premiumDigitalBankAccount', 'depositAccount', 'wealthReferralFees'];
      isDivisionProduct = digitalProducts.includes(key);
    } else if (divisionKey === 'tech') {
      // For Tech division, include tech-prefixed products
      const techProducts = ['techExternalServices', 'techInfrastructure', 'techSoftwareLicenses', 
                           'techDevelopmentProjects', 'techCloudServices', 'techMaintenanceSupport'];
      isDivisionProduct = techProducts.includes(key) || key.startsWith('tech');
    } else {
      // For wealth division, exclude wealthReferralFees as they are costs, not income
      if (divisionKey === 'wealth' && key === 'wealthReferralFees') {
        isDivisionProduct = false;
      } else {
        isDivisionProduct = key.startsWith(divisionKey);
      }
    }
    
    if (isDivisionProduct) {
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
  
  // For wealth division, add all fee type entries to productPnLData
  if (divisionKey === 'wealth') {
    // Add all wealth commission income entries with suffixes
    Object.entries(allCommissionIncomeData).forEach(([key, commissionData]) => {
      if (key.startsWith('wealth') && (
        key.endsWith('_consultationFees') || 
        key.endsWith('_structuringFees') || 
        key.endsWith('_managementFees') || 
        key.endsWith('_carriedInterest')
      )) {
        productPnLData[key] = commissionData;
      }
    });
  }
  
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{divisionDisplayName || divisionKey}</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
          Vista Trimestrale (40 Trimestri)
        </div>
      </div>
      
      {/* Financial Statements Only */}
      
      {/* Balance Sheet Section */}
      <div className="mb-8">
        <StandardBalanceSheet
          divisionResults={divisionResults}
          productResults={productResults}
          assumptions={assumptions}
          globalResults={results}
          divisionName={divisionKey}
          showProductDetail={showProductDetail}
          customRowTransformations={customTransformations.balanceSheet}
        />
      </div>
      
      {/* P&L Section */}
      <div className="mb-8">
        <StandardPnL
          divisionResults={divisionResults}
          productResults={productPnLData}
          assumptions={assumptions}
          globalResults={results}
          divisionName={divisionKey}
          showProductDetail={showProductDetail}
          customRowTransformations={customTransformations.pnl}
        />
      </div>
      
      {/* Capital Requirements Section */}
      <div className="mb-8">
        <StandardCapitalRequirements
          divisionResults={divisionResults}
          productResults={productResults}
          assumptions={assumptions}
          globalResults={results}
          divisionName={divisionKey}
          showProductDetail={showProductDetail}
          customRowTransformations={customTransformations.capitalRequirements}
        />
      </div>
      
      {/* KPIs Section */}
      <div className="mb-8">
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
    </div>
  );
};

export default StandardDivisionSheet;