/**
 * Wealth P&L Orchestrator
 * 
 * Coordina tutti i calcoli del conto economico per la divisione Wealth
 * Include: commission income (vari tipi), carried interest, personnel costs
 */

import { calculateReferralFees } from './operating-costs/ReferralFeesCalculator.js';
import { calculateConsultationFees } from './commission-income/ConsultationFeesCalculator.js';
import { calculateStructuringFees } from './commission-income/StructuringFeesCalculator.js';
import { calculateManagementFees } from './commission-income/ManagementFeesCalculator.js';
import { calculateCarriedInterest } from './commission-income/CarriedInterestCalculator.js';
import { PersonnelCalculator } from './personnel-calculators/personnelCalculator.js';

export const calculateWealthPnL = (assumptions, balanceSheetResults, digitalClients, quarters = 40) => {
  console.log('💎 Starting Wealth P&L calculation...');
  
  const results = {
    quarterly: {},
    annual: {},
    byComponent: {
      referralFees: null,
      consultationFees: null,
      structuringFees: null,
      managementFees: null,
      carriedInterest: null,
      personnelCosts: null
    },
    summary: {
      totalRevenues: 0,
      totalCosts: 0,
      netIncome: 0,
      revenueBreakdown: {
        referralFees: 0,
        consultationFees: 0,
        structuringFees: 0,
        managementFees: 0,
        carriedInterest: 0
      }
    }
  };

  try {
    // Get Wealth AUM data from balance sheet
    const wealthAUM = balanceSheetResults?.wealth?.aum || null;
    
    if (!wealthAUM) {
      console.warn('⚠️ No Wealth AUM data available, some calculations may be incomplete');
    }

    // 1. Calculate Referral Fees (COST for Wealth)
    console.log('💸 Calculating referral fees (cost)...');
    const referralResults = calculateReferralFees(assumptions, digitalClients, quarters);
    results.byComponent.referralFees = referralResults;
    
    // 2. Calculate Consultation Fees
    console.log('💼 Calculating consultation fees...');
    const consultationResults = calculateConsultationFees(assumptions, { digitalClients }, quarters);
    results.byComponent.consultationFees = consultationResults;
    
    // 3. Calculate Structuring Fees
    console.log('📊 Calculating structuring fees...');
    const structuringResults = calculateStructuringFees(assumptions, { digitalClients }, quarters);
    results.byComponent.structuringFees = structuringResults;
    
    // 4. Calculate Management Fees (requires AUM)
    console.log('📈 Calculating management fees...');
    const managementResults = calculateManagementFees(assumptions, wealthAUM, quarters);
    results.byComponent.managementFees = managementResults;
    
    // 5. Calculate Carried Interest (requires AUM)
    console.log('💸 Calculating carried interest...');
    const carriedResults = calculateCarriedInterest(assumptions, wealthAUM, quarters);
    results.byComponent.carriedInterest = carriedResults;
    
    // 6. Calculate Personnel Costs
    console.log('👥 Calculating personnel costs...');
    const personnelCalc = new PersonnelCalculator(
      assumptions.wealthDivision,
      assumptions.wealthDivision,
      generateQuartersList(quarters)
    );
    const personnelCosts = personnelCalc.getPersonnelCostsForPnL();
    results.byComponent.personnelCosts = personnelCosts;
    
    // Aggregate quarterly results
    for (let q = 0; q < quarters; q++) {
      const quarterKey = `Q${(q % 4) + 1}Y${Math.floor(q / 4) + 1}`;
      
      results.quarterly[quarterKey] = {
        // Commission Income (excluding referral fees which are costs)
        'Consultation fees': consultationResults.quarterly.total[q] / 1000000,
        'Structuring fees': structuringResults.quarterly.total[q] / 1000000,
        'Management fees': managementResults.quarterly.total[q] / 1000000,
        'Carried interest': carriedResults.quarterly.total[q] / 1000000,
        
        // Total Commission Income
        'Total commission income': (
          consultationResults.quarterly.total[q] +
          structuringResults.quarterly.total[q] +
          managementResults.quarterly.total[q] +
          carriedResults.quarterly.total[q]
        ) / 1000000,
        
        // Operating Costs
        ...personnelCosts[quarterKey],
        
        // Other operating costs (includes referral fees paid to Digital)
        'Referral fees to Digital': -referralResults.quarterly.total[q] / 1000000,
        'Other operating costs': -referralResults.quarterly.total[q] / 1000000,
        
        // EBITDA
        'EBITDA': 0 // Will be calculated below
      };
      
      // Calculate EBITDA
      results.quarterly[quarterKey]['EBITDA'] = 
        results.quarterly[quarterKey]['Total commission income'] +
        results.quarterly[quarterKey]['Personnel costs'] +
        results.quarterly[quarterKey]['Other operating costs'];
    }
    
    // Aggregate annual results
    for (let year = 0; year < 10; year++) {
      const yearKey = `Y${year + 1}`;
      
      results.annual[yearKey] = {
        'Consultation fees': consultationResults.annual.total[year] / 1000000,
        'Structuring fees': structuringResults.annual.total[year] / 1000000,
        'Management fees': managementResults.annual.total[year] / 1000000,
        'Carried interest': carriedResults.annual.total[year] / 1000000,
        'Total commission income': 0,
        'Personnel costs': 0,
        'Referral fees to Digital': -referralResults.annual.total[year] / 1000000,
        'Other operating costs': -referralResults.annual.total[year] / 1000000,
        'EBITDA': 0
      };
      
      // Sum quarterly data for annual
      for (let q = 0; q < 4; q++) {
        const quarterIndex = year * 4 + q;
        if (quarterIndex < quarters) {
          const quarterKey = `Q${q + 1}Y${year + 1}`;
          results.annual[yearKey]['Personnel costs'] += results.quarterly[quarterKey]['Personnel costs'];
        }
      }
      
      // Calculate totals
      results.annual[yearKey]['Total commission income'] = 
        results.annual[yearKey]['Consultation fees'] +
        results.annual[yearKey]['Structuring fees'] +
        results.annual[yearKey]['Management fees'] +
        results.annual[yearKey]['Carried interest'];
      
      results.annual[yearKey]['EBITDA'] = 
        results.annual[yearKey]['Total commission income'] +
        results.annual[yearKey]['Personnel costs'] +
        results.annual[yearKey]['Other operating costs'];
    }
    
    // Calculate summary metrics
    results.summary = {
      totalRevenues: (
        consultationResults.metrics.totalConsultationFees +
        structuringResults.metrics.totalStructuringFees +
        managementResults.metrics.totalManagementFees +
        carriedResults.metrics.totalCarriedInterest
      ) / 1000000,
      totalCosts: Object.values(personnelCosts).reduce((sum, quarter) => 
        sum + Math.abs(quarter['Personnel costs']), 0
      ) + (referralResults.metrics.totalReferralFees / 1000000),
      revenueBreakdown: {
        consultationFees: consultationResults.metrics.totalConsultationFees / 1000000,
        structuringFees: structuringResults.metrics.totalStructuringFees / 1000000,
        managementFees: managementResults.metrics.totalManagementFees / 1000000,
        carriedInterest: carriedResults.metrics.totalCarriedInterest / 1000000
      },
      costBreakdown: {
        referralFeesToDigital: referralResults.metrics.totalReferralFees / 1000000,
        personnelCosts: Object.values(personnelCosts).reduce((sum, quarter) => 
          sum + Math.abs(quarter['Personnel costs']), 0
        )
      }
    };
    
    results.summary.netIncome = results.summary.totalRevenues - results.summary.totalCosts;
    
    console.log('✅ Wealth P&L calculation completed');
    console.log(`💰 Total Revenues: €${results.summary.totalRevenues.toFixed(1)}M`);
    console.log(`💸 Total Costs: €${results.summary.totalCosts.toFixed(1)}M`);
    console.log(`📈 Net Income: €${results.summary.netIncome.toFixed(1)}M`);
    
  } catch (error) {
    console.error('❌ Error in Wealth P&L calculation:', error);
    throw error;
  }

  return results;
};

// Helper function to generate quarters list
function generateQuartersList(quarters) {
  const quartersList = [];
  for (let i = 0; i < quarters; i++) {
    quartersList.push(`Q${(i % 4) + 1}Y${Math.floor(i / 4) + 1}`);
  }
  return quartersList;
}