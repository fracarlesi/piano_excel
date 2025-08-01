import { calculateCreditProduct } from '../creditCalculator';

describe('State Guarantee NPL Recovery Test', () => {
  test('State guarantee reduces LLP and accelerates recovery', () => {
    const productWithGuarantee = {
      name: 'SME Loan with MCC',
      type: 'french',
      durata: 5,
      gracePeriod: 0,
      spread: 3.5,
      dangerRate: 2.0, // 2% default rate
      rwaDensity: 50,
      commissionRate: 1.0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 3,
      // State guarantee parameters
      stateGuaranteeType: 'MCC',
      stateGuaranteeCoverage: 80, // 80% coverage
      stateGuaranteeRecoveryTime: 0.5, // 6 months
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €100M
    };

    const productWithoutGuarantee = {
      ...productWithGuarantee,
      stateGuaranteeType: 'none',
      stateGuaranteeCoverage: 0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    const resultWith = calculateCreditProduct(productWithGuarantee, assumptions, years);
    const resultWithout = calculateCreditProduct(productWithoutGuarantee, assumptions, years);

    console.log('\n=== STATE GUARANTEE IMPACT ANALYSIS ===');
    console.log('Loan: €100M, Default rate: 2%, LTV: 70%');
    console.log('MCC Guarantee: 80% coverage, 6 months recovery');
    console.log('Collateral recovery: 3 years');
    
    // Calculate example for €10M default
    const defaultAmount = 10;
    console.log(`\n--- Recovery calculation for €${defaultAmount}M default ---`);
    
    // With state guarantee
    console.log('\nWITH MCC GUARANTEE:');
    const guaranteedPortion = defaultAmount * 0.8; // 80%
    const nonGuaranteedPortion = defaultAmount * 0.2; // 20%
    console.log(`- Guaranteed portion: €${guaranteedPortion}M (80%)`)
    console.log(`- Non-guaranteed portion: €${nonGuaranteedPortion}M (20%)`);
    
    // State guarantee recovery
    const rate = 0.07; // 7% discount rate
    const stateRecoveryNPV = guaranteedPortion / Math.pow(1 + rate, 0.5);
    console.log(`\nState guarantee recovery:`);
    console.log(`- Amount: €${guaranteedPortion}M`);
    console.log(`- Time: 0.5 years`);
    console.log(`- NPV: €${stateRecoveryNPV.toFixed(2)}M`);
    
    // Collateral recovery on non-guaranteed portion
    const collateralValue = nonGuaranteedPortion / 0.7; // LTV 70%
    const afterHaircut = collateralValue * 0.75; // 25% haircut
    const recoveryCosts = nonGuaranteedPortion * 0.15;
    const collateralRecovery = afterHaircut - recoveryCosts;
    const collateralNPV = collateralRecovery / Math.pow(1 + rate, 3);
    console.log(`\nCollateral recovery (non-guaranteed):`);
    console.log(`- Collateral value: €${collateralValue.toFixed(2)}M`);
    console.log(`- After haircut: €${afterHaircut.toFixed(2)}M`);
    console.log(`- Recovery costs: €${recoveryCosts.toFixed(2)}M`);
    console.log(`- Net recovery: €${collateralRecovery.toFixed(2)}M`);
    console.log(`- NPV (3 years): €${collateralNPV.toFixed(2)}M`);
    
    const totalNPVWith = stateRecoveryNPV + collateralNPV;
    const llpWith = defaultAmount - totalNPVWith;
    console.log(`\nTOTAL NPV: €${totalNPVWith.toFixed(2)}M`);
    console.log(`LLP REQUIRED: €${llpWith.toFixed(2)}M`);
    
    // Without state guarantee
    console.log('\n\nWITHOUT GUARANTEE:');
    const fullCollateralValue = defaultAmount / 0.7;
    const fullAfterHaircut = fullCollateralValue * 0.75;
    const fullRecoveryCosts = defaultAmount * 0.15;
    const fullCollateralRecovery = fullAfterHaircut - fullRecoveryCosts;
    const fullCollateralNPV = fullCollateralRecovery / Math.pow(1 + rate, 3);
    const llpWithout = defaultAmount - fullCollateralNPV;
    
    console.log(`- Full collateral NPV: €${fullCollateralNPV.toFixed(2)}M`);
    console.log(`- LLP required: €${llpWithout.toFixed(2)}M`);
    
    console.log(`\n--- GUARANTEE BENEFIT ---`);
    console.log(`LLP reduction: €${(llpWithout - llpWith).toFixed(2)}M`);
    console.log(`Percentage reduction: ${((llpWithout - llpWith) / llpWithout * 100).toFixed(1)}%`);
    
    // Compare actual results
    console.log('\n--- ACTUAL MODEL RESULTS ---');
    for (let i = 0; i < 4; i++) {
      if (resultWith.llp[i] !== 0 || resultWithout.llp[i] !== 0) {
        console.log(`\nYear ${i}:`);
        console.log(`  LLP with guarantee: €${resultWith.llp[i].toFixed(2)}M`);
        console.log(`  LLP without guarantee: €${resultWithout.llp[i].toFixed(2)}M`);
        console.log(`  Difference: €${(resultWithout.llp[i] - resultWith.llp[i]).toFixed(2)}M`);
      }
    }
    
    // Verify that state guarantee reduces LLP
    const totalLLPWith = resultWith.llp.reduce((sum, llp) => sum + Math.abs(llp), 0);
    const totalLLPWithout = resultWithout.llp.reduce((sum, llp) => sum + Math.abs(llp), 0);
    
    console.log(`\nTotal LLP with guarantee: €${totalLLPWith.toFixed(2)}M`);
    console.log(`Total LLP without guarantee: €${totalLLPWithout.toFixed(2)}M`);
    
    expect(totalLLPWith).toBeLessThan(totalLLPWithout);
  });
});