import React from 'react';
import DivisionAssumptions from './DivisionAssumptions';

const SubsidizedAssumptions = ({ assumptions, onAssumptionChange }) => {
  return (
    <DivisionAssumptions
      divisionKey="subsidized"
      divisionName="Finanza Agevolata"
      divisionIcon="🌱"
      assumptions={assumptions}
      onAssumptionChange={onAssumptionChange}
    />
  );
};

export default SubsidizedAssumptions;