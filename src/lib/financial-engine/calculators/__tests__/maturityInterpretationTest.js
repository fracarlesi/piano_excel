import { createVintage } from '../vintageManager';

describe('Maturity Interpretation Test', () => {
  test('Test different maturity interpretations', () => {
    console.log('\n=== MATURITY INTERPRETATION TEST ===');
    
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
    
    // Create vintage at Y1Q1 (Q4)
    const vintage = createVintage({
      year: 1,
      quarter: 0, // Q1 = global Q4
      volume: 100,
      product,
      assumptions
    });
    
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    console.log('\n--- CURRENT IMPLEMENTATION ---');
    console.log(`Disbursement: Y${vintage.startYear}Q${vintage.startQuarter + 1} (global Q${startQ})`);
    console.log(`Duration: ${vintage.durata} quarters`);
    console.log(`Maturity: Y${vintage.maturityYear}Q${vintage.maturityQuarter + 1} (global Q${maturityQ})`);
    console.log(`Quarters from start to maturity: ${maturityQ - startQ}`);
    console.log(`Interpretation: Duration INCLUDES disbursement quarter`);
    
    console.log('\n--- USER EXPECTATION ---');
    const expectedMaturityQ = startQ + vintage.durata;
    const expectedMaturityYear = Math.floor(expectedMaturityQ / 4);
    const expectedMaturityQuarter = expectedMaturityQ % 4;
    console.log(`Expected maturity: Y${expectedMaturityYear}Q${expectedMaturityQuarter + 1} (global Q${expectedMaturityQ})`);
    console.log(`Interpretation: Duration EXCLUDES disbursement quarter`);
    
    console.log('\n--- TIMELINE COMPARISON ---');
    console.log('Quarter | Current | Expected');
    console.log('--------|---------|----------');
    
    for (let q = startQ; q <= expectedMaturityQ; q++) {
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      let current = '';
      let expected = '';
      
      if (q === startQ) {
        current = 'Disbursement';
        expected = 'Disbursement';
      } else if (q < startQ + vintage.gracePeriod) {
        current = 'Grace';
        expected = 'Grace';
      } else if (q < maturityQ) {
        current = 'Amortization';
        expected = 'Amortization';
      } else if (q === maturityQ) {
        current = 'MATURITY';
        expected = q < expectedMaturityQ ? 'Amortization' : 'MATURITY';
      } else if (q === expectedMaturityQ) {
        current = 'Post-maturity';
        expected = 'MATURITY';
      }
      
      console.log(`Y${year}Q${quarter} (${q.toString().padStart(2)}) | ${current.padEnd(13)} | ${expected}`);
    }
    
    console.log('\n--- ANALYSIS ---');
    console.log(`Current implementation: Loan runs Q${startQ} to Q${maturityQ - 1} (${maturityQ - startQ} quarters)`);
    console.log(`User expectation: Loan runs Q${startQ} to Q${expectedMaturityQ - 1} (${expectedMaturityQ - startQ} quarters)`);
    console.log(`Difference: ${expectedMaturityQ - maturityQ} quarter(s)`);
    
    // Test with different durations
    console.log('\n--- DURATION EXAMPLES ---');
    console.log('Duration | Current Maturity | Expected Maturity');
    console.log('---------|------------------|------------------');
    
    [4, 8, 12, 20, 40].forEach(dur => {
      const testProduct = { ...product, durata: dur };
      const testVintage = createVintage({
        year: 1,
        quarter: 0,
        volume: 100,
        product: testProduct,
        assumptions
      });
      
      const testMaturityQ = testVintage.maturityYear * 4 + testVintage.maturityQuarter;
      const testExpectedQ = startQ + dur;
      
      console.log(`${dur.toString().padStart(8)} | Q${testMaturityQ.toString().padStart(2)} (Y${testVintage.maturityYear}Q${testVintage.maturityQuarter + 1})      | Q${testExpectedQ.toString().padStart(2)} (Y${Math.floor(testExpectedQ/4)}Q${(testExpectedQ%4)+1})`);
    });
  });
});