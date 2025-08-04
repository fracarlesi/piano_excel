import React from 'react';
import StandardDivisionSheet from './components/StandardDivisionSheet';

const DigitalBankingSheet = ({ assumptions, results }) => {
  
  const customOverview = [
    { 
      label: 'Division Focus', 
      value: 'Digital financial services and online banking platform'
    },
    { 
      label: 'Target Market', 
      value: 'Digital-native customers and small businesses'
    },
    { 
      label: 'Key Products', 
      value: 'Online accounts, digital payments, mobile lending'
    },
    { 
      label: 'Competitive Advantage', 
      value: 'Low-cost structure, scalable technology, user experience'
    },
    { 
      label: 'Business Model', 
      value: 'Fee-based services with low capital intensity'
    }
  ];

  return (
    <StandardDivisionSheet
      assumptions={assumptions}
      results={results}
      divisionKey="digital"
      divisionDisplayName="📱 Digital Banking Division"
      divisionDescription="Digital financial services focusing on online banking, mobile payments, and automated lending solutions. Low-cost structure with scalable technology platform."
      divisionIcon="📱"
      customOverview={customOverview}
      showProductDetail={true}
    />
  );
};

export default DigitalBankingSheet;