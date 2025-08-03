/**
 * Total NBV Orchestrator
 * 
 * Coordina i 3 microservizi NBV per calcolare il valore totale degli asset
 * Prima di performing/non-performing split
 */

import { calculateBridgeLoansNBV } from './BridgeLoansNBV.js';
import { calculateFrenchNoGraceNBV } from './FrenchNoGraceNBV.js';
import { calculateFrenchWithGraceNBV } from './FrenchWithGraceNBV.js';
import { calculateNewVolumes } from '../new-volumes/NewVolumesOrchestrator.js';
import { calculateRepayments } from '../repayments/RepaymentsOrchestrator.js';

/**
 * Calculate total NBV for all credit products
 * @param {Object} divisionProducts - Products organized by division
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} Total NBV results with breakdown
 */
export const calculateTotalNBV = (divisionProducts, assumptions, quarters = 40) => {
  const results = {
    // Main balance sheet line
    totalAssets: {
      name: 'Total Assets (Gross)',
      quarterly: new Array(quarters).fill(0)
    },
    
    // Breakdown by product type
    byProductType: {
      bridgeLoans: {
        name: 'Bridge/Bullet Loans',
        quarterly: new Array(quarters).fill(0),
        products: []
      },
      frenchNoGrace: {
        name: 'French Amortization',
        quarterly: new Array(quarters).fill(0),
        products: []
      },
      frenchWithGrace: {
        name: 'French with Grace Period',
        quarterly: new Array(quarters).fill(0),
        products: []
      }
    },
    
    // Breakdown by individual product
    byProduct: {},
    
    // All vintages for downstream processing
    allVintages: {},
    
    // Metrics
    metrics: {
      totalOriginated: 0,
      totalRepaid: 0,
      peakExposure: 0,
      peakQuarter: 0
    }
  };
  
  // Process each division
  Object.entries(divisionProducts).forEach(([divKey, division]) => {
    const productsToProcess = division.products || division;
    
    Object.entries(productsToProcess).forEach(([productKey, product]) => {
      const productConfig = product.originalProduct || product;
      
      // Only process credit products
      if (!isCreditProduct(productConfig)) return;
      
      // Route to appropriate NBV calculator
      let nbvResults = null;
      let productType = null;
      
      if (isProductType(productConfig, 'bridge', 'bullet')) {
        nbvResults = calculateBridgeLoansNBV(productConfig, assumptions, quarters);
        productType = 'bridgeLoans';
      } else if (isProductType(productConfig, 'french') && !productConfig.gracePeriod) {
        nbvResults = calculateFrenchNoGraceNBV(productConfig, assumptions, quarters);
        productType = 'frenchNoGrace';
      } else if (isProductType(productConfig, 'french') && productConfig.gracePeriod > 0) {
        nbvResults = calculateFrenchWithGraceNBV(productConfig, assumptions, quarters);
        productType = 'frenchWithGrace';
      }
      
      if (nbvResults && productType) {
        // Store vintages
        results.allVintages[productKey] = nbvResults.vintages;
        
        // Store product-level NBV
        results.byProduct[productKey] = {
          name: productConfig.name,
          quarterlyNBV: nbvResults.quarterlyNBV,
          metrics: nbvResults.metrics
        };
        
        // Add to product type totals
        nbvResults.quarterlyNBV.forEach((nbv, q) => {
          results.byProductType[productType].quarterly[q] += nbv;
          results.totalAssets.quarterly[q] += nbv;
        });
        
        // Store product detail
        results.byProductType[productType].products.push({
          key: productKey,
          name: productConfig.name,
          quarterly: nbvResults.quarterlyNBV,
          metrics: nbvResults.metrics,
          vintages: nbvResults.vintages
        });
        
        // Update overall metrics
        results.metrics.totalOriginated += nbvResults.metrics.totalOriginated;
        results.metrics.totalRepaid += nbvResults.metrics.totalRepaid;
      }
    });
  });
  
  // Calculate peak exposure
  results.totalAssets.quarterly.forEach((total, q) => {
    if (total > results.metrics.peakExposure) {
      results.metrics.peakExposure = total;
      results.metrics.peakQuarter = q;
    }
  });
  
  // Add annual summaries
  results.totalAssets.annual = quarterlyToAnnual(results.totalAssets.quarterly);
  Object.keys(results.byProductType).forEach(type => {
    results.byProductType[type].annual = quarterlyToAnnual(
      results.byProductType[type].quarterly
    );
  });
  
  // Step 2: Calculate new volumes detail
  const volumesResults = calculateNewVolumes(divisionProducts, assumptions, quarters);
  //   hasResults: !!volumesResults,
  //   resultKeys: volumesResults ? Object.keys(volumesResults) : [],
  //   byProductKeys: volumesResults?.byProduct ? Object.keys(volumesResults.byProduct) : [],
  //   sampleProductData: volumesResults?.byProduct ? volumesResults.byProduct[Object.keys(volumesResults.byProduct)[0]] : null
  // });
  results.newVolumes = volumesResults;
  
  // Step 3: Calculate repayments detail using the vintages we collected
  const repaymentsResults = calculateRepayments(divisionProducts, assumptions, results.allVintages, quarters);
  results.repayments = repaymentsResults;
  
  return results;
};

/**
 * Check if product is a credit product
 * @private
 */
const isCreditProduct = (product) => {
  return product.productType === 'Credit' || 
         product.type === 'french' ||
         product.type === 'bullet' ||
         product.type === 'bridge' ||
         !product.productType; // Default assume credit if not specified
};

/**
 * Check product type
 * @private
 */
const isProductType = (product, ...types) => {
  const productType = product.type || product.productType || '';
  return types.some(type => 
    productType.toLowerCase().includes(type.toLowerCase())
  );
};

/**
 * Convert quarterly to annual (year-end values)
 * @private
 */
const quarterlyToAnnual = (quarterlyData) => {
  const annual = [];
  for (let year = 0; year < 10; year++) {
    annual.push(quarterlyData[year * 4 + 3] || 0);
  }
  return annual;
};