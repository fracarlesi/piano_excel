import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly.js';

describe('Display Value Debug Test', () => {
  test('What value could be €60M at Y2Q1?', () => {
    console.log('\n=== DISPLAY VALUE DEBUG TEST ===');
    
    const product = {
      name: 'Bridge Financing',
      volumes: { y1: 100, y2: 100, y3: 100, y4: 100, y5: 100 },
      avgLoanSize: 15.0,
      spread: 4.2,
      rwaDensity: 85,
      durata: 8,
      commissionRate: 2.5,
      dangerRate: 50.0,
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
      quarterlyAllocation: [100, 0, 0, 0]
    };
    
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const results = calculateCreditProductQuarterly(product, assumptions, years);
    
    // Check all possible values at Y2Q1 (quarter 4)
    const q = 4;
    
    console.log('\nAll values at Y2Q1 that might explain €60M:');
    console.log('================================================');
    
    // 1. Performing assets
    const performing = results.quarterly.performingStock[q] || 0;
    console.log(`1. Performing Assets: €${performing.toFixed(1)}M`);
    
    // 2. NPL stock
    const nplStock = results.quarterly.nplStock[q] || 0;
    console.log(`2. NPL Stock (NBV): €${nplStock.toFixed(1)}M`);
    
    // 3. New defaults (nominal)
    const newDefaults = results.quarterly.newNPLs[q] || 0;
    console.log(`3. New Defaults (nominal): €${newDefaults.toFixed(1)}M`);
    
    // 4. Total assets
    const totalAssets = performing + nplStock;
    console.log(`4. Total Assets: €${totalAssets.toFixed(1)}M`);
    
    // 5. LLP for the quarter
    const llp = results.quarterly.llp[q] || 0;
    console.log(`5. LLP (provisions): €${Math.abs(llp).toFixed(1)}M`);
    
    // 6. Cumulative LLP
    let cumulativeLLP = 0;
    for (let i = 0; i <= q; i++) {
      cumulativeLLP += Math.abs(results.quarterly.llp[i] || 0);
    }
    console.log(`6. Cumulative LLP: €${cumulativeLLP.toFixed(1)}M`);
    
    // 7. Interest income
    const interestIncome = results.quarterly.interestIncome[q] || 0;
    console.log(`7. Interest Income: €${interestIncome.toFixed(1)}M`);
    
    // 8. Outstanding principal before defaults
    const principalBeforeDefaults = 100; // Y1Q1 vintage
    console.log(`8. Principal before defaults: €${principalBeforeDefaults.toFixed(1)}M`);
    
    // 9. Check if €60M could be related to partial defaults
    const partialDefault = principalBeforeDefaults * 0.6;
    console.log(`9. 60% of principal: €${partialDefault.toFixed(1)}M`);
    
    // 10. Check annual values
    const annualPerforming = results.performingAssets[1] || 0;
    const annualNPL = results.nonPerformingAssets[1] || 0;
    console.log(`\n10. Annual values at end of Year 1:`);
    console.log(`    - Performing: €${annualPerforming.toFixed(1)}M`);
    console.log(`    - NPL: €${annualNPL.toFixed(1)}M`);
    
    // Check if €60M matches any calculated value
    console.log('\n--- ANALYSIS ---');
    const values = [
      { name: 'Performing Assets', value: performing },
      { name: 'NPL Stock', value: nplStock },
      { name: 'New Defaults', value: newDefaults },
      { name: 'Total Assets', value: totalAssets },
      { name: 'Cumulative LLP', value: cumulativeLLP },
      { name: '60% of Principal', value: partialDefault }
    ];
    
    values.forEach(({ name, value }) => {
      if (Math.abs(value - 60) < 1) {
        console.log(`✅ MATCH FOUND: ${name} = €${value.toFixed(1)}M`);
      }
    });
    
    // Additional hypothesis
    console.log('\n--- HYPOTHESIS ---');
    console.log('The €60M might be:');
    console.log('1. A display error showing performing assets of a single vintage');
    console.log('2. A calculation showing 60% of the original €100M loan');
    console.log('3. An incorrect aggregation or transformation in the UI');
    console.log('4. The gross value before NBV adjustment (but that should be €50M)');
  });
});