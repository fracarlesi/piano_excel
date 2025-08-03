// Wealth Products - Cross-selling model (no direct products)
export const wealthProducts = {
  wealthRealEstateFund: {
    name: 'Real Estate Investment Fund',
    productType: 'WealthManagement',
    isWealth: true,
    originatingDivision: 'realEstate',
    digitalReferral: {
      adoptionRate: 5,
      referralFee: 150
    },
    clientEngagement: {
      consultationFee: 2500
    },
    captiveInvestment: {
      avgInvestmentPerClient: 150000,
      structuringFee: 3.0,
      managementFee: 2.0,
      avgDealDuration: 4
    }
  },
  wealthSMEDebt: {
    name: 'SME Private Debt Fund',
    productType: 'WealthManagement',
    isWealth: true,
    originatingDivision: 'sme',
    digitalReferral: {
      adoptionRate: 4,
      referralFee: 150
    },
    clientEngagement: {
      consultationFee: 2500
    },
    captiveInvestment: {
      avgInvestmentPerClient: 100000,
      structuringFee: 2.5,
      managementFee: 1.8,
      avgDealDuration: 3
    }
  },
  wealthTechVenture: {
    name: 'Tech & Innovation Fund',
    productType: 'WealthManagement',
    isWealth: true,
    originatingDivision: 'tech',
    digitalReferral: {
      adoptionRate: 3,
      referralFee: 200
    },
    clientEngagement: {
      consultationFee: 3000
    },
    captiveInvestment: {
      avgInvestmentPerClient: 200000,
      structuringFee: 4.0,
      managementFee: 2.5,
      avgDealDuration: 5
    }
  },
  wealthIncentiveFund: {
    name: 'Government Incentive Optimization',
    productType: 'WealthManagement',
    isWealth: true,
    originatingDivision: 'incentive',
    digitalReferral: {
      adoptionRate: 2,
      referralFee: 100
    },
    clientEngagement: {
      consultationFee: 1500
    },
    captiveInvestment: {
      avgInvestmentPerClient: 50000,
      structuringFee: 2.0,
      managementFee: 1.5,
      avgDealDuration: 2
    }
  }
};