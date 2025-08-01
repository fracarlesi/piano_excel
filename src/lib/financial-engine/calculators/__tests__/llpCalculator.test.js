import { calculateLLP, calculateAnnualLLP, createLLPReport } from '../llpCalculator';

describe('LLP Calculator Tests', () => {
  test('Calculate quarterly LLP with standard parameters', () => {
    const params = {
      performingStock: 100,
      dangerRate: 10, // 10% annual
      productParameters: {
        ltv: 80,
        collateralHaircut: 20,
        recoveryCosts: 10,
        timeToRecover: 1,
        dangerRate: 10
      },
      quarterlyInterestRate: 0.0125 // 5% annual / 4
    };
    
    const result = calculateLLP(params);
    
    console.log('\n=== LLP CALCULATION TEST ===');
    console.log(`Performing Stock: €${params.performingStock}M`);
    console.log(`Danger Rate: ${params.dangerRate}% annual`);
    console.log(`Quarterly Default Rate: ${params.dangerRate/4}%`);
    console.log('\nResults:');
    console.log(`New Defaults: €${result.newDefaults.toFixed(3)}M`);
    console.log(`Expected Recovery: €${result.expectedRecovery.toFixed(3)}M`);
    console.log(`Recovery NPV: €${result.recoveryNPV.toFixed(3)}M`);
    console.log(`LLP: €${result.llp.toFixed(3)}M`);
    
    // Verify calculations
    expect(result.newDefaults).toBeCloseTo(2.5, 2); // 100 * 10% / 4
    expect(result.llp).toBeGreaterThan(0); // Should have positive LLP
    expect(result.recoveryNPV).toBeLessThan(result.expectedRecovery); // NPV < nominal
  });
  
  test('Calculate LLP with state guarantees', () => {
    const params = {
      performingStock: 100,
      dangerRate: 10,
      productParameters: {
        ltv: 80,
        collateralHaircut: 20,
        recoveryCosts: 10,
        timeToRecover: 1,
        dangerRate: 10,
        stateGuaranteeType: 'present',
        stateGuaranteeCoverage: 80 // 80% coverage
      },
      quarterlyInterestRate: 0.0125
    };
    
    const result = calculateLLP(params);
    
    console.log('\n=== LLP WITH STATE GUARANTEES ===');
    console.log(`State Guarantee Coverage: ${params.productParameters.stateGuaranteeCoverage}%`);
    console.log(`LLP with guarantees: €${result.llp.toFixed(3)}M`);
    console.log(`State Guarantee Recovery: €${result.details.stateGuaranteeRecovery.toFixed(3)}M`);
    
    // LLP should be much lower with 80% state guarantee
    expect(result.llp).toBeLessThan(0.5); // Much lower than without guarantees
  });
  
  test('Annual LLP aggregation', () => {
    const quarterlyResults = [
      { llp: 0.5 },
      { llp: 0.6 },
      { llp: 0.7 },
      { llp: 0.8 }
    ];
    
    const annualLLP = calculateAnnualLLP(quarterlyResults);
    
    expect(annualLLP).toBeCloseTo(2.6, 2);
  });
  
  test('Create LLP report', () => {
    const quarterlyResults = [
      {
        newDefaults: 2.5,
        recoveryNPV: 2.0,
        llp: 0.5,
        details: { performingStock: 100 }
      },
      {
        newDefaults: 2.4,
        recoveryNPV: 1.9,
        llp: 0.5,
        details: { performingStock: 98 }
      },
      {
        newDefaults: 2.3,
        recoveryNPV: 1.8,
        llp: 0.5,
        details: { performingStock: 96 }
      },
      {
        newDefaults: 2.2,
        recoveryNPV: 1.7,
        llp: 0.5,
        details: { performingStock: 94 }
      }
    ];
    
    const report = createLLPReport(quarterlyResults, 0);
    
    console.log('\n=== ANNUAL LLP REPORT ===');
    console.log(`Year: ${report.year}`);
    console.log(`Total Defaults: €${report.totalDefaults.toFixed(2)}M`);
    console.log(`Total Recovery NPV: €${report.totalRecoveryNPV.toFixed(2)}M`);
    console.log(`Total LLP: €${report.totalLLP.toFixed(2)}M`);
    console.log(`Coverage Ratio: ${report.coverageRatio.toFixed(1)}%`);
    
    expect(report.totalDefaults).toBeCloseTo(9.4, 1);
    expect(report.totalLLP).toBeCloseTo(2.0, 1);
  });
});