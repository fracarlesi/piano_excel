import React, { useState } from 'react';
import EditableNumberField from '../common/EditableNumberField';
import ProductManager from '../common/ProductManager';
import VolumeTable from '../common/VolumeTable';
import VolumeInputGrid from '../common/VolumeInputGrid';

/**
 * Base component for division-specific assumptions
 */
const DivisionAssumptions = ({ 
  divisionKey,
  divisionName,
  divisionIcon,
  assumptions, 
  onAssumptionChange,
  productKeys = []
}) => {
  // State for accordion management
  const [openProductKey, setOpenProductKey] = useState(null);
  
  // Handle accordion toggle
  const handleAccordionToggle = (productKey) => {
    setOpenProductKey(openProductKey === productKey ? null : productKey);
  };
  
  // Filter products for this division
  const divisionProducts = Object.fromEntries(
    Object.entries(assumptions.products || {}).filter(([key]) => 
      productKeys.length > 0 ? productKeys.includes(key) : key.startsWith(divisionKey)
    )
  );

  // General division assumptions - removed operatingAssetsRatio
  const generalAssumptions = [];

  // Product-specific assumptions
  const productAssumptions = Object.entries(divisionProducts).map(([productKey, product], index) => {
    
    // No common rows needed - product type is managed in ProductManager

    // Credit-specific assumptions
    const creditRows = [
      {
        parameter: 'Interest Rate Spread',
        description: 'Spread over EURIBOR',
        value: product.spread || 0,
        unit: '%',
        key: `products.${productKey}.spread`
      },
      {
        parameter: 'Cost of Funding',
        description: 'Cost of funding for this product',
        value: product.costOfFunding || assumptions.costOfFundsRate || 3.0,
        unit: '%',
        key: `products.${productKey}.costOfFunding`
      },
      {
        parameter: 'Loan Maturity',
        description: 'Contractual maturity of loans in years (used for amortization calculations)',
        value: product.durata || 5,
        unit: 'years',
        key: `products.${productKey}.durata`
      },
      {
        parameter: 'Grace Period Duration',
        description: 'Duration of grace period (pre-amortization) in years',
        value: product.gracePeriod || 0,
        unit: 'years',
        key: `products.${productKey}.gracePeriod`
      },
      {
        parameter: 'RWA Density',
        description: 'Risk-weighted assets density',
        value: product.rwaDensity || 75,
        unit: '%',
        key: `products.${productKey}.rwaDensity`
      },
      {
        parameter: 'Default Rate',
        description: 'Annual default rate',
        value: product.dangerRate || 1.5,
        unit: '%',
        key: `products.${productKey}.dangerRate`
      },
      {
        parameter: 'Loan-to-Value (LTV)',
        description: 'Maximum loan-to-value ratio',
        value: product.ltv || 80,
        unit: '%',
        key: `products.${productKey}.ltv`
      },
      {
        parameter: 'Recovery Costs',
        description: 'Costs for recovery procedures',
        value: product.recoveryCosts || 10,
        unit: '%',
        key: `products.${productKey}.recoveryCosts`
      },
      {
        parameter: 'Collateral Haircut',
        description: 'Haircut on collateral value',
        value: product.collateralHaircut || 15,
        unit: '%',
        key: `products.${productKey}.collateralHaircut`
      },
      {
        parameter: 'Average Loan Size',
        description: 'Average size per loan',
        value: product.avgLoanSize || 1.0,
        unit: '€M',
        key: `products.${productKey}.avgLoanSize`
      },
      {
        parameter: 'Credit Classification',
        description: 'Credit risk classification',
        value: product.creditClassification || 'Bonis',
        unit: 'text',
        key: `products.${productKey}.creditClassification`,
        options: ['Bonis', 'UTP']
      },
      {
        parameter: 'Interest Rate Type',
        description: 'Type of interest rate',
        value: product.isFixedRate ? 'Fixed' : 'Variable',
        unit: 'text',
        key: `products.${productKey}.isFixedRate`,
        options: ['Variable', 'Fixed'],
        isBoolean: true
      },
      {
        parameter: 'Loan Type',
        description: 'Amortization type',
        value: product.type || 'french',
        unit: 'text',
        key: `products.${productKey}.type`,
        options: ['bullet', 'french', 'interest-only']
      }
    ];

    // Commission-specific assumptions
    const commissionRows = [
      {
        parameter: 'Commission Rate',
        description: 'Commission rate on volume/transactions',
        value: product.commissionRate || 0,
        unit: '%',
        key: `products.${productKey}.commissionRate`
      },
      {
        parameter: 'Fee Income Rate',
        description: 'Recurring fee income rate',
        value: product.feeIncomeRate || 0,
        unit: '%',
        key: `products.${productKey}.feeIncomeRate`
      },
      {
        parameter: 'Setup Fee Rate',
        description: 'One-time setup/onboarding fee rate',
        value: product.setupFeeRate || 0,
        unit: '%',
        key: `products.${productKey}.setupFeeRate`
      },
      {
        parameter: 'Management Fee Rate',
        description: 'Annual management fee rate on AUM',
        value: product.managementFeeRate || 0,
        unit: '%',
        key: `products.${productKey}.managementFeeRate`
      },
      {
        parameter: 'Performance Fee Rate',
        description: 'Performance-based fee rate',
        value: product.performanceFeeRate || 0,
        unit: '%',
        key: `products.${productKey}.performanceFeeRate`
      },
      {
        parameter: 'Average Transaction Size',
        description: 'Average transaction/service size',
        value: product.avgTransactionSize || 0.001,
        unit: '€M',
        key: `products.${productKey}.avgTransactionSize`
      },
      {
        parameter: 'Annual Transactions',
        description: 'Number of transactions per year (thousands)',
        value: product.annualTransactions || 1000,
        unit: 'k units',
        key: `products.${productKey}.annualTransactions`
      },
      {
        parameter: 'Client Retention Rate',
        description: 'Annual client retention rate',
        value: product.clientRetentionRate || 90,
        unit: '%',
        key: `products.${productKey}.clientRetentionRate`
      },
      {
        parameter: 'Cross-Selling Rate',
        description: 'Cross-selling success rate',
        value: product.crossSellingRate || 15,
        unit: '%',
        key: `products.${productKey}.crossSellingRate`
      },
      {
        parameter: 'Average Client Lifecycle',
        description: 'Average client relationship duration',
        value: product.avgClientLifecycle || 5,
        unit: 'years',
        key: `products.${productKey}.avgClientLifecycle`
      },
      {
        parameter: 'Service Type',
        description: 'Type of service provided',
        value: product.serviceType || 'Advisory',
        unit: 'text',
        key: `products.${productKey}.serviceType`,
        options: ['Advisory', 'Transactional', 'Platform', 'Subscription', 'Marketplace']
      },
      {
        parameter: 'Revenue Recognition',
        description: 'Revenue recognition pattern',
        value: product.revenueRecognition || 'Upfront',
        unit: 'text',
        key: `products.${productKey}.revenueRecognition`,
        options: ['Upfront', 'Recurring', 'Performance-based', 'Mixed']
      },
      {
        parameter: 'Operational Risk Weight',
        description: 'Operational risk weighting factor',
        value: product.operationalRiskWeight || 15,
        unit: '%',
        key: `products.${productKey}.operationalRiskWeight`
      }
    ];

    // Determine which rows to show based on product type
    const productType = product.productType || 'Credit';
    const specificRows = productType === 'Credit' ? creditRows : commissionRows;
    
    // Common rows that apply to both types
    const sharedRows = [
      {
        parameter: 'State Guarantee Coverage',
        description: 'Percentage of loan/service amount covered by state guarantee (e.g., MCC guarantee)',
        value: product.stateGuaranteePercentage || 0,
        unit: '%',
        key: `products.${productKey}.stateGuaranteePercentage`
      }
    ];
    
    // Credit-only rows
    const creditOnlyRows = productType === 'Credit' ? [
      {
        parameter: 'Equity Upside',
        description: 'Potential equity upside percentage',
        value: product.equityUpside || 0,
        unit: '%',
        key: `products.${productKey}.equityUpside`
      }
    ] : [];
    
    // Convert volumes to volumeArray if needed
    const getVolumeArray = () => {
      // If volumeArray already exists, use it
      if (product.volumeArray && Array.isArray(product.volumeArray) && product.volumeArray.length === 10) {
        return product.volumeArray;
      }
      
      // If we have old y1/y10 format, convert to array
      if (product.volumes && (product.volumes.y1 || product.volumes.y10)) {
        const y1 = product.volumes.y1 || 0;
        const y10 = product.volumes.y10 || 0;
        
        // Linear interpolation for intermediate years
        return Array.from({ length: 10 }, (_, i) => {
          if (i === 0) return y1;
          if (i === 9) return y10;
          return y1 + ((y10 - y1) * i / 9);
        });
      }
      
      // Default to zeros
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    };

    return {
      category: `Product ${index + 1}: ${product.name}`,
      productType: product.productType || 'Credit',
      rows: [...specificRows, ...sharedRows, ...creditOnlyRows],
      productKey: productKey,
      productName: product.name,
      volumes: product.volumes || { y1: 0, y10: 0 }, // Keep for backward compatibility
      volumeArray: getVolumeArray()
    };
  });

  const allAssumptions = [...generalAssumptions, ...productAssumptions];

  return (
    <div className="space-y-6">
      {/* Product Management */}
      <ProductManager
        divisionKey={divisionKey}
        divisionName={divisionName}
        assumptions={assumptions}
        onAssumptionChange={onAssumptionChange}
      />

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{divisionIcon}</span>
          <h2 className="text-xl font-bold text-gray-800">{divisionName} - Assumptions</h2>
        </div>
        
        <div className="text-sm text-gray-600 mb-6">
          Configure the key assumptions and parameters for the {divisionName} division and its products.
        </div>

        {/* Product Accordion Layout */}
        <div className="space-y-4">
          {Object.entries(divisionProducts).map(([productKey, product]) => {
            // Get product assumptions data
            const productAssumption = productAssumptions.find(pa => pa.productKey === productKey);
            if (!productAssumption) return null;

            const isOpen = openProductKey === productKey;
            
            return (
              <div key={productKey} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Accordion Header */}
                <button
                  onClick={() => handleAccordionToggle(productKey)}
                  className="w-full text-left p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 flex justify-between items-center transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      {productAssumption.category}
                    </h3>
                    {productAssumption.productType && (
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        productAssumption.productType === 'Credit' 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {productAssumption.productType}
                      </span>
                    )}
                  </div>
                  
                  {/* Accordion Arrow */}
                  <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="p-6 border-t bg-white">
                    {/* Volume Input Grid */}
                    <div className="mb-6">
                      <VolumeInputGrid
                        values={productAssumption.volumeArray || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
                        onChange={(newVolumeArray) => {
                          onAssumptionChange(`products.${productKey}.volumeArray`, newVolumeArray);
                        }}
                        label={`${product.name} - Volume Projections`}
                        unit="€M"
                        disabled={false}
                      />
                    </div>
                    
                    {/* Organized Cards Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Pricing & Profitability Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Pricing & Profitability
                        </h4>
                        <div className="space-y-4">
                          {productAssumption.rows.filter(row => 
                            ['Interest Rate Spread', 'Cost of Funding', 'Commission Rate', 'Fee Income Rate', 
                             'Setup Fee Rate', 'Management Fee Rate', 'Performance Fee Rate', 'Equity Upside'].includes(row.parameter)
                          ).map((row, rowIndex) => (
                            <div key={rowIndex}>
                              {row.options ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {row.parameter}
                                  </label>
                                  <select
                                    value={row.isBoolean ? (row.value === 'Fixed' ? 'Fixed' : 'Variable') : row.value}
                                    onChange={(e) => {
                                      if (row.key && row.isBoolean) {
                                        onAssumptionChange(row.key, e.target.value === 'Fixed');
                                      } else if (row.key) {
                                        onAssumptionChange(row.key, e.target.value);
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {row.options.map(option => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <EditableNumberField
                                  label={row.parameter}
                                  value={row.value}
                                  onChange={(value) => {
                                    if (row.key) {
                                      onAssumptionChange(row.key, value);
                                    }
                                  }}
                                  unit={row.unit === 'text' ? '' : row.unit}
                                  disabled={false}
                                  isPercentage={row.unit === '%'}
                                  isInteger={row.unit === '€M' && row.parameter.includes('Volume') || row.unit === 'units'}
                                  tooltip={row.description}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk & RWA Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Risk & RWA
                        </h4>
                        <div className="space-y-4">
                          {productAssumption.rows.filter(row => 
                            ['RWA Density', 'Default Rate', 'Loan-to-Value (LTV)', 
                             'Recovery Costs', 'Collateral Haircut', 'Credit Classification', 'Operational Risk Weight', 'State Guarantee Coverage'].includes(row.parameter)
                          ).map((row, rowIndex) => (
                            <div key={rowIndex}>
                              {row.options ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {row.parameter}
                                  </label>
                                  <select
                                    value={row.isBoolean ? (row.value === 'Fixed' ? 'Fixed' : 'Variable') : row.value}
                                    onChange={(e) => {
                                      if (row.key && row.isBoolean) {
                                        onAssumptionChange(row.key, e.target.value === 'Fixed');
                                      } else if (row.key) {
                                        onAssumptionChange(row.key, e.target.value);
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {row.options.map(option => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <EditableNumberField
                                  label={row.parameter}
                                  value={row.value}
                                  onChange={(value) => {
                                    if (row.key) {
                                      onAssumptionChange(row.key, value);
                                    }
                                  }}
                                  unit={row.unit === 'text' ? '' : row.unit}
                                  disabled={false}
                                  isPercentage={row.unit === '%'}
                                  isInteger={row.unit === '€M' && row.parameter.includes('Volume') || row.unit === 'units'}
                                  tooltip={row.description}
                                />
                              )}
                            </div>
                          ))}
                          
                          {/* Calculated LGD Display - only for Credit products */}
                          {productAssumption.productType === 'Credit' && (
                            <div className="pt-4 border-t border-gray-200">
                              <div className="bg-blue-50 rounded-lg p-3">
                                <label className="block text-sm font-medium text-blue-800 mb-1">
                                  Loss Given Default (LGD) - Calculated
                                </label>
                                <div className="text-lg font-semibold text-blue-900">
                                  {(() => {
                                    // Get the current product values
                                    const currentProduct = divisionProducts[productKey] || {};
                                    const ltv = currentProduct.ltv || 80;
                                    const collateralHaircut = currentProduct.collateralHaircut || 15;
                                    const recoveryCosts = currentProduct.recoveryCosts || 10;
                                    const stateGuarantee = currentProduct.stateGuaranteePercentage || 0;
                                    
                                    // Calculate base LGD using the same formula as in calculations.js
                                    const collateralValue = 1 / (ltv / 100);
                                    const discountedCollateralValue = collateralValue * (1 - (collateralHaircut / 100));
                                    const netRecoveryValue = discountedCollateralValue * (1 - (recoveryCosts / 100));
                                    const baseLgd = Math.max(0, 1 - netRecoveryValue);
                                    
                                    // Apply state guarantee mitigation: LGD applies only to unguaranteed portion
                                    const finalLgd = baseLgd * (1 - (stateGuarantee / 100)) * 100; // Convert to percentage
                                    
                                    return `${finalLgd.toFixed(1)}%`;
                                  })()}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  Formula: LGD = [max(0, 1 - (1/LTV × (1-Haircut) × (1-RecoveryCosts)))] × (1 - StateGuarantee%)
                                  {(() => {
                                    const currentProduct = divisionProducts[productKey] || {};
                                    const stateGuarantee = currentProduct.stateGuaranteePercentage || 0;
                                    return stateGuarantee > 0 ? ` | State guarantee reduces LGD by ${stateGuarantee}%` : '';
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                          
                        </div>
                      </div>

                      {/* Structure & Operations Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Structure & Operations
                        </h4>
                        <div className="space-y-4">
                          {productAssumption.rows.filter(row => 
                            !['Interest Rate Spread', 'Cost of Funding', 'Commission Rate', 'Fee Income Rate', 
                              'Setup Fee Rate', 'Management Fee Rate', 'Performance Fee Rate', 'Equity Upside',
                              'RWA Density', 'Default Rate', 'Loan-to-Value (LTV)', 
                              'Recovery Costs', 'Collateral Haircut', 'Credit Classification', 'Operational Risk Weight', 'State Guarantee Coverage'].includes(row.parameter)
                          ).map((row, rowIndex) => (
                            <div key={rowIndex}>
                              {row.options ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {row.parameter}
                                  </label>
                                  <select
                                    value={row.isBoolean ? (row.value === 'Fixed' ? 'Fixed' : 'Variable') : row.value}
                                    onChange={(e) => {
                                      if (row.key && row.isBoolean) {
                                        onAssumptionChange(row.key, e.target.value === 'Fixed');
                                      } else if (row.key) {
                                        onAssumptionChange(row.key, e.target.value);
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {row.options.map(option => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <EditableNumberField
                                  label={row.parameter}
                                  value={row.value}
                                  onChange={(value) => {
                                    if (row.key) {
                                      onAssumptionChange(row.key, value);
                                    }
                                  }}
                                  unit={row.unit === 'text' ? '' : row.unit}
                                  disabled={false}
                                  isPercentage={row.unit === '%'}
                                  isInteger={row.unit === '€M' && row.parameter.includes('Volume') || row.unit === 'units'}
                                  tooltip={row.description}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No Products Found */}
        {Object.keys(divisionProducts).length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-yellow-600 text-lg mr-2">⚠️</span>
              <div>
                <h3 className="font-medium text-yellow-800">No Products Found</h3>
                <p className="text-yellow-700 text-sm">
                  No products found for division "{divisionKey}". Add products in the general assumptions or check the product key naming.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DivisionAssumptions;