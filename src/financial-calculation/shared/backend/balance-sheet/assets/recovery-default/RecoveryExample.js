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
  
  
  // 1. CALCOLO RECOVERY COMPLETO
  const recoveryResults = calculateRecoveryDefault(mockDivisions, mockAssumptions, quarters);
  
  
  // 2. DETTAGLIO RECOVERY PER PRODOTTO
  Object.entries(recoveryResults.byProduct).forEach(([productKey, product]) => {
  });
  
  // 3. QUARTERLY BREAKDOWN (primi 12 trimestri)
  for (let q = 0; q < 12; q++) {
    const total = recoveryResults.balanceSheetLine.quarterly[q];
    const collateral = recoveryResults.byRecoveryType.collateralRecovery[q];
    const stateGuarantee = recoveryResults.byRecoveryType.stateGuaranteeRecovery[q];
    
    if (total > 0) {
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
    
    // Validate collateral parameters
    const collateralValidation = validateCollateralRecoveryParams(product);
    if (collateralValidation.warnings.length > 0) {
    }
    if (collateralValidation.errors.length > 0) {
    }
    
    // Validate state guarantee parameters
    const stateGuaranteeValidation = validateStateGuaranteeParams(product);
    if (stateGuaranteeValidation.warnings.length > 0) {
    }
    if (stateGuaranteeValidation.errors.length > 0) {
    }
    
  });
};

/**
 * Esempio calcolo recovery per singolo default
 */
export const exampleSingleDefaultRecovery = () => {
  
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
  
  
  // Calculate state guarantee recovery
  const stateGuaranteeRecovery = calculateStateGuaranteeRecovery(
    defaultAmount, 
    mockProduct, 
    mockAssumptions, 
    defaultQuarter, 
    totalQuarters
  );
  
  
  // Calculate collateral recovery on remaining amount
  const remainingAmount = defaultAmount - stateGuaranteeRecovery.guaranteedAmount;
  const collateralRecovery = calculateCollateralRecovery(
    remainingAmount,
    mockProduct,
    mockAssumptions,
    defaultQuarter,
    totalQuarters
  );
  
  
  // Total recovery
  const totalRecovery = stateGuaranteeRecovery.recoveryAmount + collateralRecovery.netRecovery;
  const totalRecoveryRate = (totalRecovery / defaultAmount) * 100;
  
};

// Per testing: uncomment per eseguire gli esempi
// exampleRecoveryCalculation();
// exampleRecoveryValidation();
// exampleSingleDefaultRecovery();