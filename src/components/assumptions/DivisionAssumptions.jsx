import React from 'react';
import EditableNumberField from '../common/EditableNumberField';
import ProductManager from '../common/ProductManager';

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
  
  // Filter products for this division
  const divisionProducts = Object.fromEntries(
    Object.entries(assumptions.products || {}).filter(([key]) => 
      productKeys.length > 0 ? productKeys.includes(key) : key.startsWith(divisionKey)
    )
  );

  // General division assumptions
  const generalAssumptions = [
    {
      category: `${divisionName} - General Parameters`,
      rows: [
        {
          parameter: 'Operating Assets Ratio',
          description: 'Operating assets as % of total loans',
          value: assumptions.operatingAssetsRatio || 10,
          unit: '%',
          key: 'operatingAssetsRatio'
        }
      ]
    }
  ];

  // Product-specific assumptions
  const productAssumptions = Object.entries(divisionProducts).map(([productKey, product], index) => {
    
    // Common assumptions for all products
    const commonRows = [
      {
        parameter: 'Product Type',
        description: 'Type of product for calculation logic',
        value: product.productType || 'Credit',
        unit: 'text',
        key: `products.${productKey}.productType`,
        options: ['Credit', 'Commission']
      },
      {
        parameter: 'Volume Year 1',
        description: 'New business volume year 1',
        value: product.volumes?.y1 || 0,
        unit: '€M',
        key: `products.${productKey}.volumes.y1`
      },
      {
        parameter: 'Volume Year 5',
        description: 'New business volume year 5',
        value: product.volumes?.y5 || 0,
        unit: '€M',
        key: `products.${productKey}.volumes.y5`
      }
    ];

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
        parameter: 'Total Duration',
        description: 'Total duration of loans in years',
        value: product.totalDuration || product.durata || 5,
        unit: 'years',
        key: `products.${productKey}.totalDuration`
      },
      {
        parameter: 'Average Duration',
        description: 'Average duration of loans in years',
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
        parameter: 'Loss Given Default (LGD)',
        description: 'Loss given default rate',
        value: product.lgd || 45,
        unit: '%',
        key: `products.${productKey}.lgd`
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
    
    // Common rows that apply to both types (only for Credit products)
    const sharedRows = productType === 'Credit' ? [
      {
        parameter: 'Equity Upside',
        description: 'Potential equity upside percentage',
        value: product.equityUpside || 0,
        unit: '%',
        key: `products.${productKey}.equityUpside`
      }
    ] : [];
    
    return {
      category: `Product ${index + 1}: ${product.name}`,
      rows: [...commonRows, ...specificRows, ...sharedRows]
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

        {allAssumptions.map((section, index) => (
          <div key={index} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{section.category}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.rows.map((row, rowIndex) => (
                  <div key={rowIndex}>
                    {row.options ? (
                      <div className="mb-2">
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
        ))}

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