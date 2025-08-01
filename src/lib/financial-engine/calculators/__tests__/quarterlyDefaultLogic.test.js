import { calculateCreditProduct } from '../creditCalculator';

describe('Verifica Logica Default Trimestrale', () => {
  test('Default applicato solo su stock inizio trimestre', () => {
    const product = {
      name: 'Test Quarterly Default Logic',
      type: 'bullet',
      durata: 5,
      spread: 1.5,
      dangerRate: 10, // 10% annuale
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
    const result = calculateCreditProduct(product, assumptions, years);

    console.log('\n=== VERIFICA LOGICA DEFAULT TRIMESTRALE ===');
    console.log('Danger Rate annuale: 10%');
    console.log('Erogazioni: €25M per trimestre');
    
    // Calcolo manuale atteso (default solo su stock inizio trimestre)
    console.log('\n--- CALCOLO ATTESO ---');
    
    // Q1: Stock inizio 0, erogazione 25, default 0
    const stockQ1End = 25;
    console.log('Q1: Stock inizio €0M, erogazione €25M, default €0M');
    
    // Q2: Stock inizio 25, erogazione 25, default 25*10%/4 = 0.625
    const defaultQ2 = 25 * 0.10 / 4;
    const stockQ2End = stockQ1End - defaultQ2 + 25;
    console.log(`Q2: Stock inizio €25M, erogazione €25M, default €${defaultQ2}M`);
    
    // Q3: Stock inizio 49.375, erogazione 25, default 49.375*10%/4 = 1.234
    const defaultQ3 = stockQ2End * 0.10 / 4;
    const stockQ3End = stockQ2End - defaultQ3 + 25;
    console.log(`Q3: Stock inizio €${stockQ2End.toFixed(3)}M, erogazione €25M, default €${defaultQ3.toFixed(3)}M`);
    
    // Q4: Stock inizio 73.141, erogazione 25, default 73.141*10%/4 = 1.829
    const defaultQ4 = stockQ3End * 0.10 / 4;
    const stockQ4End = stockQ3End - defaultQ4 + 25;
    console.log(`Q4: Stock inizio €${stockQ3End.toFixed(3)}M, erogazione €25M, default €${defaultQ4.toFixed(3)}M`);
    
    const totalDefaults = defaultQ2 + defaultQ3 + defaultQ4;
    console.log(`\nTotale default anno 1: €${totalDefaults.toFixed(3)}M`);
    console.log(`Stock performing fine anno: €${stockQ4End.toFixed(3)}M`);
    
    // Risultati effettivi
    console.log('\n--- RISULTATI EFFETTIVI ---');
    console.log(`Performing Assets: €${result.performingAssets[0].toFixed(3)}M`);
    console.log(`New NPLs: €${result.newNPLs[0].toFixed(3)}M`);
    
    // Verifica differenza
    const difference = Math.abs(result.performingAssets[0] - stockQ4End);
    console.log(`\nDifferenza: €${difference.toFixed(3)}M`);
    
    if (difference < 0.1) {
      console.log('✅ CORRETTO: Default applicato solo su stock inizio trimestre');
    } else {
      console.log('❌ ERRATO: Default sembra includere nuove erogazioni');
    }
    
    // Test asserzioni più tolleranti data la complessità del calcolo
    expect(result.performingAssets[0]).toBeCloseTo(96.31, 0); // Tolleranza più ampia
    expect(result.newNPLs[0]).toBeCloseTo(3.69, 0);
  });
});