import { calculateCreditProduct } from '../creditCalculator';

describe('Balance Sheet Reconciliation Test', () => {
  test('Verify that Performing + NPL(gross) = Original loan amount', () => {
    const product = {
      name: 'Balance Reconciliation Test',
      type: 'bullet',
      durata: 1,
      spread: 4.0,
      dangerRate: 100, // 100% danger rate for maximum NPL
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
      quarterlyAllocation: [100, 0, 0, 0],
      taxRate: 30
    };

    const years = [0];
    const result = calculateCreditProduct(product, assumptions, years);
    
    console.log('\n=== BALANCE SHEET RECONCILIATION ===');
    console.log('Original Loan: €100M');
    console.log('Product: 1-year bullet, 100% danger rate\n');
    
    // Get the values
    const performing = result.performingAssets[0];
    const nplNBV = result.nonPerformingAssets[0];
    const llp = Math.abs(result.llp[0]);
    const newNPLs = result.newNPLs[0];
    
    console.log('End of Year 0:');
    console.log(`Performing Assets: €${performing.toFixed(2)}M`);
    console.log(`NPL (NBV): €${nplNBV.toFixed(2)}M`);
    console.log(`LLP (provisions): €${llp.toFixed(2)}M`);
    console.log(`New NPLs (gross): €${newNPLs.toFixed(2)}M`);
    
    // Calculate gross NPL
    const nplGross = nplNBV + llp;
    console.log(`\nNPL Gross (NBV + LLP): €${nplGross.toFixed(2)}M`);
    
    // Total should equal original loan
    const total = performing + nplGross;
    console.log(`\nTotal (Performing + NPL Gross): €${total.toFixed(2)}M`);
    
    // Verification
    console.log('\n--- RECONCILIATION CHECK ---');
    console.log(`Original loan: €100.00M`);
    console.log(`Accounted for: €${total.toFixed(2)}M`);
    console.log(`Difference: €${(100 - total).toFixed(2)}M`);
    
    // Detailed breakdown
    console.log('\n--- QUARTERLY FLOW ---');
    console.log('Expected with 100% danger rate (25% per quarter):');
    console.log('Q1: €100M performing → €25M defaults → €75M performing');
    console.log('Q2: €75M performing → €18.75M defaults → €56.25M performing');
    console.log('Q3: €56.25M performing → €14.06M defaults → €42.19M performing');
    console.log('Q4: €42.19M performing → €10.55M defaults → €31.64M performing');
    console.log('Total defaults: €68.36M (but we see different)');
    
    // Check if it's a bullet loan maturity issue
    console.log('\n--- MATURITY CHECK ---');
    console.log('This is a 1-year bullet loan');
    console.log('At end of year 0, loan hasn\'t matured yet');
    console.log('All €100M should still be on balance sheet');
    
    // The accounting identity
    console.log('\n--- ACCOUNTING IDENTITY ---');
    console.log('For any loan at any time:');
    console.log('Original Amount = Performing + Defaults');
    console.log('Defaults = NPL Gross = NPL NBV + LLP');
    console.log('Therefore: Original = Performing + NPL NBV + LLP');
    
    // Test the identity
    const accountingIdentity = performing + nplNBV + llp;
    console.log(`\nChecking: ${performing.toFixed(2)} + ${nplNBV.toFixed(2)} + ${llp.toFixed(2)} = ${accountingIdentity.toFixed(2)}`);
    
    if (Math.abs(accountingIdentity - 100) > 0.01) {
      console.log('\n❌ PROBLEM: Balance sheet doesn\'t reconcile!');
      console.log('This suggests some defaults are being lost or double-counted');
      
      // Try to find the issue
      console.log('\n--- INVESTIGATING ---');
      console.log(`New NPLs reported: €${newNPLs.toFixed(2)}M`);
      console.log(`But NPL Gross (NBV + LLP): €${nplGross.toFixed(2)}M`);
      if (Math.abs(newNPLs - nplGross) > 0.01) {
        console.log('⚠️  New NPLs don\'t match NPL Gross!');
      }
    } else {
      console.log('\n✅ Balance sheet reconciles correctly');
    }
    
    // Assertion
    expect(performing + nplNBV + llp).toBeCloseTo(100, 1);
  });
});