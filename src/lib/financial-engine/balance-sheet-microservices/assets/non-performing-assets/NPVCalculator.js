/**
 * NPV Calculator for Non-Performing Assets
 * 
 * Calcola il valore attuale netto (NPV) dei recovery attesi sui default
 * utilizzando il tasso originario del prodotto (spread + euribor).
 * Il valore si ricalcola ogni trimestre riducendo il tempo di attualizzazione.
 */

/**
 * Calcola NPV dei recovery futuri per ogni trimestre
 * @param {Object} recoverySchedule - Schedule dei recovery futuri
 * @param {number} currentQuarter - Trimestre corrente di valutazione
 * @param {number} originalRate - Tasso originario del prodotto (spread + euribor) in percentuale annua
 * @returns {number} NPV dei recovery futuri
 */
export const calculateRecoveryNPV = (recoverySchedule, currentQuarter, originalRate) => {
  let npv = 0;
  
  // Tasso trimestrale di attualizzazione
  const quarterlyRate = originalRate / 400; // Conversione da annuale a trimestrale
  
  // Calcola NPV sommando tutti i recovery futuri attualizzati
  recoverySchedule.forEach(recovery => {
    if (recovery.quarter > currentQuarter) {
      // Calcola numero di trimestri dal momento corrente al recovery
      const quartersToRecovery = recovery.quarter - currentQuarter;
      
      // Attualizza il recovery al momento corrente
      const discountFactor = Math.pow(1 + quarterlyRate, -quartersToRecovery);
      const discountedValue = recovery.totalRecovery * discountFactor;
      
      npv += discountedValue;
    }
  });
  
  return npv;
};

/**
 * Calcola NPV per ogni default cohort considerando il timing originale
 * @param {Object} defaultData - Dati dei default per cohort
 * @param {number} evaluationQuarter - Trimestre di valutazione
 * @param {Object} productConfig - Configurazione del prodotto
 * @returns {Object} NPV details per cohort
 */
export const calculateCohortNPV = (defaultData, evaluationQuarter, productConfig) => {
  const results = {
    totalNPV: 0,
    cohortDetails: [],
    rateUsed: 0
  };
  
  // Calcola tasso del prodotto
  const spreadRate = productConfig.spread || 0;
  const euriborRate = productConfig.euribor || 0;
  const totalRate = spreadRate + euriborRate;
  results.rateUsed = totalRate;
  
  // Processa ogni cohort di default
  defaultData.cohorts.forEach(cohort => {
    if (cohort.defaultQuarter <= evaluationQuarter) {
      // Solo cohort che sono già defaultate
      
      // Calcola NPV dei recovery futuri per questa cohort
      const cohortNPV = calculateRecoveryNPV(
        cohort.recoverySchedule,
        evaluationQuarter,
        totalRate
      );
      
      results.cohortDetails.push({
        defaultQuarter: cohort.defaultQuarter,
        defaultAmount: cohort.defaultAmount,
        npvAtEvaluation: cohortNPV,
        quartersFromDefault: evaluationQuarter - cohort.defaultQuarter,
        originalRate: totalRate
      });
      
      results.totalNPV += cohortNPV;
    }
  });
  
  return results;
};

/**
 * Calcola evoluzione temporale del NPV trimestre per trimestre
 * @param {Object} recoveryData - Dati completi dei recovery
 * @param {Object} productConfig - Configurazione prodotto
 * @param {number} quarters - Numero totale di trimestri
 * @returns {Object} Evoluzione NPV nel tempo
 */
export const calculateNPVEvolution = (recoveryData, productConfig, quarters = 40) => {
  const results = {
    quarterlyNPV: new Array(quarters).fill(0),
    quarterlyDetails: [],
    productRate: 0
  };
  
  // Calcola tasso prodotto
  const spreadRate = productConfig.spread || 0;
  const euriborRate = productConfig.euribor || 0;
  results.productRate = spreadRate + euriborRate;
  
  // Per ogni trimestre, calcola NPV totale dei recovery futuri
  for (let q = 0; q < quarters; q++) {
    let quarterNPV = 0;
    const quarterDetails = {
      quarter: q,
      cohorts: []
    };
    
    // Considera tutti i default fino al trimestre corrente
    if (recoveryData.recoverySchedule) {
      recoveryData.recoverySchedule.forEach(schedule => {
        if (schedule.defaultQuarter <= q) {
          // Questo default è già avvenuto, calcola NPV dei suoi recovery futuri
          const cohortNPV = calculateRecoveryNPV(
            schedule.recoverySchedule,
            q,
            results.productRate
          );
          
          quarterNPV += cohortNPV;
          
          quarterDetails.cohorts.push({
            defaultQuarter: schedule.defaultQuarter,
            defaultAmount: schedule.defaultAmount,
            npv: cohortNPV,
            timeFromDefault: q - schedule.defaultQuarter
          });
        }
      });
    }
    
    results.quarterlyNPV[q] = quarterNPV;
    results.quarterlyDetails.push(quarterDetails);
  }
  
  return results;
};

/**
 * Calcola incremento di valore dovuto al passaggio del tempo
 * @param {number} previousNPV - NPV trimestre precedente
 * @param {number} currentNPV - NPV trimestre corrente
 * @param {number} cashRecovered - Cash effettivamente recuperato nel trimestre
 * @returns {Object} Dettaglio variazione valore
 */
export const calculateTimeValueIncrease = (previousNPV, currentNPV, cashRecovered) => {
  // Incremento totale di valore
  const totalValueChange = currentNPV - previousNPV + cashRecovered;
  
  // Time value effect (unwinding del discount)
  const timeValueEffect = totalValueChange - 0; // Assumendo nessun nuovo default
  
  return {
    previousNPV,
    currentNPV,
    cashRecovered,
    totalValueChange,
    timeValueEffect,
    impliedReturn: previousNPV > 0 ? (timeValueEffect / previousNPV) * 400 : 0 // Annualizzato
  };
};

/**
 * Formatta dati NPV per visualizzazione Balance Sheet
 * @param {Object} npvResults - Risultati calcolo NPV
 * @param {number} quarter - Trimestre di riferimento
 * @returns {Object} Dati formattati per UI
 */
export const formatNPVForBalanceSheet = (npvResults, quarter) => {
  const currentNPV = npvResults.quarterlyNPV[quarter];
  const previousNPV = quarter > 0 ? npvResults.quarterlyNPV[quarter - 1] : 0;
  
  return {
    mainLine: {
      label: 'Non-Performing Assets (NPV)',
      value: currentNPV,
      unit: '€M'
    },
    
    metrics: {
      numberOfCohorts: npvResults.quarterlyDetails[quarter]?.cohorts.length || 0,
      discountRate: npvResults.productRate,
      quarterlyChange: currentNPV - previousNPV,
      changePercentage: previousNPV > 0 ? ((currentNPV - previousNPV) / previousNPV) * 100 : 0
    },
    
    cohortBreakdown: npvResults.quarterlyDetails[quarter]?.cohorts || []
  };
};