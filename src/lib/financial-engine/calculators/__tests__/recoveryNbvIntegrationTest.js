import { calculateDefaultRecovery } from '../defaultRecoveryCalculator';
import { calculateNBV } from '../nbvCalculator';

describe('Recovery and NBV Integration Test', () => {
  const quarterlyRate = 0.0125; // 5% annual / 4

  test('Complete recovery and NBV calculation chain', () => {
    console.log('\n=== RECOVERY AND NBV INTEGRATION TEST ===');
    
    // Test Case 1: Secured loan with collateral
    console.log('\n--- TEST 1: SECURED LOAN WITH COLLATERAL ---');
    const securedProduct = {
      name: 'Secured Real Estate Loan',
      ltv: 70,
      collateralHaircut: 25,
      recoveryCosts: 15,
      timeToRecover: 12,
      isUnsecured: false
    };
    
    const defaultAmount1 = 100; // €100M
    
    // Step 1: Calculate recovery
    const recovery1 = calculateDefaultRecovery(defaultAmount1, securedProduct);
    console.log('\nRecovery Analysis:');
    console.log(`- Total default: €${recovery1.totalDefault}M`);
    console.log(`- Total recovery: €${recovery1.totalRecovery.toFixed(2)}M`);
    console.log(`- Recovery rate: ${recovery1.weightedRecoveryRate.toFixed(2)}%`);
    
    console.log('\nRecovery Components:');
    recovery1.components.forEach(comp => {
      console.log(`- ${comp.type}: €${(comp.netRecovery || comp.expectedRecovery).toFixed(2)}M (${comp.recoveryRate.toFixed(2)}%)`);
    });
    
    // Step 2: Calculate NBV
    const nbv1 = calculateNBV(defaultAmount1, securedProduct, quarterlyRate);
    console.log('\nNBV Calculation:');
    console.log(`- Total NBV: €${nbv1.totalNBV.toFixed(2)}M`);
    console.log(`- Total LLP: €${nbv1.totalLLP.toFixed(2)}M`);
    console.log(`- Implied recovery rate: ${nbv1.impliedRecoveryRate.toFixed(2)}%`);
    
    // Test Case 2: State guaranteed loan
    console.log('\n--- TEST 2: STATE GUARANTEED LOAN ---');
    const guaranteedProduct = {
      name: 'SME State Guaranteed',
      ltv: 70,
      collateralHaircut: 25,
      recoveryCosts: 15,
      timeToRecover: 12,
      stateGuaranteeType: 'present',
      stateGuaranteeCoverage: 80,
      stateGuaranteeRecoveryTime: 2,
      isUnsecured: false
    };
    
    const defaultAmount2 = 50; // €50M
    
    const recovery2 = calculateDefaultRecovery(defaultAmount2, guaranteedProduct);
    console.log('\nRecovery Analysis:');
    console.log(`- Total default: €${recovery2.totalDefault}M`);
    console.log(`- Total recovery: €${recovery2.totalRecovery.toFixed(2)}M`);
    console.log(`- Recovery rate: ${recovery2.weightedRecoveryRate.toFixed(2)}%`);
    
    console.log('\nRecovery Schedule:');
    recovery2.recoverySchedule.forEach(item => {
      console.log(`- Q${item.quarter}: €${item.amount.toFixed(2)}M (${item.type})`);
    });
    
    console.log('\nRecovery Metrics:');
    console.log(`- Immediate recovery (≤2Q): €${recovery2.metrics.immediateRecovery.toFixed(2)}M`);
    console.log(`- Delayed recovery (>2Q): €${recovery2.metrics.delayedRecovery.toFixed(2)}M`);
    console.log(`- State guarantee: €${recovery2.metrics.stateGuaranteeRecovery.toFixed(2)}M`);
    console.log(`- Private recovery: €${recovery2.metrics.privateRecovery.toFixed(2)}M`);
    
    const nbv2 = calculateNBV(defaultAmount2, guaranteedProduct, quarterlyRate);
    console.log('\nNBV Calculation:');
    console.log(`- Total NBV: €${nbv2.totalNBV.toFixed(2)}M`);
    console.log(`- Total LLP: €${nbv2.totalLLP.toFixed(2)}M`);
    
    console.log('\nNBV Components:');
    nbv2.components.forEach(comp => {
      console.log(`- ${comp.type}: NBV €${comp.nbv.toFixed(2)}M (recovery €${comp.recoveryAmount.toFixed(2)}M in Q${comp.recoveryTime})`);
    });
    
    // Test Case 3: Unsecured loan
    console.log('\n--- TEST 3: UNSECURED LOAN ---');
    const unsecuredProduct = {
      name: 'Unsecured Personal Loan',
      isUnsecured: true,
      unsecuredLGD: 45,
      timeToRecover: 16
    };
    
    const defaultAmount3 = 20; // €20M
    
    const recovery3 = calculateDefaultRecovery(defaultAmount3, unsecuredProduct);
    const nbv3 = calculateNBV(defaultAmount3, unsecuredProduct, quarterlyRate);
    
    console.log('\nRecovery Analysis:');
    console.log(`- Total default: €${recovery3.totalDefault}M`);
    console.log(`- Total recovery: €${recovery3.totalRecovery.toFixed(2)}M`);
    console.log(`- Recovery rate: ${recovery3.weightedRecoveryRate.toFixed(2)}%`);
    console.log(`- LGD: ${unsecuredProduct.unsecuredLGD}%`);
    
    console.log('\nNBV Calculation:');
    console.log(`- Total NBV: €${nbv3.totalNBV.toFixed(2)}M`);
    console.log(`- Total LLP: €${nbv3.totalLLP.toFixed(2)}M`);
    console.log(`- Discount impact: €${(recovery3.totalRecovery - nbv3.totalNBV).toFixed(2)}M`);
    
    // Test Case 4: Mixed portfolio
    console.log('\n--- TEST 4: PORTFOLIO ANALYSIS ---');
    const defaults = [
      { amount: defaultAmount1, product: securedProduct },
      { amount: defaultAmount2, product: guaranteedProduct },
      { amount: defaultAmount3, product: unsecuredProduct }
    ];
    
    const portfolioResults = defaults.map(d => ({
      product: d.product.name,
      recovery: calculateDefaultRecovery(d.amount, d.product),
      nbv: calculateNBV(d.amount, d.product, quarterlyRate)
    }));
    
    const totalDefaults = portfolioResults.reduce((sum, r) => sum + r.recovery.totalDefault, 0);
    const totalRecoveries = portfolioResults.reduce((sum, r) => sum + r.recovery.totalRecovery, 0);
    const totalNBV = portfolioResults.reduce((sum, r) => sum + r.nbv.totalNBV, 0);
    const totalLLP = portfolioResults.reduce((sum, r) => sum + r.nbv.totalLLP, 0);
    
    console.log('\nPortfolio Summary:');
    console.log(`- Total defaults: €${totalDefaults}M`);
    console.log(`- Total recoveries: €${totalRecoveries.toFixed(2)}M`);
    console.log(`- Portfolio recovery rate: ${(totalRecoveries/totalDefaults*100).toFixed(2)}%`);
    console.log(`- Total NBV: €${totalNBV.toFixed(2)}M`);
    console.log(`- Total LLP: €${totalLLP.toFixed(2)}M`);
    console.log(`- NPV adjustment: €${(totalRecoveries - totalNBV).toFixed(2)}M`);
    
    // Assertions
    expect(recovery1.weightedRecoveryRate).toBeGreaterThan(70);
    expect(recovery2.weightedRecoveryRate).toBeGreaterThan(85);
    expect(recovery3.weightedRecoveryRate).toBeCloseTo(55, 10); // 100% - 45% LGD
    
    expect(nbv1.totalNBV).toBeLessThan(recovery1.totalRecovery); // Due to discounting
    expect(nbv2.components).toHaveLength(2); // State guarantee + collateral
    expect(nbv3.impliedRecoveryRate).toBeLessThan(recovery3.weightedRecoveryRate); // Due to discounting
  });

  test('Recovery schedule timing', () => {
    console.log('\n=== RECOVERY SCHEDULE TIMING TEST ===');
    
    const product = {
      name: 'Mixed Recovery Product',
      ltv: 60,
      collateralHaircut: 20,
      recoveryCosts: 10,
      timeToRecover: 20,
      stateGuaranteeType: 'present',
      stateGuaranteeCoverage: 50,
      stateGuaranteeRecoveryTime: 4
    };
    
    const defaultAmount = 100;
    const recovery = calculateDefaultRecovery(defaultAmount, product);
    
    console.log('\nRecovery Timeline:');
    recovery.recoverySchedule.forEach(item => {
      console.log(`Quarter ${item.quarter}: €${item.amount.toFixed(2)}M - ${item.description}`);
    });
    
    // Verify schedule
    expect(recovery.recoverySchedule).toHaveLength(2); // State + collateral
    expect(recovery.recoverySchedule[0].quarter).toBe(4); // State guarantee first
    expect(recovery.recoverySchedule[1].quarter).toBe(20); // Collateral later
    
    // Calculate NPV impact of timing
    const nbv = calculateNBV(defaultAmount, product, quarterlyRate);
    
    console.log('\nTiming Impact on NPV:');
    nbv.components.forEach(comp => {
      const discount = 1 - (1 / comp.discountFactor);
      console.log(`- ${comp.type}: ${(discount * 100).toFixed(2)}% discount over ${comp.recoveryTime} quarters`);
    });
  });
});