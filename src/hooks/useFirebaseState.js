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
  const isDevelopment = process.env.NODE_ENV === 'development';
  
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
    // In development mode, use local data
    if (isDevelopment) {
      console.log('🚀 Development mode: Using local defaultAssumptions');
      setLocalAssumptions(defaultAssumptions);
      setIsLoading(false);
      return; // Skip Firebase connection in development
    }
    
    // Production mode: Sign in anonymously first, then use Firebase
    const initializeFirebase = async () => {
      try {
        // Sign in anonymously to get write permissions
        await signInAnonymously(auth);
        console.log('🔐 Signed in anonymously to Firebase');
        
        // Now set up the real-time listener
        const unsubscribe = onValue(assumptionsRef.current, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Debug logs
            console.log('📊 Firebase data loaded');
            console.log('📌 Local version:', defaultAssumptions.version);
            console.log('🔥 Firebase version:', data.version);
            
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
            console.log('📐 Version comparison result:', versionComparison > 0 ? 'Local is newer' : versionComparison < 0 ? 'Firebase is newer' : 'Same version');
            
            // Check if local version is newer than Firebase version
            if (defaultAssumptions.version && data.version && versionComparison > 0) {
              console.log(`🔄 Updating Firebase from version ${data.version} to ${defaultAssumptions.version}`);
              
              // Smart merge: structure from local, values from Firebase
              const mergeData = (localData, firebaseData) => {
                // Recursive merge function
                const deepMerge = (local, firebase, path = '') => {
                  const merged = {};
                  
                  // For each key in local structure
                  Object.keys(local).forEach(key => {
                    const localValue = local[key];
                    const firebaseValue = firebase?.[key];
                    const currentPath = path ? `${path}.${key}` : key;
                    
                    // If it's an object (not array), recurse
                    if (localValue && typeof localValue === 'object' && !Array.isArray(localValue)) {
                      merged[key] = deepMerge(localValue, firebaseValue, currentPath);
                    } else {
                      // For primitive values or arrays:
                      // - If exists in Firebase, keep Firebase value (user modifications)
                      // - If new field, use local default value
                      if (firebaseValue !== undefined) {
                        merged[key] = firebaseValue;
                        if (localValue !== firebaseValue && key !== 'version') {
                          console.log(`📌 Keeping user value for ${currentPath}: ${firebaseValue} (local default: ${localValue})`);
                        }
                      } else {
                        merged[key] = localValue;
                        console.log(`✨ Adding new field ${currentPath}: ${localValue}`);
                      }
                    }
                  });
                  
                  // Preserve any Firebase fields not in local (backwards compatibility)
                  if (firebase && typeof firebase === 'object' && !Array.isArray(firebase)) {
                    Object.keys(firebase).forEach(key => {
                      if (!(key in local)) {
                        merged[key] = firebase[key];
                        console.log(`🔒 Preserving Firebase-only field ${path ? path + '.' : ''}${key}`);
                      }
                    });
                  }
                  
                  return merged;
                };
                
                return deepMerge(localData, firebaseData);
              };
              
              const mergedData = mergeData(defaultAssumptions, data);
              mergedData.version = defaultAssumptions.version; // Ensure version is updated
              
              set(assumptionsRef.current, cleanDataForFirebase(mergedData))
                .then(() => {
                  console.log('✅ Firebase updated with smart merge');
                })
                .catch((error) => {
                  console.error('❌ Error updating Firebase:', error);
                });
            } else {
              console.log('ℹ️ Version update not needed or condition not met');
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
      console.log('💾 Development mode: Skipping Firebase save');
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
  }, [saveToFirebase]);

  // Export/Import functions (no longer needed but kept for compatibility)
  const exportToFile = useCallback(() => {
    // This function is no longer needed with Firebase
    console.log('Export functionality has been replaced by real-time Firebase sync');
  }, []);

  const importData = useCallback(() => {
    // This function is no longer needed with Firebase
    console.log('Import functionality has been replaced by real-time Firebase sync');
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