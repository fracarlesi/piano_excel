// Fixed products for Digital Banking Division
export const digitalProducts = {
  digitalBankAccount: {
    name: 'Digital Bank Account',
    division: 'digital',
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
      adoptionRate: 0,
      avgAdditionalDeposit: 0,
      depositMix: []
    },
    premiumServicesModule: {
      adoptionRate: 0,
      avgMonthlyRevenue: 0
    }
  },
  premiumDigitalBankAccount: {
    name: 'Premium Digital Bank Account',
    division: 'digital',
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
      monthlyFee: 9.90
    },
    premiumServicesModule: {
      avgMonthlyRevenue: 15
    }
  },
  depositAccount: {
    name: 'Deposit Account',
    division: 'digital',
    productType: 'DepositAndService',
    isDigital: true,
    acquisition: {
      newCustomersArray: [5000, 7500, 10000, 12500, 15000, 17500, 20000, 22500, 25000, 25000],
      cac: 20,
      churnRate: 10
    },
    savingsModule: {
      avgAdditionalDeposit: 10000,
      depositMix: [
        { name: 'Vincolato 6 mesi', percentage: 15, interestRate: 2.5 },
        { name: 'Vincolato 12 mesi', percentage: 20, interestRate: 3.0 },
        { name: 'Vincolato 18 mesi', percentage: 15, interestRate: 3.5 },
        { name: 'Vincolato 24 mesi', percentage: 20, interestRate: 4.0 },
        { name: 'Vincolato 36 mesi', percentage: 15, interestRate: 4.5 },
        { name: 'Vincolato 48 mesi', percentage: 10, interestRate: 5.0 },
        { name: 'Vincolato 60 mesi', percentage: 5, interestRate: 5.5 }
      ]
    }
  }
};