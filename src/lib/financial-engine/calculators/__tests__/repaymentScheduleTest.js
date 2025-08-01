import { updateAllVintagePrincipals } from '../amortizationCalculator';
import { createVintage } from '../vintageManager';

describe('Repayment Schedule Test', () => {
  test('Detailed repayment schedule for French loan with grace', () => {
    console.log('\n=== REPAYMENT SCHEDULE TEST ===');
    
    const product = {
      type: 'french',
      durata: 12, // 12 quarters total
      gracePeriod: 4, // 4 quarters grace
      spread: 4.0,
      isFixedRate: false
    };
    
    const assumptions = {
      euribor: 3.5
    };
    
    // Create vintage
    const vintage = createVintage({
      year: 1,
      quarter: 0, // Q1 = global Q4
      volume: 100,
      product,
      assumptions
    });
    
    const vintages = [vintage];
    const quarterlyRate = 0.075 / 4; // 7.5% annual / 4
    
    console.log('\n--- LOAN PARAMETERS ---');
    console.log(`Principal: €${vintage.initialAmount}M`);
    console.log(`Duration: ${vintage.durata} quarters`);
    console.log(`Grace period: ${vintage.gracePeriod} quarters`);
    console.log(`Amortization period: ${vintage.durata - vintage.gracePeriod} quarters`);
    console.log(`Quarterly payment: €${vintage.quarterlyPayment?.toFixed(4)}M`);
    console.log(`Start: Y${vintage.startYear}Q${vintage.startQuarter + 1} (global Q${vintage.startYear * 4 + vintage.startQuarter})`);
    console.log(`Maturity: Y${vintage.maturityYear}Q${vintage.maturityQuarter + 1} (global Q${vintage.maturityYear * 4 + vintage.maturityQuarter})`);
    
    const startQ = vintage.startYear * 4 + vintage.startQuarter;
    const maturityQ = vintage.maturityYear * 4 + vintage.maturityQuarter;
    
    console.log('\n--- QUARTER BY QUARTER SIMULATION ---');
    console.log('Quarter | Elapsed | Grace? | Principal Before | Interest | Principal Payment | Principal After');
    console.log('--------|---------|--------|------------------|----------|-------------------|----------------');
    
    let totalPrincipalRepaid = 0;
    let totalInterestPaid = 0;
    let repaymentCount = 0;
    
    // Simulate quarters from start to beyond maturity
    for (let q = startQ; q <= maturityQ + 2; q++) {
      const elapsed = q - startQ;
      const year = Math.floor(q / 4);
      const quarter = (q % 4) + 1;
      const principalBefore = vintage.outstandingPrincipal;
      
      // Calculate interest
      const interest = principalBefore * quarterlyRate;
      totalInterestPaid += interest;
      
      // Update principal (this is what the engine does)
      updateAllVintagePrincipals(vintages, q, product, assumptions);
      
      const principalAfter = vintage.outstandingPrincipal;
      const principalPayment = principalBefore - principalAfter;
      
      if (principalPayment > 0) {
        totalPrincipalRepaid += principalPayment;
        repaymentCount++;
      }
      
      const inGrace = elapsed < vintage.gracePeriod;
      
      console.log(`Y${year}Q${quarter} (${q.toString().padStart(2)}) | ${elapsed.toString().padStart(7)} | ${inGrace ? 'YES    ' : 'NO     '} | €${principalBefore.toFixed(2).padStart(14)}M | €${interest.toFixed(2).padStart(6)}M | €${principalPayment.toFixed(2).padStart(15)}M | €${principalAfter.toFixed(2).padStart(14)}M`);
      
      if (principalAfter < 0.01 && principalBefore > 0.01) {
        console.log(`\n>>> LOAN FULLY REPAID at Y${year}Q${quarter} (global Q${q}) <<<`);
        break;
      }
    }
    
    console.log('\n--- SUMMARY ---');
    console.log(`Total principal repaid: €${totalPrincipalRepaid.toFixed(2)}M`);
    console.log(`Total interest paid: €${totalInterestPaid.toFixed(2)}M`);
    console.log(`Number of principal payments: ${repaymentCount}`);
    console.log(`Expected principal payments: ${vintage.durata - vintage.gracePeriod}`);
    
    // Check amortization calculation
    console.log('\n--- AMORTIZATION CHECK ---');
    const amortizationPeriod = vintage.durata - vintage.gracePeriod;
    console.log(`Amortization period: ${amortizationPeriod} quarters`);
    console.log(`Quarterly payment: €${vintage.quarterlyPayment?.toFixed(4)}M`);
    
    // Manually calculate what the payment should be
    const n = amortizationPeriod;
    const r = quarterlyRate;
    const pv = vintage.initialAmount;
    const factor = Math.pow(1 + r, n);
    const expectedPayment = pv * (r * factor) / (factor - 1);
    
    console.log(`\nManual calculation:`);
    console.log(`PV = €${pv}M, r = ${(r * 100).toFixed(3)}%, n = ${n}`);
    console.log(`Expected payment: €${expectedPayment.toFixed(4)}M`);
    console.log(`Actual payment: €${vintage.quarterlyPayment?.toFixed(4)}M`);
    
    if (Math.abs(totalPrincipalRepaid - 100) < 0.01) {
      console.log('\n✅ Total principal matches loan amount');
    } else {
      console.log(`\n❌ Principal mismatch: repaid €${totalPrincipalRepaid.toFixed(2)}M vs loan €100M`);
    }
  });
});