import React from 'react';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const TreasuryAssumptions = () => {
  const { assumptions, updateAssumption } = useAssumptionsStore();
  const treasury = assumptions.treasury;

  return (
    <div className="p-6 space-y-6">
      {/* Division Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">💰</span>
        <h2 className="text-xl font-semibold">Treasury & ALM - Assumptions</h2>
      </div>

      {/* Business Model Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Treasury & ALM Function:</strong> Gestisce la liquidità della banca, 
          il funding interbancario, il portafoglio titoli e il sistema di Fund Transfer Pricing (FTP) 
          per l'allocazione dei costi di funding alle divisioni business.
        </p>
      </div>

      {/* Liquidity Management Parameters */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          💧 Liquidity Management Parameters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liquidity Cushion (%) 🛡️
              <span className="text-xs text-gray-500 ml-1">% of deposits to maintain as liquid assets</span>
            </label>
            <input
              type="number"
              value={treasury?.liquidityCushion || 10}
              onChange={(e) => updateAssumption('treasury.liquidityCushion', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.5"
              min="5"
              max="25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bond Portfolio Target (%) 📊
              <span className="text-xs text-gray-500 ml-1">% of assets in government bonds</span>
            </label>
            <input
              type="number"
              value={treasury?.bondPortfolioTarget || 15}
              onChange={(e) => updateAssumption('treasury.bondPortfolioTarget', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.5"
              min="0"
              max="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interbank Lending Target (%) 🏦
              <span className="text-xs text-gray-500 ml-1">% of assets for interbank market</span>
            </label>
            <input
              type="number"
              value={treasury?.interbankLendingTarget || 5}
              onChange={(e) => updateAssumption('treasury.interbankLendingTarget', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.5"
              min="0"
              max="15"
            />
          </div>
        </div>
      </div>

      {/* FTP Spread Parameters */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          📈 Fund Transfer Pricing (FTP) Spreads
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Retail FTP Spread (%) 👤
              <span className="text-xs text-gray-500 ml-1">Added to EURIBOR for retail products</span>
            </label>
            <input
              type="number"
              value={assumptions.ftpSpread?.retail || 1.5}
              onChange={(e) => updateAssumption('ftpSpread.retail', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Corporate FTP Spread (%) 🏢
              <span className="text-xs text-gray-500 ml-1">Added to EURIBOR for corporate products</span>
            </label>
            <input
              type="number"
              value={assumptions.ftpSpread?.corporate || 2.0}
              onChange={(e) => updateAssumption('ftpSpread.corporate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institutional FTP Spread (%) 🏛️
              <span className="text-xs text-gray-500 ml-1">Added to EURIBOR for institutional</span>
            </label>
            <input
              type="number"
              value={assumptions.ftpSpread?.institutional || 1.0}
              onChange={(e) => updateAssumption('ftpSpread.institutional', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Liquidity Costs */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          💸 Liquidity Costs by Funding Type
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sight Deposits Cost (%) 👁️
              <span className="text-xs text-gray-500 ml-1">Additional cost for on-demand deposits</span>
            </label>
            <input
              type="number"
              value={assumptions.liquidityCosts?.sight || 0.5}
              onChange={(e) => updateAssumption('liquidityCosts.sight', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term Deposits Cost (%) 📅
              <span className="text-xs text-gray-500 ml-1">Additional cost for term deposits</span>
            </label>
            <input
              type="number"
              value={assumptions.liquidityCosts?.termDeposits || 0.3}
              onChange={(e) => updateAssumption('liquidityCosts.termDeposits', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonds Cost (%) 📃
              <span className="text-xs text-gray-500 ml-1">Additional cost for bond funding</span>
            </label>
            <input
              type="number"
              value={assumptions.liquidityCosts?.bonds || 0.1}
              onChange={(e) => updateAssumption('liquidityCosts.bonds', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Calculation Examples */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">📊 FTP Calculation Example:</h4>
        <p className="text-sm text-green-700">
          <strong>Retail Product FTP:</strong> EURIBOR ({assumptions.euribor || 2.0}%) + 
          Retail Spread ({assumptions.ftpSpread?.retail || 1.5}%) = 
          {((assumptions.euribor || 2.0) + (assumptions.ftpSpread?.retail || 1.5)).toFixed(1)}%
        </p>
        <p className="text-sm text-green-700 mt-1">
          <strong>Corporate Product FTP:</strong> EURIBOR ({assumptions.euribor || 2.0}%) + 
          Corporate Spread ({assumptions.ftpSpread?.corporate || 2.0}%) = 
          {((assumptions.euribor || 2.0) + (assumptions.ftpSpread?.corporate || 2.0)).toFixed(1)}%
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>ℹ️ Note:</strong> Treasury gestisce centralmente il funding della banca e alloca i costi 
          alle divisioni attraverso il sistema FTP. I ricavi/costi netti di Treasury derivano dalla gestione 
          efficiente di questo spread di intermediazione.
        </p>
      </div>
    </div>
  );
};

export default TreasuryAssumptions;