import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly.js';

describe('RE Division NPL Test', () => {
  test('Sum of all RE products NPL should explain the €60M', () => {
    console.log('\n=== RE DIVISION COMPLETE NPL TEST ===');
    
    // Define all RE products based on defaultAssumptions.js
    const reProducts = {
      reSecuritization: {
        name: 'Securitization Finanziamenti Immobiliari',
        volumes: { y1: 100, y2: 0, y3: 0, y4: 0, y5: 0 },
        avgLoanSize: 250.0,
        spread: 3.8,
        rwaDensity: 70,
        durata: 20,
        commissionRate: 1.5,
        dangerRate: 2.5,
        defaultAfterQuarters: 4,
        ltv: 60.0,
        recoveryCosts: 15.0,
        collateralHaircut: 20.0,
        type: 'french_no_grace',
        gracePeriod: 0,
        timeToRecover: 12,
        stateGuaranteeType: 'none',
        stateGuaranteeCoverage: 0,
        isUnsecured: false
      },
      reMortgage: {
        name: 'Mutui Residenziali',
        volumes: { y1: 50, y2: 0, y3: 0, y4: 0, y5: 0 },
        avgLoanSize: 0.3,
        spread: 2.8,
        rwaDensity: 50,
        durata: 80,
        commissionRate: 0.5,
        dangerRate: 1.2,
        defaultAfterQuarters: 4,
        ltv: 70.0,
        recoveryCosts: 10.0,
        collateralHaircut: 20.0,
        type: 'french_no_grace',
        gracePeriod: 0,
        timeToRecover: 16,
        stateGuaranteeType: 'none',
        stateGuaranteeCoverage: 0,
        isUnsecured: false
      },
      reBridge: {
        name: 'Finanziamenti Corporate Bridge Loan',
        volumes: { y1: 80, y2: 0, y3: 0, y4: 0, y5: 0 },
        avgLoanSize: 15.0,
        spread: 4.2,
        rwaDensity: 85,
        durata: 8,
        commissionRate: 2.5,
        dangerRate: 3.5,  // As per defaultAssumptions, not 50%
        defaultAfterQuarters: 4,
        ltv: 70.0,
        recoveryCosts: 18.0,
        collateralHaircut: 25.0,
        type: 'bullet',
        gracePeriod: 0,
        timeToRecover: 12,
        stateGuaranteeType: 'none',
        stateGuaranteeCoverage: 0,
        isUnsecured: false
      }
    };
    
    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0]
    };
    
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Calculate each product
    const results = {};
    let totalNPL = 0;
    
    console.log('\nProduct Analysis:');
    console.log('Product Name                           | Y1 Volume | Danger Rate | Default | NBV      | Max NPL');
    console.log('--------------------------------------|-----------|-------------|---------|----------|--------');
    
    for (const [key, product] of Object.entries(reProducts)) {
      const productResult = calculateCreditProductQuarterly(product, assumptions, years);
      results[key] = productResult;
      
      // Find max NPL over time
      const maxNPL = Math.max(...productResult.quarterly.nplStock);
      const q4Defaults = productResult.quarterly.newNPLs[4] || 0;
      const q4NPL = productResult.quarterly.nplStock[4] || 0;
      
      totalNPL += maxNPL;
      
      console.log(
        `${product.name.padEnd(37)} | ` +
        `€${product.volumes.y1.toString().padStart(7)}M | ` +
        `${product.dangerRate.toString().padStart(10)}% | ` +
        `€${q4Defaults.toFixed(1).padStart(6)}M | ` +
        `€${q4NPL.toFixed(1).padStart(7)}M | ` +
        `€${maxNPL.toFixed(1).padStart(6)}M`
      );
    }
    
    console.log('--------------------------------------|-----------|-------------|---------|----------|--------');
    console.log(`${'TOTAL RE DIVISION'.padEnd(37)} | €${230}M |             |         |          | €${totalNPL.toFixed(1).padStart(6)}M`);
    
    // Check if this matches the €60M the user sees
    console.log('\n--- ANALYSIS ---');
    console.log(`Total RE Division NPL: €${totalNPL.toFixed(1)}M`);
    console.log(`User reported: €60M`);
    
    if (Math.abs(totalNPL - 60) < 5) {
      console.log('✅ This matches the user-reported value');
    } else {
      console.log('❌ This does NOT match the user-reported value');
      console.log('\nPossible explanations:');
      console.log('1. User may have modified danger rates in the UI');
      console.log('2. There may be additional products not in defaultAssumptions');
      console.log('3. The aggregation logic may be different');
    }
    
    // Test with 50% danger rate on bridge loan as user mentioned
    console.log('\n--- SCENARIO: Bridge Loan with 50% Danger Rate ---');
    const bridgeWith50 = { ...reProducts.reBridge, dangerRate: 50.0 };
    const bridgeResult50 = calculateCreditProductQuarterly(bridgeWith50, assumptions, years);
    const maxNPL50 = Math.max(...bridgeResult50.quarterly.nplStock);
    
    console.log(`Bridge loan NPL with 3.5% danger rate: €${Math.max(...results.reBridge.quarterly.nplStock).toFixed(1)}M`);
    console.log(`Bridge loan NPL with 50% danger rate: €${maxNPL50.toFixed(1)}M`);
    
    const totalWith50 = totalNPL - Math.max(...results.reBridge.quarterly.nplStock) + maxNPL50;
    console.log(`\nTotal RE Division with 50% bridge danger rate: €${totalWith50.toFixed(1)}M`);
    
    if (Math.abs(totalWith50 - 60) < 5) {
      console.log('✅ This matches! User must have set bridge loan danger rate to 50%');
    }
  });
});