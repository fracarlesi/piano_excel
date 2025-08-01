import { calculateDefaultRecovery } from '../defaultRecoveryCalculator';
import { calculateNBV } from '../nbvCalculator';
import { processDangerRate } from '../dangerRateCalculator';

describe('RE Bridge Financing NBV Debug', () => {
  test('Debug NBV calculation for RE Bridge product', () => {
    console.log('\n=== RE BRIDGE FINANCING NBV DEBUG ===');
    
    // RE Bridge product configuration from defaultAssumptions.js
    const reBridge = {
      name: 'Finanziamenti Corporate Bridge Loan',
      volumes: { y1: 80, y10: 400 },
      avgLoanSize: 15.0,
      spread: 4.2,
      rwaDensity: 85,
      durata: 8, // 8 quarters (2 years)
      commissionRate: 2.5,
      dangerRate: 3.5,
      defaultAfterQuarters: 4,
      ltv: 70.0,
      recoveryCosts: 18.0,
      collateralHaircut: 25.0,
      type: 'bullet',
      gracePeriod: 0,
      timeToRecover: 12, // 12 quarters (3 years)
      stateGuaranteeType: 'none',
      stateGuaranteeCoverage: 0,
      stateGuaranteeRecoveryTime: 2,
      isUnsecured: false
    };
    
    console.log('\nProduct Configuration:');
    console.log(`- Name: ${reBridge.name}`);
    console.log(`- Type: ${reBridge.type}`);
    console.log(`- LTV: ${reBridge.ltv}%`);
    console.log(`- Collateral Haircut: ${reBridge.collateralHaircut}%`);
    console.log(`- Recovery Costs: ${reBridge.recoveryCosts}%`);
    console.log(`- Time to Recover: ${reBridge.timeToRecover} quarters`);
    console.log(`- Danger Rate: ${reBridge.dangerRate}%`);
    
    // Test different default amounts
    const testAmounts = [10, 50, 100];
    const quarterlyRate = 0.01875; // 7.5% annual / 4
    
    console.log(`\nQuarterly discount rate: ${(quarterlyRate * 100).toFixed(3)}%`);
    console.log(`Annual rate: ${(quarterlyRate * 4 * 100).toFixed(1)}%`);
    
    testAmounts.forEach(defaultAmount => {
      console.log(`\n--- DEFAULT AMOUNT: €${defaultAmount}M ---`);
      
      // Step 1: Calculate recovery details
      const recovery = calculateDefaultRecovery(defaultAmount, reBridge);
      
      console.log('\nRecovery Calculation:');
      console.log(`- Default amount: €${defaultAmount}M`);
      console.log(`- Collateral value (default/LTV): €${(defaultAmount / (reBridge.ltv / 100)).toFixed(2)}M`);
      
      recovery.components.forEach(comp => {
        if (comp.type === 'collateral') {
          console.log(`\nCollateral Recovery Details:`);
          console.log(`  - Collateral value: €${comp.collateralValue.toFixed(2)}M`);
          console.log(`  - After haircut (${reBridge.collateralHaircut}%): €${comp.liquidationValue.toFixed(2)}M`);
          console.log(`  - Recovery costs (${reBridge.recoveryCosts}%): €${comp.recoveryCosts.toFixed(2)}M`);
          console.log(`  - Net recovery: €${comp.netRecovery.toFixed(2)}M`);
          console.log(`  - Recovery rate: ${comp.recoveryRate.toFixed(2)}%`);
        }
      });
      
      // Step 2: Calculate NBV
      const nbv = calculateNBV(defaultAmount, reBridge, quarterlyRate);
      
      console.log('\nNBV Calculation:');
      console.log(`- Total recovery (undiscounted): €${recovery.totalRecovery.toFixed(2)}M`);
      console.log(`- Recovery timing: ${reBridge.timeToRecover} quarters`);
      console.log(`- Discount factor: ${Math.pow(1 + quarterlyRate, reBridge.timeToRecover).toFixed(4)}`);
      console.log(`- Total NBV: €${nbv.totalNBV.toFixed(2)}M`);
      console.log(`- Total LLP: €${nbv.totalLLP.toFixed(2)}M`);
      console.log(`- NBV/Gross ratio: ${(nbv.totalNBV / defaultAmount * 100).toFixed(2)}%`);
      
      // Verify NBV should be less than gross
      if (nbv.totalNBV > defaultAmount) {
        console.log('\n❌ ERROR: NBV exceeds gross amount!');
        console.log(`   NBV (€${nbv.totalNBV.toFixed(2)}M) > Gross (€${defaultAmount}M)`);
      } else {
        console.log('\n✅ NBV is correctly less than gross amount');
      }
      
      // Manual verification
      const manualRecovery = (defaultAmount / 0.7) * 0.75 - defaultAmount * 0.18;
      const manualNBV = manualRecovery / Math.pow(1 + quarterlyRate, 12);
      
      console.log('\nManual Verification:');
      console.log(`- Manual recovery calc: (${defaultAmount}/0.7)*0.75 - ${defaultAmount}*0.18 = €${manualRecovery.toFixed(2)}M`);
      console.log(`- Manual NBV: ${manualRecovery.toFixed(2)} / ${Math.pow(1 + quarterlyRate, 12).toFixed(4)} = €${manualNBV.toFixed(2)}M`);
      console.log(`- Difference: €${(nbv.totalNBV - manualNBV).toFixed(4)}M`);
    });
    
    // Test with danger rate calculation
    console.log('\n\n=== DANGER RATE INTEGRATION TEST ===');
    
    // Create test vintage
    const vintages = [{
      id: 'V1',
      startYear: 0,
      startQuarter: 0,
      initialAmount: 100,
      outstandingPrincipal: 100,
      maturityYear: 0,
      maturityQuarter: 8,
      hasDefaulted: false
    }];
    
    // Process danger rate at Q4 (when default should occur)
    const dangerResult = processDangerRate(vintages, 4, reBridge, quarterlyRate);
    
    console.log('\nDanger Rate Results:');
    console.log(`- New defaults: €${dangerResult.newDefaults.toFixed(2)}M`);
    console.log(`- NBV: €${dangerResult.nbv.toFixed(2)}M`);
    console.log(`- LLP: €${dangerResult.llp.toFixed(2)}M`);
    console.log(`- Coverage ratio: ${(dangerResult.coverageRatio * 100).toFixed(2)}%`);
    
    if (dangerResult.nbv > dangerResult.newDefaults) {
      console.log('\n❌ ERROR in danger rate: NBV exceeds default amount!');
    }
    
    // Check if the issue is in the calculation
    console.log('\nDiagnostic Information:');
    console.log(`- Default rate: ${reBridge.dangerRate}%`);
    console.log(`- Expected default: €${(100 * reBridge.dangerRate / 100).toFixed(2)}M`);
    console.log(`- Actual default: €${dangerResult.newDefaults.toFixed(2)}M`);
  });
});