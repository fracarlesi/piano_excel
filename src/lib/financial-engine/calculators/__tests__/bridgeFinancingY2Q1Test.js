import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly.js';

describe('Bridge Financing Y2Q1 NPL Test', () => {
  test('Check NPL at Y2Q1 for Bridge Financing', () => {
    console.log('\n=== BRIDGE FINANCING Y2Q1 SPECIFIC TEST ===');
    
    // Simulate Bridge Financing with user's scenario
    const product = {
      name: 'Bridge Financing',
      volumes: { y1: 100, y2: 100, y3: 100, y4: 100, y5: 100 }, // Multiple years
      avgLoanSize: 15.0,
      spread: 4.2,
      rwaDensity: 85,
      durata: 8, // 2 years
      commissionRate: 2.5,
      dangerRate: 50.0, // User's 50% danger rate
      defaultAfterQuarters: 4,
      ltv: 65.0,
      recoveryCosts: 5.0,
      collateralHaircut: 30.0,
      type: 'bullet',
      gracePeriod: 0,
      timeToRecover: 12,
      stateGuaranteeType: 'none',
      stateGuaranteeCoverage: 0,
      isUnsecured: false
    };
    
    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0] // All in Q1
    };
    
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Calculate
    const results = calculateCreditProductQuarterly(product, assumptions, years);
    
    console.log('\nDisbursement Schedule:');
    console.log('- Y1Q1: €100M');
    console.log('- Y2Q1: €100M');
    console.log('- Y3Q1: €100M');
    console.log('- etc.');
    
    console.log('\nDefault Schedule (4 quarters after disbursement):');
    console.log('- Y1Q1 disbursement -> defaults at Y2Q1');
    console.log('- Y2Q1 disbursement -> defaults at Y3Q1');
    console.log('- etc.');
    
    // Focus on Y2Q1 (quarter 4)
    const y2q1Quarter = 4; // Year 2, Quarter 1 = quarter index 4
    
    console.log('\n--- Y2Q1 ANALYSIS ---');
    console.log('Quarter index:', y2q1Quarter);
    
    // Check performing stock before defaults
    const performingBefore = results.quarterly.performingStock[y2q1Quarter - 1] || 0;
    console.log(`\nPerforming stock at Y1Q4 (before defaults): €${performingBefore.toFixed(1)}M`);
    
    // New disbursement at Y2Q1
    const newBusiness = results.quarterly.newBusiness[y2q1Quarter] || 0;
    console.log(`New disbursement at Y2Q1: €${newBusiness.toFixed(1)}M`);
    
    // Defaults at Y2Q1
    const newDefaults = results.quarterly.newNPLs[y2q1Quarter] || 0;
    console.log(`New defaults at Y2Q1: €${newDefaults.toFixed(1)}M`);
    console.log('  - This is 50% of the Y1Q1 disbursement (€100M)');
    
    // NPL stock at Y2Q1
    const nplStock = results.quarterly.nplStock[y2q1Quarter] || 0;
    console.log(`\nNPL stock at Y2Q1: €${nplStock.toFixed(1)}M`);
    
    // Performing stock after
    const performingAfter = results.quarterly.performingStock[y2q1Quarter] || 0;
    console.log(`Performing stock at Y2Q1 (after defaults): €${performingAfter.toFixed(1)}M`);
    
    // Annual NPL for comparison
    const annualNPL = results.nonPerformingAssets[1] || 0; // Year 1 (0-indexed)
    console.log(`\nAnnual NPL at end of Year 1: €${annualNPL.toFixed(1)}M`);
    
    // Verify the calculation
    console.log('\n--- VERIFICATION ---');
    console.log('Expected flow at Y2Q1:');
    console.log('1. Start with €100M performing (from Y1Q1)');
    console.log('2. Add €100M new disbursement');
    console.log('3. Default 50% of Y1Q1 vintage = €50M nominal');
    console.log('4. NBV of defaults = €50M * 82.2% = €41.1M');
    console.log('5. NPL stock should show €41.1M (NBV)');
    
    if (Math.abs(nplStock - 60) < 1) {
      console.log('\n❌ CONFIRMED: NPL stock is showing €60M as user reported!');
      console.log('This suggests the calculation is somehow incorrect.');
      
      // Try to understand why
      console.log('\nPossible issues:');
      console.log(`- If NPL = €${nplStock.toFixed(1)}M and expected = €41.1M`);
      console.log(`- Difference = €${(nplStock - 41.1).toFixed(1)}M`);
      console.log('- This extra amount might be from incorrect recovery or double-counting');
    }
    
    // Check quarterly evolution
    console.log('\n--- QUARTERLY EVOLUTION ---');
    console.log('Quarter | Performing | New NPLs | NPL Stock | Notes');
    console.log('--------|------------|----------|-----------|------');
    
    for (let q = 0; q <= 8; q++) {
      const perf = results.quarterly.performingStock[q] || 0;
      const newNPL = results.quarterly.newNPLs[q] || 0;
      const npl = results.quarterly.nplStock[q] || 0;
      
      let notes = '';
      if (q === 0) notes = 'Y1Q1 disbursement';
      if (q === 4) notes = 'Y2Q1 - defaults + new disbursement';
      if (q === 8) notes = 'Y3Q1';
      
      console.log(
        `Y${Math.floor(q/4)+1}Q${(q%4)+1} (${q.toString().padStart(2)}) | ` +
        `€${perf.toFixed(1).padStart(8)}M | ` +
        `€${newNPL.toFixed(1).padStart(7)}M | ` +
        `€${npl.toFixed(1).padStart(8)}M | ` +
        notes
      );
    }
  });
});