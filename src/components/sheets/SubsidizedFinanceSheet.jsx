import React from 'react';
import StandardDivisionSheet from '../common/StandardDivisionSheet';

const SubsidizedFinanceSheet = ({ assumptions, results }) => {
  
  const customOverview = [
    { 
      label: 'Division Focus', 
      value: 'Government-backed and subsidized lending programs'
    },
    { 
      label: 'Target Market', 
      value: 'Strategic sectors eligible for public support'
    },
    { 
      label: 'Key Products', 
      value: 'Green loans, innovation financing, social impact lending'
    },
    { 
      label: 'Competitive Advantage', 
      value: 'Government guarantees, reduced RWA, social impact'
    },
    { 
      label: 'Risk Profile', 
      value: 'Low risk due to public guarantees and support'
    }
  ];

  return (
    <StandardDivisionSheet
      assumptions={assumptions}
      results={results}
      divisionKey="subsidized"
      divisionDisplayName="🌱 Finanza Agevolata"
      divisionDescription="Government-backed lending programs focusing on strategic sectors with public support. Low risk profile due to government guarantees and reduced capital requirements."
      divisionIcon="🌱"
      customOverview={customOverview}
      showProductDetail={true}
      customTransformations={{
        pnl: {
          'Commission Income': {
            label: 'Subsidy Processing Fees'
          }
        }
      }}
    />
  );
};

export default SubsidizedFinanceSheet;