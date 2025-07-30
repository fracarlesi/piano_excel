import React, { useState, useContext } from 'react';
import { Info, X } from 'lucide-react';
import { TooltipContext } from '../../hooks/useTooltip';

// Tooltip component for showing calculation details
const CalculationTooltip = ({ children, formula, details, calculation, id }) => {
  const { activeTooltip, tooltipData, openTooltip, closeTooltip } = useContext(TooltipContext);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isActive = activeTooltip === id;

  const handleClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate position to keep tooltip visible
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 5; // Default: below the element
    let transformY = '0'; // Default: no vertical transform
    
    // If tooltip would go off bottom of screen, show above
    if (rect.bottom + 300 > viewportHeight) {
      y = rect.top - 5;
      transformY = '-100%'; // Position above the element
    }
    
    // Keep tooltip within horizontal bounds
    x = Math.max(200, Math.min(viewportWidth - 200, x));
    
    if (isActive) {
      closeTooltip();
    } else {
      openTooltip(id, { formula, details, calculation });
      setPosition({ x, y, transformY });
    }
  };

  return (
    <>
      <span 
        onClick={handleClick}
        className="cursor-help hover:bg-blue-50 hover:text-blue-700 px-1 rounded transition-colors"
      >
        {children}
      </span>
      {isActive && tooltipData && (
        <div 
          className="fixed z-50 bg-white border-2 border-blue-200 rounded-lg shadow-xl p-4 max-w-md"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `translateX(-50%) translateY(${position.transformY})`,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">Calculation Formula</h4>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTooltip();
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 px-3 py-2 rounded font-mono text-sm mb-2">
                {tooltipData.formula}
              </div>
              
              {/* Show numerical calculation if available */}
              {tooltipData.calculation && (
                <div className="bg-blue-50 px-3 py-2 rounded text-sm mb-2">
                  <div className="font-semibold text-blue-800 mb-1">Numerical Calculation:</div>
                  <div className="font-mono text-blue-700">
                    {tooltipData.calculation}
                  </div>
                </div>
              )}
              
              {tooltipData.details && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="font-semibold text-gray-700 mb-1">Details:</div>
                  {tooltipData.details.map((detail, idx) => (
                    <div key={idx}>• {detail}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CalculationTooltip;