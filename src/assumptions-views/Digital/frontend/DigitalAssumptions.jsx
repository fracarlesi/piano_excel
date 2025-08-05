import React, { useState } from 'react';
import StaffingTable from '../../shared/frontend/StaffingTable';
import { digitalProducts } from '../backend/products';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const DigitalAssumptions = () => {
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedPersonnel, setExpandedPersonnel] = useState(false);
  const { assumptions, updateAssumption } = useAssumptionsStore();
  
  const divisionAssumptions = assumptions.digitalBankingDivision;

  // Handle field updates - Removed as it's not used in this component

  // Handle nested field updates (for acquisition, modules, etc.)
  const handleNestedFieldChange = (productKey, path, value) => {
    updateAssumption(`products.${productKey}.${path}`, value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Division Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📱</span>
        <h2 className="text-xl font-semibold">Digital Banking Division - Assumptions</h2>
      </div>

      {/* Personnel Section */}
      <div className="mb-8 border rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedPersonnel(!expandedPersonnel)}
          className="w-full p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-medium flex items-center gap-2">
              👥 Personale e Costi HR
            </span>
          </div>
          <svg
            className={`w-5 h-5 transform transition-transform ${
              expandedPersonnel ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedPersonnel && (
          <div className="p-6 bg-white dark:bg-gray-800">
            <StaffingTable
              divisionData={divisionAssumptions}
              path="digitalBankingDivision"
              handleAssumptionChange={updateAssumption}
              editMode={true}
              companyTaxMultiplier={assumptions.personnel?.companyTaxMultiplier || 1.4}
            />
          </div>
        )}
      </div>

      {/* Products Section */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          📦 Prodotti Digital Banking
        </h3>
        
        <div className="space-y-4">
          {Object.entries(digitalProducts).map(([productKey, product]) => {
            // Get current values from store or use defaults
            const currentProduct = assumptions.products?.[productKey] || product;
            
            return (
              <div key={productKey} className="border rounded-lg overflow-hidden">
                {/* Product Header */}
                <button
                  onClick={() => setExpandedProduct(expandedProduct === productKey ? null : productKey)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">{product.name}</span>
                    <span className="text-sm text-gray-500">
                      Clienti Y1: {(currentProduct.acquisition?.newCustomersArray?.[0] || 0).toLocaleString()} | 
                      Y10: {(currentProduct.acquisition?.newCustomersArray?.[9] || 0).toLocaleString()}
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

                {/* Product Details */}
                {expandedProduct === productKey && (
                  <div className="p-6 space-y-6 bg-white dark:bg-gray-800">
                    {/* Customer Acquisition - For all products */}
                    {(productKey === 'digitalBankAccount' || productKey === 'premiumDigitalBankAccount' || productKey === 'depositAccount') && (
                      <div>
                        <h4 className="text-sm font-medium mb-4">🎯 Customer Acquisition</h4>
                        
                        {/* Customer Growth Grid */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Customers per Year
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {[...Array(10)].map((_, index) => (
                              <div key={index}>
                                <label className="text-xs text-gray-500">Y{index + 1}</label>
                                <input
                                  type="number"
                                  value={currentProduct.acquisition?.newCustomersArray?.[index] || 0}
                                  onChange={(e) => {
                                    const newArray = [...(currentProduct.acquisition?.newCustomersArray || product.acquisition.newCustomersArray)];
                                    newArray[index] = parseInt(e.target.value) || 0;
                                    handleNestedFieldChange(productKey, 'acquisition.newCustomersArray', newArray);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1000"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CAC (€) 💸
                            </label>
                            <input
                              type="number"
                              value={currentProduct.acquisition?.cac || product.acquisition.cac}
                              onChange={(e) => handleNestedFieldChange(productKey, 'acquisition.cac', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Churn Rate (%) 📉
                            </label>
                            <input
                              type="number"
                              value={currentProduct.acquisition?.churnRate || product.acquisition.churnRate}
                              onChange={(e) => handleNestedFieldChange(productKey, 'acquisition.churnRate', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.5"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Base Account - For bank account products */}
                    {(productKey === 'digitalBankAccount' || productKey === 'premiumDigitalBankAccount') && (
                      <div>
                        <h4 className="text-sm font-medium mb-4">
                          {productKey === 'premiumDigitalBankAccount' ? '⭐ Premium Services Module' : '💳 Base Account'}
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Avg Deposit (€) 💰
                            </label>
                            <input
                              type="number"
                              value={currentProduct.baseAccount?.avgDeposit || product.baseAccount.avgDeposit}
                              onChange={(e) => handleNestedFieldChange(productKey, 'baseAccount.avgDeposit', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Interest Rate (%) 📊
                            </label>
                            <input
                              type="number"
                              value={currentProduct.baseAccount?.interestRate || product.baseAccount.interestRate}
                              onChange={(e) => handleNestedFieldChange(productKey, 'baseAccount.interestRate', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Monthly Fee (€) 🏷️
                            </label>
                            <input
                              type="number"
                              value={currentProduct.baseAccount?.monthlyFee || product.baseAccount.monthlyFee}
                              onChange={(e) => handleNestedFieldChange(productKey, 'baseAccount.monthlyFee', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.5"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Savings Module - Only for depositAccount */}
                    {productKey === 'depositAccount' && (
                      <div>
                        <h4 className="text-sm font-medium mb-4">🏦 Savings Module</h4>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avg Deposit per Customer (€) 💵
                          </label>
                          <input
                            type="number"
                            value={currentProduct.savingsModule?.avgAdditionalDeposit || product.savingsModule.avgAdditionalDeposit}
                            onChange={(e) => handleNestedFieldChange(productKey, 'savingsModule.avgAdditionalDeposit', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Deposito medio per cliente del conto deposito
                          </p>
                        </div>
                        
                        {/* Deposit Mix */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mix Depositi per Durata Vincolo 📅
                          </label>
                          
                          {/* Merge current store data with default product structure to ensure all durations are shown */}
                          {(() => {
                            // Get the default deposit mix from products.js
                            const defaultDepositMix = product.savingsModule.depositMix || [];
                            const currentDepositMix = currentProduct.savingsModule?.depositMix || [];
                            
                            // Merge to ensure all default durations are present
                            const mergedDepositMix = defaultDepositMix.map((defaultItem) => {
                              const currentItem = currentDepositMix.find(item => item.name === defaultItem.name);
                              return currentItem || defaultItem;
                            });
                            
                            // Calculate total percentage for validation
                            const totalPercentage = mergedDepositMix.reduce((sum, item) => sum + (item.percentage || 0), 0);
                            const isValid = Math.abs(totalPercentage - 100) < 0.01;
                            
                            return (
                              <>
                                {totalPercentage > 0 && (
                                  <div className={`mb-2 px-3 py-2 rounded text-sm ${isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    Totale: {totalPercentage.toFixed(1)}% {isValid ? '✓' : '- Deve essere 100%!'}
                                  </div>
                                )}
                                
                                <div className="space-y-2">
                                  {mergedDepositMix.map((item, index) => (
                                    <div key={index} className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded">
                                      <div className="flex items-center">
                                        <span className="text-sm">{item.name}</span>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500">% Mix</label>
                                        <input
                                          type="number"
                                          value={item.percentage || 0}
                                          onChange={(e) => {
                                            const newMix = [...mergedDepositMix];
                                            newMix[index] = { ...newMix[index], percentage: parseFloat(e.target.value) || 0 };
                                            handleNestedFieldChange(productKey, 'savingsModule.depositMix', newMix);
                                          }}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          step="5"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500">Tasso %</label>
                                        <input
                                          type="number"
                                          value={item.interestRate || 0}
                                          onChange={(e) => {
                                            const newMix = [...mergedDepositMix];
                                            newMix[index] = { ...newMix[index], interestRate: parseFloat(e.target.value) || 0 };
                                            handleNestedFieldChange(productKey, 'savingsModule.depositMix', newMix);
                                          }}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          step="0.1"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}


                    {/* Product Type Info */}
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Tipo Prodotto:</strong> 
                        {productKey === 'digitalBankAccount' && 'Digital Bank Account - Conto base'}
                        {productKey === 'premiumDigitalBankAccount' && 'Premium Digital Bank Account - Con servizi premium'}
                        {productKey === 'depositAccount' && 'Deposit Account - Conto deposito vincolato'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DigitalAssumptions;