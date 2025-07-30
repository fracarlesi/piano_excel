import { useState, useEffect } from 'react';
import { defaultAssumptions } from '../data/defaultAssumptions';

// Helper function to create automatic backups
const createBackup = (data) => {
  const backupKey = 'bankPlanAssumptions_backup';
  const backupData = {
    data: data,
    timestamp: new Date().toISOString(),
    version: data.version
  };
  localStorage.setItem(backupKey, JSON.stringify(backupData));
};

// Helper function to extract user-modified values
const extractUserValues = (data) => {
  const userValues = {};
  
  // Extract product-specific values
  if (data.products) {
    Object.keys(data.products).forEach(productKey => {
      const product = data.products[productKey];
      userValues[productKey] = {};
      
      // For modular products
      if (product.acquisition) {
        userValues[productKey].customers = product.acquisition.customers;
        userValues[productKey].customerArray = product.customerArray;
      } else if (product.customers) {
        userValues[productKey].customers = product.customers;
        userValues[productKey].customerArray = product.customerArray;
      }
      
      // For volume-based products
      if (product.volumeArray) {
        userValues[productKey].volumeArray = product.volumeArray;
      }
      if (product.volumes) {
        userValues[productKey].volumes = product.volumes;
      }
    });
  }
  
  return userValues;
};

// Helper function to merge user values back into data
const mergeUserValues = (baseData, userValues) => {
  if (!userValues || !baseData.products) return baseData;
  
  const mergedData = JSON.parse(JSON.stringify(baseData)); // Deep clone
  
  Object.keys(userValues).forEach(productKey => {
    if (mergedData.products[productKey] && userValues[productKey]) {
      const product = mergedData.products[productKey];
      const savedValues = userValues[productKey];
      
      // Merge customer data for modular products
      if (product.acquisition && savedValues.customers) {
        product.acquisition.customers = savedValues.customers;
      } else if (savedValues.customers) {
        product.customers = savedValues.customers;
      }
      
      // Merge array data
      if (savedValues.customerArray) {
        product.customerArray = savedValues.customerArray;
      }
      if (savedValues.volumeArray) {
        product.volumeArray = savedValues.volumeArray;
      }
      if (savedValues.volumes) {
        product.volumes = savedValues.volumes;
      }
    }
  });
  
  return mergedData;
};

export const useLocalStorage = () => {
  // Load data from server first, fallback to localStorage, then defaults
  const loadSavedData = async () => {
    // Try to load from server first
    try {
      // TEMPORARILY DISABLED TO FORCE LOADING NEW VERSION
      if (false) {
        const response = await fetch('http://localhost:3001/api/load-assumptions');
        if (response.ok) {
          const serverData = await response.json();
          console.log('Loaded data from server');
          // Cache in localStorage for immediate use
          localStorage.setItem('bankPlanAssumptions', JSON.stringify(serverData));
          return serverData;
        }
      }
    } catch (error) {
      console.warn('Could not load from server, trying localStorage:', error);
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('bankPlanAssumptions');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        
        // Before any version check, create a backup of current data
        createBackup(parsedData);
        
        // Check version and handle updates
        if (!parsedData.version || parsedData.version !== defaultAssumptions.version) {
          console.warn(`Data version mismatch (saved: ${parsedData.version}, expected: ${defaultAssumptions.version})`);
          
          // Extract user values before reset
          const userValues = extractUserValues(parsedData);
          console.log('Preserving user values:', userValues);
          
          // Get fresh defaults and merge user values
          const updatedData = mergeUserValues(defaultAssumptions, userValues);
          
          // Save the merged data
          localStorage.setItem('bankPlanAssumptions', JSON.stringify(updatedData));
          
          return updatedData;
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
        
        // Migrate Digital Banking to modular structure (version 5.1)
        if (parsedData.products && parsedData.products.digitalRetailAccount) {
          const digitalProduct = parsedData.products.digitalRetailAccount;
          
          // Check if it's still using the old flat structure
          if (digitalProduct.customers && !digitalProduct.acquisition) {
            console.warn('Migrating Digital Banking product to modular structure');
            console.log('Preserving existing values:', {
              customers: digitalProduct.customers,
              cac: digitalProduct.cac,
              avgDeposit: digitalProduct.avgDeposit
            });
            
            // Create the new modular structure
            parsedData.products.digitalRetailAccount = {
              name: digitalProduct.name || 'Conto Corrente Retail',
              productType: 'DepositAndService',
              isDigital: true,
              
              acquisition: {
                customers: digitalProduct.customers || { y1: 50000, y5: 250000 },
                cac: digitalProduct.cac || 30,
                churnRate: digitalProduct.churnRate || 5
              },
              
              currentAccount: {
                avgDeposit: (digitalProduct.avgDeposit || 3000) / 2, // Split the deposit
                interestRate: digitalProduct.depositInterestRate || 0.1,
                monthlyFee: digitalProduct.monthlyFee || 1
              },
              
              savingsModule: {
                adoptionRate: 30,
                avgAdditionalDeposit: (digitalProduct.avgDeposit || 3000) * 1.5, // Use remaining deposit
                depositMix: [
                  { name: 'Svincolato', percentage: 40, interestRate: 2.5 },
                  { name: 'Vincolato 12M', percentage: 60, interestRate: 3.5 }
                ]
              },
              
              servicesModule: {
                adoptionRate: 40,
                avgAnnualRevenue: digitalProduct.annualServiceRevenue || 50
              }
            };
            
            // Preserve customerArray if it exists
            if (digitalProduct.customerArray) {
              parsedData.products.digitalRetailAccount.customerArray = digitalProduct.customerArray;
            }
            
            needsUpdate = true;
          }
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
        
        // Try to recover user values before clearing
        try {
          const savedUserValues = localStorage.getItem('bankPlanAssumptions_userValues');
          if (savedUserValues) {
            const { values } = JSON.parse(savedUserValues);
            console.log('Recovering user values from backup:', values);
            const recoveredData = mergeUserValues(defaultAssumptions, values);
            
            // Save the recovered data
            localStorage.setItem('bankPlanAssumptions', JSON.stringify(recoveredData));
            return recoveredData;
          }
        } catch (recoveryError) {
          console.error('Could not recover user values:', recoveryError);
        }
        
        localStorage.removeItem('bankPlanAssumptions'); // Clear corrupted data
        return defaultAssumptions;
      }
    }
    
    // No saved data, but check if we have user values to restore
    try {
      const savedUserValues = localStorage.getItem('bankPlanAssumptions_userValues');
      if (savedUserValues) {
        const { values } = JSON.parse(savedUserValues);
        console.log('Restoring user values to fresh defaults:', values);
        return mergeUserValues(defaultAssumptions, values);
      }
    } catch (error) {
      console.error('Error restoring user values:', error);
    }
    
    return defaultAssumptions;
  };

  const [assumptions, setAssumptionsInternal] = useState(defaultAssumptions);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastFileExport, setLastFileExport] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from server on component mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const data = await loadSavedData();
        setAssumptionsInternal(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error initializing data:', error);
        setAssumptionsInternal(defaultAssumptions);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Wrapper function to track changes and trigger auto-save
  const setAssumptions = (newAssumptions) => {
    setAssumptionsInternal(newAssumptions);
    setHasUnsavedChanges(true); // Mark as having unsaved changes
  };

  // Auto-save to localStorage effect with backup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        // Create backup before saving
        createBackup(assumptions);
        
        // Save current data
        localStorage.setItem('bankPlanAssumptions', JSON.stringify(assumptions));
        setLastSaved(new Date());
        
        // Also save user values separately for extra safety
        const userValues = extractUserValues(assumptions);
        localStorage.setItem('bankPlanAssumptions_userValues', JSON.stringify({
          values: userValues,
          timestamp: new Date().toISOString()
        }));
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
        const filename = 'bank-plan-assumptions-current.json';
        
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
    isLoading,
    importData,
    exportToFile,
    saveToFile
  };
};