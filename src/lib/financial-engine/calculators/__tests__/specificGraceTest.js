import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Specific Grace Period Issue Test', () => {
  test('3-year French with 4Q grace should end at Y3Q1 not Y2Q4', () => {
    const product = {
      name: 'Test 3Y with Grace',
      type: 'french',
      durata: 12, // 3 years = 12 quarters
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      gracePeriod: 4, // 1 year grace period
      volumeArray: [0, 100, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 1
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    
    console.log('\n=== SPECIFIC GRACE PERIOD ISSUE TEST ===');
    console.log('3-year loan (12 quarters) with 4 quarters grace');
    console.log('Disbursed in Y1Q1');
    console.log('Expected maturity: Y4Q1 (Q13 from start)');
    console.log('');
    
    const quarterlyStock = result.quarterly?.performingStock || [];
    
    // Print detailed quarter analysis
    console.log('Quarter | Stock    | Expected Behavior');
    console.log('--------|----------|-------------------');
    
    // Focus on critical quarters
    const criticalQuarters = [
      { q: 3, desc: 'Y0Q4 - Before disbursement' },
      { q: 4, desc: 'Y1Q1 - Disbursement' },
      { q: 5, desc: 'Y1Q2 - Grace period' },
      { q: 6, desc: 'Y1Q3 - Grace period' },
      { q: 7, desc: 'Y1Q4 - Grace period' },
      { q: 8, desc: 'Y2Q1 - First repayment' },
      { q: 12, desc: 'Y3Q1 - 12 quarters after disbursement' },
      { q: 13, desc: 'Y3Q2 - 13 quarters after disbursement' },
      { q: 14, desc: 'Y3Q3 - 14 quarters after disbursement' },
      { q: 15, desc: 'Y3Q4 - 15 quarters after disbursement' },
      { q: 16, desc: 'Y4Q1 - Expected maturity' },
      { q: 17, desc: 'Y4Q2 - Should be 0' }
    ];
    
    criticalQuarters.forEach(({ q, desc }) => {
      const stock = quarterlyStock[q] || 0;
      console.log(`Q${q.toString().padStart(2)} | €${stock.toFixed(0).padStart(6)}M | ${desc}`);
    });
    
    // Find actual maturity
    let actualMaturityQuarter = -1;
    for (let q = 0; q < 20; q++) {
      if (quarterlyStock[q] > 0 && (quarterlyStock[q + 1] || 0) === 0) {
        actualMaturityQuarter = q;
        break;
      }
    }
    
    console.log('\n--- ANALYSIS ---');
    console.log(`Disbursement quarter: Q4 (Y1Q1)`);
    console.log(`Expected maturity: Q16 (Y4Q1) - 12 quarters after disbursement`);
    console.log(`Actual maturity: Q${actualMaturityQuarter} (Y${Math.floor(actualMaturityQuarter/4)}Q${(actualMaturityQuarter%4)+1})`);
    
    if (actualMaturityQuarter === 15) {
      console.log('\n❌ ERROR: Loan is maturing at Y3Q4 instead of Y4Q1!');
      console.log('The loan is ending one quarter early.');
    } else if (actualMaturityQuarter === 16) {
      console.log('\n✅ CORRECT: Loan matures at Y4Q1 as expected.');
    }
    
    // Check grace period behavior
    console.log('\n--- GRACE PERIOD CHECK ---');
    console.log(`Y1Q1-Q4 should all be 100M (grace period)`);
    console.log(`Y1Q1 (Q4): €${quarterlyStock[4]?.toFixed(0)}M`);
    console.log(`Y1Q2 (Q5): €${quarterlyStock[5]?.toFixed(0)}M`);
    console.log(`Y1Q3 (Q6): €${quarterlyStock[6]?.toFixed(0)}M`);
    console.log(`Y1Q4 (Q7): €${quarterlyStock[7]?.toFixed(0)}M`);
    console.log(`Y2Q1 (Q8): €${quarterlyStock[8]?.toFixed(0)}M - Should be < 100M (first repayment)`);
    
    // Test expectations
    expect(quarterlyStock[4]).toBe(100); // Disbursement
    expect(quarterlyStock[7]).toBe(100); // Still in grace
    expect(quarterlyStock[8]).toBeLessThan(100); // First repayment
    expect(actualMaturityQuarter).toBe(16); // Should mature at Y4Q1
  });
});