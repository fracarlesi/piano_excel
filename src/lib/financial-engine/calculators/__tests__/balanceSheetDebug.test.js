import { calculateCreditProduct } from '../creditCalculator';

describe('Balance Sheet Debug Test', () => {
  test('Debug performing assets display issue', () => {
    const product = {
      name: 'Debug Bullet Test',
      type: 'bullet',
      durata: 4, // 4 quarters (1 year)
      spread: 4.0,
      dangerRate: 0, // No defaults
      rwaDensity: 100,
      commissionRate: 0,
      ltv: 70,
      recoveryCosts: 15,
      collateralHaircut: 25,
      timeToRecover: 1,
      volumeArray: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 100M in Year 1
    };

    const assumptions = {
      euribor: 3.5,
      ftpSpread: 1.5,
      quarterlyAllocation: [100, 0, 0, 0], // All in Q1
      taxRate: 30
    };

    const years = [0, 1, 2];
    const result = calculateCreditProduct(product, assumptions, years);
    
    console.log('\n=== BALANCE SHEET DEBUG TEST ===');
    console.log('Product: 100M Bullet, 12 months, disbursed Q1 Year 1');
    console.log('Expected: Performing stock should be 100M from Q1-Q5, then 0\n');
    
    // Check quarterly performing stock
    const quarterlyStock = result.quarterly?.performingStock || [];
    
    console.log('Quarterly Performing Stock:');
    for (let q = 0; q < 12; q++) {
      const year = Math.floor(q / 4) + 1;
      const quarter = (q % 4) + 1;
      console.log(`Y${year}Q${quarter}: €${quarterlyStock[q]?.toFixed(2) || '0.00'}M`);
    }
    
    // Check if it's being aggregated correctly at division level
    console.log('\n--- ISSUE IDENTIFICATION ---');
    console.log(`Q1 (disbursement): €${quarterlyStock[0]?.toFixed(2) || '0.00'}M - ${quarterlyStock[0] === 100 ? '✅' : '❌'} Should be 100M`);
    console.log(`Q2: €${quarterlyStock[1]?.toFixed(2) || '0.00'}M - ${quarterlyStock[1] === 100 ? '✅' : '❌'} Should be 100M`);
    console.log(`Q3: €${quarterlyStock[2]?.toFixed(2) || '0.00'}M - ${quarterlyStock[2] === 100 ? '✅' : '❌'} Should be 100M`);
    console.log(`Q4: €${quarterlyStock[3]?.toFixed(2) || '0.00'}M - ${quarterlyStock[3] === 100 ? '✅' : '❌'} Should be 100M`);
    console.log(`Q5: €${quarterlyStock[4]?.toFixed(2) || '0.00'}M - ${quarterlyStock[4] === 100 ? '✅' : '❌'} Should be 100M`);
    console.log(`Q6: €${quarterlyStock[5]?.toFixed(2) || '0.00'}M - ${quarterlyStock[5] === 0 ? '✅' : '❌'} Should be 0M`);
    
    // Check annual performing assets too
    console.log('\n--- ANNUAL PERFORMING ASSETS ---');
    const annualAssets = result.performingAssets || [];
    for (let y = 0; y < 3; y++) {
      console.log(`Year ${y}: €${annualAssets[y]?.toFixed(2) || '0.00'}M`);
    }
    
    // Verify the data structure
    console.log('\n--- DATA STRUCTURE CHECK ---');
    console.log('Has quarterly object:', !!result.quarterly);
    console.log('Has quarterly.performingStock:', !!result.quarterly?.performingStock);
    console.log('Quarterly performingStock length:', result.quarterly?.performingStock?.length || 0);
    
    // Test raw output
    console.log('\n--- RAW QUARTERLY DATA (first 8 quarters) ---');
    console.log(result.quarterly?.performingStock?.slice(0, 8));
  });
});