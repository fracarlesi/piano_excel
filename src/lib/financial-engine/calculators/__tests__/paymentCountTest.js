import { updateAllVintagePrincipals } from '../amortizationCalculator';
import { createVintage } from '../vintageManager';

describe('Payment Count Test', () => {
  test('Count payments for French loan with grace', () => {
    console.log('\n=== PAYMENT COUNT TEST ===');
    
    const product = {
      type: 'french',
      durata: 12, // 12 quarters
      gracePeriod: 4, // 4 quarters grace
      spread: 4.0,
      isFixedRate: false
    };
    
    const assumptions = {
      euribor: 3.5
    };
    
    const vintage = createVintage({
      year: 1,
      quarter: 0, // Q1
      volume: 100,
      product,
      assumptions
    });
    
    const vintages = [vintage];
    const startQ = vintage.startYear * 4 + vintage.startQuarter; // Q4
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter; // Q16
    
    console.log(`\nLoan parameters:`);
    console.log(`- Start: Q${startQ} (Y${vintage.startYear}Q${vintage.startQuarter + 1})`);
    console.log(`- Maturity: Q${maturityQ} (Y${vintage.maturityYear}Q${vintage.maturityQuarter + 1})`);
    console.log(`- Duration: ${vintage.durata} quarters`);
    console.log(`- Grace: ${vintage.gracePeriod} quarters`);
    console.log(`- Expected amortization: ${vintage.durata - vintage.gracePeriod} quarters`);
    
    console.log('\n--- PAYMENT ANALYSIS ---');
    console.log('Quarter | Elapsed | Will Pay? | Reason');
    console.log('--------|---------|-----------|-------');
    
    let paymentCount = 0;
    const payments = [];
    
    for (let q = startQ - 1; q <= maturityQ + 1; q++) {
      const elapsed = q - startQ;
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      
      // Check conditions
      const afterStart = q > startQ;
      const beforeMaturityBullet = q < maturityQ;
      const beforeMaturityFrench = q <= maturityQ;
      const isBeforeMaturity = vintage.type === 'bullet' ? beforeMaturityBullet : beforeMaturityFrench;
      const willProcess = afterStart && isBeforeMaturity;
      
      const inGrace = elapsed < vintage.gracePeriod;
      const willPay = willProcess && elapsed >= vintage.gracePeriod;
      
      let reason = '';
      if (q <= startQ) reason = 'Before/at start';
      else if (q > maturityQ) reason = 'After maturity';
      else if (inGrace) reason = 'In grace period';
      else if (willPay) {
        reason = 'PAYMENT';
        paymentCount++;
        payments.push(q);
      }
      
      console.log(`Y${year}Q${quarter} (${q.toString().padStart(2)}) | ${elapsed.toString().padStart(7)} | ${willPay ? 'YES      ' : 'NO       '} | ${reason}`);
    }
    
    console.log('\n--- SUMMARY ---');
    console.log(`Total payments: ${paymentCount}`);
    console.log(`Expected payments: ${vintage.durata - vintage.gracePeriod}`);
    console.log(`Payment quarters: ${payments.map(q => `Q${q}`).join(', ')}`);
    
    if (paymentCount === vintage.durata - vintage.gracePeriod) {
      console.log('\n✅ Payment count is correct');
    } else {
      console.log(`\n❌ ERROR: ${paymentCount} payments instead of ${vintage.durata - vintage.gracePeriod}`);
    }
    
    // Detailed condition analysis
    console.log('\n--- CONDITION BREAKDOWN ---');
    console.log(`Start condition: currentQuarter > ${startQ}`);
    console.log(`Maturity condition: currentQuarter <= ${maturityQ} (for French)`);
    console.log(`Grace condition: elapsed >= ${vintage.gracePeriod}`);
    
    console.log('\nAt Q15 (Y3Q4):');
    console.log(`- currentQuarter (15) > startQuarter (${startQ}): ${15 > startQ}`);
    console.log(`- currentQuarter (15) <= maturityQuarter (${maturityQ}): ${15 <= maturityQ}`);
    console.log(`- elapsed (${15 - startQ}) >= gracePeriod (${vintage.gracePeriod}): ${15 - startQ >= vintage.gracePeriod}`);
    
    console.log('\nAt Q16 (Y4Q1):');
    console.log(`- currentQuarter (16) > startQuarter (${startQ}): ${16 > startQ}`);
    console.log(`- currentQuarter (16) <= maturityQuarter (${maturityQ}): ${16 <= maturityQ}`);
    console.log(`- elapsed (${16 - startQ}) >= gracePeriod (${vintage.gracePeriod}): ${16 - startQ >= vintage.gracePeriod}`);
  });
});