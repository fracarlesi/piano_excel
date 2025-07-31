import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { database, auth } from '../config/firebase';
import defaultAssumptions from '../data/defaultAssumptions';

// Function to clean data before sending to Firebase (remove undefined values)
const cleanDataForFirebase = (data) => {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(cleanDataForFirebase);
  }
  
  if (typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirebase(value);
      }
    }
    return cleaned;
  }
  
  return data;
};

export const useFirebaseState = () => {
  // Check if we're in development mode
  const isDevelopment = false; // FORCE FIREBASE USAGE IN ALL ENVIRONMENTS
  
  const [assumptions, setLocalAssumptions] = useState(isDevelopment ? defaultAssumptions : null);
  const [isLoading, setIsLoading] = useState(!isDevelopment); // No loading in dev mode
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const assumptionsRef = useRef(ref(database, 'assumptions'));
  const saveTimeoutRef = useRef(null);
  const lastSyncedDataRef = useRef(null);

  // Load initial data and set up real-time listener
  useEffect(() => {
    // In development mode, use local data but preserve existing values
    if (isDevelopment) {
      
      // Get saved data from localStorage if available
      const savedData = localStorage.getItem('bankAssumptions');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          
          // If saved version is older than default version, merge
          const compareVersions = (v1, v2) => {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
              const part1 = parts1[i] || 0;
              const part2 = parts2[i] || 0;
              if (part1 > part2) return 1;
              if (part1 < part2) return -1;
            }
            return 0;
          };
          
          if (compareVersions(defaultAssumptions.version, parsedData.version) > 0) {
            
            // Smart merge that respects deletions but adds new fields
            const mergeData = (localData, savedData) => {
              const merged = { ...savedData }; // Start with saved data
              
              // Add new top-level fields (but not products)
              Object.keys(localData).forEach(key => {
                if (key !== 'products' && !(key in savedData)) {
                  merged[key] = localData[key];
                }
              });
              
              // For products, only update existing ones with new fields
              if (savedData.products) {
                merged.products = { ...savedData.products };
                
                // For each existing product in saved data
                Object.keys(savedData.products).forEach(productKey => {
                  const savedProduct = savedData.products[productKey];
                  const defaultProduct = localData.products?.[productKey];
                  
                  if (defaultProduct && typeof savedProduct === 'object') {
                    // Add any new fields from default to saved product
                    Object.keys(defaultProduct).forEach(field => {
                      if (!(field in savedProduct)) {
                        merged.products[productKey][field] = defaultProduct[field];
                      }
                    });
                  }
                });
              }
              
              return merged;
            };
            
            const mergedData = mergeData(defaultAssumptions, parsedData);
            mergedData.version = defaultAssumptions.version;
            
            setLocalAssumptions(mergedData);
            localStorage.setItem('bankAssumptions', JSON.stringify(mergedData));
          } else {
            // Use saved data as-is
            setLocalAssumptions(parsedData);
          }
        } catch (error) {
          console.error('Error parsing saved data:', error);
          setLocalAssumptions(defaultAssumptions);
        }
      } else {
        // No saved data, use defaults
        setLocalAssumptions(defaultAssumptions);
        localStorage.setItem('bankAssumptions', JSON.stringify(defaultAssumptions));
      }
      
      setIsLoading(false);
      return; // Skip Firebase connection in development
    }
    
    // Production mode: Sign in anonymously first, then use Firebase
    const initializeFirebase = async () => {
      try {
        // Sign in anonymously to get write permissions
        await signInAnonymously(auth);
        
        // Now set up the real-time listener
        const unsubscribe = onValue(assumptionsRef.current, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Debug logs
            
            // Compare versions properly (split by dot and compare parts)
            const compareVersions = (v1, v2) => {
              const parts1 = v1.split('.').map(Number);
              const parts2 = v2.split('.').map(Number);
              
              for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const part1 = parts1[i] || 0;
                const part2 = parts2[i] || 0;
                if (part1 > part2) return 1;
                if (part1 < part2) return -1;
              }
              return 0;
            };
            
            const versionComparison = compareVersions(defaultAssumptions.version, data.version);
            
            // Check if local version is newer than Firebase version
            if (defaultAssumptions.version && data.version && versionComparison > 0) {
              
              // Smart merge that respects deletions but adds new fields
              const mergeData = (localData, firebaseData) => {
                const merged = { ...firebaseData }; // Start with Firebase data
                
                // Add new top-level fields (but not products)
                Object.keys(localData).forEach(key => {
                  if (key !== 'products' && !(key in firebaseData)) {
                    merged[key] = localData[key];
                    }
                });
                
                // For products, only update existing ones with new fields
                if (firebaseData.products) {
                  merged.products = { ...firebaseData.products };
                  
                  // For each existing product in Firebase
                  Object.keys(firebaseData.products).forEach(productKey => {
                    const firebaseProduct = firebaseData.products[productKey];
                    const defaultProduct = localData.products?.[productKey];
                    
                    if (defaultProduct && typeof firebaseProduct === 'object') {
                      // Add any new fields from default to Firebase product
                      Object.keys(defaultProduct).forEach(field => {
                        if (!(field in firebaseProduct)) {
                          merged.products[productKey][field] = defaultProduct[field];
                          }
                      });
                    }
                  });
                }
                
                return merged;
              };
              
              const mergedData = mergeData(defaultAssumptions, data);
              mergedData.version = defaultAssumptions.version;
              
              set(assumptionsRef.current, cleanDataForFirebase(mergedData))
                .then(() => {
                })
                .catch((error) => {
                  console.error('❌ Error updating Firebase:', error);
                });
            } else {
            }
            setLocalAssumptions(data);
            lastSyncedDataRef.current = JSON.stringify(data);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
          } else {
            // If no data exists in Firebase, save the default assumptions
            const cleanedDefaults = cleanDataForFirebase(defaultAssumptions);
            set(assumptionsRef.current, cleanedDefaults)
              .then(() => {
                setLocalAssumptions(cleanedDefaults);
                setLastSaved(new Date());
                lastSyncedDataRef.current = JSON.stringify(cleanedDefaults);
              })
              .catch((error) => {
                console.error('Error saving default assumptions:', error);
              });
          }
          setIsLoading(false);
        }, (error) => {
          console.error('Firebase read error:', error);
          setIsLoading(false);
        });
        
        // Store unsubscribe function for cleanup
        return () => {
          off(assumptionsRef.current);
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
        };
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        setIsLoading(false);
      }
    };
    
    // Initialize Firebase connection
    initializeFirebase();
    
  }, [isDevelopment]);

  // Auto-save function with debouncing
  const saveToFirebase = useCallback(async (data) => {
    // Skip Firebase save in development mode
    if (isDevelopment) {
      return;
    }
    
    setIsAutoSaving(true);
    try {
      const cleanedData = cleanDataForFirebase(data);
      await set(assumptionsRef.current, cleanedData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      lastSyncedDataRef.current = JSON.stringify(cleanedData);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      setHasUnsavedChanges(true);
    } finally {
      setIsAutoSaving(false);
    }
  }, [isDevelopment]);

  // Wrapper for setAssumptions that triggers auto-save
  const setAssumptions = useCallback((newAssumptions) => {
    // Update local state immediately for responsive UI
    setLocalAssumptions(newAssumptions);
    
    // In development mode, save to localStorage
    if (isDevelopment) {
      localStorage.setItem('bankAssumptions', JSON.stringify(newAssumptions));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      lastSyncedDataRef.current = JSON.stringify(newAssumptions);
      return;
    }
    
    // Check if data has actually changed
    const currentData = JSON.stringify(newAssumptions);
    if (currentData !== lastSyncedDataRef.current) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save (3 seconds delay)
      saveTimeoutRef.current = setTimeout(() => {
        saveToFirebase(newAssumptions);
      }, 3000);
    }
  }, [saveToFirebase, isDevelopment]);

  // Export/Import functions (no longer needed but kept for compatibility)
  const exportToFile = useCallback(() => {
    // This function is no longer needed with Firebase
  }, []);

  const importData = useCallback(() => {
    // This function is no longer needed with Firebase
  }, []);

  return {
    assumptions,
    setAssumptions,
    lastSaved,
    hasUnsavedChanges,
    lastFileExport: null, // No longer applicable
    isAutoSaving,
    isLoading,
    importData,
    exportToFile
  };
};