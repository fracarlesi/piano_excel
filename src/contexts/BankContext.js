import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useFirebaseState } from '../hooks/useFirebaseState';
import { calculateResults } from '../utils/calculations-new';

/**
 * Bank Context
 * Centralizes state management for the entire application
 */
const BankContext = createContext();

/**
 * Bank Context Provider
 * Manages assumptions, calculations, and provides helper functions
 */
export const BankProvider = ({ children }) => {
  // Use Firebase state hook
  const { 
    assumptions, 
    setAssumptions, 
    lastSaved,
    hasUnsavedChanges,
    isAutoSaving,
    isLoading,
    exportToFile,
    importData
  } = useFirebaseState();

  // Calculate results whenever assumptions change
  const results = useMemo(() => {
    if (!assumptions) return null;
    return calculateResults(assumptions);
  }, [assumptions]);

  // Handle assumption changes
  const handleAssumptionChange = useCallback((key, value) => {
    const keys = key.split('.');
    const newAssumptions = { ...assumptions };
    
    let current = newAssumptions;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setAssumptions(newAssumptions);
  }, [assumptions, setAssumptions]);

  // Get division results by key
  const getDivisionResults = useCallback((divisionKey) => {
    if (!results || !results.divisions) return null;
    
    // Map short keys to division keys in results
    const divisionMapping = {
      're': 'RealEstateFinancing',
      'sme': 'SMEFinancing',
      'digital': 'DigitalBanking',
      'wealth': 'WealthAndAssetManagement',
      'tech': 'Tech',
      'incentive': 'Incentives',
      'central': 'CentralFunctions',
      'treasury': 'Treasury'
    };
    
    return results.divisions[divisionKey] || results.divisions[divisionMapping[divisionKey]];
  }, [results]);

  // Get products for a division
  const getDivisionProducts = useCallback((divisionKey) => {
    if (!results || !results.productResults) return {};
    
    return Object.fromEntries(
      Object.entries(results.productResults)
        .filter(([key]) => key.startsWith(divisionKey))
    );
  }, [results]);

  // Context value
  const value = {
    // State
    assumptions,
    results,
    isLoading,
    
    // State management
    setAssumptions,
    handleAssumptionChange,
    
    // Helper functions
    getDivisionResults,
    getDivisionProducts,
    
    // Firebase state
    lastSaved,
    hasUnsavedChanges,
    isAutoSaving,
    exportToFile,
    importData
  };

  return (
    <BankContext.Provider value={value}>
      {children}
    </BankContext.Provider>
  );
};

/**
 * Hook to use Bank Context
 */
export const useBankContext = () => {
  const context = useContext(BankContext);
  if (!context) {
    throw new Error('useBankContext must be used within a BankProvider');
  }
  return context;
};

// Export the context itself for special cases
export default BankContext;