import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Grace Period Logic Test', () => {
  test('Grace period timing should be clear', () => {
    const product = {
      name: 'Grace Logic Test',
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
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1 of Year 1
      taxRate: 30
    };

    const years = [0, 1, 2, 3];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    
    console.log('\n=== GRACE PERIOD TIMING TEST ===');
    console.log('Loan details:');
    console.log('- Amount: 100M');
    console.log('- Disbursed: Y1Q1');
    console.log('- Total duration: 2 years');
    console.log('- Grace period: 1 year');
    console.log('');
    
    const quarterlyStock = result.quarterly?.performingStock || [];
    const vintageStartQuarter = 1 * 4 + 0; // Y1Q1 = quarter 4
    const graceEndQuarter = vintageStartQuarter + 4; // 4 quarters later = quarter 8
    
    console.log(`Vintage start quarter (Y1Q1): ${vintageStartQuarter}`);
    console.log(`Grace end quarter: ${graceEndQuarter}`);
    console.log('');
    
    console.log('Quarter-by-quarter analysis:');
    for (let q = 0; q < 16; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const stock = quarterlyStock[q] || 0;
      
      let status = '';
      if (q < vintageStartQuarter) {
        status = 'Not yet disbursed';
      } else if (q < graceEndQuarter) {
        status = 'Grace period';
      } else {
        status = 'Amortization period';
      }
      
      console.log(`Y${year}Q${quarter} (Q${q}): €${stock.toFixed(2).padStart(9)}M - ${status}`);
    }
    
    console.log('\n--- KEY TRANSITIONS ---');
    console.log(`Last quarter of grace (Q${graceEndQuarter-1}): €${quarterlyStock[graceEndQuarter-1]?.toFixed(2)}M`);
    console.log(`First quarter after grace (Q${graceEndQuarter}): €${quarterlyStock[graceEndQuarter]?.toFixed(2)}M`);
    
    // Check the repayments
    const repayments = result.quarterly?.principalRepayments || [];
    console.log('\n--- PRINCIPAL REPAYMENTS ---');
    for (let q = vintageStartQuarter; q < vintageStartQuarter + 12; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const repayment = repayments[q] || 0;
      console.log(`Y${year}Q${quarter} (Q${q}): €${repayment.toFixed(2)}M`);
    }
  });
});