import { calculateCreditProduct } from '../creditCalculator';

describe('Integrated LLP Test with New Calculator', () => {
  test('Verify LLP calculation produces reasonable values over time', () => {
    const product = {
      name: 'Test LLP Integration',
      type: 'french',
      durata: 10,
      spread: 2.0,
      dangerRate: 5, // 5% annual default rate
      rwaDensity: 100,
      commissionRate: 0.5,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 2,
      volumeArray: [200, 150, 100, 50, 25, 0, 0, 0, 0, 0] // Declining new business
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [25, 25, 25, 25],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);

    console.log('\n=== INTEGRATED LLP TEST RESULTS ===');
    console.log('Product: 10-year French amortization, 5% danger rate');
    console.log('Volumes: Declining from €200M to €0M\n');
    
    console.log('Year | Performing | New NPLs | LLP    | NPL Stock');
    console.log('-----|------------|----------|--------|----------');
    
    for (let i = 0; i < 10; i++) {
      console.log(
        `  ${i}  | €${result.performingAssets[i].toFixed(1).padStart(6)}M | €${result.newNPLs[i].toFixed(1).padStart(5)}M | €${result.llp[i].toFixed(2).padStart(5)}M | €${result.nonPerformingAssets[i].toFixed(1).padStart(6)}M`
      );
    }
    
    // Verify LLP behavior
    console.log('\n--- VERIFICATION ---');
    
    // Check that LLP is negative (cost) and reasonable
    const llpValues = result.llp;
    const allNegative = llpValues.every(v => v <= 0);
    console.log(`All LLP values negative (costs): ${allNegative ? '✅' : '❌'}`);
    
    // Check that LLP doesn't drop to zero abruptly
    const hasReasonableProgression = !llpValues.slice(0, 5).some((v, i) => 
      i > 0 && Math.abs(v) < 0.01 && result.performingAssets[i] > 10
    );
    console.log(`LLP progression reasonable: ${hasReasonableProgression ? '✅' : '❌'}`);
    
    // Check relationship between defaults and LLP
    const coverageRatios = result.newNPLs.map((defaults, i) => 
      defaults > 0 ? Math.abs(result.llp[i]) / defaults : 0
    );
    const avgCoverage = coverageRatios.filter(r => r > 0).reduce((sum, r) => sum + r, 0) / 
                        coverageRatios.filter(r => r > 0).length;
    console.log(`Average LLP coverage ratio: ${(avgCoverage * 100).toFixed(1)}%`);
    
    // Assertions
    expect(allNegative).toBe(true);
    expect(hasReasonableProgression).toBe(true);
    expect(avgCoverage).toBeGreaterThan(0.1); // At least 10% coverage
    expect(avgCoverage).toBeLessThan(0.5); // But not more than 50%
  });
});