import React, { useState } from 'react';
import StaffingTable from '../../shared/frontend/StaffingTable';
import useAssumptionsStore from '../../../firebase/assumptionsStore';

const WealthAssumptions = () => {
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedPersonnel, setExpandedPersonnel] = useState(false);
  const { assumptions, updateAssumption } = useAssumptionsStore();
  
  const divisionAssumptions = assumptions.wealthDivision;

  // Handle nested field updates
  const handleNestedFieldChange = (productKey, path, value) => {
    updateAssumption(`products.${productKey}.${path}`, value);
  };

  // Wealth products come from cross-selling
  const wealthProducts = {
    wealthRealEstateFund: assumptions.products?.wealthRealEstateFund || {
      name: 'Real Estate Investment Fund',
      productType: 'WealthManagement',
      isWealth: true,
      originatingDivision: 'realEstate',
      digitalReferral: { adoptionRate: 5, referralFee: 150 },
      clientEngagement: { consultationFee: 2500 },
      captiveInvestment: {
        avgInvestmentPerClient: 150000,
        structuringFee: 3.0,
        managementFee: 2.0,
        avgDealDuration: 4
      }
    },
    wealthSMEDebt: assumptions.products?.wealthSMEDebt || {
      name: 'SME Private Debt Fund',
      productType: 'WealthManagement',
      isWealth: true,
      originatingDivision: 'sme',
      digitalReferral: { adoptionRate: 4, referralFee: 150 },
      clientEngagement: { consultationFee: 2500 },
      captiveInvestment: {
        avgInvestmentPerClient: 100000,
        structuringFee: 2.5,
        managementFee: 1.8,
        avgDealDuration: 3
      }
    },
    wealthTechVenture: assumptions.products?.wealthTechVenture || {
      name: 'Tech & Innovation Fund',
      productType: 'WealthManagement',
      isWealth: true,
      originatingDivision: 'tech',
      digitalReferral: { adoptionRate: 3, referralFee: 200 },
      clientEngagement: { consultationFee: 3000 },
      captiveInvestment: {
        avgInvestmentPerClient: 200000,
        structuringFee: 4.0,
        managementFee: 2.5,
        avgDealDuration: 5
      }
    },
    wealthIncentiveFund: assumptions.products?.wealthIncentiveFund || {
      name: 'Government Incentive Optimization',
      productType: 'WealthManagement',
      isWealth: true,
      originatingDivision: 'incentive',
      digitalReferral: { adoptionRate: 2, referralFee: 100 },
      clientEngagement: { consultationFee: 1500 },
      captiveInvestment: {
        avgInvestmentPerClient: 50000,
        structuringFee: 2.0,
        managementFee: 1.5,
        avgDealDuration: 2
      }
    }
  };

  const divisionIcons = {
    realEstate: '🏢',
    sme: '🏭',
    tech: '🔧',
    incentive: '🌱'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Division Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">💎</span>
        <h2 className="text-xl font-semibold">Wealth Management Division - Assumptions</h2>
      </div>

      {/* Business Model Info */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>ℹ️ Modello di Business Wealth:</strong> La divisione Wealth non origina prodotti propri, 
          ma distribuisce ai clienti affluent del Digital Banking i prodotti di investimento 
          originati dalle altre divisioni (Real Estate, SME Restructuring, Tech & Innovation).
        </p>
      </div>

      {/* Personnel Section */}
      <div className="mb-8 border rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedPersonnel(!expandedPersonnel)}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
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
          <div className="p-6 bg-white">
            <StaffingTable
              divisionData={divisionAssumptions}
              path="wealthDivision"
              handleAssumptionChange={updateAssumption}
              editMode={true}
              companyTaxMultiplier={assumptions.personnel?.companyTaxMultiplier || 1.4}
            />
          </div>
        )}
      </div>

      {/* Cross-Selling Products Section */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          💼 Cross-Selling da altre Divisioni
        </h3>
        
        <div className="space-y-4">
          {Object.entries(wealthProducts).map(([productKey, product]) => {
            const currentProduct = assumptions.products?.[productKey] || product;
            
            return (
              <div key={productKey} className="border rounded-lg overflow-hidden">
                {/* Product Header */}
                <button
                  onClick={() => setExpandedProduct(expandedProduct === productKey ? null : productKey)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{divisionIcons[product.originatingDivision]}</span>
                    <span className="text-lg font-medium">{product.name}</span>
                    <span className="text-sm text-gray-500">
                      Adoption: {currentProduct.digitalReferral?.adoptionRate || 0}% | 
                      Avg Investment: €{(currentProduct.captiveInvestment?.avgInvestmentPerClient || 0).toLocaleString()}
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
                    {/* Digital Referral Parameters */}
                    <div>
                      <h4 className="text-sm font-medium mb-4">📱 Digital Banking Referral</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adoption Rate (%) 📈
                          </label>
                          <input
                            type="number"
                            value={currentProduct.digitalReferral?.adoptionRate || 0}
                            onChange={(e) => handleNestedFieldChange(productKey, 'digitalReferral.adoptionRate', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.5"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Referral Fee (€) 💸
                          </label>
                          <input
                            type="number"
                            value={currentProduct.digitalReferral?.referralFee || 0}
                            onChange={(e) => handleNestedFieldChange(productKey, 'digitalReferral.referralFee', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="25"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Client Engagement */}
                    <div>
                      <h4 className="text-sm font-medium mb-4">🤝 Client Engagement</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Consultation Fee (€) 💼
                        </label>
                        <input
                          type="number"
                          value={currentProduct.clientEngagement?.consultationFee || 0}
                          onChange={(e) => handleNestedFieldChange(productKey, 'clientEngagement.consultationFee', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="100"
                        />
                      </div>
                    </div>

                    {/* Captive Investment Parameters */}
                    <div>
                      <h4 className="text-sm font-medium mb-4">💰 Captive Investment Parameters</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avg Investment per Client (€) 💵
                          </label>
                          <input
                            type="number"
                            value={currentProduct.captiveInvestment?.avgInvestmentPerClient || 0}
                            onChange={(e) => handleNestedFieldChange(productKey, 'captiveInvestment.avgInvestmentPerClient', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="10000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Structuring Fee (%) 📊
                          </label>
                          <input
                            type="number"
                            value={currentProduct.captiveInvestment?.structuringFee || 0}
                            onChange={(e) => handleNestedFieldChange(productKey, 'captiveInvestment.structuringFee', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Management Fee (%) 📈
                          </label>
                          <input
                            type="number"
                            value={currentProduct.captiveInvestment?.managementFee || 0}
                            onChange={(e) => handleNestedFieldChange(productKey, 'captiveInvestment.managementFee', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avg Deal Duration (years) ⏱️
                          </label>
                          <input
                            type="number"
                            value={currentProduct.captiveInvestment?.avgDealDuration || 0}
                            onChange={(e) => handleNestedFieldChange(productKey, 'captiveInvestment.avgDealDuration', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="1"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Product Type Info */}
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Originating Division:</strong> {product.originatingDivision.charAt(0).toUpperCase() + product.originatingDivision.slice(1)} | 
                        <strong> Type:</strong> Cross-selling captive investment product
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

export default WealthAssumptions;