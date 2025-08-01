import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Duplicate Repayment Test', () => {
  test('Check if principal is being repaid twice', () => {
    console.log('\n=== DUPLICATE REPAYMENT TEST ===');
    
    const product = {
      name: 'Duplicate Test',
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
    
    console.log('Loan: €100M, 12 quarters, 4 quarters grace');
    console.log('Expected: 8 quarterly payments after grace period');
    console.log('');
    
    const repayments = result.quarterly?.principalRepayments || [];
    const stock = result.quarterly?.performingStock || [];
    
    console.log('Quarter | Stock Before | Repayment | Stock After | Delta');
    console.log('--------|--------------|-----------|-------------|-------');
    
    let totalRepayments = 0;
    let repaymentCount = 0;
    
    for (let q = 0; q < 20; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const repayment = repayments[q] || 0;
      const stockBefore = q > 0 ? (stock[q-1] || 0) : 0;
      const stockAfter = stock[q] || 0;
      const delta = stockBefore - stockAfter;
      
      if (repayment > 0 || (q >= 4 && q <= 16)) {
        console.log(`Y${year}Q${quarter}     | €${stockBefore.toFixed(2).padStart(10)}M | €${repayment.toFixed(2).padStart(7)}M | €${stockAfter.toFixed(2).padStart(9)}M | €${delta.toFixed(2).padStart(5)}M`);
        
        if (repayment > 0) {
          totalRepayments += repayment;
          repaymentCount++;
        }
      }
    }
    
    console.log('\n--- ANALYSIS ---');
    console.log(`Total principal repayments: €${totalRepayments.toFixed(2)}M`);
    console.log(`Number of repayment quarters: ${repaymentCount}`);
    console.log(`Expected: €100.00M over 8 quarters`);
    
    // Check for mismatch between repayment array and stock changes
    console.log('\n--- QUARTERLY DETAIL ---');
    console.log('Checking if repayment array matches stock changes...');
    
    let mismatchFound = false;
    for (let q = 4; q < 16; q++) {
      const repayment = repayments[q] || 0;
      const stockBefore = q > 0 ? (stock[q-1] || 0) : 0;
      const stockAfter = stock[q] || 0;
      const actualChange = stockBefore - stockAfter;
      
      if (Math.abs(repayment - actualChange) > 0.01 && stockBefore > 0) {
        console.log(`Q${q}: Repayment says €${repayment.toFixed(2)}M but stock changed by €${actualChange.toFixed(2)}M`);
        mismatchFound = true;
      }
    }
    
    if (!mismatchFound) {
      console.log('✅ Repayment array matches stock changes');
    } else {
      console.log('❌ Mismatch between repayment array and stock changes!');
    }
    
    // Final check
    if (Math.abs(totalRepayments - 100) < 0.01) {
      console.log('\n✅ Total repayments match loan amount');
    } else {
      console.log(`\n❌ ERROR: Total repayments of €${totalRepayments.toFixed(2)}M != €100.00M`);
    }
  });
});