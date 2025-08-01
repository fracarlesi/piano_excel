import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('NPL Recovery Flow Test', () => {
  test('NPL stock should correctly handle defaults and recoveries', () => {
    console.log('\n=== NPL RECOVERY FLOW TEST ===');
    
    // Simple product with high danger rate to see multiple defaults/recoveries
    const product = {
      name: 'Test Product',
      volumes: { y1: 100, y2: 100, y3: 100, y4: 100, y5: 100 },
      avgLoanSize: 10.0,
      spread: 4.0,
      rwaDensity: 80,
      durata: 8, // 2 years
      commissionRate: 1.0,
      dangerRate: 20.0, // High danger rate
      defaultAfterQuarters: 4,
      ltv: 70.0,
      recoveryCosts: 18.0,
      collateralHaircut: 25.0,
      type: 'bullet',
      gracePeriod: 0,
      timeToRecover: 8, // 2 years recovery
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
    
    console.log('\nProduct Setup:');
    console.log(`- Danger rate: ${product.dangerRate}%`);
    console.log(`- Default timing: ${product.defaultAfterQuarters} quarters after disbursement`);
    console.log(`- Recovery timing: ${product.timeToRecover} quarters after default`);
    console.log(`- Expected NBV ratio: ~71.3%`);
    
    // Track NPL flows
    console.log('\n--- NPL FLOW ANALYSIS ---');
    console.log('Quarter | Performing | New Defaults | NPL Stock | Recoveries | Total Assets | Notes');
    console.log('--------|------------|--------------|-----------|------------|--------------|------');
    
    let previousNPLStock = 0;
    const events = [];
    
    for (let q = 0; q < 28; q++) { // 7 years
      const year = Math.floor(q / 4);
      const quarter = q % 4;
      
      const performing = results.quarterly.performingStock[q] || 0;
      const newDefaults = results.quarterly.newNPLs[q] || 0;
      const nplStock = results.quarterly.nplStock[q] || 0;
      const recoveries = previousNPLStock + newDefaults - nplStock;
      const totalAssets = performing + nplStock;
      
      let notes = '';
      
      // Track events
      if (q % 4 === 0 && q <= 20) {
        notes += `Y${year} disb `;
        events.push({ quarter: q, type: 'disbursement', amount: 100 });
      }
      
      if (newDefaults > 0) {
        notes += 'DEFAULT ';
        const defaultingYear = Math.floor((q - product.defaultAfterQuarters) / 4);
        events.push({ 
          quarter: q, 
          type: 'default', 
          amount: newDefaults,
          fromDisbursement: `Y${defaultingYear}`
        });
      }
      
      if (recoveries > 0.1) {
        notes += 'RECOVERY ';
        const recoveringYear = Math.floor((q - product.defaultAfterQuarters - product.timeToRecover) / 4);
        events.push({ 
          quarter: q, 
          type: 'recovery', 
          amount: recoveries,
          fromDefault: `Y${recoveringYear}`
        });
      }
      
      console.log(
        `Y${year}Q${quarter+1} (${q.toString().padStart(2)}) | ` +
        `€${performing.toFixed(1).padStart(8)}M | ` +
        `€${newDefaults.toFixed(1).padStart(10)}M | ` +
        `€${nplStock.toFixed(1).padStart(7)}M | ` +
        `€${recoveries.toFixed(1).padStart(8)}M | ` +
        `€${totalAssets.toFixed(1).padStart(10)}M | ${notes}`
      );
      
      previousNPLStock = nplStock;
    }
    
    // Verify NPL stock logic
    console.log('\n--- EVENT TIMELINE ---');
    events.forEach(event => {
      if (event.type === 'disbursement') {
        console.log(`Q${event.quarter}: Disbursement of €${event.amount}M`);
      } else if (event.type === 'default') {
        console.log(`Q${event.quarter}: Default of €${event.amount.toFixed(1)}M from ${event.fromDisbursement} disbursement`);
      } else if (event.type === 'recovery') {
        console.log(`Q${event.quarter}: Recovery of €${event.amount.toFixed(1)}M from ${event.fromDefault} default`);
      }
    });
    
    // Check specific scenarios
    console.log('\n--- VERIFICATION ---');
    
    // First default at Q4
    const q4Defaults = results.quarterly.newNPLs[4];
    const q4NPLStock = results.quarterly.nplStock[4];
    const expectedNominalDefault = 100 * 0.2; // 20% of 100M
    const expectedNBV = expectedNominalDefault * 0.713; // ~71.3% NBV ratio
    
    console.log('\nFirst default (Q4):');
    console.log(`- Nominal default: €${expectedNominalDefault}M`);
    console.log(`- Expected NBV: €${expectedNBV.toFixed(1)}M`);
    console.log(`- Actual new NPLs: €${q4Defaults.toFixed(1)}M`);
    console.log(`- Actual NPL stock: €${q4NPLStock.toFixed(1)}M`);
    
    // First recovery at Q12 (Q4 default + 8 quarters)
    const q12NPLBefore = results.quarterly.nplStock[11] || 0;
    const q12NPLAfter = results.quarterly.nplStock[12] || 0;
    const q12Recovery = q12NPLBefore - q12NPLAfter + (results.quarterly.newNPLs[12] || 0);
    
    console.log('\nFirst recovery (Q12):');
    console.log(`- NPL stock before: €${q12NPLBefore.toFixed(1)}M`);
    console.log(`- NPL stock after: €${q12NPLAfter.toFixed(1)}M`);
    console.log(`- Recovery amount: €${q12Recovery.toFixed(1)}M`);
    console.log(`- Should equal NBV from Q4: €${expectedNBV.toFixed(1)}M`);
    
    // Check for anomalies
    let hasAnomaly = false;
    for (let q = 0; q < 28; q++) {
      const performing = results.quarterly.performingStock[q] || 0;
      const npl = results.quarterly.nplStock[q] || 0;
      
      if (npl < 0) {
        console.log(`\n❌ ANOMALY at Q${q}: Negative NPL stock: €${npl.toFixed(2)}M`);
        hasAnomaly = true;
      }
      
      // Check if NPL exceeds reasonable bounds
      const maxPossibleNPL = q * 100 * 0.2 * 0.713; // Max cumulative NBV
      if (npl > maxPossibleNPL + 1) {
        console.log(`\n❌ ANOMALY at Q${q}: NPL stock (€${npl.toFixed(2)}M) exceeds max possible (€${maxPossibleNPL.toFixed(2)}M)`);
        hasAnomaly = true;
      }
    }
    
    if (!hasAnomaly) {
      console.log('\n✅ No anomalies detected in NPL stock evolution');
    }
  });
});