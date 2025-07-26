import { useState, useEffect, createContext } from 'react';

// Create tooltip context
export const TooltipContext = createContext();

export const useTooltip = () => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  const openTooltip = (id, data) => {
    setActiveTooltip(id);
    setTooltipData(data);
  };

  const closeTooltip = () => {
    setActiveTooltip(null);
    setTooltipData(null);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is not on a tooltip or tooltip trigger
      if (!e.target.closest('.cursor-help') && !e.target.closest('.z-50')) {
        closeTooltip();
      }
    };

    if (activeTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeTooltip]);

  return {
    activeTooltip,
    tooltipData,
    openTooltip,
    closeTooltip
  };
};