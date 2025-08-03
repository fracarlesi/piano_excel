// Test per verificare il recovery timing
import { calculateCollateralRecovery } from './financial-calculation/shared/backend/balance-sheet/assets/recovery-default/CollateralRecoveryCalculator.js';
import { calculateRecoveryTiming } from './financial-calculation/shared/backend/balance-sheet/assets/recovery-default/RecoveryTimingCalculator.js';

// Funzione di test esportata per essere chiamata dalla console del browser
export const testBridgeLoansRecoveryTiming = () => {
  console.log('=== TEST RECOVERY TIMING - BRIDGE LOANS REAL ESTATE ===\n');
  
  // Configurazione prodotto Bridge Loans Real Estate con timeToRecover = 24
  const bridgeProduct = {
    name: 'Bridge Loans Real Estate',
    productType: 'Credit',
    type: 'bullet',
    timeToRecover: 24, // 24 trimestri come impostato dall'utente
    ltv: 70,
    collateralHaircut: 20,
    recoveryCosts: 8,
    spread: 3.5,
    euribor: 2.0,
    isSecured: true,
    hasStateGuarantee: 'Not Present'
  };

  // Test parameters
  const defaultAmount = 100; // 100M default
  const defaultQuarter = 8; // Default al trimestre 8
  const totalQuarters = 40;
  const assumptions = { costOfFundsRate: 3.0 };

  console.log('Parametri test:');
  console.log('- Default amount: €100M');
  console.log('- Default quarter: Q8');
  console.log('- timeToRecover impostato: 24 trimestri');
  console.log('- Tipo prodotto: Bridge (bullet)');
  console.log('- No garanzie pubbliche\n');

  // 1. Calcola collateral recovery
  const collateralRecovery = calculateCollateralRecovery(
    defaultAmount,
    bridgeProduct,
    assumptions,
    defaultQuarter,
    totalQuarters
  );

  console.log('1. COLLATERAL RECOVERY CALCULATION:');
  console.log('- Recovery Start Quarter:', collateralRecovery.recoveryStartQuarter);
  console.log('- Recovery End Quarter:', collateralRecovery.recoveryEndQuarter);
  console.log('- Recovery Time (years):', collateralRecovery.recoveryTime);
  console.log('- Net Recovery Amount:', collateralRecovery.netRecovery.toFixed(2));
  console.log('- Recovery Rate:', collateralRecovery.recoveryRate.toFixed(2) + '%');
  console.log('- Breakdown:', collateralRecovery.breakdown);

  // 2. Calcola recovery timing distribution
  const stateGuaranteeRecovery = { recoveryAmount: 0, recoveryNPV: 0 }; // No garanzie pubbliche
  const recoveryTiming = calculateRecoveryTiming(
    stateGuaranteeRecovery,
    collateralRecovery,
    bridgeProduct,
    defaultQuarter,
    totalQuarters
  );

  console.log('\n2. RECOVERY TIMING DISTRIBUTION:');
  console.log('- Total recovery amount:', recoveryTiming.summary.totalRecoveryAmount.toFixed(2));
  console.log('- Recovery start quarter:', recoveryTiming.summary.recoveryStartQuarter);
  console.log('- Recovery completion quarter:', recoveryTiming.summary.recoveryCompletionQuarter);
  console.log('- Number of cashflows:', recoveryTiming.schedule.length);

  // Mostra quando avviene il recovery
  console.log('\nRecovery schedule dettagliato:');
  recoveryTiming.schedule.forEach((cf) => {
    console.log(`  Q${cf.quarter}: €${cf.totalRecovery.toFixed(2)}M`);
  });

  // Calcola trimestri totali dal default
  const quartersFromDefault = recoveryTiming.schedule[0]?.quarter - defaultQuarter;
  
  console.log('\n=== RISULTATO FINALE ===');
  console.log('Recovery avviene al trimestre:', recoveryTiming.schedule[0]?.quarter);
  console.log('Trimestri dal default:', quartersFromDefault);
  console.log('Expected (26 trimestri):', quartersFromDefault === 26 ? '✓' : '✗');
  
  if (quartersFromDefault !== 26) {
    console.log('\n⚠️  PROBLEMA IDENTIFICATO:');
    console.log(`Il recovery avviene dopo ${quartersFromDefault} trimestri invece di 26`);
    console.log('Dettagli:');
    console.log('- Delay iniziale:', collateralRecovery.recoveryStartQuarter - defaultQuarter, 'trimestri');
    console.log('- Recovery time in anni:', collateralRecovery.recoveryTime);
    console.log('- Recovery time in trimestri:', collateralRecovery.recoveryTime * 4);
  }
  
  return {
    collateralRecovery,
    recoveryTiming,
    quartersFromDefault
  };
};

// Rendi la funzione disponibile globalmente per test dalla console
if (typeof window !== 'undefined') {
  window.testBridgeLoansRecoveryTiming = testBridgeLoansRecoveryTiming;
}