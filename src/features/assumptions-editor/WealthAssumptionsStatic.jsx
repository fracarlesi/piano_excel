import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card/Card';
import WealthCrossSellAssumptions from './WealthCrossSellAssumptions';
import StaffingTable from './StaffingTable';

const WealthAssumptionsStatic = ({ assumptions, onAssumptionChange }) => {
  const [activeTab, setActiveTab] = useState('realEstate');
  const [isPersonnelExpanded, setIsPersonnelExpanded] = useState(false);
  
  // I tre prodotti Wealth predefiniti
  const wealthProducts = {
    realEstate: assumptions.products?.wealthRealEstate || assumptions.wealthRealEstate,
    sme: assumptions.products?.wealthSME || assumptions.wealthSME,
    incentives: assumptions.products?.wealthIncentives || assumptions.wealthIncentives
  };
  
  // Debug per capire cosa sta succedendo
  console.log('Wealth Debug:', {
    hasRealEstate: !!wealthProducts.realEstate,
    hasSME: !!wealthProducts.sme,
    hasIncentives: !!wealthProducts.incentives,
    productsKeys: Object.keys(assumptions.products || {}),
    wealthProductsData: wealthProducts
  });
  
  // Handle product updates
  const handleProductUpdate = (productKey, updatedProduct) => {
    onAssumptionChange(`products.${productKey}`, updatedProduct);
  };
  
  // Tab configuration
  const tabs = [
    { 
      id: 'realEstate', 
      label: 'Real Estate', 
      icon: '🏢',
      description: 'Investimenti in cartolarizzazioni immobiliari'
    },
    { 
      id: 'sme', 
      label: 'SME Restructuring', 
      icon: '🏭',
      description: 'Operazioni di turnaround aziendale'
    },
    { 
      id: 'incentives', 
      label: 'Tech & Innovation', 
      icon: '🚀',
      description: 'Investimenti in aziende tecnologiche'
    }
  ];
  
  const getProductKey = (tabId) => {
    switch(tabId) {
      case 'realEstate': return 'wealthRealEstate';
      case 'sme': return 'wealthSME';
      case 'incentives': return 'wealthIncentives';
      default: return 'wealthRealEstate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Division Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg border border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              💎 Wealth Management & Asset Management
            </h2>
            <p className="text-gray-600 mt-2">
              Gestione prodotti di investimento captive per clienti High Net Worth
            </p>
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Prodotti di Investimento Captive</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 font-medium text-sm border-b-2 transition-colors
                  ${activeTab === tab.id 
                    ? 'border-yellow-500 text-yellow-700 bg-yellow-50' 
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
          
          {/* Tab Description */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              {tabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>
          
          {/* Active Product Editor */}
          <div>
            {wealthProducts[activeTab] ? (
              <WealthCrossSellAssumptions
                product={wealthProducts[activeTab]}
                onUpdate={(updatedProduct) => handleProductUpdate(getProductKey(activeTab), updatedProduct)}
              />
            ) : (
              <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-800 font-medium mb-2">
                  ⚠️ Prodotto non configurato
                </p>
                <p className="text-sm text-yellow-600">
                  Il prodotto {activeTab === 'realEstate' ? 'Real Estate' : activeTab === 'sme' ? 'SME' : 'Tech & Innovation'} non è ancora presente nel database.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Questo può accadere se stai usando una versione precedente del database. 
                  Prova a ricaricare la pagina o contatta il supporto.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personnel Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>👥</span>
              <span>Personale e Costi HR</span>
            </CardTitle>
            <button
              onClick={() => setIsPersonnelExpanded(!isPersonnelExpanded)}
              className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <span>{isPersonnelExpanded ? '−' : '+'}</span>
              <span>{isPersonnelExpanded ? 'Chiudi' : 'Espandi'}</span>
            </button>
          </div>
        </CardHeader>
        {isPersonnelExpanded && (
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Pianifica l'organico della divisione Wealth Management per i prossimi 10 anni.
              </p>
            </div>
            
            <StaffingTable
              divisionKey="wealthDivision"
              divisionName="Wealth Management"
              assumptions={assumptions}
              onAssumptionChange={onAssumptionChange}
            />
          </CardContent>
        )}
      </Card>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-amber-600 mt-0.5">ℹ️</span>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Modello Captive Deal</p>
            <p>
              La divisione Wealth gestisce tre linee di prodotto specializzate che investono in deal originati 
              dalle altre divisioni della banca. I clienti provengono esclusivamente dal Digital Banking tramite 
              referral, con fee differenziate per tipologia di investimento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WealthAssumptionsStatic;