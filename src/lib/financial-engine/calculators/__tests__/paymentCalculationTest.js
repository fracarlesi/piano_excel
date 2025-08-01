import { calculateQuarterlyPayment } from '../vintageManager';

describe('Payment Calculation Test', () => {
  test('French loan payment calculation with grace period', () => {
    console.log('\n=== PAYMENT CALCULATION TEST ===');
    
    // Loan parameters
    const principal = 100; // €100M
    const annualRate = 7.5 / 100; // 7.5% annual (3.5% EURIBOR + 4% spread)
    const quarterlyRate = annualRate / 4; // 1.875% quarterly
    const totalQuarters = 12; // 3 years
    const gracePeriodQuarters = 4; // 1 year grace
    
    console.log('Loan parameters:');
    console.log(`- Principal: €${principal}M`);
    console.log(`- Annual rate: ${(annualRate * 100).toFixed(2)}%`);
    console.log(`- Quarterly rate: ${(quarterlyRate * 100).toFixed(3)}%`);
    console.log(`- Total duration: ${totalQuarters} quarters`);
    console.log(`- Grace period: ${gracePeriodQuarters} quarters`);
    console.log(`- Amortization period: ${totalQuarters - gracePeriodQuarters} quarters`);
    
    // Calculate quarterly payment
    const payment = calculateQuarterlyPayment(principal, quarterlyRate, totalQuarters, gracePeriodQuarters);
    
    console.log(`\nCalculated quarterly payment: €${payment.toFixed(4)}M`);
    
    // Simulate the loan amortization
    console.log('\n--- AMORTIZATION SCHEDULE ---');
    console.log('Quarter | Balance Before | Interest | Principal | Payment | Balance After');
    console.log('--------|----------------|----------|-----------|---------|---------------');
    
    let balance = principal;
    let totalInterest = 0;
    let totalPrincipal = 0;
    
    // Grace period (interest only)
    for (let q = 0; q < gracePeriodQuarters; q++) {
      const interest = balance * quarterlyRate;
      totalInterest += interest;
      
      console.log(`Q${q + 1}      | €${balance.toFixed(2).padStart(12)}M | €${interest.toFixed(2).padStart(6)}M | €${(0).toFixed(2).padStart(7)}M | €${interest.toFixed(2).padStart(5)}M | €${balance.toFixed(2).padStart(12)}M`);
    }
    
    // Amortization period (principal + interest)
    for (let q = gracePeriodQuarters; q < totalQuarters; q++) {
      const interest = balance * quarterlyRate;
      const principal = payment - interest;
      balance -= principal;
      
      totalInterest += interest;
      totalPrincipal += principal;
      
      console.log(`Q${q + 1}${q < 9 ? ' ' : ''}     | €${(balance + principal).toFixed(2).padStart(12)}M | €${interest.toFixed(2).padStart(6)}M | €${principal.toFixed(2).padStart(7)}M | €${payment.toFixed(2).padStart(5)}M | €${balance.toFixed(2).padStart(12)}M`);
    }
    
    console.log('\n--- SUMMARY ---');
    console.log(`Total interest paid: €${totalInterest.toFixed(2)}M`);
    console.log(`Total principal repaid: €${totalPrincipal.toFixed(2)}M`);
    console.log(`Final balance: €${balance.toFixed(2)}M`);
    console.log(`Initial loan: €100.00M`);
    
    // Verify calculations
    console.log('\n--- VERIFICATION ---');
    const expectedPayments = (totalQuarters - gracePeriodQuarters) * payment;
    console.log(`Expected total payments (excluding grace): €${expectedPayments.toFixed(2)}M`);
    console.log(`Actual total payments: €${(totalPrincipal + totalInterest - gracePeriodQuarters * principal * quarterlyRate).toFixed(2)}M`);
    
    // Check if principal matches
    if (Math.abs(totalPrincipal - principal) < 0.01) {
      console.log('✅ Total principal repayment matches loan amount');
    } else {
      console.log(`❌ ERROR: Principal mismatch by €${Math.abs(totalPrincipal - principal).toFixed(2)}M`);
    }
    
    // French amortization formula check
    console.log('\n--- FORMULA CHECK ---');
    const amortizationQuarters = totalQuarters - gracePeriodQuarters;
    const compoundFactor = Math.pow(1 + quarterlyRate, amortizationQuarters);
    const expectedPayment = principal * (quarterlyRate * compoundFactor) / (compoundFactor - 1);
    
    console.log(`Formula: PMT = P × (r × (1+r)^n) / ((1+r)^n - 1)`);
    console.log(`P = ${principal}, r = ${quarterlyRate.toFixed(5)}, n = ${amortizationQuarters}`);
    console.log(`Expected payment: €${expectedPayment.toFixed(4)}M`);
    console.log(`Calculated payment: €${payment.toFixed(4)}M`);
    
    if (Math.abs(payment - expectedPayment) < 0.0001) {
      console.log('✅ Payment calculation matches French amortization formula');
    } else {
      console.log('❌ Payment calculation error');
    }
  });
});