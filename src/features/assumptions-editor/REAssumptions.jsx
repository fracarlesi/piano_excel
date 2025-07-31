import React from 'react';
import DivisionAssumptions from './DivisionAssumptions';

const REAssumptions = ({ assumptions, onAssumptionChange }) => {
  return (
    <DivisionAssumptions
      divisionKey="re"
      divisionName="Real Estate Financing"
      divisionIcon="🏢"
      assumptions={assumptions}
      onAssumptionChange={onAssumptionChange}
    />
  );
};

export default REAssumptions;