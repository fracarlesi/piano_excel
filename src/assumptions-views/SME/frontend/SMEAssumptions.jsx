import React, { useState } from 'react';
import StaffingTable from '../../shared/frontend/StaffingTable';
import VolumeInputGrid from '../../shared/frontend/VolumeInputGrid';
import CreditProductAssumptions from '../../shared/components/CreditProductAssumptions';
import { smeProducts } from '../backend/products';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const SMEAssumptions = () => {
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedPersonnel, setExpandedPersonnel] = useState(false);
  const { assumptions, updateAssumption } = useAssumptionsStore();
  
  const divisionAssumptions = assumptions.smeDivision;

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
        <span className="text-3xl">🏭</span>
        <h2 className="text-xl font-semibold">SME Restructuring Division - Assumptions</h2>
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
              path="smeDivision"
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
          📦 Prodotti SME Restructuring
        </h3>
        
        <div className="space-y-4">
          {Object.entries(smeProducts).map(([productKey, product]) => {
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
                  <div className="p-6 space-y-6 bg-white dark:bg-gray-800">
                    {/* Volume Grid */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">📊 Volumi (€M)</h4>
                      <VolumeInputGrid
                        values={currentProduct.volumeArray || product.volumeArray}
                        onChange={(volumes) => handleVolumeChange(productKey, volumes)}
                      />
                    </div>

                    {/* Product-specific assumptions */}
                    <CreditProductAssumptions
                      product={currentProduct}
                      productKey={productKey}
                      divisionKey="sme"
                      onFieldChange={handleFieldChange}
                    />

                    {/* Product Type Info */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Tipo Prodotto:</strong> {product.type === 'bullet' ? 'Bridge Loan (Bullet)' : 
                          product.gracePeriod > 0 ? `French con Grace Period (${product.gracePeriod} anni)` : 'French Amortization'} | 
                        <strong> Garanzia:</strong> {currentProduct.isSecured === false ? 'Non Garantito' : 'Garantito'}
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

export default SMEAssumptions;