/**
 * Bridge Loans Net Performing Assets Calculator
 * 
 * MICROSERVIZIO AUTONOMO per calcolo Net Performing Assets di BRIDGE LOANS
 * Input: configurazione prodotto + assumptions
 * Output: array 40 trimestri con outstanding principal
 */

/**
 * Calcola Net Performing Assets per Bridge Loans (AUTONOMO)
 * @param {Object} product - Configurazione prodotto bridge
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Array} Outstanding principal per ogni trimestre
 */
export const calculateBridgeLoansNetPerformingAssets = (product, assumptions, quarters = 40) => {
  const quarterlyOutstanding = new Array(quarters).fill(0);
  
  // Step 1: Calcola volumi annuali
  const yearlyVolumes = calculateYearlyVolumes(product);
  
  // Step 2: Crea vintages bridge
  const vintages = createBridgeVintages(product, yearlyVolumes, assumptions);
  
  // Step 3: Calcola outstanding per ogni trimestre
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    // Bridge/Bullet: principal costante fino a maturity
    for (let q = startQ; q < Math.min(maturityQ, quarters); q++) {
      quarterlyOutstanding[q] += vintage.amount;
    }
  });
  
  return quarterlyOutstanding;
};

/**
 * Calcola volumi annuali da configurazione prodotto
 */
const calculateYearlyVolumes = (product) => {
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  return years.map(i => {
    if (product.volumeArray && Array.isArray(product.volumeArray)) {
      return product.volumeArray[i] || 0;
    }
    
    if (product.volumes) {
      const yearKey = `y${i + 1}`;
      if (product.volumes[yearKey] !== undefined) {
        return product.volumes[yearKey];
      }
      
      // Interpolazione lineare
      const y1 = product.volumes.y1 || 0;
      const y10 = product.volumes.y10 || 0;
      return y1 + ((y10 - y1) * i / 9);
    }
    
    return 0;
  });
};

/**
 * Crea vintages per bridge loans
 */
const createBridgeVintages = (product, yearlyVolumes, assumptions) => {
  const vintages = [];
  const durationQuarters = product.durata || 8; // Default 2 anni
  
  yearlyVolumes.forEach((volume, year) => {
    if (volume > 0) {
      const quarterlyAllocation = assumptions.quarterlyAllocation || [25, 25, 25, 25];
      
      quarterlyAllocation.forEach((percentage, quarter) => {
        const quarterlyVolume = volume * (percentage / 100);
        
        if (quarterlyVolume > 0) {
          vintages.push({
            amount: quarterlyVolume,
            startYear: year,
            startQuarter: quarter,
            maturityYear: year + Math.floor(durationQuarters / 4),
            maturityQuarter: (quarter + durationQuarters) % 4
          });
        }
      });
    }
  });
  
  return vintages;
};

/**
 * Ottieni metriche specifiche bridge loans
 */
export const getBridgeLoansMetrics = (product, assumptions, currentQuarter) => {
  const yearlyVolumes = calculateYearlyVolumes(product);
  const vintages = createBridgeVintages(product, yearlyVolumes, assumptions);
  
  let totalExposure = 0;
  let activeLoans = 0;
  
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    if (startQ <= currentQuarter && currentQuarter < maturityQ) {
      totalExposure += vintage.amount;
      activeLoans++;
    }
  });
  
  return {
    productType: 'bridge-loans',
    totalExposure,
    activeLoansCount: activeLoans,
    averageMaturity: product.durata / 4 // Anni
  };
};