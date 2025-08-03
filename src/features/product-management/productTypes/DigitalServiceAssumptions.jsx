import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card/Card';
import { EditableNumberField } from '../../../components/ui/inputs';
import CustomerAcquisitionGrid from '../../financial-modeling/components/CustomerAcquisitionGrid';

const DigitalServiceAssumptions = ({ 
  product, 
  productKey, 
  divisionKey,
  editMode, 
  onFieldChange 
}) => {
  const handleFieldChange = (module, field, value) => {
    const updatedProduct = { ...product };
    if (!updatedProduct[module]) {
      updatedProduct[module] = {};
    }
    updatedProduct[module][field] = value;
    onFieldChange(productKey, module, updatedProduct[module]);
  };

  const handleDepositMixChange = (index, field, value) => {
    const updatedProduct = { ...product };
    if (!updatedProduct.savingsModule) {
      updatedProduct.savingsModule = { depositMix: [] };
    }
    if (!updatedProduct.savingsModule.depositMix) {
      updatedProduct.savingsModule.depositMix = [];
    }
    const newMix = [...updatedProduct.savingsModule.depositMix];
    newMix[index] = { ...newMix[index], [field]: value };
    updatedProduct.savingsModule.depositMix = newMix;
    onFieldChange(productKey, 'savingsModule', updatedProduct.savingsModule);
  };

  return (
    <>
      {/* Customer Acquisition Card - 10 Year Grid */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">👥 Acquisizione Clienti (10 anni)</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerAcquisitionGrid
            values={product.acquisition?.newCustomersArray || Array(10).fill(0)}
            onChange={(values) => handleFieldChange('acquisition', 'newCustomersArray', values)}
            cac={product.acquisition?.cac || 30}
            churnRate={product.acquisition?.churnRate || 5}
            onCacChange={(value) => handleFieldChange('acquisition', 'cac', value)}
            onChurnChange={(value) => handleFieldChange('acquisition', 'churnRate', value)}
            editMode={editMode}
          />
        </CardContent>
      </Card>

      {/* Base Account Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">💳 Conto Base</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <EditableNumberField
            label="Deposito Medio (€)"
            value={product.baseAccount?.avgDeposit || 0}
            onChange={(value) => handleFieldChange('baseAccount', 'avgDeposit', value)}
            editMode={editMode}
            
          />
          
          <EditableNumberField
            label="Tasso Interesse (%)"
            value={product.baseAccount?.interestRate || 0}
            onChange={(value) => handleFieldChange('baseAccount', 'interestRate', value)}
            editMode={editMode}
            
          />
          
          <EditableNumberField
            label="Canone Mensile (€)"
            value={product.baseAccount?.monthlyFee || 0}
            onChange={(value) => handleFieldChange('baseAccount', 'monthlyFee', value)}
            editMode={editMode}
            
          />
        </CardContent>
      </Card>

      {/* Savings Module Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">💰 Modulo Risparmio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <EditableNumberField
              label="Adoption Rate (%)"
              value={product.savingsModule?.adoptionRate || 0}
              onChange={(value) => handleFieldChange('savingsModule', 'adoptionRate', value)}
              editMode={editMode}
              
            />
            
            <EditableNumberField
              label="Deposito Aggiuntivo Medio (€)"
              value={product.savingsModule?.avgAdditionalDeposit || 0}
              onChange={(value) => handleFieldChange('savingsModule', 'avgAdditionalDeposit', value)}
              editMode={editMode}
              
            />
          </div>
          
          {/* Deposit Mix */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Mix Depositi</div>
            {(product.savingsModule?.depositMix || []).map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded">
                <div className="text-xs">{item.name}</div>
                <EditableNumberField
                  label="% Mix"
                  value={item.percentage || 0}
                  onChange={(value) => handleDepositMixChange(index, 'percentage', value)}
                  editMode={editMode}
                />
                <EditableNumberField
                  label="Tasso %"
                  value={item.interestRate || 0}
                  onChange={(value) => handleDepositMixChange(index, 'interestRate', value)}
                  editMode={editMode}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Premium Services Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">⭐ Servizi Premium</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <EditableNumberField
            label="Adoption Rate (%)"
            value={product.premiumServicesModule?.adoptionRate || 0}
            onChange={(value) => handleFieldChange('premiumServicesModule', 'adoptionRate', value)}
            editMode={editMode}
            
          />
          
          <EditableNumberField
            label="Ricavo Mensile Medio (€)"
            value={product.premiumServicesModule?.avgMonthlyRevenue || 0}
            onChange={(value) => handleFieldChange('premiumServicesModule', 'avgMonthlyRevenue', value)}
            editMode={editMode}
            
          />
        </CardContent>
      </Card>

    </>
  );
};

export default DigitalServiceAssumptions;