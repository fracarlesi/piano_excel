import { calculateCreditProduct } from '../creditCalculator';

describe('Bullet Loan Interest Timing Test', () => {
  test('100M bullet loan with 12-month maturity should have correct interest timing', () => {
    const product = {
      name: 'Test Bullet 12M',
      type: 'bullet',
      durata: 1, // 1 year = 12 months
      spread: 4.0,
      dangerRate: 0, // No defaults for clean test
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 1
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2]; // Years 0, 1, 2
    const result = calculateCreditProduct(product, assumptions, years);
    
    console.log('\n=== BULLET LOAN INTEREST TIMING TEST ===');
    console.log('Product: 100M Bullet, 12 months, disbursed Q1 Year 1');
    console.log('Expected: Interest generated Q2, Q3, Q4 of Year 1, Q1 of Year 2');
    console.log('Expected: NO interest from Q2 Year 2 onwards\n');
    
    // Get quarterly data
    const quarterlyInterest = result.quarterly?.interestIncome || [];
    const quarterlyStock = result.quarterly?.performingStock || [];
    
    console.log('Quarterly Interest Income:');
    for (let q = 0; q < Math.min(12, quarterlyInterest.length); q++) {
      const year = Math.floor(q / 4) + 1;
      const quarter = (q % 4) + 1;
      console.log(`Y${year}Q${quarter}: €${quarterlyInterest[q].toFixed(2)}M (Stock: €${quarterlyStock[q].toFixed(2)}M)`);
    }
    
    // Expected behavior:
    // Q1 Y1: €0M interest (disbursement quarter)
    // Q2 Y1: €1.875M interest (100M * 7.5% / 4)
    // Q3 Y1: €1.875M interest  
    // Q4 Y1: €1.875M interest
    // Q1 Y2: €1.875M interest (final quarter before maturity)
    // Q2 Y2: €0M interest (loan has matured)
    
    console.log('\n--- VALIDATION ---');
    console.log(`Q1 Y1 (disbursement): €${quarterlyInterest[0]?.toFixed(2) || 0}M - Should be €0M`);
    console.log(`Q2 Y1: €${quarterlyInterest[1]?.toFixed(2) || 0}M - Should be ~€1.88M`);
    console.log(`Q3 Y1: €${quarterlyInterest[2]?.toFixed(2) || 0}M - Should be ~€1.88M`);
    console.log(`Q4 Y1: €${quarterlyInterest[3]?.toFixed(2) || 0}M - Should be ~€1.88M`);
    console.log(`Q1 Y2: €${quarterlyInterest[4]?.toFixed(2) || 0}M - Should be ~€1.88M`);
    console.log(`Q2 Y2: €${quarterlyInterest[5]?.toFixed(2) || 0}M - Should be €0M (matured)`);
    
    // Total interest should be ~€7.5M (100M * 7.5%)
    const totalInterestYear1 = quarterlyInterest.slice(0, 4).reduce((sum, val) => sum + val, 0);
    const totalInterestYear2Q1 = quarterlyInterest[4] || 0;
    const totalInterestYear2FromQ2 = quarterlyInterest.slice(5, 8).reduce((sum, val) => sum + val, 0);
    
    console.log(`\nTotal Interest Year 1: €${totalInterestYear1.toFixed(2)}M`);
    console.log(`Interest Y2Q1: €${totalInterestYear2Q1.toFixed(2)}M`);
    console.log(`Interest Y2Q2-Q4: €${totalInterestYear2FromQ2.toFixed(2)}M - Should be €0M`);
    console.log(`Total Interest (12 months): €${(totalInterestYear1 + totalInterestYear2Q1).toFixed(2)}M - Should be ~€7.5M`);
    
    // Test assertions
    expect(quarterlyInterest[0]).toBeCloseTo(0, 2); // No interest in disbursement quarter
    expect(quarterlyInterest[1]).toBeCloseTo(1.875, 2); // Q2 Y1
    expect(quarterlyInterest[2]).toBeCloseTo(1.875, 2); // Q3 Y1  
    expect(quarterlyInterest[3]).toBeCloseTo(1.875, 2); // Q4 Y1
    expect(quarterlyInterest[4]).toBeCloseTo(1.875, 2); // Q1 Y2 (final quarter)
    expect(quarterlyInterest[5]).toBeCloseTo(0, 2); // Q2 Y2 (should be zero - matured)
    
    console.log('\n✅ TEST PASSED: Interest timing is correct for 12-month bullet loan');
  });
});