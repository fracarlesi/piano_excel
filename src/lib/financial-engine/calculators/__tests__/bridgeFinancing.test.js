import { calculateCreditProduct } from '../creditCalculator';

describe('Bridge Financing Test', () => {
  test('1-year bridge loan Q1 disbursement should have interest in Y2', () => {
    const product = {
      name: 'Bridge Financing',
      type: 'bullet',
      durata: 1, // 1 year maturity
      spread: 6.5,
      dangerRate: 0,
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

    console.log('\nBridge Financing Test Results:');
    console.log('Y0 Interest:', result.interestIncome[0]);
    console.log('Y1 Interest:', result.interestIncome[1]);
    console.log('Y2 Interest:', result.interestIncome[2]);
    console.log('\nY0 Stock:', result.performingAssets[0]);
    console.log('Y1 Stock:', result.performingAssets[1]);
    console.log('Y2 Stock:', result.performingAssets[2]);
    console.log('\nY0 Repayments:', result.principalRepayments[0]);
    console.log('Y1 Repayments:', result.principalRepayments[1]);
    console.log('Y2 Repayments:', result.principalRepayments[2]);

    // Interest rate = 3.5% + 6.5% = 10%
    // Q1 Y0 disbursement, matures Q1 Y1
    // Y0: Q2, Q3, Q4 = 3 quarters of interest = 100 × 10% × (3/4) = 7.5
    expect(result.interestIncome[0]).toBeCloseTo(7.5, 2);
    
    // Y1: Q1 only = 1 quarter of interest = 100 × 10% × (1/4) = 2.5
    expect(result.interestIncome[1]).toBeCloseTo(2.5, 2);
    
    // Y2: No interest (loan already matured)
    expect(result.interestIncome[2]).toBe(0);

    // Stock should be 100 in Y0, 0 from Y1 onwards
    expect(result.performingAssets[0]).toBe(100);
    expect(result.performingAssets[1]).toBe(0);
    
    // Principal repayment should happen in Y1
    expect(result.principalRepayments[0]).toBe(0);
    expect(result.principalRepayments[1]).toBe(100);
  });

  test('2-year bridge loan Q3 disbursement', () => {
    const product = {
      name: 'Bridge Financing 2Y',
      type: 'bullet',
      durata: 2, // 2 year maturity
      spread: 6.5,
      dangerRate: 0,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [0, 0, 100, 0], // All in Q3
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);

    console.log('\n2-Year Bridge Q3 Test Results:');
    console.log('Y0 Interest:', result.interestIncome[0]);
    console.log('Y1 Interest:', result.interestIncome[1]);
    console.log('Y2 Interest:', result.interestIncome[2]);
    console.log('Y3 Interest:', result.interestIncome[3]);

    // Q3 Y0 disbursement, matures Q3 Y2
    // Y0: Q4 only = 1 quarter = 100 × 10% × (1/4) = 2.5
    expect(result.interestIncome[0]).toBeCloseTo(2.5, 2);
    
    // Y1: Full year = 100 × 10% = 10
    expect(result.interestIncome[1]).toBeCloseTo(10, 2);
    
    // Y2: Q1, Q2, Q3 = 3 quarters = 100 × 10% × (3/4) = 7.5
    expect(result.interestIncome[2]).toBeCloseTo(7.5, 2);
    
    // Y3: No interest
    expect(result.interestIncome[3]).toBe(0);

    // Stock should be 100 in Y0-Y1, 0 from Y2 onwards
    expect(result.performingAssets[0]).toBe(100);
    expect(result.performingAssets[1]).toBe(100);
    expect(result.performingAssets[2]).toBe(0);
    
    // Principal repayment should happen in Y2
    expect(result.principalRepayments[2]).toBe(100);
  });
});