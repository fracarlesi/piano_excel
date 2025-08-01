import { calculateCreditProduct } from '../creditCalculator';

describe('Bridge Financing Interest Debug', () => {
  test('1-year bridge loan should NOT generate interest for 10 years', () => {
    // Simulate SME Bridge product from defaultAssumptions
    const bridgeProduct = {
      name: 'Bridge (Ponte)',
      type: 'bullet',
      durata: 1.5, // 1.5 years as in defaultAssumptions
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
      // Test with varying volumes over years
      volumes: { y1: 15, y10: 60 } // As per defaultAssumptions
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [25, 25, 25, 25],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(bridgeProduct, assumptions, years);

    console.log('\n=== BRIDGE FINANCING DEBUG ===');
    console.log('Product: 1.5 year bullet loan');
    console.log('Volumes: Y1=€15M, Y10=€60M (linear interpolation)');
    console.log('Rate: 8% (3.5% + 4.5%)');
    
    // Show volume distribution
    console.log('\n--- VOLUME DISTRIBUTION ---');
    for (let i = 0; i < 10; i++) {
      console.log(`Year ${i}: New loans €${result.volumes[i].toFixed(2)}M`);
    }
    
    // Show performing assets
    console.log('\n--- PERFORMING ASSETS ---');
    for (let i = 0; i < 10; i++) {
      console.log(`Year ${i}: €${result.performingAssets[i].toFixed(2)}M`);
    }
    
    // Show interest income
    console.log('\n--- INTEREST INCOME ---');
    for (let i = 0; i < 10; i++) {
      console.log(`Year ${i}: €${result.interestIncome[i].toFixed(2)}M`);
    }
    
    // Show principal repayments
    console.log('\n--- PRINCIPAL REPAYMENTS ---');
    for (let i = 0; i < 10; i++) {
      console.log(`Year ${i}: €${result.principalRepayments[i].toFixed(2)}M`);
    }
    
    // Analysis
    console.log('\n--- ANALYSIS ---');
    
    // Check when loans mature
    console.log('\nExpected behavior:');
    console.log('- Year 0: €15M disbursed, matures in Y1/Y2');
    console.log('- Year 1: €20M disbursed, matures in Y2/Y3');
    console.log('- Each vintage should generate interest only until maturity');
    
    // Verify interest stops appropriately
    let lastYearWithInterest = -1;
    for (let i = 9; i >= 0; i--) {
      if (result.interestIncome[i] > 0.01) {
        lastYearWithInterest = i;
        break;
      }
    }
    
    console.log(`\nLast year with interest: Year ${lastYearWithInterest}`);
    console.log(`Total years with interest: ${lastYearWithInterest + 1}`);
    
    // Check if this is correct
    if (lastYearWithInterest > 3) {
      console.log('\n⚠️  PROBLEM DETECTED: Interest continues beyond expected!');
      console.log('Bridge loans with 1.5 year duration should not generate interest past year 3-4');
    }
  });

  test('Simple single vintage bridge loan test', () => {
    const simpleBridge = {
      name: 'Simple Bridge',
      type: 'bullet',
      durata: 1, // Exactly 1 year
      spread: 4.5,
      dangerRate: 0, // No defaults
      rwaDensity: 80,
      commissionRate: 3.0,
      ltv: 60,
      recoveryCosts: 20,
      collateralHaircut: 30,
      timeToRecover: 3,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Only year 0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(simpleBridge, assumptions, years);

    console.log('\n\n=== SIMPLE BRIDGE TEST ===');
    console.log('Single €100M loan in Y0Q1, 1-year bullet');
    
    console.log('\nInterest by year:');
    for (let i = 0; i < 5; i++) {
      console.log(`  Year ${i}: €${result.interestIncome[i].toFixed(2)}M`);
    }
    
    // This should match our earlier test
    expect(result.interestIncome[0]).toBeCloseTo(6, 1); // 3 quarters of interest
    for (let i = 1; i < 10; i++) {
      expect(result.interestIncome[i]).toBe(0);
    }
  });
});