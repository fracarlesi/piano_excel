import { calculateCreditProduct } from '../creditCalculator';

describe('Credit Calculator Interest Tests', () => {
  
  describe('Scenario 1: Bullet Loan with Q2 Disbursement', () => {
    const product = {
      name: 'Test Bullet Q2',
      type: 'bullet',
      durata: 3, // 3 years
      spread: 6.5,
      dangerRate: 0,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €100M in Y0 only
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [0, 50, 50, 0], // Q2 and Q3 disbursement
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    test('Calculates correct interest income with quarterly convention', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // Interest rate = 3.5% + 6.5% = 10%
      // With [0, 50, 50, 0] allocation:
      // Q2: 50€ disbursed, interest from Q3-Q4 = 50€ × 10% × (2/4) = 2.5€
      // Q3: 50€ disbursed, interest from Q4 = 50€ × 10% × (1/4) = 1.25€
      // Total Y0 interest = 3.75€
      expect(result.interestIncome[0]).toBeCloseTo(3.75, 2);
      
      // Year 1: Full year = 100€ × 10% = 10€
      expect(result.interestIncome[1]).toBeCloseTo(10, 2);
      
      // Year 2: Full year = 100€ × 10% = 10€
      expect(result.interestIncome[2]).toBeCloseTo(10, 2);
      
      // Year 3: Interest until maturity
      // Bullet loans include interest up to and including maturity quarter
      // With Q2/Q3 disbursements and 3-year maturity, we get partial year interest
      expect(result.interestIncome[3]).toBeCloseTo(6.25, 2);
      
      // Year 4: No interest (loan matured)
      expect(result.interestIncome[4]).toBe(0);
    });

    test('Principal repayment occurs only at maturity', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // No principal repayments before maturity
      expect(result.principalRepayments[0]).toBe(0);
      expect(result.principalRepayments[1]).toBe(0);
      expect(result.principalRepayments[2]).toBe(0);
      
      // Full repayment at maturity (Y3)
      expect(result.principalRepayments[3]).toBe(100);
      
      // No repayments after maturity
      expect(result.principalRepayments[4]).toBe(0);
    });

    test('Performing assets remain constant until maturity', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // Stock = 100€ from Y0 to Y2
      expect(result.performingAssets[0]).toBe(100);
      expect(result.performingAssets[1]).toBe(100);
      expect(result.performingAssets[2]).toBe(100);
      
      // Stock = 0 from Y3 onwards (matured)
      expect(result.performingAssets[3]).toBe(0);
      expect(result.performingAssets[4]).toBe(0);
    });
  });

  describe('Scenario 2: French Amortization Standard', () => {
    const product = {
      name: 'Test French Standard',
      type: 'french',
      durata: 5, // 5 years
      spread: 0.5,
      dangerRate: 0,
      volumeArray: [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €1000M in Y0 only
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // Q1 disbursement only
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    test('Calculates decreasing interest over time', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // Interest rate = 3.5% + 0.5% = 4%
      // Interest should decrease as principal is repaid
      expect(result.interestIncome[0]).toBeGreaterThan(0);
      expect(result.interestIncome[1]).toBeGreaterThan(0);
      
      // Y0 is partial year (Q1 disbursement), so Y1 might have more interest
      // But from Y1 onwards, interest should decrease
      expect(result.interestIncome[2]).toBeLessThan(result.interestIncome[1]);
      expect(result.interestIncome[3]).toBeLessThan(result.interestIncome[2]);
      expect(result.interestIncome[4]).toBeLessThan(result.interestIncome[3]);
      
      // Small interest in final year for last payment
      expect(result.interestIncome[5]).toBeGreaterThan(0);
      expect(result.interestIncome[5]).toBeLessThan(1); // Very small amount
      
      // No interest after maturity
      expect(result.interestIncome[6]).toBe(0);
    });

    test('Principal repayments increase over time', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // French amortization has increasing principal repayments
      expect(result.principalRepayments[0]).toBeGreaterThan(0);
      expect(result.principalRepayments[1]).toBeGreaterThan(result.principalRepayments[0]);
      expect(result.principalRepayments[2]).toBeGreaterThan(result.principalRepayments[1]);
      
      // Total repayments should be close to initial amount
      // Some difference is expected due to Q1 disbursement timing
      const totalRepayments = result.principalRepayments.reduce((sum, r) => sum + r, 0);
      expect(totalRepayments).toBeGreaterThan(900); // Should repay most of the loan
      expect(totalRepayments).toBeLessThan(1050); // But not significantly more
    });

    test('Performing assets decrease steadily', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // Stock should decrease each year
      expect(result.performingAssets[0]).toBeLessThan(1000);
      expect(result.performingAssets[1]).toBeLessThan(result.performingAssets[0]);
      expect(result.performingAssets[2]).toBeLessThan(result.performingAssets[1]);
      expect(result.performingAssets[3]).toBeLessThan(result.performingAssets[2]);
      
      // Stock = 0 after maturity
      expect(result.performingAssets[5]).toBe(0);
    });
  });

  describe('Scenario 3: French Amortization with Grace Period', () => {
    const product = {
      name: 'Test French Grace',
      type: 'french',
      durata: 5, // 5 years total
      gracePeriod: 2, // 2 years grace period
      spread: 0.5,
      dangerRate: 0,
      volumeArray: [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0] // €1000M in Y0 only
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // Q1 disbursement only
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    test('No principal repayments during grace period', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // No principal repayments in years 0 and 1 (grace period)
      expect(result.principalRepayments[0]).toBe(0);
      expect(result.principalRepayments[1]).toBe(0);
      
      // Principal repayments start in year 2
      expect(result.principalRepayments[2]).toBeGreaterThan(0);
      expect(result.principalRepayments[3]).toBeGreaterThan(0);
      expect(result.principalRepayments[4]).toBeGreaterThan(0);
    });

    test('Performing assets remain constant during grace period', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // Stock remains at 1000 during grace period
      expect(result.performingAssets[0]).toBe(1000);
      expect(result.performingAssets[1]).toBe(1000);
      
      // Stock decreases after grace period
      expect(result.performingAssets[2]).toBeLessThan(1000);
      expect(result.performingAssets[3]).toBeLessThan(result.performingAssets[2]);
    });

    test('Interest accrues during grace period', () => {
      const result = calculateCreditProduct(product, assumptions, years);
      
      // Full interest during grace period (principal not reducing)
      // Interest rate = 4%, so ~40€ per year on 1000€
      expect(result.interestIncome[0]).toBeGreaterThan(25); // Partial year
      expect(result.interestIncome[1]).toBeCloseTo(40, 5);
      
      // Interest decreases after grace period as principal is repaid
      expect(result.interestIncome[2]).toBeLessThan(result.interestIncome[1]);
    });

    test('Comparison with standard French loan', () => {
      const standardProduct = { ...product, gracePeriod: 0 };
      const standardResult = calculateCreditProduct(standardProduct, assumptions, years);
      const graceResult = calculateCreditProduct(product, assumptions, years);
      
      // Grace period loan should have:
      // 1. Higher total interest (principal outstanding longer)
      const totalInterestGrace = graceResult.interestIncome.reduce((sum, i) => sum + i, 0);
      const totalInterestStandard = standardResult.interestIncome.reduce((sum, i) => sum + i, 0);
      expect(totalInterestGrace).toBeGreaterThan(totalInterestStandard);
      
      // 2. Delayed principal repayments
      expect(graceResult.principalRepayments[0]).toBe(0);
      expect(standardResult.principalRepayments[0]).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Validation', () => {
    test('Handles zero interest rate', () => {
      const product = {
        name: 'Zero Rate',
        type: 'bullet',
        durata: 2,
        spread: -3.5, // Cancels out EURIBOR
        dangerRate: 0,
        volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      };

      const assumptions = {
        euribor: 3.5,
        ftpSpread: 1.5,
        quarterlyAllocation: [100, 0, 0, 0],
        taxRate: 30
      };

      const result = calculateCreditProduct(product, assumptions, [0, 1, 2, 3, 4]);
      
      // No interest with 0% rate
      expect(result.interestIncome[0]).toBe(0);
      expect(result.interestIncome[1]).toBe(0);
    });

    test('Handles quarterly allocation correctly', () => {
      const product = {
        name: 'Quarterly Test',
        type: 'bullet',
        durata: 1,
        spread: 6.5,
        dangerRate: 0,
        volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      };

      const assumptions = {
        euribor: 3.5,
        ftpSpread: 1.5,
        quarterlyAllocation: [25, 25, 25, 25], // Even distribution
        taxRate: 30
      };

      const result = calculateCreditProduct(product, assumptions, [0, 1, 2]);
      
      // With 10% rate and even distribution:
      // Q1: 25€ × 10% × 3/4 year = 1.875€
      // Q2: 25€ × 10% × 2/4 year = 1.25€
      // Q3: 25€ × 10% × 1/4 year = 0.625€
      // Q4: 25€ × 10% × 0/4 year = 0€
      // Total Y0 interest = 3.75€
      expect(result.interestIncome[0]).toBeCloseTo(3.75, 2);
    });
  });
});