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
      'LLPs',
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
            visualizationLevel: 5,
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
            visualizationLevel: 5,
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
                  visualizationLevel: 5,
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
                visualizationLevel: 5,
                formula: null
              });
            }
          });
        });
      } else if (divisionName === 'tech') {
        // For Tech division, show IT service revenues
        // Check if we should show product detail
        if (showProductDetail !== false) {
          // Try to get Tech P&L results from various sources
          const techPnLResults = globalResults?.pnl?.details?.techPnLResults || 
                               globalResults?.divisions?.tech?.techPnLResults ||
                               divisionResults?.techPnLResults;
          
          console.log('=== TECH P&L DEBUG ===');
          console.log('1. divisionResults:', divisionResults);
          console.log('2. divisionResults.techPnLResults:', divisionResults?.techPnLResults);
          console.log('3. globalResults.pnl.details.techPnLResults:', globalResults?.pnl?.details?.techPnLResults);
          console.log('4. globalResults.divisions:', globalResults?.divisions);
          console.log('5. Final techPnLResults:', techPnLResults);
          console.log('6. Tech Commission Income Total:', divisionResults?.pnl?.quarterly?.commissionIncome);
          
          // If we have detailed Tech P&L results, extract product-level revenue
          if (techPnLResults?.quarterly && techPnLResults.quarterly.length > 0) {
            // External Services
            const externalRevenue = techPnLResults.quarterly.map(q => q.externalServiceRevenue?.totalRevenue || 0);
            console.log('External IT Services revenue:', externalRevenue);
            rows.push({
              label: '  External IT Services',
              data: externalRevenue,
              decimals: 2,
              isDetail: true,
              level: 3,
              visualizationLevel: 3,
              formula: null
            });
            
            // Get divisions list for consistent ordering
            const divisions = ['central', 'digital', 'general', 'incentive', 'realEstate', 'sme', 'treasury', 'wealth'];
            const divisionLabels = {
              central: 'Central',
              digital: 'Digital', 
              general: 'General',
              incentive: 'Incentive',
              realEstate: 'Real Estate',
              sme: 'SME',
              treasury: 'Treasury',
              wealth: 'Wealth'
            };
            
            // Debug: Check the costs and markup
            if (techPnLResults.quarterly[0]) {
              console.log('Tech Q1 Costs:', {
                infrastructure: techPnLResults.quarterly[0].depreciation?.infrastructureDepreciation,
                software: techPnLResults.quarterly[0].operatingCosts?.softwareLicensesOpex,
                cloud: techPnLResults.quarterly[0].operatingCosts?.cloudServices,
                maintenance: techPnLResults.quarterly[0].operatingCosts?.maintenanceSupport
              });
              console.log('Total Allocation Revenue:', techPnLResults.quarterly[0].internalAllocationRevenue?.totalAllocationRevenue);
              console.log('Total Markup Revenue:', techPnLResults.quarterly[0].internalAllocationRevenue?.totalMarkupRevenue);
            }
            
            // Internal Allocation Revenue by Product Type with Division Detail
            // Show revenue by product type, then breakdown by division
            const productTypes = ['infrastructure', 'software', 'development', 'cloud', 'maintenance'];
            const productLabels = {
              infrastructure: 'Infrastructure & Hardware',
              software: 'Software & Licenses',
              development: 'Development Projects',
              cloud: 'Cloud Services',
              maintenance: 'Maintenance & Support'
            };
            
            productTypes.forEach(productType => {
              // Calculate total revenue for this product across all divisions
              const productTotalRevenue = techPnLResults.quarterly.map(q => {
                let totalProductRevenue = 0;
                if (q.internalAllocationRevenue?.allocationByDivision) {
                  Object.values(q.internalAllocationRevenue.allocationByDivision).forEach(div => {
                    if (div.breakdown?.[productType]) {
                      totalProductRevenue += div.breakdown[productType].total || 0;
                    }
                  });
                }
                return totalProductRevenue;
              });
              
              if (productTotalRevenue.some(v => v !== 0)) {
                // Collect division rows for this product
                const divisionRows = [];
                divisions.forEach(division => {
                  const divisionProductRevenue = techPnLResults.quarterly.map(q => {
                    if (q.internalAllocationRevenue?.allocationByDivision?.[division]?.breakdown?.[productType]) {
                      return q.internalAllocationRevenue.allocationByDivision[division].breakdown[productType].total || 0;
                    }
                    return 0;
                  });
                  
                  if (divisionProductRevenue.some(v => v !== 0)) {
                    divisionRows.push({
                      label: `- da ${divisionLabels[division]}`,
                      data: divisionProductRevenue,
                      decimals: 2,
                      isDetail: true,
                      level: 4,
                      visualizationLevel: 5,
                      formula: null
                    });
                  }
                });
                
                // Add product total row with subRows
                rows.push({
                  label: `  ${productLabels[productType]}`,
                  data: productTotalRevenue,
                  decimals: 2,
                  isDetail: true,
                  level: 3,
                  visualizationLevel: 4, // Gray background for product groups
                  formula: null,
                  subRows: divisionRows
                });
              }
            });
            
            // Debug logging for division breakdown
            console.log('Tech Revenue by Division Q1:');
            divisions.forEach(division => {
              const q1Revenue = techPnLResults.quarterly[0]?.internalAllocationRevenue?.allocationByDivision?.[division]?.totalCharge || 0;
              if (q1Revenue > 0) {
                console.log(`- ${divisionLabels[division]}:`, q1Revenue);
              }
            });
            console.log('- External IT Services:', externalRevenue[0] || 0);
            console.log('- Total Internal Allocation:', techPnLResults.quarterly[0]?.internalAllocationRevenue?.totalAllocationRevenue);
            console.log('- Commission Income Total:', divisionResults?.pnl?.quarterly?.commissionIncome?.[0]);
          } else {
            // Fall back to total if no detailed data
            const techCommissionIncome = divisionResults?.pnl?.quarterly?.commissionIncome;
            if (techCommissionIncome && techCommissionIncome.some(v => v !== 0)) {
              rows.push({
                label: '  IT Services Revenue',
                data: techCommissionIncome,
                decimals: 2,
                isDetail: true,
                level: 3,
                visualizationLevel: 5,
                formula: null
              });
            }
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
              visualizationLevel: 5,
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
            visualizationLevel: 5,
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
            visualizationLevel: 5,
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
            visualizationLevel: 5,
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
            visualizationLevel: 5,
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
              visualizationLevel: 5,
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

  // Simplified P&L Rows - Totals First Structure
  const pnlRows = [
    // TOTAL REVENUES (Level 1)
    {
      label: 'Total Revenues',
      data: null, // Will be calculated from subRows
      decimals: 2,
      isSubTotal: true,
      formula: null,
      subRows: [
        // NET INTEREST INCOME (Level 2)
        {
          label: 'Net Interest Income',
          data: null, // Will be calculated from subRows
          decimals: 2,
          isSubTotal: true,
          formula: null,
          subRows: [
            // Interest Income (Level 3)
            {
              label: 'Interest Income',
              data: null, // Will be calculated from subRows
              decimals: 2,
              isHeader: true,
              formula: null,
              subRows: productRows
            },
            // Interest Expenses (Level 3)
            {
              label: 'FTP',
              data: null, // Will be calculated from subRows
              decimals: 2,
              isHeader: true,
              formula: null,
              subRows: ftpProductRows
            }
          ]
        },
        // NET COMMISSION INCOME (Level 2)
        {
          label: 'Net Commission Income',
          data: null, // Will be calculated from subRows
          decimals: 2,
          isSubTotal: true,
          formula: null,
          subRows: [
            // Commission Income (Level 3)
            {
              label: 'Commission Income',
              data: null, // Will be calculated from subRows
              decimals: 2,
              isHeader: true,
              formula: null,
              subRows: commissionIncomeProductRows
            },
            // Commission Expenses (Level 3)
            {
              label: 'Commission Expenses',
              data: null, // Will be calculated from subRows
              decimals: 2,
              isHeader: true,
              formula: null,
              subRows: commissionExpenseProductRows
            }
          ]
        }
      ]
    },
    // LLPs (Level 1)
    {
      label: 'LLPs',
      data: null, // Will be calculated from subRows
      decimals: 2,
      isSubTotal: true,
      formula: null,
      subRows: [
        // ECL Movement (Level 2)
        {
          label: 'ECL Movement',
          data: null, // Will be calculated from subRows
          decimals: 2,
          formula: null,
          subRows: eclProductRows
        },
        // Credit Impairment (Level 2)
        {
          label: 'Credit Impairment',
          data: null, // Will be calculated from subRows
          decimals: 2,
          formula: null,
          subRows: creditImpairmentProductRows
        }
      ]
    },
    // TOTAL OPEX (Level 1)
    {
      label: 'Total OPEX',
      data: null, // Will be calculated from subRows
      decimals: 2,
      isSubTotal: true,
      formula: null,
      subRows: [
        // Personnel Costs (Level 2)
        {
          label: 'Personnel Costs',
          data: personnelCostRows.length > 0 ? null : (divisionResults?.pnl?.quarterly?.personnelCosts ?? placeholderData),
          decimals: 2,
          isHeader: true,
          formula: null,
          subRows: personnelCostRows
        },
        // Other OPEX (Level 2)
        {
          label: 'Other OPEX',
          data: (() => {
            // For Digital division, get from operatingCosts
            if (divisionName === 'digital' && divisionResults?.operatingCosts?.total?.quarterly) {
              return divisionResults.operatingCosts.total.quarterly;
            }
            // For Tech division, get from techPnLResults (include depreciation)
            if (divisionName === 'tech' && globalResults?.pnl?.details?.techPnLResults?.quarterly) {
              return globalResults.pnl.details.techPnLResults.quarterly.map(q => {
                const opex = q.operatingCosts?.totalOperatingCosts || 0;
                const depreciation = q.depreciation?.totalDepreciation || 0;
                return opex + depreciation;
              });
            }
            return divisionResults?.pnl?.quarterly?.otherOpex ?? placeholderData;
          })(),
          decimals: 2,
          isHeader: true,
          formula: null,
          subRows: [
            // Add wealth referral fees detail rows if wealth division
            ...(divisionName === 'wealth' && showProductDetail ? wealthReferralFeesRows : []),
            // Add tech OPEX subrows
            ...(showProductDetail && divisionName === 'tech' && globalResults?.pnl?.details?.techPnLResults?.quarterly ? (() => {
      const techPnLResults = globalResults.pnl.details.techPnLResults;
      const rows = [];
      
      // Cloud Services
      const cloudServicesData = techPnLResults.quarterly.map(q => q.operatingCosts?.cloudServices || 0);
      if (cloudServicesData.some(v => v !== 0)) {
        rows.push({
          label: '  • Cloud Services',
          data: cloudServicesData,
          decimals: 2,
          isDetail: true,
          visualizationLevel: 5,
          formula: null
        });
      }
      
      // Maintenance & Support
      const maintenanceData = techPnLResults.quarterly.map(q => q.operatingCosts?.maintenanceSupport || 0);
      if (maintenanceData.some(v => v !== 0)) {
        rows.push({
          label: '  • Maintenance & Support',
          data: maintenanceData,
          decimals: 2,
          isDetail: true,
          visualizationLevel: 5,
          formula: null
        });
      }
      
      // Software Licenses OPEX
      const softwareOpexData = techPnLResults.quarterly.map(q => q.operatingCosts?.softwareLicensesOpex || 0);
      if (softwareOpexData.some(v => v !== 0)) {
        rows.push({
          label: '  • Software Licenses OPEX',
          data: softwareOpexData,
          decimals: 2,
          isDetail: true,
          visualizationLevel: 5,
          formula: null
        });
      }
      
      // External Service Costs
      const externalServicesData = techPnLResults.quarterly.map(q => q.operatingCosts?.externalServiceCosts || 0);
      if (externalServicesData.some(v => v !== 0)) {
        rows.push({
          label: '  • External Service Costs',
          data: externalServicesData,
          decimals: 2,
          isDetail: true,
          visualizationLevel: 5,
          formula: null
        });
      }
      
      // Infrastructure Depreciation
      const infraDepData = techPnLResults.quarterly.map(q => q.depreciation?.infrastructureDepreciation || 0);
      if (infraDepData.some(v => v !== 0)) {
        rows.push({
          label: '  • Infrastructure Depreciation',
          data: infraDepData,
          decimals: 2,
          isDetail: true,
          visualizationLevel: 5,
          formula: null
        });
      }
      
      // Software Licenses Depreciation
      const softwareDepData = techPnLResults.quarterly.map(q => q.depreciation?.softwareDepreciation || 0);
      if (softwareDepData.some(v => v !== 0)) {
        rows.push({
          label: '  • Software Licenses Depreciation',
          data: softwareDepData,
          decimals: 2,
          isDetail: true,
          visualizationLevel: 5,
          formula: null
        });
      }
      
      // Development Depreciation
      const devDepData = techPnLResults.quarterly.map(q => q.depreciation?.developmentDepreciation || 0);
      if (devDepData.some(v => v !== 0)) {
        rows.push({
          label: '  • Development Depreciation',
          data: devDepData,
          decimals: 2,
          isDetail: true,
          visualizationLevel: 5,
          formula: null
        });
      }
      
      return rows;
    })() : []),
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
                  visualizationLevel: 5,
                  formula: null
                };
              })] : [])
          ]
        }
      ]
    },
    // PBT (Level 1)
    {
      label: 'PBT',
      data: null, // Will be calculated as Total Revenues - LLPs - Total OPEX
      decimals: 2,
      isSubTotal: true,
      formula: 'Total Revenues - LLPs - Total OPEX',
      sumFromRows: ['Total Revenues', 'LLPs', 'Total OPEX'],
      sumOperation: 'custom' // This will trigger special handling in FinancialTable
    }
  ];

  // Apply transformations, calculate sums, and filter out zero rows recursively
  const transformAndFilterRows = (rows) => {
    return rows.map(row => {
      const transformation = customRowTransformations[row.label];
      const baseRow = transformation ? { ...row, ...transformation } : row;
      
      // Apply visualization level only if not already set
      const transformedRow = {
        ...baseRow,
        visualizationLevel: baseRow.visualizationLevel || getVisualizationLevel(baseRow.label)
      };
      
      // If row has subRows, transform and filter them recursively FIRST
      if (transformedRow.subRows) {
        transformedRow.subRows = transformAndFilterRows(transformedRow.subRows);
        
        // After processing subRows, calculate sum if needed
        // Calculate sum if:
        // 1. Row has data set to null (explicitly wants sum)
        // 2. Row has empty data or all zeros AND has subRows with data
        if (transformedRow.subRows.length > 0) {
          const shouldCalculateSum = transformedRow.data === null || 
                                    (!transformedRow.data || transformedRow.data.every(v => v === 0));
          
          if (shouldCalculateSum) {
            // Initialize sum array
            const sumData = new Array(quarters).fill(0);
            
            // Sum only direct children, not recursive
            const sumDirectChildren = (subRows) => {
              subRows.forEach(subRow => {
                if (subRow.data && Array.isArray(subRow.data)) {
                  // Debug logging for important rows
                  if (transformedRow.label === 'Net Interest Income' || 
                      transformedRow.label === 'Total Revenues' ||
                      transformedRow.label === 'Interest Income' ||
                      transformedRow.label === 'FTP') {
                    console.log(`[${transformedRow.label}] Summing direct child ${subRow.label}:`, {
                      firstValues: subRow.data?.slice(0, 4)
                    });
                  }
                  
                  // Just sum the values as they are (FTP should already be negative)
                  subRow.data.forEach((value, index) => {
                    sumData[index] += (value || 0);
                  });
                }
                // DO NOT sum grandchildren - they're already included in the child's sum
              });
            };
            
            sumDirectChildren(transformedRow.subRows);
            
            // Debug final result for important rows
            if (transformedRow.label === 'Net Interest Income' || 
                transformedRow.label === 'Interest Income' ||
                transformedRow.label === 'FTP') {
              console.log(`${transformedRow.label} final sum:`, sumData.slice(0, 4));
              console.log(`${transformedRow.label} subRows:`, transformedRow.subRows.map(sr => ({
                label: sr.label,
                hasData: !!sr.data,
                firstValues: sr.data?.slice(0, 4)
              })));
            }
            
            transformedRow.data = sumData;
          }
        } else if (transformedRow.data === null) {
          // If no subRows but data is null, use placeholder
          transformedRow.data = new Array(quarters).fill(0);
        }
      }
      
      return transformedRow;
    }).filter(row => {
      // Always keep subtotals and level 1 items (main aggregates)
      if (row.isSubTotal || row.visualizationLevel === 1) {
        return true;
      }
      
      // Check if row has non-zero values
      const hasNonZeroValues = Array.isArray(row.data) && row.data.some(v => v !== 0);
      
      // Check if row has non-zero children
      const hasNonZeroChildren = row.subRows && row.subRows.length > 0;
      
      return hasNonZeroValues || hasNonZeroChildren;
    });
  };
  
  const transformedRows = transformAndFilterRows(pnlRows);
  
  // Second pass: Calculate rows that depend on other rows (like PBT)
  const finalRows = transformedRows.map(row => {
    if (row.calculateFromOtherRows) {
      const newData = new Array(quarters).fill(0);
      
      // Find the rows we need
      const findRowByLabel = (rows, label) => {
        for (let r of rows) {
          if (r.label === label) return r;
        }
        return null;
      };
      
      if (row.label === 'PBT') {
        const totalRevenues = findRowByLabel(transformedRows, 'Total Revenues');
        const llps = findRowByLabel(transformedRows, 'LLPs');
        const totalOpex = findRowByLabel(transformedRows, 'Total OPEX');
        
        if (totalRevenues?.data && llps?.data && totalOpex?.data) {
          for (let i = 0; i < quarters; i++) {
            newData[i] = (totalRevenues.data[i] || 0) - (llps.data[i] || 0) - (totalOpex.data[i] || 0);
          }
        }
      }
      
      return { ...row, data: newData };
    }
    return row;
  });

  return <FinancialTable title="2. Conto Economico" rows={finalRows} />;
};

export default StandardPnL;