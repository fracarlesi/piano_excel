// Fixed products for Incentive Division - Only credit products
export const incentiveProducts = {
  incentiveBridgeFinancing: {
    name: 'Incentive Bridge Financing',
    productType: 'Credit',
    type: 'bullet',
    durata: 4,
    gracePeriod: 0,
    volumeArray: [10, 25, 40, 60, 80, 80, 80, 80, 80, 80],
    spread: 2.5,
    rwaDensity: 50,
    dangerRate: 1.0,
    lgd: 20,
    ltv: 90,
    recoveryCosts: 5,
    collateralHaircut: 10,
    avgLoanSize: 0.5,
    creditClassification: 'Bonis',
    isFixedRate: false,
    commissionRate: 2.0,
    equityUpside: 0,
    ftpRate: 1.5,
    isSecured: true,
    hasStateGuarantee: 'Present' // Government backed
  }
};