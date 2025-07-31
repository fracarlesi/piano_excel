import React, { useState } from 'react';
import ProductManager from '../../components/ProductManager';
import VolumeInputGrid from '../../components/VolumeInputGrid';
import StaffingTable from './StaffingTable';
import CreditProductAssumptions from './productTypes/CreditProductAssumptions';
import DigitalServiceAssumptions from './productTypes/DigitalServiceAssumptions';
import SimpleProductAssumptions from './productTypes/SimpleProductAssumptions';

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
    
    // Commission-only products
    if (product.productType === 'Commission') {
      return (
        <SimpleProductAssumptions
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

  // Get division assumptions object based on key
  const getDivisionAssumptions = () => {
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
    
    return assumptions[divisionMapping[divisionKey]];
  };

  const divisionAssumptions = getDivisionAssumptions();

  return (
    <div className="p-6 space-y-6">
      {/* Division Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{divisionIcon}</span>
        <h2 className="text-xl font-semibold">{divisionName} - Assumptions</h2>
      </div>

      {/* Personnel Section */}
      {divisionAssumptions && divisionAssumptions.staffing && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            👥 Personale e Costi HR
          </h3>
          <StaffingTable
            divisionKey={divisionKey}
            divisionData={divisionAssumptions}
            onAssumptionChange={onAssumptionChange}
            editMode={true}
          />
        </div>
      )}

      {/* Products Section */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          📦 Prodotti e Servizi
        </h3>
        
        {/* Product Manager */}
        <ProductManager
          divisionKey={divisionKey}
          divisionName={divisionName}
          products={divisionProducts}
          assumptions={assumptions}
          onAssumptionChange={onAssumptionChange}
        />

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
                  {/* Volume Grid */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2">📊 Volumi (€M)</h4>
                    <VolumeInputGrid
                      volumes={product.volumeArray || []}
                      onChange={(volumes) => handleVolumeChange(productKey, volumes)}
                      editMode={true}
                    />
                  </div>

                  {/* Product-specific assumptions */}
                  {getProductComponent(product, productKey)}
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