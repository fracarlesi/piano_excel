import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('French Amortization Pattern Test', () => {
  test('French loan should show correct non-linear amortization pattern', () => {
    const product = {
      name: 'Test French Pattern',
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
    
    console.log('\n=== FRENCH AMORTIZATION PATTERN TEST ===');
    console.log('French loan: 100M, 2 year maturity, 7.5% annual rate (euribor + spread)');
    console.log('Quarterly rate: 1.875%');
    console.log('');
    
    const quarterlyStock = result.quarterly?.performingStock || [];
    const quarterlyRepayments = result.quarterly?.principalRepayments || [];
    
    // Calculate the theoretical French constant payment
    const P = 100; // Principal
    const r = 0.01875; // Quarterly rate (7.5% / 4)
    const n = 8; // Number of quarters
    const constantPayment = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    
    console.log(`Theoretical constant quarterly payment: €${constantPayment.toFixed(2)}M`);
    console.log('');
    
    // Print quarter by quarter analysis
    console.log('Quarter | Outstanding | Repayment | Interest | Principal | Remaining');
    console.log('--------|-------------|-----------|----------|-----------|----------');
    
    let previousStock = 100;
    for (let q = 4; q < 13; q++) { // Y1Q1 to Y3Q1
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const currentStock = quarterlyStock[q] || 0;
      const repayment = quarterlyRepayments[q] || 0;
      const interest = previousStock * r;
      const principal = repayment;
      
      console.log(`Y${year}Q${quarter}     | €${previousStock.toFixed(2).padStart(9)}M | €${repayment.toFixed(2).padStart(7)}M | €${interest.toFixed(2).padStart(6)}M | €${principal.toFixed(2).padStart(7)}M | €${currentStock.toFixed(2).padStart(7)}M`);
      
      previousStock = currentStock;
    }
    
    console.log('\n--- PATTERN ANALYSIS ---');
    
    // Check that principal repayments increase over time
    const repayments = [];
    for (let q = 5; q < 12; q++) { // Skip disbursement quarter
      repayments.push(quarterlyRepayments[q] || 0);
    }
    
    console.log('Principal repayments by quarter:');
    repayments.forEach((rep, idx) => {
      console.log(`Q${idx + 2}: €${rep.toFixed(2)}M`);
    });
    
    // Verify increasing pattern
    let isIncreasing = true;
    for (let i = 1; i < repayments.length; i++) {
      if (repayments[i] <= repayments[i-1]) {
        isIncreasing = false;
        break;
      }
    }
    
    console.log(`\nPrincipal repayments increasing? ${isIncreasing ? '✅ YES' : '❌ NO'}`);
    
    // Check the actual differences
    console.log('\nDifferences between quarters:');
    const stocks = [];
    for (let q = 4; q < 12; q++) {
      stocks.push(quarterlyStock[q] || 0);
    }
    
    for (let i = 1; i < stocks.length; i++) {
      const diff = stocks[i-1] - stocks[i];
      console.log(`Q${i} to Q${i+1}: €${diff.toFixed(2)}M`);
    }
    
    // The differences should NOT be constant (as they currently are)
    const firstDiff = stocks[0] - stocks[1];
    let allDiffsEqual = true;
    for (let i = 2; i < stocks.length; i++) {
      const diff = stocks[i-1] - stocks[i];
      if (Math.abs(diff - firstDiff) > 0.01) {
        allDiffsEqual = false;
        break;
      }
    }
    
    console.log(`\nAll differences equal? ${allDiffsEqual ? '❌ YES (WRONG!)' : '✅ NO (CORRECT!)'}`);
    
    if (allDiffsEqual) {
      console.log('ERROR: French amortization is showing linear pattern instead of proper French amortization!');
    }
  });
});