/**
 * French Loans (No Grace) Net Performing Assets Calculator
 * 
 * MICROSERVIZIO AUTONOMO per calcolo Net Performing Assets di FRENCH LOANS SENZA PREAMMORTAMENTO
 * Input: configurazione prodotto + assumptions
 * Output: array 40 trimestri con outstanding principal ammortizzato
 */

/**
 * Calcola Net Performing Assets per French Loans senza grazia (AUTONOMO)
 * @param {Object} product - Configurazione prodotto french no-grace
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Array} Outstanding principal per ogni trimestre
 */
export const calculateFrenchNoGraceNetPerformingAssets = (product, assumptions, quarters = 40) => {
  const quarterlyOutstanding = new Array(quarters).fill(0);
  
  // Step 1: Calcola volumi annuali
  const yearlyVolumes = calculateYearlyVolumes(product);
  
  // Step 2: Crea vintages french no-grace
  const vintages = createFrenchNoGraceVintages(product, yearlyVolumes, assumptions);
  
  // Step 3: Simula ammortamento per ogni vintage
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    const quarterlyRate = vintage.quarterlyRate;
    
    let outstandingPrincipal = vintage.amount;
    
    for (let q = 0; q < quarters; q++) {
      if (q >= startQ && q < maturityQ) {
        // Aggiungi outstanding corrente
        quarterlyOutstanding[q] += outstandingPrincipal;
        
        // Calcola ammortamento per il prossimo trimestre (dal T+1)
        if (q > startQ && vintage.quarterlyPayment && outstandingPrincipal > 0) {
          const interestPayment = outstandingPrincipal * quarterlyRate;
          const principalPayment = Math.max(0, vintage.quarterlyPayment - interestPayment);
          outstandingPrincipal = Math.max(0, outstandingPrincipal - principalPayment);
        }
      }
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
 * Calcola tasso trimestrale
 */
const getQuarterlyInterestRate = (product, assumptions) => {
  let annualRate;
  
  if (product.isFixedRate) {
    annualRate = (product.spread || 0) + 2.0; // Fixed rate: spread + 2%
  } else {
    annualRate = (assumptions.euribor || 3.5) + (product.spread || 0); // Variable rate
  }
  
  return annualRate / 100 / 4; // Convert to quarterly decimal rate
};

/**
 * Calcola rata trimestrale per ammortamento francese
 */
const calculateQuarterlyPayment = (principal, quarterlyRate, totalQuarters) => {
  if (quarterlyRate === 0) {
    return principal / totalQuarters;
  }
  
  const factor = Math.pow(1 + quarterlyRate, totalQuarters);
  return principal * (quarterlyRate * factor) / (factor - 1);
};

/**
 * Crea vintages per french no-grace loans
 */
const createFrenchNoGraceVintages = (product, yearlyVolumes, assumptions) => {
  const vintages = [];
  const durationQuarters = product.durata || 20; // Default 5 anni
  
  yearlyVolumes.forEach((volume, year) => {
    if (volume > 0) {
      const quarterlyAllocation = assumptions.quarterlyAllocation || [25, 25, 25, 25];
      
      quarterlyAllocation.forEach((percentage, quarter) => {
        const quarterlyVolume = volume * (percentage / 100);
        
        if (quarterlyVolume > 0) {
          const quarterlyRate = getQuarterlyInterestRate(product, assumptions);
          const quarterlyPayment = calculateQuarterlyPayment(
            quarterlyVolume, 
            quarterlyRate, 
            durationQuarters
          );
          
          vintages.push({
            amount: quarterlyVolume,
            startYear: year,
            startQuarter: quarter,
            maturityYear: year + Math.floor(durationQuarters / 4),
            maturityQuarter: (quarter + durationQuarters) % 4,
            quarterlyRate: quarterlyRate,
            quarterlyPayment: quarterlyPayment
          });
        }
      });
    }
  });
  
  return vintages;
};

/**
 * Ottieni metriche specifiche french no-grace loans
 */
export const getFrenchNoGraceMetrics = (product, assumptions, currentQuarter) => {
  const yearlyVolumes = calculateYearlyVolumes(product);
  const vintages = createFrenchNoGraceVintages(product, yearlyVolumes, assumptions);
  
  let totalExposure = 0;
  let totalQuarterlyPayment = 0;
  let activeLoans = 0;
  
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    if (startQ <= currentQuarter && currentQuarter < maturityQ) {
      // Calcola outstanding corrente (semplificato)
      const quartersElapsed = Math.max(0, currentQuarter - startQ);
      let currentOutstanding = vintage.amount; // Semplificato - andrebbe ricalcolato
      
      totalExposure += currentOutstanding;
      totalQuarterlyPayment += vintage.quarterlyPayment;
      activeLoans++;
    }
  });
  
  return {
    productType: 'french-no-grace',
    totalExposure,
    totalQuarterlyPayment,
    averageQuarterlyPayment: activeLoans > 0 ? totalQuarterlyPayment / activeLoans : 0,
    activeLoansCount: activeLoans,
    averageMaturity: product.durata / 4 // Anni
  };
};