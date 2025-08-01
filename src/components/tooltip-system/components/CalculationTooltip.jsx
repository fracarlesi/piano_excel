import React, { useState, useContext } from 'react';
import { Info, X, Calculator, TrendingUp, Database } from 'lucide-react';
import { TooltipContext } from '../hooks/useTooltip';

// Tooltip component for showing calculation details with trace precedents functionality
const CalculationTooltip = ({ children, formula, details, calculation, id, precedents, year }) => {
  const { activeTooltip, tooltipData, openTooltip, closeTooltip } = useContext(TooltipContext);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [expandedPrecedent, setExpandedPrecedent] = useState(null);
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
      setExpandedPrecedent(null);
    } else {
      openTooltip(id, { formula, details, calculation, precedents, year });
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
            <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  Calculation Trace
                  {tooltipData.year !== undefined && (
                    <span className="text-sm font-normal text-gray-600">Year {tooltipData.year}</span>
                  )}
                </h4>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTooltip();
                    setExpandedPrecedent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Formula Section */}
              <div className="mb-3">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1">
                  <Info className="w-3 h-3" />
                  <span>FORMULA</span>
                </div>
                <div className="bg-gray-50 px-3 py-2 rounded font-mono text-sm border border-gray-200">
                  {tooltipData.formula}
                </div>
              </div>
              
              {/* Live Calculation Section */}
              {tooltipData.calculation && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>LIVE CALCULATION</span>
                  </div>
                  <div className="bg-blue-50 px-3 py-2 rounded text-sm border border-blue-200">
                    <div className="font-mono text-blue-800 whitespace-pre-wrap">
                      {tooltipData.calculation}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Precedents Section - Trace Dependencies */}
              {tooltipData.precedents && tooltipData.precedents.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-xs font-semibold text-purple-600 mb-1">
                    <Database className="w-3 h-3" />
                    <span>PRECEDENTS (DEPENDENCIES)</span>
                  </div>
                  <div className="space-y-1">
                    {tooltipData.precedents.map((precedent, idx) => (
                      <div 
                        key={idx}
                        className="bg-purple-50 px-3 py-2 rounded text-sm border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                        onClick={() => setExpandedPrecedent(expandedPrecedent === idx ? null : idx)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-purple-800">
                            {precedent.name}
                          </div>
                          <div className="font-mono text-purple-700 font-bold">
                            {precedent.value}
                          </div>
                        </div>
                        {expandedPrecedent === idx && precedent.calculation && (
                          <div className="mt-2 pt-2 border-t border-purple-200">
                            <div className="font-mono text-xs text-purple-600">
                              {precedent.calculation}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional Details */}
              {tooltipData.details && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1">
                    <Info className="w-3 h-3" />
                    <span>DETAILS</span>
                  </div>
                  {tooltipData.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-gray-400 mr-1">•</span>
                      <span>{detail}</span>
                    </div>
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