import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('French Loan Quarter Test', () => {
  test('French loan should not show repayment in disbursement quarter', () => {
    const product = {
      name: 'Test French',
      type: 'french',
      durata: 4, // 4 quarters
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      gracePeriod: 0, // No grace period
      volumeArray: [0, 100, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 1
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    
    console.log('\n=== FRENCH LOAN DISBURSEMENT QUARTER TEST ===');
    console.log('French loan: 100M, 1 year maturity, no grace period, disbursed Y1Q1');
    console.log('Expected behavior:');
    console.log('- Y1Q1: 100M (full amount - no repayment in disbursement quarter)');
    console.log('- Y1Q2: 75M (first repayment happens)');
    console.log('- Y1Q3: 50M');
    console.log('- Y1Q4: 25M');
    console.log('- Y2Q1: 0M (fully repaid)');
    console.log('');
    
    const quarterlyStock = result.quarterly?.performingStock || [];
    
    // Print quarter by quarter
    console.log('Quarterly Performing Stock:');
    for (let q = 0; q < 12; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const value = quarterlyStock[q]?.toFixed(2) || '0.00';
      console.log(`Y${year}Q${quarter}: €${value}M`);
    }
    
    // Check critical quarters
    console.log('\n--- CRITICAL ANALYSIS ---');
    const q4Value = quarterlyStock[4]; // Y1Q1
    const q5Value = quarterlyStock[5]; // Y1Q2
    const q6Value = quarterlyStock[6]; // Y1Q3
    const q7Value = quarterlyStock[7]; // Y1Q4
    const q8Value = quarterlyStock[8]; // Y2Q1
    
    console.log(`Y1Q1 (disbursement): €${q4Value?.toFixed(2)}M`);
    console.log(`Y1Q2 (first repayment): €${q5Value?.toFixed(2)}M`);
    console.log(`Y1Q3: €${q6Value?.toFixed(2)}M`);
    console.log(`Y1Q4: €${q7Value?.toFixed(2)}M`);
    console.log(`Y2Q1 (maturity): €${q8Value?.toFixed(2)}M`);
    
    // Calculate implied repayment in first quarter
    const impliedFirstQuarterRepayment = 100 - q4Value;
    console.log(`\nImplied repayment in disbursement quarter: €${impliedFirstQuarterRepayment.toFixed(2)}M`);
    
    if (impliedFirstQuarterRepayment > 0) {
      console.log('❌ ERROR: Loan shows repayment in the same quarter as disbursement!');
    } else {
      console.log('✅ CORRECT: No repayment in disbursement quarter');
    }
    
    // Test expectations
    expect(q4Value).toBe(100); // Full amount in disbursement quarter
    expect(q5Value).toBeLessThan(100); // First repayment in Q2
    expect(q8Value).toBe(0); // Fully repaid by maturity
  });
  
  test('French loan with grace period should maintain full principal during grace', () => {
    const product = {
      name: 'Test French Grace',
      type: 'french',
      durata: 8, // 8 quarters
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      gracePeriod: 1, // 1 year grace period
      volumeArray: [0, 100, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 1
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    
    console.log('\n=== FRENCH LOAN WITH GRACE PERIOD TEST ===');
    console.log('French loan: 100M, 2 year maturity, 1 year grace, disbursed Y1Q1');
    
    const quarterlyStock = result.quarterly?.performingStock || [];
    
    // Print critical quarters
    console.log('\nQuarterly Performing Stock:');
    for (let q = 4; q < 13; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const value = quarterlyStock[q]?.toFixed(2) || '0.00';
      console.log(`Y${year}Q${quarter}: €${value}M`);
    }
    
    // Test grace period
    console.log('\n--- GRACE PERIOD ANALYSIS ---');
    console.log(`Y1Q1-Q4 should all be 100M (grace period)`);
    console.log(`Y2Q1 should start declining (first repayment after grace)`);
    
    expect(quarterlyStock[4]).toBe(100); // Y1Q1
    expect(quarterlyStock[5]).toBe(100); // Y1Q2
    expect(quarterlyStock[6]).toBe(100); // Y1Q3
    expect(quarterlyStock[7]).toBe(100); // Y1Q4
    expect(quarterlyStock[8]).toBeLessThan(100); // Y2Q1 - first repayment
  });
});