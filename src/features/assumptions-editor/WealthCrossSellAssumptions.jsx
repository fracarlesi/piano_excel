import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card/Card';
import { EditableNumberField } from '../../components/ui/inputs';

/**
 * Componente per gestire gli assumptions di cross-selling della divisione Wealth
 * Wealth non crea prodotti propri ma vende ai clienti Digital i prodotti delle altre divisioni
 */
const WealthCrossSellAssumptions = ({ product, onUpdate }) => {
  const handleFieldChange = (path, value) => {
    const keys = path.split('.');
    const updatedProduct = JSON.parse(JSON.stringify(product));
    
    let current = updatedProduct;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onUpdate(updatedProduct);
  };
  
  // Determina la divisione di origine del prodotto
  const getSourceDivision = () => {
    if (product.name?.includes('Real Estate')) return 'realEstate';
    if (product.name?.includes('SME') || product.name?.includes('Restructuring')) return 'sme';
    if (product.name?.includes('Tech') || product.name?.includes('Innovation')) return 'incentives';
    return 'generic';
  };
  
  const sourceDivision = getSourceDivision();
  
  // Stili per divisione di origine
  const getDivisionStyle = () => {
    switch (sourceDivision) {
      case 'realEstate':
        return { 
          icon: '🏢', 
          color: 'blue', 
          bgColor: 'bg-blue-50', 
          borderColor: 'border-blue-200',
          description: 'Prodotti di cartolarizzazione immobiliare originati dalla divisione Real Estate'
        };
      case 'sme':
        return { 
          icon: '🏭', 
          color: 'green', 
          bgColor: 'bg-green-50', 
          borderColor: 'border-green-200',
          description: 'Operazioni di restructuring e turnaround originate dalla divisione SME'
        };
      case 'incentives':
        return { 
          icon: '🚀', 
          color: 'purple', 
          bgColor: 'bg-purple-50', 
          borderColor: 'border-purple-200',
          description: 'Investimenti in tecnologia e innovazione originati dalla divisione Incentives'
        };
      default:
        return { 
          icon: '💎', 
          color: 'gray', 
          bgColor: 'bg-gray-50', 
          borderColor: 'border-gray-200',
          description: 'Prodotto generico di wealth management'
        };
    }
  };
  
  const style = getDivisionStyle();

  return (
    <div className="space-y-6">
      <Card className={`${style.borderColor} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">{style.icon}</span>
            <span>{product.name}</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">{style.description}</p>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Sezione 1: Parametri di Acquisizione Clienti da Digital Banking */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Parametri di Acquisizione Clienti
            </h3>
            
            <Card className={`${style.bgColor} ${style.borderColor} border`}>
              <CardContent className="pt-6">
                <div className="mb-4 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Come funziona:</strong> I clienti Wealth provengono esclusivamente dal Digital Banking
                  </p>
                  <p className="text-xs text-gray-600">
                    La divisione Wealth identifica e converte i clienti Digital con patrimoni elevati, 
                    proponendo loro prodotti di investimento originati dalle altre divisioni della banca.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableNumberField
                    label="Adoption Rate (%)"
                    value={product.digitalReferral?.adoptionRate || 5}
                    onChange={(val) => handleFieldChange('digitalReferral.adoptionRate', val)}
                    unit="%"
                    min={0}
                    max={100}
                    tooltip={
                      sourceDivision === 'realEstate' 
                        ? "% di clienti Digital interessati a investimenti immobiliari strutturati" 
                        : sourceDivision === 'sme' 
                        ? "% di clienti Digital con appetito per investimenti in turnaround aziendali" 
                        : sourceDivision === 'incentives'
                        ? "% di clienti Digital interessati a investire in innovazione e tecnologia"
                        : "% di clienti Digital che adottano servizi Wealth"
                    }
                  />
                  
                  <EditableNumberField
                    label="Referral Fee per Cliente (€)"
                    value={product.digitalReferral?.referralFee || 150}
                    onChange={(val) => handleFieldChange('digitalReferral.referralFee', val)}
                    unit="€"
                    min={0}
                    step={50}
                    tooltip="Commissione pagata dalla divisione di origine per ogni nuovo cliente acquisito"
                  />
                </div>
                
                <div className={`mt-4 p-3 ${style.bgColor} rounded`}>
                  <p className={`text-xs text-${style.color}-700`}>
                    💡 La referral fee viene pagata solo per nuovi clienti che completano l'investimento
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sezione 2: Commissioni di Intermediazione */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">💰</span>
              Commissioni di Intermediazione
            </h3>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Commissioni che Wealth riceve per intermediare i prodotti delle altre divisioni
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableNumberField
                    label="Commissione di Distribuzione (%)"
                    value={product.crossSellCommissions?.distributionFee || 1.5}
                    onChange={(val) => handleFieldChange('crossSellCommissions.distributionFee', val)}
                    unit="%"
                    min={0}
                    max={5}
                    isPercentage
                    tooltip="% sul capitale investito che Wealth riceve dalla divisione di origine"
                  />
                  
                  <EditableNumberField
                    label="Commissione Annuale di Gestione (%)"
                    value={product.crossSellCommissions?.annualManagementFee || 0.5}
                    onChange={(val) => handleFieldChange('crossSellCommissions.annualManagementFee', val)}
                    unit="%"
                    min={0}
                    max={2}
                    isPercentage
                    tooltip="% annuale sul capitale gestito pagata dalla divisione di origine"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sezione 3: Servizi di Consulenza */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🎓</span>
              Servizi di Consulenza Wealth
            </h3>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Servizi aggiuntivi forniti dalla divisione Wealth ai clienti
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableNumberField
                    label="Fee di Consulenza Iniziale (€)"
                    value={product.wealthServices?.consultationFee || 2500}
                    onChange={(val) => handleFieldChange('wealthServices.consultationFee', val)}
                    unit="€"
                    min={0}
                    step={500}
                    tooltip="Fee per analisi patrimoniale e pianificazione investimenti"
                  />
                  
                  <EditableNumberField
                    label="Fee Annuale Advisory (%)"
                    value={product.wealthServices?.annualAdvisoryFee || 0.3}
                    onChange={(val) => handleFieldChange('wealthServices.annualAdvisoryFee', val)}
                    unit="%"
                    min={0}
                    max={1}
                    isPercentage
                    tooltip="% annuale per servizi continuativi di advisory"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sezione 4: Parametri di Cross-Selling */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🔄</span>
              Parametri di Cross-Selling
            </h3>
            
            <Card className={`${style.bgColor} ${style.borderColor} border`}>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Timing e volumi di conversione dei clienti Digital in investitori
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableNumberField
                    label="Ticket Medio di Investimento (€)"
                    value={product.crossSelling?.avgTicketSize || 
                      (sourceDivision === 'realEstate' ? 250000 : 
                       sourceDivision === 'sme' ? 200000 : 
                       sourceDivision === 'incentives' ? 100000 : 150000)}
                    onChange={(val) => handleFieldChange('crossSelling.avgTicketSize', val)}
                    unit="€"
                    min={0}
                    step={10000}
                    tooltip="Importo medio investito per cliente in prodotti della divisione di origine"
                  />
                  
                  <EditableNumberField
                    label="Tempo Medio di Conversione (mesi)"
                    value={product.crossSelling?.avgConversionTime || 6}
                    onChange={(val) => handleFieldChange('crossSelling.avgConversionTime', val)}
                    unit="mesi"
                    min={1}
                    max={24}
                    tooltip="Tempo medio dalla prima consulenza all'investimento effettivo"
                  />
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Distribuzione temporale degli investimenti
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <EditableNumberField
                      label="% che investe nel 1° anno"
                      value={product.crossSelling?.investmentTiming?.year1 || 30}
                      onChange={(val) => handleFieldChange('crossSelling.investmentTiming.year1', val)}
                      unit="%"
                      min={0}
                      max={100}
                      isPercentage
                      tooltip="% di clienti che investe entro il primo anno"
                    />
                    <EditableNumberField
                      label="% che investe nel 2° anno"
                      value={product.crossSelling?.investmentTiming?.year2 || 50}
                      onChange={(val) => handleFieldChange('crossSelling.investmentTiming.year2', val)}
                      unit="%"
                      min={0}
                      max={100}
                      isPercentage
                      tooltip="% di clienti che investe nel secondo anno"
                    />
                    <EditableNumberField
                      label="% che investe dopo"
                      value={product.crossSelling?.investmentTiming?.year3Plus || 20}
                      onChange={(val) => handleFieldChange('crossSelling.investmentTiming.year3Plus', val)}
                      unit="%"
                      min={0}
                      max={100}
                      isPercentage
                      tooltip="% di clienti che investe dal terzo anno in poi"
                    />
                  </div>
                  
                  <div className={`mt-4 p-3 ${style.bgColor} rounded`}>
                    <p className={`text-xs text-${style.color}-700`}>
                      ⚠️ La somma delle percentuali dovrebbe essere 100%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sezione 5: Performance Attese */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Performance Attese e Success Fee
            </h3>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Parametri di performance e commissioni di successo
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableNumberField
                    label="Success Fee su Performance (%)"
                    value={product.performance?.successFee || 
                      (sourceDivision === 'sme' ? 20 : 15)}
                    onChange={(val) => handleFieldChange('performance.successFee', val)}
                    unit="%"
                    min={0}
                    max={30}
                    isPercentage
                    tooltip="% della performance sopra il target che Wealth trattiene"
                  />
                  
                  <EditableNumberField
                    label="Target di Performance Annuale (%)"
                    value={product.performance?.targetReturn || 
                      (sourceDivision === 'realEstate' ? 8 : 
                       sourceDivision === 'sme' ? 12 : 
                       sourceDivision === 'incentives' ? 15 : 10)}
                    onChange={(val) => handleFieldChange('performance.targetReturn', val)}
                    unit="%"
                    min={0}
                    max={25}
                    isPercentage
                    tooltip="Rendimento target annuale per il calcolo della success fee"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default WealthCrossSellAssumptions;