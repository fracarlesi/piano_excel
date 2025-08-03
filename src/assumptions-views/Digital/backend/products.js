// Fixed products for Digital Banking Division
export const digitalProducts = {
  digitalBankingAccount: {
    name: 'Digital Banking Account',
    productType: 'DepositAndService',
    isDigital: true,
    acquisition: {
      newCustomersArray: [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 50000],
      cac: 30,
      churnRate: 5
    },
    baseAccount: {
      avgDeposit: 1500,
      interestRate: 0.1,
      monthlyFee: 0
    },
    savingsModule: {
      adoptionRate: 30,
      avgAdditionalDeposit: 5000,
      depositMix: [
        { name: 'Vincolato 12 mesi', percentage: 40, interestRate: 3.0 },
        { name: 'Vincolato 24 mesi', percentage: 35, interestRate: 3.5 },
        { name: 'Vincolato 36 mesi', percentage: 25, interestRate: 4.0 }
      ]
    },
    premiumServicesModule: {
      adoptionRate: 20,
      avgMonthlyRevenue: 6.67
    }
  },
  digitalPremiumAccount: {
    name: 'Premium Digital Account',
    productType: 'DepositAndService',
    isDigital: true,
    acquisition: {
      newCustomersArray: [2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 10000],
      cac: 50,
      churnRate: 3
    },
    baseAccount: {
      avgDeposit: 5000,
      interestRate: 0.5,
      monthlyFee: 9.99
    },
    savingsModule: {
      adoptionRate: 50,
      avgAdditionalDeposit: 15000,
      depositMix: [
        { name: 'Vincolato 12 mesi', percentage: 30, interestRate: 3.5 },
        { name: 'Vincolato 24 mesi', percentage: 40, interestRate: 4.0 },
        { name: 'Vincolato 36 mesi', percentage: 30, interestRate: 4.5 }
      ]
    },
    premiumServicesModule: {
      adoptionRate: 40,
      avgMonthlyRevenue: 15
    }
  }
};