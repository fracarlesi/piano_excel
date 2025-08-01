import { updateAllVintagePrincipals } from '../amortizationCalculator';
import { createVintage } from '../vintageManager';
import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Grace Period Timing Issue Test', () => {
  test('Grace period should be 4 quarters, not 5', () => {
    console.log('\n=== GRACE PERIOD TIMING ISSUE TEST ===');
    console.log('Scenario: €100M loan, 8 quarters duration, 4 quarters grace');
    console.log('Disbursed at Y1Q1 (global Q4)');
    
    const product = {
      name: 'Test Grace Timing',
      type: 'french',
      durata: 8, // 8 quarters total
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      gracePeriod: 4, // 4 quarters grace
      volumeArray: [0, 100, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 1
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    // Create vintage manually to analyze
    const vintage = createVintage({
      year: 1,
      quarter: 0, // Q1
      volume: 100,
      product,
      assumptions
    });
    
    const startQ = vintage.startYear * 4 + vintage.startQuarter; // Q4
    
    console.log('\n--- VINTAGE DETAILS ---');
    console.log(`Start quarter: Q${startQ} (Y${vintage.startYear}Q${vintage.startQuarter + 1})`);
    console.log(`Grace period: ${vintage.gracePeriod} quarters`);
    console.log(`Duration: ${vintage.durata} quarters`);
    
    console.log('\n--- EXPECTED BEHAVIOR ---');
    console.log('Q4 (Y1Q1): Disbursement - Grace period starts');
    console.log('Q5 (Y1Q2): Grace period (1st quarter)');
    console.log('Q6 (Y1Q3): Grace period (2nd quarter)');
    console.log('Q7 (Y1Q4): Grace period (3rd quarter)');
    console.log('Q8 (Y2Q1): Grace period (4th quarter) - Last grace quarter');
    console.log('Q9 (Y2Q2): First principal repayment - Amortization starts');
    
    // Run full calculation
    const years = [0, 1, 2, 3];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    const stock = result.quarterly?.performingStock || [];
    const repayments = result.quarterly?.principalRepayments || [];
    
    console.log('\n--- ACTUAL BEHAVIOR ---');
    console.log('Quarter | Stock | Repayment | Notes');
    console.log('--------|-------|-----------|------');
    
    for (let q = 3; q <= 12; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const stockValue = stock[q] || 0;
      const repayment = repayments[q] || 0;
      let notes = '';
      
      if (q === 4) notes = 'Disbursement';
      else if (q >= 5 && q <= 8) notes = `Grace period (quarter ${q - 4})`;
      else if (q === 9) notes = 'Expected: First repayment';
      
      console.log(`Y${year}Q${quarter} (${q.toString().padStart(2)}) | €${stockValue.toFixed(0).padStart(3)}M | €${repayment.toFixed(1).padStart(5)}M | ${notes}`);
    }
    
    console.log('\n--- ANALYSIS ---');
    const q8Repayment = repayments[8] || 0;
    const q9Repayment = repayments[9] || 0;
    
    console.log(`Q8 (Y2Q1) repayment: €${q8Repayment.toFixed(2)}M`);
    console.log(`Q9 (Y2Q2) repayment: €${q9Repayment.toFixed(2)}M`);
    
    if (q8Repayment === 0 && q9Repayment > 0) {
      console.log('\n❌ ERROR: First repayment is at Q9 instead of Q8!');
      console.log('The system is adding one extra quarter to the grace period.');
    } else if (q8Repayment > 0) {
      console.log('\n✅ CORRECT: First repayment is at Q8 as expected.');
    }
    
    // Check elapsed quarters calculation
    console.log('\n--- ELAPSED QUARTERS ANALYSIS ---');
    const vintages = [vintage];
    
    for (let q = 4; q <= 10; q++) {
      const elapsed = q - startQ;
      const inGrace = elapsed < vintage.gracePeriod;
      
      console.log(`Q${q}: elapsed = ${elapsed}, gracePeriod = ${vintage.gracePeriod}, inGrace = ${inGrace}`);
    }
  });
});