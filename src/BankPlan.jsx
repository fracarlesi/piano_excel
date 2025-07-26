import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, TrendingUp } from 'lucide-react';

// A smarter input field that handles numeric formatting for better UX.
const EditableNumberField = ({ label, value, onChange, unit = "", disabled, isPercentage = false, isInteger = false }) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  const formatOptions = {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  };

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toLocaleString('it-IT', formatOptions));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseFloat(inputValue.replace(/,/g, '.')) || 0;
    onChange(numericValue);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {unit && <span className="text-gray-500">({unit})</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isFocused ? inputValue : value.toLocaleString('it-IT', formatOptions)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        {isPercentage && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">%</div>}
      </div>
    </div>
  );
};


const ExcelLikeBankPlan = () => {
  const [activeSheet, setActiveSheet] = useState('reFinancing');
  const [editMode, setEditMode] = useState(true);

  // Centralized state for all assumptions
  const [assumptions, setAssumptions] = useState({
    initialEquity: 200, taxRate: 28, costOfFundsRate: 3.0, operatingAssetsRatio: 2.0,
    avgCostPerFte: 100, 
    backOfficeCostsY1: 2, adminCostsY1: 1.5,
    marketingCostsY1: 1, hqAllocationY1: 2.5, itCostsY1: 4, costGrowthRate: 10, otherCostsY1: 0.5,
    provisionsY1: 0.2, commissionExpenseRate: 0.0,
    fundingMix: {
        sightDeposits: 40,
        termDeposits: 40,
        groupFunding: 20,
    },
    realEstateDivision: {
        fteY1: 100,
        fteY5: 150,
    },
    products: {
      reNoGaranzia: {
        name: 'Senza Garanzia (Bullet)',
        volumes: { y1: 100, y5: 650 },
        tasso: 8.5, rwaDensity: 100, durata: 3, commissionRate: 1.0,
        dangerRate: 5.0, ltv: 75.0, recoveryCosts: 15.0, collateralHaircut: 30.0,
        quarterlyDist: [25, 25, 25, 25], type: 'bullet'
      },
      reConGaranzia: {
        name: 'Con Garanzia (Francese)',
        volumes: { y1: 50, y5: 550 },
        tasso: 6.5, rwaDensity: 20, durata: 5, commissionRate: 0.5,
        dangerRate: 1.5, ltv: 80.0, recoveryCosts: 10.0, collateralHaircut: 20.0,
        quarterlyDist: [25, 25, 25, 25], type: 'amortizing'
      }
    }
  });

  // Sheet definitions
  const sheets = {
    assumptions: { name: 'Assumptions', icon: Settings },
    reFinancing: { name: 'Dettaglio Divisione RE', icon: TrendingUp }
  };

  // Helper function to format numbers
  const formatNumber = (num, decimals = 1, unit = '') => {
    if (num === null || typeof num !== 'number' || isNaN(num)) return '';
    const formatted = num.toLocaleString('it-IT', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
    return `${formatted}${unit}`;
  };

  // Advanced calculation engine
  const calculateResults = () => {
    const results = { pnl: {}, bs: {}, capital: {}, kpi: {} };
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
    results.pnl.personnelCostsTotal = results.kpi.fte.map(fte => - (fte * assumptions.avgCostPerFte) / 1000);

    const costGrowth = years.map(i => Math.pow(1 + assumptions.costGrowthRate / 100, i));
    results.pnl.backOfficeCosts = years.map(i => -assumptions.backOfficeCostsY1 * costGrowth[i]);
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

    results.productResults = productResults;

    return results;
  };

  const results = calculateResults();

  // Financial Table Component for flat, indented layouts
  const FinancialTable = ({ title, rows }) => (
    <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-800 text-white px-6 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold">{title} (€M)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 w-2/5">Voce</th>
              {[0, 1, 2, 3, 4].map(y => <th key={y} className="px-4 py-3 text-right font-semibold text-gray-700">Anno {y + 1}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={`${row.isTotal ? 'font-bold bg-blue-50' : ''} ${row.isHeader ? 'font-semibold bg-gray-100' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-2 text-gray-800" style={{ paddingLeft: row.indent ? '2.5rem' : '1.5rem' }}>
                  {row.label}
                </td>
                {row.data && row.data.map((value, i) => (
                  <td key={i} className={`px-4 py-2 text-right ${value < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatNumber(value, row.decimals, row.unit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Render Assumptions Sheet
  const renderAssumptionsSheet = () => (
    <div className="p-6 space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Assunzioni Generali e di Costo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Parametri Generali</h4>
                    <EditableNumberField label="Patrimonio Iniziale" value={assumptions.initialEquity} onChange={val => setAssumptions({...assumptions, initialEquity: val})} unit="€M" disabled={!editMode} isInteger/>
                    <EditableNumberField label="Aliquota Fiscale" value={assumptions.taxRate} onChange={val => setAssumptions({...assumptions, taxRate: val})} unit="%" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="Costo del Funding" value={assumptions.costOfFundsRate} onChange={val => setAssumptions({...assumptions, costOfFundsRate: val})} unit="% su Attivi" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="Operating Assets Ratio" value={assumptions.operatingAssetsRatio} onChange={val => setAssumptions({...assumptions, operatingAssetsRatio: val})} unit="% su Crediti" disabled={!editMode} isPercentage/>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Costo Medio Personale</h4>
                     <EditableNumberField label="Costo medio per persona" value={assumptions.avgCostPerFte} onChange={val => setAssumptions({...assumptions, avgCostPerFte: val})} unit="k€" disabled={!editMode} isInteger/>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Altri Costi Operativi (Anno 1)</h4>
                    <EditableNumberField label="Costi Back Office" value={assumptions.backOfficeCostsY1} onChange={val => setAssumptions({...assumptions, backOfficeCostsY1: val})} unit="€M" disabled={!editMode}/>
                    <EditableNumberField label="Costi Amministrativi" value={assumptions.adminCostsY1} onChange={val => setAssumptions({...assumptions, adminCostsY1: val})} unit="€M" disabled={!editMode}/>
                    <EditableNumberField label="Marketing" value={assumptions.marketingCostsY1} onChange={val => setAssumptions({...assumptions, marketingCostsY1: val})} unit="€M" disabled={!editMode}/>
                </div>
                 <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Mix delle Passività (Funding)</h4>
                    <EditableNumberField label="Depositi a Vista" value={assumptions.fundingMix.sightDeposits} onChange={val => setAssumptions({...assumptions, fundingMix: {...assumptions.fundingMix, sightDeposits: val}})} unit="%" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="Depositi Vincolati" value={assumptions.fundingMix.termDeposits} onChange={val => setAssumptions({...assumptions, fundingMix: {...assumptions.fundingMix, termDeposits: val}})} unit="%" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="Finanziamento Intergruppo" value={assumptions.fundingMix.groupFunding} onChange={val => setAssumptions({...assumptions, fundingMix: {...assumptions.fundingMix, groupFunding: val}})} unit="%" disabled={!editMode} isPercentage/>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Assunzioni Divisione Real Estate</h3>
            <div className="mb-8 border-b pb-8">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Personale di Divisione</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <EditableNumberField label="FTE Anno 1" value={assumptions.realEstateDivision.fteY1} onChange={val => setAssumptions(prev => ({...prev, realEstateDivision: {...prev.realEstateDivision, fteY1: val}}))} disabled={!editMode} isInteger/>
                    <EditableNumberField label="FTE Anno 5" value={assumptions.realEstateDivision.fteY5} onChange={val => setAssumptions(prev => ({...prev, realEstateDivision: {...prev.realEstateDivision, fteY5: val}}))} disabled={!editMode} isInteger/>
                 </div>
            </div>
            {Object.entries(assumptions.products).map(([key, product], index) => (
                <div key={key} className="mb-8 border-b pb-8 last:border-b-0 last:pb-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{`Prodotto ${index + 1}: ${product.name}`}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <EditableNumberField label="Nuovi Impieghi Anno 1" value={product.volumes.y1} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y1: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                         <EditableNumberField label="Nuovi Impieghi Anno 5" value={product.volumes.y5} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y5: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri Finanziari</h5>
                            <EditableNumberField label="Tasso Interesse" value={product.tasso} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], tasso: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Commissioni" value={product.commissionRate} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], commissionRate: val}}}))} unit="% su nuovo" disabled={!editMode} isPercentage/>
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri Strutturali</h5>
                            <EditableNumberField label="Durata" value={product.durata} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], durata: val}}}))} unit="anni" disabled={!editMode}/>
                            <EditableNumberField label="RWA Density" value={product.rwaDensity} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], rwaDensity: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                        </div>
                         <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri di Rischio</h5>
                            <EditableNumberField label="Tasso di Default (Danger Rate)" value={product.dangerRate} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], dangerRate: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Loan-to-Value (LTV)" value={product.ltv} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], ltv: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Costi di Recupero" value={product.recoveryCosts} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], recoveryCosts: val}}}))} unit="% su Collaterale" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Haircut su Collaterale" value={product.collateralHaircut} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], collateralHaircut: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  // Render Real Estate Financing Sheet with the new 4-table layout
  const renderREFinancingSheet = () => {
    const pnlRows = [
        { label: 'Interessi Attivi', data: results.pnl.interestIncome, decimals: 2, isTotal: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.interestIncome, decimals: 2, indent: true })),
        { label: 'Interessi Passivi', data: results.pnl.interestExpenses, decimals: 2, isTotal: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.interestExpense, decimals: 2, indent: true })),
        { label: 'Margine di Interesse (NII)', data: results.pnl.netInterestIncome, decimals: 2, isHeader: true },
        { label: 'Commissioni Attive', data: results.pnl.commissionIncome, decimals: 2, isTotal: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.commissionIncome, decimals: 2, indent: true })),
        { label: 'Commissioni Passive', data: results.pnl.commissionExpenses, decimals: 2, isTotal: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.commissionExpense, decimals: 2, indent: true })),
        { label: 'Commissioni Nette', data: results.pnl.netCommissions, decimals: 2, isHeader: true },
        { label: 'Ricavi Totali', data: results.pnl.totalRevenues, decimals: 2, isHeader: true },
        { label: 'Costi del Personale', data: results.pnl.personnelCostsTotal, decimals: 2, isTotal: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.personnelCosts, decimals: 2, indent: true })),
        { label: 'Altri Costi Operativi', data: [null,null,null,null,null], decimals: 2, isHeader: false },
        { label: 'Back office', data: results.pnl.backOfficeCosts, decimals: 2, indent: true },
        { label: 'Costi Amministrativi', data: results.pnl.adminCosts, decimals: 2, indent: true },
        { label: 'Marketing', data: results.pnl.marketingCosts, decimals: 2, indent: true },
        { label: 'Allocazione Costi Centrali', data: results.pnl.hqAllocation, decimals: 2, indent: true },
        { label: 'Costi IT', data: results.pnl.itCosts, decimals: 2, indent: true },
        { label: 'Costi Operativi Totali', data: results.pnl.totalOpex, decimals: 2, isHeader: true },
        { label: 'Accantonamenti a Fondi Rischi e Oneri', data: results.pnl.provisions, decimals: 2 },
        { label: 'Rettifiche di Valore su Crediti (LLP)', data: results.pnl.totalLLP, decimals: 2, isTotal: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.llp, decimals: 2, indent: true })),
        { label: 'Utile Lordo (PBT)', data: results.pnl.preTaxProfit, decimals: 2, isHeader: true },
    ];
    const bsRows = [
        { label: 'Net Performing Assets', data: results.bs.performingAssets, decimals: 0, isTotal: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.performingAssets, decimals: 0, indent: true })),
        { label: 'Non-Performing Assets', data: results.bs.nonPerformingAssets, decimals: 0, isTotal: false },
        { label: 'Operating Assets', data: results.bs.operatingAssets, decimals: 0, isTotal: false },
        { label: 'Totale Attività', data: results.bs.totalAssets, decimals: 0, isHeader: true },
        { label: 'Totale Passività', data: results.bs.totalLiabilities, decimals: 0, isHeader: true },
        { label: 'o/w Depositi a Vista', data: results.bs.sightDeposits, decimals: 0, indent: true },
        { label: 'o/w Depositi Vincolati', data: results.bs.termDeposits, decimals: 0, indent: true },
        { label: 'o/w Finanziamento Intergruppo', data: results.bs.groupFunding, decimals: 0, indent: true },
        { label: 'Patrimonio Netto', data: results.bs.equity, decimals: 0, isHeader: true },
    ];
    const capitalRows = [
        { label: 'RWA', data: results.capital.totalRWA, decimals: 0, isHeader: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.rwa, decimals: 0, indent: true })),
        { label: 'o/w Operating Assets', data: results.capital.rwaOperatingAssets, decimals: 0, indent: true},
        { label: 'Equity (CET1)', data: results.bs.equity, decimals: 0, isHeader: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.allocatedEquity, decimals: 0, indent: true })),
        { label: 'o/w Operating Assets', data: results.capital.allocatedEquityOperatingAssets, decimals: 0, indent: true},
        { label: 'CET1 Ratio (%)', data: results.kpi.cet1Ratio, decimals: 1, unit: '%', isHeader: true },
         ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.cet1Ratio, decimals: 1, unit: '%', indent: true })),
        { label: 'RWA per tipologia di rischio', data: [null,null,null,null,null], decimals: 0, isHeader: true },
        { label: 'Rischio di Credito', data: results.capital.rwaCreditRisk, decimals: 0, indent: true },
        { label: 'Rischio Operativo', data: results.capital.rwaOperationalRisk, decimals: 0, indent: true },
        { label: 'Rischio di Mercato', data: results.capital.rwaMarketRisk, decimals: 0, indent: true },
    ];
    const kpiRows = [
        { label: 'Cost / Income', data: results.kpi.costIncome, decimals: 1, unit: '%' },
        { label: 'Numero Personale (FTE)', data: results.kpi.fte, decimals: 0 },
        { label: 'Return on Equity (ROE)', data: [], decimals: 1, unit: '%', isTotal: true},
        ...Object.entries(results.productResults).map(([key, p], index) => ({ label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, data: p.roe, decimals: 1, unit: '%', indent: true })),
    ];

    return (
        <div className="p-4 md:p-6 space-y-8">
            <FinancialTable title="1. Conto Economico Dettagliato" rows={pnlRows} />
            <FinancialTable title="2. Stato Patrimoniale" rows={bsRows} />
            <FinancialTable title="3. Requisiti di Capitale" rows={capitalRows} />
            <FinancialTable title="4. KPI Principali" rows={kpiRows} />
        </div>
    );
  };

  const renderCurrentSheet = () => {
    switch (activeSheet) {
      case 'assumptions': return renderAssumptionsSheet();
      case 'reFinancing': return renderREFinancingSheet();
      default: return <div>Sheet non trovato</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 font-sans">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Piano Industriale Interattivo</h1>
              <p className="text-xs text-gray-600">Nuova Banca S.p.A. | Modello Finanziario</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setEditMode(!editMode)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm transition-colors ${editMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                {editMode ? 'Blocca Modifiche' : 'Abilita Modifiche'}
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-b">
            {Object.entries(sheets).map(([key, sheet]) => {
              const Icon = sheet.icon;
              const isActive = activeSheet === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSheet(key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{sheet.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderCurrentSheet()}
      </main>
    </div>
  );
};

export default ExcelLikeBankPlan;