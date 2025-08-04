/**
 * Referral Fees Calculator for Wealth Division
 * 
 * Calcola i referral fees pagati dalla divisione Wealth al Digital Banking
 * per ogni cliente affluent che viene riferito ai servizi Wealth
 * 
 * Questi sono COSTI per Wealth (Other OPEX)
 */

export const calculateReferralFees = (assumptions, digitalClients, quarters = 40) => {
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
      totalReferralFees: 0,
      totalClientsReferred: 0,
      byProduct: {}
    }
  };

  // Prodotti Wealth definiti nelle assumptions
  const wealthProducts = ['wealthRealEstateFund', 'wealthSMEDebt', 'wealthIncentiveFund'];
  
  wealthProducts.forEach(productKey => {
    const product = assumptions.products?.[productKey];
    if (!product || !product.digitalReferral) return;

    const { adoptionRate, referralFee } = product.digitalReferral;
    
    // Initialize arrays
    results.quarterly.byProduct[productKey] = new Array(quarters).fill(0);
    results.annual.byProduct[productKey] = new Array(10).fill(0);
    results.metrics.byProduct[productKey] = {
      totalFees: 0,
      totalClients: 0,
      referralFee,
      adoptionRate
    };

    // Calculate quarterly referral fees
    for (let q = 0; q < quarters; q++) {
      const year = Math.floor(q / 4);
      
      // Get all digital division customers (using correct product keys)
      const digitalBankAccount = digitalClients?.byProduct?.digitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
      const premiumDigitalAccount = digitalClients?.byProduct?.premiumDigitalBankAccount?.activeCustomers?.quarterly?.[q] || 0;
      const depositAccount = digitalClients?.byProduct?.depositAccount?.activeCustomers?.quarterly?.[q] || 0;
      
      // Total digital customers across all products
      const totalDigitalCustomers = digitalBankAccount + premiumDigitalAccount + depositAccount;
      
      // Calculate new wealth clients (adoption rate % of total digital customers)
      const newWealthClients = totalDigitalCustomers * (adoptionRate / 100);
      
      // Calculate referral fees
      const quarterlyReferralFees = newWealthClients * referralFee;
      
      results.quarterly.byProduct[productKey][q] = quarterlyReferralFees;
      results.quarterly.total[q] += quarterlyReferralFees;
      
      // Update metrics
      results.metrics.byProduct[productKey].totalFees += quarterlyReferralFees;
      results.metrics.byProduct[productKey].totalClients += newWealthClients;
      results.metrics.totalReferralFees += quarterlyReferralFees;
      results.metrics.totalClientsReferred += newWealthClients;
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