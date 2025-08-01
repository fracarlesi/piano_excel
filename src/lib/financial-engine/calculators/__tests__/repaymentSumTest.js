import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Repayment Sum Test', () => {
  test('Total principal repayments should equal initial loan amount', () => {
    const product = {
      name: 'Repayment Test',
      type: 'french',
      durata: 12, // 12 quarters
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      gracePeriod: 4, // 4 quarters grace
      volumeArray: [0, 100, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 1
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    
    console.log('\n=== REPAYMENT SUM TEST ===');
    console.log('Loan: €100M, 12 quarters, 4 quarters grace');
    console.log('Amortization period: 8 quarters (Q8-Q15)');
    console.log('');
    
    const repayments = result.quarterly?.principalRepayments || [];
    const stock = result.quarterly?.performingStock || [];
    
    // Calculate quarterly interest rate
    const rate = (3.5 + 4.0) / 100 / 4; // EURIBOR + spread, quarterly
    
    console.log('Quarter | Stock Before | Repayment | Interest | Total Payment');
    console.log('--------|--------------|-----------|----------|---------------');
    
    let totalRepayments = 0;
    let totalInterest = 0;
    
    for (let q = 4; q < 20; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const repayment = repayments[q] || 0;
      const stockBefore = q > 0 ? (stock[q-1] || 0) : 0;
      const interest = stockBefore * rate;
      const totalPayment = repayment + interest;
      
      totalRepayments += repayment;
      totalInterest += interest;
      
      if (repayment > 0 || (q >= 4 && q <= 16)) {
        console.log(`Y${year}Q${quarter}     | €${stockBefore.toFixed(2).padStart(10)}M | €${repayment.toFixed(2).padStart(7)}M | €${interest.toFixed(2).padStart(6)}M | €${totalPayment.toFixed(2).padStart(11)}M`);
      }
    }
    
    console.log('\n--- SUMMARY ---');
    console.log(`Total principal repayments: €${totalRepayments.toFixed(2)}M`);
    console.log(`Total interest paid: €${totalInterest.toFixed(2)}M`);
    console.log(`Initial loan amount: €100.00M`);
    
    const difference = Math.abs(totalRepayments - 100);
    if (difference < 0.01) {
      console.log('✅ Total repayments match loan amount (within rounding)');
    } else {
      console.log(`❌ ERROR: Total repayments differ by €${difference.toFixed(2)}M`);
    }
    
    // Check if loan ends too early
    console.log('\n--- MATURITY CHECK ---');
    let lastNonZeroQuarter = -1;
    for (let q = 0; q < 24; q++) {
      if (stock[q] > 0.01) {
        lastNonZeroQuarter = q;
      }
    }
    
    console.log(`Last quarter with balance > 0.01: Q${lastNonZeroQuarter} (Y${Math.floor(lastNonZeroQuarter/4)}Q${(lastNonZeroQuarter%4)+1})`);
    console.log(`Expected last quarter: Q15 (Y3Q4)`);
    
    if (lastNonZeroQuarter === 15) {
      console.log('✅ Loan ends at expected quarter');
    } else {
      console.log('❌ Loan ends at wrong quarter');
    }
    
    expect(Math.abs(totalRepayments - 100)).toBeLessThan(0.01);
    expect(lastNonZeroQuarter).toBe(15);
  });
});