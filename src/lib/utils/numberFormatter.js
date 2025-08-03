/**
 * Number Formatting Utilities
 */

/**
 * Format numbers with Italian locale
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @param {string} unit - Unit to append (e.g., '%', '€')
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, decimals = 1, unit = '') => {
  if (num === null || typeof num !== 'number' || isNaN(num)) return '';
  const formatted = num.toLocaleString('it-IT', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
  return `${formatted}${unit}`;
};