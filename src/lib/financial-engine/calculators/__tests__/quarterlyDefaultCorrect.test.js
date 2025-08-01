import { calculateCreditProductQuarterly } from '../creditCalculatorQuarterly';

describe('Verifica Corretta Logica Default Trimestrale', () => {
  test('Default applicato SOLO su stock inizio trimestre', () => {
    const product = {
      name: 'Test True Quarterly Logic',
      type: 'bullet',
      durata: 5,
      spread: 1.5,
      dangerRate: 10, // 10% annuale = 2.5% trimestrale
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
      quarterlyAllocation: [25, 25, 25, 25], // 25M€ per trimestre
      taxRate: 30
    };

    const years = [0];
    const result = calculateCreditProductQuarterly(product, assumptions, years);

    console.log('\n=== VERIFICA CORRETTA LOGICA TRIMESTRALE ===');
    
    // Calcolo manuale con logica corretta
    let stock = 0;
    let totalDefaults = 0;
    const quarterlyRate = 0.025; // 10% / 4
    
    console.log('\nCalcolo trimestre per trimestre:');
    
    // Q1
    const defaultQ1 = stock * quarterlyRate;
    stock = stock - defaultQ1 + 25;
    totalDefaults += defaultQ1;
    console.log(`Q1: Stock inizio €${(stock - 25).toFixed(2)}M + erogazione €25M - default €${defaultQ1.toFixed(2)}M = stock fine €${stock.toFixed(2)}M`);
    
    // Q2
    const defaultQ2 = stock * quarterlyRate;
    stock = stock - defaultQ2 + 25;
    totalDefaults += defaultQ2;
    console.log(`Q2: Stock inizio €${(stock - 25 + defaultQ2).toFixed(2)}M + erogazione €25M - default €${defaultQ2.toFixed(2)}M = stock fine €${stock.toFixed(2)}M`);
    
    // Q3
    const defaultQ3 = stock * quarterlyRate;
    stock = stock - defaultQ3 + 25;
    totalDefaults += defaultQ3;
    console.log(`Q3: Stock inizio €${(stock - 25 + defaultQ3).toFixed(2)}M + erogazione €25M - default €${defaultQ3.toFixed(2)}M = stock fine €${stock.toFixed(2)}M`);
    
    // Q4
    const defaultQ4 = stock * quarterlyRate;
    stock = stock - defaultQ4 + 25;
    totalDefaults += defaultQ4;
    console.log(`Q4: Stock inizio €${(stock - 25 + defaultQ4).toFixed(2)}M + erogazione €25M - default €${defaultQ4.toFixed(2)}M = stock fine €${stock.toFixed(2)}M`);
    
    console.log(`\nTotale default attesi: €${totalDefaults.toFixed(3)}M`);
    console.log(`Stock performing atteso: €${stock.toFixed(3)}M`);
    
    console.log('\n--- RISULTATI EFFETTIVI ---');
    console.log(`Performing Assets: €${result.performingAssets[0].toFixed(3)}M`);
    console.log(`New NPLs: €${result.newNPLs[0].toFixed(3)}M`);
    console.log(`Non-Performing Assets (NBV): €${result.nonPerformingAssets[0].toFixed(3)}M`);
    console.log(`LLP: €${result.llp[0].toFixed(3)}M`);
    
    // Verifica allineamento
    const performingDiff = Math.abs(result.performingAssets[0] - stock);
    const defaultDiff = Math.abs(result.newNPLs[0] - totalDefaults);
    
    console.log('\n--- VERIFICA ALLINEAMENTO ---');
    console.log(`Differenza performing: €${performingDiff.toFixed(3)}M`);
    console.log(`Differenza defaults: €${defaultDiff.toFixed(3)}M`);
    
    if (performingDiff < 0.01 && defaultDiff < 0.01) {
      console.log('✅ SUCCESSO: Logica trimestrale implementata correttamente!');
    } else {
      console.log('❌ ATTENZIONE: Ancora differenze nella logica');
    }
    
    // Test assertions
    expect(result.performingAssets[0]).toBeCloseTo(96.31, 1);
    expect(result.newNPLs[0]).toBeCloseTo(3.69, 1);
  });
});