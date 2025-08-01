import { createVintages } from '../vintageManager';
import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Debug Maturity Test', () => {
  test('Debug grace period maturity calculation', () => {
    const product = {
      name: 'Debug Test',
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

    console.log('\n=== DEBUG MATURITY TEST ===');
    
    // Create vintages to see the details
    const volumes10Y = [0, 100, 0, 0, 0, 0, 0, 0, 0, 0];
    const vintages = createVintages(product, assumptions, volumes10Y);
    
    console.log('\nVintage details:');
    vintages.forEach(v => {
      console.log(`Vintage Y${v.startYear}Q${v.startQuarter + 1}:`);
      console.log(`  - Amount: €${v.initialAmount}M`);
      console.log(`  - Start Quarter (global): ${v.startYear * 4 + v.startQuarter}`);
      console.log(`  - Maturity: Y${v.maturityYear}Q${v.maturityQuarter + 1}`);
      console.log(`  - Maturity Quarter (global): ${v.maturityYear * 4 + v.maturityQuarter}`);
      console.log(`  - Duration: ${v.durata} quarters`);
      console.log(`  - Grace Period: ${v.gracePeriod} quarters`);
      console.log(`  - Quarterly Payment: €${v.quarterlyPayment?.toFixed(2)}M`);
    });
    
    // Now run the full calculation
    const years = [0, 1, 2, 3, 4, 5];
    const result = calculateCreditProductQuarterly(product, assumptions, years);
    const stock = result.quarterly?.performingStock || [];
    
    console.log('\nQuarterly stock around maturity:');
    for (let q = 12; q < 20; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      console.log(`Q${q} (Y${year}Q${quarter}): €${stock[q]?.toFixed(2) || '0.00'}M`);
    }
    
    // Check if it's an off-by-one error in the calculation
    console.log('\n--- HYPOTHESIS ---');
    console.log('If loan starts at Q4 (Y1Q1) with 12Q duration:');
    console.log('- Start: Q4');
    console.log('- Maturity: Q4 + 12 = Q16');
    console.log('- Last quarter with balance should be Q15 (0-indexed)');
    console.log('- First quarter with 0 balance should be Q16');
    
    // But the condition is < maturityQuarter, so:
    console.log('\nWith condition "currentQuarter < maturityQuarter":');
    console.log('- Q15 < Q16: true (included)');
    console.log('- Q16 < Q16: false (excluded)');
    console.log('This seems correct!');
    
    // Let's check the actual maturity quarter from the vintage
    const vintage = vintages[0];
    const actualMaturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    console.log(`\nActual maturity quarter from vintage: ${actualMaturityQ}`);
    
    if (actualMaturityQ === 16) {
      console.log('✅ Maturity is correctly set to Q16');
    } else {
      console.log(`❌ ERROR: Maturity is set to Q${actualMaturityQ} instead of Q16`);
    }
  });
});