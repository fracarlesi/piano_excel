import { calculateCreditProduct } from '../creditCalculator';
import { calculateNPLInterestByCohort, verifyNPLInterestCalculation } from '../nplInterestCalculator';

describe('NPL Interest Calculation Verification', () => {
  test('Verify NPL interest is calculated on NBV not gross amount', () => {
    const product = {
      name: 'NPL Interest Test',
      type: 'bullet',
      durata: 3,
      spread: 4.0,
      dangerRate: 20, // 20% to generate significant NPLs
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 2,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [25, 25, 25, 25],
      taxRate: 30
    };

    const years = [0, 1, 2];
    const result = calculateCreditProduct(product, assumptions, years);
    
    console.log('\n=== NPL INTEREST VERIFICATION TEST ===');
    console.log('Testing that NPL interest is calculated on NBV, not gross\n');
    
    // Analyze Year 0
    const year = 0;
    const performingAssets = result.performingAssets[year];
    const nplNBV = result.nonPerformingAssets[year];
    const newNPLs = result.newNPLs[year];
    const llp = Math.abs(result.llp[year]);
    const totalInterest = result.interestIncome[year];
    
    console.log('Year 0 Analysis:');
    console.log(`Performing Assets: €${performingAssets.toFixed(2)}M`);
    console.log(`New NPLs (Gross): €${newNPLs.toFixed(2)}M`);
    console.log(`LLP (Provisions): €${llp.toFixed(2)}M`);
    console.log(`NPL Stock (NBV): €${nplNBV.toFixed(2)}M`);
    console.log(`Total Interest Income: €${totalInterest.toFixed(2)}M`);
    
    // Verify NBV calculation
    console.log('\n--- NBV VERIFICATION ---');
    const impliedNBV = newNPLs - llp;
    console.log(`Gross NPLs - LLP = NBV`);
    console.log(`${newNPLs.toFixed(2)} - ${llp.toFixed(2)} = ${impliedNBV.toFixed(2)}`);
    console.log(`Actual NBV: ${nplNBV.toFixed(2)}`);
    console.log(`Match: ${Math.abs(impliedNBV - nplNBV) < 0.1 ? '✅' : '❌'}`);
    
    // Calculate expected interest breakdown
    const interestRate = 0.075; // 7.5% annual rate
    const avgPerforming = result.averagePerformingAssets[year];
    
    console.log('\n--- INTEREST BREAKDOWN ---');
    console.log(`Average Performing: €${avgPerforming.toFixed(2)}M`);
    console.log(`Interest Rate: ${(interestRate * 100).toFixed(1)}%`);
    
    // Expected interest on performing
    const expectedPerformingInterest = avgPerforming * interestRate;
    console.log(`Expected Interest on Performing: €${expectedPerformingInterest.toFixed(2)}M`);
    
    // If NPL interest exists, it should be on NBV
    const impliedNPLInterest = totalInterest - expectedPerformingInterest;
    console.log(`Implied NPL Interest: €${impliedNPLInterest.toFixed(2)}M`);
    
    if (impliedNPLInterest > 0.01 && nplNBV > 0) {
      const impliedNPLRate = impliedNPLInterest / nplNBV;
      console.log(`Implied NPL Interest Rate: ${(impliedNPLRate * 100).toFixed(1)}%`);
      
      // This should be close to the product rate if calculated correctly
      const rateCheck = Math.abs(impliedNPLRate - interestRate) < 0.02;
      console.log(`Rate consistency check: ${rateCheck ? '✅' : '❌'}`);
    }
    
    // Test the verification function
    const verification = verifyNPLInterestCalculation({
      grossNPL: newNPLs,
      nbvNPL: nplNBV,
      llpAmount: llp,
      calculatedInterest: impliedNPLInterest,
      interestRate: interestRate
    });
    
    console.log('\n--- VERIFICATION RESULTS ---');
    console.log(verification.message);
    
    // Compare with high danger rate scenario
    console.log('\n--- HIGH DANGER RATE COMPARISON ---');
    const highDangerProduct = { ...product, dangerRate: 80 };
    const highDangerResult = calculateCreditProduct(highDangerProduct, assumptions, years);
    
    const hdPerforming = highDangerResult.performingAssets[0];
    const hdNPL = highDangerResult.nonPerformingAssets[0];
    const hdInterest = highDangerResult.interestIncome[0];
    
    console.log(`80% Danger Rate Results:`);
    console.log(`Performing: €${hdPerforming.toFixed(2)}M`);
    console.log(`NPL (NBV): €${hdNPL.toFixed(2)}M`);
    console.log(`Total Interest: €${hdInterest.toFixed(2)}M`);
    
    // Interest should NOT increase proportionally with NPLs
    const interestRatio = hdInterest / totalInterest;
    console.log(`\nInterest ratio (80% vs 20% danger): ${interestRatio.toFixed(2)}x`);
    
    if (interestRatio > 1.2) {
      console.log('⚠️  WARNING: High danger rate generates too much interest!');
      console.log('This suggests NPL interest might be calculated on gross instead of NBV');
    } else {
      console.log('✅ Interest calculation appears correct');
    }
  });
});