import { createVintages } from '../vintageManager';
import { processQuarterlyDefaultsNew, saveVintageStatesBeforeQuarter } from '../defaultCalculatorQuarterly';
import { updateAllVintagePrincipals } from '../amortizationCalculator';

describe('Debug Quarterly Default Logic', () => {
  test('Trace exact calculation flow', () => {
    const product = {
      name: 'Debug Test',
      type: 'bullet',
      durata: 5,
      spread: 1.5,
      dangerRate: 10,
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 80,
      recoveryCosts: 10,
      collateralHaircut: 20,
      timeToRecover: 1,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [25, 25, 25, 25],
      taxRate: 30
    };

    // Create vintages
    const vintages = createVintages(product, assumptions, [100, 0, 0, 0, 0]);
    
    console.log('\n=== DEBUG QUARTERLY CALCULATION ===');
    console.log(`Initial vintages: ${vintages.length}`);
    
    let totalDefaults = 0;
    
    // Process each quarter of year 0
    for (let quarter = 0; quarter < 4; quarter++) {
      console.log(`\n--- Quarter ${quarter + 1} ---`);
      
      // Save states BEFORE quarter
      saveVintageStatesBeforeQuarter(vintages);
      
      // Log vintage states before defaults
      vintages.forEach((v, i) => {
        if (v.startYear * 4 + v.startQuarter <= quarter) {
          console.log(`Vintage ${i}: Outstanding before defaults = €${v.outstandingPrincipalBeforeQuarter?.toFixed(2) || 'undefined'}M`);
        }
      });
      
      // Process defaults
      const { newDefaults } = processQuarterlyDefaultsNew(
        vintages,
        quarter,
        0,
        quarter,
        product
      );
      
      totalDefaults += newDefaults;
      console.log(`Defaults this quarter: €${newDefaults.toFixed(3)}M`);
      
      // Update principals (includes new disbursements)
      updateAllVintagePrincipals(vintages, quarter, product, assumptions);
      
      // Log vintage states after disbursements
      vintages.forEach((v, i) => {
        if (v.startYear * 4 + v.startQuarter <= quarter) {
          console.log(`Vintage ${i}: Outstanding after all = €${v.outstandingPrincipal.toFixed(2)}M`);
        }
      });
    }
    
    // Calculate total performing
    const totalPerforming = vintages.reduce((sum, v) => sum + v.outstandingPrincipal, 0);
    
    console.log('\n--- FINAL RESULTS ---');
    console.log(`Total performing: €${totalPerforming.toFixed(2)}M`);
    console.log(`Total defaults: €${totalDefaults.toFixed(2)}M`);
    console.log(`Sum check: €${(totalPerforming + totalDefaults).toFixed(2)}M (should be €100M)`);
  });
});