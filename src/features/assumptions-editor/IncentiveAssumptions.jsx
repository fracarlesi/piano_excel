import React from 'react';
import DivisionAssumptions from './DivisionAssumptions';

const IncentiveAssumptions = ({ assumptions, onAssumptionChange }) => {
  return (
    <DivisionAssumptions
      divisionKey="incentive"
      divisionName="Finanza Agevolata"
      divisionIcon="🌱"
      assumptions={assumptions}
      onAssumptionChange={onAssumptionChange}
    />
  );
};

export default IncentiveAssumptions;