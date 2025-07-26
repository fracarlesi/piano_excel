export const defaultAssumptions = {
  version: '2.4', // Version for SME Division separation
  initialEquity: 200, 
  taxRate: 28, 
  costOfFundsRate: 3.0, 
  operatingAssetsRatio: 2.0,
  euribor: 3.5, // EURIBOR base rate
  avgCostPerFte: 100, 
  backOfficeCostsY1: 2, 
  adminCostsY1: 1.5,
  marketingCostsY1: 1, 
  hqAllocationY1: 2.5, 
  itCostsY1: 4, 
  costGrowthRate: 10, 
  otherCostsY1: 0.5,
  provisionsY1: 0.2, 
  commissionExpenseRate: 0.0,
  fundingMix: {
    sightDeposits: 40,
    termDeposits: 40,
    groupFunding: 20,
  },
  realEstateDivision: {
    fteY1: 100,
    fteY5: 150,
  },
  smeDivision: {
    fteY1: 80,
    fteY5: 120,
  },
  products: {
    reNoGaranzia: {
      name: 'Finanziamento Senza Garanzia Pubblica',
      volumes: { y1: 100, y5: 650 },
      avgLoanSize: 5.0, // Average loan size in €M
      spread: 5.0, // Spread over EURIBOR (was tasso: 8.5, now 3.5 + 5.0)
      rwaDensity: 100, 
      durata: 3, 
      commissionRate: 1.0,
      dangerRate: 5.0, 
      ltv: 75.0, 
      recoveryCosts: 15.0, 
      collateralHaircut: 30.0,
      quarterlyDist: [25, 25, 25, 25], 
      type: 'bullet'
    },
    reConGaranzia: {
      name: 'Finanziamento Con Garanzia Pubblica',
      volumes: { y1: 50, y5: 550 },
      avgLoanSize: 3.0, // Average loan size in €M
      spread: 3.0, // Spread over EURIBOR (was tasso: 6.5, now 3.5 + 3.0)
      rwaDensity: 20, 
      durata: 5, 
      commissionRate: 0.5,
      dangerRate: 1.5, 
      ltv: 80.0, 
      recoveryCosts: 10.0, 
      collateralHaircut: 20.0,
      quarterlyDist: [25, 25, 25, 25], 
      type: 'amortizing'
    },
    // SME Division Products
    smeRefinancing: {
      name: 'Refinancing (Rifinanziamento)',
      volumes: { y1: 15, y5: 75 },
      avgLoanSize: 15.0, // Average loan size in €M (as per description)
      spread: 3.5, // IRR Adj 7% - EURIBOR 3.5% = 3.5%
      rwaDensity: 80, // RWA 80% (Boris standard)
      durata: 5,
      commissionRate: 0.0, // No initial commission mentioned
      dangerRate: 1.0, // Standard risk (Boris)
      ltv: 70.0,
      recoveryCosts: 15.0,
      collateralHaircut: 25.0,
      quarterlyDist: [25, 25, 25, 25],
      type: 'amortizing', // After 2 years grace period
      gracePeriod: 2 // Grace period for interest only
    },
    smeBridge: {
      name: 'Bridge (Ponte)',
      volumes: { y1: 15, y5: 60 },
      avgLoanSize: 15.0, // Average loan size in €M (as per description)
      spread: 4.5, // IRR Adj 8% - EURIBOR 3.5% = 4.5%
      rwaDensity: 80, // RWA 80% (Boris standard)
      durata: 1.5,
      commissionRate: 3.0, // 3% commission
      dangerRate: 1.0, // Standard risk (Boris)
      ltv: 60.0,
      recoveryCosts: 20.0,
      collateralHaircut: 30.0,
      quarterlyDist: [25, 25, 25, 25],
      type: 'bullet' // Bullet repayment
    },
    smeSpecialSituation: {
      name: 'Special Situation',
      volumes: { y1: 20, y5: 80 },
      avgLoanSize: 20.0, // Average loan size in €M (as per description)
      spread: 5.5, // IRR Adj 9% - EURIBOR 3.5% = 5.5%
      rwaDensity: 100, // RWA 100% (higher risk)
      durata: 4,
      commissionRate: 2.0,
      dangerRate: 2.5, // Higher risk
      ltv: 50.0,
      recoveryCosts: 25.0,
      collateralHaircut: 40.0,
      quarterlyDist: [25, 25, 25, 25],
      type: 'bullet' // Bullet repayment
    },
    smeNuovaFinanza: {
      name: 'Nuova Finanza',
      volumes: { y1: 10, y5: 40 },
      avgLoanSize: 10.0, // Average loan size in €M (as per description)
      spread: 8.5, // IRR Adj 12% - EURIBOR 3.5% = 8.5%
      rwaDensity: 136, // RWA 136% (UTP classification)
      durata: 4,
      commissionRate: 1.5,
      dangerRate: 8.0, // Very high risk (UTP)
      ltv: 40.0,
      recoveryCosts: 30.0,
      collateralHaircut: 50.0,
      quarterlyDist: [25, 25, 25, 25],
      type: 'bullet', // Bullet repayment
      isFixedRate: true // Fixed rate
    },
    smeRestructuring: {
      name: 'Restructuring (Ristrutturazione)',
      volumes: { y1: 8, y5: 35 },
      avgLoanSize: 8.0, // Average loan size in €M
      spread: 11.5, // IRR Adj 15% - EURIBOR 3.5% = 11.5%
      rwaDensity: 100, // RWA 100% (UTP but restructured)
      durata: 5,
      commissionRate: 0.0, // No initial commission
      dangerRate: 6.0, // High risk but restructured
      ltv: 30.0,
      recoveryCosts: 35.0,
      collateralHaircut: 60.0,
      quarterlyDist: [25, 25, 25, 25],
      type: 'bullet', // Bullet repayment
      equityUpside: 2.5 // 2.5% equity upside
    }
  }
};