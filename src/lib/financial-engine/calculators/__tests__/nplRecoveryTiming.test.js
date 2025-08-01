import { calculateCreditProduct } from '../creditCalculator';

describe('NPL Recovery Timing Test', () => {
  test('NPL recoveries should happen after timeToRecover period', () => {
    const product = {
      name: 'Recovery Timing Test',
      type: 'bullet',
      durata: 2, // 2 year loan
      gracePeriod: 0,
      spread: 5.0,
      dangerRate: 10.0, // High default rate for testing
      rwaDensity: 50,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 10,
      collateralHaircut: 20,
      timeToRecover: 2, // 2 years recovery time
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €100M in Y0 only
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);

    console.log('\n=== NPL RECOVERY TIMING TEST ===');
    console.log('Loan: €100M bullet, 2 years maturity');
    console.log('Default rate: 10% annual (2.5% quarterly)');
    console.log('Time to recover: 2 years');
    console.log('Expected behavior:');
    console.log('- Defaults occur in Y0 and Y1');
    console.log('- Recoveries should start in Y2 and Y3');
    
    console.log('\n--- DETAILED YEAR BY YEAR ---');
    let previousNPLStock = 0;
    
    for (let i = 0; i < 6; i++) {
      const nplStockChange = result.nonPerformingAssets[i] - previousNPLStock;
      const newDefaults = result.newNPLs[i];
      
      console.log(`\nYear ${i}:`);
      console.log(`  Performing assets: €${result.performingAssets[i].toFixed(2)}M`);
      console.log(`  NPL stock: €${result.nonPerformingAssets[i].toFixed(2)}M`);
      console.log(`  New defaults: €${newDefaults.toFixed(2)}M`);
      console.log(`  NPL stock change: €${nplStockChange.toFixed(2)}M`);
      
      // Analyze what happened
      if (newDefaults > 0) {
        console.log(`  => New NPLs added to stock`);
      }
      if (nplStockChange < 0) {
        console.log(`  => RECOVERY! €${Math.abs(nplStockChange).toFixed(2)}M recovered`);
      }
      
      previousNPLStock = result.nonPerformingAssets[i];
    }
    
    // Verify recovery timing
    console.log('\n--- RECOVERY TIMING VERIFICATION ---');
    
    // Should have defaults in Y0 and Y1 (loan active period)
    expect(result.newNPLs[0]).toBeGreaterThan(0);
    expect(result.newNPLs[1]).toBeGreaterThan(0);
    
    // Defaults continue for a bit after maturity due to quarterly mechanics
    // but should be much lower
    expect(result.newNPLs[2]).toBeLessThan(result.newNPLs[0]);
    
    // NPL stock should decrease starting from Y2/Y3 due to recoveries
    const y2Change = result.nonPerformingAssets[2] - result.nonPerformingAssets[1];
    const y3Change = result.nonPerformingAssets[3] - result.nonPerformingAssets[2];
    
    console.log(`\nY1->Y2 NPL stock change: €${y2Change.toFixed(2)}M`);
    console.log(`Y2->Y3 NPL stock change: €${y3Change.toFixed(2)}M`);
    
    // We expect recoveries to start reducing NPL stock
    // Note: exact timing depends on quarterly granularity
    const hasRecoveries = y2Change < 0 || y3Change < 0;
    console.log(`Recoveries detected: ${hasRecoveries ? 'YES' : 'NO'}`);
    
    expect(hasRecoveries).toBe(true);
  });
});