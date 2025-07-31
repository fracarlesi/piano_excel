/**
 * Formula helpers for creating calculation tooltips with trace precedents
 */

export const formatNumber = (value, decimals = 2, unit = '') => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  // Format based on magnitude
  if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(decimals)}M${unit}`;
  } else if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(decimals)}k${unit}`;
  } else if (absValue < 1 && absValue > 0) {
    // For small numbers, show more decimals
    return `${sign}${absValue.toFixed(Math.max(decimals, 4))}${unit}`;
  } else {
    return `${sign}${absValue.toFixed(decimals)}${unit}`;
  }
};

/**
 * Create a formula with trace precedents functionality
 * @param {number} year - The year index
 * @param {string} formula - The static formula description
 * @param {Array} precedents - Array of precedent objects with name, value, and optional calculation
 * @param {Function} calculationFn - Function that returns the live calculation string
 * @returns {Object} Formula object for CalculationTooltip
 */
export const createFormula = (year, formula, precedents, calculationFn) => {
  return {
    formula,
    year,
    precedents: precedents.map(p => ({
      name: p.name,
      value: formatNumber(p.value, p.decimals || 2, p.unit || ''),
      calculation: p.calculation || null
    })),
    calculation: calculationFn ? calculationFn(year) : null
  };
};

/**
 * Create a product-level formula with automatic precedent tracing
 */
export const createProductFormula = (year, product, formulaType, values) => {
  // Check if this is a digital product
  const isDigitalProduct = product.name && product.name.includes('Cliente Retail Digitale');
  const isDepositProduct = product.depositStock && product.depositStock.some(v => v > 0);
  
  const baseFormulas = {
    interestIncome: {
      formula: isDepositProduct ? 'Deposit Stock × Deposit Rate (FTP = Deposit Rate)' : 
                values.isFixed ? 'Average Performing Assets × Fixed Interest Rate' :
                'Average Performing Assets × (EURIBOR + Spread)',
      precedents: isDepositProduct ? [
        {
          name: 'Deposit Stock',
          value: values.depositStock || values.avgAssets,
          unit: '€M',
          calculation: 'Total customer deposits'
        },
        {
          name: 'FTP Rate',
          value: values.depositRate || values.ftpRate || values.interestRate,
          unit: '%',
          calculation: 'Equal to deposit rate paid to customers (no margin)'
        }
      ] : values.isFixed ? [
        {
          name: 'Average Performing Assets',
          value: values.avgAssets,
          unit: '€M',
          calculation: 'Weighted average of performing loan stock'
        },
        {
          name: 'Fixed Interest Rate',
          value: values.interestRate,
          unit: '%',
          calculation: 'Fixed rate = Spread + 2%'
        },
        {
          name: 'Spread',
          value: values.spread,
          unit: '%',
          calculation: 'Margin over base rate'
        }
      ] : [
        {
          name: 'Average Performing Assets',
          value: values.avgAssets,
          unit: '€M',
          calculation: 'Weighted average of performing loan stock'
        },
        {
          name: 'EURIBOR',
          value: values.euribor,
          unit: '%',
          calculation: 'European interbank reference rate'
        },
        {
          name: 'Spread',
          value: values.spread,
          unit: '%',
          calculation: 'Margin over EURIBOR'
        },
        {
          name: 'Total Interest Rate',
          value: values.interestRate,
          unit: '%',
          calculation: `${formatNumber(values.euribor, 2)}% + ${formatNumber(values.spread, 2)}% = ${formatNumber(values.interestRate, 2)}%`
        }
      ],
      calculation: () => {
        if (isDepositProduct) {
          return `${formatNumber(values.depositStock !== undefined ? values.depositStock : values.avgAssets, 2)} × ${formatNumber(values.depositRate !== undefined ? values.depositRate : (values.ftpRate !== undefined ? values.ftpRate : values.interestRate), 2)}% = ${formatNumber(values.result, 2)}`;
        } else if (values.isFixed) {
          return `${formatNumber(values.avgAssets, 2)} × ${formatNumber(values.interestRate, 2)}% = ${formatNumber(values.result, 2)}`;
        } else {
          return `${formatNumber(values.avgAssets, 2)} × (${formatNumber(values.euribor, 2)}% + ${formatNumber(values.spread, 2)}%) = ${formatNumber(values.result, 2)}`;
        }
      }
    },
    
    interestExpense: {
      formula: isDepositProduct ? 'Deposit Stock × Deposit Interest Rate' : 'Average Performing Assets × FTP Rate (EURIBOR + FTP Spread)',
      precedents: isDepositProduct ? [
        {
          name: 'Deposit Stock',
          value: values.depositStock || values.avgAssets,
          unit: '€M',
          calculation: 'Total customer deposits'
        },
        {
          name: 'Deposit Interest Rate',
          value: values.depositRate || values.interestRate || 0,
          unit: '%',
          calculation: values.depositMix ? 'Weighted average of deposit mix rates' : 'Rate paid to customers'
        }
      ] : [
        {
          name: 'Average Performing Assets',
          value: values.avgAssets,
          unit: '€M',
          calculation: 'Weighted average of performing loan stock'
        },
        {
          name: 'EURIBOR',
          value: values.euribor || 3.5,
          unit: '%',
          calculation: 'European interbank reference rate'
        },
        {
          name: 'FTP Spread',
          value: values.ftpSpread || 1.5,
          unit: '%',
          calculation: 'Internal funding margin over EURIBOR'
        },
        {
          name: 'Total FTP Rate',
          value: values.ftpRate || 5.0,
          unit: '%',
          calculation: `${formatNumber(values.euribor || 3.5, 2)}% + ${formatNumber(values.ftpSpread || 1.5, 2)}% = ${formatNumber(values.ftpRate || 5.0, 2)}%`
        }
      ],
      calculation: () => isDepositProduct ?
        `${formatNumber(values.depositStock || values.avgAssets, 2)} × ${formatNumber(values.depositRate || values.interestRate || 0, 2)}% = ${formatNumber(Math.abs(values.result), 2)}` :
        `${formatNumber(values.avgAssets, 2)} × (${formatNumber(values.euribor || 3.5, 2)}% + ${formatNumber(values.ftpSpread || 1.5, 2)}%) = ${formatNumber(Math.abs(values.result), 2)}`
    },
    
    commissionIncome: {
      formula: isDigitalProduct ? 
        (values.isReferral ? 'New Customers × Adoption Rate × Referral Fee' : 
         values.isPremium ? 'Active Customers × Annual Revenue' :
         values.isBaseAccount ? 'Average Customers × Monthly Fee × 12' :
         'New Business Volume × Commission Rate') :
        'New Business Volume × Commission Rate',
      precedents: isDigitalProduct ? 
        (values.isReferral ? [
          {
            name: 'New Customers',
            value: values.newCustomers || 0,
            unit: 'customers',
            calculation: 'New customer acquisitions'
          },
          {
            name: 'Adoption Rate',
            value: values.adoptionRate || 0,
            unit: '%',
            calculation: 'Percentage referred to wealth management'
          },
          {
            name: 'Referral Fee',
            value: values.referralFee || 0,
            unit: '€',
            calculation: 'One-time fee per referral'
          }
        ] : values.isPremium ? [
          {
            name: 'Active Customers',
            value: values.activeCustomers || 0,
            unit: 'customers',
            calculation: 'Customers with premium services'
          },
          {
            name: 'Annual Revenue',
            value: values.annualRevenue || 0,
            unit: '€/customer',
            calculation: 'Revenue per customer per year'
          }
        ] : values.isBaseAccount ? [
          {
            name: 'Average Customers',
            value: values.avgCustomers || 0,
            unit: 'customers',
            calculation: 'Average customer base'
          },
          {
            name: 'Monthly Fee',
            value: values.monthlyFee || 0,
            unit: '€/month',
            calculation: 'Monthly account fee'
          }
        ] : []) :
        [
          {
            name: 'New Business Volume',
            value: values.volume,
            unit: '€M'
          },
          {
            name: 'Commission Rate',
            value: values.commissionRate,
            unit: '%'
          }
        ],
      calculation: () => {
        if (isDigitalProduct) {
          if (values.isReferral) {
            return `${formatNumber(values.newCustomers || 0, 0)} × ${formatNumber(values.adoptionRate || 0, 1)}% × €${formatNumber(values.referralFee || 0, 0)} = ${formatNumber(values.result, 2)}`;
          } else if (values.isPremium) {
            return `${formatNumber(values.activeCustomers || 0, 0)} × €${formatNumber(values.annualRevenue || 0, 0)} = ${formatNumber(values.result, 2)}`;
          } else if (values.isBaseAccount) {
            return `${formatNumber(values.avgCustomers || 0, 0)} × €${formatNumber(values.monthlyFee || 0, 0)} × 12 = ${formatNumber(values.result, 2)}`;
          }
        }
        return `${formatNumber(values.volume, 2)} × ${formatNumber(values.commissionRate, 2)}% = ${formatNumber(values.result, 2)}`;
      }
    },
    
    commissionExpense: {
      formula: isDigitalProduct && values.isCac ? 'New Customers × CAC' : 'Commission Income × Expense Rate',
      precedents: isDigitalProduct && values.isCac ? [
        {
          name: 'New Customers',
          value: values.newCustomers || 0,
          unit: 'customers',
          calculation: 'New customer acquisitions'
        },
        {
          name: 'Customer Acquisition Cost',
          value: values.cac || 0,
          unit: '€/customer',
          calculation: 'Cost to acquire each customer'
        }
      ] : [
        {
          name: 'Commission Income',
          value: values.commissionIncome || 0,
          unit: '€M',
          calculation: 'Total commission income'
        },
        {
          name: 'Commission Expense Rate',
          value: values.expenseRate || 0,
          unit: '%',
          calculation: 'General commission expense rate'
        }
      ],
      calculation: () => {
        if (isDigitalProduct && values.isCac) {
          return `${formatNumber(values.newCustomers || 0, 0)} × €${formatNumber(values.cac || 0, 0)} = ${formatNumber(Math.abs(values.result), 2)}`;
        }
        return `${formatNumber(values.commissionIncome || 0, 2)} × ${formatNumber(values.expenseRate || 0, 2)}% = ${formatNumber(Math.abs(values.result), 2)}`;
      }
    },
    
    llp: {
      formula: 'Expected Loss = PD × LGD × EAD',
      precedents: [
        {
          name: 'Probability of Default (PD)',
          value: values.pd * 100,
          unit: '%',
          calculation: values.creditClass === 'UTP' ? 'Base PD × 2.5 (UTP multiplier)' : 'Base PD (Bonis)'
        },
        {
          name: 'Loss Given Default (LGD)',
          value: values.lgd * 100,
          unit: '%',
          calculation: `1 - Recovery Rate (${formatNumber((1 - values.lgd) * 100, 1)}%)`
        },
        {
          name: 'Exposure at Default (EAD)',
          value: values.ead,
          unit: '€M'
        }
      ],
      calculation: () => `${formatNumber(values.pd * 100, 2)}% × ${formatNumber(values.lgd * 100, 2)}% × ${formatNumber(values.ead, 2)} = ${formatNumber(values.result, 2)} €M`
    },
    
    rwa: {
      formula: 'Performing Assets × Risk Weight',
      precedents: [
        {
          name: 'Performing Assets',
          value: values.assets,
          unit: '€M'
        },
        {
          name: 'Risk Weight',
          value: values.riskWeight * 100,
          unit: '%',
          calculation: values.creditClass === 'UTP' ? 'Base RW × 1.5 (UTP multiplier)' : 'Base RW (Bonis)'
        }
      ],
      calculation: () => `${formatNumber(values.assets, 2)} × ${formatNumber(values.riskWeight * 100, 2)}% = ${formatNumber(values.result, 2)} €M`
    }
  };
  
  const formulaConfig = baseFormulas[formulaType];
  if (!formulaConfig) return null;
  
  return createFormula(
    year,
    formulaConfig.formula,
    formulaConfig.precedents,
    formulaConfig.calculation
  );
};

/**
 * Create an aggregated formula that traces multiple products
 */
export const createAggregateFormula = (year, formulaName, products, aggregationType = 'sum') => {
  const productPrecedents = products.map(p => ({
    name: p.name,
    value: p.value,
    unit: '€M',
    calculation: p.formula || null
  }));
  
  const total = products.reduce((sum, p) => sum + (p.value || 0), 0);
  
  return createFormula(
    year,
    `${formulaName} = Sum of all products`,
    productPrecedents,
    () => {
      const calculation = products
        .filter(p => p.value && p.value !== 0)
        .map(p => `${p.name}: ${formatNumber(p.value, 2)}`)
        .join('\n+ ');
      return `${calculation}\n= ${formatNumber(total, 2)}`;
    }
  );
};

/**
 * Create a ratio formula with precedents
 */
export const createRatioFormula = (year, numeratorName, numeratorValue, denominatorName, denominatorValue, resultValue, unit = '%') => {
  return createFormula(
    year,
    `${numeratorName} / ${denominatorName}`,
    [
      {
        name: numeratorName,
        value: numeratorValue,
        unit: '€M'
      },
      {
        name: denominatorName,
        value: denominatorValue,
        unit: '€M'
      }
    ],
    () => `${formatNumber(numeratorValue, 2)} / ${formatNumber(denominatorValue, 2)} = ${formatNumber(resultValue, 2)}${unit}`
  );
};