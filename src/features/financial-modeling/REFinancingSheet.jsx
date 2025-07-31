import React from 'react';
import StandardDivisionSheet from '../../components/StandardDivisionSheet';

const REFinancingSheet = ({ assumptions, results }) => {
  
  const customOverview = [
    { 
      label: 'Division Focus', 
      value: 'Traditional real estate financing with secured collateral'
    },
    { 
      label: 'Target Market', 
      value: 'Residential and commercial property loans'
    },
    { 
      label: 'Key Products', 
      value: 'First mortgages, refinancing, commercial real estate'
    },
    { 
      label: 'Competitive Advantage', 
      value: 'Public guarantees available, secured lending expertise'
    },
    { 
      label: 'Risk Profile', 
      value: 'Higher margins compensate for elevated RWA and credit risk'
    }
  ];

  return (
    <StandardDivisionSheet
      assumptions={assumptions}
      results={results}
      divisionKey="re"
      divisionDisplayName="🏢 Real Estate Financing - Core Business"
      divisionDescription="Traditional real estate financing with secured collateral. Focus on residential and commercial property loans with public guarantees available. Higher margins compensate for elevated RWA and credit risk exposure."
      divisionIcon="🏢"
      customOverview={customOverview}
      showProductDetail={true}
    />
  );
};

export default REFinancingSheet;