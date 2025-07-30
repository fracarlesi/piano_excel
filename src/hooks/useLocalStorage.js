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
        
        // Force reset for version 2.7 to ensure new RE products are loaded
        if (parsedData.version === '2.7') {
          const hasNewREProducts = parsedData.products && 
            parsedData.products.reSecuritization && 
            parsedData.products.reMortgage && 
            parsedData.products.reBridge;
          
          if (!hasNewREProducts) {
            console.warn('Version 2.7 detected but missing new RE products, forcing reset');
            localStorage.removeItem('bankPlanAssumptions');
            return defaultAssumptions;
          }
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


        // Migrate to include Digital Banking Division if missing
        if (!parsedData.digitalBankingDivision) {
          console.warn('Adding Digital Banking Division to existing data');
          parsedData.digitalBankingDivision = defaultAssumptions.digitalBankingDivision;
          
          // Add Digital Banking products if missing
          Object.keys(defaultAssumptions.products).forEach(key => {
            if (key.startsWith('digital') && !parsedData.products[key]) {
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
        
        // Force update product names and structure to latest version
        let needsUpdate = false;
        
        // Force update RE products to new structure
        if (parsedData.products) {
          const oldREProducts = ['reNoGaranzia', 'reConGaranzia'];
          const hasOldREProducts = oldREProducts.some(key => parsedData.products[key]);
          
          if (hasOldREProducts) {
            console.warn('Migrating to new Real Estate products structure');
            // Remove old RE products
            oldREProducts.forEach(key => {
              if (parsedData.products[key]) {
                delete parsedData.products[key];
              }
            });
            
            // Add new RE products
            ['reSecuritization', 'reMortgage', 'reBridge'].forEach(key => {
              if (defaultAssumptions.products[key]) {
                parsedData.products[key] = defaultAssumptions.products[key];
              }
            });
            needsUpdate = true;
          }
        }
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

  const [assumptions, setAssumptionsInternal] = useState(loadSavedData);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastFileExport, setLastFileExport] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Wrapper function to track changes and trigger auto-save
  const setAssumptions = (newAssumptions) => {
    setAssumptionsInternal(newAssumptions);
    setHasUnsavedChanges(true); // Mark as having unsaved changes
  };

  // Auto-save to localStorage effect
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

  // Auto-save to server effect - debounced to avoid excessive requests
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveTimeoutId = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `bank-plan-assumptions-${timestamp}.json`;
        
        const response = await fetch('http://localhost:3001/api/save-assumptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: assumptions,
            filename: filename
          })
        });

        if (response.ok) {
          setHasUnsavedChanges(false); // Reset unsaved changes flag
          setLastFileExport(new Date()); // Track last file export
          console.log('Auto-saved to server successfully');
        } else {
          console.warn('Auto-save to server failed:', response.status);
        }
      } catch (error) {
        console.warn('Auto-save server error:', error);
        // Don't show alert for auto-save failures - just log the error
      } finally {
        setIsAutoSaving(false);
      }
    }, 3000); // 3 second delay for server auto-save

    return () => clearTimeout(autoSaveTimeoutId);
  }, [assumptions, hasUnsavedChanges]);

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

  const resetToDefaults = () => {
    localStorage.removeItem('bankPlanAssumptions');
    setAssumptions(defaultAssumptions);
    setLastSaved(null);
    alert('Data reset to defaults successfully!');
  };

  const exportToFile = async () => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `bank-plan-assumptions-${timestamp}.json`;
      
      const response = await fetch('http://localhost:3001/api/save-assumptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: assumptions,
          filename: filename
        })
      });

      if (response.ok) {
        const result = await response.json();
        setHasUnsavedChanges(false); // Reset unsaved changes flag
        setLastFileExport(new Date()); // Track last file export
        alert(`Assumptions saved successfully to: ${result.filepath}`);
      } else {
        throw new Error('Failed to save file on server');
      }
    } catch (error) {
      console.error('Save server error:', error);
      alert('Error: Cannot save to project folder. Make sure the save server is running (npm run start-save-server)');
    }
  };

  const saveToFile = () => {
    exportToFile();
  };

  return {
    assumptions,
    setAssumptions,
    lastSaved,
    hasUnsavedChanges,
    lastFileExport,
    isAutoSaving,
    importData,
    resetToDefaults,
    exportToFile,
    saveToFile
  };
};