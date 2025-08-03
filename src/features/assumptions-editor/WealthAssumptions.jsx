import React from 'react';
import WealthAssumptionsStatic from './WealthAssumptionsStatic';

const WealthAssumptions = ({ assumptions, onAssumptionChange }) => {
  return (
    <WealthAssumptionsStatic
      assumptions={assumptions}
      onAssumptionChange={onAssumptionChange}
    />
  );
};

export default WealthAssumptions;