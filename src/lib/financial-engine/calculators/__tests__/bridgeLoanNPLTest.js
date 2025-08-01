import { processDangerRate } from '../dangerRateCalculator.js';
import { calculateNBV } from '../nbvCalculator.js';

describe('Bridge Loan NPL Test - RE Division Scenario', () => {
  test('Bridge loan with 50% danger rate should have correct NPL', () => {
    console.log('\n=== BRIDGE LOAN NPL TEST ===');
    console.log('Scenario: €100M Bridge Loan with 50% danger rate');
    
    // Simulate the exact RE Bridge Financing scenario
    const product = {
      name: 'RE Bridge Financing',
      type: 'bullet',
      ltv: 65.0,
      recoveryCosts: 5.0,
      collateralHaircut: 30.0,
      timeToRecover: 12, // 3 years in quarters
      stateGuaranteeType: 'none',
      stateGuaranteeCoverage: 0,
      isUnsecured: false,
      dangerRate: 50.0,
      defaultAfterQuarters: 4
    };
    
    const quarterlyRate = 0.01875; // 7.5% annual / 4
    
    // Test the NBV calculation directly
    console.log('\n1. Direct NBV Calculation:');
    const defaultAmount = 50; // €50M defaults (50% of €100M)
    const nbvResult = calculateNBV(defaultAmount, product, quarterlyRate);
    
    console.log(`   - Default amount: €${defaultAmount}M`);
    console.log(`   - NBV calculated: €${nbvResult.totalNBV.toFixed(2)}M`);
    console.log(`   - NBV ratio: ${(nbvResult.totalNBV / defaultAmount * 100).toFixed(1)}%`);
    
    // Expected calculation
    console.log('\n2. Expected Calculation:');
    console.log(`   - LTV: ${product.ltv}%`);
    console.log(`   - Collateral value: €${(defaultAmount / (product.ltv / 100)).toFixed(2)}M`);
    console.log(`   - After haircut (${product.collateralHaircut}%): €${(defaultAmount / (product.ltv / 100) * (1 - product.collateralHaircut / 100)).toFixed(2)}M`);
    console.log(`   - Recovery costs (${product.recoveryCosts}%): €${(defaultAmount * product.recoveryCosts / 100).toFixed(2)}M`);
    
    // Simulate vintage with outstanding principal
    const vintages = [{
      id: 'Y0Q0',
      startYear: 0,
      startQuarter: 0,
      endYear: 2,
      endQuarter: 0,
      maturityYear: 2,
      maturityQuarter: 0,
      amount: 100,
      outstandingPrincipal: 100,
      totalPrincipal: 100,
      type: 'bullet',
      defaultProcessed: false,
      hasDefaulted: false
    }];
    
    // Test danger rate processing
    console.log('\n3. Danger Rate Processing:');
    const dangerResult = processDangerRate(vintages, 4, product, quarterlyRate);
    
    console.log(`   - New defaults: €${dangerResult.newDefaults.toFixed(2)}M`);
    console.log(`   - NBV: €${dangerResult.nbv.toFixed(2)}M`);
    console.log(`   - LLP: €${dangerResult.llp.toFixed(2)}M`);
    
    // Verify the issue
    console.log('\n4. Issue Verification:');
    const expectedNPL = 50 * 0.713; // Approximate expected NBV
    console.log(`   - Expected NPL stock: ~€${expectedNPL.toFixed(1)}M`);
    console.log(`   - If showing €60M, that's ${(60 / expectedNPL * 100).toFixed(0)}% of expected`);
    console.log(`   - This suggests recovery calculation is ADDING value instead of subtracting`);
    
    // Check if NBV is somehow greater than nominal
    if (dangerResult.nbv > dangerResult.newDefaults) {
      console.log('\n❌ CRITICAL ERROR: NBV (€' + dangerResult.nbv.toFixed(2) + 'M) > Nominal (€' + dangerResult.newDefaults.toFixed(2) + 'M)');
      console.log('   This is impossible - NBV should always be less than nominal!');
    } else {
      console.log('\n✅ NBV correctly less than nominal');
    }
    
    // Test expectations
    expect(dangerResult.newDefaults).toBeCloseTo(50, 1);
    expect(dangerResult.nbv).toBeLessThan(dangerResult.newDefaults);
    expect(dangerResult.nbv).toBeCloseTo(35.7, 1); // Should be around 35.7M, not 60M
    
    // Extra verification of NBV calculation
    expect(nbvResult.totalNBV).toBeCloseTo(35.7, 1);
    expect(nbvResult.impliedRecoveryRate).toBeCloseTo(71.3, 1);
  });
});