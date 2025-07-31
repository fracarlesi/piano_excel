import React from 'react';
import DivisionAssumptions from './DivisionAssumptions';

const TechAssumptions = ({ assumptions, onAssumptionChange }) => {
  return (
    <DivisionAssumptions
      divisionKey="tech"
      divisionName="Piattaforma Tecnologica"
      divisionIcon="🔧"
      assumptions={assumptions}
      onAssumptionChange={onAssumptionChange}
    />
  );
};

export default TechAssumptions;