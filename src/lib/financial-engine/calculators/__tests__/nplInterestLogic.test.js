import { calculateCreditProduct } from '../creditCalculator';

describe('NPL Interest Logic - Correct Base Reduction', () => {
  test('100% danger rate MUST generate LESS interest than 0% danger rate', () => {
    // Common product configuration for bridge financing
    const baseProduct = {
      name: 'Bridge Financing Test',
      type: 'bullet',
      durata: 1, // 12 months
      spread: 4.0, // To get 7.5% total rate with euribor 3.5%
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
      quarterlyAllocation: [100, 0, 0, 0], // All disbursed in Q1
      taxRate: 30
    };

    const years = [0, 1];
    
    // Calculate with 0% danger rate
    const product_0_percent = { ...baseProduct, dangerRate: 0 };
    const result_0_percent_dr = calculateCreditProduct(product_0_percent, assumptions, years);
    
    // Calculate with 100% danger rate
    const product_100_percent = { ...baseProduct, dangerRate: 100 };
    const result_100_percent_dr = calculateCreditProduct(product_100_percent, assumptions, years);
    
    console.log('\n=== NPL INTEREST LOGIC TEST ===');
    console.log('Testing that defaults REDUCE the interest-bearing base\n');
    
    console.log('Scenario: €100M Bridge Financing, 1 year, 7.5% rate');
    console.log('Expected: 100% danger rate → LESS total interest\n');
    
    // Interest comparison
    const interest_0_dr = result_0_percent_dr.interestIncome[0];
    const interest_100_dr = result_100_percent_dr.interestIncome[0];
    
    console.log(`Interest with 0% danger rate: €${interest_0_dr.toFixed(2)}M`);
    console.log(`Interest with 100% danger rate: €${interest_100_dr.toFixed(2)}M`);
    console.log(`Difference: €${(interest_100_dr - interest_0_dr).toFixed(2)}M`);
    
    // Asset breakdown with 0% danger
    console.log('\n--- 0% DANGER RATE ---');
    console.log(`Performing Assets: €${result_0_percent_dr.performingAssets[0].toFixed(2)}M`);
    console.log(`NPL Assets (NBV): €${result_0_percent_dr.nonPerformingAssets[0].toFixed(2)}M`);
    console.log(`Total Interest-Bearing: €${(result_0_percent_dr.performingAssets[0] + result_0_percent_dr.nonPerformingAssets[0]).toFixed(2)}M`);
    
    // Asset breakdown with 100% danger
    console.log('\n--- 100% DANGER RATE ---');
    console.log(`Performing Assets: €${result_100_percent_dr.performingAssets[0].toFixed(2)}M`);
    console.log(`NPL Assets (NBV): €${result_100_percent_dr.nonPerformingAssets[0].toFixed(2)}M`);
    const totalInterestBearing100 = result_100_percent_dr.performingAssets[0] + result_100_percent_dr.nonPerformingAssets[0];
    console.log(`Total Interest-Bearing: €${totalInterestBearing100.toFixed(2)}M`);
    
    // The problem
    console.log('\n--- THE PROBLEM ---');
    if (totalInterestBearing100 > 90) {
      console.log('❌ Total interest-bearing base is too high!');
      console.log('This suggests double-counting: defaults are not properly reducing performing stock');
    }
    
    // Expected behavior
    console.log('\n--- EXPECTED BEHAVIOR ---');
    console.log('When €25M defaults in Q1:');
    console.log('- Performing should drop by €25M (to €75M)');
    console.log('- NPL (NBV) should increase by ~€20M');
    console.log('- Total interest-bearing base should be €75M + €20M = €95M');
    console.log('- NOT €100M + €20M = €120M (double counting)');
    
    // THE CRITICAL ASSERTION - This MUST pass after fix
    console.log('\n--- CRITICAL TEST ---');
    if (interest_100_dr < interest_0_dr) {
      console.log('✅ PASS: 100% danger rate generates LESS interest');
    } else {
      console.log('❌ FAIL: 100% danger rate generates MORE interest (WRONG!)');
    }
    
    // This assertion should FAIL with current code and PASS after fix
    expect(result_100_percent_dr.interestIncome[0]).toBeLessThan(result_0_percent_dr.interestIncome[0]);
    
    // Additional check: total interest-bearing assets should decrease with defaults
    const totalBase0 = result_0_percent_dr.performingAssets[0] + result_0_percent_dr.nonPerformingAssets[0];
    const totalBase100 = result_100_percent_dr.performingAssets[0] + result_100_percent_dr.nonPerformingAssets[0];
    
    console.log('\n--- SECONDARY CHECK ---');
    console.log(`Total base with 0% danger: €${totalBase0.toFixed(2)}M`);
    console.log(`Total base with 100% danger: €${totalBase100.toFixed(2)}M`);
    
    expect(totalBase100).toBeLessThan(totalBase0);
  });
});