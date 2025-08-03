import React, { useState } from 'react';
import ProductManager from '../product-management/ProductManager';
import VolumeInputGrid from '../financial-modeling/components/VolumeInputGrid';
import StaffingTable from './StaffingTable';
import CreditProductAssumptions from '../product-management/productTypes/CreditProductAssumptions';
import DigitalServiceAssumptions from '../product-management/productTypes/DigitalServiceAssumptions';
import WealthManagementProductEditor from './WealthManagementProductEditor';
import WealthCrossSellAssumptions from './WealthCrossSellAssumptions';

/**
 * Simplified Division Assumptions Component
 * Routes to specialized components based on product type
 */
const DivisionAssumptions = ({ 
  divisionKey,
  divisionName,
  divisionIcon,
  assumptions, 
  onAssumptionChange,
  productKeys = []
}) => {
  const [openProductKey, setOpenProductKey] = useState(null);
  const [isPersonnelExpanded, setIsPersonnelExpanded] = useState(false);
  
  // Handle accordion toggle
  const handleAccordionToggle = (productKey) => {
    setOpenProductKey(openProductKey === productKey ? null : productKey);
  };
  
  // Filter products for this division
  const divisionProducts = Object.fromEntries(
    Object.entries(assumptions.products || {}).filter(([key]) => 
      productKeys.length > 0 ? productKeys.includes(key) : key.startsWith(divisionKey)
    )
  );

  // Handle product field changes
  const handleProductFieldChange = (productKey, field, value) => {
    onAssumptionChange(`products.${productKey}.${field}`, value);
  };

  // Handle volume changes
  const handleVolumeChange = (productKey, volumes) => {
    onAssumptionChange(`products.${productKey}.volumeArray`, volumes);
  };

  // Get appropriate product component based on type
  const getProductComponent = (product, productKey) => {
    // Wealth Management model - usa il nuovo componente per Wealth
    if ((product.productType === 'WealthManagement' || product.isWealth) && divisionKey === 'wealth') {
      return (
        <WealthCrossSellAssumptions
          product={product}
          onUpdate={(updatedProduct) => {
            // Update all fields of the product
            Object.keys(updatedProduct).forEach(field => {
              if (typeof updatedProduct[field] === 'object' && field !== 'volumes') {
                // For nested objects, update the entire object
                onAssumptionChange(`products.${productKey}.${field}`, updatedProduct[field]);
              }
            });
          }}
        />
      );
    }
    
    // Altri prodotti Wealth Management (per altre divisioni)
    if (product.productType === 'WealthManagement' || product.isWealth) {
      return (
        <WealthManagementProductEditor
          product={product}
          onUpdate={(updatedProduct) => {
            // Update all fields of the product
            Object.keys(updatedProduct).forEach(field => {
              if (typeof updatedProduct[field] === 'object' && field !== 'volumes') {
                // For nested objects, update the entire object
                onAssumptionChange(`products.${productKey}.${field}`, updatedProduct[field]);
              }
            });
          }}
        />
      );
    }
    
    // Digital customer model
    if (product.productType === 'DepositAndService' || product.isDigital || product.acquisition) {
      return (
        <DigitalServiceAssumptions
          product={product}
          productKey={productKey}
          divisionKey={divisionKey}
          editMode={true}
          onFieldChange={handleProductFieldChange}
        />
      );
    }
    
    
    // Default to credit product
    return (
      <CreditProductAssumptions
        product={product}
        productKey={productKey}
        divisionKey={divisionKey}
        editMode={true}
        onFieldChange={handleProductFieldChange}
      />
    );
  };

  // Division mapping for paths
  const divisionMapping = {
    're': 'realEstateDivision',
    'sme': 'smeDivision',
    'digital': 'digitalBankingDivision',
    'wealth': 'wealthDivision',
    'tech': 'techDivision',
    'incentive': 'incentiveDivision',
    'treasury': 'treasury',
    'central': 'centralFunctions'
  };

  // Get division assumptions object based on key
  const getDivisionAssumptions = () => {
    return assumptions[divisionMapping[divisionKey]];
  };

  const divisionAssumptions = getDivisionAssumptions();
  const divisionPath = divisionMapping[divisionKey];

  return (
    <div className="p-6 space-y-6">
      {/* Division Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{divisionIcon}</span>
        <h2 className="text-xl font-semibold">{divisionName} - Assumptions</h2>
      </div>

      {/* Personnel Section */}
      {divisionAssumptions && divisionAssumptions.staffing && (
        <div className="mb-8 border rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              👥 Personale e Costi HR
            </h3>
            <button
              onClick={() => setIsPersonnelExpanded(!isPersonnelExpanded)}
              className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <span>{isPersonnelExpanded ? '−' : '+'}</span>
              <span>{isPersonnelExpanded ? 'Chiudi' : 'Espandi'}</span>
            </button>
          </div>
          {isPersonnelExpanded && (
            <div className="p-4">
              <StaffingTable
                divisionData={divisionAssumptions}
                path={divisionPath}
                handleAssumptionChange={onAssumptionChange}
                editMode={true}
                companyTaxMultiplier={assumptions.personnel?.companyTaxMultiplier || 1.4}
              />
            </div>
          )}
        </div>
      )}

      {/* Products Section */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          {divisionKey === 'wealth' ? '💼 Cross-Selling da altre Divisioni' : '📦 Prodotti e Servizi'}
        </h3>
        
        {/* Wealth Division Info Box */}
        {divisionKey === 'wealth' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>ℹ️ Modello di Business Wealth:</strong> La divisione Wealth non origina prodotti propri, 
              ma distribuisce ai clienti affluent del Digital Banking i prodotti di investimento 
              originati dalle altre divisioni (Real Estate, SME Restructuring, Tech & Innovation).
            </p>
          </div>
        )}
        
        {/* Product Manager - Non mostrare per Wealth */}
        {divisionKey !== 'wealth' && (
          <ProductManager
            divisionKey={divisionKey}
            divisionName={divisionName}
            products={divisionProducts}
            assumptions={assumptions}
            onAssumptionChange={onAssumptionChange}
          />
        )}

        {/* Product Details */}
        <div className="space-y-6 mt-6">
          {Object.entries(divisionProducts).map(([productKey, product]) => (
            <div key={productKey} className="border rounded-lg overflow-hidden">
              {/* Product Header */}
              <button
                onClick={() => handleAccordionToggle(productKey)}
                className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium">{product.name}</span>
                  <span className="text-sm text-gray-500">({productKey})</span>
                </div>
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    openProductKey === productKey ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Product Content */}
              {openProductKey === productKey && (
                <div className="p-6 space-y-6 bg-white">
                  {/* Volume Grid - Only for credit products */}
                  {product.productType !== 'DepositAndService' && 
                   product.productType !== 'WealthManagement' &&
                   !product.isDigital && 
                   !product.isWealth &&
                   !product.acquisition && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-2">📊 Volumi (€M)</h4>
                      <VolumeInputGrid
                        values={product.volumeArray || Array(10).fill(0)} // All 10 years editable
                        onChange={(volumes) => handleVolumeChange(productKey, volumes)}
                      />
                    </div>
                  )}

                  {/* Product-specific assumptions */}
                  {getProductComponent(product, productKey) || (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800">
                        ⚠️ Nessun componente di configurazione disponibile per questo tipo di prodotto.
                      </p>
                      <p className="text-sm text-yellow-600 mt-2">
                        Tipo prodotto: {product.productType || 'Non specificato'} | 
                        Is Wealth: {product.isWealth ? 'Sì' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DivisionAssumptions;