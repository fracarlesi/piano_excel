import React, { useState } from 'react';
import StaffingTable from '../../shared/frontend/StaffingTable';
import VolumeInputGrid from '../../shared/frontend/VolumeInputGrid';
import { techProducts, techAllocationKeys } from '../backend/products';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const TechAssumptions = () => {
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedPersonnel, setExpandedPersonnel] = useState(false);
  const [expandedAllocation, setExpandedAllocation] = useState(false);
  const { assumptions, updateAssumption } = useAssumptionsStore();
  
  const divisionAssumptions = assumptions.techDivision;

  // Handle field updates
  const handleFieldChange = (productKey, field, value) => {
    updateAssumption(`techDivision.products.${productKey}.${field}`, value);
  };

  // Handle cost array changes
  const handleCostChange = (productKey, costs) => {
    updateAssumption(`techDivision.products.${productKey}.costArray`, costs);
  };

  // Handle client array changes
  const handleClientChange = (productKey, clients) => {
    updateAssumption(`techDivision.products.${productKey}.clientsArray`, clients);
  };

  // Handle allocation key changes
  const handleAllocationChange = (method, division, value) => {
    updateAssumption(`techAllocationKeys.${method}.${division}`, value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Division Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">💻</span>
        <h2 className="text-xl font-semibold">Tech Division - IT Infrastructure & Services</h2>
      </div>

      {/* Personnel Section */}
      <div className="mb-8 border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            👥 Personale IT
          </h3>
          <button
            onClick={() => setExpandedPersonnel(!expandedPersonnel)}
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${
                expandedPersonnel ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>{expandedPersonnel ? 'Chiudi' : 'Espandi'}</span>
          </button>
        </div>
        {expandedPersonnel && (
          <div className="p-4">
            <StaffingTable
              divisionData={divisionAssumptions}
              path="techDivision"
              handleAssumptionChange={updateAssumption}
              editMode={true}
              companyTaxMultiplier={assumptions.personnel?.companyTaxMultiplier || 1.4}
            />
          </div>
        )}
      </div>

      {/* IT Services Section */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          🖥️ Servizi IT & Infrastruttura
        </h3>
        
        <div className="space-y-4">
          {Object.entries(techProducts).filter(([key, product]) => 
            product.productType === 'ITService'
          ).map(([productKey, product]) => {
            const currentProduct = divisionAssumptions?.products?.[productKey] || product;
            
            // Debug rimosso - problema risolto
            
            return (
              <div key={productKey} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedProduct(expandedProduct === productKey ? null : productKey)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">{product.name}</span>
                    <span className="text-sm text-gray-500">
                      Y1: €{currentProduct.costArray?.[0] || 0}M | 
                      Y10: €{currentProduct.costArray?.[9] || 0}M |
                      {product.costType === 'capex' ? ' CAPEX' : 
                       product.costType === 'opex' ? ' OPEX' : ' MIXED'}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      expandedProduct === productKey ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedProduct === productKey && (
                  <div className="p-6 space-y-6 bg-white">
                    {/* Description */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{product.description}</p>
                    </div>

                    {/* Cost Grid */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">💰 Costi Annuali (€M)</h4>
                      <VolumeInputGrid
                        values={currentProduct.costArray || product.costArray}
                        onChange={(costs) => handleCostChange(productKey, costs)}
                      />
                    </div>

                    {/* Parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Depreciation Years */}
                      {product.depreciationYears > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Anni Ammortamento 📊
                          </label>
                          <input
                            type="number"
                            value={currentProduct.depreciationYears !== undefined ? currentProduct.depreciationYears : product.depreciationYears}
                            onChange={(e) => handleFieldChange(productKey, 'depreciationYears', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="10"
                          />
                        </div>
                      )}

                      {/* CAPEX Percentage for mixed */}
                      {product.costType === 'mixed' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            % CAPEX 🏗️
                          </label>
                          <input
                            type="number"
                            value={currentProduct.capexPercentage !== undefined ? currentProduct.capexPercentage : product.capexPercentage}
                            onChange={(e) => handleFieldChange(productKey, 'capexPercentage', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="5"
                            min="0"
                            max="100"
                          />
                        </div>
                      )}

                      {/* Markup Percentage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Markup % 💸
                        </label>
                        <input
                          type="number"
                          value={currentProduct.markupPercentage !== undefined ? currentProduct.markupPercentage : product.markupPercentage}
                          onChange={(e) => handleFieldChange(productKey, 'markupPercentage', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                          min="0"
                          max="50"
                        />
                      </div>

                      {/* Allocation Method */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Metodo Allocazione 📊
                        </label>
                        <select
                          value={currentProduct.allocationMethod !== undefined ? currentProduct.allocationMethod : product.allocationMethod}
                          onChange={(e) => handleFieldChange(productKey, 'allocationMethod', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="usage">Usage-based</option>
                          <option value="headcount">Headcount-based</option>
                          <option value="transactions">Transaction-based</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* External Revenue Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          🏢 Ricavi da Clienti Esterni
        </h3>
        
        {Object.entries(techProducts).filter(([key, product]) => 
          product.productType === 'ITRevenue'
        ).map(([productKey, product]) => {
          const currentProduct = divisionAssumptions?.products?.[productKey] || product;
          
          return (
            <div key={productKey} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedProduct(expandedProduct === productKey ? null : productKey)}
                className="w-full p-4 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium">{product.name}</span>
                  <span className="text-sm text-gray-500">
                    Clienti Y1: {currentProduct.clientsArray?.[0] || 0} | 
                    Y10: {currentProduct.clientsArray?.[9] || 0}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    expandedProduct === productKey ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedProduct === productKey && (
                <div className="p-6 space-y-6 bg-white">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">{product.description}</p>
                  </div>

                  {/* Exit Strategy Section - FIRST */}
                  {productKey === 'externalClients' && (
                    <div className="mt-6 border-t pt-6">
                      <h5 className="font-medium mb-4 flex items-center gap-2">
                        🚪 Exit Strategy
                      </h5>
                      
                      {Object.entries(techProducts).filter(([key, product]) => 
                        product.productType === 'Exit'
                      ).map(([exitProductKey, exitProduct]) => {
                        const currentExitProduct = divisionAssumptions?.products?.[exitProductKey] || exitProduct;
                        
                        return (
                          <div key={exitProductKey} className="space-y-6">
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm text-purple-800">{exitProduct.description}</p>
                            </div>

                            {/* Exit Parameters */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Anno di Exit 📅
                                </label>
                                <input
                                  type="number"
                                  value={currentExitProduct.exitYear !== undefined ? currentExitProduct.exitYear : exitProduct.exitYear}
                                  onChange={(e) => handleFieldChange(exitProductKey, 'exitYear', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="0"
                                  max="10"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  % da Vendere 📊
                                </label>
                                <input
                                  type="number"
                                  value={currentExitProduct.exitPercentage !== undefined ? currentExitProduct.exitPercentage : exitProduct.exitPercentage}
                                  onChange={(e) => handleFieldChange(exitProductKey, 'exitPercentage', parseFloat(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  step="5"
                                  min="0"
                                  max="100"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Banca mantiene: {100 - (currentExitProduct.exitPercentage || exitProduct.exitPercentage)}%
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Multiplo Valutazione 💎
                                </label>
                                <input
                                  type="number"
                                  value={currentExitProduct.valuationMultiple !== undefined ? currentExitProduct.valuationMultiple : exitProduct.valuationMultiple}
                                  onChange={(e) => handleFieldChange(exitProductKey, 'valuationMultiple', parseFloat(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                />
                              </div>

                            </div>

                            {/* Simplified Info Box */}
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h6 className="font-medium text-blue-900 mb-2">💡 Note sull'Exit Strategy</h6>
                              <div className="text-sm text-blue-800 space-y-2">
                                <p><strong>Struttura del pagamento:</strong> Pagamento immediato del 100% del prezzo di vendita al momento del closing.</p>
                                <p><strong>Ricavi da quota mantenuta:</strong> La banca continuerà a ricevere la percentuale di utili corrispondente alla quota non venduta ({100 - (currentExitProduct.exitPercentage || exitProduct.exitPercentage)}% della divisione).</p>
                                <p><strong>Asset non ammortizzati:</strong> Gli asset IT passeranno al compratore al valore contabile residuo. Il prezzo di vendita verrà ridotto del valore non ancora ammortizzato.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* External Revenue Section - after Exit Strategy */}
                  <div className="mt-6 border-t pt-6">
                    <h5 className="font-medium mb-4 flex items-center gap-2">
                      💰 Ricavi da Clienti Esterni
                    </h5>

                    {/* Info box about revenue timing */}
                    {(() => {
                      const exitProduct = Object.entries(techProducts).find(([key, prod]) => prod.productType === 'Exit')?.[1];
                      const currentExitProduct = divisionAssumptions?.products?.divisionExit || exitProduct;
                      const exitYear = currentExitProduct?.exitYear || 0;
                      
                      if (exitYear > 0) {
                        return (
                          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                              ⚠️ <strong>Nota:</strong> I ricavi da clienti esterni iniziano dall'anno {exitYear + 1} (dopo l'exit strategy nell'anno {exitYear}).
                              I valori inseriti prima dell'anno {exitYear + 1} verranno automaticamente azzerati.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Clients Grid with exit year logic */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">👥 Numero Clienti Esterni</h4>
                      <VolumeInputGrid
                        values={(() => {
                          const exitProduct = Object.entries(techProducts).find(([key, prod]) => prod.productType === 'Exit')?.[1];
                          const currentExitProduct = divisionAssumptions?.products?.divisionExit || exitProduct;
                          const exitYear = currentExitProduct?.exitYear || 0;
                          const clients = currentProduct.clientsArray || product.clientsArray;
                          
                          // Se c'è un exit year, azzera i clienti prima di quell'anno
                          if (exitYear > 0) {
                            return clients.map((value, index) => {
                              // index 0 = Year 1, quindi Year N = index N-1
                              return index < exitYear ? 0 : value;
                            });
                          }
                          return clients;
                        })()}
                        onChange={(clients) => {
                          const exitProduct = Object.entries(techProducts).find(([key, prod]) => prod.productType === 'Exit')?.[1];
                          const currentExitProduct = divisionAssumptions?.products?.divisionExit || exitProduct;
                          const exitYear = currentExitProduct?.exitYear || 0;
                          
                          // Se c'è un exit year, forza a 0 i valori prima di quell'anno
                          if (exitYear > 0) {
                            const adjustedClients = clients.map((value, index) => {
                              return index < exitYear ? 0 : value;
                            });
                            handleClientChange(productKey, adjustedClients);
                          } else {
                            handleClientChange(productKey, clients);
                          }
                        }}
                        label="Numero Clienti"
                        unit="clienti"
                      />
                    </div>

                    {/* Revenue Parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Setup Fee (€M) 🎯
                        </label>
                        <input
                          type="number"
                          value={currentProduct.setupFeePerClient !== undefined ? currentProduct.setupFeePerClient : product.setupFeePerClient}
                          onChange={(e) => handleFieldChange(productKey, 'setupFeePerClient', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fee Annuale (€M) 💰
                        </label>
                        <input
                          type="number"
                          value={currentProduct.annualFeePerClient !== undefined ? currentProduct.annualFeePerClient : product.annualFeePerClient}
                          onChange={(e) => handleFieldChange(productKey, 'annualFeePerClient', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Margine % 📈
                        </label>
                        <input
                          type="number"
                          value={currentProduct.marginPercentage !== undefined ? currentProduct.marginPercentage : product.marginPercentage}
                          onChange={(e) => handleFieldChange(productKey, 'marginPercentage', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Post-Exit Service Contract - dopo i ricavi esterni */}
                  {productKey === 'externalClients' && (() => {
                    const exitProduct = Object.entries(techProducts).find(([key, prod]) => prod.productType === 'Exit')?.[1];
                    const currentExitProduct = divisionAssumptions?.products?.divisionExit || exitProduct;
                    
                    return (
                      <div className="mt-6 border-t pt-6">
                        <h5 className="font-medium mb-4 flex items-center gap-2">
                          📄 Contratto di Servizio Post-Exit
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fee Iniziale (€M) 💵
                            </label>
                            <input
                              type="number"
                              value={currentExitProduct.postExitServiceContract?.initialFee !== undefined ? currentExitProduct.postExitServiceContract.initialFee : exitProduct.postExitServiceContract.initialFee}
                              onChange={(e) => handleFieldChange('divisionExit', 'postExitServiceContract.initialFee', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="1"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fee Annuale (€M) 💰
                            </label>
                            <input
                              type="number"
                              value={currentExitProduct.postExitServiceContract?.annualFee !== undefined ? currentExitProduct.postExitServiceContract.annualFee : exitProduct.postExitServiceContract.annualFee}
                              onChange={(e) => handleFieldChange('divisionExit', 'postExitServiceContract.annualFee', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="1"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Durata (anni) ⏱️
                            </label>
                            <input
                              type="number"
                              value={currentExitProduct.postExitServiceContract?.contractDuration !== undefined ? currentExitProduct.postExitServiceContract.contractDuration : exitProduct.postExitServiceContract.contractDuration}
                              onChange={(e) => handleFieldChange('divisionExit', 'postExitServiceContract.contractDuration', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                              max="20"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Crescita Annua % 📈
                            </label>
                            <input
                              type="number"
                              value={currentExitProduct.postExitServiceContract?.annualGrowthRate !== undefined ? currentExitProduct.postExitServiceContract.annualGrowthRate : exitProduct.postExitServiceContract.annualGrowthRate}
                              onChange={(e) => handleFieldChange('divisionExit', 'postExitServiceContract.annualGrowthRate', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.5"
                              min="0"
                              max="10"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* Allocation Keys Section */}
      <div className="mt-8 border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            📊 Chiavi di Allocazione Costi
          </h3>
          <button
            onClick={() => setExpandedAllocation(!expandedAllocation)}
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${
                expandedAllocation ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>{expandedAllocation ? 'Chiudi' : 'Espandi'}</span>
          </button>
        </div>
        {expandedAllocation && (
          <div className="p-6 space-y-6">
            {Object.entries(techAllocationKeys).map(([method, divisions]) => {
              const currentAllocation = assumptions.techAllocationKeys?.[method] || divisions;
              
              return (
                <div key={method} className="space-y-3">
                  <h4 className="font-medium text-gray-700 capitalize">
                    {method === 'usage' ? '🔌 Usage-based' : 
                     method === 'headcount' ? '👥 Headcount-based' : 
                     '💳 Transaction-based'}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(divisions).map(([division, value]) => (
                      <div key={division}>
                        <label className="block text-sm text-gray-600 mb-1 capitalize">
                          {division}
                        </label>
                        <input
                          type="number"
                          value={currentAllocation[division] !== undefined ? currentAllocation[division] : value}
                          onChange={(e) => handleAllocationChange(method, division, parseFloat(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                          min="0"
                          max="100"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Totale: {Object.values(currentAllocation).reduce((sum, val) => sum + val, 0)}%
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechAssumptions;