// Test script per verificare il timing del recovery per Bridge Loans Real Estate
const { calculateCollateralRecovery } = require('./src/financial-calculation/shared/backend/balance-sheet/assets/recovery-default/CollateralRecoveryCalculator.js');
const { calculateRecoveryTiming } = require('./src/financial-calculation/shared/backend/balance-sheet/assets/recovery-default/RecoveryTimingCalculator.js');
const { calculateNPVEvolution } = require('./src/financial-calculation/shared/backend/balance-sheet/assets/non-performing-assets/NPVCalculator.js');

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
  euribor: 2.0, // esempio
  isSecured: true,
  hasStateGuarantee: 'Not Present'
};

// Test parameters
const defaultAmount = 100; // 100M default
const defaultQuarter = 8; // Default al trimestre 8
const totalQuarters = 40;
const assumptions = { costOfFundsRate: 3.0 };

console.log('=== TEST RECOVERY TIMING - BRIDGE LOANS REAL ESTATE ===\n');
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

// Verifica: recovery dovrebbe iniziare a Q8 + delay
const expectedDelay = 2; // trimestri per bridge loans
const expectedStartQuarter = defaultQuarter + expectedDelay;
console.log('\nVerifica timing:');
console.log('- Expected delay:', expectedDelay, 'trimestri');
console.log('- Expected start quarter:', expectedStartQuarter);
console.log('- Actual start quarter:', collateralRecovery.recoveryStartQuarter);
console.log('- Match:', collateralRecovery.recoveryStartQuarter === expectedStartQuarter ? '✓' : '✗');

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
console.log('\nRecovery schedule:');
recoveryTiming.schedule.forEach((cf, index) => {
  console.log(`  Q${cf.quarter}: €${cf.totalRecovery.toFixed(2)}M (${cf.type || 'collateral'})`);
});

// 3. Calcola evoluzione NPV
const recoveryData = {
  recoverySchedule: [{
    defaultQuarter: defaultQuarter,
    defaultAmount: defaultAmount,
    recoverySchedule: recoveryTiming.schedule
  }]
};

const npvEvolution = calculateNPVEvolution(recoveryData, bridgeProduct, totalQuarters);

console.log('\n3. NPV EVOLUTION:');
console.log('- Product rate used:', npvEvolution.productRate.toFixed(2) + '%');

// Mostra NPV per trimestri chiave
const keyQuarters = [
  defaultQuarter,
  defaultQuarter + 4,
  defaultQuarter + 8,
  defaultQuarter + 12,
  defaultQuarter + 16,
  defaultQuarter + 20,
  defaultQuarter + 24,
  defaultQuarter + 26,
  defaultQuarter + 28
];

console.log('\nNPV nei trimestri chiave:');
keyQuarters.forEach(q => {
  if (q < totalQuarters) {
    const npv = npvEvolution.quarterlyNPV[q];
    console.log(`  Q${q} (${q - defaultQuarter} quarters from default): €${npv.toFixed(2)}M`);
  }
});

// Trova quando NPV diventa zero
let npaZeroQuarter = -1;
for (let q = defaultQuarter; q < totalQuarters; q++) {
  if (npvEvolution.quarterlyNPV[q] === 0 && q > defaultQuarter) {
    npaZeroQuarter = q;
    break;
  }
}

console.log('\n=== RISULTATO FINALE ===');
console.log('NPV diventa zero al trimestre:', npaZeroQuarter);
console.log('Trimestri dal default:', npaZeroQuarter - defaultQuarter);
console.log('Expected (delay + timeToRecover):', expectedDelay + 24);
console.log('Match:', (npaZeroQuarter - defaultQuarter) === (expectedDelay + 24) ? '✓' : '✗');

if ((npaZeroQuarter - defaultQuarter) !== (expectedDelay + 24)) {
  console.log('\n⚠️  ATTENZIONE: Il timing non corrisponde alle aspettative!');
  console.log('Possibili cause:');
  console.log('1. Il recovery sta avvenendo prima del previsto');
  console.log('2. La distribuzione temporale non è corretta');
  console.log('3. Il campo timeToRecover non viene letto correttamente');
}