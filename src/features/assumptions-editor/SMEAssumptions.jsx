import React from 'react';
import DivisionAssumptions from './DivisionAssumptions';

const SMEAssumptions = ({ assumptions, onAssumptionChange }) => {
  return (
    <DivisionAssumptions
      divisionKey="sme"
      divisionName="PMI in Difficoltà"
      divisionIcon="🏭"
      assumptions={assumptions}
      onAssumptionChange={onAssumptionChange}
    />
  );
};

export default SMEAssumptions;