import { calculateCreditProduct } from '../creditCalculator';

describe('Bridge Financing Interest Anomaly', () => {
  test('Compare interest income with 0% vs 100% danger rate', () => {
    const baseProduct = {
      name: 'Bridge Financing Test',
      type: 'bullet',
      durata: 1, // 12 months
      spread: 4.0, // To get ~7.5% total rate
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €100M in year 0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2];
    
    // Test with 0% danger rate
    const product0 = { ...baseProduct, dangerRate: 0 };
    const result0 = calculateCreditProduct(product0, assumptions, years);
    
    // Test with 100% danger rate
    const product100 = { ...baseProduct, dangerRate: 100 };
    const result100 = calculateCreditProduct(product100, assumptions, years);
    
    console.log('\n=== BRIDGE FINANCING INTEREST ANOMALY TEST ===');
    console.log('Product: €100M, 1-year bullet, 7.5% rate\n');
    
    console.log('WITH 0% DANGER RATE:');
    console.log(`Year 0 - Performing: €${result0.performingAssets[0].toFixed(1)}M`);
    console.log(`Year 0 - Interest: €${result0.interestIncome[0].toFixed(2)}M`);
    console.log(`Year 1 - Performing: €${result0.performingAssets[1].toFixed(1)}M`);
    console.log(`Year 1 - Interest: €${result0.interestIncome[1].toFixed(2)}M`);
    console.log(`Total Interest (Y0+Y1): €${(result0.interestIncome[0] + result0.interestIncome[1]).toFixed(2)}M`);
    
    console.log('\nWITH 100% DANGER RATE:');
    console.log(`Year 0 - Performing: €${result100.performingAssets[0].toFixed(1)}M`);
    console.log(`Year 0 - NPL Stock: €${result100.nonPerformingAssets[0].toFixed(1)}M`);
    console.log(`Year 0 - Interest: €${result100.interestIncome[0].toFixed(2)}M`);
    console.log(`Year 1 - Performing: €${result100.performingAssets[1].toFixed(1)}M`);
    console.log(`Year 1 - NPL Stock: €${result100.nonPerformingAssets[1].toFixed(1)}M`);
    console.log(`Year 1 - Interest: €${result100.interestIncome[1].toFixed(2)}M`);
    console.log(`Total Interest (Y0+Y1): €${(result100.interestIncome[0] + result100.interestIncome[1]).toFixed(2)}M`);
    
    console.log('\n--- ANOMALY ANALYSIS ---');
    const interestDiff = result100.interestIncome[0] - result0.interestIncome[0];
    console.log(`Year 0 Interest Difference: €${interestDiff.toFixed(2)}M`);
    
    if (interestDiff > 0) {
      console.log('❌ ANOMALY: 100% danger rate generates MORE interest!');
      console.log('\nPossible cause: NPLs are generating interest at the same rate as performing loans');
      
      // Calculate what portion is from NPLs
      const nplInterest = result100.nonPerformingAssets[0] * 0.075; // Assuming 7.5% rate
      console.log(`Estimated NPL interest contribution: €${nplInterest.toFixed(2)}M`);
    } else {
      console.log('✅ CORRECT: 100% danger rate generates less interest');
    }
    
    // Additional checks
    console.log('\n--- DETAILED BREAKDOWN ---');
    console.log('Average Performing Stock:');
    console.log(`0% danger: €${result0.averagePerformingAssets[0].toFixed(1)}M`);
    console.log(`100% danger: €${result100.averagePerformingAssets[0].toFixed(1)}M`);
  });
});