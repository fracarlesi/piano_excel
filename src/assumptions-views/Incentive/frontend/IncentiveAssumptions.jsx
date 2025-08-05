import React, { useState } from 'react';
import StaffingTable from '../../shared/frontend/StaffingTable';
import VolumeInputGrid from '../../shared/frontend/VolumeInputGrid';
import CreditProductAssumptions from '../../shared/components/CreditProductAssumptions';
import { incentiveProducts } from '../backend/products';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const IncentiveAssumptions = () => {
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedPersonnel, setExpandedPersonnel] = useState(false);
  const { assumptions, updateAssumption } = useAssumptionsStore();
  
  const divisionAssumptions = assumptions.incentiveDivision;

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
        <span className="text-3xl">🌱</span>
        <h2 className="text-xl font-semibold">Finanza Agevolata Division - Assumptions</h2>
      </div>

      {/* Personnel Section */}
      <div className="mb-8 border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            👥 Personale e Costi HR
          </h3>
          <button
            onClick={() => setExpandedPersonnel(!expandedPersonnel)}
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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
              path="incentiveDivision"
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
          📦 Prodotti Finanza Agevolata
        </h3>
        
        <div className="space-y-4">
          {Object.entries(incentiveProducts).map(([productKey, product]) => {
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
                      {product.productType === 'Commission' ? 
                        `Revenue Y1: €${currentProduct.volumeArray?.[0] || 0}M | Y10: €${currentProduct.volumeArray?.[9] || 0}M` :
                        `Vol Y1: €${currentProduct.volumeArray?.[0] || 0}M | Vol Y10: €${currentProduct.volumeArray?.[9] || 0}M`
                      }
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
                    {/* Volume/Revenue Grid */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {product.productType === 'Commission' ? '💰 Ricavi (€M)' : '📊 Volumi (€M)'}
                      </h4>
                      <VolumeInputGrid
                        values={currentProduct.volumeArray || product.volumeArray}
                        onChange={(volumes) => handleVolumeChange(productKey, volumes)}
                      />
                    </div>

                    {/* Product Parameters */}
                    {product.productType === 'Commission' ? (
                      // Advisory Product Parameters
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Average Deal Size */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avg Deal Size (€M) 📏
                          </label>
                          <input
                            type="number"
                            value={currentProduct.avgDealSize || product.avgDealSize}
                            onChange={(e) => handleFieldChange(productKey, 'avgDealSize', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.1"
                          />
                        </div>

                        {/* Deals per Year */}
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deals per Year 📈
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {[...Array(10)].map((_, index) => (
                              <div key={index}>
                                <label className="text-xs text-gray-500">Y{index + 1}</label>
                                <input
                                  type="number"
                                  value={currentProduct.dealsPerYear?.[index] || product.dealsPerYear?.[index] || 0}
                                  onChange={(e) => {
                                    const newArray = [...(currentProduct.dealsPerYear || product.dealsPerYear)];
                                    newArray[index] = parseInt(e.target.value) || 0;
                                    handleFieldChange(productKey, 'dealsPerYear', newArray);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="5"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Credit Product Parameters
                      <CreditProductAssumptions
                        product={currentProduct}
                        productKey={productKey}
                        divisionKey="incentive"
                        onFieldChange={handleFieldChange}
                      />
                    )}

                    {/* Product Type Info */}
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Tipo Prodotto:</strong> {product.productType === 'Commission' ? 
                          'Advisory Services (100% commissioni)' : 
                          'Bridge Financing con Garanzia Statale'}
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

export default IncentiveAssumptions;