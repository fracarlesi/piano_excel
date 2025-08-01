import { NPLManager, createNPLFromDefault } from '../nplManager';

describe('NPL Microservice Test', () => {
  test('NPL creation and recovery with quarters', () => {
    console.log('\n=== NPL MICROSERVICE TEST ===');
    
    const nplManager = new NPLManager();
    
    // Test product with NPL parameters
    const product = {
      dangerRate: 5.0,
      timeToRecover: 12, // 12 quarters (3 years)
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      stateGuaranteeType: 'none'
    };
    
    const quarterlyRate = 0.075 / 4; // 7.5% annual / 4
    
    console.log('\nProduct parameters:');
    console.log(`- Danger rate: ${product.dangerRate}%`);
    console.log(`- Time to recover: ${product.timeToRecover} quarters`);
    console.log(`- LTV: ${product.ltv}%`);
    console.log(`- Recovery costs: ${product.recoveryCosts}%`);
    console.log(`- Collateral haircut: ${product.collateralHaircut}%`);
    
    // Create NPL at Q4
    const defaultAmount = 10; // €10M default
    const outstandingPrincipal = 100; // €100M outstanding
    const currentQuarter = 4;
    
    const llpResult = createNPLFromDefault({
      defaultAmount: defaultAmount,
      outstandingPrincipal: outstandingPrincipal,
      product,
      quarterlyRate,
      currentQuarter
    });
    
    console.log('\n--- NPL CREATION AT Q4 ---');
    console.log(`Default amount: €${defaultAmount}M`);
    console.log(`NBV amount: €${llpResult.nbvAmount.toFixed(2)}M`);
    console.log(`LLP provision: €${llpResult.llp.toFixed(2)}M`);
    console.log(`Number of cohorts: ${llpResult.cohorts.length}`);
    
    // Add cohorts to NPL manager
    llpResult.cohorts.forEach(cohort => {
      nplManager.addCohort(cohort);
    });
    
    console.log('\n--- COHORT DETAILS ---');
    llpResult.cohorts.forEach((cohort, i) => {
      console.log(`\nCohort ${i + 1} (${cohort.type}):`);
      console.log(`- Nominal amount: €${cohort.nominalAmount.toFixed(2)}M`);
      console.log(`- NBV: €${cohort.nbvAmount.toFixed(2)}M`);
      console.log(`- Recovery quarter: Q${cohort.recoveryQuarter}`);
      console.log(`- Expected recovery: €${cohort.expectedRecoveryAmount.toFixed(2)}M`);
    });
    
    console.log('\n--- NPL STOCK EVOLUTION ---');
    console.log('Quarter | NPL Stock | Interest | Recoveries');
    console.log('--------|-----------|----------|------------');
    
    // Simulate quarters
    for (let q = 4; q <= 20; q++) {
      const nplInterest = nplManager.calculateQuarterlyInterest(quarterlyRate);
      const recoveryResult = nplManager.processQuarterlyRecoveries(q);
      
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      
      console.log(`Y${year}Q${quarter} (${q.toString().padStart(2)}) | €${nplManager.totalNBVStock.toFixed(1).padStart(7)}M | €${nplInterest.toFixed(2).padStart(6)}M | €${recoveryResult.totalRecovered.toFixed(1).padStart(8)}M`);
      
      if (recoveryResult.recoveredCohorts.length > 0) {
        recoveryResult.recoveredCohorts.forEach(cohort => {
          console.log(`         └─ Recovered ${cohort.type}: €${cohort.expectedRecoveryAmount.toFixed(2)}M`);
        });
      }
    }
    
    console.log('\n--- RECOVERY TIMING CHECK ---');
    console.log(`NPL created at: Q${currentQuarter}`);
    console.log(`Time to recover: ${product.timeToRecover} quarters`);
    console.log(`Expected recovery at: Q${currentQuarter + product.timeToRecover}`);
    
    // Verify recovery timing
    const expectedRecoveryQ = currentQuarter + product.timeToRecover;
    const cohort = llpResult.cohorts[0];
    
    if (cohort.recoveryQuarter === expectedRecoveryQ) {
      console.log('\n✅ Recovery timing is correct (in quarters)');
    } else {
      console.log(`\n❌ ERROR: Recovery at Q${cohort.recoveryQuarter} instead of Q${expectedRecoveryQ}`);
    }
    
    expect(cohort.recoveryQuarter).toBe(expectedRecoveryQ);
    expect(nplManager.totalNBVStock).toBeCloseTo(0, 2); // Should be recovered
  });
});