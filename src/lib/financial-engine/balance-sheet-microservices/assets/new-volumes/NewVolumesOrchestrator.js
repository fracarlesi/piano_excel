/**
 * New Volumes Orchestrator
 * 
 * Coordina il calcolo dei nuovi volumi erogati per tutti i prodotti creditizi
 * Fornisce dettaglio temporale delle erogazioni per prodotto
 */

import { calculateBridgeLoansVolumes } from './BridgeLoansVolumes.js';
import { calculateFrenchNoGraceVolumes } from './FrenchNoGraceVolumes.js';
import { calculateFrenchWithGraceVolumes } from './FrenchWithGraceVolumes.js';

/**
 * Calculate new volumes for all credit products
 * @param {Object} divisionProducts - Products organized by division
 * @param {Object} assumptions - Global assumptions
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} New volumes results with product breakdown
 */
export const calculateNewVolumes = (divisionProducts, assumptions, quarters = 40) => {
  
  const results = {
    // Consolidated quarterly volumes
    totalNewVolumes: {
      name: 'Total New Volumes',
      quarterly: new Array(quarters).fill(0),
      annual: new Array(10).fill(0)
    },
    
    // Breakdown by product type
    byProductType: {
      bridgeLoans: {
        name: 'Bridge/Bullet Loans',
        quarterly: new Array(quarters).fill(0),
        annual: new Array(10).fill(0),
        products: []
      },
      frenchNoGrace: {
        name: 'French Amortization',
        quarterly: new Array(quarters).fill(0),
        annual: new Array(10).fill(0),
        products: []
      },
      frenchWithGrace: {
        name: 'French with Grace Period',
        quarterly: new Array(quarters).fill(0),
        annual: new Array(10).fill(0),
        products: []
      }
    },
    
    // Product-level detail
    byProduct: {},
    
    // Metrics
    metrics: {
      totalVolumes10Y: 0,
      averageQuarterlyVolume: 0,
      peakQuarterlyVolume: 0,
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
      
      // Route to appropriate volume calculator
      let volumeResults = null;
      let productType = null;
      
      if (isProductType(productConfig, 'bridge', 'bullet')) {
        volumeResults = calculateBridgeLoansVolumes(productConfig, assumptions, quarters);
        productType = 'bridgeLoans';
      } else if (isProductType(productConfig, 'french') && !productConfig.gracePeriod) {
        volumeResults = calculateFrenchNoGraceVolumes(productConfig, assumptions, quarters);
        productType = 'frenchNoGrace';
      } else if (isProductType(productConfig, 'french') && productConfig.gracePeriod > 0) {
        volumeResults = calculateFrenchWithGraceVolumes(productConfig, assumptions, quarters);
        productType = 'frenchWithGrace';
      }
      
      if (volumeResults && productType) {
        
        // Store product-level detail
        results.byProduct[productKey] = volumeResults;
        
        // Add to type totals
        volumeResults.quarterlyVolumes.forEach((volume, q) => {
          results.byProductType[productType].quarterly[q] += volume;
          results.totalNewVolumes.quarterly[q] += volume;
        });
        
        // Add to annual totals
        for (let year = 0; year < 10; year++) {
          const annualVolume = volumeResults.annualVolumes[year] || 0;
          results.byProductType[productType].annual[year] += annualVolume;
          results.totalNewVolumes.annual[year] += annualVolume;
        }
        
        // Store product reference
        results.byProductType[productType].products.push({
          key: productKey,
          name: productConfig.name,
          quarterly: volumeResults.quarterlyVolumes,
          annual: volumeResults.annualVolumes,
          metrics: volumeResults.metrics
        });
        
        // Update metrics
        results.metrics.totalVolumes10Y += volumeResults.metrics.totalVolume;
      }
    });
  });
  
  // Calculate consolidated metrics
  let totalQuarterlyVolume = 0;
  results.totalNewVolumes.quarterly.forEach((volume, q) => {
    totalQuarterlyVolume += volume;
    if (volume > results.metrics.peakQuarterlyVolume) {
      results.metrics.peakQuarterlyVolume = volume;
      results.metrics.peakQuarter = q;
    }
  });
  
  results.metrics.averageQuarterlyVolume = totalQuarterlyVolume / quarters;
  
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
         !product.productType;
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