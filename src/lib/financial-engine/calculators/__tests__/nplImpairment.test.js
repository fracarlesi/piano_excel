import { calculateCreditProduct } from '../creditCalculator';

describe('NPL Impairment Model Test', () => {
  test('NPL impairment with time to recover', () => {
    const product = {
      name: 'Test NPL Impairment',
      type: 'french',
      durata: 5,
      gracePeriod: 0,
      spread: 3.5,
      dangerRate: 2.0, // 2% annual default rate
      rwaDensity: 50,
      commissionRate: 1.0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 3, // 3 years recovery time
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

    console.log('\n=== NPL IMPAIRMENT MODEL TEST ===');
    console.log('Loan amount: €1000M');
    console.log('Danger rate: 2% annual');
    console.log('Time to recover: 3 years');
    console.log('LTV: 70%');
    console.log('Recovery costs: 15%');
    console.log('Collateral haircut: 25%');
    
    console.log('\n--- YEAR BY YEAR RESULTS ---');
    for (let i = 0; i < 6; i++) {
      console.log(`\nYear ${i}:`);
      console.log(`  Performing assets: €${result.performingAssets[i].toFixed(2)}M`);
      console.log(`  NPL stock (net): €${result.nonPerformingAssets[i].toFixed(2)}M`);
      console.log(`  New NPLs: €${result.newNPLs[i].toFixed(2)}M`);
      console.log(`  LLP: €${result.llp[i].toFixed(2)}M`);
      console.log(`  Interest income: €${result.interestIncome[i].toFixed(2)}M`);
    }
    
    // Basic validation
    expect(result.llp[0]).toBeLessThan(0); // LLP should be negative (cost)
    expect(result.nonPerformingAssets[1]).toBeGreaterThan(0); // Should have NPL stock
    expect(result.performingAssets[2]).toBeLessThan(result.performingAssets[0]); // Stock should decrease
    
    // Calculate expected recovery example
    console.log('\n--- RECOVERY CALCULATION EXAMPLE ---');
    const defaultAmount = 20; // €20M default
    const collateralValue = defaultAmount / 0.7; // LTV 70%
    const valueAfterHaircut = collateralValue * 0.75; // 25% haircut
    const recoveryCosts = defaultAmount * 0.15;
    const estimatedRecovery = valueAfterHaircut - recoveryCosts;
    const rate = 0.07; // 7% interest rate
    const npvRecovery = estimatedRecovery / Math.pow(1 + rate, 3);
    const llp = defaultAmount - npvRecovery;
    
    console.log(`Default amount: €${defaultAmount}M`);
    console.log(`Collateral value: €${collateralValue.toFixed(2)}M`);
    console.log(`Value after haircut: €${valueAfterHaircut.toFixed(2)}M`);
    console.log(`Recovery costs: €${recoveryCosts.toFixed(2)}M`);
    console.log(`Estimated recovery: €${estimatedRecovery.toFixed(2)}M`);
    console.log(`NPV of recovery (3 years): €${npvRecovery.toFixed(2)}M`);
    console.log(`LLP required: €${llp.toFixed(2)}M`);
  });
});