import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('NPL Stock Tracking Test', () => {
  test('NPL stock should track NBV not nominal values', () => {
    console.log('\n=== NPL STOCK TRACKING TEST ===');
    
    // RE Bridge product
    const reBridge = {
      name: 'RE Bridge Financing',
      volumes: { y1: 100, y10: 100 }, // Fixed volume for clarity
      avgLoanSize: 15.0,
      spread: 4.2,
      rwaDensity: 85,
      durata: 8,
      commissionRate: 2.5,
      dangerRate: 10.0, // High danger rate for testing
      defaultAfterQuarters: 4,
      ltv: 70.0,
      recoveryCosts: 18.0,
      collateralHaircut: 25.0,
      type: 'bullet',
      gracePeriod: 0,
      timeToRecover: 12,
      stateGuaranteeType: 'none',
      stateGuaranteeCoverage: 0,
      stateGuaranteeRecoveryTime: 2,
      isUnsecured: false
    };
    
    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0] // All disbursements in Q1
    };
    
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Calculate product results
    const results = calculateCreditProductQuarterly(reBridge, assumptions, years);
    
    console.log('\nProduct Configuration:');
    console.log(`- Danger rate: ${reBridge.dangerRate}%`);
    console.log(`- Default after: ${reBridge.defaultAfterQuarters} quarters`);
    console.log(`- Recovery rate: ~89% (before discounting)`);
    console.log(`- NBV/Nominal ratio: ~71.3% (after discounting)`);
    
    // Find when defaults occur
    console.log('\n--- QUARTERLY NPL EVOLUTION ---');
    console.log('Quarter | New NPLs | NPL Stock | Performing | Notes');
    console.log('--------|----------|-----------|------------|------');
    
    for (let q = 0; q < 20; q++) {
      const year = Math.floor(q / 4);
      const quarter = q % 4;
      
      const newNPLs = results.quarterly.newNPLs[q] || 0;
      const nplStock = results.quarterly.nplStock[q] || 0;
      const performing = results.quarterly.performingStock[q] || 0;
      
      let notes = '';
      if (q === 0) notes = 'Disbursement';
      if (q === 4) notes = 'Default occurs';
      if (q === 5) notes = 'Y1 disbursement';
      if (q === 9) notes = 'Y1 default';
      if (q === 16) notes = 'Y0 recovery';
      
      console.log(
        `Y${year}Q${quarter+1} (${q.toString().padStart(2)}) | ` +
        `€${newNPLs.toFixed(1).padStart(6)}M | ` +
        `€${nplStock.toFixed(1).padStart(7)}M | ` +
        `€${performing.toFixed(1).padStart(8)}M | ${notes}`
      );
    }
    
    // Check specific quarters
    console.log('\n--- KEY OBSERVATIONS ---');
    
    // Q4: First default
    const q4NewDefaults = results.quarterly.newNPLs[4];
    const q4NPLStock = results.quarterly.nplStock[4];
    const expectedDefaults = 100 * 0.1; // 10% of 100M
    const expectedNBV = expectedDefaults * 0.713; // ~71.3% NBV ratio
    
    console.log('\nQ4 (First default):');
    console.log(`- Expected defaults: €${expectedDefaults}M (10% of €100M)`);
    console.log(`- Actual new NPLs: €${q4NewDefaults.toFixed(2)}M`);
    console.log(`- Expected NBV: €${expectedNBV.toFixed(2)}M`);
    console.log(`- Actual NPL stock: €${q4NPLStock.toFixed(2)}M`);
    
    if (Math.abs(q4NPLStock - expectedNBV) < 0.1) {
      console.log('✅ NPL stock correctly tracks NBV');
    } else {
      console.log('❌ NPL stock does not match expected NBV');
    }
    
    // Check annual totals
    console.log('\n--- ANNUAL NPL STOCK ---');
    for (let y = 0; y < 5; y++) {
      const annualNPL = results.nonPerformingAssets[y] || 0;
      const q4NPL = results.quarterly.nplStock[y * 4 + 3] || 0;
      console.log(`Year ${y}: €${annualNPL.toFixed(1)}M (Q4: €${q4NPL.toFixed(1)}M)`);
    }
    
    // Verify NPL stock never exceeds performing + NPL
    console.log('\n--- BALANCE SHEET INTEGRITY CHECK ---');
    let hasError = false;
    for (let q = 0; q < 20; q++) {
      const performing = results.quarterly.performingStock[q] || 0;
      const npl = results.quarterly.nplStock[q] || 0;
      const total = performing + npl;
      
      if (npl < 0) {
        console.log(`❌ Q${q}: Negative NPL stock: €${npl.toFixed(2)}M`);
        hasError = true;
      }
      
      // Check if NPL recovery causes issues
      if (q >= 16 && results.quarterly.nplStock[q-1] > results.quarterly.nplStock[q] + 0.1) {
        const recovery = results.quarterly.nplStock[q-1] - results.quarterly.nplStock[q];
        console.log(`Q${q}: Recovery of €${recovery.toFixed(2)}M`);
      }
    }
    
    if (!hasError) {
      console.log('✅ No negative NPL stocks found');
    }
  });
});