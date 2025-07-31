import React from 'react';
import StandardDivisionSheet from '../common/StandardDivisionSheet';

/**
 * Treasury / ALM Division Sheet
 * Shows treasury operations, liquidity management, and funding activities
 * Uses standard 4-tab structure for consistency
 */
const TreasurySheet = ({ divisionResults, assumptions, globalResults, productResults }) => {
  return (
    <StandardDivisionSheet
      assumptions={assumptions}
      results={globalResults}
      divisionKey="treasury"
      divisionDisplayName="Treasury / ALM"
      divisionDescription="Asset Liability Management, liquidity buffer, and funding operations"
      divisionIcon="💰"
      showProductDetail={false}
    />
  );
};

export default TreasurySheet;