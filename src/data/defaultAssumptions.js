export const defaultAssumptions = {
  version: '5.31', // Fixed Loan Maturity and Grace Period fields to properly handle zero values
  initialEquity: 200, 
  taxRate: 28, 
  costOfFundsRate: 3.0, 
  euribor: 3.5, // EURIBOR base rate
  ftpSpread: 1.5, // Spread over EURIBOR for FTP rate (FTP = EURIBOR + ftpSpread)
  depositRate: 0.5, // Rate paid to customers on deposit accounts
  testNewField: 999, // TEST: Nuovo campo per verificare smart merge
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
  
  // Central Functions Division - Non-allocated costs
  centralFunctions: {
    boardAndExecutiveCostsY1: 3.5, // Board, CEO, executive management costs
    complianceCostsY1: 2.8, // Compliance, regulatory reporting, AML
    auditCostsY1: 1.2, // Internal and external audit
    legalCostsY1: 1.5, // Legal department and external counsel
    riskManagementCostsY1: 2.0, // Central risk management function
    strategyAndPlanningCostsY1: 1.0, // Strategic planning, M&A, investor relations
    hrCentralCostsY1: 1.5, // Central HR, training, recruitment
    facilitiesCostsY1: 3.0, // Headquarters, central facilities
    fteY1: 120, // Central functions headcount
    fteY5: 150  // Target headcount by year 5
  },
  
  // Treasury / ALM Division
  treasury: {
    interbankFundingRate: 4.0, // Cost of interbank funding (%)
    liquidityBufferRequirement: 20, // % of deposits to hold as liquidity buffer
    liquidAssetReturnRate: 2.5, // Return on liquid assets (%)
    tradingBookSize: 50, // Initial trading book size (€M)
    tradingBookGrowthRate: 5, // Annual growth rate (%)
    tradingBookReturnTarget: 8, // Target return on trading book (%)
    tradingBookVolatility: 15, // Trading book return volatility (%)
    fteY1: 25, // Treasury headcount
    fteY5: 35  // Target headcount by year 5
  },
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
  digitalBankingDivision: {
    fteY1: 40,
    fteY5: 80,
  },
  products: {
    reSecuritization: {
      name: 'Finanziamenti alle Cartolarizzazioni Immobiliari (Note Senior)',
      volumes: { y1: 150, y10: 800 },
      avgLoanSize: 25.0, // Finanziamenti di importo significativo
      spread: 2.8, // Spread contenuto per note senior sicure
      rwaDensity: 35, // Bassa rischiosità per note senior
      durata: 7, // Durata media-lunga
      commissionRate: 0.3, // Commissione contenuta
      dangerRate: 0.8, // Rischio molto basso
      ltv: 65.0, // LTV conservativo
      recoveryCosts: 8.0, // Costi di recupero bassi
      collateralHaircut: 15.0, // Haircut moderato
      quarterlyDist: [25, 25, 25, 25],
      type: 'amortizing'
    },
    reMortgage: {
      name: 'Finanziamenti Ipotecari',
      volumes: { y1: 200, y10: 1200 },
      avgLoanSize: 0.8, // Finanziamenti retail di importo contenuto
      spread: 2.2, // Spread competitivo per ipoteche
      rwaDensity: 45, // RWA standard per mutui residenziali
      durata: 25, // Durata tipica dei mutui
      commissionRate: 0.8, // Commissione di istruttoria
      dangerRate: 1.2, // Rischio contenuto
      ltv: 80.0, // LTV standard per mutui
      recoveryCosts: 12.0, // Costi procedura standard
      collateralHaircut: 20.0, // Haircut standard
      quarterlyDist: [25, 25, 25, 25],
      type: 'french' // Ammortamento alla francese
    },
    reBridge: {
      name: 'Finanziamenti Corporate Bridge Loan',
      volumes: { y1: 80, y10: 400 },
      avgLoanSize: 15.0, // Finanziamenti corporate di taglia media
      spread: 4.2, // Spread elevato per bridge loan
      rwaDensity: 85, // Alta rischiosità per natura temporanea
      durata: 2, // Durata breve tipica dei bridge
      commissionRate: 2.5, // Commissioni elevate per complessità
      dangerRate: 3.5, // Rischio elevato per natura bridge
      ltv: 70.0, // LTV prudenziale
      recoveryCosts: 18.0, // Costi più elevati per corporate
      collateralHaircut: 25.0, // Haircut prudenziale
      quarterlyDist: [25, 25, 25, 25],
      type: 'bullet' // Rimborso bullet tipico
    },
    // SME Division Products
    smeRefinancing: {
      name: 'Refinancing (Rifinanziamento)',
      volumes: { y1: 15, y10: 75 },
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
      volumes: { y1: 15, y10: 60 },
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
      volumes: { y1: 20, y10: 80 },
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
      volumes: { y1: 10, y10: 40 },
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
      volumes: { y1: 8, y10: 35 },
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
    },
    // Digital Banking Division - Unified Customer Model with Modular Services
    digitalRetailCustomer: {
      name: 'Cliente Retail Digitale',
      productType: 'DepositAndService', // Tipo speciale per attivare la logica corretta
      isDigital: true,

      acquisition: {
        newCustomers: { y1: 50000, y5: 250000 },
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
          { name: 'Svincolato', percentage: 40, interestRate: 2.5 },
          { name: 'Vincolato 12M', percentage: 60, interestRate: 3.5 }
        ]
      },
      premiumServicesModule: {
        adoptionRate: 20,
        avgAnnualRevenue: 80
      },
      wealthManagementReferral: {
        adoptionRate: 5,
        referralFee: 150
      }
    }
  }
};

export default defaultAssumptions;