import { calculateCreditProduct } from '../creditCalculator';

describe('Bridge Financing Detailed Analysis', () => {
  test('Analyze interest calculation with 100% danger rate', () => {
    const product = {
      name: 'Bridge Financing',
      type: 'bullet',
      durata: 1, // 1 year
      spread: 4.0,
      dangerRate: 100, // 100% danger rate
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1];
    const result = calculateCreditProduct(product, assumptions, years);
    
    console.log('\n=== BRIDGE FINANCING 100% DANGER RATE ANALYSIS ===');
    console.log('€100M, 1-year bullet, 7.5% rate, 100% danger rate\n');
    
    // Quarterly breakdown for Year 0
    console.log('QUARTERLY BREAKDOWN - YEAR 0:');
    
    // Q1: €100M disbursed, 25% defaults
    const q1Defaults = 100 * 0.25; // 100% annual / 4
    const q1NPL_NBV = q1Defaults * 0.8; // Approximate NBV ratio
    console.log('Q1: €100M disbursed');
    console.log(`    Defaults: €${q1Defaults}M`);
    console.log(`    NPL (NBV): ~€${q1NPL_NBV}M`);
    
    // Interest calculation
    console.log('\nINTEREST CALCULATION:');
    console.log('Quarterly rate: 7.5% / 4 = 1.875%');
    
    // Average performing stock calculation
    const avgPerforming = result.averagePerformingAssets[0];
    console.log(`\nAverage Performing Stock: €${avgPerforming.toFixed(2)}M`);
    console.log(`Interest on Performing: €${(avgPerforming * 0.075).toFixed(2)}M`);
    
    // NPL interest
    const totalInterest = result.interestIncome[0];
    const performingInterest = avgPerforming * 0.075;
    const nplInterest = totalInterest - performingInterest;
    
    console.log(`\nNPL Stock (NBV): €${result.nonPerformingAssets[0].toFixed(2)}M`);
    console.log(`Interest on NPL: €${nplInterest.toFixed(2)}M`);
    console.log(`Total Interest: €${totalInterest.toFixed(2)}M`);
    
    // Verify the 8.59M claim
    console.log('\n--- VERIFICATION OF 8.59M CLAIM ---');
    console.log(`Actual Year 0 Interest: €${totalInterest.toFixed(2)}M`);
    console.log(`Expected with 0% danger: ~€5.63M (7.5% on €75M avg)`);
    
    // The issue analysis
    console.log('\n--- ISSUE ANALYSIS ---');
    console.log('With 100% danger rate on 1-year bullet:');
    console.log('- Q1: 25% defaults immediately');
    console.log('- Q2-Q4: Continued defaults on remaining performing');
    console.log('- NPLs accumulate and generate interest on NBV');
    console.log('- But loan matures at end of year 1');
    
    // Check if interest continues after maturity
    console.log('\n--- YEAR 1 CHECK ---');
    console.log(`Year 1 Performing: €${result.performingAssets[1].toFixed(2)}M`);
    console.log(`Year 1 NPL: €${result.nonPerformingAssets[1].toFixed(2)}M`);
    console.log(`Year 1 Interest: €${result.interestIncome[1].toFixed(2)}M`);
    
    if (result.interestIncome[1] > 0.1) {
      console.log('⚠️  WARNING: Interest continues after maturity!');
    }
    
    // The real issue
    console.log('\n--- ROOT CAUSE ---');
    const avgNPL = result.nonPerformingAssets[0] / 2; // Rough average
    const expectedNPLInterest = avgNPL * 0.075;
    console.log(`Average NPL (NBV) in Year 0: ~€${avgNPL.toFixed(2)}M`);
    console.log(`Expected NPL Interest: ~€${expectedNPLInterest.toFixed(2)}M`);
    
    console.log('\nThe counter-intuitive result occurs because:');
    console.log('1. Defaults happen gradually over 4 quarters');
    console.log('2. NPLs accumulate and generate interest on NBV');
    console.log('3. Total assets earning interest (performing + NPL) remain high');
    console.log('4. Only LLP reduces the interest-bearing base');
    
    // Show the math
    const totalAssets = result.performingAssets[0] + result.nonPerformingAssets[0];
    console.log(`\nTotal interest-bearing assets: €${totalAssets.toFixed(2)}M`);
    console.log('This explains why interest is higher than expected');
  });
});