import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { database, auth } from '../lib/firebase/firebase.js';
import { ref, onValue, set as firebaseSet } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { defaultAssumptions } from '../data/defaultAssumptions';
import { calculateResults } from '../lib/financial-engine';

/**
 * Zustand Store for Assumptions and Calculations
 * Handles state management and Firebase synchronization
 */
const useAssumptionsStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    assumptions: defaultAssumptions,
    results: null,
    isLoading: true,
    lastSaved: null,
    hasUnsavedChanges: false,
    isAutoSaving: false,
    error: null,
    isUpdatingLocally: false, // Flag to indicate we're making local changes
    
    // Firebase references
    firebaseRef: null,
    firebaseUnsubscribe: null,
    
    // Actions
    /**
     * Initialize store and connect to Firebase
     */
    initialize: async () => {
      try {
        // Sign in anonymously for Firebase access
        await signInAnonymously(auth);
        
        // Set up Firebase reference
        const dbRef = ref(database, 'bankPlan');
        set({ firebaseRef: dbRef });
        
        // Subscribe to Firebase changes
        const unsubscribe = onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (data && data.assumptions) {
            const state = get();
            
            // Skip merge if we're making local changes
            if (state.isUpdatingLocally) {
              console.log('Skipping Firebase merge - local update in progress');
              return;
            }
            
            // Smart merge: preserve user data, update structure from code
            const merged = smartMergeAssumptions(defaultAssumptions, data.assumptions);
            
            console.log('Firebase data version:', data.assumptions.version);
            console.log('Default version:', defaultAssumptions.version);
            console.log('Merged version:', merged.version);
            
            set({ 
              assumptions: merged,
              isLoading: false,
              lastSaved: data.lastUpdated || Date.now()
            });
            
            // Recalculate results
            get().calculateResults();
          } else {
            // No data in Firebase, use defaults
            console.log('No Firebase data, using defaults with version:', defaultAssumptions.version);
            set({ 
              assumptions: defaultAssumptions,
              isLoading: false 
            });
            
            // Save defaults to Firebase
            get().saveToFirebase();
          }
        });
        
        set({ firebaseUnsubscribe: unsubscribe });
      } catch (error) {
        console.error('Error initializing store:', error);
        set({ 
          error: error.message,
          isLoading: false 
        });
      }
    },
    
    /**
     * Update assumptions
     */
    setAssumptions: (newAssumptions) => {
      set({ 
        assumptions: newAssumptions,
        hasUnsavedChanges: true,
        isUpdatingLocally: true
      });
      
      // Recalculate results
      get().calculateResults();
      
      // Trigger auto-save
      get().autoSave();
    },
    
    /**
     * Update a specific assumption field
     */
    updateAssumption: (path, value) => {
      const { assumptions } = get();
      const updated = updateNestedProperty(assumptions, path, value);
      
      set({ 
        assumptions: updated,
        hasUnsavedChanges: true,
        isUpdatingLocally: true
      });
      
      // Recalculate results
      get().calculateResults();
      
      // Trigger auto-save
      get().autoSave();
    },
    
    /**
     * Calculate financial results
     */
    calculateResults: () => {
      const { assumptions } = get();
      
      try {
        const results = calculateResults(assumptions);
        set({ results });
      } catch (error) {
        console.error('Calculation error:', error);
        set({ error: `Calculation error: ${error.message}` });
      }
    },
    
    /**
     * Save to Firebase
     */
    saveToFirebase: async () => {
      const { assumptions, firebaseRef } = get();
      
      if (!firebaseRef) return;
      
      try {
        set({ isAutoSaving: true });
        
        await firebaseSet(firebaseRef, {
          assumptions,
          lastUpdated: Date.now(),
          version: assumptions.version
        });
        
        set({ 
          lastSaved: Date.now(),
          hasUnsavedChanges: false,
          isAutoSaving: false,
          isUpdatingLocally: false // Reset flag after save
        });
      } catch (error) {
        console.error('Error saving to Firebase:', error);
        set({ 
          error: error.message,
          isAutoSaving: false,
          isUpdatingLocally: false // Reset flag on error too
        });
      }
    },
    
    /**
     * Auto-save with debouncing
     */
    autoSaveTimeout: null,
    autoSave: () => {
      const { autoSaveTimeout } = get();
      
      // Clear existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        get().saveToFirebase();
      }, 3000); // 3 second delay
      
      set({ autoSaveTimeout: timeout });
    },
    
    /**
     * Export data to file
     */
    exportToFile: () => {
      const { assumptions, results } = get();
      const data = {
        assumptions,
        results,
        exportedAt: new Date().toISOString(),
        version: assumptions.version
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank-plan-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    /**
     * Import data from file
     */
    importData: (fileContent) => {
      try {
        const data = JSON.parse(fileContent);
        
        if (data.assumptions) {
          get().setAssumptions(data.assumptions);
        }
      } catch (error) {
        console.error('Error importing data:', error);
        set({ error: `Import error: ${error.message}` });
      }
    },
    
    /**
     * Clean up Firebase listeners
     */
    cleanup: () => {
      const { firebaseUnsubscribe, autoSaveTimeout } = get();
      
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
      }
      
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    }
  }))
);

// Helper Functions

/**
 * Smart merge assumptions: structure from code, values from Firebase
 */
function smartMergeAssumptions(codeAssumptions, firebaseAssumptions) {
  const merged = JSON.parse(JSON.stringify(codeAssumptions));
  
  // Recursive merge function
  function mergeRecursive(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (key in target) {
          if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
            // Recurse for objects
            mergeRecursive(target[key], source[key]);
          } else {
            // Copy value from Firebase
            target[key] = source[key];
          }
        }
      }
    }
  }
  
  mergeRecursive(merged, firebaseAssumptions);
  
  // Always use version from code
  merged.version = codeAssumptions.version;
  
  return merged;
}

/**
 * Update nested property in object
 */
function updateNestedProperty(obj, path, value) {
  const copy = JSON.parse(JSON.stringify(obj));
  const keys = path.split('.');
  
  let current = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  return copy;
}

export default useAssumptionsStore;