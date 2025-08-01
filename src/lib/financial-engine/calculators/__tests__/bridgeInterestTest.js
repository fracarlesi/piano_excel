import { calculateCreditProduct } from '../creditCalculator';

describe('Bridge Loan Interest Test', () => {
  test('1-year bullet loan should only generate interest for 1 year', () => {
    const bridgeLoan = {
      name: 'Bridge Test',
      type: 'bullet',
      durata: 1, // 1 year duration
      spread: 4.5,
      dangerRate: 0, // No defaults for this test
      rwaDensity: 50,
      commissionRate: 3.0,
      ltv: 60,
      recoveryCosts: 20,
      collateralHaircut: 30,
      timeToRecover: 3,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €100M in Y0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(bridgeLoan, assumptions, years);

    console.log('\n=== BRIDGE LOAN INTEREST TEST ===');
    console.log('Loan: €100M, Duration: 1 year, Rate: 8% (3.5% + 4.5%)');
    console.log('Disbursed: Q1 of Year 0');
    console.log('Maturity: Q1 of Year 1 (4 quarters later)');
    
    // Check interest income for each year
    console.log('\nInterest Income by Year:');
    for (let i = 0; i < 5; i++) {
      console.log(`Year ${i}: €${result.interestIncome[i].toFixed(2)}M`);
    }
    
    // Check performing assets
    console.log('\nPerforming Assets by Year:');
    for (let i = 0; i < 5; i++) {
      console.log(`Year ${i}: €${result.performingAssets[i].toFixed(2)}M`);
    }
    
    // Debug: check principal repayments
    console.log('\nPrincipal Repayments by Year:');
    for (let i = 0; i < 5; i++) {
      console.log(`Year ${i}: €${result.principalRepayments[i].toFixed(2)}M`);
    }
    
    // Verify interest is only in year 0
    expect(result.interestIncome[0]).toBeGreaterThan(0);
    expect(result.interestIncome[0]).toBeCloseTo(6, 1); // 3/4 * 8% of 100M (3 quarters)
    
    // No interest after year 0
    for (let i = 1; i < 10; i++) {
      expect(result.interestIncome[i]).toBe(0);
    }
    
    // Loan should be repaid after year 0
    for (let i = 1; i < 10; i++) {
      expect(result.performingAssets[i]).toBe(0);
    }
  });
});