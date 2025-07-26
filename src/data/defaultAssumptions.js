export const defaultAssumptions = {
  initialEquity: 200, 
  taxRate: 28, 
  costOfFundsRate: 3.0, 
  operatingAssetsRatio: 2.0,
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
    frontOfficeRatio: 70, // % of FTE in front office
  },
  products: {
    reNoGaranzia: {
      name: 'Senza Garanzia Pubblica',
      volumes: { y1: 100, y5: 650 },
      tasso: 8.5, 
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
      name: 'Con Garanzia Pubblica',
      volumes: { y1: 50, y5: 550 },
      tasso: 6.5, 
      rwaDensity: 20, 
      durata: 5, 
      commissionRate: 0.5,
      dangerRate: 1.5, 
      ltv: 80.0, 
      recoveryCosts: 10.0, 
      collateralHaircut: 20.0,
      quarterlyDist: [25, 25, 25, 25], 
      type: 'amortizing'
    }
  }
};