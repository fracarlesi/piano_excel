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
  const baseFormulas = {
    interestIncome: {
      formula: 'Average Performing Assets × Interest Rate',
      precedents: [
        {
          name: 'Average Performing Assets',
          value: values.avgAssets,
          unit: '€M',
          calculation: 'Weighted average of performing loan stock'
        },
        {
          name: 'Interest Rate',
          value: values.interestRate,
          unit: '%',
          calculation: values.isFixed ? 'Fixed Rate (Spread + 2%)' : `EURIBOR (${formatNumber(values.euribor, 1)}%) + Spread (${formatNumber(values.spread, 1)}%)`
        },
        {
          name: 'Product Type',
          value: product.type || 'amortizing',
          calculation: `${product.gracePeriod ? `Grace period: ${product.gracePeriod} years` : 'No grace period'}`
        }
      ],
      calculation: () => `${formatNumber(values.avgAssets, 2)} × ${formatNumber(values.interestRate, 2)}% = ${formatNumber(values.result, 2)} €M`
    },
    
    commissionIncome: {
      formula: 'New Business Volume × Commission Rate',
      precedents: [
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
      calculation: () => `${formatNumber(values.volume, 2)} × ${formatNumber(values.commissionRate, 2)}% = ${formatNumber(values.result, 2)} €M`
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
      return `${calculation}\n= ${formatNumber(total, 2)} €M`;
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