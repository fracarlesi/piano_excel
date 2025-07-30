import React from 'react';
import DivisionAssumptions from './DivisionAssumptions';

const WealthAssumptions = ({ assumptions, onAssumptionChange }) => {
  return (
    <DivisionAssumptions
      divisionKey="wealth"
      divisionName="Wealth Management"
      divisionIcon="💎"
      assumptions={assumptions}
      onAssumptionChange={onAssumptionChange}
    />
  );
};

export default WealthAssumptions;