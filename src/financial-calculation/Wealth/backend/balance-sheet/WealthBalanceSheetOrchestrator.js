/**
 * Wealth Balance Sheet Orchestrator
 * 
 * Coordina il calcolo del balance sheet per la divisione Wealth
 * Focus principale: Assets Under Management (AUM)
 */

import { calculateAUM } from './aum/AUMCalculator.js';

export const calculateWealthBalanceSheet = (assumptions, digitalClients, quarters = 40) => {
  console.log('📊 Starting Wealth Balance Sheet calculation...');
  
  const results = {
    aum: null,
    metrics: {
      totalAUM: 0,
      peakAUM: 0,
      avgAUM: 0,
      totalInflows: 0,
      totalOutflows: 0,
      netFlows: 0
    },
    summary: {
      quarterly: {
        totalAUM: new Array(quarters).fill(0),
        newInflows: new Array(quarters).fill(0),
        outflows: new Array(quarters).fill(0),
        netFlows: new Array(quarters).fill(0)
      },
      annual: {
        totalAUM: new Array(10).fill(0),
        newInflows: new Array(10).fill(0),
        outflows: new Array(10).fill(0),
        netFlows: new Array(10).fill(0)
      }
    }
  };

  try {
    // Calculate Assets Under Management
    console.log('💰 Calculating Assets Under Management...');
    results.aum = calculateAUM(assumptions, digitalClients, quarters);
    
    // Populate summary data
    for (let q = 0; q < quarters; q++) {
      results.summary.quarterly.totalAUM[q] = results.aum.quarterly.total[q];
      results.summary.quarterly.newInflows[q] = results.aum.quarterly.newInflows[q];
      results.summary.quarterly.outflows[q] = results.aum.quarterly.outflows[q];
      results.summary.quarterly.netFlows[q] = results.aum.quarterly.newInflows[q] - results.aum.quarterly.outflows[q];
    }
    
    for (let y = 0; y < 10; y++) {
      results.summary.annual.totalAUM[y] = results.aum.annual.total[y];
      results.summary.annual.newInflows[y] = results.aum.annual.newInflows[y];
      results.summary.annual.outflows[y] = results.aum.annual.outflows[y];
      results.summary.annual.netFlows[y] = results.aum.annual.newInflows[y] - results.aum.annual.outflows[y];
    }
    
    // Update metrics
    results.metrics = {
      totalAUM: results.aum.metrics.totalAUM,
      peakAUM: results.aum.metrics.peakAUM,
      avgAUM: results.aum.metrics.avgAUM,
      totalInflows: results.aum.metrics.totalInflows,
      totalOutflows: results.aum.metrics.totalOutflows,
      netFlows: results.aum.metrics.totalInflows - results.aum.metrics.totalOutflows
    };
    
    console.log('✅ Wealth Balance Sheet calculation completed');
    console.log(`📈 Final AUM: €${(results.metrics.totalAUM / 1000000).toFixed(1)}M`);
    console.log(`📊 Peak AUM: €${(results.metrics.peakAUM / 1000000).toFixed(1)}M`);
    console.log(`💹 Net Flows: €${(results.metrics.netFlows / 1000000).toFixed(1)}M`);
    
  } catch (error) {
    console.error('❌ Error in Wealth Balance Sheet calculation:', error);
    throw error;
  }

  return results;
};