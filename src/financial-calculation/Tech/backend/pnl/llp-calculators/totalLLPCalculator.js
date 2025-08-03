/**
 * Total LLP Calculator - Loan Loss Provisions aggregator
 * 
 * Combina le due componenti delle Loan Loss Provisions:
 * 1. ECL Movement - Variazioni trimestrali dell'Expected Credit Loss provision
 * 2. Credit Impairment - Impairment per crediti che vanno in default
 * 
 * Total LLP = ECL Movement + Credit Impairment
 * 
 * Questo orchestratore aggrega i risultati dei due microservizi
 * per fornire il totale LLP da esporre nel P&L.
 */

/**
 * Calcola il totale LLP combinando ECL movements e Credit Impairment
 * @param {Object} eclMovementResults - Risultati dall'ECL P&L Calculator
 * @param {Object} creditImpairmentResults - Risultati dal Credit Impairment Calculator
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Object} Totale LLP con breakdown ECL e Credit Impairment
 */
export const calculateTotalLLP = (eclMovementResults, creditImpairmentResults, assumptions, quarters = 40) => {
  
  const results = {
    // Totale consolidato LLP
    consolidated: {
      // Totale LLP (ECL + Credit Impairment)
      quarterly: new Array(quarters).fill(0),
      annual: new Array(10).fill(0),
      
      // Breakdown componenti
      components: {
        eclMovement: {
          quarterly: new Array(quarters).fill(0),
          annual: new Array(10).fill(0)
        },
        creditImpairment: {
          quarterly: new Array(quarters).fill(0),
          annual: new Array(10).fill(0)
        }
      }
    },
    
    // Dettaglio per prodotto
    byProduct: {},
    
    // Dettaglio per divisione
    byDivision: {},
    
    // Metriche aggregate
    metrics: {
      totalLLP: 0,
      totalECLMovement: 0,
      totalCreditImpairment: 0,
      eclPercentage: 0,          // % of total LLP from ECL
      impairmentPercentage: 0,   // % of total LLP from credit impairment
      peakLLP: 0,
      peakQuarter: 0
    }
  };
  
  // Initialize with zeros if data is missing
  const eclQuarterly = eclMovementResults?.consolidated?.quarterly || new Array(quarters).fill(0);
  const impairmentQuarterly = creditImpairmentResults?.consolidated?.quarterly || new Array(quarters).fill(0);
  
  // Calculate total LLP for each quarter
  for (let q = 0; q < quarters; q++) {
    const eclMovement = eclQuarterly[q] || 0;
    const creditImpairment = impairmentQuarterly[q] || 0;
    const totalLLP = eclMovement + creditImpairment;
    
    // Store totals
    results.consolidated.quarterly[q] = totalLLP;
    
    // Store components
    results.consolidated.components.eclMovement.quarterly[q] = eclMovement;
    results.consolidated.components.creditImpairment.quarterly[q] = creditImpairment;
    
    // Log significant quarters
    if ((q < 4 || q % 4 === 0) && (eclMovement !== 0 || creditImpairment !== 0)) {
    }
  }
  
  // Process by product
  const allProductKeys = new Set([
    ...Object.keys(eclMovementResults?.byProduct || {}),
    ...Object.keys(creditImpairmentResults?.byProduct || {})
  ]);
  
  allProductKeys.forEach(productKey => {
    const eclProduct = eclMovementResults?.byProduct?.[productKey];
    const impairmentProduct = creditImpairmentResults?.byProduct?.[productKey];
    
    // Get product name (from either source)
    const productName = eclProduct?.productName || impairmentProduct?.productName || productKey;
    
    // Get quarterly data
    const eclQuarterly = eclProduct?.quarterlyMovements || new Array(quarters).fill(0);
    const impairmentQuarterly = impairmentProduct?.quarterlyImpairment || new Array(quarters).fill(0);
    
    // Calculate total quarterly LLP
    const totalQuarterly = eclQuarterly.map((ecl, q) => ecl + (impairmentQuarterly[q] || 0));
    
    // Calculate totals
    const totalECL = eclQuarterly.reduce((sum, val) => sum + Math.abs(val), 0);
    const totalImpairment = impairmentQuarterly.reduce((sum, val) => sum + Math.abs(val), 0);
    const totalLLP = totalECL + totalImpairment;
    
    results.byProduct[productKey] = {
      productName: productName,
      productType: eclProduct?.productType || impairmentProduct?.productType,
      dangerRate: eclProduct?.dangerRate || impairmentProduct?.dangerRate,
      
      // Total LLP
      quarterlyLLP: totalQuarterly,
      totalLLP: totalLLP,
      
      // Components breakdown
      components: {
        eclMovement: {
          quarterly: eclQuarterly,
          total: totalECL,
          percentage: totalLLP > 0 ? (totalECL / totalLLP) * 100 : 0
        },
        creditImpairment: {
          quarterly: impairmentQuarterly,
          total: totalImpairment,
          percentage: totalLLP > 0 ? (totalImpairment / totalLLP) * 100 : 0
        }
      }
    };
  });
  
  // Process by division
  const allDivisionKeys = new Set([
    ...Object.keys(eclMovementResults?.byDivision || {}),
    ...Object.keys(creditImpairmentResults?.byDivision || {})
  ]);
  
  allDivisionKeys.forEach(divKey => {
    const eclDivision = eclMovementResults?.byDivision?.[divKey];
    const impairmentDivision = creditImpairmentResults?.byDivision?.[divKey];
    
    // Get quarterly data
    const eclQuarterly = eclDivision?.quarterly || new Array(quarters).fill(0);
    const impairmentQuarterly = impairmentDivision?.quarterly || new Array(quarters).fill(0);
    
    // Calculate total quarterly LLP
    const totalQuarterly = eclQuarterly.map((ecl, q) => ecl + (impairmentQuarterly[q] || 0));
    
    // Calculate annual totals
    const totalAnnual = new Array(10).fill(0);
    const eclAnnual = new Array(10).fill(0);
    const impairmentAnnual = new Array(10).fill(0);
    
    for (let year = 0; year < 10; year++) {
      let yearTotal = 0;
      let yearECL = 0;
      let yearImpairment = 0;
      
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        if (quarterIndex < quarters) {
          yearTotal += totalQuarterly[quarterIndex];
          yearECL += eclQuarterly[quarterIndex];
          yearImpairment += impairmentQuarterly[quarterIndex];
        }
      }
      
      totalAnnual[year] = yearTotal;
      eclAnnual[year] = yearECL;
      impairmentAnnual[year] = yearImpairment;
    }
    
    // Get all products from both sources
    const allProducts = new Set([
      ...(eclDivision?.products || []),
      ...(impairmentDivision?.products || [])
    ]);
    
    results.byDivision[divKey] = {
      quarterly: totalQuarterly,
      annual: totalAnnual,
      totalLLP: totalQuarterly.reduce((sum, val) => sum + Math.abs(val), 0),
      products: Array.from(allProducts),
      
      // Components breakdown
      components: {
        eclMovement: {
          quarterly: eclQuarterly,
          annual: eclAnnual,
          total: eclQuarterly.reduce((sum, val) => sum + Math.abs(val), 0)
        },
        creditImpairment: {
          quarterly: impairmentQuarterly,
          annual: impairmentAnnual,
          total: impairmentQuarterly.reduce((sum, val) => sum + Math.abs(val), 0)
        }
      }
    };
  });
  
  // Calculate consolidated annual totals
  for (let year = 0; year < 10; year++) {
    let yearTotal = 0;
    let yearECL = 0;
    let yearImpairment = 0;
    
    for (let q = 0; q < 4; q++) {
      const quarterIndex = year * 4 + q;
      if (quarterIndex < quarters) {
        yearTotal += results.consolidated.quarterly[quarterIndex];
        yearECL += results.consolidated.components.eclMovement.quarterly[quarterIndex];
        yearImpairment += results.consolidated.components.creditImpairment.quarterly[quarterIndex];
      }
    }
    
    results.consolidated.annual[year] = yearTotal;
    results.consolidated.components.eclMovement.annual[year] = yearECL;
    results.consolidated.components.creditImpairment.annual[year] = yearImpairment;
  }
  
  // Calculate metrics
  results.metrics.totalECLMovement = results.consolidated.components.eclMovement.quarterly
    .reduce((sum, val) => sum + Math.abs(val), 0);
  results.metrics.totalCreditImpairment = results.consolidated.components.creditImpairment.quarterly
    .reduce((sum, val) => sum + Math.abs(val), 0);
  results.metrics.totalLLP = results.metrics.totalECLMovement + results.metrics.totalCreditImpairment;
  
  // Calculate percentages
  if (results.metrics.totalLLP > 0) {
    results.metrics.eclPercentage = (results.metrics.totalECLMovement / results.metrics.totalLLP) * 100;
    results.metrics.impairmentPercentage = (results.metrics.totalCreditImpairment / results.metrics.totalLLP) * 100;
  }
  
  // Find peak LLP quarter
  results.consolidated.quarterly.forEach((llp, q) => {
    if (Math.abs(llp) > Math.abs(results.metrics.peakLLP)) {
      results.metrics.peakLLP = llp;
      results.metrics.peakQuarter = q;
    }
  });
  
  
  return results;
};

/**
 * Format total LLP data for P&L display with component breakdown
 * @param {Object} totalLLPResults - Results from calculateTotalLLP
 * @param {string} view - View type ('consolidated', 'byDivision', 'byProduct')
 * @returns {Object} Formatted data for UI with hierarchical structure
 */
export const formatTotalLLPForPnL = (totalLLPResults, view = 'consolidated') => {
  switch (view) {
    case 'consolidated':
      return {
        // Main LLP line item
        label: 'Loan Loss Provisions',
        quarterly: totalLLPResults.consolidated.quarterly,
        annual: totalLLPResults.consolidated.annual,
        metrics: totalLLPResults.metrics,
        
        // Sub-components
        subItems: [
          {
            label: 'o/w ECL Provision Movement',
            quarterly: totalLLPResults.consolidated.components.eclMovement.quarterly,
            annual: totalLLPResults.consolidated.components.eclMovement.annual,
            total: totalLLPResults.metrics.totalECLMovement,
            percentage: totalLLPResults.metrics.eclPercentage
          },
          {
            label: 'o/w Credit Impairment',
            quarterly: totalLLPResults.consolidated.components.creditImpairment.quarterly,
            annual: totalLLPResults.consolidated.components.creditImpairment.annual,
            total: totalLLPResults.metrics.totalCreditImpairment,
            percentage: totalLLPResults.metrics.impairmentPercentage
          }
        ]
      };
      
    case 'byDivision':
      return Object.entries(totalLLPResults.byDivision).map(([divKey, divData]) => ({
        divisionKey: divKey,
        label: `LLP - ${divKey.toUpperCase()}`,
        quarterly: divData.quarterly,
        annual: divData.annual,
        totalLLP: divData.totalLLP,
        productCount: divData.products.length,
        
        // Component breakdown
        components: {
          eclMovement: divData.components.eclMovement.total,
          creditImpairment: divData.components.creditImpairment.total
        }
      }));
      
    case 'byProduct':
      return Object.entries(totalLLPResults.byProduct).map(([prodKey, prodData]) => ({
        productKey: prodKey,
        label: `LLP - ${prodData.productName}`,
        quarterly: prodData.quarterlyLLP,
        totalLLP: prodData.totalLLP,
        dangerRate: prodData.dangerRate,
        
        // Component breakdown
        components: {
          eclMovement: {
            total: prodData.components.eclMovement.total,
            percentage: prodData.components.eclMovement.percentage
          },
          creditImpairment: {
            total: prodData.components.creditImpairment.total,
            percentage: prodData.components.creditImpairment.percentage
          }
        }
      }));
      
    default:
      return totalLLPResults;
  }
};

/**
 * Get detailed breakdown for a specific quarter
 * @param {Object} totalLLPResults - Results from calculateTotalLLP
 * @param {number} quarter - Quarter index
 * @returns {Object} Detailed breakdown with components
 */
export const getTotalLLPQuarterlyBreakdown = (totalLLPResults, quarter) => {
  const breakdown = {
    total: totalLLPResults.consolidated.quarterly[quarter],
    
    // Component totals
    components: {
      eclMovement: totalLLPResults.consolidated.components.eclMovement.quarterly[quarter],
      creditImpairment: totalLLPResults.consolidated.components.creditImpairment.quarterly[quarter]
    },
    
    // Division breakdown
    byDivision: {},
    
    // Product breakdown
    byProduct: [],
    
    // Top contributors
    topContributors: []
  };
  
  // Division breakdown
  Object.entries(totalLLPResults.byDivision).forEach(([divKey, divData]) => {
    breakdown.byDivision[divKey] = {
      total: divData.quarterly[quarter],
      eclMovement: divData.components.eclMovement.quarterly[quarter],
      creditImpairment: divData.components.creditImpairment.quarterly[quarter]
    };
  });
  
  // Product breakdown
  Object.entries(totalLLPResults.byProduct).forEach(([prodKey, prodData]) => {
    const llpAmount = prodData.quarterlyLLP[quarter];
    if (llpAmount !== 0) {
      breakdown.byProduct.push({
        productKey: prodKey,
        productName: prodData.productName,
        llpAmount: llpAmount,
        eclMovement: prodData.components.eclMovement.quarterly[quarter],
        creditImpairment: prodData.components.creditImpairment.quarterly[quarter],
        percentage: breakdown.total !== 0 ? (llpAmount / breakdown.total) * 100 : 0
      });
    }
  });
  
  // Sort by absolute value to find top contributors
  breakdown.topContributors = breakdown.byProduct
    .sort((a, b) => Math.abs(b.llpAmount) - Math.abs(a.llpAmount))
    .slice(0, 5);
  
  return breakdown;
};