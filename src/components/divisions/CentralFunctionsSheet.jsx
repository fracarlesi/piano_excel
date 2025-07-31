import React from 'react';
import StandardDivisionSheet from '../common/StandardDivisionSheet';

/**
 * Central Functions Division Sheet
 * Shows only costs (no revenues) for central administrative functions
 * Uses standard 4-tab structure for consistency
 */
const CentralFunctionsSheet = ({ divisionResults, assumptions, globalResults }) => {
  // Central Functions is a pure cost center with no products
  const productResults = {};
  
  return (
    <StandardDivisionSheet
      divisionName="Central Functions"
      divisionEmoji="🏛️"
      divisionResults={divisionResults}
      productResults={productResults}
      assumptions={assumptions}
      globalResults={globalResults}
    />
  );
};

export default CentralFunctionsSheet;