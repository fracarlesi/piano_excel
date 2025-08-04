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

  // Helper function to determine visualization level based on row label
  const getVisualizationLevel = (label) => {
    // Level 1 (cyan-100) - Main aggregates
    const level1Items = [
      'Total Revenues',
      'Loan Loss Provisions',
      'Net Revenues',
      'Total OPEX',
      'PBT'
    ];
    
    // Level 2 (cyan-50) - Sub-aggregates
    const level2Items = [
      'Net Interest Income',
      'Net Commission Income',
      'Personnel Costs',
      'Other OPEX'
    ];
    
    // Level 3 (cyan-25 - very light cyan) - Section headers
    const level3Items = [
      'Interest Income',
      'FTP',
      'Commission Income',
      'Commission Expenses',
      '  ECL Movement',
      '  Credit Impairment'
    ];
    
    // Level 4 (white) - All product details and sub-items
    
    if (level1Items.includes(label)) return 1;
    if (level2Items.includes(label)) return 2;
    if (level3Items.includes(label)) return 3;
    return 4; // Default to level 4 (white) for all product details
  };

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
            level: 3,
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
            level: 3,
            formula: null
          });
          
          // Check for deposit duration breakdown (for Digital deposit accounts)
          if (productData.quarterly?.interestExpenseByDuration) {
            const durationLabels = {
              'sight': 'A vista',
              '6_months': 'Vincolato 6 mesi',
              '12_months': 'Vincolato 12 mesi',
              '18_months': 'Vincolato 18 mesi',
              '24_months': 'Vincolato 24 mesi',
              '36_months': 'Vincolato 36 mesi',
              '48_months': 'Vincolato 48 mesi',
              '60_months': 'Vincolato 60 mesi'
            };
            
            Object.entries(productData.quarterly.interestExpenseByDuration).forEach(([duration, durationData]) => {
              if (durationData && durationData.some(v => v !== 0)) {
                rows.push({
                  label: `    • ${durationLabels[duration] || duration}`,
                  data: durationData,
                  decimals: 2,
                  isDetail: true,
                  isSubRow: true,
                  level: 3,
                  formula: null
                });
              }
            });
          }
        }
      });
    }
    
    return rows;
  };

  // Build product rows for Commission Income section
  const buildCommissionIncomeProductRows = () => {
    const rows = [];
    
    if (showProductDetail && productResults) {
      // For wealth division, we need to handle special fee breakdown
      if (divisionName === 'wealth') {
        const wealthProducts = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthIncentiveFund'];
        const feeTypes = [
          { suffix: '_consultationFees', label: 'Consultation Fees' },
          { suffix: '_structuringFees', label: 'Structuring Fees' },
          { suffix: '_managementFees', label: 'Management Fees' },
          { suffix: '_carriedInterest', label: 'Carried Interest' }
        ];
        
        wealthProducts.forEach(baseProductKey => {
          // Get product name
          const productName = productResults[baseProductKey]?.name || 
                            productResults[baseProductKey]?.productName ||
                            baseProductKey.replace('wealth', 'Wealth ').replace(/([A-Z])/g, ' $1').trim();
          
          // Add each fee type
          feeTypes.forEach(({ suffix, label }) => {
            const feeKey = baseProductKey + suffix;
            const feeData = productResults[feeKey];
            
            if (feeData && Array.isArray(feeData) && feeData.some(v => v !== 0)) {
              // Check if data needs conversion to millions
              const needsConversion = feeData.some(v => Math.abs(v) > 1000);
              const displayData = needsConversion ? 
                feeData.map(v => v / 1000000) : 
                feeData;
              
              rows.push({
                label: `  ${productName} - ${label}`,
                data: displayData,
                decimals: 2,
                isDetail: true,
                level: 3,
                formula: null
              });
            }
          });
        });
      } else if (divisionName === 'tech') {
        // For Tech division, add external service revenue
        // Try different paths to find Tech P&L results
        const techPnL = globalResults?.techPnL || 
                       globalResults?.pnl?.details?.techPnLResults ||
                       globalResults?.pnl?.byDivision?.tech;
        
        console.log('Tech P&L data:', techPnL);
        console.log('Global results:', globalResults);
        console.log('PnL details:', globalResults?.pnl?.details);
        console.log('Division results:', divisionResults);
        console.log('Show product detail:', showProductDetail);
        
        const techQuarterly = techPnL?.quarterly;
        
        // Add external service revenue
        if (techQuarterly && techQuarterly.length > 0 && techQuarterly[0].externalServiceRevenue) {
          const externalRevenue = techQuarterly.map(q => q.externalServiceRevenue.totalRevenue);
          if (externalRevenue.some(v => v !== 0)) {
            rows.push({
              label: '  External IT Services',
              data: externalRevenue,
              decimals: 2,
              isDetail: true,
              level: 3,
              formula: null
            });
          }
        }
        
        // Add internal allocation revenue (with markup)
        if (techQuarterly && techQuarterly.length > 0 && techQuarterly[0].internalAllocationRevenue) {
          const allocationRevenue = techQuarterly.map(q => q.internalAllocationRevenue.totalAllocationRevenue);
          if (allocationRevenue.some(v => v !== 0)) {
            rows.push({
              label: '  IT Cost Allocation (with markup)',
              data: allocationRevenue,
              decimals: 2,
              isDetail: true,
              level: 3,
              formula: null
            });
          }
        }
      } else {
        // For other divisions, use standard logic
        Object.entries(productResults).forEach(([productKey, productData]) => {
          // Get the quarterly commission income data
          const commissionIncomeData = productData.quarterly?.commissionIncome || 
                                      productData.quarterlyCommissionIncome ||
                                      null;
          
          if (commissionIncomeData && Array.isArray(commissionIncomeData) && commissionIncomeData.some(v => v !== 0)) {
            const productName = productData.name || productData.productName || productKey.replace('_NPL', '');
            
            // Check if data needs conversion to millions
            // If values are > 1000, they're likely in euros and need conversion
            const needsConversion = commissionIncomeData.some(v => Math.abs(v) > 1000);
            const displayData = needsConversion ? 
              commissionIncomeData.map(v => v / 1000000) : 
              commissionIncomeData;
            
            rows.push({
              label: `  ${productName}`,
              data: displayData,
              decimals: 2,
              isDetail: true,
              level: 3,
              formula: null
            });
          }
        });
      }
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
            level: 3,
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
            level: 3,
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
            level: 3,
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
            level: 3,
            formula: null
          });
        }
      });
    }
    
    return rows;
  };

  // Build Wealth Referral Fees rows
  const buildWealthReferralFeesRows = () => {
    const rows = [];
    
    if (divisionName === 'wealth' && showProductDetail) {
      
      // Check for referral fees data in various locations
      let referralFeesData = null;
      
      if (divisionResults?.operatingCosts?.breakdown?.referralFeesToDigital?.quarterly?.byProduct) {
        referralFeesData = divisionResults.operatingCosts.breakdown.referralFeesToDigital.quarterly.byProduct;
      } else if (globalResults?.pnl?.details?.wealthPnLResults?.byComponent?.referralFees?.quarterly?.byProduct) {
        referralFeesData = globalResults.pnl.details.wealthPnLResults.byComponent.referralFees.quarterly.byProduct;
      }
      
      if (referralFeesData) {
        const wealthProductKeys = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthIncentiveFund'];
        
        wealthProductKeys.forEach(productKey => {
          const productData = referralFeesData[productKey];
          if (productData && productData.some(v => v !== 0)) {
            // Get product name consistent with commission income
            const productName = productResults[productKey]?.name || 
                              productResults[productKey]?.productName ||
                              productKey.replace('wealth', 'Wealth ').replace(/([A-Z])/g, ' $1').trim();
            
            const rowData = productData.map(v => -Math.abs(v) / 1000000);
            rows.push({
              label: `  ${productName} - Referral Fees to Digital`,
              data: rowData,
              decimals: 2,
              isDetail: true,
              level: 3,
              formula: null
            });
          }
        });
      }
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
  const wealthReferralFeesRows = buildWealthReferralFeesRows();

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
      level: 1,
      formula: null
    },
    {
      label: '  ECL Movement',
      data: calculateECLSubtotal(),
      decimals: 2,
      formula: null
    },
    // Insert ECL product detail rows here
    ...eclProductRows,
    {
      label: '  Credit Impairment',
      data: calculateCreditImpairmentSubtotal(),
      decimals: 2,
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
      data: (() => {
        // For Digital division, get from operatingCosts
        if (divisionName === 'digital' && divisionResults?.operatingCosts?.total?.quarterly) {
          return divisionResults.operatingCosts.total.quarterly;
        }
        return divisionResults?.pnl?.quarterly?.otherOpex ?? placeholderData;
      })(),
      decimals: 2,
      isHeader: true,
      formula: null
    },
    // Add wealth referral fees detail rows if wealth division
    ...(divisionName === 'wealth' && showProductDetail ? wealthReferralFeesRows : []),
    // Add digital OPEX subrows
    ...(showProductDetail && divisionName === 'digital' && divisionResults?.operatingCosts?.breakdown?.customerAcquisitionCost ? [{
      label: '  • Customer Acquisition Cost',
      data: divisionResults.operatingCosts.breakdown.customerAcquisitionCost.total.quarterly,
      decimals: 2,
      isDetail: true,
      formula: null
    }, ...Object.entries(divisionResults.operatingCosts.breakdown.customerAcquisitionCost.byProduct || {})
      .filter(([productKey, productData]) => productData.quarterly && productData.quarterly.some(v => v !== 0))
      .map(([productKey, productData]) => {
        const product = assumptions.products?.[productKey];
        return {
          label: `    - ${product?.name || productKey}`,
          data: productData.quarterly,
          decimals: 2,
          isDetail: true,
          level: 3,
          formula: null
        };
      })] : []),
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

  // Apply custom row transformations and visualization levels
  const transformedRows = pnlRows.map(row => {
    const transformation = customRowTransformations[row.label];
    const baseRow = transformation ? { ...row, ...transformation } : row;
    
    // Apply visualization level
    return {
      ...baseRow,
      visualizationLevel: getVisualizationLevel(baseRow.label)
    };
  });

  return <FinancialTable title="2. Conto Economico" rows={transformedRows} />;
};

export default StandardPnL;