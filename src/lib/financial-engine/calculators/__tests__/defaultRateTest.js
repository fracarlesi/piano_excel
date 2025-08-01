import { calculateCreditProduct } from '../creditCalculator';

describe('Default Rate Calculation Test', () => {
  test('50% danger rate should produce 50% NPL after one year', () => {
    const product = {
      name: 'Test 50% Default',
      type: 'bullet',
      durata: 5,
      spread: 5.0,
      dangerRate: 50.0, // 50% annual default rate
      rwaDensity: 50,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 3,
      stateGuaranteeType: 'none',
      volumeArray: [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €1000M in Y0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);

    console.log('\n=== 50% DANGER RATE TEST ===');
    console.log('Initial loan: €1000M');
    console.log('Danger rate: 50% annual');
    console.log('Expected: 50% should default each year\n');

    // Year 0 analysis
    const y0Defaults = result.newNPLs[0];
    const y0EndStock = result.performingAssets[0];
    const y0DefaultRate = y0Defaults / 1000 * 100;
    
    console.log('Year 0:');
    console.log(`  Starting balance: €1000M`);
    console.log(`  New defaults: €${y0Defaults.toFixed(2)}M (${y0DefaultRate.toFixed(1)}%)`);
    console.log(`  Ending performing: €${y0EndStock.toFixed(2)}M`);
    console.log(`  Ending NPL stock: €${result.nonPerformingAssets[0].toFixed(2)}M`);
    
    // Check if it's close to 50%
    const tolerance = 5; // Allow 5% tolerance due to quarterly timing
    const expectedDefaults = 1000 * 0.5;
    const actualDefaultPct = y0Defaults / 1000 * 100;
    
    console.log(`\nExpected defaults: €${expectedDefaults}M (50%)`);
    console.log(`Actual defaults: €${y0Defaults.toFixed(2)}M (${actualDefaultPct.toFixed(1)}%)`);
    console.log(`Difference: ${Math.abs(50 - actualDefaultPct).toFixed(1)}%`);
    
    // Year 1 analysis (should be 50% of remaining balance)
    const y1StartBalance = y0EndStock;
    const y1Defaults = result.newNPLs[1];
    const y1EndStock = result.performingAssets[1];
    const y1DefaultRate = y1StartBalance > 0 ? y1Defaults / y1StartBalance * 100 : 0;
    
    console.log('\nYear 1:');
    console.log(`  Starting balance: €${y1StartBalance.toFixed(2)}M`);
    console.log(`  New defaults: €${y1Defaults.toFixed(2)}M (${y1DefaultRate.toFixed(1)}% of start balance)`);
    console.log(`  Ending performing: €${y1EndStock.toFixed(2)}M`);
    
    // Verify results
    expect(Math.abs(actualDefaultPct - 50)).toBeLessThan(tolerance);
    
    // Also check that performing + NPL roughly equals original amount (minus LLP)
    const totalAssets = result.performingAssets[0] + result.newNPLs[0];
    console.log(`\nTotal check: Performing + Defaults = €${totalAssets.toFixed(2)}M`);
    expect(totalAssets).toBeCloseTo(1000, -1); // Within 10M
  });

  test('Compare old vs new calculation method', () => {
    console.log('\n=== CALCULATION METHOD COMPARISON ===');
    
    const dangerRate = 0.5; // 50%
    const initialBalance = 100;
    
    // Old method (compound quarterly)
    console.log('\nOLD METHOD (Compound Quarterly):');
    let oldBalance = initialBalance;
    let oldTotalDefaults = 0;
    const quarterlyRate = dangerRate / 4;
    
    for (let q = 1; q <= 4; q++) {
      const defaults = oldBalance * quarterlyRate;
      oldBalance -= defaults;
      oldTotalDefaults += defaults;
      console.log(`  Q${q}: Default ${defaults.toFixed(2)}, Balance ${oldBalance.toFixed(2)}`);
    }
    console.log(`  Total defaults: ${oldTotalDefaults.toFixed(2)} (${(oldTotalDefaults/initialBalance*100).toFixed(1)}%)`);
    
    // New method (annual rate distributed)
    console.log('\nNEW METHOD (Annual Rate Distributed):');
    const annualDefaults = initialBalance * dangerRate;
    const quarterlyDefaults = annualDefaults / 4;
    let newBalance = initialBalance;
    
    for (let q = 1; q <= 4; q++) {
      newBalance -= quarterlyDefaults;
      console.log(`  Q${q}: Default ${quarterlyDefaults.toFixed(2)}, Balance ${newBalance.toFixed(2)}`);
    }
    console.log(`  Total defaults: ${annualDefaults.toFixed(2)} (${(annualDefaults/initialBalance*100).toFixed(1)}%)`);
    
    console.log(`\nDifference: Old method underestimates by ${(50 - oldTotalDefaults).toFixed(2)}%`);
  });
});