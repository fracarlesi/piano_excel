import React from 'react';
import StandardDivisionSheet from '../common/StandardDivisionSheet';

const WealthManagementSheet = ({ assumptions, results }) => {
  
  const customOverview = [
    { 
      label: 'Division Focus', 
      value: 'Private banking and wealth management services'
    },
    { 
      label: 'Target Market', 
      value: 'High net worth individuals and affluent clients'
    },
    { 
      label: 'Key Products', 
      value: 'Investment advisory, portfolio management, trust services'
    },
    { 
      label: 'Competitive Advantage', 
      value: 'Personalized service, investment expertise, global reach'
    },
    { 
      label: 'Revenue Model', 
      value: 'Asset management fees and advisory commissions'
    }
  ];

  return (
    <StandardDivisionSheet
      assumptions={assumptions}
      results={results}
      divisionKey="wealth"
      divisionDisplayName="💎 Wealth Management"
      divisionDescription="Private banking and wealth management services for high net worth individuals. Focus on asset management fees and advisory services with low capital requirements."
      divisionIcon="💎"
      customOverview={customOverview}
      showProductDetail={true}
      customTransformations={{
        pnl: {
          'Commission Income': {
            label: 'Management Fees'
          },
          'Interest Income': {
            label: 'Investment Income'
          }
        }
      }}
    />
  );
};

export default WealthManagementSheet;