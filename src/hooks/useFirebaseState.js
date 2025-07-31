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
            console.log('📐 Comparison:', parseFloat(defaultAssumptions.version), '>', parseFloat(data.version), '=', parseFloat(defaultAssumptions.version) > parseFloat(data.version));
            
            // Check if local version is newer than Firebase version
            if (defaultAssumptions.version && data.version && 
                parseFloat(defaultAssumptions.version) > parseFloat(data.version)) {
              console.log(`🔄 Updating Firebase version from ${data.version} to ${defaultAssumptions.version}`);
              // Update only the version in Firebase
              const updatedData = { ...data, version: defaultAssumptions.version };
              set(assumptionsRef.current, cleanDataForFirebase(updatedData))
                .then(() => {
                  console.log('✅ Version updated in Firebase');
                })
                .catch((error) => {
                  console.error('❌ Error updating version:', error);
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