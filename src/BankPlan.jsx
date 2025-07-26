import React, { useState, useEffect, createContext, useContext } from 'react';
import { Settings, TrendingUp, Save, Download, Upload, Info, X } from 'lucide-react';

// Context for managing tooltip state globally
const TooltipContext = createContext();

// Tooltip Provider to ensure only one tooltip is open at a time
const TooltipProvider = ({ children }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  const openTooltip = (id, data) => {
    setActiveTooltip(id);
    setTooltipData(data);
  };

  const closeTooltip = () => {
    setActiveTooltip(null);
    setTooltipData(null);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is not on a tooltip or tooltip trigger
      if (!e.target.closest('.cursor-help') && !e.target.closest('.z-50')) {
        closeTooltip();
      }
    };

    if (activeTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeTooltip]);

  return (
    <TooltipContext.Provider value={{ activeTooltip, tooltipData, openTooltip, closeTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
};

// Tooltip component for showing calculation details
const CalculationTooltip = ({ children, formula, details, id }) => {
  const { activeTooltip, tooltipData, openTooltip, closeTooltip } = useContext(TooltipContext);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isActive = activeTooltip === id;

  const handleClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate position to keep tooltip visible
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 5; // Default: below the element
    let transformY = '0'; // Default: no vertical transform
    
    // If tooltip would go off bottom of screen, show above
    if (rect.bottom + 300 > viewportHeight) {
      y = rect.top - 5;
      transformY = '-100%'; // Position above the element
    }
    
    // Keep tooltip within horizontal bounds
    x = Math.max(200, Math.min(viewportWidth - 200, x));
    
    if (isActive) {
      closeTooltip();
    } else {
      openTooltip(id, { formula, details });
      setPosition({ x, y, transformY });
    }
  };

  return (
    <>
      <span 
        onClick={handleClick}
        className="cursor-help hover:bg-blue-50 hover:text-blue-700 px-1 rounded transition-colors"
      >
        {children}
      </span>
      {isActive && tooltipData && (
        <div 
          className="fixed z-50 bg-white border-2 border-blue-200 rounded-lg shadow-xl p-4 max-w-md"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `translateX(-50%) translateY(${position.transformY})`,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">Formula di Calcolo</h4>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTooltip();
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 px-3 py-2 rounded font-mono text-sm mb-2">
                {tooltipData.formula}
              </div>
              {tooltipData.details && (
                <div className="text-sm text-gray-600 space-y-1">
                  {tooltipData.details.map((detail, idx) => (
                    <div key={idx}>• {detail}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
  const [lastSaved, setLastSaved] = useState(null);

  // Default assumptions
  const defaultAssumptions = {
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
  };

  // Load saved data from localStorage or use defaults
  const loadSavedData = () => {
    const saved = localStorage.getItem('bankPlanAssumptions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading saved data:', e);
        return defaultAssumptions;
      }
    }
    return defaultAssumptions;
  };

  // Initialize state with saved data
  const [assumptions, setAssumptions] = useState(loadSavedData);

  // Auto-save to localStorage whenever assumptions change
  useEffect(() => {
    localStorage.setItem('bankPlanAssumptions', JSON.stringify(assumptions));
    setLastSaved(new Date());
  }, [assumptions]);

  // Export data as JSON file
  const exportData = () => {
    const dataStr = JSON.stringify(assumptions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `piano_industriale_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import data from JSON file
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setAssumptions(imported);
          alert('Dati importati con successo!');
        } catch (error) {
          alert('Errore nell\'importazione del file. Assicurati che sia un file JSON valido.');
        }
      };
      reader.readAsText(file);
    }
  };

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

    // Calculate total ROE
    results.kpi.roe = years.map(i => {
        const startEquity = i > 0 ? results.bs.equity[i-1] : assumptions.initialEquity;
        const endEquity = results.bs.equity[i];
        const avgEquity = (startEquity + endEquity) / 2;
        return avgEquity > 0 ? (results.pnl.netProfit[i] / avgEquity) * 100 : 0;
    });

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
                    {row.formula && row.formula[i] ? (
                      <CalculationTooltip 
                        id={`${title}-${index}-${i}`}
                        formula={row.formula[i].formula} 
                        details={row.formula[i].details}
                      >
                        {formatNumber(value, row.decimals, row.unit)}
                      </CalculationTooltip>
                    ) : (
                      formatNumber(value, row.decimals, row.unit)
                    )}
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
    // Helper function to create formula explanations
    const createFormula = (year, formula, details) => ({
      formula,
      details: details.map(d => typeof d === 'function' ? d(year) : d)
    });

    const pnlRows = [
        { 
          label: 'Interessi Attivi', 
          data: results.pnl.interestIncome, 
          decimals: 2, 
          isTotal: true,
          formula: results.pnl.interestIncome.map((val, i) => createFormula(i, 
            'Stock Medio Performing × Tasso Interesse',
            [
              `Stock Medio Performing: ${formatNumber(results.bs.performingAssets[i], 0)} €M`,
              `Tasso Interesse Medio Ponderato: ~${(val / results.bs.performingAssets[i] * 100).toFixed(2)}%`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.interestIncome, 
          decimals: 2, 
          indent: true,
          formula: p.interestIncome.map((val, i) => createFormula(i,
            'Stock Medio Performing Prodotto × Tasso Prodotto',
            [
              `Stock Medio Performing: ${formatNumber(p.performingAssets[i], 0)} €M`,
              `Tasso Prodotto: ${assumptions.products[key].tasso}%`,
              `Interessi: ${formatNumber(val, 2)} €M`
            ]
          ))
        })),
        { 
          label: 'Interessi Passivi', 
          data: results.pnl.interestExpenses, 
          decimals: 2, 
          isTotal: true,
          formula: results.pnl.interestExpenses.map((val, i) => createFormula(i,
            'Totale Attivi × Costo del Funding',
            [
              `Totale Attivi: ${formatNumber(results.bs.totalAssets[i], 0)} €M`,
              `Costo del Funding: ${assumptions.costOfFundsRate}%`,
              `Calcolo: ${formatNumber(results.bs.totalAssets[i], 0)} × ${assumptions.costOfFundsRate}% = ${formatNumber(-val, 2)} €M`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.interestExpense, 
          decimals: 2, 
          indent: true,
          formula: p.interestExpense.map((val, i) => createFormula(i,
            'Interessi Passivi Totali × Peso Asset Prodotto',
            [
              `Interessi Passivi Totali: ${formatNumber(results.pnl.interestExpenses[i], 2)} €M`,
              `Asset Prodotto: ${formatNumber(p.performingAssets[i] + p.nonPerformingAssets[i], 0)} €M`,
              `Asset Totali: ${formatNumber(results.bs.totalAssets[i], 0)} €M`,
              `Peso: ${((p.performingAssets[i] + p.nonPerformingAssets[i]) / results.bs.totalAssets[i] * 100).toFixed(1)}%`
            ]
          ))
        })),
        { 
          label: 'Margine di Interesse (NII)', 
          data: results.pnl.netInterestIncome, 
          decimals: 2, 
          isHeader: true,
          formula: results.pnl.netInterestIncome.map((val, i) => createFormula(i,
            'Interessi Attivi - Interessi Passivi',
            [
              `Interessi Attivi: ${formatNumber(results.pnl.interestIncome[i], 2)} €M`,
              `Interessi Passivi: ${formatNumber(results.pnl.interestExpenses[i], 2)} €M`,
              `NII: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Commissioni Attive', 
          data: results.pnl.commissionIncome, 
          decimals: 2, 
          isTotal: true,
          formula: results.pnl.commissionIncome.map((val, i) => createFormula(i,
            'Somma Commissioni per Prodotto',
            [
              ...Object.entries(results.productResults).map(([key, p], idx) => 
                `Prodotto ${idx + 1}: ${formatNumber(p.commissionIncome[i], 2)} €M`
              ),
              `Totale: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.commissionIncome, 
          decimals: 2, 
          indent: true,
          formula: p.commissionIncome.map((val, i) => {
            const annualGrowth = (assumptions.products[key].volumes.y5 - assumptions.products[key].volumes.y1) / 4;
            const newVolume = assumptions.products[key].volumes.y1 + (annualGrowth * i);
            return createFormula(i,
              'Nuovi Volumi × Tasso Commissione',
              [
                `Nuovi Volumi Anno ${i+1}: ${formatNumber(newVolume, 0)} €M`,
                `Tasso Commissione: ${assumptions.products[key].commissionRate}%`,
                `Commissioni: ${formatNumber(val, 2)} €M`
              ]
            );
          })
        })),
        { 
          label: 'Commissioni Passive', 
          data: results.pnl.commissionExpenses, 
          decimals: 2, 
          isTotal: true,
          formula: results.pnl.commissionExpenses.map((val, i) => createFormula(i,
            'Commissioni Attive × Tasso Commissioni Passive',
            [
              `Commissioni Attive: ${formatNumber(results.pnl.commissionIncome[i], 2)} €M`,
              `Tasso Commissioni Passive: ${assumptions.commissionExpenseRate}%`,
              `Commissioni Passive: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.commissionExpense, 
          decimals: 2, 
          indent: true,
          formula: p.commissionExpense.map((val, i) => createFormula(i,
            'Commissioni Passive Totali × Peso Asset',
            [
              `Commissioni Passive Totali: ${formatNumber(results.pnl.commissionExpenses[i], 2)} €M`,
              `Peso Asset Prodotto: ${((p.performingAssets[i] + p.nonPerformingAssets[i]) / results.bs.totalAssets[i] * 100).toFixed(1)}%`,
              `Allocato: ${formatNumber(val, 2)} €M`
            ]
          ))
        })),
        { 
          label: 'Commissioni Nette', 
          data: results.pnl.netCommissions, 
          decimals: 2, 
          isHeader: true,
          formula: results.pnl.netCommissions.map((val, i) => createFormula(i,
            'Commissioni Attive - Commissioni Passive',
            [
              `Commissioni Attive: ${formatNumber(results.pnl.commissionIncome[i], 2)} €M`,
              `Commissioni Passive: ${formatNumber(results.pnl.commissionExpenses[i], 2)} €M`,
              `Netto: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Ricavi Totali', 
          data: results.pnl.totalRevenues, 
          decimals: 2, 
          isHeader: true,
          formula: results.pnl.totalRevenues.map((val, i) => createFormula(i,
            'Margine Interesse + Commissioni Nette',
            [
              `Margine Interesse: ${formatNumber(results.pnl.netInterestIncome[i], 2)} €M`,
              `Commissioni Nette: ${formatNumber(results.pnl.netCommissions[i], 2)} €M`,
              `Totale: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Costi del Personale', 
          data: results.pnl.personnelCostsTotal, 
          decimals: 2, 
          isTotal: true,
          formula: results.pnl.personnelCostsTotal.map((val, i) => createFormula(i,
            'FTE × Costo Medio per FTE',
            [
              `FTE: ${formatNumber(results.kpi.fte[i], 0)}`,
              `Costo Medio: ${assumptions.avgCostPerFte}k€`,
              `Totale: ${formatNumber(-val, 2)} €M`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.personnelCosts, 
          decimals: 2, 
          indent: true,
          formula: p.personnelCosts.map((val, i) => createFormula(i,
            'Costi Personale Totali × Peso RWA',
            [
              `Costi Personale Totali: ${formatNumber(results.pnl.personnelCostsTotal[i], 2)} €M`,
              `RWA Prodotto: ${formatNumber(p.rwa[i], 0)} €M`,
              `RWA Totali: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
              `Peso RWA: ${(p.rwa[i] / results.capital.totalRWA[i] * 100).toFixed(1)}%`
            ]
          ))
        })),
        { label: 'Altri Costi Operativi', data: [null,null,null,null,null], decimals: 2, isHeader: false },
        { 
          label: 'Back office', 
          data: results.pnl.backOfficeCosts, 
          decimals: 2, 
          indent: true,
          formula: results.pnl.backOfficeCosts.map((val, i) => createFormula(i,
            'Costo Base × (1 + Tasso Crescita)^Anno',
            [
              `Costo Base Anno 1: ${assumptions.backOfficeCostsY1} €M`,
              `Tasso Crescita: ${assumptions.costGrowthRate}%`,
              `Anni dalla base: ${i}`,
              `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Costi Amministrativi', 
          data: results.pnl.adminCosts, 
          decimals: 2, 
          indent: true,
          formula: results.pnl.adminCosts.map((val, i) => createFormula(i,
            'Costo Base × (1 + Tasso Crescita)^Anno',
            [
              `Costo Base Anno 1: ${assumptions.adminCostsY1} €M`,
              `Tasso Crescita: ${assumptions.costGrowthRate}%`,
              `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Marketing', 
          data: results.pnl.marketingCosts, 
          decimals: 2, 
          indent: true,
          formula: results.pnl.marketingCosts.map((val, i) => createFormula(i,
            'Costo Base × (1 + Tasso Crescita)^Anno',
            [
              `Costo Base Anno 1: ${assumptions.marketingCostsY1} €M`,
              `Tasso Crescita: ${assumptions.costGrowthRate}%`,
              `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Allocazione Costi Centrali', 
          data: results.pnl.hqAllocation, 
          decimals: 2, 
          indent: true,
          formula: results.pnl.hqAllocation.map((val, i) => createFormula(i,
            'Costo Base × (1 + Tasso Crescita)^Anno',
            [
              `Costo Base Anno 1: ${assumptions.hqAllocationY1} €M`,
              `Tasso Crescita: ${assumptions.costGrowthRate}%`,
              `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Costi IT', 
          data: results.pnl.itCosts, 
          decimals: 2, 
          indent: true,
          formula: results.pnl.itCosts.map((val, i) => createFormula(i,
            'Costo Base × (1 + Tasso Crescita)^Anno',
            [
              `Costo Base Anno 1: ${assumptions.itCostsY1} €M`,
              `Tasso Crescita: ${assumptions.costGrowthRate}%`,
              `Costo Anno ${i+1}: ${formatNumber(-val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Costi Operativi Totali', 
          data: results.pnl.totalOpex, 
          decimals: 2, 
          isHeader: true,
          formula: results.pnl.totalOpex.map((val, i) => createFormula(i,
            'Costi Personale + Altri Costi Operativi',
            [
              `Costi Personale: ${formatNumber(results.pnl.personnelCostsTotal[i], 2)} €M`,
              `Back Office: ${formatNumber(results.pnl.backOfficeCosts[i], 2)} €M`,
              `Amministrativi: ${formatNumber(results.pnl.adminCosts[i], 2)} €M`,
              `Marketing: ${formatNumber(results.pnl.marketingCosts[i], 2)} €M`,
              `HQ Allocation: ${formatNumber(results.pnl.hqAllocation[i], 2)} €M`,
              `IT: ${formatNumber(results.pnl.itCosts[i], 2)} €M`,
              `Totale: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Accantonamenti a Fondi Rischi e Oneri', 
          data: results.pnl.provisions, 
          decimals: 2,
          formula: results.pnl.provisions.map((val, i) => createFormula(i,
            'Provisioni Base × (1 + Tasso Crescita)^Anno',
            [
              `Provisioni Base Anno 1: ${assumptions.provisionsY1} €M`,
              `Tasso Crescita: ${assumptions.costGrowthRate}%`,
              `Provisioni Anno ${i+1}: ${formatNumber(-val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Rettifiche di Valore su Crediti (LLP)', 
          data: results.pnl.totalLLP, 
          decimals: 2, 
          isTotal: true,
          formula: results.pnl.totalLLP.map((val, i) => createFormula(i,
            'Somma LLP per Prodotto',
            [
              ...Object.entries(results.productResults).map(([key, p], idx) => 
                `Prodotto ${idx + 1}: ${formatNumber(p.llp[i], 2)} €M`
              ),
              `Totale LLP: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.llp, 
          decimals: 2, 
          indent: true,
          formula: p.llp.map((val, i) => createFormula(i,
            'Expected Loss su Nuovo Business + Loss su Default Stock',
            [
              `Danger Rate: ${assumptions.products[key].dangerRate}%`,
              `LGD (Loss Given Default): basato su LTV ${assumptions.products[key].ltv}%`,
              `Recovery netto di costi: ${100 - assumptions.products[key].recoveryCosts}%`,
              `Haircut collaterale: ${assumptions.products[key].collateralHaircut}%`,
              `LLP Anno ${i+1}: ${formatNumber(val, 2)} €M`
            ]
          ))
        })),
        { 
          label: 'Utile Lordo (PBT)', 
          data: results.pnl.preTaxProfit, 
          decimals: 2, 
          isHeader: true,
          formula: results.pnl.preTaxProfit.map((val, i) => createFormula(i,
            'Ricavi - Costi Operativi - LLP - Altri Costi',
            [
              `Ricavi Totali: ${formatNumber(results.pnl.totalRevenues[i], 2)} €M`,
              `Costi Operativi: ${formatNumber(results.pnl.totalOpex[i], 2)} €M`,
              `LLP: ${formatNumber(results.pnl.totalLLP[i], 2)} €M`,
              `Altri Costi: ${formatNumber(results.pnl.otherCosts[i], 2)} €M`,
              `Provisioni: ${formatNumber(results.pnl.provisions[i], 2)} €M`,
              `PBT: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
        { 
          label: 'Imposte', 
          data: results.pnl.taxes, 
          decimals: 2,
          formula: results.pnl.taxes.map((val, i) => createFormula(i,
            'PBT × Aliquota Fiscale (se PBT > 0)',
            [
              `Utile Lordo (PBT): ${formatNumber(results.pnl.preTaxProfit[i], 2)} €M`,
              `Aliquota Fiscale: ${assumptions.taxRate}%`,
              `Imposte: ${formatNumber(val, 2)} €M`,
              results.pnl.preTaxProfit[i] <= 0 ? `Nessuna imposta su perdite` : ''
            ].filter(Boolean)
          ))
        },
        { 
          label: 'Utile Netto', 
          data: results.pnl.netProfit, 
          decimals: 2, 
          isHeader: true,
          formula: results.pnl.netProfit.map((val, i) => createFormula(i,
            'Utile Lordo - Imposte',
            [
              `Utile Lordo: ${formatNumber(results.pnl.preTaxProfit[i], 2)} €M`,
              `Imposte: ${formatNumber(results.pnl.taxes[i], 2)} €M`,
              `Utile Netto: ${formatNumber(val, 2)} €M`
            ]
          ))
        },
    ];
    const bsRows = [
        { 
          label: 'Net Performing Assets', 
          data: results.bs.performingAssets, 
          decimals: 0, 
          isTotal: true,
          formula: results.bs.performingAssets.map((val, i) => createFormula(i,
            'Somma Stock Performing per Prodotto',
            [
              ...Object.entries(results.productResults).map(([key, p], idx) => 
                `Prodotto ${idx + 1}: ${formatNumber(p.performingAssets[i], 0)} €M`
              ),
              `Totale: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.performingAssets, 
          decimals: 0, 
          indent: true,
          formula: p.performingAssets.map((val, i) => createFormula(i,
            'Stock Precedente + Nuovi Volumi - Rimborsi - Default',
            [
              `Stock Anno Precedente: ${i > 0 ? formatNumber(p.performingAssets[i-1], 0) : '0'} €M`,
              `Nuovi Volumi: vedi tabella assumptions`,
              `Tipo ammortamento: ${assumptions.products[key].type === 'bullet' ? 'Bullet' : 'Francese'}`,
              `Stock Fine Anno: ${formatNumber(val, 0)} €M`
            ]
          ))
        })),
        { 
          label: 'Non-Performing Assets', 
          data: results.bs.nonPerformingAssets, 
          decimals: 0, 
          isTotal: false,
          formula: results.bs.nonPerformingAssets.map((val, i) => createFormula(i,
            'Somma NPL per Prodotto',
            [
              ...Object.entries(results.productResults).map(([key, p], idx) => 
                `Prodotto ${idx + 1}: ${formatNumber(p.nonPerformingAssets[i], 0)} €M`
              ),
              `Totale NPL: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'Operating Assets', 
          data: results.bs.operatingAssets, 
          decimals: 0, 
          isTotal: false,
          formula: results.bs.operatingAssets.map((val, i) => createFormula(i,
            'Totale Crediti × Operating Assets Ratio',
            [
              `Totale Crediti: ${formatNumber(results.bs.performingAssets[i] + results.bs.nonPerformingAssets[i], 0)} €M`,
              `Operating Assets Ratio: ${assumptions.operatingAssetsRatio}%`,
              `Operating Assets: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'Totale Attività', 
          data: results.bs.totalAssets, 
          decimals: 0, 
          isHeader: true,
          formula: results.bs.totalAssets.map((val, i) => createFormula(i,
            'Performing + NPL + Operating Assets',
            [
              `Performing Assets: ${formatNumber(results.bs.performingAssets[i], 0)} €M`,
              `Non-Performing: ${formatNumber(results.bs.nonPerformingAssets[i], 0)} €M`,
              `Operating Assets: ${formatNumber(results.bs.operatingAssets[i], 0)} €M`,
              `Totale: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'Totale Passività', 
          data: results.bs.totalLiabilities, 
          decimals: 0, 
          isHeader: true,
          formula: results.bs.totalLiabilities.map((val, i) => createFormula(i,
            'Totale Attività - Patrimonio Netto',
            [
              `Totale Attività: ${formatNumber(results.bs.totalAssets[i], 0)} €M`,
              `Patrimonio Netto: ${formatNumber(results.bs.equity[i], 0)} €M`,
              `Passività: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'o/w Depositi a Vista', 
          data: results.bs.sightDeposits, 
          decimals: 0, 
          indent: true,
          formula: results.bs.sightDeposits.map((val, i) => createFormula(i,
            'Totale Passività × % Depositi a Vista',
            [
              `Totale Passività: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
              `% Depositi a Vista: ${assumptions.fundingMix.sightDeposits}%`,
              `Depositi a Vista: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'o/w Depositi Vincolati', 
          data: results.bs.termDeposits, 
          decimals: 0, 
          indent: true,
          formula: results.bs.termDeposits.map((val, i) => createFormula(i,
            'Totale Passività × % Depositi Vincolati',
            [
              `Totale Passività: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
              `% Depositi Vincolati: ${assumptions.fundingMix.termDeposits}%`,
              `Depositi Vincolati: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'o/w Finanziamento Intergruppo', 
          data: results.bs.groupFunding, 
          decimals: 0, 
          indent: true,
          formula: results.bs.groupFunding.map((val, i) => createFormula(i,
            'Totale Passività × % Finanziamento Gruppo',
            [
              `Totale Passività: ${formatNumber(results.bs.totalLiabilities[i], 0)} €M`,
              `% Finanziamento Gruppo: ${assumptions.fundingMix.groupFunding}%`,
              `Finanziamento Gruppo: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'Patrimonio Netto', 
          data: results.bs.equity, 
          decimals: 0, 
          isHeader: true,
          formula: results.bs.equity.map((val, i) => createFormula(i,
            'Equity Iniziale + Somma Utili Netti',
            [
              `Equity Iniziale: ${assumptions.initialEquity} €M`,
              `Utili Cumulati fino Anno ${i+1}: ${formatNumber(val - assumptions.initialEquity, 0)} €M`,
              `Patrimonio Netto: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
    ];
    const capitalRows = [
        { 
          label: 'RWA', 
          data: results.capital.totalRWA, 
          decimals: 0, 
          isHeader: true,
          formula: results.capital.totalRWA.map((val, i) => createFormula(i,
            'RWA Credito + RWA Operativo + RWA Mercato + RWA Operating Assets',
            [
              `RWA Credito: ${formatNumber(results.capital.rwaCreditRisk[i], 0)} €M`,
              `RWA Operativo: ${formatNumber(results.capital.rwaOperationalRisk[i], 0)} €M`,
              `RWA Mercato: ${formatNumber(results.capital.rwaMarketRisk[i], 0)} €M`,
              `RWA Operating Assets: ${formatNumber(results.capital.rwaOperatingAssets[i], 0)} €M`,
              `Totale: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.rwa, 
          decimals: 0, 
          indent: true,
          formula: p.rwa.map((val, i) => createFormula(i,
            'Stock Performing × RWA Density',
            [
              `Stock Performing: ${formatNumber(p.performingAssets[i], 0)} €M`,
              `RWA Density: ${assumptions.products[key].rwaDensity}%`,
              `RWA Prodotto: ${formatNumber(val, 0)} €M`
            ]
          ))
        })),
        { 
          label: 'o/w Operating Assets', 
          data: results.capital.rwaOperatingAssets, 
          decimals: 0, 
          indent: true,
          formula: results.capital.rwaOperatingAssets.map((val, i) => createFormula(i,
            'Operating Assets × 100% (Risk Weight)',
            [
              `Operating Assets: ${formatNumber(results.bs.operatingAssets[i], 0)} €M`,
              `Risk Weight: 100%`,
              `RWA: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { label: 'Equity (CET1)', data: results.bs.equity, decimals: 0, isHeader: true },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.allocatedEquity, 
          decimals: 0, 
          indent: true,
          formula: p.allocatedEquity.map((val, i) => createFormula(i,
            'Equity Totale × (RWA Prodotto / RWA Totale)',
            [
              `Equity Totale: ${formatNumber(results.bs.equity[i], 0)} €M`,
              `RWA Prodotto: ${formatNumber(p.rwa[i], 0)} €M`,
              `RWA Totale: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
              `Peso: ${(p.rwa[i] / results.capital.totalRWA[i] * 100).toFixed(1)}%`,
              `Equity Allocato: ${formatNumber(val, 0)} €M`
            ]
          ))
        })),
        { 
          label: 'o/w Operating Assets', 
          data: results.capital.allocatedEquityOperatingAssets, 
          decimals: 0, 
          indent: true,
          formula: results.capital.allocatedEquityOperatingAssets.map((val, i) => createFormula(i,
            'Equity Totale × (RWA Operating / RWA Totale)',
            [
              `Equity Totale: ${formatNumber(results.bs.equity[i], 0)} €M`,
              `RWA Operating Assets: ${formatNumber(results.capital.rwaOperatingAssets[i], 0)} €M`,
              `RWA Totale: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
              `Equity Allocato: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'CET1 Ratio (%)', 
          data: results.kpi.cet1Ratio, 
          decimals: 1, 
          unit: '%', 
          isHeader: true,
          formula: results.kpi.cet1Ratio.map((val, i) => createFormula(i,
            'Patrimonio Netto (CET1) / RWA Totali × 100',
            [
              `Patrimonio Netto: ${formatNumber(results.bs.equity[i], 0)} €M`,
              `RWA Totali: ${formatNumber(results.capital.totalRWA[i], 0)} €M`,
              `CET1 Ratio: ${formatNumber(val, 1)}%`,
              `Minimo regolamentare: 4.5% + buffer`
            ]
          ))
        },
         ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.cet1Ratio, 
          decimals: 1, 
          unit: '%', 
          indent: true,
          formula: p.cet1Ratio.map((val, i) => createFormula(i,
            'Equity Allocato Prodotto / RWA Prodotto × 100',
            [
              `Equity Allocato: ${formatNumber(p.allocatedEquity[i], 0)} €M`,
              `RWA Prodotto: ${formatNumber(p.rwa[i], 0)} €M`,
              `CET1 Ratio: ${formatNumber(val, 1)}%`
            ]
          ))
        })),
        { label: 'RWA per tipologia di rischio', data: [null,null,null,null,null], decimals: 0, isHeader: true },
        { 
          label: 'Rischio di Credito', 
          data: results.capital.rwaCreditRisk, 
          decimals: 0, 
          indent: true,
          formula: results.capital.rwaCreditRisk.map((val, i) => createFormula(i,
            'Somma RWA di tutti i Prodotti',
            [
              ...Object.entries(results.productResults).map(([key, p], idx) => 
                `Prodotto ${idx + 1}: ${formatNumber(p.rwa[i], 0)} €M`
              ),
              `Totale RWA Credito: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'Rischio Operativo', 
          data: results.capital.rwaOperationalRisk, 
          decimals: 0, 
          indent: true,
          formula: results.capital.rwaOperationalRisk.map((val, i) => createFormula(i,
            'Totale Attivi × 10% (Stima Basilea)',
            [
              `Totale Attivi: ${formatNumber(results.bs.totalAssets[i], 0)} €M`,
              `Percentuale Rischio Op: 10%`,
              `RWA Operativo: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
        { 
          label: 'Rischio di Mercato', 
          data: results.capital.rwaMarketRisk, 
          decimals: 0, 
          indent: true,
          formula: results.capital.rwaMarketRisk.map((val, i) => createFormula(i,
            'Non applicabile per banking book',
            [
              `Divisione Real Estate: solo banking book`,
              `Trading book: non presente`,
              `RWA Mercato: ${formatNumber(val, 0)} €M`
            ]
          ))
        },
    ];
    const kpiRows = [
        { 
          label: 'Cost / Income', 
          data: results.kpi.costIncome, 
          decimals: 1, 
          unit: '%',
          formula: results.kpi.costIncome.map((val, i) => createFormula(i,
            'Costi Operativi / Ricavi Totali × 100',
            [
              `Costi Operativi: ${formatNumber(-results.pnl.totalOpex[i], 2)} €M`,
              `Ricavi Totali: ${formatNumber(results.pnl.totalRevenues[i], 2)} €M`,
              `Cost/Income: ${formatNumber(val, 1)}%`
            ]
          ))
        },
        { label: 'Numero Personale (FTE)', data: results.kpi.fte, decimals: 0 },
        { 
          label: 'Return on Equity (ROE)', 
          data: results.kpi.roe, 
          decimals: 1, 
          unit: '%', 
          isTotal: true,
          formula: results.kpi.roe.map((val, i) => createFormula(i,
            'Net Profit / Equity Medio × 100',
            [
              `Net Profit Anno ${i+1}: ${formatNumber(results.pnl.netProfit[i], 2)} €M`,
              `Equity Inizio: ${i > 0 ? formatNumber(results.bs.equity[i-1], 0) : formatNumber(assumptions.initialEquity, 0)} €M`,
              `Equity Fine: ${formatNumber(results.bs.equity[i], 0)} €M`,
              `Equity Medio: ${formatNumber(((i > 0 ? results.bs.equity[i-1] : assumptions.initialEquity) + results.bs.equity[i]) / 2, 0)} €M`,
              `ROE Totale: ${formatNumber(val, 1)}%`
            ]
          ))
        },
        ...Object.entries(results.productResults).map(([key, p], index) => ({ 
          label: `o/w Prodotto ${index + 1}: ${assumptions.products[key].name}`, 
          data: p.roe, 
          decimals: 1, 
          unit: '%', 
          indent: true,
          formula: p.roe.map((val, i) => createFormula(i,
            'Net Profit Prodotto / Equity Medio Allocato × 100',
            [
              `Net Profit Prodotto: ${formatNumber(p.netProfit[i], 2)} €M`,
              `Equity Allocato: ${formatNumber(p.allocatedEquity[i], 0)} €M`,
              `ROE: ${formatNumber(val, 1)}%`
            ]
          ))
        })),
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
    <TooltipProvider>
      <div className="min-h-screen bg-gray-200 font-sans">
        <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Piano Industriale Interattivo</h1>
              <p className="text-xs text-gray-600">Nuova Banca S.p.A. | Modello Finanziario</p>
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  <Save className="w-3 h-3 inline mr-1" />
                  Salvato: {lastSaved.toLocaleTimeString('it-IT')}
                </span>
              )}
              <button onClick={() => setEditMode(!editMode)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm transition-colors ${editMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                {editMode ? 'Blocca Modifiche' : 'Abilita Modifiche'}
              </button>
              <button onClick={exportData} className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors">
                <Download className="w-4 h-4" />
                Esporta
              </button>
              <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Importa
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
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
    </TooltipProvider>
  );
};

export default ExcelLikeBankPlan;