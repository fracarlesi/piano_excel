import { useState, useEffect } from 'react';
import { defaultAssumptions } from '../data/defaultAssumptions';

export const useLocalStorage = () => {
  // Load saved data from localStorage or use defaults
  const loadSavedData = () => {
    const saved = localStorage.getItem('bankPlanAssumptions');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Check if the saved data has the expected structure for single Real Estate Division
        if (!parsedData.products || !parsedData.realEstateDivision || parsedData.divisions) {
          console.warn('Saved data structure is incompatible with current version, using defaults');
          localStorage.removeItem('bankPlanAssumptions'); // Clear incompatible data
          return defaultAssumptions;
        }
        return parsedData;
      } catch (e) {
        console.error('Error loading saved data:', e);
        localStorage.removeItem('bankPlanAssumptions'); // Clear corrupted data
        return defaultAssumptions;
      }
    }
    return defaultAssumptions;
  };

  const [assumptions, setAssumptions] = useState(loadSavedData);
  const [lastSaved, setLastSaved] = useState(null);

  // Auto-save effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('bankPlanAssumptions', JSON.stringify(assumptions));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [assumptions]);

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setAssumptions(imported);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing file. Make sure it\'s a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return {
    assumptions,
    setAssumptions,
    lastSaved,
    importData
  };
};