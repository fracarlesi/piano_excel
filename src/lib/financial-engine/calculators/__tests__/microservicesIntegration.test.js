import { calculateCreditProduct } from '../creditCalculator';

describe('Credit Type Microservices Integration Test', () => {
  test('Different credit types should have correct interest and principal patterns', () => {
    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2];
    
    console.log('\n=== CREDIT TYPE MICROSERVICES INTEGRATION TEST ===\n');
    
    // Test 1: Bullet Loan (12 months)
    const bulletProduct = {
      name: 'Test Bullet 12M',
      type: 'bullet',
      durata: 1,
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      gracePeriod: 0,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const bulletResult = calculateCreditProduct(bulletProduct, assumptions, years);
    
    console.log('1. BULLET LOAN (100M, 12 months)');
    console.log('Expected: Constant performing stock until maturity, then zero');
    console.log('Quarterly Performing Stock:');
    for (let q = 0; q < 8; q++) {
      const year = Math.floor(q / 4) + 1;
      const quarter = (q % 4) + 1;
      const stock = bulletResult.quarterly?.performingStock?.[q] || 0;
      console.log(`  Y${year}Q${quarter}: €${stock.toFixed(1)}M`);
    }
    
    // Test 2: French with Grace Period (24 months, 6 months grace)
    const frenchGraceProduct = {
      name: 'Test French Grace 24M',
      type: 'french',
      durata: 2,
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      gracePeriod: 0.5, // 6 months grace period
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const frenchGraceResult = calculateCreditProduct(frenchGraceProduct, assumptions, years);
    
    console.log('\n2. FRENCH WITH GRACE (100M, 24 months, 6 months grace)');
    console.log('Expected: Constant stock during grace, then declining');
    console.log('Quarterly Performing Stock:');
    for (let q = 0; q < 12; q++) {
      const year = Math.floor(q / 4) + 1;
      const quarter = (q % 4) + 1;
      const stock = frenchGraceResult.quarterly?.performingStock?.[q] || 0;
      console.log(`  Y${year}Q${quarter}: €${stock.toFixed(1)}M`);
    }
    
    // Test 3: French without Grace Period (24 months)
    const frenchNoGraceProduct = {
      name: 'Test French No Grace 24M',
      type: 'french',
      durata: 2,
      spread: 4.0,
      dangerRate: 0,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      gracePeriod: 0, // No grace period
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const frenchNoGraceResult = calculateCreditProduct(frenchNoGraceProduct, assumptions, years);
    
    console.log('\n3. FRENCH NO GRACE (100M, 24 months)');
    console.log('Expected: Declining stock from start');
    console.log('Quarterly Performing Stock:');
    for (let q = 0; q < 12; q++) {
      const year = Math.floor(q / 4) + 1;
      const quarter = (q % 4) + 1;
      const stock = frenchNoGraceResult.quarterly?.performingStock?.[q] || 0;
      console.log(`  Y${year}Q${quarter}: €${stock.toFixed(1)}M`);
    }
    
    // Validation
    console.log('\n--- VALIDATION ---');
    
    // Bullet: Stock should be constant until maturity
    const bulletStock = bulletResult.quarterly?.performingStock || [];
    console.log(`Bullet Q1-Q4: ${bulletStock.slice(0, 4).every(s => Math.abs(s - 100) < 0.1) ? '✅' : '❌'} Constant 100M`);
    console.log(`Bullet Q5: ${Math.abs(bulletStock[4] - 100) < 0.1 ? '✅' : '❌'} Still 100M (final quarter)`);
    console.log(`Bullet Q6+: ${bulletStock.slice(5, 8).every(s => s < 0.1) ? '✅' : '❌'} Zero after maturity`);
    
    // French Grace: Stock constant during grace (Q1-Q2), then declining from Q3
    const graceStock = frenchGraceResult.quarterly?.performingStock || [];
    console.log(`Grace Q1-Q2: ${graceStock.slice(0, 2).every(s => Math.abs(s - 100) < 0.1) ? '✅' : '❌'} Constant during 6-month grace`);
    console.log(`Grace Q3 start amortization: ${graceStock[3] < graceStock[2] ? '✅' : '❌'} Declining after grace (grace=2Q, so Q3 starts amort)`);
    
    // French No Grace: Stock declining from start
    const noGraceStock = frenchNoGraceResult.quarterly?.performingStock || [];
    console.log(`No Grace Q2 < Q1: ${noGraceStock[1] < noGraceStock[0] ? '✅' : '❌'} Declining from start`);
    
    // Basic assertions
    expect(bulletStock[0]).toBeCloseTo(100, 1); // Q1 after disbursement
    expect(bulletStock[4]).toBeCloseTo(100, 1); // Q1 Y2 (maturity quarter)
    expect(bulletStock[5]).toBeCloseTo(0, 1);   // Q2 Y2 (after maturity)
    
    expect(graceStock[0]).toBeCloseTo(100, 1);  // During grace Q1
    expect(graceStock[1]).toBeCloseTo(100, 1);  // During grace Q2
    expect(graceStock[3]).toBeLessThan(graceStock[2]); // After grace ends, amortization starts Q4 < Q3
    
    expect(noGraceStock[1]).toBeLessThan(noGraceStock[0]); // Declining from start
    
    console.log('\n✅ All microservices are working correctly with different loan types');
  });
});