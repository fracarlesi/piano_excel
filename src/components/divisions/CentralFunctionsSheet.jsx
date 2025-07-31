import React from 'react';
import StandardDivisionSheet from '../common/StandardDivisionSheet';

/**
 * Central Functions Division Sheet
 * Shows only costs (no revenues) for central administrative functions
 * Uses standard 4-tab structure for consistency
 */
const CentralFunctionsSheet = ({ divisionResults, assumptions, globalResults }) => {
  return (
    <StandardDivisionSheet
      assumptions={assumptions}
      results={globalResults}
      divisionKey="central"
      divisionDisplayName="Central Functions"
      divisionDescription="Non-allocated central costs including board, compliance, risk management, and corporate functions"
      divisionIcon="🏛️"
      showProductDetail={false}
    />
  );
};

export default CentralFunctionsSheet;