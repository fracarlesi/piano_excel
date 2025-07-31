import React, { useState } from 'react';

const ProductManager = ({ divisionKey, divisionName, assumptions, onAssumptionChange, saveToFirebase }) => {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductType, setNewProductType] = useState('Credit');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductType, setEditProductType] = useState('Credit');

  // Filter products for this division
  const divisionProducts = Object.fromEntries(
    Object.entries(assumptions.products || {}).filter(([key]) => 
      key.startsWith(divisionKey)
    )
  );

  // Generate a unique product key
  const generateProductKey = (name) => {
    const baseKey = `${divisionKey}${name.replace(/[^A-Za-z0-9]/g, '')}`;
    let counter = 1;
    let key = baseKey;
    
    while (assumptions.products?.[key]) {
      key = `${baseKey}${counter}`;
      counter++;
    }
    
    return key;
  };

  // Create default product structure
  const createDefaultProduct = (name, type) => {
    const defaultCredit = {
      name: name,
      productType: 'Credit',
      volumes: { y1: 50, y10: 400 },
      volumeArray: [50, 125, 200, 300, 400, 400, 400, 400, 400, 400], // 10-year volume progression
      spread: 3.0,
      costOfFunding: assumptions.costOfFundsRate || 3.0,
      totalDuration: 5,
      durata: 5,
      gracePeriod: 0,
      rwaDensity: 75,
      dangerRate: 1.5,
      lgd: 45,
      ltv: 80,
      recoveryCosts: 10,
      collateralHaircut: 15,
      avgLoanSize: 1.0,
      creditClassification: 'Bonis',
      isFixedRate: false,
      type: 'french',
      commissionRate: 0.5,
      equityUpside: 0,
      quarterlyDist: [25, 25, 25, 25]
    };

    const defaultCommission = {
      name: name,
      productType: 'Commission',
      volumes: { y1: 10, y10: 100 },
      volumeArray: [10, 25, 50, 75, 100, 100, 100, 100, 100, 100], // 10-year volume progression
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
      operationalRiskWeight: 15,
      quarterlyDist: [25, 25, 25, 25]
    };

    return type === 'Credit' ? defaultCredit : defaultCommission;
  };

  // Add new product
  const handleAddProduct = () => {
    if (!newProductName.trim()) {
      alert('Please enter a product name');
      return;
    }

    const productKey = generateProductKey(newProductName);
    const newProduct = createDefaultProduct(newProductName.trim(), newProductType);

    // Create updated products object
    const updatedProducts = {
      ...assumptions.products,
      [productKey]: newProduct
    };

    // Update through Zustand store
    // console.log('Adding product with volumeArray:', newProduct.volumeArray);
    onAssumptionChange('products', updatedProducts);
    
    // Force immediate save to Firebase
    if (saveToFirebase) {
      setTimeout(() => saveToFirebase(), 100); // Small delay to let state update
    }
    
    // Reset form
    setNewProductName('');
    setNewProductType('Credit');
    setIsAddingProduct(false);
    
    // console.log(`✅ Product "${newProductName}" added successfully!`);
    alert(`Product "${newProductName}" added successfully!`);
  };

  // Remove product
  const handleRemoveProduct = (productKey, productName) => {
    if (window.confirm(`Are you sure you want to remove "${productName}"?`)) {
      // Create a copy of products without the removed product
      const updatedProducts = { ...assumptions.products };
      delete updatedProducts[productKey];
      
      // Update through Zustand store
      onAssumptionChange('products', updatedProducts);
      
      // console.log(`🗑️ Product "${productName}" removed successfully!`);
      alert(`Product "${productName}" removed successfully!`);
    }
  };

  // Start editing product
  const handleStartEdit = (productKey, product) => {
    setEditingProduct(productKey);
    setEditProductName(product.name);
    setEditProductType(product.productType || 'Credit');
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
    if (currentProduct.productType !== editProductType) {
      // Create new product with new type defaults
      productToSave = createDefaultProduct(editProductName.trim(), editProductType);
      
      // Preserve volumes and cost of funding from old product
      productToSave.volumes = currentProduct.volumes;
      if (currentProduct.costOfFunding) {
        productToSave.costOfFunding = currentProduct.costOfFunding;
      }
    } else {
      // Just update the name
      productToSave = { ...currentProduct, name: editProductName.trim() };
    }
    
    // Update through Zustand store
    onAssumptionChange(`products.${editingProduct}`, productToSave);

    // console.log(`✏️ Product "${editProductName}" updated successfully!`);
    alert(`Product updated successfully!`);
    setEditingProduct(null);
    setEditProductName('');
    setEditProductType('Credit');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditProductName('');
    setEditProductType('Credit');
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="flex items-end">
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 mr-2"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className="flex items-end space-x-2">
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
                    </div>
                    {product.productType !== editProductType && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-700">
                        ⚠️ Changing product type will reset all parameters to defaults (except volumes)
                      </div>
                    )}
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border mb-2">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        {product.name}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.productType === 'Credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {product.productType || 'Credit'}
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