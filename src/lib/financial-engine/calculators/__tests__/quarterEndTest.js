import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Quarter End Values Test', () => {
  test('Bullet loan should show correct quarter-end values', () => {
    const product = {
      name: 'Test Bullet',
      type: 'bullet',
      durata: 4, // 4 quarters
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
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
    
    console.log('\n=== QUARTER END VALUES TEST ===');
    console.log('Bullet loan: 100M, 1 year maturity, disbursed Y1Q1');
    console.log('Expected behavior:');
    console.log('- Y0Q1-Q4: 0 (not yet disbursed)');
    console.log('- Y1Q1: 100M (disbursed at beginning, shown at end)');
    console.log('- Y1Q2-Q4: 100M (still outstanding)');
    console.log('- Y2Q1: 0 (matured and repaid at beginning of quarter)');
    console.log('');
    
    const quarterlyStock = result.quarterly?.performingStock || [];
    
    // Print quarter by quarter
    for (let q = 0; q < 12; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const value = quarterlyStock[q]?.toFixed(2) || '0.00';
      const expected = q < 4 ? '0' : (q >= 4 && q < 8 ? '100' : '0');
      const status = value === expected + '.00' ? '✅' : '❌';
      console.log(`Y${year}Q${quarter}: €${value}M ${status} (expected €${expected}M)`);
    }
    
    // Detail on the critical quarters
    console.log('\n--- CRITICAL QUARTERS ---');
    console.log(`Y0Q4 (Q3): €${quarterlyStock[3]?.toFixed(2) || '0.00'}M - Last quarter before disbursement`);
    console.log(`Y1Q1 (Q4): €${quarterlyStock[4]?.toFixed(2) || '0.00'}M - Disbursement quarter`);
    console.log(`Y1Q4 (Q7): €${quarterlyStock[7]?.toFixed(2) || '0.00'}M - Last quarter before maturity`);
    console.log(`Y2Q1 (Q8): €${quarterlyStock[8]?.toFixed(2) || '0.00'}M - Maturity quarter`);
    
    // Test the specific expectation from the user
    expect(quarterlyStock[3]).toBe(0); // Y0Q4: not yet disbursed
    expect(quarterlyStock[4]).toBe(100); // Y1Q1: disbursed
    expect(quarterlyStock[7]).toBe(100); // Y1Q4: still outstanding
    expect(quarterlyStock[8]).toBe(0); // Y2Q1: matured and repaid
  });
});