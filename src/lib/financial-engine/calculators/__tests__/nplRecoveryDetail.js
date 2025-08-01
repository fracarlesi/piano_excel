import { calculateCreditProduct } from '../creditCalculator';

describe('NPL Recovery Detailed Analysis', () => {
  test('Analyze NPL creation and recovery flow', () => {
    const product = {
      name: 'NPL Recovery Analysis',
      type: 'bullet',
      durata: 2, // 2 year bullet
      spread: 4.5,
      dangerRate: 10, // 10% annual default
      rwaDensity: 80,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1, // 1 year recovery
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €100M in year 0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4];
    const result = calculateCreditProduct(product, assumptions, years);

    console.log('\n=== NPL RECOVERY DETAILED ANALYSIS ===');
    console.log('Loan: €100M, LTV: 70%, Recovery costs: 15%, Haircut: 25%');
    console.log('Time to recover: 1 year, Danger rate: 10%');
    
    // Calculate expected recovery
    console.log('\n--- EXPECTED RECOVERY CALCULATION ---');
    const defaultAmount = 10; // €10M default
    const collateralValue = defaultAmount / 0.7; // LTV 70%
    console.log(`Default amount: €${defaultAmount}M`);
    console.log(`Collateral value: €${collateralValue.toFixed(2)}M`);
    
    const valueAfterHaircut = collateralValue * 0.75; // 25% haircut
    console.log(`After 25% haircut: €${valueAfterHaircut.toFixed(2)}M`);
    
    const recoveryCosts = defaultAmount * 0.15;
    console.log(`Recovery costs (15%): €${recoveryCosts.toFixed(2)}M`);
    
    const netRecovery = valueAfterHaircut - recoveryCosts;
    console.log(`Net recovery: €${netRecovery.toFixed(2)}M`);
    
    const discountRate = 0.08; // 8% annual
    const npvRecovery = netRecovery / (1 + discountRate);
    console.log(`NPV of recovery (1 year): €${npvRecovery.toFixed(2)}M`);
    
    const llp = defaultAmount - npvRecovery;
    console.log(`LLP: €${llp.toFixed(2)}M`);
    console.log(`NPL stock (NBV): €${npvRecovery.toFixed(2)}M`);
    
    // Track what happens each year
    console.log('\n--- YEAR BY YEAR TRACKING ---');
    for (let i = 0; i < 5; i++) {
      const performing = result.performingAssets[i];
      const nplStock = result.nonPerformingAssets[i];
      const newNPLs = result.newNPLs[i];
      const llp = result.llp[i];
      
      console.log(`\nYear ${i}:`);
      console.log(`  Performing: €${performing.toFixed(2)}M`);
      console.log(`  NPL stock: €${nplStock.toFixed(2)}M`);
      console.log(`  New NPLs: €${newNPLs.toFixed(2)}M`);
      console.log(`  LLP: €${llp.toFixed(2)}M`);
      
      if (i > 0) {
        const nplChange = nplStock - result.nonPerformingAssets[i-1];
        if (nplChange < 0) {
          console.log(`  => NPL reduction: €${(-nplChange).toFixed(2)}M`);
        } else {
          console.log(`  => NPL increase: €${nplChange.toFixed(2)}M`);
        }
      }
    }
    
    // Analyze the problem
    console.log('\n--- PROBLEM ANALYSIS ---');
    console.log('The issue is that new NPLs are being created continuously');
    console.log('from the remaining performing stock, even after the original loan matures.');
    
    // Check performing stock after maturity
    console.log('\n--- PERFORMING STOCK AFTER MATURITY ---');
    console.log('2-year bullet loan should have 0 performing stock after year 2');
    for (let i = 2; i < 5; i++) {
      console.log(`Year ${i}: Performing stock €${result.performingAssets[i].toFixed(2)}M`);
    }
  });
});