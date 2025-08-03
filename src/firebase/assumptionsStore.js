import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { database, auth } from '../firebase/firebase.js';
import { ref, onValue, set as firebaseSet } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { defaultAssumptions } from '../assumptions-views';
import { calculateResults } from '../financial-calculation/shared/backend';

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
    updatingLocallyTimeout: null, // Timeout to force reset the flag
    
    // Firebase references
    firebaseRef: null,
    firebaseUnsubscribe: null,
    
    // Actions
    /**
     * Initialize store and connect to Firebase
     */
    initialize: async () => {
      try {
        // Clear any old localStorage data that might interfere
        localStorage.removeItem('bankPlanAssumptions');
        localStorage.removeItem('bankPlanAssumptions_backup');
        
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
              return;
            }
            
            // Smart merge: preserve user data, update structure from code
            const merged = smartMergeAssumptions(defaultAssumptions, data.assumptions);
            
            
            set({ 
              assumptions: merged,
              isLoading: false,
              lastSaved: data.lastUpdated || Date.now()
            });
            
            // Recalculate results
            get().calculateResults();
          } else {
            // No data in Firebase, use defaults
            set({ 
              assumptions: defaultAssumptions,
              isLoading: false 
            });
            
            // Calculate results with defaults
            get().calculateResults();
            
            // Save defaults to Firebase
            get().saveToFirebase();
          }
        });
        
        set({ firebaseUnsubscribe: unsubscribe });
      } catch (error) {
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
      
      const { updatingLocallyTimeout } = get();
      
      // Clear existing timeout
      if (updatingLocallyTimeout) {
        clearTimeout(updatingLocallyTimeout);
      }
      
      // Set a safety timeout to force reset the flag after 10 seconds
      const timeout = setTimeout(() => {
        set({ isUpdatingLocally: false });
      }, 10000);
      
      set({ 
        assumptions: newAssumptions,
        hasUnsavedChanges: true,
        isUpdatingLocally: true,
        updatingLocallyTimeout: timeout
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
      
      const { assumptions, updatingLocallyTimeout } = get();
      const updated = updateNestedProperty(assumptions, path, value);
      
      // Clear existing timeout
      if (updatingLocallyTimeout) {
        clearTimeout(updatingLocallyTimeout);
      }
      
      // Set a safety timeout to force reset the flag after 10 seconds
      const timeout = setTimeout(() => {
        set({ isUpdatingLocally: false });
      }, 10000);
      
      set({ 
        assumptions: updated,
        hasUnsavedChanges: true,
        isUpdatingLocally: true,
        updatingLocallyTimeout: timeout
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
        set({ error: `Calculation error: ${error.message}` });
      }
    },
    
    /**
     * Save to Firebase
     */
    saveToFirebase: async () => {
      const { assumptions, firebaseRef } = get();
      
      if (!firebaseRef) {
        return;
      }
      
      try {
        set({ isAutoSaving: true });
        
        await firebaseSet(firebaseRef, {
          assumptions,
          lastUpdated: Date.now(),
          version: assumptions.version
        });
        
        
        const { updatingLocallyTimeout } = get();
        if (updatingLocallyTimeout) {
          clearTimeout(updatingLocallyTimeout);
        }
        
        set({ 
          lastSaved: Date.now(),
          hasUnsavedChanges: false,
          isAutoSaving: false,
          isUpdatingLocally: false, // Reset flag after save
          updatingLocallyTimeout: null
        });
      } catch (error) {
        
        const { updatingLocallyTimeout } = get();
        if (updatingLocallyTimeout) {
          clearTimeout(updatingLocallyTimeout);
        }
        
        set({ 
          error: error.message,
          isAutoSaving: false,
          isUpdatingLocally: false, // Reset flag on error too
          updatingLocallyTimeout: null
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
        set({ error: `Import error: ${error.message}` });
      }
    },
    
    /**
     * Clean up Firebase listeners
     */
    cleanup: () => {
      const { firebaseUnsubscribe, autoSaveTimeout, updatingLocallyTimeout } = get();
      
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
      }
      
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      if (updatingLocallyTimeout) {
        clearTimeout(updatingLocallyTimeout);
      }
    },
    
    /**
     * Force reset products to defaults
     */
    resetProductsToDefaults: async () => {
      const { assumptions } = get();
      const updatedAssumptions = {
        ...assumptions,
        products: defaultAssumptions.products
      };
      
      set({ assumptions: updatedAssumptions });
      get().calculateResults();
      await get().saveToFirebase();
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
          if (key === 'products') {
            // Special handling for products - Use default products as base
            // This ensures we always have the correct product structure
            target[key] = { ...merged[key] };
            
            // Override with any custom values from Firebase (but keep default structure)
            for (const productKey in source[key]) {
              if (source[key].hasOwnProperty(productKey) && target[key][productKey]) {
                // Merge all fields from Firebase, preserving user data
                const firebaseProduct = source[key][productKey];
                const defaultProduct = target[key][productKey];
                
                // Copy all fields from Firebase that exist
                Object.keys(firebaseProduct).forEach(field => {
                  if (firebaseProduct[field] !== undefined) {
                    target[key][productKey][field] = firebaseProduct[field];
                  }
                });
                
                // Add any new fields from defaults that don't exist in Firebase
                Object.keys(defaultProduct).forEach(field => {
                  if (!(field in firebaseProduct)) {
                    target[key][productKey][field] = defaultProduct[field];
                  }
                });
              }
            }
          } else if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
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