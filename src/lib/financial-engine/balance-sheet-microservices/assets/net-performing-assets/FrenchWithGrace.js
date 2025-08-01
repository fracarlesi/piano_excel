/**
 * French Loans (With Grace) Net Performing Assets Calculator
 * 
 * MICROSERVIZIO AUTONOMO per calcolo Net Performing Assets di FRENCH LOANS CON PREAMMORTAMENTO
 * Input: configurazione prodotto + assumptions
 * Output: array 40 trimestri con outstanding principal (grazia + ammortamento)
 */

/**
 * Calcola Net Performing Assets per French Loans con grazia (AUTONOMO)
 * @param {Object} product - Configurazione prodotto french with-grace
 * @param {Object} assumptions - Assumptions globali
 * @param {number} quarters - Numero di trimestri (default 40)
 * @returns {Array} Outstanding principal per ogni trimestre
 */
export const calculateFrenchWithGraceNetPerformingAssets = (product, assumptions, quarters = 40) => {
  const quarterlyOutstanding = new Array(quarters).fill(0);
  
  // Step 1: Calcola volumi annuali
  const yearlyVolumes = calculateYearlyVolumes(product);
  
  // Step 2: Crea vintages french with-grace
  const vintages = createFrenchWithGraceVintages(product, yearlyVolumes, assumptions);
  
  // Step 3: Simula periodo grazia + ammortamento per ogni vintage
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    const graceEndQ = startQ + vintage.gracePeriodQuarters;
    const quarterlyRate = vintage.quarterlyRate;
    
    let outstandingPrincipal = vintage.amount;
    
    for (let q = 0; q < quarters; q++) {
      if (q >= startQ && q < maturityQ) {
        // Aggiungi outstanding corrente
        quarterlyOutstanding[q] += outstandingPrincipal;
        
        // Logica per il prossimo trimestre
        if (q > startQ) {
          if (q <= graceEndQ) {
            // PERIODO DI GRAZIA: principal rimane costante
            // (nessuna riduzione del capitale)
          } else {
            // POST-GRAZIA: ammortamento normale
            if (vintage.quarterlyPayment && outstandingPrincipal > 0) {
              const interestPayment = outstandingPrincipal * quarterlyRate;
              const principalPayment = Math.max(0, vintage.quarterlyPayment - interestPayment);
              outstandingPrincipal = Math.max(0, outstandingPrincipal - principalPayment);
            }
          }
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
 * Calcola rata trimestrale per ammortamento francese post-grazia
 */
const calculateQuarterlyPayment = (principal, quarterlyRate, amortizationQuarters) => {
  if (quarterlyRate === 0) {
    return principal / amortizationQuarters;
  }
  
  const factor = Math.pow(1 + quarterlyRate, amortizationQuarters);
  return principal * (quarterlyRate * factor) / (factor - 1);
};

/**
 * Crea vintages per french with-grace loans
 */
const createFrenchWithGraceVintages = (product, yearlyVolumes, assumptions) => {
  const vintages = [];
  const durationQuarters = product.durata || 20; // Default 5 anni
  const gracePeriodQuarters = product.gracePeriod || 4; // Default 1 anno
  const amortizationQuarters = durationQuarters - gracePeriodQuarters;
  
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
            amortizationQuarters
          );
          
          vintages.push({
            amount: quarterlyVolume,
            startYear: year,
            startQuarter: quarter,
            maturityYear: year + Math.floor(durationQuarters / 4),
            maturityQuarter: (quarter + durationQuarters) % 4,
            gracePeriodQuarters: gracePeriodQuarters,
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
 * Verifica se un trimestre è nel periodo di grazia
 */
export const getGracePeriodStatus = (vintage, currentQuarter) => {
  const startQ = vintage.startYear * 4 + vintage.startQuarter;
  const graceEndQ = startQ + vintage.gracePeriodQuarters;
  
  return {
    isInGracePeriod: currentQuarter > startQ && currentQuarter <= graceEndQ,
    graceEndQuarter: graceEndQ,
    quartersRemainingInGrace: Math.max(0, graceEndQ - currentQuarter),
    totalGracePeriodQuarters: vintage.gracePeriodQuarters
  };
};

/**
 * Ottieni metriche specifiche french with-grace loans
 */
export const getFrenchWithGraceMetrics = (product, assumptions, currentQuarter) => {
  const yearlyVolumes = calculateYearlyVolumes(product);
  const vintages = createFrenchWithGraceVintages(product, yearlyVolumes, assumptions);
  
  let totalExposure = 0;
  let totalQuarterlyPayment = 0;
  let activeLoans = 0;
  let loansInGrace = 0;
  let loansInAmortization = 0;
  
  vintages.forEach(vintage => {
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    if (startQ <= currentQuarter && currentQuarter < maturityQ) {
      // Calcola outstanding corrente (semplificato)
      let currentOutstanding = vintage.amount; // Semplificato - andrebbe ricalcolato
      
      totalExposure += currentOutstanding;
      totalQuarterlyPayment += vintage.quarterlyPayment;
      activeLoans++;
      
      const graceStatus = getGracePeriodStatus(vintage, currentQuarter);
      if (graceStatus.isInGracePeriod) {
        loansInGrace++;
      } else {
        loansInAmortization++;
      }
    }
  });
  
  return {
    productType: 'french-with-grace',
    totalExposure,
    totalQuarterlyPayment,
    averageQuarterlyPayment: activeLoans > 0 ? totalQuarterlyPayment / activeLoans : 0,
    activeLoansCount: activeLoans,
    loansInGracePeriod: loansInGrace,
    loansInAmortization: loansInAmortization,
    averageMaturity: product.durata / 4, // Anni
    averageGracePeriod: product.gracePeriod / 4 // Anni
  };
};