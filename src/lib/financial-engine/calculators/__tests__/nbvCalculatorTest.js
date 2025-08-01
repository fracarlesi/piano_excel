import { 
  calculateSecuredNBV, 
  calculateUnsecuredNBV, 
  calculateStateGuaranteeNBV,
  calculateNBV,
  calculatePortfolioNBV 
} from '../nbvCalculator';

describe('NBV Calculator Microservice Test', () => {
  const quarterlyRate = 0.01875; // 7.5% annual / 4

  test('Secured loan NBV calculation', () => {
    console.log('\n=== SECURED LOAN NBV TEST ===');
    
    const product = {
      ltv: 70,
      collateralHaircut: 25,
      recoveryCosts: 15,
      timeToRecover: 12 // 12 quarters
    };
    
    const defaultAmount = 100; // €100M default
    const result = calculateSecuredNBV(defaultAmount, product, quarterlyRate);
    
    console.log('\nSecured Loan NBV Details:');
    console.log(`- Default amount: €${defaultAmount}M`);
    console.log(`- Collateral value: €${result.collateralValue.toFixed(2)}M`);
    console.log(`- After haircut: €${result.valueAfterHaircut.toFixed(2)}M`);
    console.log(`- Recovery costs: €${result.recoveryCosts.toFixed(2)}M`);
    console.log(`- Net recovery: €${result.netRecovery.toFixed(2)}M`);
    console.log(`- Discount factor: ${result.discountFactor.toFixed(4)}`);
    console.log(`- NBV: €${result.nbv.toFixed(2)}M`);
    console.log(`- LLP provision: €${result.llp.toFixed(2)}M`);
    
    expect(result.nbv).toBeGreaterThan(0);
    expect(result.nbv).toBeLessThan(defaultAmount);
  });

  test('Unsecured loan NBV calculation', () => {
    console.log('\n=== UNSECURED LOAN NBV TEST ===');
    
    const product = {
      isUnsecured: true,
      unsecuredLGD: 45,
      timeToRecover: 12 // 12 quarters
    };
    
    const defaultAmount = 100; // €100M default
    const result = calculateUnsecuredNBV(defaultAmount, product, quarterlyRate);
    
    console.log('\nUnsecured Loan NBV Details:');
    console.log(`- Default amount: €${defaultAmount}M`);
    console.log(`- LGD: ${result.lgd}%`);
    console.log(`- Recovery rate: ${(result.recoveryRate * 100).toFixed(2)}%`);
    console.log(`- Expected recovery: €${result.expectedRecovery.toFixed(2)}M`);
    console.log(`- Discount factor: ${result.discountFactor.toFixed(4)}`);
    console.log(`- NBV: €${result.nbv.toFixed(2)}M`);
    console.log(`- LLP provision: €${result.llp.toFixed(2)}M`);
    
    expect(result.recoveryRate).toBe(0.55); // 55% recovery (100% - 45% LGD)
    expect(result.nbv).toBeCloseTo(44.05, 1); // Discounted value
  });

  test('State guarantee NBV calculation', () => {
    console.log('\n=== STATE GUARANTEE NBV TEST ===');
    
    const product = {
      stateGuaranteeRecoveryTime: 2 // 2 quarters (6 months)
    };
    
    const guaranteedAmount = 80; // €80M guaranteed
    const result = calculateStateGuaranteeNBV(guaranteedAmount, product, quarterlyRate);
    
    console.log('\nState Guarantee NBV Details:');
    console.log(`- Guaranteed amount: €${guaranteedAmount}M`);
    console.log(`- Recovery amount: €${result.recoveryAmount}M`);
    console.log(`- Recovery time: ${result.recoveryTime} quarters`);
    console.log(`- Discount factor: ${result.discountFactor.toFixed(4)}`);
    console.log(`- NBV: €${result.nbv.toFixed(2)}M`);
    
    expect(result.recoveryAmount).toBe(guaranteedAmount); // 100% recovery
    expect(result.nbv).toBeCloseTo(77.05, 1); // Discounted value
  });

  test('Mixed loan with state guarantee', () => {
    console.log('\n=== MIXED LOAN WITH STATE GUARANTEE TEST ===');
    
    const product = {
      ltv: 70,
      collateralHaircut: 25,
      recoveryCosts: 15,
      timeToRecover: 12, // 12 quarters
      stateGuaranteeType: 'present',
      stateGuaranteeCoverage: 80,
      stateGuaranteeRecoveryTime: 2 // 2 quarters
    };
    
    const defaultAmount = 100; // €100M default
    const result = calculateNBV(defaultAmount, product, quarterlyRate);
    
    console.log('\nMixed Loan NBV Summary:');
    console.log(`- Total default: €${result.totalDefault}M`);
    console.log(`- Total NBV: €${result.totalNBV.toFixed(2)}M`);
    console.log(`- Total LLP: €${result.totalLLP.toFixed(2)}M`);
    console.log(`- Implied recovery rate: ${result.impliedRecoveryRate.toFixed(2)}%`);
    
    console.log('\nComponent breakdown:');
    result.components.forEach(comp => {
      console.log(`\n${comp.type}:`);
      console.log(`  - Gross amount: €${comp.grossAmount.toFixed(2)}M`);
      console.log(`  - NBV: €${comp.nbv.toFixed(2)}M`);
    });
    
    expect(result.components).toHaveLength(2); // State guarantee + secured
    expect(result.totalNBV).toBeGreaterThan(70); // High recovery due to state guarantee
  });

  test('Portfolio NBV calculation', () => {
    console.log('\n=== PORTFOLIO NBV TEST ===');
    
    const defaults = [
      {
        quarter: 4,
        amount: 50,
        product: {
          name: 'Secured Loan',
          ltv: 70,
          collateralHaircut: 25,
          recoveryCosts: 15,
          timeToRecover: 12
        }
      },
      {
        quarter: 8,
        amount: 30,
        product: {
          name: 'State Guaranteed',
          ltv: 70,
          collateralHaircut: 25,
          recoveryCosts: 15,
          timeToRecover: 12,
          stateGuaranteeType: 'present',
          stateGuaranteeCoverage: 80,
          stateGuaranteeRecoveryTime: 2
        }
      },
      {
        quarter: 12,
        amount: 20,
        product: {
          name: 'Unsecured Loan',
          isUnsecured: true,
          unsecuredLGD: 45,
          timeToRecover: 12
        }
      }
    ];
    
    const portfolio = calculatePortfolioNBV(defaults, quarterlyRate);
    
    console.log('\nPortfolio NBV Summary:');
    console.log(`- Total defaults: €${portfolio.totalDefault}M`);
    console.log(`- Total NBV: €${portfolio.totalNBV.toFixed(2)}M`);
    console.log(`- Total LLP: €${portfolio.totalLLP.toFixed(2)}M`);
    console.log(`- Portfolio recovery rate: ${portfolio.portfolioRecoveryRate.toFixed(2)}%`);
    
    console.log('\nDefault details:');
    portfolio.details.forEach(detail => {
      console.log(`\nQ${detail.quarter} - ${detail.product}:`);
      console.log(`  - Default: €${detail.totalDefault}M`);
      console.log(`  - NBV: €${detail.totalNBV.toFixed(2)}M`);
      console.log(`  - Recovery rate: ${detail.impliedRecoveryRate.toFixed(2)}%`);
    });
    
    expect(portfolio.totalDefault).toBe(100);
    expect(portfolio.totalNBV).toBeGreaterThan(60); // Mixed recovery rates
  });
});