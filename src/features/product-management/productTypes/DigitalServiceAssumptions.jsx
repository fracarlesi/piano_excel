import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card/Card';
import { EditableNumberField } from '../../../components/ui/inputs';

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
      {/* Customer Acquisition Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">👥 Acquisizione Clienti</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <EditableNumberField
            label="Nuovi Clienti Y1"
            value={product.acquisition?.newCustomers?.y1 || 0}
            onChange={(value) => handleFieldChange('acquisition', 'newCustomers', 
              { ...product.acquisition?.newCustomers, y1: value })}
            editMode={editMode}
            min={0}
            max={1000000}
            step={1000}
            tooltip="Numero di nuovi clienti acquisiti nel primo anno"
          />
          
          <EditableNumberField
            label="Nuovi Clienti Y5"
            value={product.acquisition?.newCustomers?.y5 || 0}
            onChange={(value) => handleFieldChange('acquisition', 'newCustomers', 
              { ...product.acquisition?.newCustomers, y5: value })}
            editMode={editMode}
            min={0}
            max={1000000}
            step={1000}
            tooltip="Numero di nuovi clienti acquisiti nel quinto anno"
          />
          
          <EditableNumberField
            label="CAC (€)"
            value={product.acquisition?.cac || 0}
            onChange={(value) => handleFieldChange('acquisition', 'cac', value)}
            editMode={editMode}
            min={0}
            max={500}
            step={5}
            tooltip="Customer Acquisition Cost - costo per acquisire un cliente"
          />
          
          <EditableNumberField
            label="Churn Rate (%)"
            value={product.acquisition?.churnRate || 0}
            onChange={(value) => handleFieldChange('acquisition', 'churnRate', value)}
            editMode={editMode}
            min={0}
            max={50}
            step={1}
            tooltip="Tasso annuale di abbandono dei clienti"
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
            min={0}
            max={50000}
            step={100}
            tooltip="Deposito medio per cliente nel conto base"
          />
          
          <EditableNumberField
            label="Tasso Interesse (%)"
            value={product.baseAccount?.interestRate || 0}
            onChange={(value) => handleFieldChange('baseAccount', 'interestRate', value)}
            editMode={editMode}
            min={0}
            max={5}
            step={0.1}
            tooltip="Tasso di interesse pagato sul conto base"
          />
          
          <EditableNumberField
            label="Canone Mensile (€)"
            value={product.baseAccount?.monthlyFee || 0}
            onChange={(value) => handleFieldChange('baseAccount', 'monthlyFee', value)}
            editMode={editMode}
            min={0}
            max={50}
            step={0.5}
            tooltip="Canone mensile del conto"
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
              min={0}
              max={100}
              step={1}
              tooltip="Percentuale di clienti che attivano il modulo risparmio"
            />
            
            <EditableNumberField
              label="Deposito Aggiuntivo Medio (€)"
              value={product.savingsModule?.avgAdditionalDeposit || 0}
              onChange={(value) => handleFieldChange('savingsModule', 'avgAdditionalDeposit', value)}
              editMode={editMode}
              min={0}
              max={100000}
              step={1000}
              tooltip="Deposito aggiuntivo medio per cliente che attiva il modulo"
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
                  min={0}
                  max={100}
                  step={5}
                  compact
                />
                <EditableNumberField
                  label="Tasso %"
                  value={item.interestRate || 0}
                  onChange={(value) => handleDepositMixChange(index, 'interestRate', value)}
                  editMode={editMode}
                  min={0}
                  max={10}
                  step={0.1}
                  compact
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
            min={0}
            max={100}
            step={1}
            tooltip="Percentuale di clienti che attivano servizi premium"
          />
          
          <EditableNumberField
            label="Ricavi Annui Medi (€)"
            value={product.premiumServicesModule?.avgAnnualRevenue || 0}
            onChange={(value) => handleFieldChange('premiumServicesModule', 'avgAnnualRevenue', value)}
            editMode={editMode}
            min={0}
            max={1000}
            step={10}
            tooltip="Ricavi annui medi per cliente premium"
          />
        </CardContent>
      </Card>

      {/* Wealth Referral Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">🎯 Referral Wealth Management</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <EditableNumberField
            label="Adoption Rate (%)"
            value={product.wealthManagementReferral?.adoptionRate || 0}
            onChange={(value) => handleFieldChange('wealthManagementReferral', 'adoptionRate', value)}
            editMode={editMode}
            min={0}
            max={100}
            step={0.5}
            tooltip="Percentuale di clienti che vengono riferiti al wealth management"
          />
          
          <EditableNumberField
            label="Referral Fee (€)"
            value={product.wealthManagementReferral?.referralFee || 0}
            onChange={(value) => handleFieldChange('wealthManagementReferral', 'referralFee', value)}
            editMode={editMode}
            min={0}
            max={5000}
            step={50}
            tooltip="Commissione per ogni cliente riferito con successo"
          />
        </CardContent>
      </Card>
    </>
  );
};

export default DigitalServiceAssumptions;