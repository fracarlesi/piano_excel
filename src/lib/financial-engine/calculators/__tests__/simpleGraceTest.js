import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Simple Grace Period Test', () => {
  test('Grace period should work correctly with quarters', () => {
    const product = {
      name: 'Simple Grace Test',
      type: 'french',
      durata: 8, // 8 quarters total
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      gracePeriod: 4, // 4 quarters grace period
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    
    console.log('\n=== SIMPLE GRACE PERIOD TEST ===');
    console.log('Loan disbursed in Y0Q1');
    console.log('Grace period: 4 quarters');
    console.log('Expected: Grace Y0Q1-Q4, Amortization Y1Q1-Q4');
    console.log('');
    
    const quarterlyStock = result.quarterly?.performingStock || [];
    const repayments = result.quarterly?.principalRepayments || [];
    
    console.log('Quarter | Stock    | Repayment | Expected Behavior');
    console.log('--------|----------|-----------|------------------');
    
    for (let q = 0; q < 12; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const stock = quarterlyStock[q] || 0;
      const repayment = repayments[q] || 0;
      
      let expected = '';
      if (q < 4) {
        expected = 'Grace period - no repayment';
      } else if (q < 8) {
        expected = 'Amortization period';
      } else {
        expected = 'Post-maturity';
      }
      
      console.log(`Y${year}Q${quarter}     | €${stock.toFixed(0).padStart(6)}M | €${repayment.toFixed(0).padStart(7)}M | ${expected}`);
    }
    
    // Verify grace period behavior
    console.log('\n--- VERIFICATION ---');
    console.log('Grace period (Y0):');
    for (let q = 0; q < 4; q++) {
      const repayment = repayments[q] || 0;
      console.log(`Q${q+1}: Repayment = €${repayment.toFixed(2)}M (should be 0)`);
      expect(repayment).toBe(0);
    }
    
    console.log('\nAmortization period (Y1):');
    for (let q = 4; q < 8; q++) {
      const repayment = repayments[q] || 0;
      console.log(`Q${q+1}: Repayment = €${repayment.toFixed(2)}M (should be > 0)`);
      expect(repayment).toBeGreaterThan(0);
    }
    
    // Check that stock decreases during amortization
    console.log('\nStock progression:');
    console.log(`End of grace (Y0Q4): €${quarterlyStock[3]?.toFixed(0)}M`);
    console.log(`After first repayment (Y1Q1): €${quarterlyStock[4]?.toFixed(0)}M`);
    console.log(`Final quarter (Y1Q4): €${quarterlyStock[7]?.toFixed(0)}M`);
    
    expect(quarterlyStock[3]).toBe(100); // Full amount at end of grace
    expect(quarterlyStock[4]).toBeLessThan(100); // Reduced after first repayment
    expect(quarterlyStock[7]).toBeLessThan(0.01); // Fully repaid (with small rounding tolerance)
  });
});