// Test script to verify calculation chain
import { BalanceSheetOrchestrator } from './lib/financial-engine/balance-sheet-microservices/BalanceSheetOrchestrator.js';
import { defaultAssumptions } from './data/defaultAssumptions.js';

console.log('=== TESTING CALCULATION CHAIN ===\n');

// Step 1: Check product structure
console.log('1. PRODUCTS IN ASSUMPTIONS:');
Object.entries(defaultAssumptions.products).forEach(([key, product]) => {
  if (product.type === 'french' || product.type === 'bullet' || product.type === 'bridge') {
    console.log(`- ${key}: ${product.name} (${product.type})`);
  }
});

// Step 2: Run balance sheet calculation
console.log('\n2. RUNNING BALANCE SHEET CALCULATION...');
const results = BalanceSheetOrchestrator.calculate(defaultAssumptions);

// Step 3: Check volumes
console.log('\n3. NEW VOLUMES RESULTS:');
const newVolumes = results.details?.newVolumesData;
if (newVolumes) {
  console.log(`Total new volumes over 10 years: €${newVolumes.metrics?.totalVolumes10Y?.toFixed(0)}M`);
  console.log('\nBy Product:');
  Object.entries(newVolumes.byProduct || {}).forEach(([key, data]) => {
    console.log(`- ${key}: €${data.metrics?.totalVolume?.toFixed(0)}M`);
  });
}

// Step 4: Check repayments
console.log('\n4. REPAYMENTS RESULTS:');
const repayments = results.details?.repaymentsData;
if (repayments) {
  console.log(`Total repayments over 10 years: €${repayments.metrics?.totalRepayments10Y?.toFixed(0)}M`);
  console.log('\nBy Product:');
  Object.entries(repayments.byProduct || {}).forEach(([key, data]) => {
    console.log(`- ${key}: €${data.metrics?.totalRepayment?.toFixed(0)}M`);
  });
}

// Step 5: Check total assets
console.log('\n5. TOTAL ASSETS NBV:');
const totalAssets = results.details?.totalAssetsNBV;
if (totalAssets) {
  console.log(`Peak exposure: €${totalAssets.metrics?.peakExposure?.toFixed(0)}M in Q${totalAssets.metrics?.peakQuarter}`);
}

console.log('\n=== TEST COMPLETE ===');