/**
 * Debug Logger Utility
 * 
 * Centralized logging control for the financial engine.
 * Set DEBUG_LEVEL to control logging verbosity.
 */

// Debug levels:
// 0 = No logging (including console.log)
// 1 = Errors only
// 2 = Warnings + Errors
// 3 = Info + Warnings + Errors (default)
// 4 = Debug + Info + Warnings + Errors
// 5 = Verbose (all logs)

const DEBUG_LEVEL = 0; // Set to 0 to disable ALL logging

export const logger = {
  verbose: (...args) => DEBUG_LEVEL >= 5 && console.log(...args),
  debug: (...args) => DEBUG_LEVEL >= 4 && console.log(...args),
  info: (...args) => DEBUG_LEVEL >= 3 && console.log(...args),
  warn: (...args) => DEBUG_LEVEL >= 2 && console.warn(...args),
  error: (...args) => DEBUG_LEVEL >= 1 && console.error(...args),
};

// Override console.log globally when DEBUG_LEVEL is 0
if (DEBUG_LEVEL === 0 && typeof window !== 'undefined') {
  // Store original console.log
  window._originalConsoleLog = console.log;
  
  // Override console.log
  console.log = function() {
    // Silenced
  };
  
  // Keep console.error and console.warn active for critical issues
  // They remain unchanged
}

export default logger;