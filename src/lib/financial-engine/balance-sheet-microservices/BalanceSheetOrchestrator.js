/**
 * Balance Sheet Orchestrator
 * 
 * Main orchestrator that coordinates all Balance Sheet microservices
 * to produce the complete Statement of Financial Position
 */

import { calculateNetPerformingAssets } from './assets/net-performing-assets/Orchestrator.js';
import { calculateNonPerformingAssets } from './assets/non-performing-assets/NPLOrchestrator.js';
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
    
    // Step 2: Calculate Assets
    const netPerformingAssets = calculateNetPerformingAssets(divisionProducts, assumptions, quarters);
    const nonPerformingAssets = calculateNonPerformingAssets(divisionProducts, assumptions, quarters);
    
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
        netPerformingAssets: netPerformingAssets.balanceSheetLine.quarterly,
        nonPerformingAssets: nonPerformingAssets.balanceSheetLine.quarterly,
        totalAssets: totalAssets.quarterly,
        customerDeposits: customerDeposits.quarterly || this.annualToQuarterly(customerDeposits.consolidated)
      },
      
      // Division breakdown
      byDivision: this.organizeDivisionResults(
        netPerformingAssets,
        nonPerformingAssets,
        customerDeposits,
        ALL_DIVISION_PREFIXES
      ),
      
      // Product-level detail
      productResults: this.extractProductResults(
        divisionProducts,
        netPerformingAssets,
        nonPerformingAssets
      ),
      
      // Detailed components
      details: {
        netPerformingAssets,
        nonPerformingAssets,
        customerDeposits,
        fundingGap,
        equity
      }
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
  organizeDivisionResults(netPerforming, nonPerforming, deposits, divisionKeys) {
    const results = {};
    
    divisionKeys.forEach(divKey => {
      results[divKey] = {
        netPerformingAssets: netPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
        nonPerformingAssets: nonPerforming.byDivision[divKey]?.quarterly || new Array(40).fill(0),
        customerDeposits: deposits.byDivision?.[divKey] || new Array(10).fill(0),
        
        // Annual summaries
        annual: {
          netPerformingAssets: this.quarterlyToAnnual(netPerforming.byDivision[divKey]?.quarterly || []),
          nonPerformingAssets: this.quarterlyToAnnual(nonPerforming.byDivision[divKey]?.quarterly || []),
          customerDeposits: deposits.byDivision?.[divKey] || new Array(10).fill(0)
        }
      };
    });
    
    return results;
  },
  
  /**
   * Extract product-level results
   * @private
   */
  extractProductResults(divisionProducts, netPerforming, nonPerforming) {
    const productResults = {};
    
    Object.entries(divisionProducts).forEach(([divKey, products]) => {
      Object.entries(products).forEach(([productKey, product]) => {
        productResults[productKey] = {
          name: product.name,
          productType: product.productType || 'Credit',
          originalProduct: product,
          
          // Add quarterly data
          quarterly: {
            performingStock: netPerforming.byProduct[productKey]?.quarterly || new Array(40).fill(0),
            nplStock: nonPerforming.byProduct[productKey]?.quarterly || new Array(40).fill(0)
          }
        };
      });
    });
    
    return productResults;
  }
};