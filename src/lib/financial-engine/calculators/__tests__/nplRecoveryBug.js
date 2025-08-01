import { calculateCreditProduct } from '../creditCalculator';

describe('NPL Recovery Bug - Recovery Not Happening', () => {
  test('NPL should be recovered after timeToRecover period', () => {
    const product = {
      name: 'Test Recovery 1 Year',
      type: 'bullet',
      durata: 1,
      spread: 4.5,
      dangerRate: 10, // 10% to create significant NPLs
      rwaDensity: 80,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1, // 1 year recovery time
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €100M in year 0 only
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);

    console.log('\n=== NPL RECOVERY BUG TEST ===');
    console.log('Loan: €100M, Danger rate: 10%, Time to recover: 1 year');
    console.log('Expected: NPLs created in Y0 should be recovered in Y1');
    
    // Show NPL formation and recovery
    console.log('\n--- NPL STOCK BY YEAR ---');
    for (let i = 0; i < 10; i++) {
      const nplStock = result.nonPerformingAssets[i];
      const newNPLs = result.newNPLs[i];
      console.log(`Year ${i}: NPL stock €${nplStock.toFixed(2)}M, New NPLs €${newNPLs.toFixed(2)}M`);
    }
    
    // Show NPL interest
    console.log('\n--- NPL INTEREST CALCULATION ---');
    console.log('NPL interest should be calculated on NBV of NPL stock');
    console.log('With 8% rate, quarterly rate = 2%');
    
    // Calculate expected vs actual
    const rate = 0.08; // 8% annual
    for (let i = 0; i < 5; i++) {
      const nplStock = result.nonPerformingAssets[i];
      const expectedNPLInterest = nplStock * rate;
      console.log(`Year ${i}: NPL stock €${nplStock.toFixed(2)}M → Expected NPL interest €${expectedNPLInterest.toFixed(2)}M`);
    }
    
    // Check recovery timing
    console.log('\n--- RECOVERY TIMING CHECK ---');
    const y0NPL = result.nonPerformingAssets[0];
    const y1NPL = result.nonPerformingAssets[1];
    const y2NPL = result.nonPerformingAssets[2];
    
    console.log(`\nY0 NPL stock: €${y0NPL.toFixed(2)}M`);
    console.log(`Y1 NPL stock: €${y1NPL.toFixed(2)}M`);
    console.log(`Y2 NPL stock: €${y2NPL.toFixed(2)}M`);
    
    if (y1NPL < y0NPL) {
      console.log(`\n✅ Recovery detected in Y1: €${(y0NPL - y1NPL).toFixed(2)}M recovered`);
    } else {
      console.log(`\n⚠️  NO RECOVERY in Y1! NPL stock increased by €${(y1NPL - y0NPL).toFixed(2)}M`);
    }
    
    // Check if NPL stock eventually goes to zero
    let nplZeroYear = -1;
    for (let i = 0; i < 10; i++) {
      if (result.nonPerformingAssets[i] < 0.01) {
        nplZeroYear = i;
        break;
      }
    }
    
    if (nplZeroYear > 0) {
      console.log(`\nNPL stock reaches zero in year ${nplZeroYear}`);
    } else {
      console.log(`\n⚠️  NPL stock NEVER reaches zero in 10 years!`);
    }
  });

  test('Compare different recovery times', () => {
    const recoveryTimes = [0.5, 1, 2, 3];
    
    console.log('\n\n=== RECOVERY TIME COMPARISON ===');
    
    recoveryTimes.forEach(timeToRecover => {
      const product = {
        name: `Recovery ${timeToRecover}Y`,
        type: 'bullet',
        durata: 1,
        spread: 4.5,
        dangerRate: 10,
        rwaDensity: 80,
        commissionRate: 0,
        ltv: 70,
        recoveryCosts: 15,
        collateralHaircut: 25,
        timeToRecover: timeToRecover,
        volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      };

      const assumptions = {
        euribor: 3.5,
        ftpSpread: 1.5,
        quarterlyAllocation: [100, 0, 0, 0],
        taxRate: 30
      };

      const years = [0, 1, 2, 3, 4];
      const result = calculateCreditProduct(product, assumptions, years);
      
      console.log(`\n--- Time to Recover: ${timeToRecover} years ---`);
      for (let i = 0; i < 5; i++) {
        console.log(`Year ${i}: NPL stock €${result.nonPerformingAssets[i].toFixed(2)}M`);
      }
    });
  });
});