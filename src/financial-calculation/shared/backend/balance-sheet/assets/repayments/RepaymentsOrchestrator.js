/**
 * Repayments Orchestrator
 * 
 * Coordina il calcolo dei rimborsi di capitale per tutti i prodotti creditizi
 * Fornisce dettaglio temporale dei rimborsi per prodotto
 */

import { calculateBridgeLoansRepayments } from './BridgeLoansRepayments.js';
import { calculateFrenchNoGraceRepayments } from './FrenchNoGraceRepayments.js';
import { calculateFrenchWithGraceRepayments } from './FrenchWithGraceRepayments.js';

/**
 * Calculate repayments for all credit products
 * @param {Object} divisionProducts - Products organized by division with vintages
 * @param {Object} assumptions - Global assumptions
 * @param {Object} vintagesByProduct - Pre-calculated vintages from NBV calculations
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} Repayment results with product breakdown
 */
export const calculateRepayments = (divisionProducts, assumptions, vintagesByProduct, quarters = 40) => {
  const results = {
    // Consolidated quarterly repayments
    totalRepayments: {
      name: 'Total Principal Repayments',
      quarterly: new Array(quarters).fill(0),
      annual: new Array(10).fill(0)
    },
    
    // Breakdown by product type
    byProductType: {
      bridgeLoans: {
        name: 'Bridge/Bullet Repayments',
        quarterly: new Array(quarters).fill(0),
        annual: new Array(10).fill(0),
        products: []
      },
      frenchNoGrace: {
        name: 'French Amortization Repayments',
        quarterly: new Array(quarters).fill(0),
        annual: new Array(10).fill(0),
        products: []
      },
      frenchWithGrace: {
        name: 'French with Grace Repayments',
        quarterly: new Array(quarters).fill(0),
        annual: new Array(10).fill(0),
        products: []
      }
    },
    
    // Product-level detail
    byProduct: {},
    
    // Metrics
    metrics: {
      totalRepayments10Y: 0,
      averageQuarterlyRepayment: 0,
      peakQuarterlyRepayment: 0,
      peakQuarter: 0,
      firstRepaymentQuarter: null,
      lastRepaymentQuarter: null
    }
  };
  
  // Process each division
  Object.entries(divisionProducts).forEach(([divKey, division]) => {
    const productsToProcess = division.products || division;
    
    Object.entries(productsToProcess).forEach(([productKey, product]) => {
      const productConfig = product.originalProduct || product;
      const productVintages = vintagesByProduct[productKey] || [];
      
      // Only process credit products with vintages
      if (!isCreditProduct(productConfig) || productVintages.length === 0) return;
      
      // Route to appropriate repayment calculator
      let repaymentResults = null;
      let productType = null;
      
      if (isProductType(productConfig, 'bridge', 'bullet')) {
        repaymentResults = calculateBridgeLoansRepayments(
          productConfig, 
          productVintages, 
          assumptions, 
          quarters
        );
        productType = 'bridgeLoans';
      } else if (isProductType(productConfig, 'french') && !productConfig.gracePeriod) {
        repaymentResults = calculateFrenchNoGraceRepayments(
          productConfig, 
          productVintages, 
          assumptions, 
          quarters
        );
        productType = 'frenchNoGrace';
      } else if (isProductType(productConfig, 'french') && productConfig.gracePeriod > 0) {
        repaymentResults = calculateFrenchWithGraceRepayments(
          productConfig, 
          productVintages, 
          assumptions, 
          quarters
        );
        productType = 'frenchWithGrace';
      }
      
      if (repaymentResults && productType) {
        // Store product-level detail
        results.byProduct[productKey] = repaymentResults;
        
        // Add to type totals
        repaymentResults.quarterlyRepayments.forEach((repayment, q) => {
          results.byProductType[productType].quarterly[q] += repayment;
          results.totalRepayments.quarterly[q] += repayment;
        });
        
        // Calculate annual totals
        for (let year = 0; year < 10; year++) {
          let annualRepayment = 0;
          for (let q = 0; q < 4; q++) {
            const quarterIndex = year * 4 + q;
            if (quarterIndex < quarters) {
              annualRepayment += repaymentResults.quarterlyRepayments[quarterIndex];
            }
          }
          results.byProductType[productType].annual[year] += annualRepayment;
          results.totalRepayments.annual[year] += annualRepayment;
        }
        
        // Store product reference
        results.byProductType[productType].products.push({
          key: productKey,
          name: productConfig.name,
          quarterly: repaymentResults.quarterlyRepayments,
          metrics: repaymentResults.metrics,
          vintageDetails: repaymentResults.vintageRepayments
        });
        
        // Update metrics
        results.metrics.totalRepayments10Y += repaymentResults.metrics.totalRepaid;
        
        // Track first and last repayment
        repaymentResults.quarterlyRepayments.forEach((repayment, q) => {
          if (repayment > 0) {
            if (results.metrics.firstRepaymentQuarter === null) {
              results.metrics.firstRepaymentQuarter = q;
            }
            results.metrics.lastRepaymentQuarter = q;
          }
        });
      }
    });
  });
  
  // Calculate consolidated metrics
  let totalQuarterlyRepayments = 0;
  let quartersWithRepayments = 0;
  
  results.totalRepayments.quarterly.forEach((repayment, q) => {
    if (repayment > 0) {
      totalQuarterlyRepayments += repayment;
      quartersWithRepayments++;
      
      if (repayment > results.metrics.peakQuarterlyRepayment) {
        results.metrics.peakQuarterlyRepayment = repayment;
        results.metrics.peakQuarter = q;
      }
    }
  });
  
  if (quartersWithRepayments > 0) {
    results.metrics.averageQuarterlyRepayment = totalQuarterlyRepayments / quartersWithRepayments;
  }
  
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