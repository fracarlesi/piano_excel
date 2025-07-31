import React from 'react';
import DivisionAssumptions from './DivisionAssumptions';

const DigitalAssumptions = ({ assumptions, onAssumptionChange }) => {
  return (
    <DivisionAssumptions
      divisionKey="digital"
      divisionName="Digital Banking"
      divisionIcon="📱"
      assumptions={assumptions}
      onAssumptionChange={onAssumptionChange}
    />
  );
};

export default DigitalAssumptions;