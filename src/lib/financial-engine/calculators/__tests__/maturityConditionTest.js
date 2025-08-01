import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';
import { createVintage } from '../vintageManager';

describe('Maturity Condition Test', () => {
  test('Test maturity timing for French loan with grace', () => {
    console.log('\n=== MATURITY CONDITION TEST ===');
    
    const product = {
      name: 'Test',
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

    // Create vintage manually to check maturity calculation
    const vintage = createVintage({
      year: 1,
      quarter: 0, // Q1
      volume: 100,
      product,
      assumptions
    });
    
    console.log('\n--- VINTAGE DETAILS ---');
    console.log(`Start: Y${vintage.startYear}Q${vintage.startQuarter + 1} (global Q${vintage.startYear * 4 + vintage.startQuarter})`);
    console.log(`Duration: ${vintage.durata} quarters`);
    console.log(`Grace: ${vintage.gracePeriod} quarters`);
    console.log(`Maturity: Y${vintage.maturityYear}Q${vintage.maturityQuarter + 1} (global Q${vintage.maturityYear * 4 + vintage.maturityQuarter})`);
    console.log(`Quarterly payment: €${vintage.quarterlyPayment?.toFixed(4)}M`);
    
    // Calculate expected values
    const startQ = vintage.startYear * 4 + vintage.startQuarter; // Q4
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter; // Q16
    const graceEndQ = startQ + vintage.gracePeriod; // Q8
    const amortizationQuarters = maturityQ - graceEndQ; // 8 quarters
    
    console.log('\n--- CALCULATED VALUES ---');
    console.log(`Start quarter: Q${startQ}`);
    console.log(`Grace ends at: Q${graceEndQ}`);
    console.log(`Maturity quarter: Q${maturityQ}`);
    console.log(`Amortization quarters: ${amortizationQuarters}`);
    
    // Now run the full calculation
    const years = [0, 1, 2, 3, 4, 5];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    const stock = result.quarterly?.performingStock || [];
    const repayments = result.quarterly?.principalRepayments || [];
    
    console.log('\n--- QUARTER BY QUARTER ---');
    console.log('Quarter | Stock | Repayment | Notes');
    console.log('--------|-------|-----------|------');
    
    for (let q = 0; q < 20; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const stockValue = stock[q] || 0;
      const repayment = repayments[q] || 0;
      let notes = '';
      
      if (q === startQ) notes = 'Disbursement';
      else if (q > startQ && q < graceEndQ) notes = 'Grace period';
      else if (q === graceEndQ) notes = 'First repayment';
      else if (q === maturityQ - 1) notes = 'Last repayment (expected)';
      else if (q === maturityQ) notes = 'Should be 0';
      
      if (q >= startQ - 1 && q <= maturityQ + 1) {
        console.log(`Y${year}Q${quarter} (${q.toString().padStart(2)}) | €${stockValue.toFixed(0).padStart(3)}M | €${repayment.toFixed(1).padStart(5)}M | ${notes}`);
      }
    }
    
    // Find where stock actually goes to 0
    let actualMaturityQ = -1;
    for (let q = 0; q < stock.length; q++) {
      if (stock[q] > 0.1 && (stock[q + 1] || 0) < 0.1) {
        actualMaturityQ = q;
        break;
      }
    }
    
    console.log('\n--- ANALYSIS ---');
    console.log(`Expected last quarter with balance: Q${maturityQ - 1} (before maturity)`);
    console.log(`Expected first quarter with 0 balance: Q${maturityQ}`);
    console.log(`Actual last quarter with balance: Q${actualMaturityQ}`);
    console.log(`Actual first quarter with 0 balance: Q${actualMaturityQ + 1}`);
    
    if (actualMaturityQ === maturityQ - 1) {
      console.log('\n✅ CORRECT: Loan matures at expected quarter');
    } else {
      console.log(`\n❌ ERROR: Loan matures ${maturityQ - 1 - actualMaturityQ} quarter(s) ${actualMaturityQ < maturityQ - 1 ? 'early' : 'late'}`);
    }
    
    // Check total repayments
    const totalRepayments = repayments.reduce((sum, r) => sum + r, 0);
    console.log(`\nTotal repayments: €${totalRepayments.toFixed(2)}M`);
    
    expect(actualMaturityQ).toBe(maturityQ - 1);
    expect(Math.abs(totalRepayments - 100)).toBeLessThan(0.01);
  });
});