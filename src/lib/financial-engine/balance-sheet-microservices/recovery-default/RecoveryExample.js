/**
 * Recovery-Default Microservices Example
 * 
 * ESEMPIO DI UTILIZZO dei microservizi recovery-default
 * Mostra come integrare con il financial engine
 */

import { calculateRecoveryDefault } from './RecoveryOrchestrator.js';
import { 
  calculateCollateralRecovery,
  validateCollateralRecoveryParams 
} from './CollateralRecoveryCalculator.js';
import { 
  calculateStateGuaranteeRecovery,
  validateStateGuaranteeParams 
} from './StateGuaranteeRecoveryCalculator.js';

/**
 * Esempio completo di calcolo recovery
 */
export const exampleRecoveryCalculation = () => {
  // MOCK DATA - in realtà vengono dal credit calculator
  const mockDivisions = {
    creditPrivate: {
      products: {
        bridgeLoan1: {
          originalProduct: {
            name: 'Bridge Loan Premium',
            productType: 'Credit',
            type: 'bullet',
            ltv: 75,
            collateralHaircut: 18,
            recoveryCosts: 12,
            hasStateGuarantee: true,
            stateGuaranteeType: 'mcc',
            stateGuaranteeCoverage: 70
          },
          // Mock default flows (normalmente da credit calculator)
          calculatedFlows: {
            defaultFlows: [0, 0, 50, 80, 100, 75, 60, 40, 20, 10, 0, 0] // €M per quarter
          }
        },
        frenchLoan1: {
          originalProduct: {
            name: 'French Loan Residential',
            productType: 'Credit',
            type: 'french',
            ltv: 80,
            collateralHaircut: 15,
            recoveryCosts: 8,
            hasStateGuarantee: false
          },
          calculatedFlows: {
            defaultFlows: [0, 0, 30, 60, 90, 120, 100, 80, 60, 40, 20, 0] // €M per quarter
          }
        }
      }
    }
  };
  
  const mockAssumptions = {
    costOfFundsRate: 3.5, // 3.5% annual discount rate
    // Altri assumptions...
  };
  
  const quarters = 40;
  
  console.log('=== RECOVERY-DEFAULT MICROSERVICES EXAMPLE ===\n');
  
  // 1. CALCOLO RECOVERY COMPLETO
  console.log('1. Calculating complete recovery projection...');
  const recoveryResults = calculateRecoveryDefault(mockDivisions, mockAssumptions, quarters);
  
  console.log(`Total expected recovery: €${recoveryResults.consolidatedMetrics.totalExpectedRecovery.toFixed(1)}M`);
  console.log(`Average recovery rate: ${recoveryResults.consolidatedMetrics.averageRecoveryRate.toFixed(1)}%`);
  console.log(`Peak recovery quarter: ${recoveryResults.timingMetrics.peakRecoveryQuarter}`);
  console.log(`Peak recovery value: €${recoveryResults.timingMetrics.peakRecoveryValue.toFixed(1)}M\n`);
  
  // 2. DETTAGLIO RECOVERY PER PRODOTTO
  console.log('2. Product-level recovery details:');
  Object.entries(recoveryResults.byProduct).forEach(([productKey, product]) => {
    console.log(`\n${product.productName}:`);
    console.log(`  Total recovery: €${product.fullResults.metrics.totalExpectedRecovery.toFixed(1)}M`);
    console.log(`  Recovery rate: ${product.fullResults.metrics.averageRecoveryRate.toFixed(1)}%`);
    console.log(`  Collateral recovery: €${product.fullResults.metrics.totalCollateralRecovery.toFixed(1)}M`);
    console.log(`  State guarantee recovery: €${product.fullResults.metrics.totalStateGuaranteeRecovery.toFixed(1)}M`);
  });
  
  // 3. QUARTERLY BREAKDOWN (primi 12 trimestri)
  console.log('\n3. Quarterly recovery flows (first 12 quarters):');
  console.log('Quarter\tTotal\tCollateral\tState Guarantee');
  for (let q = 0; q < 12; q++) {
    const total = recoveryResults.balanceSheetLine.quarterly[q];
    const collateral = recoveryResults.byRecoveryType.collateralRecovery[q];
    const stateGuarantee = recoveryResults.byRecoveryType.stateGuaranteeRecovery[q];
    
    if (total > 0) {
      console.log(
        `Q${q+1}\t€${total.toFixed(1)}M\t€${collateral.toFixed(1)}M\t\t€${stateGuarantee.toFixed(1)}M`
      );
    }
  }
  
  return recoveryResults;
};

/**
 * Esempio validazione parametri recovery
 */
export const exampleRecoveryValidation = () => {
  console.log('\n=== RECOVERY PARAMETERS VALIDATION EXAMPLE ===\n');
  
  const testProducts = [
    {
      name: 'Valid Bridge Loan',
      ltv: 75,
      collateralHaircut: 18,
      recoveryCosts: 10,
      hasStateGuarantee: true,
      stateGuaranteeType: 'mcc',
      stateGuaranteeCoverage: 70
    },
    {
      name: 'Problematic Loan',
      ltv: 95, // High LTV
      collateralHaircut: 35, // High haircut  
      recoveryCosts: 20, // High costs
      hasStateGuarantee: true,
      stateGuaranteeType: 'unknown', // Invalid type
      stateGuaranteeCoverage: 110 // Invalid coverage
    }
  ];
  
  testProducts.forEach(product => {
    console.log(`Validating: ${product.name}`);
    
    // Validate collateral parameters
    const collateralValidation = validateCollateralRecoveryParams(product);
    console.log(`  Collateral validation: ${collateralValidation.isValid ? 'VALID' : 'INVALID'}`);
    if (collateralValidation.warnings.length > 0) {
      console.log(`  Warnings: ${collateralValidation.warnings.join(', ')}`);
    }
    if (collateralValidation.errors.length > 0) {
      console.log(`  Errors: ${collateralValidation.errors.join(', ')}`);
    }
    
    // Validate state guarantee parameters
    const stateGuaranteeValidation = validateStateGuaranteeParams(product);
    console.log(`  State guarantee validation: ${stateGuaranteeValidation.isValid ? 'VALID' : 'INVALID'}`);
    if (stateGuaranteeValidation.warnings.length > 0) {
      console.log(`  Warnings: ${stateGuaranteeValidation.warnings.join(', ')}`);
    }
    if (stateGuaranteeValidation.errors.length > 0) {
      console.log(`  Errors: ${stateGuaranteeValidation.errors.join(', ')}`);
    }
    
    console.log('');
  });
};

/**
 * Esempio calcolo recovery per singolo default
 */
export const exampleSingleDefaultRecovery = () => {
  console.log('\n=== SINGLE DEFAULT RECOVERY EXAMPLE ===\n');
  
  const defaultAmount = 1000000; // €1M default
  const defaultQuarter = 8; // Default in Q8
  const totalQuarters = 40;
  
  const mockProduct = {
    type: 'french',
    ltv: 80,
    collateralHaircut: 15,
    recoveryCosts: 8,
    hasStateGuarantee: true,
    stateGuaranteeType: 'sace',
    stateGuaranteeCoverage: 80
  };
  
  const mockAssumptions = {
    costOfFundsRate: 3.5
  };
  
  console.log(`Default amount: €${(defaultAmount/1000000).toFixed(1)}M in Q${defaultQuarter + 1}`);
  
  // Calculate state guarantee recovery
  const stateGuaranteeRecovery = calculateStateGuaranteeRecovery(
    defaultAmount, 
    mockProduct, 
    mockAssumptions, 
    defaultQuarter, 
    totalQuarters
  );
  
  console.log('\nState Guarantee Recovery:');
  console.log(`  Guarantee type: ${stateGuaranteeRecovery.guaranteeType.toUpperCase()}`);
  console.log(`  Guaranteed amount: €${(stateGuaranteeRecovery.guaranteedAmount/1000000).toFixed(2)}M`);
  console.log(`  Recovery amount: €${(stateGuaranteeRecovery.recoveryAmount/1000000).toFixed(2)}M`);
  console.log(`  Recovery NPV: €${(stateGuaranteeRecovery.recoveryNPV/1000000).toFixed(2)}M`);
  console.log(`  Recovery time: ${stateGuaranteeRecovery.recoveryTime} years`);
  console.log(`  Start quarter: Q${stateGuaranteeRecovery.recoveryStartQuarter + 1}`);
  
  // Calculate collateral recovery on remaining amount
  const remainingAmount = defaultAmount - stateGuaranteeRecovery.guaranteedAmount;
  const collateralRecovery = calculateCollateralRecovery(
    remainingAmount,
    mockProduct,
    mockAssumptions,
    defaultQuarter,
    totalQuarters
  );
  
  console.log('\nCollateral Recovery:');
  console.log(`  Remaining amount: €${(remainingAmount/1000000).toFixed(2)}M`);
  console.log(`  Collateral value: €${(collateralRecovery.collateralValue/1000000).toFixed(2)}M`);
  console.log(`  Net recovery: €${(collateralRecovery.netRecovery/1000000).toFixed(2)}M`);
  console.log(`  Recovery NPV: €${(collateralRecovery.netRecoveryNPV/1000000).toFixed(2)}M`);
  console.log(`  Recovery rate: ${collateralRecovery.recoveryRate.toFixed(1)}%`);
  console.log(`  Recovery time: ${collateralRecovery.recoveryTime} years`);
  console.log(`  Start quarter: Q${collateralRecovery.recoveryStartQuarter + 1}`);
  
  // Total recovery
  const totalRecovery = stateGuaranteeRecovery.recoveryAmount + collateralRecovery.netRecovery;
  const totalRecoveryRate = (totalRecovery / defaultAmount) * 100;
  
  console.log('\nTotal Recovery Summary:');
  console.log(`  Total recovery: €${(totalRecovery/1000000).toFixed(2)}M`);
  console.log(`  Total recovery rate: ${totalRecoveryRate.toFixed(1)}%`);
  console.log(`  State guarantee contribution: ${((stateGuaranteeRecovery.recoveryAmount/totalRecovery)*100).toFixed(1)}%`);
  console.log(`  Collateral contribution: ${((collateralRecovery.netRecovery/totalRecovery)*100).toFixed(1)}%`);
};

// Per testing: uncomment per eseguire gli esempi
// exampleRecoveryCalculation();
// exampleRecoveryValidation();
// exampleSingleDefaultRecovery();