import { updateAllVintagePrincipals } from '../amortizationCalculator';
import { createVintage } from '../vintageManager';

describe('Grace Period Timing Test', () => {
  test('Grace period timing - should start amortization AFTER grace ends', () => {
    console.log('\n=== GRACE PERIOD TIMING TEST ===');
    
    const product = {
      type: 'french',
      durata: 12, // 12 quarters
      gracePeriod: 4, // 4 quarters grace
      spread: 4.0,
      isFixedRate: false
    };
    
    const assumptions = {
      euribor: 3.5
    };
    
    // Create a vintage starting at Y1Q1 (Q4)
    const vintage = createVintage({
      year: 1,
      quarter: 0, // Q1
      volume: 100,
      product,
      assumptions
    });
    
    const vintages = [vintage];
    
    console.log('\nVintage details:');
    console.log(`- Start: Y${vintage.startYear}Q${vintage.startQuarter + 1} (global Q${vintage.startYear * 4 + vintage.startQuarter})`);
    console.log(`- Grace period: ${vintage.gracePeriod} quarters`);
    console.log(`- Quarterly payment: €${vintage.quarterlyPayment?.toFixed(4)}M`);
    console.log(`- Initial principal: €${vintage.initialAmount}M`);
    
    console.log('\n--- QUARTER-BY-QUARTER PRINCIPAL UPDATES ---');
    console.log('Quarter | Elapsed | In Grace? | Principal Before | Principal After | Repayment');
    console.log('--------|---------|-----------|------------------|-----------------|----------');
    
    const startQ = vintage.startYear * 4 + vintage.startQuarter; // Q4
    
    // Test quarters around grace period end
    for (let q = 0; q < 12; q++) {
      const currentQuarter = startQ + q;
      const elapsed = q;
      const inGrace = elapsed < vintage.gracePeriod;
      const principalBefore = vintage.outstandingPrincipal;
      
      // Update principal
      updateAllVintagePrincipals(vintages, currentQuarter, product, assumptions);
      
      const principalAfter = vintage.outstandingPrincipal;
      const repayment = principalBefore - principalAfter;
      
      const year = Math.floor(currentQuarter / 4);
      const quarter = (currentQuarter % 4) + 1;
      
      console.log(`Y${year}Q${quarter}     | ${elapsed.toString().padStart(7)} | ${inGrace ? 'YES      ' : 'NO       '} | €${principalBefore.toFixed(2).padStart(14)}M | €${principalAfter.toFixed(2).padStart(13)}M | €${repayment.toFixed(2).padStart(7)}M`);
    }
    
    console.log('\n--- ANALYSIS ---');
    console.log('Grace period: 4 quarters (Q0-Q3)');
    console.log('Expected behavior:');
    console.log('- Q0-Q3: No principal repayment (in grace)');
    console.log('- Q4: First principal repayment (grace ended)');
    
    // Reset and test the exact boundary
    vintage.outstandingPrincipal = 100;
    
    // Test at Q7 (elapsed = 3, last quarter of grace)
    updateAllVintagePrincipals(vintages, startQ + 3, product, assumptions);
    const afterQ3 = vintage.outstandingPrincipal;
    
    // Test at Q8 (elapsed = 4, first quarter after grace)
    updateAllVintagePrincipals(vintages, startQ + 4, product, assumptions);
    const afterQ4 = vintage.outstandingPrincipal;
    
    console.log('\n--- BOUNDARY TEST ---');
    console.log(`After Q3 (elapsed=3, last grace quarter): €${afterQ3}M`);
    console.log(`After Q4 (elapsed=4, first post-grace): €${afterQ4}M`);
    
    if (afterQ3 === 100 && afterQ4 < 100) {
      console.log('✅ CORRECT: No repayment during grace, first repayment after grace');
    } else if (afterQ3 < 100) {
      console.log('❌ ERROR: Repayment started during grace period!');
    } else {
      console.log('❌ ERROR: No repayment after grace period ended!');
    }
  });
});