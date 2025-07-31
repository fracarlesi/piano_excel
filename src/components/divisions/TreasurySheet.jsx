import React from 'react';
import StandardDivisionSheet from '../common/StandardDivisionSheet';

/**
 * Treasury / ALM Division Sheet
 * Shows treasury operations, liquidity management, and funding activities
 * Uses standard 4-tab structure for consistency
 */
const TreasurySheet = ({ divisionResults, assumptions, globalResults, productResults }) => {
  // Treasury has no products, it's a structural division
  const treasuryProductResults = {};
  
  return (
    <StandardDivisionSheet
      divisionName="Treasury / ALM"
      divisionEmoji="💰"
      divisionResults={divisionResults}
      productResults={treasuryProductResults}
      assumptions={assumptions}
      globalResults={globalResults}
    />
  );
};

export default TreasurySheet;