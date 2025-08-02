/**
 * Loan Loss Provisions Calculator
 * 
 * Calcola gli accantonamenti per perdite su crediti
 */

/**
 * Calcola gli accantonamenti LLP
 * @param {Object} balanceSheetResults - Risultati del balance sheet
 * @param {Object} assumptions - Assumptions complete
 * @param {Array} years - Array degli anni
 * @returns {Object} LLP per divisione
 */
export const calculateLoanLossProvisions = (balanceSheetResults, assumptions, years) => {
  console.log('📉 Loan Loss Provisions Calculator - Start');
  
  const results = {
    consolidated: new Array(10).fill(0),
    byDivision: {}
  };
  
  // Initialize division arrays
  const divisions = ['realEstate', 'sme', 'wealth', 'incentive', 'digitalBanking'];
  divisions.forEach(div => {
    results.byDivision[div] = new Array(10).fill(0);
  });
  
  // Get defaulted assets data
  const gbvDefaulted = balanceSheetResults.details?.gbvDefaulted || {};
  const defaultsByProduct = gbvDefaulted.byProduct || {};
  
  // Calculate LLP for each product
  Object.entries(defaultsByProduct).forEach(([productKey, productDefaults]) => {
    // Get product configuration
    const productConfig = assumptions.products?.[productKey];
    if (!productConfig) return;
    
    // Skip non-credit products
    if (productConfig.productType === 'DepositAndService' || productConfig.isDigital) {
      return;
    }
    
    // Calculate expected loss based on product risk parameters
    const lgd = productConfig.isUnsecured ? 
      (productConfig.unsecuredLGD || 45) / 100 : 
      calculateSecuredLGD(productConfig);
    
    // Apply state guarantee reduction if present
    const guaranteeReduction = productConfig.stateGuaranteeType === 'present' ? 
      (productConfig.stateGuaranteeCoverage || 0) / 100 : 0;
    
    const effectiveLGD = lgd * (1 - guaranteeReduction);
    
    // Calculate annual LLP based on new defaults
    const annualDefaults = productDefaults.annual || new Array(10).fill(0);
    
    annualDefaults.forEach((defaults, year) => {
      const llp = -defaults * effectiveLGD; // Negative because it's an expense
      results.consolidated[year] += llp;
      
      // Add to division
      const division = getDivisionFromProduct(productKey);
      if (division && results.byDivision[division]) {
        results.byDivision[division][year] += llp;
      }
    });
  });
  
  console.log('📉 Loan Loss Provisions - Complete');
  console.log(`  Total LLP Y1: €${Math.abs(results.consolidated[0]).toFixed(2)}M`);
  
  return results;
};

/**
 * Calcola LGD per prodotti secured
 * @private
 */
const calculateSecuredLGD = (product) => {
  const ltv = product.ltv || 70;
  const haircut = product.collateralHaircut || 25;
  const recoveryCosts = product.recoveryCosts || 15;
  
  // Simplified LGD calculation
  const collateralRecovery = (100 / ltv) * (1 - haircut / 100);
  const netRecovery = Math.max(0, collateralRecovery - recoveryCosts / 100);
  
  return Math.max(0, 1 - netRecovery);
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