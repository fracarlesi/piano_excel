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
    console.log(`Generated product key: ${key} for ${name}`);
    
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
      lgd: 45,
      ltv: 80,
      recoveryCosts: 10,
      collateralHaircut: 15,
      avgLoanSize: 1.0,
      creditClassification: 'Bonis',
      isFixedRate: false,
      commissionRate: 0.5,
      equityUpside: 0
    };

    if (type === 'Credit') {
      // Configure based on credit type
      switch (creditType) {
        case 'bridge':
          return {
            ...baseProduct,
            type: 'bullet',
            productType: 'bridge',
            totalDuration: 2,
            durata: 2,
            gracePeriod: 0
          };
        
        case 'frenchNoGrace':
          return {
            ...baseProduct,
            type: 'french',
            totalDuration: 5,
            durata: 5,
            gracePeriod: 0
          };
        
        case 'frenchWithGrace':
          return {
            ...baseProduct,
            type: 'french',
            totalDuration: 7,
            durata: 7,
            gracePeriod: 2
          };
        
        default:
          return {
            ...baseProduct,
            type: 'bullet',
            productType: 'bridge',
            totalDuration: 2,
            durata: 2,
            gracePeriod: 0
          };
      }
    }

    // Commission product
    return {
      name: name,
      productType: 'Commission',
      volumes: { y1: 10, y10: 100 },
      volumeArray: [10, 25, 50, 75, 100, 100, 100, 100, 100, 100],
      commissionRate: 2.0,
      feeIncomeRate: 1.5,
      setupFeeRate: 0.5,
      managementFeeRate: 1.0,
      performanceFeeRate: 10.0,
      avgTransactionSize: 0.001,
      annualTransactions: 1000,
      clientRetentionRate: 90,
      crossSellingRate: 15,
      avgClientLifecycle: 5,
      serviceType: 'Advisory',
      revenueRecognition: 'Upfront',
      operationalRiskWeight: 15
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
    setEditProductType(product.productType || 'Credit');
    
    // Determine credit type from product configuration
    if (product.productType === 'Credit' || !product.productType) {
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
        <button
          onClick={() => setIsAddingProduct(!isAddingProduct)}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          {isAddingProduct ? '❌ Cancel' : '➕ Add Product'}
        </button>
      </div>

      {/* Add Product Form */}
      {isAddingProduct && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-800 mb-3">Add New Product</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Enter product name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type
                </label>
                <select
                  value={newProductType}
                  onChange={(e) => setNewProductType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Credit">Credit</option>
                  <option value="Commission">Commission</option>
                </select>
              </div>
            </div>
            
            {/* Credit Type Selection */}
            {newProductType === 'Credit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Product Type
                </label>
                <div className="space-y-2">
                  {creditTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="creditType"
                        value={option.value}
                        checked={newCreditType === option.value}
                        onChange={(e) => setNewCreditType(e.target.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                ✅ Add Product
              </button>
            </div>
          </div>
        </div>
      )}

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
                            <option value="Commission">Commission</option>
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
                        product.productType === 'Credit' || !product.productType
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {product.productType === 'Credit' || !product.productType
                          ? getCreditTypeDisplay(product)
                          : product.productType
                        }
                      </span>
                      <span className="text-xs text-gray-500">
                        Vol Y1: €{product.volumes?.y1 || 0}M | Vol Y10: €{product.volumes?.y10 || 0}M
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