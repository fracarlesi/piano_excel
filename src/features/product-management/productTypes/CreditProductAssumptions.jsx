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

  return (
    <>
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
            tooltip="Spread sopra EURIBOR per prestiti a tasso variabile o tasso fisso totale"
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
            tooltip="Tasso variabile legato a EURIBOR o tasso fisso"
          />
          
          <EditableNumberField
            label="Commissione (%)"
            value={product.commissionRate}
            onChange={(value) => handleChange('commissionRate', value)}
            editMode={editMode}
            min={0}
            max={10}
            step={0.1}
            tooltip="Commissione upfront sui nuovi prestiti"
          />
          
          <EditableNumberField
            label="FTP Rate (%)"
            value={product.ftpRate || 1.5}
            onChange={(value) => handleChange('ftpRate', value)}
            editMode={editMode}
            min={0}
            max={10}
            step={0.1}
            tooltip="Funds Transfer Pricing - Tasso interno di trasferimento fondi per questo prodotto"
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
            tooltip="Percentuale di default applicata una sola volta per ogni vintage di erogazione"
          />
          
          <EditableNumberField
            label="Default dopo (trimestri)"
            value={product.defaultAfterQuarters || 8}
            onChange={(value) => handleChange('defaultAfterQuarters', value)}
            editMode={editMode}
            min={1}
            max={40}
            step={1}
            tooltip="Numero di trimestri dopo l'erogazione quando si verifica il default"
          />
          
          <EditableNumberField
            label="RWA Density (%)"
            value={product.rwaDensity}
            onChange={(value) => handleChange('rwaDensity', value)}
            editMode={editMode}
            min={0}
            max={150}
            step={5}
            tooltip="Risk Weighted Assets come % del valore nominale"
          />
          
          <EditableNumberField
            label="Tempo di Recupero (trimestri)"
            value={product.timeToRecover || 12}
            onChange={(value) => handleChange('timeToRecover', value)}
            editMode={editMode}
            min={1}
            max={40}
            step={1}
            tooltip="Trimestri necessari per completare il processo di recupero del credito NPL. Questo valore è cruciale per l'attualizzazione dei flussi di cassa."
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
            tooltip="Prestito garantito o non garantito"
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
                tooltip="Loan to Value - rapporto prestito/valore garanzia"
              />
              
              <EditableNumberField
                label="Recovery Costs (%)"
                value={product.recoveryCosts}
                onChange={(value) => handleChange('recoveryCosts', value)}
                editMode={editMode}
                min={0}
                max={50}
                step={1}
                tooltip="Costi di recupero come % del valore del credito"
              />
              
              <EditableNumberField
                label="Collateral Haircut (%)"
                value={product.collateralHaircut}
                onChange={(value) => handleChange('collateralHaircut', value)}
                editMode={editMode}
                min={0}
                max={80}
                step={5}
                tooltip="Sconto sul valore della garanzia per calcolo LGD"
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
              tooltip="Loss Given Default per prestiti non garantiti"
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
            tooltip="Presenza di garanzia pubblica sul credito"
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
                tooltip="Percentuale del credito coperta dalla garanzia pubblica (tipicamente 80-90%)"
              />
              
              <EditableNumberField
                label="Tempo Recupero Garanzia (trimestri)"
                value={product.stateGuaranteeRecoveryTime || 2}
                onChange={(value) => handleChange('stateGuaranteeRecoveryTime', value)}
                editMode={editMode}
                min={1}
                max={8}
                step={1}
                tooltip="Tempo medio per l'escussione della garanzia pubblica in trimestri (tipicamente 2-4 trimestri)"
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
            tooltip="Durata del prestito in trimestri"
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
            tooltip="Modalità di rimborso del prestito"
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
              tooltip="Periodo di pre-ammortamento in trimestri (solo interessi)"
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
            tooltip="Dimensione media del prestito in milioni di euro"
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
              tooltip="Partecipazione agli utili/equity kicker"
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default CreditProductAssumptions;