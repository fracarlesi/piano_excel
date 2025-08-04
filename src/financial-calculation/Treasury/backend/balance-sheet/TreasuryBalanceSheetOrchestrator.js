/**
 * Treasury Balance Sheet Orchestrator
 * 
 * Manages centralized liquidity and working capital for all divisions
 * Consolidates operational cash requirements from all divisions
 */

export class TreasuryBalanceSheetOrchestrator {
  /**
   * Calculate Treasury balance sheet including consolidated working capital
   * @param {Object} assumptions - Treasury assumptions
   * @param {Object} globalAssumptions - Global assumptions
   * @param {Object} divisionRequirements - Operational requirements from all divisions
   * @returns {Object} Treasury balance sheet data
   */
  calculateBalanceSheet(assumptions, globalAssumptions, divisionRequirements = {}) {
    console.log('🏦 Starting Treasury Balance Sheet calculation...');
    console.log('  Division requirements:', divisionRequirements);
    
    // Step 1: Consolidate working capital from all divisions
    const consolidatedWorkingCapital = this.consolidateWorkingCapital(divisionRequirements);
    
    // Step 2: Calculate central cash management
    const centralCash = this.calculateCentralCash(assumptions, consolidatedWorkingCapital);
    
    // Step 3: Calculate intercompany positions
    const intercompanyPositions = this.calculateIntercompanyPositions(divisionRequirements);
    
    // Step 4: Calculate group funding requirements
    const groupFunding = this.calculateGroupFunding(centralCash, intercompanyPositions);
    
    return {
      assets: {
        centralCash: centralCash,
        intercompanyReceivables: intercompanyPositions.receivables,
        consolidatedWorkingCapital: consolidatedWorkingCapital,
        totalAssets: this.calculateTotalTreasuryAssets(centralCash, intercompanyPositions, consolidatedWorkingCapital),
        // For consistency with other divisions
        newVolumes: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        repayments: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        stockNBV: centralCash, // Central cash as main asset
        netPerformingAssets: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      liabilities: {
        intercompanyPayables: intercompanyPositions.payables,
        groupFunding: groupFunding,
        equity: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }, // Minimal equity
        // No customer deposits (managed at division level for Digital)
        customerDeposits: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        sightDeposits: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
        termDeposits: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
      },
      workingCapitalManagement: {
        divisionAllocations: this.calculateDivisionAllocations(divisionRequirements),
        cashPooling: this.calculateCashPooling(consolidatedWorkingCapital),
        fundingCosts: this.calculateInternalFundingCosts(assumptions, divisionRequirements)
      }
    };
  }

  /**
   * Consolidate working capital requirements from all divisions
   */
  consolidateWorkingCapital(divisionRequirements) {
    const consolidated = {
      cash: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      accountsReceivable: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      prepaidExpenses: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      accountsPayable: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      accruedExpenses: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      netWorkingCapital: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) },
      total: { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) }
    };

    // Consolidate from all divisions that have working capital needs
    Object.entries(divisionRequirements).forEach(([divisionKey, requirements]) => {
      if (requirements?.workingCapitalNeeds) {
        const wcNeeds = requirements.workingCapitalNeeds;
        
        // Sum up quarterly values
        for (let q = 0; q < 40; q++) {
          consolidated.cash.quarterly[q] += wcNeeds.cash?.quarterly?.[q] || 0;
          consolidated.accountsReceivable.quarterly[q] += wcNeeds.accountsReceivable?.quarterly?.[q] || 0;
          consolidated.prepaidExpenses.quarterly[q] += wcNeeds.prepaidExpenses?.quarterly?.[q] || 0;
          consolidated.accountsPayable.quarterly[q] += wcNeeds.accountsPayable?.quarterly?.[q] || 0;
          consolidated.accruedExpenses.quarterly[q] += wcNeeds.accruedExpenses?.quarterly?.[q] || 0;
        }
        
        // Sum up yearly values
        for (let y = 0; y < 10; y++) {
          consolidated.cash.yearly[y] += wcNeeds.cash?.yearly?.[y] || 0;
          consolidated.accountsReceivable.yearly[y] += wcNeeds.accountsReceivable?.yearly?.[y] || 0;
          consolidated.prepaidExpenses.yearly[y] += wcNeeds.prepaidExpenses?.yearly?.[y] || 0;
          consolidated.accountsPayable.yearly[y] += wcNeeds.accountsPayable?.yearly?.[y] || 0;
          consolidated.accruedExpenses.yearly[y] += wcNeeds.accruedExpenses?.yearly?.[y] || 0;
        }
      }
    });

    // Calculate net working capital and totals
    for (let q = 0; q < 40; q++) {
      const currentAssets = consolidated.cash.quarterly[q] + 
                           consolidated.accountsReceivable.quarterly[q] + 
                           consolidated.prepaidExpenses.quarterly[q];
      const currentLiabilities = consolidated.accountsPayable.quarterly[q] + 
                                consolidated.accruedExpenses.quarterly[q];
      
      consolidated.netWorkingCapital.quarterly[q] = currentAssets - currentLiabilities;
      consolidated.total.quarterly[q] = currentAssets;
    }

    for (let y = 0; y < 10; y++) {
      const currentAssets = consolidated.cash.yearly[y] + 
                           consolidated.accountsReceivable.yearly[y] + 
                           consolidated.prepaidExpenses.yearly[y];
      const currentLiabilities = consolidated.accountsPayable.yearly[y] + 
                                consolidated.accruedExpenses.yearly[y];
      
      consolidated.netWorkingCapital.yearly[y] = currentAssets - currentLiabilities;
      consolidated.total.yearly[y] = currentAssets;
    }

    return consolidated;
  }

  /**
   * Calculate central cash position
   */
  calculateCentralCash(assumptions, consolidatedWC) {
    const centralCash = { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) };
    
    // Base cash buffer (configurable)
    const baseCashBuffer = assumptions.baseCashBuffer || 50; // 50M base buffer
    const wcMultiplier = assumptions.wcCashMultiplier || 1.2; // 120% of WC needs
    
    for (let q = 0; q < 40; q++) {
      centralCash.quarterly[q] = baseCashBuffer + (consolidatedWC.total.quarterly[q] * wcMultiplier);
    }
    
    for (let y = 0; y < 10; y++) {
      centralCash.yearly[y] = baseCashBuffer + (consolidatedWC.total.yearly[y] * wcMultiplier);
    }
    
    return centralCash;
  }

  /**
   * Calculate intercompany positions
   */
  calculateIntercompanyPositions(divisionRequirements) {
    const receivables = { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) };
    const payables = { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) };
    
    // This would be calculated based on internal services and funding
    // For now, return zero positions
    return { receivables, payables };
  }

  /**
   * Calculate group funding requirements
   */
  calculateGroupFunding(centralCash, intercompanyPositions) {
    const groupFunding = { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) };
    
    // Group funding = Central cash needs (simplified)
    for (let q = 0; q < 40; q++) {
      groupFunding.quarterly[q] = centralCash.quarterly[q];
    }
    
    for (let y = 0; y < 10; y++) {
      groupFunding.yearly[y] = centralCash.yearly[y];
    }
    
    return groupFunding;
  }

  /**
   * Calculate total Treasury assets
   */
  calculateTotalTreasuryAssets(centralCash, intercompanyPositions, consolidatedWC) {
    const totalAssets = { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) };
    
    for (let q = 0; q < 40; q++) {
      totalAssets.quarterly[q] = centralCash.quarterly[q] + 
                                intercompanyPositions.receivables.quarterly[q] +
                                consolidatedWC.total.quarterly[q];
    }
    
    for (let y = 0; y < 10; y++) {
      totalAssets.yearly[y] = centralCash.yearly[y] + 
                             intercompanyPositions.receivables.yearly[y] +
                             consolidatedWC.total.yearly[y];
    }
    
    return totalAssets;
  }

  /**
   * Calculate division cash allocations
   */
  calculateDivisionAllocations(divisionRequirements) {
    const allocations = {};
    
    Object.entries(divisionRequirements).forEach(([divisionKey, requirements]) => {
      if (requirements?.cashRequirements) {
        allocations[divisionKey] = {
          allocated: requirements.cashRequirements,
          fundingRate: this.getInternalFundingRate(divisionKey),
          terms: requirements.paymentTerms || {}
        };
      }
    });
    
    return allocations;
  }

  /**
   * Calculate cash pooling benefits
   */
  calculateCashPooling(consolidatedWC) {
    // Benefits from netting and cash pooling
    const poolingBenefits = { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) };
    
    // Simplified: assume 10% efficiency gain from pooling
    for (let q = 0; q < 40; q++) {
      poolingBenefits.quarterly[q] = consolidatedWC.total.quarterly[q] * 0.1;
    }
    
    for (let y = 0; y < 10; y++) {
      poolingBenefits.yearly[y] = consolidatedWC.total.yearly[y] * 0.1;
    }
    
    return poolingBenefits;
  }

  /**
   * Calculate internal funding costs for divisions
   */
  calculateInternalFundingCosts(assumptions, divisionRequirements) {
    const fundingCosts = {};
    
    Object.entries(divisionRequirements).forEach(([divisionKey, requirements]) => {
      if (requirements?.cashRequirements) {
        const fundingRate = this.getInternalFundingRate(divisionKey);
        const annualCost = { quarterly: new Array(40).fill(0), yearly: new Array(10).fill(0) };
        
        for (let q = 0; q < 40; q++) {
          const cashNeed = requirements.cashRequirements.quarterly?.[q] || 0;
          annualCost.quarterly[q] = cashNeed * (fundingRate / 4); // Quarterly rate
        }
        
        for (let y = 0; y < 10; y++) {
          const cashNeed = requirements.cashRequirements.yearly?.[y] || 0;
          annualCost.yearly[y] = cashNeed * fundingRate;
        }
        
        fundingCosts[divisionKey] = {
          rate: fundingRate,
          annualCost: annualCost
        };
      }
    });
    
    return fundingCosts;
  }

  /**
   * Get internal funding rate for a division
   */
  getInternalFundingRate(divisionKey) {
    const baseRate = 0.035; // 3.5% base
    const spreads = {
      tech: 0.01,    // +100bp for tech (operational risk)
      digital: 0.005, // +50bp for digital
      re: 0.008,     // +80bp for RE
      sme: 0.012,    // +120bp for SME
      wealth: 0.003, // +30bp for wealth
      central: 0.005,
      treasury: 0.0
    };
    
    return baseRate + (spreads[divisionKey] || 0.01);
  }
}

export default TreasuryBalanceSheetOrchestrator;