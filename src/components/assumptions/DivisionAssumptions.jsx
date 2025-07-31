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
        key: `products.${productKey}.spread`,
        tooltip: 'Margin charged above EURIBOR rate on loans',
        tooltipImpact: 'Directly increases interest income for the product',
        tooltipFormula: 'Loan Rate = EURIBOR + Spread'
      },
      {
        parameter: 'Commission Rate',
        description: 'Upfront commission on new business volume',
        value: product.commissionRate || 0,
        unit: '%',
        key: `products.${productKey}.commissionRate`,
        tooltip: 'One-time fee charged on new loan originations',
        tooltipImpact: 'Generates commission income in the year of origination',
        tooltipFormula: 'Commission Income = New Volume × Commission Rate'
      },
      {
        parameter: 'Loan Maturity',
        description: 'Contractual maturity of loans in years (used for amortization calculations)',
        value: product.durata || 5,
        unit: 'years',
        key: `products.${productKey}.durata`,
        tooltip: 'Total loan duration for amortization calculation',
        tooltipImpact: 'Affects loan repayment schedule and outstanding balance evolution',
        tooltipFormula: 'Used in French/bullet amortization calculations'
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
        key: `products.${productKey}.rwaDensity`,
        tooltip: 'Percentage of loan amount that counts as risk-weighted assets',
        tooltipImpact: 'Determines capital requirements and CET1 ratio',
        tooltipFormula: 'RWA = Loan Outstanding × RWA Density'
      },
      {
        parameter: 'Default Rate',
        description: 'Annual default rate',
        value: product.dangerRate !== undefined ? product.dangerRate : 1.5,
        unit: '%',
        key: `products.${productKey}.dangerRate`,
        tooltip: 'Annual percentage of loans that default and become non-performing',
        tooltipImpact: 'Increases NPL stock and drives loan loss provisions',
        tooltipFormula: 'New NPLs = Performing Loans × Default Rate'
      },
      {
        parameter: 'Loan-to-Value (LTV)',
        description: 'Maximum loan-to-value ratio',
        value: product.ltv || 80,
        unit: '%',
        key: `products.${productKey}.ltv`,
        tooltip: 'Maximum loan amount as percentage of collateral value',
        tooltipImpact: 'Affects Loss Given Default (LGD) calculation and credit risk',
        tooltipFormula: 'Max Loan Amount = Collateral Value × LTV'
      },
      {
        parameter: 'Recovery Costs',
        description: 'Costs for recovery procedures',
        value: product.recoveryCosts || 10,
        unit: '%',
        key: `products.${productKey}.recoveryCosts`,
        tooltip: 'Legal and administrative costs to recover defaulted loans',
        tooltipImpact: 'Reduces net recovery value and increases LGD',
        tooltipFormula: 'Used in LGD calculation: reduces collateral recovery value'
      },
      {
        parameter: 'Collateral Haircut',
        description: 'Haircut on collateral value',
        value: product.collateralHaircut || 15,
        unit: '%',
        key: `products.${productKey}.collateralHaircut`,
        tooltip: 'Discount applied to collateral value in liquidation scenarios',
        tooltipImpact: 'Reduces recovery value and increases LGD',
        tooltipFormula: 'Liquidation Value = Collateral Value × (1 - Haircut)'
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
      },
      {
        parameter: 'Secured/Unsecured',
        description: 'Whether the loan has collateral',
        value: product.isUnsecured ? 'Unsecured' : 'Secured',
        unit: 'text',
        key: `products.${productKey}.isUnsecured`,
        options: ['Secured', 'Unsecured'],
        isBoolean: true
      }
    ];
    
    // Unsecured-specific rows (only shown when loan is unsecured)
    const unsecuredCreditRows = [
      {
        parameter: 'Unsecured LGD',
        description: 'Loss Given Default for unsecured loans',
        value: product.unsecuredLGD || 45,
        unit: '%',
        key: `products.${productKey}.unsecuredLGD`,
        tooltip: 'Expected loss percentage in case of default for unsecured loans',
        tooltipImpact: 'Higher LGD increases capital requirements and expected losses',
        tooltipFormula: 'Applies to the unguaranteed portion of the loan'
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
        key: `products.${productKey}.managementFeeRate`,
        tooltip: 'Annual percentage fee charged on assets under management',
        tooltipImpact: 'Primary revenue driver for wealth management products',
        tooltipFormula: 'Management Fees = AUM × Management Fee Rate'
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

    // Adoption rate for dependent products
    const adoptionRows = product.requiresBaseProduct ? [
      {
        parameter: 'Adoption Rate',
        description: 'Percentage of base account customers who activate this product',
        value: product.adoptionRate || 0,
        unit: '%',
        key: `products.${productKey}.adoptionRate`
      }
    ] : [];
    
    // Digital Service-specific assumptions
    const digitalServiceRows = [
      {
        parameter: 'Customer Acquisition Cost (CAC)',
        description: 'Cost to acquire each new customer',
        value: product.cac || 30,
        unit: '€',
        key: `products.${productKey}.cac`,
        tooltip: 'Marketing and onboarding cost per new customer',
        tooltipImpact: 'Recorded as operating expense in the year of acquisition',
        tooltipFormula: 'Total Acquisition Cost = New Customers × CAC'
      },
      {
        parameter: 'Average Deposit per Customer',
        description: 'Average deposit amount per customer',
        value: product.avgDeposit || 3000,
        unit: '€',
        key: `products.${productKey}.avgDeposit`,
        tooltip: 'Average balance maintained in customer accounts',
        tooltipImpact: 'Drives deposit volume and interest expense',
        tooltipFormula: 'Total Deposits = Active Customers × Avg Deposit'
      },
      {
        parameter: 'Annual Churn Rate',
        description: 'Percentage of customers lost annually',
        value: product.churnRate || 5,
        unit: '%',
        key: `products.${productKey}.churnRate`,
        tooltip: 'Percentage of customers who close their accounts each year',
        tooltipImpact: 'Reduces active customer base and requires replacement acquisitions',
        tooltipFormula: 'Customers Lost = Active Customers × Churn Rate'
      },
      {
        parameter: 'Monthly Fee',
        description: 'Monthly subscription/account fee per customer',
        value: product.monthlyFee || 0,
        unit: '€',
        key: `products.${productKey}.monthlyFee`,
        tooltip: 'Recurring monthly fee charged to each active customer',
        tooltipImpact: 'Generates predictable commission income stream',
        tooltipFormula: 'Monthly Income = Active Customers × Monthly Fee'
      },
      {
        parameter: 'Annual Service Revenue per Customer',
        description: 'Additional service revenue per customer per year',
        value: product.annualServiceRevenue || 15,
        unit: '€',
        key: `products.${productKey}.annualServiceRevenue`
      },
      {
        parameter: 'Deposit Interest Rate',
        description: 'Interest rate paid to customers on deposits',
        value: product.depositInterestRate || 0.5,
        unit: '%',
        key: `products.${productKey}.depositInterestRate`
      }
    ];

    // Deposit and Service-specific assumptions (modular model)
    const isModularDepositService = product.acquisition && product.baseAccount;
    
    // Acquisition module rows
    const acquisitionRows = [
      {
        parameter: 'Customer Acquisition Cost (CAC)',
        description: 'Cost to acquire each new customer',
        value: isModularDepositService ? (product.acquisition.cac || 30) : (product.cac || 30),
        unit: '€',
        key: isModularDepositService ? `products.${productKey}.acquisition.cac` : `products.${productKey}.cac`
      },
      {
        parameter: 'Annual Churn Rate',
        description: 'Percentage of customers lost annually',
        value: isModularDepositService ? (product.acquisition.churnRate || 5) : (product.churnRate || 5),
        unit: '%',
        key: isModularDepositService ? `products.${productKey}.acquisition.churnRate` : `products.${productKey}.churnRate`
      }
    ];
    
    // Base Account module rows
    const currentAccountRows = [
      {
        parameter: 'Average Deposit per Customer',
        description: 'Average deposit amount in base account',
        value: isModularDepositService ? (product.baseAccount.avgDeposit || 1500) : (product.avgDeposit || 3000),
        unit: '€',
        key: isModularDepositService ? `products.${productKey}.baseAccount.avgDeposit` : `products.${productKey}.avgDeposit`
      },
      {
        parameter: 'Base Account Interest Rate',
        description: 'Interest rate paid on base accounts',
        value: isModularDepositService ? (product.baseAccount.interestRate || 0.1) : (product.depositInterestRate || 0.5),
        unit: '%',
        key: isModularDepositService ? `products.${productKey}.baseAccount.interestRate` : `products.${productKey}.depositInterestRate`
      },
      {
        parameter: 'Monthly Fee',
        description: 'Monthly account fee per customer',
        value: isModularDepositService ? (product.baseAccount.monthlyFee || 0) : (product.monthlyFee || 1),
        unit: '€',
        key: isModularDepositService ? `products.${productKey}.baseAccount.monthlyFee` : `products.${productKey}.monthlyFee`
      }
    ];
    
    // Savings module rows
    const savingsRows = isModularDepositService ? [
      {
        parameter: 'Adoption Rate',
        description: 'Percentage of customers who activate savings accounts',
        value: product.savingsModule?.adoptionRate || 30,
        unit: '%',
        key: `products.${productKey}.savingsModule.adoptionRate`
      },
      {
        parameter: 'Average Additional Deposit',
        description: 'Average additional deposit in savings accounts',
        value: product.savingsModule?.avgAdditionalDeposit || 5000,
        unit: '€',
        key: `products.${productKey}.savingsModule.avgAdditionalDeposit`
      }
    ] : [];
    
    // Premium Services module rows
    const premiumServiceRows = isModularDepositService ? [
      {
        parameter: 'Premium Services Adoption Rate',
        description: 'Percentage of customers who activate premium services',
        value: product.premiumServicesModule?.adoptionRate || 20,
        unit: '%',
        key: `products.${productKey}.premiumServicesModule.adoptionRate`
      },
      {
        parameter: 'Average Annual Revenue',
        description: 'Average annual revenue per customer with premium services',
        value: product.premiumServicesModule?.avgAnnualRevenue || 80,
        unit: '€',
        key: `products.${productKey}.premiumServicesModule.avgAnnualRevenue`
      }
    ] : [];

    // Wealth Management Referral rows
    const referralRows = isModularDepositService ? [
      {
        parameter: 'Referral Adoption Rate',
        description: 'Percentage of new customers referred to wealth management',
        value: product.wealthManagementReferral?.adoptionRate || 5,
        unit: '%',
        key: `products.${productKey}.wealthManagementReferral.adoptionRate`
      },
      {
        parameter: 'Referral Fee',
        description: 'One-time fee per referred customer',
        value: product.wealthManagementReferral?.referralFee || 150,
        unit: '€',
        key: `products.${productKey}.wealthManagementReferral.referralFee`
      }
    ] : [];
    
    // Service module rows for legacy compatibility
    const serviceRows = !isModularDepositService ? [
      {
        parameter: 'Annual Service Revenue per Customer',
        description: 'Additional service revenue per customer per year',
        value: product.annualServiceRevenue || 25,
        unit: '€',
        key: `products.${productKey}.annualServiceRevenue`
      }
    ] : [];
    
    // Combine all rows for legacy compatibility
    const depositAndServiceRows = [...acquisitionRows, ...currentAccountRows, ...savingsRows, ...premiumServiceRows, ...referralRows, ...serviceRows];

    // Determine which rows to show based on product type
    const productType = product.productType || 'Credit';
    let specificRows;
    if (productType === 'DepositAndService') {
      specificRows = [...adoptionRows, ...depositAndServiceRows];
    } else if (productType === 'DigitalService') {
      specificRows = digitalServiceRows;
    } else if (productType === 'Credit') {
      // For credit products, include unsecured rows when needed
      specificRows = [...creditRows, ...unsecuredCreditRows];
    } else {
      // Commission products
      if (product.requiresBaseProduct) {
        // Digital commission products have specific fields
        const digitalCommissionRows = [
          ...adoptionRows,
          {
            parameter: 'Monthly Fee',
            description: 'Monthly subscription fee per customer',
            value: product.monthlyFee || 0,
            unit: '€',
            key: `products.${productKey}.monthlyFee`
          },
          {
            parameter: 'Annual Service Revenue',
            description: 'Additional annual revenue per customer',
            value: product.annualServiceRevenue || 0,
            unit: '€',
            key: `products.${productKey}.annualServiceRevenue`
          }
        ];
        
        if (product.avgAUM !== undefined) {
          digitalCommissionRows.push({
            parameter: 'Average AUM per Customer',
            description: 'Average assets under management per customer',
            value: product.avgAUM || 0,
            unit: '€',
            key: `products.${productKey}.avgAUM`
          });
        }
        
        specificRows = [...digitalCommissionRows, ...commissionRows.filter(r => 
          !['Commission Rate', 'Fee Income Rate', 'Average Transaction Size'].includes(r.parameter)
        )];
      } else {
        specificRows = commissionRows;
      }
    }
    
    // Common rows that apply to both types
    const sharedRows = [
      {
        parameter: 'State Guarantee Coverage',
        description: 'Percentage of loan/service amount covered by state guarantee (e.g., MCC guarantee)',
        value: product.stateGuaranteePercentage || 0,
        unit: '%',
        key: `products.${productKey}.stateGuaranteePercentage`,
        tooltip: 'Portion of loan covered by government guarantee schemes',
        tooltipImpact: 'Reduces effective LGD and RWA density for guaranteed portion',
        tooltipFormula: 'Effective LGD = Base LGD × (1 - Guarantee %)'
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
    
    // Convert volumes or customers to array format
    const getInputArray = () => {
      // For DigitalService and DepositAndService products, use customers data
      if (productType === 'DigitalService' || productType === 'DepositAndService') {
        // First check if there's a customerArray
        if (product.customerArray && Array.isArray(product.customerArray) && product.customerArray.length === 10) {
          return product.customerArray;
        }
        
        // Check if it's modular structure
        const isModular = product.acquisition && product.currentAccount;
        
        // Get customers object from appropriate location
        const customers = isModular ? product.acquisition.customers : product.customers;
        
        if (customers) {
          // Convert customers object to array format
          const y1 = customers.y1 || 0;
          const y5 = customers.y5 || 0;
          
          // Create 10-year array with linear interpolation to y5, then maintain y5
          return Array.from({ length: 10 }, (_, i) => {
            if (i < 5) {
              return y1 + ((y5 - y1) * i / 4);
            } else {
              return y5; // Beyond year 5, maintain y5 level
            }
          });
        }
        return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
      
      // For other product types, use volumes
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
      inputArray: getInputArray(),
      isDigitalService: productType === 'DigitalService',
      isDepositAndService: productType === 'DepositAndService',
      isModular: isModularDepositService
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
                          : productAssumption.productType === 'DigitalService'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : productAssumption.productType === 'DepositAndService'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
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
                    {/* Volume/Customer Input Grid - Only for products without dependencies */}
                    {!product.requiresBaseProduct && (
                    <div className="mb-6">
                      <VolumeInputGrid
                        values={productAssumption.inputArray || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
                        onChange={(newArray) => {
                          if (productAssumption.isDigitalService || productAssumption.isDepositAndService) {
                            // Check if it's modular structure
                            const isModular = product.acquisition && product.currentAccount;
                            
                            // For DigitalService and DepositAndService products, save the full customer array
                            onAssumptionChange(`products.${productKey}.customerArray`, newArray);
                            
                            // Update appropriate structure based on whether it's modular or not
                            const y1 = newArray[0] || 0;
                            const y5 = newArray[4] || 0;
                            
                            if (isModular) {
                              // For modular structure, update acquisition.customers
                              onAssumptionChange(`products.${productKey}.acquisition.customers`, { y1, y5 });
                            } else {
                              // For legacy structure, update customers directly
                              onAssumptionChange(`products.${productKey}.customers`, { y1, y5 });
                            }
                          } else {
                            // For other products, update volumeArray
                            onAssumptionChange(`products.${productKey}.volumeArray`, newArray);
                          }
                        }}
                        label={`${product.name} - ${productAssumption.isDigitalService || productAssumption.isDepositAndService ? 'New Customer Acquisitions' : 'Volume Projections'}`}
                        unit={productAssumption.isDigitalService || productAssumption.isDepositAndService ? 'customers' : '€M'}
                        disabled={false}
                      />
                    </div>
                    )}
                    
                    {/* Organized Cards Layout */}
                    {/* Check if this is a modular DepositAndService product */}
                    {productAssumption.isDepositAndService && productAssumption.isModular ? (
                      // Modular DepositAndService Layout - 5 cards
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        
                        {/* Card 1: Acquisizione e Churn */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Acquisizione e Churn
                          </h4>
                          <div className="space-y-4">
                            {productAssumption.rows.filter(row => 
                              ['Customer Acquisition Cost (CAC)', 'Annual Churn Rate'].includes(row.parameter)
                            ).map((row, rowIndex) => (
                              <EditableNumberField
                                key={rowIndex}
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
                                isInteger={row.unit === '€' && !row.parameter.includes('Rate')}
                                tooltip={row.tooltip || row.description}
                                tooltipTitle={row.parameter}
                                tooltipImpact={row.tooltipImpact}
                                tooltipFormula={row.tooltipFormula}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Card 2: Conto Corrente Base */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Conto Corrente Base
                          </h4>
                          <div className="space-y-4">
                            {productAssumption.rows.filter(row => 
                              ['Average Deposit per Customer', 'Base Account Interest Rate', 'Monthly Fee'].includes(row.parameter)
                            ).map((row, rowIndex) => (
                              <EditableNumberField
                                key={rowIndex}
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
                                isInteger={row.unit === '€' && !row.parameter.includes('Rate')}
                                tooltip={row.tooltip || row.description}
                                tooltipTitle={row.parameter}
                                tooltipImpact={row.tooltipImpact}
                                tooltipFormula={row.tooltipFormula}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Card 3: Modulo Conto Deposito */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            Modulo Conto Deposito
                          </h4>
                          <div className="space-y-4">
                            {productAssumption.rows.filter(row => 
                              ['Adoption Rate', 'Average Additional Deposit'].includes(row.parameter)
                            ).map((row, rowIndex) => (
                              <EditableNumberField
                                key={rowIndex}
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
                                isInteger={row.unit === '€' && !row.parameter.includes('Rate')}
                                tooltip={row.tooltip || row.description}
                                tooltipTitle={row.parameter}
                                tooltipImpact={row.tooltipImpact}
                                tooltipFormula={row.tooltipFormula}
                              />
                            ))}
                            
                            {/* Deposit Mix Table */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mix Depositi (Totale deve essere 100%)
                              </label>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasso</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {(product.savingsModule?.depositMix || [
                                      { name: 'Svincolato', percentage: 40, interestRate: 2.5 },
                                      { name: 'Vincolato 12M', percentage: 60, interestRate: 3.5 }
                                    ]).map((deposit, idx) => (
                                      <tr key={idx}>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                          {deposit.name}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          <input
                                            type="number"
                                            value={deposit.percentage}
                                            onChange={(e) => {
                                              const newMix = [...(product.savingsModule?.depositMix || [])];
                                              newMix[idx] = { ...newMix[idx], percentage: parseFloat(e.target.value) || 0 };
                                              onAssumptionChange(`products.${productKey}.savingsModule.depositMix`, newMix);
                                            }}
                                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                          <span className="ml-1 text-sm text-gray-500">%</span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          <input
                                            type="number"
                                            value={deposit.interestRate}
                                            step="0.1"
                                            onChange={(e) => {
                                              const newMix = [...(product.savingsModule?.depositMix || [])];
                                              newMix[idx] = { ...newMix[idx], interestRate: parseFloat(e.target.value) || 0 };
                                              onAssumptionChange(`products.${productKey}.savingsModule.depositMix`, newMix);
                                            }}
                                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                          <span className="ml-1 text-sm text-gray-500">%</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Card 4: Modulo Servizi Premium */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                            Modulo Servizi Premium
                          </h4>
                          <div className="space-y-4">
                            {productAssumption.rows.filter(row => 
                              ['Premium Services Adoption Rate', 'Average Annual Revenue'].includes(row.parameter)
                            ).map((row, rowIndex) => (
                              <EditableNumberField
                                key={rowIndex}
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
                                isInteger={row.unit === '€' && !row.parameter.includes('Rate')}
                                tooltip={row.tooltip || row.description}
                                tooltipTitle={row.parameter}
                                tooltipImpact={row.tooltipImpact}
                                tooltipFormula={row.tooltipFormula}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Card 5: Referral Wealth Management */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                            Referral Wealth Management
                          </h4>
                          <div className="space-y-4">
                            {productAssumption.rows.filter(row => 
                              ['Referral Adoption Rate', 'Referral Fee'].includes(row.parameter)
                            ).map((row, rowIndex) => (
                              <EditableNumberField
                                key={rowIndex}
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
                                isInteger={row.unit === '€' && !row.parameter.includes('Rate')}
                                tooltip={row.tooltip || row.description}
                                tooltipTitle={row.parameter}
                                tooltipImpact={row.tooltipImpact}
                                tooltipFormula={row.tooltipFormula}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Standard Layout - 3 cards
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* First Card - varies by product type */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {productAssumption.isDepositAndService ? 'Acquisizione Clienti' : productAssumption.isDigitalService ? 'Customer Acquisition' : 'Pricing & Profitability'}
                        </h4>
                        <div className="space-y-4">
                          {productAssumption.rows.filter(row => {
                            if (productAssumption.isDepositAndService) {
                              return ['Customer Acquisition Cost (CAC)', 'Annual Churn Rate'].includes(row.parameter);
                            } else if (productAssumption.isDigitalService) {
                              return ['Customer Acquisition Cost (CAC)'].includes(row.parameter);
                            } else {
                              return ['Interest Rate Spread', 'Commission Rate', 'Fee Income Rate', 
                                     'Setup Fee Rate', 'Management Fee Rate', 'Performance Fee Rate', 'Equity Upside'].includes(row.parameter);
                            }
                          }).map((row, rowIndex) => (
                            <div key={rowIndex}>
                              {row.options ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {row.parameter}
                                  </label>
                                  <select
                                    value={row.value}
                                    onChange={(e) => {
                                      if (row.key && row.isBoolean) {
                                        // Handle different boolean fields
                                        if (row.parameter === 'Interest Rate Type') {
                                          onAssumptionChange(row.key, e.target.value === 'Fixed');
                                        } else if (row.parameter === 'Secured/Unsecured') {
                                          onAssumptionChange(row.key, e.target.value === 'Unsecured');
                                        }
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
                                  tooltip={row.tooltip || row.description}
                                tooltipTitle={row.parameter}
                                tooltipImpact={row.tooltipImpact}
                                tooltipFormula={row.tooltipFormula}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Second Card - varies by product type */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {productAssumption.isDepositAndService ? 'Comportamento e Redditività Cliente' : productAssumption.isDigitalService ? 'Customer Metrics' : 'Risk & RWA'}
                        </h4>
                        <div className="space-y-4">
                          {productAssumption.rows.filter(row => {
                            if (productAssumption.isDepositAndService) {
                              return ['Average Deposit per Customer', 'Deposit Interest Rate', 'Monthly Fee', 'Annual Service Revenue per Customer'].includes(row.parameter);
                            } else if (productAssumption.isDigitalService) {
                              return ['Average Deposit per Customer', 'Annual Churn Rate'].includes(row.parameter);
                            } else {
                              // For credit products, filter based on secured/unsecured
                              const isUnsecured = product.isUnsecured;
                              const baseRiskParams = ['RWA Density', 'Default Rate', 'Credit Classification', 'Operational Risk Weight', 'State Guarantee Coverage', 'Secured/Unsecured'];
                              const securedOnlyParams = ['Loan-to-Value (LTV)', 'Recovery Costs', 'Collateral Haircut'];
                              const unsecuredOnlyParams = ['Unsecured LGD'];
                              
                              if (isUnsecured) {
                                return [...baseRiskParams, ...unsecuredOnlyParams].includes(row.parameter);
                              } else {
                                return [...baseRiskParams, ...securedOnlyParams].includes(row.parameter);
                              }
                            }
                          }).map((row, rowIndex) => (
                            <div key={rowIndex}>
                              {row.options ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {row.parameter}
                                  </label>
                                  <select
                                    value={row.value}
                                    onChange={(e) => {
                                      if (row.key && row.isBoolean) {
                                        // Handle different boolean fields
                                        if (row.parameter === 'Interest Rate Type') {
                                          onAssumptionChange(row.key, e.target.value === 'Fixed');
                                        } else if (row.parameter === 'Secured/Unsecured') {
                                          onAssumptionChange(row.key, e.target.value === 'Unsecured');
                                        }
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
                                  tooltip={row.tooltip || row.description}
                                tooltipTitle={row.parameter}
                                tooltipImpact={row.tooltipImpact}
                                tooltipFormula={row.tooltipFormula}
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
                                    const isUnsecured = currentProduct.isUnsecured;
                                    const stateGuarantee = currentProduct.stateGuaranteePercentage || 0;
                                    
                                    let baseLgd;
                                    if (isUnsecured || currentProduct.ltv === 0 || currentProduct.ltv === undefined) {
                                      // Unsecured loan
                                      baseLgd = (currentProduct.unsecuredLGD || 45) / 100;
                                    } else {
                                      // Secured loan - calculate based on collateral
                                      const ltv = currentProduct.ltv || 80;
                                      const collateralHaircut = currentProduct.collateralHaircut || 15;
                                      const recoveryCosts = currentProduct.recoveryCosts || 10;
                                      
                                      const collateralValue = 1 / (ltv / 100);
                                      const discountedCollateralValue = collateralValue * (1 - (collateralHaircut / 100));
                                      const netRecoveryValue = discountedCollateralValue * (1 - (recoveryCosts / 100));
                                      baseLgd = Math.max(0, 1 - netRecoveryValue);
                                    }
                                    
                                    // Apply state guarantee mitigation: LGD applies only to unguaranteed portion
                                    const finalLgd = baseLgd * (1 - (stateGuarantee / 100)) * 100; // Convert to percentage
                                    
                                    return `${finalLgd.toFixed(1)}%`;
                                  })()}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {(() => {
                                    const currentProduct = divisionProducts[productKey] || {};
                                    const isUnsecured = currentProduct.isUnsecured;
                                    const stateGuarantee = currentProduct.stateGuaranteePercentage || 0;
                                    
                                    if (isUnsecured) {
                                      return `Formula: LGD = Unsecured LGD × (1 - StateGuarantee%)${stateGuarantee > 0 ? ` | State guarantee reduces LGD by ${stateGuarantee}%` : ''}`;
                                    } else {
                                      return `Formula: LGD = [max(0, 1 - (1/LTV × (1-Haircut) × (1-RecoveryCosts)))] × (1 - StateGuarantee%)${stateGuarantee > 0 ? ` | State guarantee reduces LGD by ${stateGuarantee}%` : ''}`;
                                    }
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                          
                        </div>
                      </div>

                      {/* Third Card - varies by product type (hidden for DepositAndService) */}
                      {!productAssumption.isDepositAndService && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {productAssumption.isDigitalService ? 'Monetization' : 'Structure & Operations'}
                        </h4>
                        <div className="space-y-4">
                          {productAssumption.rows.filter(row => {
                            if (productAssumption.isDigitalService) {
                              return ['Monthly Fee', 'Annual Service Revenue per Customer', 'Deposit Interest Rate'].includes(row.parameter);
                            } else {
                              return !['Interest Rate Spread', 'Commission Rate', 'Fee Income Rate', 
                                      'Setup Fee Rate', 'Management Fee Rate', 'Performance Fee Rate', 'Equity Upside',
                                      'RWA Density', 'Default Rate', 'Loan-to-Value (LTV)', 
                                      'Recovery Costs', 'Collateral Haircut', 'Credit Classification', 'Operational Risk Weight', 'State Guarantee Coverage',
                                      'Customer Acquisition Cost (CAC)', 'Average Deposit per Customer', 'Annual Churn Rate',
                                      'Monthly Fee', 'Annual Service Revenue per Customer', 'Deposit Interest Rate',
                                      'Secured/Unsecured', 'Unsecured LGD'].includes(row.parameter);
                            }
                          }).map((row, rowIndex) => (
                            <div key={rowIndex}>
                              {row.options ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {row.parameter}
                                  </label>
                                  <select
                                    value={row.value}
                                    onChange={(e) => {
                                      if (row.key && row.isBoolean) {
                                        // Handle different boolean fields
                                        if (row.parameter === 'Interest Rate Type') {
                                          onAssumptionChange(row.key, e.target.value === 'Fixed');
                                        } else if (row.parameter === 'Secured/Unsecured') {
                                          onAssumptionChange(row.key, e.target.value === 'Unsecured');
                                        }
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
                                  tooltip={row.tooltip || row.description}
                                tooltipTitle={row.parameter}
                                tooltipImpact={row.tooltipImpact}
                                tooltipFormula={row.tooltipFormula}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                      
                    </div>
                    )}
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