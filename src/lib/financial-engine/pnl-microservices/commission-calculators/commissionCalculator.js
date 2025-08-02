/**
 * Commission Calculator
 * 
 * Calcola le commissioni attive sui prodotti di credito
 */

/**
 * Calcola le commissioni attive
 * @param {Object} balanceSheetResults - Risultati del balance sheet
 * @param {Object} assumptions - Assumptions complete
 * @param {Array} years - Array degli anni
 * @returns {Object} Commissioni per divisione
 */
export const calculateCommissionIncome = (balanceSheetResults, assumptions, years) => {
  console.log('💵 Commission Income Calculator - Start');
  
  const results = {
    consolidated: new Array(10).fill(0),
    byDivision: {}
  };
  
  // Initialize division arrays
  const divisions = ['realEstate', 'sme', 'wealth', 'incentive', 'digitalBanking'];
  divisions.forEach(div => {
    results.byDivision[div] = new Array(10).fill(0);
  });
  
  // Get new volumes by product from balance sheet
  const newVolumes = balanceSheetResults.details?.newVolumesData || {};
  const volumesByProduct = newVolumes.byProduct || {};
  
  // Calculate commissions for each product
  Object.entries(volumesByProduct).forEach(([productKey, volumes]) => {
    // Get product configuration
    const productConfig = assumptions.products?.[productKey];
    if (!productConfig) return;
    
    // Skip non-credit products
    if (productConfig.productType === 'DepositAndService' || productConfig.isDigital) {
      return;
    }
    
    const commissionRate = (productConfig.commissionRate || 0) / 100;
    
    // Calculate annual commissions based on new volumes
    volumes.forEach((volume, year) => {
      const commission = volume * commissionRate;
      results.consolidated[year] += commission;
      
      // Add to division
      const division = getDivisionFromProduct(productKey);
      if (division && results.byDivision[division]) {
        results.byDivision[division][year] += commission;
      }
    });
  });
  
  console.log('💵 Commission Income - Complete');
  console.log(`  Total commissions Y1: €${results.consolidated[0].toFixed(2)}M`);
  
  return results;
};

/**
 * Determina la divisione dal nome del prodotto
 * @private
 */
const getDivisionFromProduct = (productKey) => {
  const key = productKey.toLowerCase();
  
  if (key.startsWith('re')) return 'realEstate';
  if (key.startsWith('sme')) return 'sme';
  if (key.startsWith('wealth')) return 'wealth';
  if (key.startsWith('incentive')) return 'incentive';
  if (key.startsWith('digital')) return 'digitalBanking';
  
  return null;
};