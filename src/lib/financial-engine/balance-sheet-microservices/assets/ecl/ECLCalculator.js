/**
 * ECL Calculator (Expected Credit Loss) - Balance Sheet Microservice
 * 
 * Calcola le ECL provisions per il Balance Sheet secondo IFRS 9:
 * - ECL = EAD × PD × LGD
 * - EAD = Esposizione al momento dell'erogazione
 * - PD = Danger Rate del prodotto
 * - LGD = Loss Given Default (considerando garanzie pubbliche)
 * 
 * Logica Balance Sheet:
 * - ECL provision viene calcolata al momento dell'erogazione
 * - Rimane costante per la vita del prestito (modello semplificato)
 * - Stock NBV Performing Post-ECL = Stock NBV Performing - ECL Provision
 */

import { getProductLGD, isUnsecuredProduct } from '../../recovery-default/index.js';

/**
 * Calcola ECL provision per ogni trimestre basata sullo stock NBV performing
 * @param {Object} newVolumesResults - Nuove erogazioni trimestrali
 * @param {Object} stockNBVPerformingResults - Stock NBV performing trimestrale
 * @param {Object} assumptions - Assumptions con prodotti e danger rates
 * @param {number} quarters - Numero di trimestri
 * @returns {Object} ECL provision accumulate per prodotto
 */
export const calculateECLProvision = (newVolumesResults, stockNBVPerformingResults, assumptions, quarters = 40) => {
  // Disabled for ECL analysis
  // console.log('💰 ECL Calculator (Balance Sheet) - Start');
  // console.log('  - New Volumes available:', !!newVolumesResults);
  // console.log('  - Stock NBV Performing available:', !!stockNBVPerformingResults);
  
  const results = {
    // Stock ECL Provision (accumula trimestre per trimestre)
    consolidated: {
      quarterlyProvision: new Array(quarters).fill(0),    // ECL provision stock
      quarterlyAddition: new Array(quarters).fill(0),     // New ECL added each quarter
      annual: new Array(10).fill(0)
    },
    
    // Dettaglio per prodotto
    byProduct: {},
    
    // Dettaglio per divisione
    byDivision: {},
    
    // Metriche
    metrics: {
      totalProvisionStock: 0,
      averageECLRate: 0,
      peakQuarterlyAddition: 0,
      peakAdditionQuarter: 0
    }
  };
  
  // Get all credit products
  const creditProducts = getCreditProducts(assumptions);
  
  // Process each product
  creditProducts.forEach(product => {
    const productKey = product.key || product.id;
    // Disabled for ECL analysis
    // console.log(`\n📊 Processing ECL for product: ${product.name} (key: ${productKey})`);
    
    // Get new volumes for this product
    const newVolumes = newVolumesResults?.byProduct?.[productKey]?.quarterlyVolumes || new Array(quarters).fill(0);
    
    // Get stock NBV performing for this product
    const stockNBVPerforming = stockNBVPerformingResults?.byProduct?.[productKey]?.quarterly || new Array(quarters).fill(0);
    
    // Calculate effective LGD
    const lgdEffective = calculateEffectiveLGD(product);
    const dangerRate = product.dangerRate / 100; // Convert to decimal
    
    // Disabled for ECL analysis
    // console.log(`  - Danger Rate: ${(dangerRate * 100).toFixed(2)}%`);
    // console.log(`  - LGD Effective: ${(lgdEffective * 100).toFixed(2)}%`);
    
    // Initialize product results
    const productResults = {
      productName: product.name,
      productType: product.productType,
      dangerRate: dangerRate,
      lgdBase: getBaseLGD(product),
      lgdEffective: lgdEffective,
      hasStateGuarantee: hasStateGuarantee(product),
      
      // ECL provision tracking
      quarterlyProvision: new Array(quarters).fill(0),  // ECL stock based on performing NBV
      quarterlyAddition: new Array(quarters).fill(0),   // Change in ECL each quarter
      newVolumes: newVolumes,
      stockNBVPerforming: stockNBVPerforming
    };
    
    // Calculate ECL provision for each quarter based on Stock NBV Performing
    for (let q = 0; q < quarters; q++) {
      // ECL on entire performing stock
      const performingStock = stockNBVPerforming[q] || 0;
      const eclOnStock = performingStock * dangerRate * lgdEffective;
      
      // Store current quarter ECL
      productResults.quarterlyProvision[q] = eclOnStock;
      
      // Calculate quarter-on-quarter addition
      if (q === 0) {
        productResults.quarterlyAddition[q] = eclOnStock;
      } else {
        productResults.quarterlyAddition[q] = eclOnStock - productResults.quarterlyProvision[q-1];
        
        // Log when ECL decreases (negative addition = release)
        if (productResults.quarterlyAddition[q] < 0) {
          console.log(`📉 ECL RELEASE Q${q} - ${product.name}: €${productResults.quarterlyProvision[q-1].toFixed(2)}M → €${eclOnStock.toFixed(2)}M = Release €${Math.abs(productResults.quarterlyAddition[q]).toFixed(2)}M`);
        }
      }
      
      // Disabled for ECL analysis
      // if (performingStock > 0 && (q < 4 || q % 4 === 0)) {
      //   console.log(`  Q${q}: Stock NBV Performing: €${performingStock.toFixed(2)}M, ECL: €${eclOnStock.toFixed(2)}M`);
      // }
    }
    
    // Store product results
    results.byProduct[productKey] = productResults;
    
    // Aggregate to consolidated
    productResults.quarterlyProvision.forEach((provision, q) => {
      results.consolidated.quarterlyProvision[q] += provision;
    });
    productResults.quarterlyAddition.forEach((addition, q) => {
      results.consolidated.quarterlyAddition[q] += addition;
    });
  });
  
  // Calculate annual totals
  for (let year = 0; year < 10; year++) {
    // Take the provision stock at year end (Q3 of each year)
    const yearEndQuarter = Math.min(year * 4 + 3, quarters - 1);
    results.consolidated.annual[year] = results.consolidated.quarterlyProvision[yearEndQuarter];
  }
  
  // Aggregate by division (matching product keys from defaultAssumptions.js)
  const divisionMap = {
    're': ['reSecuritization', 'reMortgage', 'reBridge'],
    'sme': ['smeRefinancing', 'smeBridge', 'smeSpecialSituation', 'smeNuovaFinanza', 'smeRestructuring'],
    'wealth': [], // No wealth products defined yet
    'incentive': [], // No incentive products defined yet
    'digital': [] // digitalRetailCustomer is a deposit product, not credit
  };
  
  Object.entries(divisionMap).forEach(([divKey, products]) => {
    const divisionProvision = new Array(quarters).fill(0);
    const divisionAddition = new Array(quarters).fill(0);
    const divisionAnnual = new Array(10).fill(0);
    
    products.forEach(productKey => {
      if (results.byProduct[productKey]) {
        // Aggregate quarterly provision
        results.byProduct[productKey].quarterlyProvision.forEach((provision, q) => {
          divisionProvision[q] += provision;
        });
        
        // Aggregate quarterly additions
        results.byProduct[productKey].quarterlyAddition.forEach((addition, q) => {
          divisionAddition[q] += addition;
        });
      }
    });
    
    // Calculate annual for division
    for (let year = 0; year < 10; year++) {
      const yearEndQuarter = Math.min(year * 4 + 3, quarters - 1);
      divisionAnnual[year] = divisionProvision[yearEndQuarter];
    }
    
    results.byDivision[divKey] = {
      quarterlyProvision: divisionProvision,
      quarterlyAddition: divisionAddition,
      annual: divisionAnnual,
      products: products.filter(p => results.byProduct[p])
    };
  });
  
  // Calculate metrics
  results.metrics.totalProvisionStock = results.consolidated.quarterlyProvision[quarters - 1];
  
  // Find peak quarterly addition
  results.consolidated.quarterlyAddition.forEach((addition, q) => {
    if (addition > results.metrics.peakQuarterlyAddition) {
      results.metrics.peakQuarterlyAddition = addition;
      results.metrics.peakAdditionQuarter = q;
    }
  });
  
  // Calculate average ECL rate (total provision / total originations)
  const totalOriginations = Object.values(results.byProduct).reduce(
    (sum, prod) => sum + prod.newVolumes.reduce((a, b) => a + b, 0), 0
  );
  results.metrics.averageECLRate = totalOriginations > 0 
    ? results.metrics.totalProvisionStock / totalOriginations 
    : 0;
  
  console.log('\n💰 ECL SUMMARY: Final Stock €' + results.metrics.totalProvisionStock.toFixed(1) + 'M');
  
  return results;
};

/**
 * Calculate effective LGD considering state guarantees
 * @private
 */
const calculateEffectiveLGD = (product) => {
  // Get base LGD
  const baseLGD = getBaseLGD(product);
  
  // Check for state guarantee
  if (hasStateGuarantee(product)) {
    const coveragePercentage = getStateGuaranteeCoverage(product) / 100;
    // LGD_effective = MAX(LGD_base - Coverage%, 0)
    const effectiveLGD = Math.max(baseLGD - coveragePercentage, 0);
    
    // Disabled for ECL analysis
    // console.log(`    State guarantee: ${product.stateGuaranteeType} with ${(coveragePercentage * 100)}% coverage`);
    // console.log(`    LGD reduction: ${(baseLGD * 100).toFixed(1)}% → ${(effectiveLGD * 100).toFixed(1)}%`);
    
    return effectiveLGD;
  }
  
  return baseLGD;
};

/**
 * Get base LGD for product
 * @private
 */
const getBaseLGD = (product) => {
  if (isUnsecuredProduct(product)) {
    // Unsecured: use direct LGD
    return (product.unsecuredLGD || 45) / 100;
  } else {
    // Secured: LGD = 100% - Recovery Rate
    const ltv = (product.ltv || 70) / 100;
    const haircut = (product.collateralHaircut || 20) / 100;
    const recoveryCosts = (product.recoveryCosts || 10) / 100;
    
    // Recovery Rate calculation (simplified)
    const collateralValue = 1 / ltv;
    const grossRecovery = collateralValue * (1 - haircut);
    const netRecovery = grossRecovery * (1 - recoveryCosts);
    const recoveryRate = Math.min(netRecovery, 1);
    
    return 1 - recoveryRate;
  }
};

/**
 * Check if product has state guarantee
 * @private
 */
const hasStateGuarantee = (product) => {
  return product.stateGuaranteeType && 
         product.stateGuaranteeType !== 'none' && 
         product.stateGuaranteeType !== 'notPresent';
};

/**
 * Get state guarantee coverage percentage
 * @private
 */
const getStateGuaranteeCoverage = (product) => {
  if (!hasStateGuarantee(product)) return 0;
  
  // Default coverage percentages by guarantee type
  const coverageMap = {
    'mcc': 80,
    'sace': 70,
    'present': 75 // Generic state guarantee
  };
  
  return product.stateGuaranteeCoverage || 
         coverageMap[product.stateGuaranteeType?.toLowerCase()] || 
         75;
};

/**
 * Get all credit products from assumptions
 * @private
 */
const getCreditProducts = (assumptions) => {
  const products = [];
  
  // Disabled for ECL analysis
  // console.log('🔍 Getting credit products from assumptions');
  
  // Products are directly under assumptions.products in defaultAssumptions.js
  if (assumptions.products) {
    Object.entries(assumptions.products).forEach(([prodKey, product]) => {
      // Disabled - console.log(`  Product ${prodKey}: dangerRate=${product.dangerRate}`);
      
      // Include all products with danger rate (credit products)
      if (product.dangerRate !== undefined) {
        // Determine division from product key
        let divisionKey = '';
        if (prodKey.startsWith('re')) divisionKey = 'realEstateDivision';
        else if (prodKey.startsWith('sme')) divisionKey = 'smeDivision';
        else if (prodKey.startsWith('wealth')) divisionKey = 'wealthDivision';
        else if (prodKey.startsWith('incentive')) divisionKey = 'incentiveDivision';
        else if (prodKey.startsWith('digital')) divisionKey = 'digitalBankingDivision';
        
        products.push({
          ...product,
          key: prodKey,
          divisionKey: divisionKey,
          productType: product.productType || 'credit' // Default to credit if not specified
        });
      }
    });
  }
  
  // Disabled - console.log(`  Total credit products found: ${products.length}`);
  return products;
};

/**
 * Format ECL data for Balance Sheet display
 * @param {Object} eclResults - Results from calculateECLProvision
 * @param {string} view - View type ('consolidated', 'byDivision', 'byProduct')
 * @returns {Object} Formatted data for UI
 */
export const formatECLForBalanceSheet = (eclResults, view = 'consolidated') => {
  switch (view) {
    case 'consolidated':
      return {
        label: 'ECL Provision',
        quarterly: eclResults.consolidated.quarterlyProvision,
        annual: eclResults.consolidated.annual,
        additions: eclResults.consolidated.quarterlyAddition,
        metrics: eclResults.metrics
      };
      
    case 'byDivision':
      return Object.entries(eclResults.byDivision).map(([divKey, divData]) => ({
        divisionKey: divKey,
        label: `ECL Provision - ${divKey.toUpperCase()}`,
        quarterly: divData.quarterlyProvision,
        annual: divData.annual,
        productCount: divData.products.length
      }));
      
    case 'byProduct':
      return Object.entries(eclResults.byProduct).map(([prodKey, prodData]) => ({
        productKey: prodKey,
        label: `ECL - ${prodData.productName}`,
        quarterly: prodData.quarterlyProvision,
        additions: prodData.quarterlyAddition,
        parameters: {
          dangerRate: prodData.dangerRate,
          lgdBase: prodData.lgdBase,
          lgdEffective: prodData.lgdEffective,
          hasStateGuarantee: prodData.hasStateGuarantee
        }
      }));
      
    default:
      return eclResults;
  }
};