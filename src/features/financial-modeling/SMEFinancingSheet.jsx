import React from 'react';
import StandardDivisionSheet from '../../components/StandardDivisionSheet';

const SMEFinancingSheet = ({ assumptions, results }) => {
  
  const customOverview = [
    { 
      label: 'Division Focus', 
      value: 'Small and Medium Enterprise financing with diverse products'
    },
    { 
      label: 'Target Market', 
      value: 'SMEs facing financial difficulties or restructuring needs'
    },
    { 
      label: 'Key Products', 
      value: 'Refinancing, bridge loans, special situations, restructuring'
    },
    { 
      label: 'Competitive Advantage', 
      value: 'Specialized underwriting expertise, flexible solutions'
    },
    { 
      label: 'Risk Profile', 
      value: 'Higher risk-return profile with specialized expertise'
    }
  ];

  return (
    <StandardDivisionSheet
      assumptions={assumptions}
      results={results}
      divisionKey="sme"
      divisionDisplayName="🏭 PMI in Difficoltà - Specialized Financing"
      divisionDescription="Small and Medium Enterprise financing with diverse products: refinancing, bridge loans, special situations, restructuring, and alternative finance. Higher risk-return profile with specialized underwriting expertise."
      divisionIcon="🏭"
      customOverview={customOverview}
      showProductDetail={true}
    />
  );
};

export default SMEFinancingSheet;