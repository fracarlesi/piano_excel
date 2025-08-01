import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('French Grace Period Amortization Test', () => {
  test('French with grace should show correct amortization after grace ends', () => {
    const product = {
      name: 'Test French Grace',
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
    
    console.log('\n=== FRENCH WITH GRACE PERIOD AMORTIZATION TEST ===');
    console.log('Loan: 100M, 2 year total, 4 quarters grace period');
    console.log('During grace: interest only payments');
    console.log('After grace: French amortization over remaining 4 quarters');
    console.log('');
    
    const quarterlyStock = result.quarterly?.performingStock || [];
    const quarterlyRepayments = result.quarterly?.principalRepayments || [];
    
    // Print quarter by quarter
    console.log('Quarter | Outstanding | Principal Repayment | Notes');
    console.log('--------|-------------|---------------------|-------');
    
    for (let q = 4; q < 13; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const stock = quarterlyStock[q] || 0;
      const repayment = quarterlyRepayments[q] || 0;
      const notes = q < 8 ? 'Grace Period' : 'Amortization';
      
      console.log(`Y${year}Q${quarter}     | €${stock.toFixed(2).padStart(9)}M | €${repayment.toFixed(2).padStart(17)}M | ${notes}`);
    }
    
    // Analyze grace period
    console.log('\n--- GRACE PERIOD ANALYSIS ---');
    console.log('During grace period (Y1Q1-Q4):');
    for (let q = 4; q < 8; q++) {
      const repayment = quarterlyRepayments[q] || 0;
      console.log(`Q${q-3}: Principal repayment = €${repayment.toFixed(2)}M (should be 0)`);
    }
    
    // Analyze amortization period
    console.log('\n--- AMORTIZATION PERIOD ANALYSIS ---');
    console.log('After grace period (Y2Q1-Q4):');
    const amortizationRepayments = [];
    for (let q = 8; q < 12; q++) {
      const repayment = quarterlyRepayments[q] || 0;
      amortizationRepayments.push(repayment);
      console.log(`Q${q-3}: Principal repayment = €${repayment.toFixed(2)}M`);
    }
    
    // Check if repayments increase (French pattern)
    console.log('\n--- FRENCH PATTERN VERIFICATION ---');
    let isIncreasing = true;
    for (let i = 1; i < amortizationRepayments.length; i++) {
      const diff = amortizationRepayments[i] - amortizationRepayments[i-1];
      console.log(`Increase from Q${i+5} to Q${i+6}: €${diff.toFixed(2)}M`);
      if (diff <= 0) {
        isIncreasing = false;
      }
    }
    
    console.log(`\nPrincipal repayments increasing during amortization? ${isIncreasing ? '✅ YES' : '❌ NO'}`);
    
    // Compare with standard French over 4 quarters
    console.log('\n--- COMPARISON WITH STANDARD FRENCH ---');
    console.log('This should behave like a standard French loan over 4 quarters');
    console.log('after the grace period ends.');
    
    // Calculate what a standard 4-quarter French would look like
    const P = 100;
    const r = 0.01875; // Quarterly rate
    const n = 4; // Amortization quarters
    const payment = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    
    console.log(`\nTheoretical quarterly payment for 4-quarter French: €${payment.toFixed(2)}M`);
    console.log('First quarter principal = Payment - Interest on 100M');
    console.log(`= €${payment.toFixed(2)} - €${(100 * r).toFixed(2)} = €${(payment - 100 * r).toFixed(2)}M`);
    
    const actualFirstRepayment = amortizationRepayments[0];
    console.log(`\nActual first quarter principal repayment: €${actualFirstRepayment.toFixed(2)}M`);
    
    // Test expectations
    expect(quarterlyStock[4]).toBe(100); // Y1Q1 - grace period
    expect(quarterlyStock[5]).toBe(100); // Y1Q2 - grace period
    expect(quarterlyStock[6]).toBe(100); // Y1Q3 - grace period
    expect(quarterlyStock[7]).toBe(100); // Y1Q4 - grace period
    expect(quarterlyStock[8]).toBe(100); // Y2Q1 - still grace period (last quarter)
    expect(quarterlyStock[9]).toBeLessThan(100); // Y2Q2 - first repayment
    expect(quarterlyStock[12]).toBe(0); // Y3Q1 - fully repaid
    
    // Verify increasing pattern
    expect(isIncreasing).toBe(true);
  });
});