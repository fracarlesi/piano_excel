/**
 * Advanced calculation engine for bank business plan
 * 
 * @param {Object} assumptions - The financial assumptions object
 * @returns {Object} Complete calculation results including P&L, Balance Sheet, Capital, and KPIs
 */
export const calculateResults = (assumptions) => {
  const results = { pnl: {}, bs: {}, capital: {}, kpi: {}, formulas: {} };
  const years = [0, 1, 2, 3, 4];

  const productResults = {};
  for (const [key, product] of Object.entries(assumptions.products)) {
      
      const annualGrowth = (product.volumes.y5 - product.volumes.y1) / 4;
      const volumes5Y = years.map(i => product.volumes.y1 + (annualGrowth * i));

      const grossPerformingStock = [0, 0, 0, 0, 0];
      const nplStock = [0, 0, 0, 0, 0];
      const averagePerformingStock = [0, 0, 0, 0, 0];
      const newNPLs = [0, 0, 0, 0, 0];
      
      for (let year = 0; year < 5; year++) {
          const defaultsFromStock = year > 0 ? grossPerformingStock[year - 1] * (product.dangerRate / 100) : 0;
          newNPLs[year] = defaultsFromStock;

          let repayments = 0;
          for (let prevYear = 0; prevYear < year; prevYear++) {
              const cohortVolume = volumes5Y[prevYear];
              const ageInYears = year - prevYear;
              if (ageInYears <= product.durata && product.type !== 'bullet') {
                  repayments += cohortVolume / product.durata;
              }
               if (ageInYears === product.durata && product.type === 'bullet') {
                  repayments += cohortVolume;
              }
          }

          const prevYearStock = year > 0 ? grossPerformingStock[year - 1] : 0;
          const totalEopStock = prevYearStock + volumes5Y[year] - repayments - newNPLs[year];
          grossPerformingStock[year] = totalEopStock;
          
          const totalAvgStock = (prevYearStock + totalEopStock) / 2;
          averagePerformingStock[year] = totalAvgStock;
          
          const prevNplStock = year > 0 ? nplStock[year - 1] : 0;
          nplStock[year] = prevNplStock + newNPLs[year];
      }

      const collateralValue = 1 / (product.ltv / 100);
      const discountedCollateralValue = collateralValue * (1 - (product.collateralHaircut / 100));
      const netRecoveryValue = discountedCollateralValue * (1 - (product.recoveryCosts / 100));
      const lgd = Math.max(0, 1 - netRecoveryValue);
      
      const expectedLossOnNewBusiness = volumes5Y.map(v => -v * (product.dangerRate / 100) * lgd);
      const lossOnStockDefaults = newNPLs.map(v => -v * lgd);

      productResults[key] = {
          performingAssets: grossPerformingStock,
          nonPerformingAssets: nplStock,
          interestIncome: averagePerformingStock.map(v => v * product.tasso / 100),
          commissionIncome: volumes5Y.map(v => v * product.commissionRate / 100),
          llp: years.map(i => lossOnStockDefaults[i] + expectedLossOnNewBusiness[i]),
          rwa: grossPerformingStock.map(v => v * product.rwaDensity / 100),
      };
  }
  
  // Aggregate results
  results.bs.performingAssets = years.map(i => Object.values(productResults).reduce((sum, p) => sum + p.performingAssets[i], 0));
  results.bs.nonPerformingAssets = years.map(i => Object.values(productResults).reduce((sum, p) => sum + p.nonPerformingAssets[i], 0));
  const totalLoans = years.map(i => results.bs.performingAssets[i] + results.bs.nonPerformingAssets[i]);
  results.bs.operatingAssets = totalLoans.map(v => v * (assumptions.operatingAssetsRatio / 100));
  results.bs.totalAssets = years.map(i => totalLoans[i] + results.bs.operatingAssets[i]);

  results.pnl.interestIncome = years.map(i => Object.values(productResults).reduce((sum, p) => sum + p.interestIncome[i], 0));
  results.pnl.interestExpenses = results.bs.totalAssets.map(assets => -assets * assumptions.costOfFundsRate / 100);
  results.pnl.netInterestIncome = years.map(i => results.pnl.interestIncome[i] + results.pnl.interestExpenses[i]);
  
  results.pnl.commissionIncome = years.map(i => Object.values(productResults).reduce((sum, p) => sum + p.commissionIncome[i], 0));
  results.pnl.commissionExpenses = results.pnl.commissionIncome.map(c => -c * assumptions.commissionExpenseRate / 100);
  results.pnl.netCommissions = years.map(i => results.pnl.commissionIncome[i] + results.pnl.commissionExpenses[i]);
  
  results.pnl.totalRevenues = years.map(i => results.pnl.netInterestIncome[i] + results.pnl.netCommissions[i]);

  const fteGrowth = (assumptions.realEstateDivision.fteY5 - assumptions.realEstateDivision.fteY1) / 4;
  results.kpi.fte = years.map(i => assumptions.realEstateDivision.fteY1 + (fteGrowth * i));
  
  // Calculate FTE breakdown first
  results.kpi.fteFrontOffice = results.kpi.fte.map(fte => fte * assumptions.realEstateDivision.frontOfficeRatio / 100);
  results.kpi.fteBackOffice = results.kpi.fte.map((fte, i) => fte - results.kpi.fteFrontOffice[i]);
  
  results.pnl.personnelCostsTotal = results.kpi.fte.map(fte => - (fte * assumptions.avgCostPerFte) / 1000);

  const costGrowth = years.map(i => Math.pow(1 + assumptions.costGrowthRate / 100, i));
  // Back office costs now based on back office FTE
  results.pnl.backOfficeCosts = results.kpi.fteBackOffice.map((fteBO, i) => - (fteBO * assumptions.avgCostPerFte / 1000) * costGrowth[i]);
  results.pnl.adminCosts = years.map(i => -assumptions.adminCostsY1 * costGrowth[i]);
  results.pnl.marketingCosts = years.map(i => -assumptions.marketingCostsY1 * costGrowth[i]);
  results.pnl.hqAllocation = years.map(i => -assumptions.hqAllocationY1 * costGrowth[i]);
  results.pnl.itCosts = years.map(i => -assumptions.itCostsY1 * costGrowth[i]);
  const otherOpex = years.map(i => results.pnl.backOfficeCosts[i] + results.pnl.adminCosts[i] + results.pnl.marketingCosts[i] + results.pnl.hqAllocation[i] + results.pnl.itCosts[i]);
  results.pnl.totalOpex = years.map(i => results.pnl.personnelCostsTotal[i] + otherOpex[i]);

  results.pnl.otherCosts = years.map(i => -assumptions.otherCostsY1 * costGrowth[i]);
  results.pnl.provisions = years.map(i => -assumptions.provisionsY1 * costGrowth[i]);
  results.pnl.totalLLP = years.map(i => Object.values(productResults).reduce((sum, p) => sum + p.llp[i], 0));
  results.pnl.preTaxProfit = years.map(i => results.pnl.totalRevenues[i] + results.pnl.totalOpex[i] + results.pnl.totalLLP[i] + results.pnl.otherCosts[i] + results.pnl.provisions[i]);
  results.pnl.taxes = years.map(i => results.pnl.preTaxProfit[i] > 0 ? -results.pnl.preTaxProfit[i] * (assumptions.taxRate / 100) : 0);
  results.pnl.netProfit = years.map(i => results.pnl.preTaxProfit[i] + results.pnl.taxes[i]);

  results.bs.equity = years.map(i => assumptions.initialEquity + results.pnl.netProfit.slice(0, i + 1).reduce((a, b) => a + b, 0));
  results.bs.totalLiabilities = years.map(i => results.bs.totalAssets[i] - results.bs.equity[i]);
  
  results.bs.sightDeposits = results.bs.totalLiabilities.map(tl => tl * (assumptions.fundingMix.sightDeposits / 100));
  results.bs.termDeposits = results.bs.totalLiabilities.map(tl => tl * (assumptions.fundingMix.termDeposits / 100));
  results.bs.groupFunding = results.bs.totalLiabilities.map(tl => tl * (assumptions.fundingMix.groupFunding / 100));

  results.capital.rwaCreditRisk = years.map(i => Object.values(productResults).reduce((sum, p) => sum + p.rwa[i], 0));
  results.capital.rwaOperationalRisk = results.bs.totalAssets.map(assets => assets * 0.1);
  results.capital.rwaMarketRisk = years.map(() => 0);
  results.capital.rwaOperatingAssets = results.bs.operatingAssets.map(oa => oa * 1.0); // 100% risk weight for operating assets
  results.capital.totalRWA = years.map(i => results.capital.rwaCreditRisk[i] + results.capital.rwaOperationalRisk[i] + results.capital.rwaMarketRisk[i] + results.capital.rwaOperatingAssets[i]);
  
  results.kpi.cet1Ratio = years.map(i => results.capital.totalRWA[i] > 0 ? (results.bs.equity[i] / results.capital.totalRWA[i]) * 100 : 0);
  results.kpi.costIncome = years.map(i => results.pnl.totalRevenues[i] > 0 ? (-results.pnl.totalOpex[i] / results.pnl.totalRevenues[i]) * 100 : 0);
  
  // Product-level allocation for PNL and ROE
  for (const key in productResults) {
      const product = productResults[key];
      const assetWeight = years.map(i => results.bs.totalAssets[i] > 0 ? (product.performingAssets[i] + product.nonPerformingAssets[i]) / results.bs.totalAssets[i] : 0);
      const rwaWeight = years.map(i => results.capital.totalRWA[i] > 0 ? product.rwa[i] / results.capital.totalRWA[i] : 0);
      
      product.interestExpense = years.map(i => results.pnl.interestExpenses[i] * assetWeight[i]);
      product.commissionExpense = years.map(i => results.pnl.commissionExpenses[i] * assetWeight[i]);
      product.personnelCosts = years.map(i => results.pnl.personnelCostsTotal[i] * rwaWeight[i]);
      product.allocatedEquity = years.map(i => results.bs.equity[i] * rwaWeight[i]);
      product.cet1Ratio = years.map(i => product.rwa[i] > 0 ? (product.allocatedEquity[i] / product.rwa[i]) * 100 : 0);
      
      const revenues = years.map(i => product.interestIncome[i] + product.commissionIncome[i]);
      const allocatedOtherOpex = years.map(i => otherOpex[i] * rwaWeight[i]);
      const allocatedTaxes = years.map(i => results.pnl.taxes[i] * rwaWeight[i]);
      
      product.netProfit = years.map(i => revenues[i] + product.interestExpense[i] + product.llp[i] + product.personnelCosts[i] + allocatedOtherOpex[i] + allocatedTaxes[i] + product.commissionExpense[i]);
      
      product.roe = years.map(i => {
          const startEquity = i > 0 ? product.allocatedEquity[i-1] : 0;
          const avgEquity = (product.allocatedEquity[i] + startEquity) / 2;
          return avgEquity > 0 ? (product.netProfit[i] / avgEquity) * 100 : 0;
      });
  }
  
  const operatingAssetsRwaWeight = years.map(i => results.capital.totalRWA[i] > 0 ? results.capital.rwaOperatingAssets[i] / results.capital.totalRWA[i] : 0);
  results.capital.allocatedEquityOperatingAssets = years.map(i => results.bs.equity[i] * operatingAssetsRwaWeight[i]);

  // Calculate total ROE
  results.kpi.roe = years.map(i => {
      const startEquity = i > 0 ? results.bs.equity[i-1] : assumptions.initialEquity;
      const endEquity = results.bs.equity[i];
      const avgEquity = (startEquity + endEquity) / 2;
      return avgEquity > 0 ? (results.pnl.netProfit[i] / avgEquity) * 100 : 0;
  });

  // Calculate Cost of Risk (basis points)
  results.kpi.costOfRisk = years.map(i => {
      const avgPerformingAssets = i > 0 ? 
          (results.bs.performingAssets[i] + results.bs.performingAssets[i-1]) / 2 : 
          results.bs.performingAssets[i];
      return avgPerformingAssets > 0 ? (-results.pnl.totalLLP[i] / avgPerformingAssets) * 10000 : 0;
  });

  results.productResults = productResults;

  return results;
};

export default calculateResults;