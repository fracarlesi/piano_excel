import { processDangerRate } from '../dangerRateCalculator';
import { createVintage } from '../vintageManager';

describe('Danger Rate Microservice Test', () => {
  test('Vintage-based default mechanism', () => {
    console.log('\n=== DANGER RATE MICROSERVICE TEST ===');
    
    // Create test product with danger rate
    const product = {
      type: 'french',
      durata: 12,
      gracePeriod: 0,
      spread: 4.0,
      dangerRate: 5.0, // 5% danger rate
      defaultAfterQuarters: 4, // Default after 1 year
      timeToRecover: 3
    };
    
    const assumptions = {
      euribor: 3.5
    };
    
    // Create multiple vintages
    const vintages = [];
    
    // Q0 vintage: €100M
    vintages.push(createVintage({
      year: 0,
      quarter: 0,
      volume: 100,
      product,
      assumptions
    }));
    
    // Q2 vintage: €50M
    vintages.push(createVintage({
      year: 0,
      quarter: 2,
      volume: 50,
      product,
      assumptions
    }));
    
    // Q4 vintage: €75M
    vintages.push(createVintage({
      year: 1,
      quarter: 0,
      volume: 75,
      product,
      assumptions
    }));
    
    console.log('\nVintage setup:');
    console.log('- Q0: €100M');
    console.log('- Q2: €50M');
    console.log('- Q4: €75M');
    console.log(`\nDanger rate: ${product.dangerRate}%`);
    console.log(`Default timing: ${product.defaultAfterQuarters} quarters after disbursement`);
    
    console.log('\n--- QUARTER BY QUARTER SIMULATION ---');
    console.log('Quarter | New Defaults | NPL Stock | Notes');
    console.log('--------|--------------|-----------|------');
    
    let totalNPLStock = 0;
    
    // Simulate 12 quarters
    for (let q = 0; q < 12; q++) {
      const result = processDangerRate(vintages, q, product);
      
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      let notes = '';
      
      if (result.newDefaults > 0) {
        notes = result.defaultingVintages.map(v => v.vintageId).join(', ');
      }
      
      console.log(`Y${year}Q${quarter} (${q.toString().padStart(2)}) | €${result.newDefaults.toFixed(1).padStart(9)}M | €${result.nplStock.toFixed(1).padStart(7)}M | ${notes}`);
    }
    
    console.log('\n--- VINTAGE STATUS AFTER SIMULATION ---');
    vintages.forEach(vintage => {
      const vintageId = `Y${vintage.startYear}Q${vintage.startQuarter + 1}`;
      console.log(`\n${vintageId}:`);
      console.log(`- Initial amount: €${vintage.initialAmount}M`);
      console.log(`- Has defaulted: ${vintage.hasDefaulted ? 'YES' : 'NO'}`);
      if (vintage.hasDefaulted) {
        console.log(`- Default quarter: Q${vintage.defaultQuarter}`);
        console.log(`- Default amount: €${vintage.defaultAmount?.toFixed(2)}M`);
        console.log(`- Remaining principal: €${vintage.outstandingPrincipal?.toFixed(2)}M`);
      } else {
        console.log(`- Outstanding principal: €${vintage.outstandingPrincipal?.toFixed(2)}M`);
      }
    });
    
    console.log('\n--- EXPECTED BEHAVIOR ---');
    console.log('Q0 vintage: Should default at Q4 (0 + 4) with €5M (5% of €100M)');
    console.log('Q2 vintage: Should default at Q6 (2 + 4) with €2.5M (5% of €50M)');
    console.log('Q4 vintage: Should default at Q8 (4 + 4) with €3.75M (5% of €75M)');
    
    // Verify defaults happened correctly
    const q0Vintage = vintages[0];
    const q2Vintage = vintages[1];
    const q4Vintage = vintages[2];
    
    expect(q0Vintage.hasDefaulted).toBe(true);
    expect(q0Vintage.defaultQuarter).toBe(4);
    expect(q0Vintage.defaultAmount).toBeCloseTo(5, 1);
    
    expect(q2Vintage.hasDefaulted).toBe(true);
    expect(q2Vintage.defaultQuarter).toBe(6);
    expect(q2Vintage.defaultAmount).toBeCloseTo(2.5, 1);
    
    expect(q4Vintage.hasDefaulted).toBe(true);
    expect(q4Vintage.defaultQuarter).toBe(8);
    expect(q4Vintage.defaultAmount).toBeCloseTo(3.75, 1);
    
    console.log('\n✅ All vintages defaulted at the correct time with correct amounts');
  });
});