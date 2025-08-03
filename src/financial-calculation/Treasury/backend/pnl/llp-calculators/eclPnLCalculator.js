/**
 * ECL P&L Calculator - Expected Credit Loss movements for P&L
 * 
 * Calcola le variazioni trimestrali dell'ECL provision da riportare a conto economico.
 * L'ECL provision è una voce cumulata nel balance sheet, quindi la variazione
 * trimestrale rappresenta l'effetto a P&L.
 * 
 * Logica:
 * - Legge i dati ECL provision stock dal balance sheet
 * - Calcola le variazioni trimestrali (già presenti come quarterlyAddition)
 * - Le variazioni negative aumentano i costi (peggioramento ECL)
 * - Le variazioni positive riducono i costi (miglioramento ECL)
 */

/**
 * Calcola le variazioni ECL da riportare a P&L
 * @param {Object} eclProvisionResults - Risultati dall'ECL Calculator del balance sheet
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Object} Variazioni ECL per P&L con dettaglio per prodotto/divisione/trimestre
 */
export const calculateECLMovements = (eclProvisionResults, assumptions, quarters = 40) => {
  
  const results = {
    // Totale consolidato ECL movements (valori negativi per aumenti provision)
    consolidated: {
      quarterly: new Array(quarters).fill(0),
      annual: new Array(10).fill(0)
    },
    
    // Dettaglio per prodotto
    byProduct: {},
    
    // Dettaglio per divisione
    byDivision: {},
    
    // Metriche aggregate
    metrics: {
      totalECLMovements: 0,
      peakMovement: 0,
      peakQuarter: 0,
      reversalQuarters: 0 // Quarters with ECL reversal (positive movement)
    }
  };
  
  // Check if we have the required data
  if (!eclProvisionResults || !eclProvisionResults.consolidated) {
    return results;
  }
  
  // Use quarterly additions directly as P&L impact
  // Negative values = cost increase (provision increase)
  // Positive values = cost decrease (provision release)
  
  results.consolidated.quarterly = eclProvisionResults.consolidated.quarterlyAddition.map(
    (addition, q) => {
      const pnlImpact = -addition; // Invert sign for P&L (provision increase = cost)
      if (pnlImpact > 0 && q < 20) {
      }
      return pnlImpact;
    }
  );
  
  // Process by product
  if (eclProvisionResults.byProduct) {
    Object.entries(eclProvisionResults.byProduct).forEach(([productKey, productData]) => {
      
      // Get quarterly additions and invert for P&L
      const quarterlyMovements = productData.quarterlyAddition.map(addition => -addition);
      
      // Calculate total movements
      const totalMovements = quarterlyMovements.reduce((sum, val) => sum + Math.abs(val), 0);
      
      // Store product results
      results.byProduct[productKey] = {
        productName: productData.productName,
        productType: productData.productType,
        dangerRate: productData.dangerRate,
        lgdEffective: productData.lgdEffective,
        hasStateGuarantee: productData.hasStateGuarantee,
        quarterlyMovements: quarterlyMovements,
        totalMovements: totalMovements,
        // Include provision stock for reference
        provisionStock: productData.quarterlyProvision
      };
      
    });
  }
  
  // Process by division
  if (eclProvisionResults.byDivision) {
    Object.entries(eclProvisionResults.byDivision).forEach(([divKey, divData]) => {
      // Get quarterly additions and invert for P&L
      const quarterlyMovements = divData.quarterlyAddition.map(addition => -addition);
      
      // Calculate annual totals
      const annualMovements = new Array(10).fill(0);
      for (let year = 0; year < 10; year++) {
        let annualTotal = 0;
        for (let q = 0; q < 4; q++) {
          const quarterIndex = year * 4 + q;
          if (quarterIndex < quarters) {
            annualTotal += quarterlyMovements[quarterIndex];
          }
        }
        annualMovements[year] = annualTotal;
      }
      
      results.byDivision[divKey] = {
        quarterly: quarterlyMovements,
        annual: annualMovements,
        totalMovements: quarterlyMovements.reduce((sum, val) => sum + Math.abs(val), 0),
        products: divData.products
      };
    });
  }
  
  // Calculate annual totals
  for (let year = 0; year < 10; year++) {
    let annualTotal = 0;
    for (let q = 0; q < 4; q++) {
      const quarterIndex = year * 4 + q;
      if (quarterIndex < quarters) {
        annualTotal += results.consolidated.quarterly[quarterIndex];
      }
    }
    results.consolidated.annual[year] = annualTotal;
  }
  
  // Calculate metrics
  results.metrics.totalECLMovements = results.consolidated.quarterly.reduce(
    (sum, val) => sum + Math.abs(val), 0
  );
  
  // Find peak movement quarter
  results.consolidated.quarterly.forEach((movement, q) => {
    if (Math.abs(movement) > Math.abs(results.metrics.peakMovement)) {
      results.metrics.peakMovement = movement;
      results.metrics.peakQuarter = q;
    }
    
    // Count reversal quarters (positive movements = provision release)
    if (movement > 0) {
      results.metrics.reversalQuarters++;
    }
  });
  
  
  return results;
};

/**
 * Format ECL movements for P&L display
 * @param {Object} eclMovementResults - Results from calculateECLMovements
 * @param {string} view - View type ('consolidated', 'byDivision', 'byProduct')
 * @returns {Object} Formatted data for UI
 */
export const formatECLMovementsForPnL = (eclMovementResults, view = 'consolidated') => {
  switch (view) {
    case 'consolidated':
      return {
        label: 'ECL Provision Movement',
        quarterly: eclMovementResults.consolidated.quarterly,
        annual: eclMovementResults.consolidated.annual,
        metrics: eclMovementResults.metrics
      };
      
    case 'byDivision':
      return Object.entries(eclMovementResults.byDivision).map(([divKey, divData]) => ({
        divisionKey: divKey,
        label: `ECL Movement - ${divKey.toUpperCase()}`,
        quarterly: divData.quarterly,
        annual: divData.annual,
        totalMovements: divData.totalMovements,
        productCount: divData.products.length
      }));
      
    case 'byProduct':
      return Object.entries(eclMovementResults.byProduct).map(([prodKey, prodData]) => ({
        productKey: prodKey,
        label: `ECL - ${prodData.productName}`,
        quarterly: prodData.quarterlyMovements,
        totalMovements: prodData.totalMovements,
        parameters: {
          dangerRate: prodData.dangerRate,
          lgdEffective: prodData.lgdEffective,
          hasStateGuarantee: prodData.hasStateGuarantee
        }
      }));
      
    default:
      return eclMovementResults;
  }
};

/**
 * Get ECL movement breakdown for specific quarter
 * @param {Object} eclMovementResults - Results from calculateECLMovements
 * @param {number} quarter - Quarter index
 * @returns {Object} Detailed breakdown for that quarter
 */
export const getECLMovementQuarterlyBreakdown = (eclMovementResults, quarter) => {
  const breakdown = {
    total: eclMovementResults.consolidated.quarterly[quarter],
    byDivision: {},
    byProduct: [],
    topContributors: []
  };
  
  // Division breakdown
  Object.entries(eclMovementResults.byDivision).forEach(([divKey, divData]) => {
    breakdown.byDivision[divKey] = divData.quarterly[quarter];
  });
  
  // Product breakdown
  Object.entries(eclMovementResults.byProduct).forEach(([prodKey, prodData]) => {
    const movement = prodData.quarterlyMovements[quarter];
    if (movement !== 0) {
      breakdown.byProduct.push({
        productKey: prodKey,
        productName: prodData.productName,
        movement: movement,
        percentage: breakdown.total !== 0 ? (movement / breakdown.total) * 100 : 0
      });
    }
  });
  
  // Sort by absolute value to find top contributors
  breakdown.topContributors = breakdown.byProduct
    .sort((a, b) => Math.abs(b.movement) - Math.abs(a.movement))
    .slice(0, 5);
  
  return breakdown;
};