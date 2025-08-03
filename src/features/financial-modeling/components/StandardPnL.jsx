import React from 'react';
import FinancialTable from './FinancialTable';

/**
 * Standardized P&L structure for all divisions
 * TEMPORARILY SIMPLIFIED - Complex calculations commented out
 */
const StandardPnL = ({ 
  divisionResults, 
  productResults, 
  assumptions, 
  globalResults,
  divisionName,
  showProductDetail = true,
  customRowTransformations = {}
}) => {
  // Use quarterly data directly (40 quarters)
  const quarters = 40;
  const placeholderData = Array(quarters).fill(0);

  // Build product rows for Interest Income section
  const buildProductRows = () => {
    const rows = [];
    
    if (showProductDetail && productResults) {
      Object.entries(productResults).forEach(([productKey, productData]) => {
        // Check if this is an NPL product
        const isNPL = productKey.includes('_NPL');
        
        // Get the quarterly interest income data
        const quarterlyData = productData.quarterlyInterestIncome || 
                             productData.quarterlyInterestIncomePerforming || 
                             productData.quarterlyInterestIncomeNPL ||
                             productData.quarterlyData ||
                             productData.quarterly?.interestIncome ||
                             null;
        
        if (quarterlyData && quarterlyData.some(v => v !== 0)) {
          const productName = productData.name || productData.productName || productKey.replace('_NPL', '');
          const label = isNPL ? `  ${productName} - NPL` : `  ${productName}`;
          
          rows.push({
            label: label,
            data: quarterlyData,
            decimals: 2,
            isDetail: true,
            formula: null
          });
        }
      });
    }
    
    return rows;
  };

  // Build product rows for FTP section
  const buildFTPProductRows = () => {
    const rows = [];
    
    if (showProductDetail && productResults) {
      Object.entries(productResults).forEach(([productKey, productData]) => {
        // Check if this is an NPL product
        const isNPL = productKey.includes('_NPL');
        
        // Get the quarterly FTP/interest expense data
        const ftpData = productData.quarterly?.interestExpense || 
                       productData.quarterly?.interestExpenseTotal ||
                       (isNPL ? productData.quarterly?.interestExpenseNPL : productData.quarterly?.interestExpenseBonis) ||
                       null;
        
        if (ftpData && ftpData.some(v => v !== 0)) {
          const productName = productData.name || productData.productName || productKey.replace('_NPL', '');
          const label = isNPL ? `  ${productName} - NPL` : `  ${productName}`;
          
          rows.push({
            label: label,
            data: ftpData,
            decimals: 2,
            isDetail: true,
            formula: null
          });
        }
      });
    }
    
    return rows;
  };

  // Build product rows for Commission Income section
  const buildCommissionIncomeProductRows = () => {
    const rows = [];
    
    if (showProductDetail && productResults) {
      Object.entries(productResults).forEach(([productKey, productData]) => {
        // Get the quarterly commission income data
        const commissionIncomeData = productData.quarterly?.commissionIncome || 
                                    productData.quarterlyCommissionIncome ||
                                    null;
        
        if (commissionIncomeData && commissionIncomeData.some(v => v !== 0)) {
          const productName = productData.name || productData.productName || productKey.replace('_NPL', '');
          
          rows.push({
            label: `  ${productName}`,
            data: commissionIncomeData,
            decimals: 2,
            isDetail: true,
            formula: null
          });
        }
      });
    }
    
    return rows;
  };

  // Build product rows for Commission Expenses section
  const buildCommissionExpenseProductRows = () => {
    const rows = [];
    
    if (showProductDetail && productResults) {
      Object.entries(productResults).forEach(([productKey, productData]) => {
        // Get the quarterly commission expense data
        const commissionExpenseData = productData.quarterly?.commissionExpense || 
                                     productData.quarterlyCommissionExpense ||
                                     null;
        
        if (commissionExpenseData && commissionExpenseData.some(v => v !== 0)) {
          const productName = productData.name || productData.productName || productKey.replace('_NPL', '');
          
          rows.push({
            label: `  ${productName}`,
            data: commissionExpenseData,
            decimals: 2,
            isDetail: true,
            formula: null
          });
        }
      });
    }
    
    return rows;
  };

  // Build ECL product rows
  const buildECLProductRows = () => {
    const rows = [];
    
    if (showProductDetail && productResults) {
      Object.entries(productResults).forEach(([productKey, productData]) => {
        // Skip NPL products for ECL
        if (productKey.includes('_NPL')) return;
        
        // Get the quarterly ECL data
        const eclData = productData.quarterly?.eclMovement || 
                       productData.quarterlyECLMovement ||
                       null;
        
        if (eclData) {
          const productName = productData.name || productData.productName || productKey;
          
          rows.push({
            label: `    ${productName}`,
            data: eclData,
            decimals: 2,
            isDetail: true,
            formula: null
          });
        }
      });
    }
    
    return rows;
  };

  // Build Credit Impairment product rows
  const buildCreditImpairmentProductRows = () => {
    const rows = [];
    
    if (showProductDetail && productResults) {
      Object.entries(productResults).forEach(([productKey, productData]) => {
        // Only NPL products have credit impairment
        if (!productKey.includes('_NPL')) return;
        
        // Get the quarterly credit impairment data
        const impairmentData = productData.quarterly?.creditImpairment || 
                              productData.quarterlyCreditImpairment ||
                              null;
        
        if (impairmentData) {
          const productName = productData.name || productData.productName || productKey.replace('_NPL', '');
          // Don't add "- NPL" if the product name already contains "(NPL)" or "NPL"
          const label = productName.includes('NPL') || productName.includes('(NPL)') 
            ? `    ${productName}`
            : `    ${productName} - NPL`;
          
          rows.push({
            label: label,
            data: impairmentData,
            decimals: 2,
            isDetail: true,
            formula: null
          });
        }
      });
    }
    
    return rows;
  };

  // Build Personnel Cost rows by seniority
  const buildPersonnelCostRows = () => {
    const rows = [];
    
    if (showProductDetail && divisionResults?.pnl?.personnelCostsBySeniority) {
      const seniorities = [
        { key: 'junior', label: 'Junior' },
        { key: 'middle', label: 'Middle' },
        { key: 'senior', label: 'Senior' },
        { key: 'headOf', label: 'Head of' }
      ];
      
      seniorities.forEach(({ key, label }) => {
        const data = divisionResults.pnl.personnelCostsBySeniority[key];
        if (data && data.some(v => v !== 0)) {
          rows.push({
            label: `  ${label}`,
            data: data,
            decimals: 2,
            isDetail: true,
            formula: null
          });
        }
      });
    }
    
    return rows;
  };

  // Get product rows
  const productRows = buildProductRows();
  const ftpProductRows = buildFTPProductRows();
  const commissionIncomeProductRows = buildCommissionIncomeProductRows();
  const commissionExpenseProductRows = buildCommissionExpenseProductRows();
  const eclProductRows = buildECLProductRows();
  const creditImpairmentProductRows = buildCreditImpairmentProductRows();
  const personnelCostRows = buildPersonnelCostRows();

  // Calculate ECL Movement subtotal from product data
  const calculateECLSubtotal = () => {
    const subtotal = new Array(quarters).fill(0);
    if (showProductDetail && productResults) {
      Object.entries(productResults).forEach(([productKey, productData]) => {
        if (!productKey.includes('_NPL')) {
          const eclData = productData.quarterly?.eclMovement || 
                         productData.quarterlyECLMovement ||
                         null;
          if (eclData) {
            eclData.forEach((value, index) => {
              subtotal[index] += value || 0;
            });
          }
        }
      });
    }
    return subtotal;
  };

  // Calculate Credit Impairment subtotal from product data
  const calculateCreditImpairmentSubtotal = () => {
    const subtotal = new Array(quarters).fill(0);
    if (showProductDetail && productResults) {
      Object.entries(productResults).forEach(([productKey, productData]) => {
        if (productKey.includes('_NPL')) {
          const impairmentData = productData.quarterly?.creditImpairment || 
                                productData.quarterlyCreditImpairment ||
                                null;
          if (impairmentData) {
            impairmentData.forEach((value, index) => {
              subtotal[index] += value || 0;
            });
          }
        }
      });
    }
    return subtotal;
  };

  // Calculate Total LLP as sum of ECL and Credit Impairment
  const calculateTotalLLP = () => {
    const eclSubtotal = calculateECLSubtotal();
    const creditImpairmentSubtotal = calculateCreditImpairmentSubtotal();
    return eclSubtotal.map((ecl, index) => ecl + creditImpairmentSubtotal[index]);
  };

  // Simplified P&L Rows
  const pnlRows = [
    // INTEREST INCOME SECTION
    {
      label: 'Interest Income',
      data: divisionResults?.pnl?.quarterly?.interestIncome ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null
    },
    // Insert product detail rows here
    ...productRows,
    // INTEREST EXPENSES SECTION
    {
      label: 'FTP',
      data: divisionResults?.pnl?.quarterly?.interestExpenses ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null
    },
    // Insert FTP product detail rows here
    ...ftpProductRows,
    {
      label: 'Net Interest Income',
      data: divisionResults?.pnl?.quarterly?.netInterestIncome ?? placeholderData,
      decimals: 2,
      isSubTotal: true,
      formula: null
    },
    // COMMISSION INCOME/EXPENSES
    {
      label: 'Commission Income',
      data: divisionResults?.pnl?.quarterly?.commissionIncome ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null
    },
    // Insert commission income product detail rows here
    ...commissionIncomeProductRows,
    {
      label: 'Commission Expenses',
      data: divisionResults?.pnl?.quarterly?.commissionExpenses ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null
    },
    // Insert commission expense product detail rows here
    ...commissionExpenseProductRows,
    {
      label: 'Net Commission Income',
      data: divisionResults?.pnl?.quarterly?.netCommissions ?? placeholderData,
      decimals: 2,
      isSubTotal: true,
      formula: null
    },
    {
      label: 'Total Revenues',
      data: divisionResults?.pnl?.quarterly?.totalRevenues ?? placeholderData,
      decimals: 2,
      isSubTotal: true,
      bgColor: 'lightgreen',
      formula: null
    },
    // LLP SECTION
    {
      label: 'Loan Loss Provisions',
      data: calculateTotalLLP(),
      decimals: 2,
      isHeader: true,
      formula: null
    },
    {
      label: '  ECL Movement',
      data: calculateECLSubtotal(),
      decimals: 2,
      isSecondarySubTotal: true,
      formula: null
    },
    // Insert ECL product detail rows here
    ...eclProductRows,
    {
      label: '  Credit Impairment',
      data: calculateCreditImpairmentSubtotal(),
      decimals: 2,
      isSecondarySubTotal: true,
      formula: null
    },
    // Insert Credit Impairment product detail rows here
    ...creditImpairmentProductRows,
    {
      label: 'Net Revenues',
      data: divisionResults?.pnl?.quarterly?.netRevenues ?? placeholderData,
      decimals: 2,
      isSubTotal: true,
      formula: null
    },
    // OPERATING EXPENSES
    {
      label: 'Personnel Costs',
      data: divisionResults?.pnl?.quarterly?.personnelCosts ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null
    },
    // Insert personnel cost detail rows here
    ...personnelCostRows,
    {
      label: 'Other OPEX',
      data: divisionResults?.pnl?.quarterly?.otherOpex ?? placeholderData,
      decimals: 2,
      isHeader: true,
      formula: null
    },
    {
      label: 'Total OPEX',
      data: divisionResults?.pnl?.quarterly?.totalOpex ?? placeholderData,
      decimals: 2,
      isSubTotal: true,
      formula: null
    },
    {
      label: 'PBT',
      data: divisionResults?.pnl?.quarterly?.pbt ?? placeholderData,
      decimals: 2,
      isSubTotal: true,
      bgColor: 'lightblue',
      formula: null
    }
  ];

  // Apply custom row transformations
  const transformedRows = pnlRows.map(row => {
    const transformation = customRowTransformations[row.label];
    if (transformation) {
      return { ...row, ...transformation };
    }
    return row;
  });

  return <FinancialTable title="2. Conto Economico" rows={transformedRows} />;
};

export default StandardPnL;