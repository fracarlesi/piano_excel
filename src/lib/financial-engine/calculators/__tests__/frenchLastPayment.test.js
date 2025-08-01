import { calculateCreditProduct } from '../creditCalculator';

describe('French Amortization Last Payment Issue', () => {
  test('5-year French loan should be fully repaid', () => {
    const product = {
      name: 'French 5Y',
      type: 'french',
      durata: 5,
      gracePeriod: 0,
      spread: 1.5,
      dangerRate: 0,
      volumeArray: [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // Q1 only
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);

    console.log('\n=== FRENCH 5-YEAR LOAN ANALYSIS ===');
    console.log('Loan details:');
    console.log('- Amount: €1000M');
    console.log('- Duration: 5 years (20 quarters)');
    console.log('- Disbursement: Y0 Q1');
    console.log('- Expected maturity: Y5 Q1');
    console.log('- Interest rate: 5% (3.5% + 1.5%)');
    
    // Calcolo manuale
    const quarterlyRate = 0.05 / 4;
    const totalQuarters = 20;
    const quarterlyPayment = 1000 * (quarterlyRate * Math.pow(1 + quarterlyRate, totalQuarters)) / (Math.pow(1 + quarterlyRate, totalQuarters) - 1);
    const totalExpectedPayments = quarterlyPayment * totalQuarters;
    
    console.log(`\nExpected quarterly payment: €${quarterlyPayment.toFixed(2)}M`);
    console.log(`Expected total payments (20 quarters): €${totalExpectedPayments.toFixed(2)}M`);
    
    // Conta i pagamenti effettivi
    let quarterCount = 0;
    let totalActualPayments = 0;
    
    console.log('\n--- PAYMENT SCHEDULE ---');
    for (let year = 0; year < 6; year++) {
      const principal = result.principalRepayments[year] || 0;
      const interest = result.interestIncome[year] || 0;
      const stock = result.performingAssets[year] || 0;
      
      if (principal > 0 || interest > 0) {
        const totalPayment = principal + interest;
        totalActualPayments += totalPayment;
        
        // Stima i trimestri in base al pagamento
        const estimatedQuarters = Math.round(totalPayment / quarterlyPayment);
        quarterCount += estimatedQuarters;
        
        console.log(`\nYear ${year}:`);
        console.log(`  Principal: €${principal.toFixed(2)}M`);
        console.log(`  Interest: €${interest.toFixed(2)}M`);
        console.log(`  Total payment: €${totalPayment.toFixed(2)}M`);
        console.log(`  Estimated quarters: ${estimatedQuarters}`);
        console.log(`  Stock at end: €${stock.toFixed(2)}M`);
      }
    }
    
    console.log(`\n--- SUMMARY ---`);
    console.log(`Total quarters with payments: ${quarterCount}`);
    console.log(`Expected quarters: 20`);
    console.log(`Missing quarters: ${20 - quarterCount}`);
    console.log(`Total actual payments: €${totalActualPayments.toFixed(2)}M`);
    console.log(`Expected total payments: €${totalExpectedPayments.toFixed(2)}M`);
    console.log(`Difference: €${(totalExpectedPayments - totalActualPayments).toFixed(2)}M`);
    
    // Verifica che il prestito sia completamente rimborsato
    const totalPrincipalRepaid = result.principalRepayments.reduce((sum, r) => sum + r, 0);
    console.log(`\nTotal principal repaid: €${totalPrincipalRepaid.toFixed(2)}M`);
    console.log(`Loan amount: €1000M`);
    console.log(`Unpaid amount: €${(1000 - totalPrincipalRepaid).toFixed(2)}M`);
    
    // Il problema: lo stock alla fine dell'anno 4 dovrebbe essere pagato nell'anno 5
    if (result.performingAssets[4] > 0 && result.principalRepayments[5] === 0) {
      console.log('\n🔴 PROBLEM IDENTIFIED:');
      console.log(`Stock at end of Y4: €${result.performingAssets[4].toFixed(2)}M`);
      console.log(`But no payment in Y5!`);
      console.log(`This amount (€${result.performingAssets[4].toFixed(2)}M) is never repaid.`);
    }
    
    expect(totalPrincipalRepaid).toBeCloseTo(1000, -1); // Within 10M
  });

  test('Checking maturity calculation', () => {
    console.log('\n=== MATURITY CALCULATION CHECK ===');
    
    // Simula il calcolo della maturity per un prestito Q1 Y0
    const startYear = 0;
    const startQuarter = 0; // Q1
    const durata = 5; // 5 anni
    
    const maturityYear = startYear + Math.floor((startQuarter + durata * 4) / 4);
    const maturityQuarter = (startQuarter + durata * 4) % 4;
    
    console.log('Loan start: Y0 Q1 (quarter 0)');
    console.log(`Duration: ${durata} years = ${durata * 4} quarters`);
    console.log(`Maturity calculation:`);
    console.log(`  maturityYear = ${startYear} + floor((${startQuarter} + ${durata * 4}) / 4)`);
    console.log(`  maturityYear = ${startYear} + floor(${startQuarter + durata * 4} / 4)`);
    console.log(`  maturityYear = ${startYear} + ${Math.floor((startQuarter + durata * 4) / 4)}`);
    console.log(`  maturityYear = ${maturityYear}`);
    console.log(`  maturityQuarter = (${startQuarter} + ${durata * 4}) % 4`);
    console.log(`  maturityQuarter = ${(startQuarter + durata * 4)} % 4`);
    console.log(`  maturityQuarter = ${maturityQuarter}`);
    console.log(`\nResult: Maturity at Y${maturityYear} Q${maturityQuarter + 1}`);
    
    // Il prestito dovrebbe maturare in Y5 Q1
    expect(maturityYear).toBe(5);
    expect(maturityQuarter).toBe(0);
  });
});