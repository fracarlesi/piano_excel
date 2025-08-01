import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly.js';

describe('NPL Stock Debug Test', () => {
  test('Track NPL stock evolution for RE Bridge Financing', () => {
    console.log('\n=== NPL STOCK DEBUG TEST ===');
    
    // Simulate RE Bridge Financing
    const product = {
      name: 'RE Bridge Financing',
      volumes: { y1: 100, y2: 0, y3: 0, y4: 0, y5: 0 },
      avgLoanSize: 10.0,
      spread: 4.0,
      rwaDensity: 80,
      durata: 8, // 2 years
      commissionRate: 1.0,
      dangerRate: 50.0, // 50% as per user's example
      defaultAfterQuarters: 4,
      ltv: 65.0,
      recoveryCosts: 5.0,
      collateralHaircut: 30.0,
      type: 'bullet',
      gracePeriod: 0,
      timeToRecover: 12, // 3 years
      stateGuaranteeType: 'none',
      stateGuaranteeCoverage: 0,
      isUnsecured: false
    };
    
    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0]
    };
    
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Calculate
    const results = calculateCreditProductQuarterly(product, assumptions, years);
    
    console.log('\nProduct Setup:');
    console.log('- Initial loan: €100M');
    console.log('- Danger rate: 50%');
    console.log('- Expected default: €50M');
    console.log('- LTV: 65%');
    console.log('- Haircut: 30%');
    console.log('- Recovery costs: 5%');
    
    // Track NPL evolution quarter by quarter
    console.log('\n--- QUARTERLY NPL EVOLUTION ---');
    console.log('Quarter | Performing | New NPLs | NPL Stock | Annual NPL | Notes');
    console.log('--------|------------|----------|-----------|------------|------');
    
    let maxNPL = 0;
    let maxNPLQuarter = 0;
    
    for (let q = 0; q <= 20; q++) {
      const performing = results.quarterly.performingStock[q] || 0;
      const newNPLs = results.quarterly.newNPLs[q] || 0;
      const nplStock = results.quarterly.nplStock[q] || 0;
      
      // Also check annual NPL for comparison
      const year = Math.floor(q / 4);
      const annualNPL = results.nonPerformingAssets[year] || 0;
      
      if (nplStock > maxNPL) {
        maxNPL = nplStock;
        maxNPLQuarter = q;
      }
      
      let notes = '';
      if (q === 0) notes = 'Disbursement';
      if (q === 4) notes = 'Default expected';
      if (q === 16) notes = 'Recovery expected';
      
      if (performing > 0 || newNPLs > 0 || nplStock > 0 || notes) {
        console.log(
          `Q${q.toString().padStart(2)} (Y${year}Q${(q%4)+1}) | ` +
          `€${performing.toFixed(1).padStart(8)}M | ` +
          `€${newNPLs.toFixed(1).padStart(7)}M | ` +
          `€${nplStock.toFixed(1).padStart(8)}M | ` +
          `€${annualNPL.toFixed(1).padStart(9)}M | ` +
          notes
        );
      }
    }
    
    console.log('\n--- ANALYSIS ---');
    console.log(`Maximum NPL stock: €${maxNPL.toFixed(1)}M at Q${maxNPLQuarter}`);
    console.log(`Expected NPL stock: ~€41M (50% * €100M * 82.2% NBV ratio)`);
    
    if (maxNPL > 50) {
      console.log('\n❌ CRITICAL ERROR: NPL stock exceeds the nominal default amount!');
      console.log(`   NPL (€${maxNPL.toFixed(1)}M) > Nominal default (€50M)`);
      console.log('   This is impossible - NBV must be less than nominal');
    }
    
    // Check annual values
    console.log('\n--- ANNUAL NPL VALUES ---');
    for (let y = 0; y <= 5; y++) {
      const annualNPL = results.nonPerformingAssets[y] || 0;
      if (annualNPL > 0) {
        console.log(`Year ${y}: €${annualNPL.toFixed(1)}M`);
      }
    }
    
    // Verify the issue
    const expectedMaxNPL = 41.1; // Based on 82.2% NBV ratio
    if (Math.abs(maxNPL - 60) < 5) {
      console.log('\n❌ CONFIRMED: NPL stock is showing ~€60M as user reported');
      console.log('   This indicates a calculation error in the NPL tracking');
    }
  });
});