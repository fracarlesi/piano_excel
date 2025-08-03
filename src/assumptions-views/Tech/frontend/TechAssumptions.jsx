import React, { useState } from 'react';
import StaffingTable from '../../shared/frontend/StaffingTable';
import VolumeInputGrid from '../../shared/frontend/VolumeInputGrid';
import { techProducts } from '../backend/products';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const TechAssumptions = () => {
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedPersonnel, setExpandedPersonnel] = useState(false);
  const { assumptions, updateAssumption } = useAssumptionsStore();
  
  const divisionAssumptions = assumptions.techDivision;

  // Handle field updates
  const handleFieldChange = (productKey, field, value) => {
    updateAssumption(`products.${productKey}.${field}`, value);
  };

  // Handle volume changes
  const handleVolumeChange = (productKey, volumes) => {
    updateAssumption(`products.${productKey}.volumeArray`, volumes);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Division Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔧</span>
        <h2 className="text-xl font-semibold">Tech & Innovation Division - Assumptions</h2>
      </div>

      {/* Personnel Section */}
      <div className="mb-8 border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            👥 Personale e Costi HR
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

      {/* Products Section */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          📦 Prodotti Tech & Innovation
        </h3>
        
        <div className="space-y-4">
          {Object.entries(techProducts).map(([productKey, product]) => {
            // Get current values from store or use defaults
            const currentProduct = assumptions.products?.[productKey] || product;
            
            return (
              <div key={productKey} className="border rounded-lg overflow-hidden">
                {/* Product Header */}
                <button
                  onClick={() => setExpandedProduct(expandedProduct === productKey ? null : productKey)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">{product.name}</span>
                    <span className="text-sm text-gray-500">
                      Vol Y1: €{currentProduct.volumeArray?.[0] || 0}M | 
                      Vol Y10: €{currentProduct.volumeArray?.[9] || 0}M
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
                  <div className="p-6 space-y-6 bg-white">
                    {/* Volume Grid */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">📊 Volumi (€M)</h4>
                      <VolumeInputGrid
                        values={currentProduct.volumeArray || product.volumeArray}
                        onChange={(volumes) => handleVolumeChange(productKey, volumes)}
                      />
                    </div>

                    {/* Product Parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Spread */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Spread (%) 💰
                        </label>
                        <input
                          type="number"
                          value={currentProduct.spread || product.spread}
                          onChange={(e) => handleFieldChange(productKey, 'spread', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>

                      {/* RWA Density */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RWA Density (%) ⚖️
                        </label>
                        <input
                          type="number"
                          value={currentProduct.rwaDensity || product.rwaDensity}
                          onChange={(e) => handleFieldChange(productKey, 'rwaDensity', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                        />
                      </div>

                      {/* Danger Rate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Danger Rate (%) ⚠️
                        </label>
                        <input
                          type="number"
                          value={currentProduct.dangerRate || product.dangerRate}
                          onChange={(e) => handleFieldChange(productKey, 'dangerRate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>

                      {/* Unsecured LGD */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unsecured LGD (%) 📉
                        </label>
                        <input
                          type="number"
                          value={currentProduct.unsecuredLGD || product.unsecuredLGD}
                          onChange={(e) => handleFieldChange(productKey, 'unsecuredLGD', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                        />
                      </div>

                      {/* Commission Rate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Commission Rate (%) 💼
                        </label>
                        <input
                          type="number"
                          value={currentProduct.commissionRate || product.commissionRate}
                          onChange={(e) => handleFieldChange(productKey, 'commissionRate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>

                      {/* Equity Upside */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Equity Upside (%) 🚀
                        </label>
                        <input
                          type="number"
                          value={currentProduct.equityUpside || product.equityUpside}
                          onChange={(e) => handleFieldChange(productKey, 'equityUpside', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.5"
                        />
                      </div>

                      {/* Average Loan Size */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Avg Loan Size (€M) 📏
                        </label>
                        <input
                          type="number"
                          value={currentProduct.avgLoanSize || product.avgLoanSize}
                          onChange={(e) => handleFieldChange(productKey, 'avgLoanSize', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>

                      {/* FTP Rate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          FTP Rate (%) 🏦
                        </label>
                        <input
                          type="number"
                          value={currentProduct.ftpRate || product.ftpRate}
                          onChange={(e) => handleFieldChange(productKey, 'ftpRate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>

                      {/* Durata in trimestri */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durata (trimestri) 📅
                        </label>
                        <input
                          type="number"
                          value={currentProduct.durata || product.durata}
                          onChange={(e) => handleFieldChange(productKey, 'durata', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                          min="1"
                          max="120"
                        />
                      </div>

                      {/* Tipo rimborso */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo Rimborso 💳
                        </label>
                        <select
                          value={currentProduct.type || product.type}
                          onChange={(e) => handleFieldChange(productKey, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="french">Francese (rate costanti)</option>
                          <option value="bullet">Bullet (capitale a scadenza)</option>
                        </select>
                      </div>

                      {/* Grace Period - solo per french */}
                      {(currentProduct.type || product.type) === 'french' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Grace Period (trimestri) ⏸️
                          </label>
                          <input
                            type="number"
                            value={currentProduct.gracePeriod || product.gracePeriod || 0}
                            onChange={(e) => handleFieldChange(productKey, 'gracePeriod', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="1"
                            min="0"
                            max="20"
                          />
                        </div>
                      )}
                    </div>

                    {/* Product Type Info */}
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Tipo Prodotto:</strong> {product.type === 'bullet' ? 'Venture Loan (Bullet)' : 
                          `Scale-up Financing (French con ${product.gracePeriod} anno grace period)`} | 
                        <strong> Equity Kicker:</strong> {currentProduct.equityUpside || product.equityUpside}%
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

export default TechAssumptions;