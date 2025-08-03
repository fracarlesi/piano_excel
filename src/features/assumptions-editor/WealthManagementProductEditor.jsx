import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card/Card';
import { EditableNumberField } from '../../components/ui/inputs';

const WealthManagementProductEditor = ({ product, onUpdate }) => {
  const handleFieldChange = (path, value) => {
    const keys = path.split('.');
    const updatedProduct = JSON.parse(JSON.stringify(product));
    
    let current = updatedProduct;
    for (let i = 0; i < keys.length - 1; i++) {
      // Create the nested object if it doesn't exist
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onUpdate(updatedProduct);
  };
  
  // Determina il tipo di prodotto Wealth
  const getProductType = () => {
    if (product.name?.includes('Real Estate')) return 'realEstate';
    if (product.name?.includes('SME') || product.name?.includes('Restructuring')) return 'sme';
    if (product.name?.includes('Tech') || product.name?.includes('Innovation')) return 'tech';
    return 'generic';
  };
  
  const productType = getProductType();
  
  // Icone e colori per tipo di prodotto
  const getProductStyle = () => {
    switch (productType) {
      case 'realEstate':
        return { icon: '🏢', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      case 'sme':
        return { icon: '🏭', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'tech':
        return { icon: '🚀', color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' };
      default:
        return { icon: '💎', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };
  
  const style = getProductStyle();

  return (
    <div className="space-y-6">
      <Card className={`${style.borderColor} border-2`}>
        <CardHeader>
          <CardTitle>{style.icon} {product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Digital Banking Referral Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Acquisizione Clienti</h3>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">🎯 Referral da Digital Banking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${style.bgColor} p-3 rounded mb-4`}>
                  <p className={`text-sm text-${style.color}-800`}>
                    ℹ️ I clienti Wealth provengono dal Digital Banking tramite referral
                    {productType === 'realEstate' && ' - Focus su investitori interessati al real estate'}
                    {productType === 'sme' && ' - Focus su investitori con propensione al rischio'}
                    {productType === 'tech' && ' - Focus su investitori tech-oriented'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableNumberField
                    label="Adoption Rate (%)"
                    value={product.digitalReferral?.adoptionRate || 5}
                    onChange={(val) => handleFieldChange('digitalReferral.adoptionRate', val)}
                    unit="%"
                    min={0}
                    max={100}
                    tooltip={productType === 'realEstate' ? "Percentuale di clienti Digital interessati a investimenti immobiliari" : productType === 'sme' ? "Percentuale di clienti Digital con alta propensione al rischio" : productType === 'tech' ? "Percentuale di clienti Digital interessati a innovazione e tecnologia" : "Percentuale di clienti Digital che utilizzano servizi Wealth"}
                  />
                  <EditableNumberField
                    label="Referral Fee (€)"
                    value={product.digitalReferral?.referralFee || 150}
                    onChange={(val) => handleFieldChange('digitalReferral.referralFee', val)}
                    unit="€"
                    min={0}
                    step={50}
                    tooltip={`Commissione una tantum per ogni NUOVO cliente ${productType === 'realEstate' ? 'Real Estate' : productType === 'sme' ? 'SME Restructuring' : productType === 'tech' ? 'Tech & Innovation' : 'Wealth'}`}
                  />
                </div>
                <div className="bg-amber-50 p-3 rounded mt-4">
                  <p className="text-xs text-amber-800">
                    ⚠️ La referral fee viene pagata solo per i nuovi clienti che attivano il servizio, non per quelli esistenti
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Client Summary Grid */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">📊 Riepilogo Clienti Wealth Management (10 anni)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Clienti che utilizzano servizi Wealth Management
                  </p>
                  <p className="text-xs text-gray-500">
                    Base clienti Digital Banking × Adoption Rate (%)
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    <strong>⚠️ Demo:</strong> I valori mostrati sono esempi - saranno calcolati dal motore finanziario
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-11 gap-2 text-xs font-medium text-gray-600">
                    <div></div>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                      <div key={year} className="text-center">Y{year}</div>
                    ))}
                  </div>
                  
                  {/* Clienti Totali */}
                  <div className="grid grid-cols-11 gap-2">
                    <div className="text-xs font-medium text-gray-700">Totali</div>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => {
                      // Calcolo simulato per demo - sarà sostituito dal motore
                      const digitalClients = 10000 * year; // Esempio crescita lineare
                      const totalWealthClients = Math.round(digitalClients * (product.digitalReferral?.adoptionRate || 5) / 100);
                      
                      return (
                        <div key={year} className="bg-white border border-gray-200 rounded p-2 text-center">
                          <p className="text-sm font-semibold">
                            {totalWealthClients.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Nuovi Clienti */}
                  <div className="grid grid-cols-11 gap-2">
                    <div className="text-xs font-medium text-green-700">Nuovi</div>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => {
                      const prevYearTotal = year === 1 ? 0 : Math.round((10000 * (year - 1)) * (product.digitalReferral?.adoptionRate || 5) / 100);
                      const currentYearTotal = Math.round((10000 * year) * (product.digitalReferral?.adoptionRate || 5) / 100);
                      const newClients = currentYearTotal - prevYearTotal;
                      
                      return (
                        <div key={year} className="bg-green-50 border border-green-200 rounded p-2 text-center">
                          <p className="text-sm text-green-700">
                            +{newClients.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sezione 1: Parametri di Ingaggio Cliente */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sezione 1: Parametri di Ingaggio Cliente
            </h3>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {productType === 'realEstate' && 'Definisci come i clienti accedono agli investimenti in cartolarizzazioni immobiliari'}
                  {productType === 'sme' && 'Definisci come i clienti partecipano a operazioni di restructuring aziendale'}
                  {productType === 'tech' && 'Definisci come i clienti investono in aziende tecnologiche e innovative'}
                  {productType === 'generic' && 'Definisci come e a quali condizioni i clienti entrano nel mondo Wealth'}
                </p>
                <EditableNumberField
                  label="Fee di Consulenza Iniziale"
                  value={product.clientEngagement?.consultationFee || 2500}
                  onChange={(val) => handleFieldChange('clientEngagement.consultationFee', val)}
                  unit="€"
                  min={0}
                  step={500}
                  tooltip={productType === 'realEstate' ? "Fee per analisi e pianificazione investimenti immobiliari" : productType === 'sme' ? "Fee per valutazione rischio e due diligence aziendale" : productType === 'tech' ? "Fee per analisi opportunità tech e portfolio design" : "L'importo fisso che addebiti a ogni nuovo cliente per la pianificazione patrimoniale"}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sezione 2: Parametri dell'Investimento */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sezione 2: Parametri dell'Investimento
            </h3>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {productType === 'realEstate' && 'Caratteristiche economiche degli investimenti in cartolarizzazioni immobiliari'}
                  {productType === 'sme' && 'Parametri economici delle operazioni di turnaround aziendale'}
                  {productType === 'tech' && 'Struttura economica degli investimenti in startup e scale-up tech'}
                  {productType === 'generic' && 'Definisci le caratteristiche economiche del deal che proponi'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableNumberField
                    label="Capitale Medio Investito per Cliente"
                    value={product.captiveInvestment?.avgInvestmentPerClient || 150000}
                    onChange={(val) => handleFieldChange('captiveInvestment.avgInvestmentPerClient', val)}
                    unit="€"
                    min={0}
                    step={10000}
                    tooltip={productType === 'realEstate' ? "Ticket medio per partecipazione a cartolarizzazioni" : productType === 'sme' ? "Capitale medio per operazioni di restructuring" : productType === 'tech' ? "Investimento medio in portafoglio tech" : "L'importo medio che ogni cliente investe nel deal"}
                  />
                  <EditableNumberField
                    label="Commissione di Strutturazione"
                    value={product.captiveInvestment?.structuringFee || 3.0}
                    onChange={(val) => handleFieldChange('captiveInvestment.structuringFee', val)}
                    unit="%"
                    min={0}
                    max={10}
                    isPercentage
                    tooltip={productType === 'realEstate' ? "Fee per strutturazione veicoli di cartolarizzazione" : productType === 'sme' ? "Commissione per strutturazione operazioni complesse" : productType === 'tech' ? "Fee per selezione e strutturazione portafoglio tech" : "La percentuale che la banca incassa subito sul capitale investito"}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sezione 3: Parametri di Performance e Ritorno */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sezione 3: Parametri di Performance e Ritorno
            </h3>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {productType === 'realEstate' && 'Ricavi ricorrenti e ciclo di investimento immobiliare'}
                  {productType === 'sme' && 'Performance fee e tempistiche di exit da turnaround'}
                  {productType === 'tech' && 'Management fee e ciclo di investimento in innovazione'}
                  {productType === 'generic' && 'Definisci i ricavi ricorrenti e la durata media degli investimenti'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableNumberField
                    label="Management Fee Annuale"
                    value={product.captiveInvestment?.managementFee || 2.0}
                    onChange={(val) => handleFieldChange('captiveInvestment.managementFee', val)}
                    unit="%"
                    min={0}
                    max={5}
                    isPercentage
                    tooltip={productType === 'realEstate' ? "Fee annuale per gestione asset immobiliari" : productType === 'sme' ? "Commissione per monitoraggio e gestione attiva turnaround" : productType === 'tech' ? "Fee per gestione dinamica portafoglio tech" : "Commissione annuale di gestione sul capitale investito (% su AUM)"}
                  />
                  <EditableNumberField
                    label="Durata Media del Deal"
                    value={product.captiveInvestment?.avgDealDuration || 4}
                    onChange={(val) => handleFieldChange('captiveInvestment.avgDealDuration', val)}
                    unit="anni"
                    min={1}
                    max={10}
                    step={0.5}
                    tooltip={productType === 'realEstate' ? "Durata media progetti di sviluppo immobiliare" : productType === 'sme' ? "Tempo medio per completare turnaround aziendale" : productType === 'tech' ? "Holding period medio investimenti tech" : "Il tempo medio di durata dell'investimento"}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sezione 4: Investment Timing (se presente nei dati) */}
          {product.captiveInvestment?.investmentTiming && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Sezione 4: Timing degli Investimenti
              </h3>
              <Card className={`${style.bgColor} ${style.borderColor} border`}>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Distribuzione temporale degli investimenti dei clienti
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EditableNumberField
                      label="% Clienti che investono nel 1° anno"
                      value={product.captiveInvestment?.investmentTiming?.percentageInvestingYear1 || 30}
                      onChange={(val) => handleFieldChange('captiveInvestment.investmentTiming.percentageInvestingYear1', val)}
                      unit="%"
                      min={0}
                      max={100}
                      isPercentage
                      tooltip="Percentuale di nuovi clienti che investe subito"
                    />
                    <EditableNumberField
                      label="% Clienti che investono nel 2° anno"
                      value={product.captiveInvestment?.investmentTiming?.percentageInvestingYear2 || 50}
                      onChange={(val) => handleFieldChange('captiveInvestment.investmentTiming.percentageInvestingYear2', val)}
                      unit="%"
                      min={0}
                      max={100}
                      isPercentage
                      tooltip="Percentuale che investe dopo un anno di relazione"
                    />
                    <EditableNumberField
                      label="% Clienti che investono dal 3° anno"
                      value={product.captiveInvestment?.investmentTiming?.percentageInvestingYear3Plus || 20}
                      onChange={(val) => handleFieldChange('captiveInvestment.investmentTiming.percentageInvestingYear3Plus', val)}
                      unit="%"
                      min={0}
                      max={100}
                      isPercentage
                      tooltip="Percentuale che investe dopo 2+ anni"
                    />
                    <EditableNumberField
                      label="N° medio di deal per cliente"
                      value={product.captiveInvestment?.investmentTiming?.avgDealsPerClient || 1.5}
                      onChange={(val) => handleFieldChange('captiveInvestment.investmentTiming.avgDealsPerClient', val)}
                      unit=""
                      min={1}
                      max={5}
                      step={0.1}
                      tooltip="Numero medio di investimenti per cliente nel periodo"
                    />
                  </div>
                  <div className={`mt-4 p-3 ${style.bgColor} rounded`}>
                    <p className={`text-xs text-${style.color}-700`}>
                      {productType === 'realEstate' && '⚠️ Gli investimenti immobiliari richiedono più tempo per due diligence e strutturazione'}
                      {productType === 'sme' && '⚠️ Le operazioni di turnaround sono time-sensitive e richiedono decisioni rapide'}
                      {productType === 'tech' && '⚠️ Gli investimenti tech hanno finestre di opportunità che richiedono timing preciso'}
                      {productType === 'generic' && '⚠️ La somma delle percentuali dovrebbe essere 100%'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default WealthManagementProductEditor;