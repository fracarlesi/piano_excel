import React, { useContext } from 'react';
import { HelpCircle } from 'lucide-react';
import { TooltipContext } from '../lib/utils/useTooltip';

/**
 * Tooltip component for displaying help information on assumptions
 * @param {string} id - Unique identifier for the tooltip
 * @param {string} title - Title of the assumption
 * @param {string} description - Description of what the assumption does
 * @param {string} impact - Where this assumption impacts in the model
 * @param {string} formula - Optional formula or calculation method
 */
export const Tooltip = ({ id, title, description, impact, formula }) => {
  const { activeTooltip, openTooltip, closeTooltip } = useContext(TooltipContext);
  
  const isActive = activeTooltip === id;
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (isActive) {
      closeTooltip();
    } else {
      openTooltip(id, { title, description, impact, formula });
    }
  };
  
  return (
    <div className="relative inline-block">
      <HelpCircle 
        className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help ml-1"
        onClick={handleClick}
      />
      
      {isActive && (
        <div className="absolute z-50 left-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 max-w-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            
            <div className="text-sm text-gray-700">
              <p className="mb-2">{description}</p>
              
              <div className="border-t pt-2 mt-2">
                <p className="font-medium text-gray-800 mb-1">Impact:</p>
                <p className="text-gray-600">{impact}</p>
              </div>
              
              {formula && (
                <div className="border-t pt-2 mt-2">
                  <p className="font-medium text-gray-800 mb-1">Formula:</p>
                  <code className="text-xs bg-gray-100 p-1 rounded block overflow-x-auto">
                    {formula}
                  </code>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 italic">
            Click to close
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;