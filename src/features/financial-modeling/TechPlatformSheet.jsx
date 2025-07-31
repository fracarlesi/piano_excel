import React from 'react';
import StandardDivisionSheet from '../common/StandardDivisionSheet';

const TechPlatformSheet = ({ assumptions, results }) => {
  
  const customOverview = [
    { 
      label: 'Division Focus', 
      value: 'Sviluppo e gestione della piattaforma tecnologica bancaria'
    },
    { 
      label: 'Target Market', 
      value: 'Servizi tecnologici interni e soluzioni digitali per clienti'
    },
    { 
      label: 'Key Products', 
      value: 'Core banking platform, API services, mobile applications'
    },
    { 
      label: 'Competitive Advantage', 
      value: 'Tecnologia proprietaria e scalabilità dei servizi digitali'
    },
    { 
      label: 'Revenue Model', 
      value: 'Service fees, licensing, and technology consulting'
    }
  ];

  return (
    <StandardDivisionSheet
      assumptions={assumptions}
      results={results}
      divisionKey="tech"
      divisionDisplayName="🔧 Piattaforma Tecnologica"
      divisionDescription="Divisione focalizzata sullo sviluppo e gestione dell'infrastruttura tecnologica bancaria, inclusi servizi core banking, API e soluzioni mobile"
      divisionIcon="🔧"
      customOverview={customOverview}
      showProductDetail={true}
      customTransformations={{
        pnl: {
          'Commission Income': {
            label: 'Technology Service Revenue'
          }
        },
        kpis: {
          'Cost-to-Income Ratio %': {
            label: 'Tech Efficiency Ratio %'
          }
        }
      }}
    />
  );
};

export default TechPlatformSheet;