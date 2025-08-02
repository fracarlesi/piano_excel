/**
 * GBV Defaulted Orchestrator
 * 
 * MICROSERVIZIO CENTRALE per tutti i calcoli di default
 * Calcola il GBV (Gross Book Value) che va in default in ogni trimestre
 * applicando il danger rate al momento specifico del default timing
 * 
 * Questo è l'UNICO punto dove vengono calcolati i default per:
 * - Balance Sheet (GBV Defaulted)
 * - P&L (LLP - Loan Loss Provisions)
 * - NPL Stock calculations
 */

/**
 * Calculate GBV Defaulted for all credit products
 * @param {Object} divisionProducts - Products organized by division
 * @param {Object} assumptions - Global assumptions
 * @param {Object} totalAssetsResults - Results from TotalAssetsOrchestrator containing vintages
 * @param {number} quarters - Number of quarters (default 40)
 * @returns {Object} GBV Defaulted results with breakdown
 */
export const calculateGBVDefaulted = (divisionProducts, assumptions, totalAssetsResults, quarters = 40) => {
  const results = {
    // Main balance sheet line - shows NEW defaults each quarter
    gbvDefaulted: {
      name: 'GBV Defaulted',
      quarterly: new Array(quarters).fill(0)
    },
    
    // Breakdown by product
    byProduct: {},
    
    // Detailed default data for other microservices
    defaultsByVintage: new Map(), // Map<vintageId, Array<quarterlyDefaults>>
    defaultsByQuarter: new Array(quarters).fill(null).map(() => []), // Array of default events per quarter
    
    // Metrics
    metrics: {
      totalDefaults: 0,
      averageDangerRate: 0,
      peakDefaults: 0,
      peakQuarter: 0
    }
  };
  
  // Get vintages from totalAssetsResults
  const vintagesByProduct = totalAssetsResults.allVintages || totalAssetsResults.vintages || {};
  
  let totalDangerRateWeighted = 0;
  
  // Process each division
  Object.entries(divisionProducts).forEach(([divKey, division]) => {
    const productsToProcess = division.products || division;
    
    Object.entries(productsToProcess).forEach(([productKey, product]) => {
      const productConfig = product.originalProduct || product;
      
      // Only process credit products
      if (!isCreditProduct(productConfig)) return;
      
      // Get vintages for this product
      const productVintages = vintagesByProduct[productKey] || [];
      if (productVintages.length === 0) return;
      
      // Get danger rate for this product (default 1.5% if not specified)
      // Note: dangerRate is stored as percentage (e.g., 1.5 for 1.5%)
      // Use 0 if explicitly set to 0, otherwise default to 1.5%
      const dangerRate = (productConfig.dangerRate !== undefined ? productConfig.dangerRate : 1.5) / 100;
      
      console.log(`📊 GBV Defaulted - Product ${productKey}:`, {
        productName: productConfig.name,
        dangerRate: dangerRate * 100,
        defaultTiming: productConfig.defaultAfterQuarters || 8,
        vintageCount: productVintages.length
      });
      
      // Get default timing (quarters after origination when default occurs)
      // Default to 8 quarters (2 years) if not specified
      const defaultTiming = productConfig.defaultAfterQuarters || 8;
      
      // Calculate quarterly defaults for this product (NEW defaults only, not cumulative)
      const quarterlyDefaults = new Array(quarters).fill(0);
      
      // Apply credit classification multiplier if needed
      const classificationMultiplier = productConfig.creditClassification === 'UTP' ? 2.5 : 1.0;
      const adjustedDangerRate = dangerRate * classificationMultiplier;
      
      // Process each vintage
      productVintages.forEach(vintage => {
        const vintageStartQ = vintage.startYear * 4 + vintage.startQuarter;
        const defaultQuarter = vintageStartQ + defaultTiming;
        const vintageId = vintage.id || `${productKey}_${vintage.startYear}_Q${vintage.startQuarter}`;
        
        // Initialize vintage default tracking
        if (!results.defaultsByVintage.has(vintageId)) {
          results.defaultsByVintage.set(vintageId, new Array(quarters).fill(0));
        }
        
        // Check if default happens within our timeframe
        if (defaultQuarter < quarters) {
          // Get outstanding principal at default time
          let outstandingAtDefault = 0;
          
          if (vintage.quarterlyOutstanding && vintage.quarterlyOutstanding[defaultQuarter] !== undefined) {
            outstandingAtDefault = vintage.quarterlyOutstanding[defaultQuarter];
          } else {
            // Fallback: use initial amount if no amortization data
            outstandingAtDefault = vintage.initialAmount;
          }
          
          // Apply adjusted danger rate to get default amount
          const defaultAmount = outstandingAtDefault * adjustedDangerRate;
          
          // Add to the specific quarter when default occurs
          quarterlyDefaults[defaultQuarter] += defaultAmount;
          
          // Track vintage-specific defaults
          results.defaultsByVintage.get(vintageId)[defaultQuarter] = defaultAmount;
          
          // Store detailed default event
          results.defaultsByQuarter[defaultQuarter].push({
            vintageId,
            productKey,
            defaultAmount,
            outstandingAtDefault,
            dangerRate: adjustedDangerRate * 100, // as percentage
            vintage: {
              startYear: vintage.startYear,
              startQuarter: vintage.startQuarter,
              initialAmount: vintage.initialAmount,
              productType: productConfig.type || 'credit'
            }
          });
        }
      });
      
      // Store product-level results
      results.byProduct[productKey] = {
        name: productConfig.name,
        dangerRate: dangerRate * 100, // Store as percentage for display
        adjustedDangerRate: adjustedDangerRate * 100, // With classification multiplier
        classificationMultiplier,
        defaultTiming: defaultTiming,
        quarterlyGrossNPL: quarterlyDefaults,
        productType: productConfig.type || 'credit',
        creditClassification: productConfig.creditClassification || 'standard'
      };
      
      // Add to totals
      quarterlyDefaults.forEach((defaultAmount, q) => {
        results.gbvDefaulted.quarterly[q] += defaultAmount;
        results.metrics.totalDefaults += defaultAmount;
      });
      
      // Calculate weighted danger rate
      const totalProductDefaults = quarterlyDefaults.reduce((sum, val) => sum + val, 0);
      totalDangerRateWeighted += dangerRate * totalProductDefaults;
    });
  });
  
  // Calculate metrics
  results.gbvDefaulted.quarterly.forEach((defaults, q) => {
    if (defaults > results.metrics.peakDefaults) {
      results.metrics.peakDefaults = defaults;
      results.metrics.peakQuarter = q;
    }
  });
  
  // Average danger rate (weighted by defaults)
  results.metrics.averageDangerRate = results.metrics.totalDefaults > 0 
    ? (totalDangerRateWeighted / results.metrics.totalDefaults) * 100 // Convert back to percentage
    : 0;
  
  // Add annual summary (sum of quarters for each year)
  results.gbvDefaulted.annual = [];
  for (let year = 0; year < 10; year++) {
    let annualDefaults = 0;
    for (let q = 0; q < 4; q++) {
      const quarterIndex = year * 4 + q;
      if (quarterIndex < quarters) {
        annualDefaults += results.gbvDefaulted.quarterly[quarterIndex];
      }
    }
    results.gbvDefaulted.annual.push(annualDefaults);
  }
  
  return results;
};

/**
 * Get quarterly default amount for a specific product and quarter
 * Utility function for other microservices
 * @param {Object} gbvDefaultedResults - Results from calculateGBVDefaulted
 * @param {string} productKey - Product identifier
 * @param {number} quarter - Quarter index
 * @returns {number} Default amount for that quarter
 */
export const getQuarterlyDefaultAmount = (gbvDefaultedResults, productKey, quarter) => {
  const productData = gbvDefaultedResults.byProduct[productKey];
  if (!productData || !productData.quarterlyGrossNPL) return 0;
  return productData.quarterlyGrossNPL[quarter] || 0;
};

/**
 * Get all defaults for a specific quarter across all products
 * @param {Object} gbvDefaultedResults - Results from calculateGBVDefaulted
 * @param {number} quarter - Quarter index
 * @returns {Array} Array of default events
 */
export const getDefaultsForQuarter = (gbvDefaultedResults, quarter) => {
  return gbvDefaultedResults.defaultsByQuarter[quarter] || [];
};

/**
 * Get default history for a specific vintage
 * @param {Object} gbvDefaultedResults - Results from calculateGBVDefaulted
 * @param {string} vintageId - Vintage identifier
 * @returns {Array} Quarterly default amounts for this vintage
 */
export const getVintageDefaultHistory = (gbvDefaultedResults, vintageId) => {
  return gbvDefaultedResults.defaultsByVintage.get(vintageId) || [];
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