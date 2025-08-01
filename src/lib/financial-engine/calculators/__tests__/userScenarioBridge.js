import { calculateCreditProduct } from '../creditCalculator';

describe('User Scenario - Bridge with 100M in Year 1 Only', () => {
  test('Bridge loan with 100M in year 1 should NOT generate interest for 10 years', () => {
    const bridgeProduct = {
      name: 'Bridge User Scenario',
      type: 'bullet',
      durata: 1, // 1 year duration
      spread: 4.5,
      dangerRate: 1.0,
      rwaDensity: 80,
      commissionRate: 3.0,
      ltv: 60,
      recoveryCosts: 20,
      collateralHaircut: 30,
      timeToRecover: 3,
      stateGuaranteeType: 'present',
      stateGuaranteeCoverage: 80,
      stateGuaranteeRecoveryTime: 0.5,
      // User scenario: 100M only in year 1
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [25, 25, 25, 25],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(bridgeProduct, assumptions, years);

    console.log('\n=== USER SCENARIO: BRIDGE WITH 100M IN YEAR 1 ONLY ===');
    console.log('Product: 1 year bullet loan');
    console.log('Volume: €100M in year 1 only');
    console.log('Expected: Interest only in years 0-1');
    
    // Show volumes
    console.log('\n--- VOLUMES ---');
    for (let i = 0; i < 10; i++) {
      if (result.volumes[i] > 0) {
        console.log(`Year ${i}: €${result.volumes[i].toFixed(2)}M`);
      }
    }
    
    // Show performing assets
    console.log('\n--- PERFORMING ASSETS ---');
    for (let i = 0; i < 10; i++) {
      if (result.performingAssets[i] > 0) {
        console.log(`Year ${i}: €${result.performingAssets[i].toFixed(2)}M`);
      }
    }
    
    // Show interest income
    console.log('\n--- INTEREST INCOME ---');
    let totalInterest = 0;
    for (let i = 0; i < 10; i++) {
      if (result.interestIncome[i] > 0.01) {
        console.log(`Year ${i}: €${result.interestIncome[i].toFixed(2)}M`);
        totalInterest += result.interestIncome[i];
      }
    }
    console.log(`Total interest: €${totalInterest.toFixed(2)}M`);
    
    // Show when principal is repaid
    console.log('\n--- PRINCIPAL REPAYMENTS ---');
    for (let i = 0; i < 10; i++) {
      if (result.principalRepayments[i] > 0) {
        console.log(`Year ${i}: €${result.principalRepayments[i].toFixed(2)}M`);
      }
    }
    
    // Verify behavior
    console.log('\n--- VERIFICATION ---');
    const yearsWithInterest = result.interestIncome.filter(income => income > 0.01).length;
    console.log(`Years with interest: ${yearsWithInterest}`);
    
    if (yearsWithInterest > 2) {
      console.log('⚠️  PROBLEM: Interest continues beyond expected!');
      console.log('A 1-year bullet loan should only generate interest for 1 year');
    } else {
      console.log('✅ CORRECT: Interest only generated during loan life');
    }
    
    // Check if there are any defaults creating NPL interest
    console.log('\n--- NPL CHECK ---');
    for (let i = 0; i < 10; i++) {
      if (result.nonPerformingAssets[i] > 0) {
        console.log(`Year ${i}: NPL stock €${result.nonPerformingAssets[i].toFixed(2)}M`);
      }
    }
  });

  test('Compare with continuous volume scenario', () => {
    // Scenario with volumes every year
    const continuousVolumes = {
      name: 'Continuous Bridge',
      type: 'bullet',
      durata: 1,
      spread: 4.5,
      dangerRate: 0, // No defaults for clarity
      rwaDensity: 80,
      commissionRate: 3.0,
      ltv: 60,
      recoveryCosts: 20,
      collateralHaircut: 30,
      timeToRecover: 3,
      // 10M every year
      volumeArray: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [25, 25, 25, 25],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(continuousVolumes, assumptions, years);

    console.log('\n\n=== CONTINUOUS VOLUME SCENARIO ===');
    console.log('€10M new loans every year, 1-year bullets');
    
    console.log('\nInterest by year:');
    for (let i = 0; i < 10; i++) {
      console.log(`  Year ${i}: €${result.interestIncome[i].toFixed(2)}M`);
    }
    
    console.log('\nThis scenario SHOULD show interest every year');
    console.log('because new loans are originated continuously');
  });
});