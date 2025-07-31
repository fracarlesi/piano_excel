import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import { database } from '../config/firebase';
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
  const [assumptions, setLocalAssumptions] = useState(null); // Start with null to detect loading state
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const assumptionsRef = useRef(ref(database, 'assumptions'));
  const saveTimeoutRef = useRef(null);
  const lastSyncedDataRef = useRef(null);

  // Load initial data and set up real-time listener
  useEffect(() => {
    const unsubscribe = onValue(assumptionsRef.current, (snapshot) => {
      const data = snapshot.val();
      if (data) {
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

    // Cleanup listener on unmount
    return () => {
      off(assumptionsRef.current);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save function with debouncing
  const saveToFirebase = useCallback(async (data) => {
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
  }, []);

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