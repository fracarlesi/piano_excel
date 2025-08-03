import React, { useState } from 'react';

const ProductManager = ({ divisionKey, divisionName, assumptions, onAssumptionChange, saveToFirebase }) => {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductType, setNewProductType] = useState('Credit');
  const [newCreditType, setNewCreditType] = useState('bridge'); // Bridge, French No Grace, French With Grace
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductType, setEditProductType] = useState('Credit');
  const [editCreditType, setEditCreditType] = useState('bridge');

  // Credit type options matching financial engine
  const creditTypeOptions = [
    { value: 'bridge', label: 'Bridge Loans (Bullet)', description: 'Interest-only payments, principal at maturity' },
    { value: 'frenchNoGrace', label: 'French Amortization', description: 'Regular principal + interest payments' },
    { value: 'frenchWithGrace', label: 'French with Grace Period', description: 'Grace period then regular payments' }
  ];

  // Filter products for this division
  const divisionProducts = Object.fromEntries(
    Object.entries(assumptions.products || {}).filter(([key]) => 
      key.startsWith(divisionKey)
    )
  );

  // Generate a unique product key
  const generateProductKey = (name, creditType) => {
    // Sanitize name to create a valid key
    const sanitizedName = name
      .replace(/[^A-Za-z0-9]/g, '')
      .replace(/^\\w/, c => c.toUpperCase());
    
    // Create base key with division prefix
    let baseKey = `${divisionKey}${sanitizedName}`;
    
    // Add suffix for grace period products if needed
    if (creditType === 'frenchWithGrace') {
      baseKey += 'WithGrace';
    }
    
    // Ensure uniqueness
    let counter = 1;
    let key = baseKey;
    while (assumptions.products?.[key]) {
      key = `${baseKey}${counter}`;
      counter++;
    }
    
    // Log for tracking
    
    return key;
  };

  // Create default product structure based on credit type
  const createDefaultProduct = (name, type, creditType = 'bridge') => {
    const baseProduct = {
      name: name,
      productType: type,
      volumes: { y1: 50, y10: 400 },
      volumeArray: [50, 125, 200, 300, 400, 400, 400, 400, 400, 400], // 10-year volume progression
      spread: 3.0,
      costOfFunding: assumptions.costOfFundsRate || 3.0,
      rwaDensity: 75,
      dangerRate: 1.5,
      defaultAfterQuarters: 8, // Default timing for defaults
      lgd: 45,
      ltv: 80,
      recoveryCosts: 10,
      collateralHaircut: 15,
      avgLoanSize: 1.0,
      creditClassification: 'Bonis',
      isFixedRate: false,
      commissionRate: 0.5,
      equityUpside: 0,
      ftpRate: 1.5
    };

    if (type === 'Credit') {
      // Configure based on credit type
      switch (creditType) {
        case 'bridge':
          return {
            ...baseProduct,
            type: 'bullet',
            productType: 'bridge',
            durata: 8,
            gracePeriod: 0
          };
        
        case 'frenchNoGrace':
          return {
            ...baseProduct,
            type: 'french',
            durata: 20,
            gracePeriod: 0
          };
        
        case 'frenchWithGrace':
          return {
            ...baseProduct,
            type: 'french',
            durata: 28,
            gracePeriod: 8
          };
        
        default:
          return {
            ...baseProduct,
            type: 'bullet',
            productType: 'bridge',
            durata: 8,
            gracePeriod: 0
          };
      }
    }

    // Digital product
    if (type === 'Digital') {
      return {
        name: name,
        productType: 'DepositAndService',
        isDigital: true,
        acquisition: {
          newCustomersArray: [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 50000],
          cac: 30,
          churnRate: 5
        },
        baseAccount: {
          avgDeposit: 1500,
          interestRate: 0.1,
          monthlyFee: 0
        },
        savingsModule: {
          adoptionRate: 30,
          avgAdditionalDeposit: 5000,
          depositMix: [
            { name: 'Vincolato 12 mesi', percentage: 40, interestRate: 3.0 },
            { name: 'Vincolato 24 mesi', percentage: 35, interestRate: 3.5 },
            { name: 'Vincolato 36 mesi', percentage: 25, interestRate: 4.0 }
          ]
        },
        premiumServicesModule: {
          adoptionRate: 20,
          avgMonthlyRevenue: 6.67  // Era 80 annui, ora ~6.67 mensili
        }
      };
    }

    // Wealth Management product - Captive Deal Model
    if (type === 'Wealth') {
      return {
        name: name,
        productType: 'WealthManagement',
        isWealth: true,
        
        // Parametri referral da Digital Banking
        digitalReferral: {
          adoptionRate: 5,
          referralFee: 150
        },
        
        // Parametri di Ingaggio Cliente
        clientEngagement: {
          consultationFee: 2500
        },
        
        // Parametri dell'Investimento Captive
        captiveInvestment: {
          avgInvestmentPerClient: 150000,
          structuringFee: 3.0,
          managementFee: 2.0,
          avgDealDuration: 4
        }
      };
    }

    // Default to credit if type not recognized
    return {
      ...baseProduct,
      type: 'bullet',
      productType: 'bridge',
      durata: 8,
      gracePeriod: 0
    };
  };

  // Add new product
  const handleAddProduct = () => {
    if (!newProductName.trim()) {
      alert('Please enter a product name');
      return;
    }

    const productKey = generateProductKey(newProductName, newCreditType);
    const newProduct = createDefaultProduct(newProductName.trim(), newProductType, newCreditType);

    // Create updated products object
    const updatedProducts = {
      ...assumptions.products,
      [productKey]: newProduct
    };

    // Update through Zustand store
    onAssumptionChange('products', updatedProducts);
    
    // Force immediate save to Firebase
    if (saveToFirebase) {
      setTimeout(() => saveToFirebase(), 100);
    }
    
    // Reset form
    setNewProductName('');
    setNewProductType('Credit');
    setNewCreditType('bridge');
    setIsAddingProduct(false);
    
    alert(`Product "${newProductName}" added successfully!`);
  };

  // Remove product
  const handleRemoveProduct = (productKey, productName) => {
    if (window.confirm(`Are you sure you want to remove "${productName}"?`)) {
      const updatedProducts = { ...assumptions.products };
      delete updatedProducts[productKey];
      
      onAssumptionChange('products', updatedProducts);
      alert(`Product "${productName}" removed successfully!`);
    }
  };

  // Start editing product
  const handleStartEdit = (productKey, product) => {
    setEditingProduct(productKey);
    setEditProductName(product.name);
    
    // Determine product type
    if (product.productType === 'DepositAndService' || product.isDigital) {
      setEditProductType('Digital');
    } else if (product.productType === 'WealthManagement' || product.isWealth) {
      setEditProductType('Wealth');
    } else if (product.productType === 'Commission') {
      setEditProductType('Commission');
    } else {
      setEditProductType('Credit');
    }
    
    // Determine credit type from product configuration
    if (product.productType === 'Credit' || (!product.productType && !product.isDigital && !product.isWealth)) {
      if (product.productType === 'bridge' || product.type === 'bullet') {
        setEditCreditType('bridge');
      } else if (product.type === 'french' && product.gracePeriod > 0) {
        setEditCreditType('frenchWithGrace');
      } else if (product.type === 'french') {
        setEditCreditType('frenchNoGrace');
      } else {
        setEditCreditType('bridge');
      }
    }
    
    setIsAddingProduct(false);
  };

  // Save edited product
  const handleSaveEdit = () => {
    if (!editProductName.trim()) {
      alert('Product name cannot be empty');
      return;
    }

    const currentProduct = assumptions.products[editingProduct];
    
    let productToSave;
    
    // If type changed, we need to update the product structure
    if (currentProduct.productType !== editProductType || 
        (editProductType === 'Credit' && needsCreditTypeUpdate(currentProduct, editCreditType))) {
      // Create new product with new type defaults
      productToSave = createDefaultProduct(editProductName.trim(), editProductType, editCreditType);
      
      // Preserve volumes and cost of funding from old product
      productToSave.volumes = currentProduct.volumes;
      productToSave.volumeArray = currentProduct.volumeArray;
      if (currentProduct.costOfFunding) {
        productToSave.costOfFunding = currentProduct.costOfFunding;
      }
    } else {
      // Just update the name
      productToSave = { ...currentProduct, name: editProductName.trim() };
    }
    
    // Update through Zustand store
    onAssumptionChange(`products.${editingProduct}`, productToSave);

    alert(`Product updated successfully!`);
    setEditingProduct(null);
    setEditProductName('');
    setEditProductType('Credit');
    setEditCreditType('bridge');
  };

  // Check if credit type update is needed
  const needsCreditTypeUpdate = (product, newCreditType) => {
    const currentType = getCurrentCreditType(product);
    return currentType !== newCreditType;
  };

  // Get current credit type from product
  const getCurrentCreditType = (product) => {
    if (product.productType === 'bridge' || product.type === 'bullet') {
      return 'bridge';
    } else if (product.type === 'french' && product.gracePeriod > 0) {
      return 'frenchWithGrace';
    } else if (product.type === 'french') {
      return 'frenchNoGrace';
    }
    return 'bridge';
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditProductName('');
    setEditProductType('Credit');
    setEditCreditType('bridge');
  };

  // Get credit type display
  const getCreditTypeDisplay = (product) => {
    const creditType = getCurrentCreditType(product);
    const option = creditTypeOptions.find(opt => opt.value === creditType);
    return option ? option.label : 'Bridge Loans';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {divisionName} - Product Management
        </h3>
      </div>


      {/* Existing Products List */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">
          Current Products ({Object.keys(divisionProducts).length})
        </h4>
        
        {Object.keys(divisionProducts).length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No products found for this division. Add your first product above!
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(divisionProducts).map(([productKey, product]) => (
              <div key={productKey}>
                {editingProduct === productKey ? (
                  // Edit Mode
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                    <h5 className="font-medium text-yellow-800 mb-3">Edit Product</h5>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={editProductName}
                            onChange={(e) => setEditProductName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Type
                          </label>
                          <select
                            value={editProductType}
                            onChange={(e) => setEditProductType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          >
                            <option value="Credit">Credit</option>
                            <option value="Digital">Digital (Deposit & Services)</option>
                            {divisionKey === 'wealth' && <option value="Wealth">Wealth Management</option>}
                          </select>
                        </div>
                      </div>
                      
                      {/* Credit Type Selection for Edit */}
                      {editProductType === 'Credit' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credit Product Type
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {creditTypeOptions.map((option) => (
                              <label key={option.value} className="flex items-start space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="editCreditType"
                                  value={option.value}
                                  checked={editCreditType === option.value}
                                  onChange={(e) => setEditCreditType(e.target.value)}
                                  className="mt-1 text-yellow-600 focus:ring-yellow-500"
                                />
                                <div className="text-sm">
                                  <div className="font-medium">{option.label}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                        {(product.productType !== editProductType || 
                          (editProductType === 'Credit' && needsCreditTypeUpdate(product, editCreditType))) && (
                          <div className="text-sm text-yellow-700">
                            ⚠️ Will reset parameters to defaults
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border mb-2">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        {product.name}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.productType === 'DepositAndService' || product.isDigital
                          ? 'bg-purple-100 text-purple-800'
                          : product.productType === 'WealthManagement' || product.isWealth
                          ? 'bg-yellow-100 text-yellow-800'
                          : product.productType === 'Commission'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.productType === 'DepositAndService' || product.isDigital
                          ? 'Digital'
                          : product.productType === 'WealthManagement' || product.isWealth
                          ? 'Wealth Management'
                          : product.productType === 'Credit' || !product.productType
                          ? getCreditTypeDisplay(product)
                          : product.productType
                        }
                      </span>
                      <span className="text-xs text-gray-500">
                        {product.productType === 'DepositAndService' || product.isDigital
                          ? `Clienti Y1: ${(product.acquisition?.newCustomersArray?.[0] || product.acquisition?.newCustomers?.y1 || 0).toLocaleString()} | Y10: ${(product.acquisition?.newCustomersArray?.[9] || product.acquisition?.newCustomers?.y10 || 0).toLocaleString()}`
                          : product.productType === 'WealthManagement' || product.isWealth
                          ? `Adoption Rate: ${product.digitalReferral?.adoptionRate || 5}% | Referral Fee: €${product.digitalReferral?.referralFee || 150}`
                          : `Vol Y1: €${product.volumes?.y1 || 0}M | Vol Y10: €${product.volumes?.y10 || 0}M`
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartEdit(productKey, product)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        title="Edit Product"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(productKey, product.name)}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        title="Remove Product"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;