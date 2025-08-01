import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Grace Period Maturity Test', () => {
  test('French loans with and without grace should have same maturity', () => {
    // French loan WITHOUT grace period
    const frenchNoGrace = {
      name: 'French No Grace',
      type: 'french',
      durata: 12, // 3 years in quarters
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      gracePeriod: 0, // No grace period
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 0
    };

    // French loan WITH grace period
    const frenchWithGrace = {
      name: 'French With Grace',
      type: 'french',
      durata: 12, // 3 years in quarters
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      gracePeriod: 4, // 4 quarters grace period
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4];
    
    console.log('\n=== GRACE PERIOD MATURITY TEST ===');
    console.log('Testing two French loans with same duration (12 quarters)');
    console.log('One without grace, one with 4 quarters grace');
    console.log('Both should mature at the same time!\n');
    
    const resultNoGrace = calculateCreditProductQuarterly(frenchNoGrace, assumptions, years);
    const resultWithGrace = calculateCreditProductQuarterly(frenchWithGrace, assumptions, years);
    
    const stockNoGrace = resultNoGrace.quarterly?.performingStock || [];
    const stockWithGrace = resultWithGrace.quarterly?.performingStock || [];
    
    // Print comparison table
    console.log('Quarter | No Grace | With Grace | Comment');
    console.log('--------|----------|------------|--------');
    
    for (let q = 0; q < 20; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const noGrace = stockNoGrace[q] || 0;
      const withGrace = stockWithGrace[q] || 0;
      
      let comment = '';
      if (q === 0) comment = 'Disbursement';
      else if (q < 4 && withGrace === 100) comment = 'Grace period';
      else if (q === 12) comment = 'Expected maturity';
      else if (q === 13) comment = 'Should be 0';
      
      console.log(`Y${year}Q${quarter}     | €${noGrace.toFixed(0).padStart(6)}M | €${withGrace.toFixed(0).padStart(8)}M | ${comment}`);
    }
    
    // Find actual maturity quarters
    let maturityNoGrace = -1;
    let maturityWithGrace = -1;
    
    for (let q = 0; q < 20; q++) {
      if (stockNoGrace[q] > 0 && (stockNoGrace[q + 1] || 0) === 0) {
        maturityNoGrace = q;
      }
      if (stockWithGrace[q] > 0 && (stockWithGrace[q + 1] || 0) === 0) {
        maturityWithGrace = q;
      }
    }
    
    console.log('\n--- MATURITY ANALYSIS ---');
    console.log(`No Grace: Last quarter with balance = Q${maturityNoGrace} (Y${Math.floor(maturityNoGrace/4)}Q${(maturityNoGrace%4)+1})`);
    console.log(`With Grace: Last quarter with balance = Q${maturityWithGrace} (Y${Math.floor(maturityWithGrace/4)}Q${(maturityWithGrace%4)+1})`);
    console.log(`Difference: ${maturityWithGrace - maturityNoGrace} quarters`);
    
    if (maturityNoGrace !== maturityWithGrace) {
      console.log('\n❌ ERROR: Grace period is affecting total loan duration!');
      console.log('Grace period should only delay capital repayment, not change maturity date.');
    } else {
      console.log('\n✅ CORRECT: Both loans mature at the same time.');
    }
    
    // Test expectation
    expect(maturityNoGrace).toBe(11); // Q11 = Y2Q4 (12th quarter, 0-indexed)
    expect(maturityWithGrace).toBe(11); // Should be the same!
  });
});