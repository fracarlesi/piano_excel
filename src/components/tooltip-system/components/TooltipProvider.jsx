import React from 'react';
import { TooltipContext, useTooltip } from '../hooks/useTooltip';

// Tooltip provider component
export const TooltipProvider = ({ children }) => {
  const tooltipValue = useTooltip();

  return (
    <TooltipContext.Provider value={tooltipValue}>
      {children}
    </TooltipContext.Provider>
  );
};