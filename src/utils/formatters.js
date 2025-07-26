// Helper function to format numbers
export const formatNumber = (num, decimals = 1, unit = '') => {
  if (num === null || typeof num !== 'number' || isNaN(num)) return '';
  const formatted = num.toLocaleString('it-IT', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
  return `${formatted}${unit}`;
};

// Export data utility functions
export const exportData = (data) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `bank-plan-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};