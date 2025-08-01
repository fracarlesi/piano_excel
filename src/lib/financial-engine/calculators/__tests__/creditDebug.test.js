import { calculateCreditProduct } from '../creditCalculator';

describe('Credit Calculator Debug Tests', () => {
  
  test('Anomaly 1: Stock multiplier should be fixed', () => {
    const product = {
      name: 'Test Bullet',
      type: 'bullet',
      durata: 2,
      spread: 6.5,
      dangerRate: 0,
      volumes: { y1: 100, y10: 100 }
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [25, 25, 25, 25],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);
    
    console.log('Year 0 Volume:', result.volumes[0]);
    console.log('Year 0 Performing Assets:', result.performingAssets[0]);
    console.log('Ratio:', result.performingAssets[0] / result.volumes[0]);
    console.log('Full result:', JSON.stringify(result, null, 2));
    
    // The performing assets should be close to the volume, not 5x
    expect(result.performingAssets[0]).toBeLessThan(result.volumes[0] * 1.5);
    expect(result.performingAssets[0]).toBeGreaterThan(result.volumes[0] * 0.8);
  });

  test('Anomaly 2: Principal repayments should be positive', () => {
    const product = {
      name: 'Test French',
      type: 'french',
      durata: 5,
      spread: 0.5,
      dangerRate: 0,
      volumes: { y1: 1000, y10: 0 }
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);
    
    console.log('Principal Repayments Y0-Y2:', result.principalRepayments.slice(0, 3));
    
    // All principal repayments should be positive or zero
    result.principalRepayments.forEach((repayment, year) => {
      expect(repayment).toBeGreaterThanOrEqual(0);
    });
  });

  test('Anomaly 3: French loan stock should decrease', () => {
    const product = {
      name: 'Test French Decreasing',
      type: 'french',
      durata: 5,
      spread: 0.5,
      dangerRate: 0,
      volumeArray: [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Only disburse in Y0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = calculateCreditProduct(product, assumptions, years);
    
    console.log('Performing Assets Y0-Y6:', result.performingAssets.slice(0, 7));
    console.log('Principal Repayments Y0-Y6:', result.principalRepayments.slice(0, 7));
    console.log('Interest Income Y0-Y6:', result.interestIncome.slice(0, 7));
    console.log('Volumes Y0-Y6:', result.volumes.slice(0, 7));
    
    // Stock should decrease over time for French loans
    expect(result.performingAssets[1]).toBeLessThan(result.performingAssets[0]);
    expect(result.performingAssets[2]).toBeLessThan(result.performingAssets[1]);
    expect(result.performingAssets[3]).toBeLessThan(result.performingAssets[2]);
  });

  test('Anomaly 4: Grace period should delay repayments', () => {
    const withGrace = {
      name: 'With Grace',
      type: 'french',
      durata: 5,
      gracePeriod: 2,
      spread: 0.5,
      dangerRate: 0,
      volumeArray: [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Only disburse in Y0
    };

    const withoutGrace = {
      name: 'Without Grace',
      type: 'french',
      durata: 5,
      gracePeriod: 0,
      spread: 0.5,
      dangerRate: 0,
      volumeArray: [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Only disburse in Y0
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0],
      taxRate: 30
    };

    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    const graceResult = calculateCreditProduct(withGrace, assumptions, years);
    const noGraceResult = calculateCreditProduct(withoutGrace, assumptions, years);
    
    console.log('\nGrace Period Test:');
    console.log('With Grace - Y0-Y1 repayments:', graceResult.principalRepayments.slice(0, 2));
    console.log('Without Grace - Y0-Y1 repayments:', noGraceResult.principalRepayments.slice(0, 2));
    console.log('With Grace - Y0-Y1 stock:', graceResult.performingAssets.slice(0, 2));
    console.log('Without Grace - Y0-Y1 stock:', noGraceResult.performingAssets.slice(0, 2));
    
    // Grace period should result in lower repayments in early years
    const graceEarlyRepayments = graceResult.principalRepayments[0] + graceResult.principalRepayments[1];
    const noGraceEarlyRepayments = noGraceResult.principalRepayments[0] + noGraceResult.principalRepayments[1];
    
    expect(graceEarlyRepayments).toBeLessThan(noGraceEarlyRepayments);
    
    // Stock should remain constant during grace period
    expect(graceResult.performingAssets[0]).toBeCloseTo(1000, 50);
    expect(graceResult.performingAssets[1]).toBeCloseTo(1000, 50);
  });
});