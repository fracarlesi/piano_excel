/**
 * Consultation Fees Calculator for Wealth Division
 * 
 * Calcola i consultation fees generati dalle consulenze ai clienti Wealth
 * Basato sul numero di clienti acquisiti e il consultation fee per prodotto
 */

export const calculateConsultationFees = (assumptions, referralResults, quarters = 40) => {
  const results = {
    quarterly: {
      total: new Array(quarters).fill(0),
      byProduct: {}
    },
    annual: {
      total: new Array(10).fill(0),
      byProduct: {}
    },
    metrics: {
      totalConsultationFees: 0,
      totalConsultations: 0,
      byProduct: {}
    }
  };

  // Prodotti Wealth definiti nelle assumptions
  const wealthProducts = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthTechVenture', 'wealthIncentiveFund'];
  
  wealthProducts.forEach(productKey => {
    const product = assumptions.products?.[productKey];
    if (!product || !product.clientEngagement) return;

    const { consultationFee } = product.clientEngagement;
    const { adoptionRate } = product.digitalReferral || { adoptionRate: 0 };
    
    // Initialize arrays
    results.quarterly.byProduct[productKey] = new Array(quarters).fill(0);
    results.annual.byProduct[productKey] = new Array(10).fill(0);
    results.metrics.byProduct[productKey] = {
      totalFees: 0,
      totalConsultations: 0,
      consultationFee
    };

    // Calculate quarterly consultation fees
    for (let q = 0; q < quarters; q++) {
      // Get all digital division customers (using correct keys)
      const digitalBankAccount = referralResults?.digitalClients?.byProduct?.digitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
      const premiumDigitalAccount = referralResults?.digitalClients?.byProduct?.premiumDigitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
      const depositAccount = referralResults?.digitalClients?.byProduct?.depositAccount?.activeCustomers?.quarterly?.[q] || 0;
      
      // Total digital customers across all products
      const totalDigitalCustomers = digitalBankAccount + premiumDigitalAccount + depositAccount;
      
      // Calculate new wealth clients (same as referral calculation)
      const newWealthClients = totalDigitalCustomers * (adoptionRate / 100);
      
      // Assume 100% of new clients require initial consultation
      const consultations = newWealthClients;
      
      // Calculate consultation fees
      const quarterlyConsultationFees = consultations * consultationFee;
      
      results.quarterly.byProduct[productKey][q] = quarterlyConsultationFees;
      results.quarterly.total[q] += quarterlyConsultationFees;
      
      // Update metrics
      results.metrics.byProduct[productKey].totalFees += quarterlyConsultationFees;
      results.metrics.byProduct[productKey].totalConsultations += consultations;
      results.metrics.totalConsultationFees += quarterlyConsultationFees;
      results.metrics.totalConsultations += consultations;
    }

    // Calculate annual totals
    for (let year = 0; year < 10; year++) {
      let annualTotal = 0;
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        if (quarterIndex < quarters) {
          annualTotal += results.quarterly.byProduct[productKey][quarterIndex];
        }
      }
      results.annual.byProduct[productKey][year] = annualTotal;
      results.annual.total[year] += annualTotal;
    }
  });

  return results;
};