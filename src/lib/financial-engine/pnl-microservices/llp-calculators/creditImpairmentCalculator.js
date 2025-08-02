/**
 * Credit Impairment Calculator
 * 
 * Calcola gli impairment sui crediti deteriorati (default) come differenza tra:
 * - GBV Defaulted (valore lordo dei crediti andati in default)
 * - Non-Performing Assets (valore netto svalutato, NPV dei recovery)
 * 
 * La differenza rappresenta l'impairment che deve essere registrato a P&L
 * nel trimestre in cui avviene il default.
 * 
 * Nota: Questo è solo l'impairment per default, non include le variazioni ECL
 * sui crediti performing che sono calcolate separatamente.
 */

/**
 * Calcola il credit impairment per tutti i prodotti credit
 * @param {Object} gbvDefaultedResults - Risultati dal GBVDefaultedOrchestrator
 * @param {Object} nonPerformingAssetsResults - Risultati dal NonPerformingAssetsOrchestrator
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Object} Risultati credit impairment con dettaglio per prodotto/divisione/trimestre
 */
export const calculateCreditImpairment = (gbvDefaultedResults, nonPerformingAssetsResults, assumptions, quarters = 40) => {
  console.log('💰 Credit Impairment Calculator - Start');
  console.log('  - GBV Defaulted available:', !!gbvDefaultedResults);
  console.log('  - Non-Performing Assets available:', !!nonPerformingAssetsResults);
  
  const results = {
    // Totale consolidato credit impairment (valori negativi per P&L)
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
      totalImpairment: 0,
      averageLossRate: 0,
      peakImpairment: 0,
      peakQuarter: 0
    }
  };
  
  // Check if we have the required data structure
  if (!gbvDefaultedResults || !gbvDefaultedResults.byProduct) {
    console.warn('  ⚠️ No GBV Defaulted data available for credit impairment calculation');
    return results;
  }
  
  // Processa ogni prodotto che ha default
  if (gbvDefaultedResults?.byProduct) {
    Object.entries(gbvDefaultedResults.byProduct).forEach(([productKey, productDefaults]) => {
      console.log(`\n📊 Processing credit impairment for product: ${productKey}`);
      
      // Get NPL data for this product
      const productNPL = nonPerformingAssetsResults?.byProduct?.[productKey];
      
      if (!productNPL) {
        console.log(`  ⚠️ No NPL data found for product ${productKey}`);
        return;
      }
      
      // Calculate quarterly credit impairment
      const quarterlyImpairment = new Array(quarters).fill(0);
      let totalProductImpairment = 0;
      
      for (let q = 0; q < quarters; q++) {
        // GBV che va in default questo trimestre
        const gbvDefaulted = productDefaults.quarterlyGrossNPL?.[q] || 0;
        
        // NPV del recovery (valore svalutato) al momento del default
        // Nota: usiamo il valore NPV del trimestre del default
        const npvRecovery = productNPL.quarterlyNPV?.[q] || 0;
        
        // Credit Impairment = GBV Defaulted - NPV Recovery
        // Se GBV defaulted = 100 e NPV recovery = 55, Impairment = 45 (perdita)
        const impairmentAmount = gbvDefaulted - npvRecovery;
        
        // Solo se c'è un default in questo trimestre
        if (gbvDefaulted > 0) {
          // Gli impairment sono negativi nel P&L (sono un costo)
          quarterlyImpairment[q] = -impairmentAmount;
          totalProductImpairment += impairmentAmount;
          
          console.log(`  Q${q}: GBV Defaulted: ${gbvDefaulted.toFixed(2)}, NPV: ${npvRecovery.toFixed(2)}, Impairment: ${impairmentAmount.toFixed(2)}`);
        }
      }
      
      // Salva risultati per prodotto
      results.byProduct[productKey] = {
        productName: productDefaults.name,
        productType: productDefaults.productType,
        dangerRate: productDefaults.dangerRate,
        quarterlyImpairment: quarterlyImpairment,
        totalImpairment: totalProductImpairment,
        // Calcola loss rate implicito
        averageLossRate: productDefaults.quarterlyGrossNPL.reduce((sum, val) => sum + val, 0) > 0 
          ? (totalProductImpairment / productDefaults.quarterlyGrossNPL.reduce((sum, val) => sum + val, 0)) * 100
          : 0
      };
      
      // Aggrega al totale consolidato
      quarterlyImpairment.forEach((impairment, q) => {
        results.consolidated.quarterly[q] += impairment;
      });
    });
  }
  
  // Calcola totali annuali
  for (let year = 0; year < 10; year++) {
    let annualImpairment = 0;
    for (let q = 0; q < 4; q++) {
      const quarterIndex = year * 4 + q;
      if (quarterIndex < quarters) {
        annualImpairment += results.consolidated.quarterly[quarterIndex];
      }
    }
    results.consolidated.annual[year] = annualImpairment;
  }
  
  // Aggrega per divisione
  const divisionMap = {
    're': ['reCartoImmobiliare', 'reBridgeLoans', 'reConstructionLoans'],
    'sme': ['smeFinancing', 'smeLendingIndustria', 'smeLendingCdp'],
    'wealth': ['wealthManagement', 'wealthPersonalLoans', 'wealthMortgages'],
    'incentive': ['incentiveFinancing', 'incentiveTaxCredit'],
    'digital': ['digitalUnsecuredLoans', 'digitalPaydayLoans']
  };
  
  Object.entries(divisionMap).forEach(([divKey, products]) => {
    const divisionQuarterly = new Array(quarters).fill(0);
    const divisionAnnual = new Array(10).fill(0);
    let divisionTotal = 0;
    
    products.forEach(productKey => {
      if (results.byProduct[productKey]) {
        // Aggrega quarterly
        results.byProduct[productKey].quarterlyImpairment.forEach((impairment, q) => {
          divisionQuarterly[q] += impairment;
        });
        divisionTotal += results.byProduct[productKey].totalImpairment;
      }
    });
    
    // Calcola annual per divisione
    for (let year = 0; year < 10; year++) {
      let annualImpairment = 0;
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        if (quarterIndex < quarters) {
          annualImpairment += divisionQuarterly[quarterIndex];
        }
      }
      divisionAnnual[year] = annualImpairment;
    }
    
    results.byDivision[divKey] = {
      quarterly: divisionQuarterly,
      annual: divisionAnnual,
      totalImpairment: divisionTotal,
      products: products.filter(p => results.byProduct[p])
    };
  });
  
  // Calcola metriche aggregate
  results.metrics.totalImpairment = results.consolidated.quarterly.reduce((sum, val) => sum + Math.abs(val), 0);
  
  // Trova picco impairment
  results.consolidated.quarterly.forEach((impairment, q) => {
    if (Math.abs(impairment) > Math.abs(results.metrics.peakImpairment)) {
      results.metrics.peakImpairment = impairment;
      results.metrics.peakQuarter = q;
    }
  });
  
  // Calcola average loss rate
  const totalGBVDefaulted = Object.values(gbvDefaultedResults.byProduct)
    .reduce((sum, prod) => sum + prod.quarterlyGrossNPL.reduce((a, b) => a + b, 0), 0);
  
  results.metrics.averageLossRate = totalGBVDefaulted > 0 
    ? (results.metrics.totalImpairment / totalGBVDefaulted) * 100
    : 0;
  
  console.log('\n💰 Credit Impairment Calculator - Summary');
  console.log(`  - Total Credit Impairment: €${results.metrics.totalImpairment.toFixed(1)}M`);
  console.log(`  - Average loss rate: ${results.metrics.averageLossRate.toFixed(1)}%`);
  console.log(`  - Peak Impairment: €${Math.abs(results.metrics.peakImpairment).toFixed(1)}M in Q${results.metrics.peakQuarter}`);
  
  return results;
};

/**
 * Formatta i dati credit impairment per visualizzazione nel P&L
 * @param {Object} impairmentResults - Risultati dal calculateCreditImpairment
 * @param {string} view - Vista richiesta ('consolidated', 'byDivision', 'byProduct')
 * @returns {Object} Dati formattati per UI
 */
export const formatCreditImpairmentForPnL = (impairmentResults, view = 'consolidated') => {
  switch (view) {
    case 'consolidated':
      return {
        label: 'Credit Impairment',
        quarterly: impairmentResults.consolidated.quarterly,
        annual: impairmentResults.consolidated.annual,
        metrics: impairmentResults.metrics
      };
      
    case 'byDivision':
      return Object.entries(impairmentResults.byDivision).map(([divKey, divData]) => ({
        divisionKey: divKey,
        label: `Credit Impairment - ${divKey.toUpperCase()}`,
        quarterly: divData.quarterly,
        annual: divData.annual,
        totalImpairment: divData.totalImpairment,
        productCount: divData.products.length
      }));
      
    case 'byProduct':
      return Object.entries(impairmentResults.byProduct).map(([prodKey, prodData]) => ({
        productKey: prodKey,
        label: `Credit Impairment - ${prodData.productName}`,
        quarterly: prodData.quarterlyImpairment,
        totalImpairment: prodData.totalImpairment,
        averageLossRate: prodData.averageLossRate,
        dangerRate: prodData.dangerRate
      }));
      
    default:
      return impairmentResults;
  }
};

/**
 * Calcola credit impairment breakdown per trimestre specifico
 * @param {Object} impairmentResults - Risultati completi credit impairment
 * @param {number} quarter - Indice trimestre
 * @returns {Object} Breakdown dettagliato per quel trimestre
 */
export const getCreditImpairmentQuarterlyBreakdown = (impairmentResults, quarter) => {
  const breakdown = {
    total: impairmentResults.consolidated.quarterly[quarter],
    byDivision: {},
    byProduct: [],
    topContributors: []
  };
  
  // Division breakdown
  Object.entries(impairmentResults.byDivision).forEach(([divKey, divData]) => {
    breakdown.byDivision[divKey] = divData.quarterly[quarter];
  });
  
  // Product breakdown
  Object.entries(impairmentResults.byProduct).forEach(([prodKey, prodData]) => {
    const impairmentAmount = prodData.quarterlyImpairment[quarter];
    if (impairmentAmount !== 0) {
      breakdown.byProduct.push({
        productKey: prodKey,
        productName: prodData.productName,
        impairmentAmount: impairmentAmount,
        percentage: (impairmentAmount / breakdown.total) * 100
      });
    }
  });
  
  // Sort by absolute value to find top contributors
  breakdown.topContributors = breakdown.byProduct
    .sort((a, b) => Math.abs(b.impairmentAmount) - Math.abs(a.impairmentAmount))
    .slice(0, 5);
  
  return breakdown;
};