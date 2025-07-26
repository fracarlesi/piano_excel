import { useState, useEffect } from 'react';
import { defaultAssumptions } from '../data/defaultAssumptions';

export const useLocalStorage = () => {
  // Load saved data from localStorage or use defaults
  const loadSavedData = () => {
    const saved = localStorage.getItem('bankPlanAssumptions');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Check version and force reset if needed
        if (!parsedData.version || parsedData.version !== defaultAssumptions.version) {
          console.warn(`Data version mismatch (saved: ${parsedData.version}, expected: ${defaultAssumptions.version}), using defaults`);
          localStorage.removeItem('bankPlanAssumptions'); // Clear incompatible data
          return defaultAssumptions;
        }
        
        // Check if the saved data has the expected structure
        if (!parsedData.products || !parsedData.realEstateDivision) {
          console.warn('Saved data structure is incompatible with current version, using defaults');
          localStorage.removeItem('bankPlanAssumptions'); // Clear incompatible data
          return defaultAssumptions;
        }
        
        // Migrate to include SME Division if missing
        if (!parsedData.smeDivision) {
          console.warn('Adding SME Division to existing data');
          parsedData.smeDivision = defaultAssumptions.smeDivision;
          
          // Add SME products if missing
          Object.keys(defaultAssumptions.products).forEach(key => {
            if (key.startsWith('sme') && !parsedData.products[key]) {
              parsedData.products[key] = defaultAssumptions.products[key];
            }
          });
        }
        
        // Migrate from tasso to spread if needed
        if (!parsedData.euribor) {
          console.warn('Migrating to EURIBOR + Spread structure');
          parsedData.euribor = defaultAssumptions.euribor;
          
          // Convert product tasso to spread
          Object.keys(parsedData.products).forEach(key => {
            if (parsedData.products[key].tasso && !parsedData.products[key].spread) {
              parsedData.products[key].spread = Math.max(0, parsedData.products[key].tasso - parsedData.euribor);
              delete parsedData.products[key].tasso;
            }
          });
        }
        
        // Force update product names to latest version
        let needsUpdate = false;
        if (parsedData.products) {
          Object.keys(defaultAssumptions.products).forEach(key => {
            if (parsedData.products[key] && defaultAssumptions.products[key]) {
              const currentName = parsedData.products[key].name;
              const expectedName = defaultAssumptions.products[key].name;
              
              if (currentName !== expectedName) {
                console.warn(`Force updating product name from "${currentName}" to "${expectedName}"`);
                parsedData.products[key].name = expectedName;
                needsUpdate = true;
              }
            }
          });
        }
        
        // Force save if names were updated
        if (needsUpdate) {
          localStorage.setItem('bankPlanAssumptions', JSON.stringify(parsedData));
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