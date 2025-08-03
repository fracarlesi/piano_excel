/**
 * Balance Sheet Orchestrator
 * 
 * Main orchestrator that coordinates all Balance Sheet microservices
 * to produce the complete Statement of Financial Position
 */

import { calculateTotalAssets } from './assets/TotalAssetsOrchestrator.js';
import { calculateRecoveryDefault } from './assets/recovery-default/index.js';
import { 
  ALL_DIVISION_PREFIXES,
  BUSINESS_DIVISION_PREFIXES
} from '../divisionMappings.js';

/**
 * Main Balance Sheet calculation - static method for clean interface
 */
export const BalanceSheetOrchestrator = {
  /**
   * Calculate complete Balance Sheet
   * @param {Object} assumptions - Complete assumptions from UI/Firebase
   * @returns {Object} Balance Sheet results
   */
  calculate(assumptions) {
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const quarters = 40; // 10 years * 4 quarters
    
    // Step 1: Process products by division
    const divisionProducts = this.organizeProductsByDivision(assumptions.products);
    
    // Step 2: Calculate Recovery on Defaulted Assets first (needed for NPV calculation)
    const initialAssetsResults = calculateTotalAssets(divisionProducts, assumptions, quarters);
    const recoveryResults = calculateRecoveryDefault(divisionProducts, assumptions, quarters, initialAssetsResults);
    
    // Step 3: Calculate Assets with NPV-based Non-Performing Assets
    const totalAssetsResults = calculateTotalAssets(divisionProducts, assumptions, quarters, recoveryResults);
    const netPerformingAssets = totalAssetsResults.netPerformingAssets;
    const nonPerformingAssets = totalAssetsResults.nonPerformingAssets;
    
    // Step 3: Calculate Liabilities (placeholder for now)
    const customerDeposits = {
      consolidated: new Array(10).fill(1000), // Placeholder deposits
      quarterly: this.annualToQuarterly(new Array(10).fill(1000)),
      byDivision: {}
    };
    
    // Step 4: Total Assets & Funding Gap
    const totalAssets = this.calculateTotalAssets(
      netPerformingAssets,
      nonPerformingAssets,
      assumptions,
      quarters
    );
    
    const fundingGap = this.calculateFundingGap(
      totalAssets,
      customerDeposits,
      assumptions,
      quarters
    );
    
    // Step 5: Equity (placeholder - needs P&L net profit)
    const equity = this.calculateEquityPlaceholder(assumptions, years);
    
    // Step 6: Organize results
    return {
      // Consolidated Balance Sheet
      consolidated: {
        // Assets
        cashAndEquivalents: new Array(10).fill(50), // Placeholder
        liquidSecurities: new Array(10).fill(100), // Placeholder
        
        // Total Assets NBV and breakdown by type
        totalAssetsNBV: this.quarterlyToAnnual(totalAssetsResults.totalAssets.quarterly),
        bridgeLoansNBV: this.quarterlyToAnnual(totalAssetsResults.byProductType.bridgeLoans.quarterly),
        frenchNoGraceNBV: this.quarterlyToAnnual(totalAssetsResults.byProductType.frenchNoGrace.quarterly),
        frenchWithGraceNBV: this.quarterlyToAnnual(totalAssetsResults.byProductType.frenchWithGrace.quarterly),
        
        netPerformingAssets: this.quarterlyToAnnual(netPerformingAssets.balanceSheetLine.quarterly),
        nonPerformingAssets: this.quarterlyToAnnual(nonPerformingAssets.balanceSheetLine.quarterly),
        otherAssets: new Array(10).fill(20), // Placeholder
        totalAssets: this.quarterlyToAnnual(totalAssets.quarterly),
        
        // Liabilities
        customerDeposits: customerDeposits.consolidated,
        interbankFunding: fundingGap.annual,
        otherLiabilities: new Array(10).fill(30), // Placeholder
        
        // Equity
        equity: equity.total
      },
      
      // Quarterly data for charts
      quarterly: {
        totalAssetsNBV: totalAssetsResults.totalAssets.quarterly,
        bridgeLoansNBV: totalAssetsResults.byProductType.bridgeLoans.quarterly,
        frenchNoGraceNBV: totalAssetsResults.byProductType.frenchNoGrace.quarterly,
        frenchWithGraceNBV: totalAssetsResults.byProductType.frenchWithGrace.quarterly,
        gbvDefaulted: totalAssetsResults.gbvDefaulted?.gbvDefaulted?.quarterly || new Array(quarters).fill(0),
        stockNBVPerforming: totalAssetsResults.stockNBVPerforming?.balanceSheetLine?.quarterly || new Array(quarters).fill(0),
        recoveryOnDefaultedAssets: recoveryResults.balanceSheetLine.quarterly,
        netPerformingAssets: netPerformingAssets.balanceSheetLine.quarterly,
        nonPerformingAssets: nonPerformingAssets.balanceSheetLine.quarterly,
        totalAssets: totalAssets.quarterly,
        customerDeposits: customerDeposits.quarterly || this.annualToQuarterly(customerDeposits.consolidated),
        // New detailed data
        newVolumes: totalAssetsResults.newVolumes?.totalNewVolumes?.quarterly || new Array(quarters).fill(0),
        repayments: totalAssetsResults.repayments?.totalRepayments?.quarterly || new Array(quarters).fill(0)
      },
      
      // Division breakdown
      byDivision: this.organizeDivisionResults(
        netPerformingAssets,
        nonPerformingAssets,
        customerDeposits,
        ALL_DIVISION_PREFIXES,
        totalAssetsResults
      ),
      
      // Product-level detail
      productResults: this.extractProductResults(
        divisionProducts,
        totalAssetsResults
      ),
      
      // New volumes data (needed for commission income calculation)
      newVolumes: totalAssetsResults.newVolumes,
      
      // Detailed components
      details: {
        totalAssetsNBV: totalAssetsResults,
        netPerformingAssets,
        gbvDefaulted: totalAssetsResults.gbvDefaulted,
        stockNBVPerforming: totalAssetsResults.stockNBVPerforming,
        eclProvision: totalAssetsResults.eclProvision,
        stockNBVPerformingPostECL: totalAssetsResults.stockNBVPerformingPostECL,
        recoveryOnDefaultedAssets: recoveryResults,
        nonPerformingAssets,
        customerDeposits,
        fundingGap,
        equity,
        // Product-level volume and repayment details
        newVolumesByProduct: totalAssetsResults.newVolumes?.byProduct || {},
        repaymentsByProduct: totalAssetsResults.repayments?.byProduct || {},
        // Full volumes and repayments data
        newVolumesData: totalAssetsResults.newVolumes || {},
        repaymentsData: totalAssetsResults.repayments || {}
      },
      
      // Make GBV Defaulted and Non-Performing Assets available at top level for P&L
      gbvDefaulted: totalAssetsResults.gbvDefaulted,
      nonPerformingAssets: nonPerformingAssets
    };
  },
  
  /**
   * Organize products by division
   * @private
   */
  organizeProductsByDivision(products) {
    const divisionProducts = {};
    
    ALL_DIVISION_PREFIXES.forEach(prefix => {
      divisionProducts[prefix] = {};
    });
    
    Object.entries(products || {}).forEach(([productKey, product]) => {
      const divisionPrefix = this.getDivisionFromProductKey(productKey);
      if (divisionPrefix && divisionProducts[divisionPrefix]) {
        divisionProducts[divisionPrefix][productKey] = product;
      }
    });
    
    return divisionProducts;
  },
  
  /**
   * Extract division prefix from product key
   * @private
   */
  getDivisionFromProductKey(productKey) {
    for (const prefix of ALL_DIVISION_PREFIXES) {
      if (productKey.startsWith(prefix)) {
        return prefix;
      }
    }
    return null;
  },
  
  /**
   * Calculate total assets
   * @private
   */
  calculateTotalAssets(netPerforming, nonPerforming, assumptions, quarters) {
    const quarterly = new Array(quarters).fill(0);
    
    for (let q = 0; q < quarters; q++) {
      quarterly[q] = 
        (netPerforming.balanceSheetLine.quarterly[q] || 0) +
        (nonPerforming.balanceSheetLine.quarterly[q] || 0) +
        150 + // Placeholder: liquid assets
        20;   // Placeholder: other assets
    }
    
    return {
      quarterly,
      annual: this.quarterlyToAnnual(quarterly)
    };
  },
  
  /**
   * Calculate funding gap
   * @private
   */
  calculateFundingGap(totalAssets, customerDeposits, assumptions, quarters) {
    const annual = new Array(10).fill(0);
    const quarterly = new Array(quarters).fill(0);
    
    // Annual calculation
    for (let year = 0; year < 10; year++) {
      const assets = totalAssets.annual[year];
      const deposits = customerDeposits.consolidated[year] || 0;
      const equity = assumptions.initialEquity || 200; // Simplified
      
      annual[year] = Math.max(0, assets - deposits - equity);
    }
    
    // Quarterly interpolation
    annual.forEach((value, year) => {
      for (let q = 0; q < 4; q++) {
        quarterly[year * 4 + q] = value;
      }
    });
    
    return { annual, quarterly };
  },
  
  /**
   * Placeholder equity calculation
   * @private
   */
  calculateEquityPlaceholder(assumptions, years) {
    const initialEquity = assumptions.initialEquity || 200;
    const retained = new Array(10).fill(0);
    const total = years.map((_, i) => initialEquity + retained[i]);
    
    return {
      initial: initialEquity,
      retained,
      total
    };
  },
  
  /**
   * Convert quarterly to annual (year-end values)
   * @private
   */
  quarterlyToAnnual(quarterlyData) {
    const annual = [];
    for (let year = 0; year < 10; year++) {
      annual.push(quarterlyData[year * 4 + 3] || 0); // Q4 value
    }
    return annual;
  },
  
  /**
   * Convert annual to quarterly (flat interpolation)
   * @private
   */
  annualToQuarterly(annualData) {
    const quarterly = [];
    annualData.forEach(value => {
      for (let q = 0; q < 4; q++) {
        quarterly.push(value);
      }
    });
    return quarterly;
  },
  
  /**
   * Organize results by division
   * @private
   */
  organizeDivisionResults(netPerforming, nonPerforming, deposits, divisionKeys, totalAssetsResults) {
    const results = {};
    
    // Extract division-level new volumes and repayments
    const newVolumesByDivision = this.aggregateByDivision(totalAssetsResults.newVolumes?.byProduct || {}, divisionKeys);
    const repaymentsByDivision = this.aggregateByDivision(totalAssetsResults.repayments?.byProduct || {}, divisionKeys);
    const defaultsByDivision = this.aggregateByDivision(totalAssetsResults.gbvDefaulted?.byProduct || {}, divisionKeys);
    
    divisionKeys.forEach(divKey => {
      results[divKey] = {
        // Quarterly data expected by UI
        quarterly: {
          performingAssets: netPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
          nonPerformingAssets: nonPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
          allocatedEquity: new Array(40).fill(0), // TODO: Calculate allocated equity
          newVolumes: newVolumesByDivision[divKey] || new Array(40).fill(0),
          repayments: repaymentsByDivision[divKey] || new Array(40).fill(0),
          defaults: defaultsByDivision[divKey] || new Array(40).fill(0),
          netPerformingMovement: this.calculateNetMovement(
            newVolumesByDivision[divKey] || new Array(40).fill(0),
            repaymentsByDivision[divKey] || new Array(40).fill(0),
            defaultsByDivision[divKey] || new Array(40).fill(0)
          ),
          totalCreditPortfolio: this.calculateTotalPortfolio(
            netPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
            nonPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0)
          )
        },
        
        // Legacy structure for backward compatibility
        netPerformingAssets: netPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
        nonPerformingAssets: nonPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
        customerDeposits: deposits.byDivision?.[divKey] || new Array(10).fill(0),
        
        // Annual summaries
        annual: {
          netPerformingAssets: this.quarterlyToAnnual(netPerforming.byDivision[divKey]?.quarterly || []),
          nonPerformingAssets: this.quarterlyToAnnual(nonPerforming.byDivision[divKey]?.quarterly || []),
          customerDeposits: deposits.byDivision?.[divKey] || new Array(10).fill(0)
        },
        
        // Balance sheet data structure expected by StandardBalanceSheet component
        bs: {
          quarterly: {
            newVolumes: newVolumesByDivision[divKey] || new Array(40).fill(0),
            repayments: repaymentsByDivision[divKey] || new Array(40).fill(0),
            defaults: defaultsByDivision[divKey] || new Array(40).fill(0),
            netPerformingMovement: this.calculateNetMovement(
              newVolumesByDivision[divKey] || new Array(40).fill(0),
              repaymentsByDivision[divKey] || new Array(40).fill(0),
              defaultsByDivision[divKey] || new Array(40).fill(0)
            ),
            performingAssets: netPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
            nonPerformingAssets: nonPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
            totalCreditPortfolio: this.calculateTotalPortfolio(
              netPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
              nonPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0)
            ),
            allocatedEquity: new Array(40).fill(0) // TODO: Calculate allocated equity
          }
        }
      };
    });
    
    return results;
  },
  
  /**
   * Aggregate product-level data by division
   * @private
   */
  aggregateByDivision(productData, divisionKeys) {
    const divisionData = {};
    
    divisionKeys.forEach(divKey => {
      divisionData[divKey] = new Array(40).fill(0);
    });
    
    Object.entries(productData).forEach(([productKey, data]) => {
      // Find which division this product belongs to
      const divKey = divisionKeys.find(key => productKey.toLowerCase().startsWith(key.toLowerCase()));
      if (divKey && data.quarterlyVolumes) {
        data.quarterlyVolumes.forEach((volume, q) => {
          divisionData[divKey][q] += volume;
        });
      } else if (divKey && data.quarterlyRepayments) {
        data.quarterlyRepayments.forEach((repayment, q) => {
          divisionData[divKey][q] += repayment;
        });
      } else if (divKey && (data.quarterlyDefaults || data.quarterlyGrossNPL)) {
        const defaults = data.quarterlyDefaults || data.quarterlyGrossNPL || [];
        defaults.forEach((defaultAmount, q) => {
          divisionData[divKey][q] += defaultAmount;
        });
      }
    });
    
    return divisionData;
  },
  
  /**
   * Calculate net performing movement
   * @private
   */
  calculateNetMovement(newVolumes, repayments, defaults) {
    return newVolumes.map((vol, i) => vol - repayments[i] - defaults[i]);
  },
  
  /**
   * Calculate total credit portfolio
   * @private
   */
  calculateTotalPortfolio(performing, nonPerforming) {
    return performing.map((perf, i) => perf + nonPerforming[i]);
  },
  
  /**
   * Extract product-level results
   * @private
   */
  extractProductResults(divisionProducts, totalAssetsResults) {
    const productResults = {};
    
    // Get vintages for each product
    const vintagesByProduct = totalAssetsResults.vintages || {};
    
    // Get new volumes and repayments by product
    const volumesByProduct = totalAssetsResults.newVolumes?.byProduct || {};
    const repaymentsByProduct = totalAssetsResults.repayments?.byProduct || {};
    
    // Get NBV by product (total assets stock)
    const nbvByProduct = totalAssetsResults.byProduct || {};
    
    // Get Net Performing Assets by product
    const netPerformingByProduct = totalAssetsResults.netPerformingAssets?.byProduct || {};
    
    // Get Non-Performing Assets by product
    const nonPerformingByProduct = totalAssetsResults.nonPerformingAssets?.byProduct || {};
    
    Object.entries(divisionProducts).forEach(([divKey, products]) => {
      Object.entries(products).forEach(([productKey, product]) => {
        // Get the calculated data for this product
        const productVolumes = volumesByProduct[productKey];
        const productRepayments = repaymentsByProduct[productKey];
        const productNBV = nbvByProduct[productKey];
        
        productResults[productKey] = {
          name: product.name,
          productType: product.productType || 'Credit',
          type: product.type, // Copy the type field (french, bullet, bridge)
          originalProduct: product,
          
          // Add quarterly data with actual calculated values
          quarterly: {
            totalStock: productNBV?.quarterlyNBV || new Array(40).fill(0), // Total NBV (gross asset stock)
            performingStock: netPerformingByProduct[productKey]?.quarterly || new Array(40).fill(0), // Net Performing Assets
            nplStock: nonPerformingByProduct[productKey]?.quarterlyNPV || new Array(40).fill(0), // Non-Performing Assets NPV
            newBusiness: productVolumes?.quarterlyVolumes || new Array(40).fill(0),
            principalRepayments: productRepayments?.quarterlyRepayments || new Array(40).fill(0),
            nonPerformingStock: nonPerformingByProduct[productKey]?.quarterlyNPV || new Array(40).fill(0) // Also add as nonPerformingStock for compatibility
          },
          
          // Add balance sheet quarterly data (for StandardBalanceSheet component)
          bs: {
            quarterly: {
              newVolumes: productVolumes?.quarterlyVolumes || new Array(40).fill(0),
              repayments: productRepayments?.quarterlyRepayments || new Array(40).fill(0),
              defaults: totalAssetsResults.gbvDefaulted?.byProduct?.[productKey]?.quarterlyGrossNPL || new Array(40).fill(0)
            }
          },
          
          // Add vintages if available
          vintages: vintagesByProduct[productKey] || [],
          
          // Add volume and repayment data
          volumeData: productVolumes,
          repaymentData: productRepayments
        };
      });
    });
    
    return productResults;
  }
};