import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card/Card';
import { EditableNumberField } from '../../../components/ui/inputs';
import { EditableSelectField } from '../../../components/ui/inputs';

const CreditProductAssumptions = ({ 
  product, 
  productKey, 
  divisionKey,
  editMode, 
  onFieldChange 
}) => {
  const handleChange = (field, value) => {
    onFieldChange(productKey, field, value);
  };

  // Validation: Check if default happens after maturity
  const maturityQuarters = product.durata || 0;
  const defaultQuarters = product.defaultAfterQuarters || 8;
  const isDefaultAfterMaturity = defaultQuarters > maturityQuarters;

  return (
    <>
      {/* Validation Warning */}
      {isDefaultAfterMaturity && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                ⚠️ Attenzione: Configurazione non valida
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Il default ({defaultQuarters} trimestri) avviene dopo la maturity ({maturityQuarters} trimestri).</p>
                <p className="mt-1">Il modello richiede che il default avvenga <strong>prima</strong> della scadenza del prestito.</p>
                <p className="mt-1 font-medium">Soluzioni possibili:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Ridurre "Default dopo" a meno di {maturityQuarters} trimestri</li>
                  <li>Aumentare la "Durata" del prestito oltre {defaultQuarters} trimestri</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">📊 Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <EditableNumberField
            label="Spread (%)"
            value={product.spread}
            onChange={(value) => handleChange('spread', value)}
            editMode={editMode}
            min={0}
            max={20}
            step={0.1}
            
          />
          
          <EditableSelectField
            label="Tipo Tasso"
            value={product.isFixedRate ? 'fixed' : 'variable'}
            onChange={(value) => handleChange('isFixedRate', value === 'fixed')}
            editMode={editMode}
            options={[
              { value: 'variable', label: 'Variabile (EURIBOR + Spread)' },
              { value: 'fixed', label: 'Fisso' }
            ]}
            
          />
          
          <EditableNumberField
            label="Commissione (%)"
            value={product.commissionRate}
            onChange={(value) => handleChange('commissionRate', value)}
            editMode={editMode}
            min={0}
            max={10}
            step={0.1}
            
          />
          
          <EditableNumberField
            label="Commissione Passiva (%)"
            value={product.commissionExpenseRate || 0}
            onChange={(value) => handleChange('commissionExpenseRate', value)}
            editMode={editMode}
            min={0}
            max={10}
            step={0.1}
            
          />
          
          <EditableNumberField
            label="FTP Rate (%)"
            value={product.ftpRate || 1.5}
            onChange={(value) => handleChange('ftpRate', value)}
            editMode={editMode}
            min={0}
            max={10}
            step={0.1}
            
          />
        </CardContent>
      </Card>

      {/* Risk Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">⚠️ Rischio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <EditableNumberField
            label="Danger Rate (%)"
            value={product.dangerRate}
            onChange={(value) => handleChange('dangerRate', value)}
            editMode={editMode}
            min={0}
            max={20}
            step={0.1}
            
          />
          
          <EditableNumberField
            label="Default dopo (trimestri)"
            value={product.defaultAfterQuarters || 8}
            onChange={(value) => handleChange('defaultAfterQuarters', value)}
            editMode={editMode}
            min={1}
            max={40}
            step={1}
            
            error={isDefaultAfterMaturity}
          />
          
          <EditableNumberField
            label="RWA Density (%)"
            value={product.rwaDensity}
            onChange={(value) => handleChange('rwaDensity', value)}
            editMode={editMode}
            min={0}
            max={150}
            step={5}
            
          />
          
          <EditableNumberField
            label="Tempo di Recupero (trimestri)"
            value={product.timeToRecover || 12}
            onChange={(value) => handleChange('timeToRecover', value)}
            editMode={editMode}
            min={1}
            max={40}
            step={1}
            
          />
          
          <EditableSelectField
            label="Secured/Unsecured"
            value={product.isUnsecured ? 'unsecured' : 'secured'}
            onChange={(value) => handleChange('isUnsecured', value === 'unsecured')}
            editMode={editMode}
            options={[
              { value: 'secured', label: 'Secured (con garanzia)' },
              { value: 'unsecured', label: 'Unsecured (senza garanzia)' }
            ]}
            
          />
          
          {!product.isUnsecured && (
            <>
              <EditableNumberField
                label="LTV (%)"
                value={product.ltv}
                onChange={(value) => handleChange('ltv', value)}
                editMode={editMode}
                min={0}
                max={100}
                step={5}
                
              />
              
              <EditableNumberField
                label="Recovery Costs (%)"
                value={product.recoveryCosts}
                onChange={(value) => handleChange('recoveryCosts', value)}
                editMode={editMode}
                min={0}
                max={50}
                step={1}
                
              />
              
              <EditableNumberField
                label="Collateral Haircut (%)"
                value={product.collateralHaircut}
                onChange={(value) => handleChange('collateralHaircut', value)}
                editMode={editMode}
                min={0}
                max={80}
                step={5}
                
              />
            </>
          )}
          
          {product.isUnsecured && (
            <EditableNumberField
              label="Unsecured LGD (%)"
              value={product.unsecuredLGD || 45}
              onChange={(value) => handleChange('unsecuredLGD', value)}
              editMode={editMode}
              min={0}
              max={100}
              step={5}
              
            />
          )}
        </CardContent>
      </Card>

      {/* State Guarantees Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">🛡️ Garanzie Pubbliche</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <EditableSelectField
            label="Garanzia Pubblica"
            value={product.stateGuaranteeType || 'none'}
            onChange={(value) => handleChange('stateGuaranteeType', value)}
            editMode={editMode}
            options={[
              { value: 'none', label: 'Non presente' },
              { value: 'present', label: 'Presente' }
            ]}
            
          />
          
          {product.stateGuaranteeType && product.stateGuaranteeType !== 'none' && (
            <>
              <EditableNumberField
                label="Copertura Garanzia (%)"
                value={product.stateGuaranteeCoverage || 0}
                onChange={(value) => handleChange('stateGuaranteeCoverage', value)}
                editMode={editMode}
                min={0}
                max={100}
                step={5}
                
              />
              
              <EditableNumberField
                label="Tempo Recupero Garanzia (trimestri)"
                value={product.stateGuaranteeRecoveryTime || 2}
                onChange={(value) => handleChange('stateGuaranteeRecoveryTime', value)}
                editMode={editMode}
                min={1}
                max={8}
                step={1}
                
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Structure Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">🏗️ Struttura</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <EditableNumberField
            label="Durata (trimestri)"
            value={product.durata}
            onChange={(value) => handleChange('durata', value)}
            editMode={editMode}
            min={1}
            max={120}
            step={1}
            
            error={isDefaultAfterMaturity}
          />
          
          <EditableSelectField
            label="Tipo Rimborso"
            value={product.type}
            onChange={(value) => handleChange('type', value)}
            editMode={editMode}
            options={[
              { value: 'french', label: 'Francese (rate costanti)' },
              { value: 'bullet', label: 'Bullet (capitale a scadenza)' }
            ]}
            
          />
          
          {product.type !== 'bullet' && (
            <EditableNumberField
              label="Grace Period (trimestri)"
              value={product.gracePeriod}
              onChange={(value) => handleChange('gracePeriod', value)}
              editMode={editMode}
              min={0}
              max={20}
              step={1}
              
            />
          )}
          
          <EditableNumberField
            label="Avg Loan Size (€M)"
            value={product.avgLoanSize}
            onChange={(value) => handleChange('avgLoanSize', value)}
            editMode={editMode}
            min={0.01}
            max={100}
            step={0.1}
            
          />
          
          {product.equityUpside !== undefined && (
            <EditableNumberField
              label="Equity Upside (%)"
              value={product.equityUpside}
              onChange={(value) => handleChange('equityUpside', value)}
              editMode={editMode}
              min={0}
              max={20}
              step={0.5}
              
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default CreditProductAssumptions;