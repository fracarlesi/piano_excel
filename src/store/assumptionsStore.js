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
        console.log('Cleared old localStorage data');
        
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
              console.log('Skipping Firebase merge - local update in progress, isUpdatingLocally:', state.isUpdatingLocally);
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
      console.log('🔄 setAssumptions called, setting isUpdatingLocally to true');
      
      const { updatingLocallyTimeout } = get();
      
      // Clear existing timeout
      if (updatingLocallyTimeout) {
        clearTimeout(updatingLocallyTimeout);
      }
      
      // Set a safety timeout to force reset the flag after 10 seconds
      const timeout = setTimeout(() => {
        console.log('⚠️ Force resetting isUpdatingLocally flag due to timeout');
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
      console.log('🔄 updateAssumption called for path:', path, 'setting isUpdatingLocally to true');
      
      const { assumptions, updatingLocallyTimeout } = get();
      const updated = updateNestedProperty(assumptions, path, value);
      
      // Clear existing timeout
      if (updatingLocallyTimeout) {
        clearTimeout(updatingLocallyTimeout);
      }
      
      // Set a safety timeout to force reset the flag after 10 seconds
      const timeout = setTimeout(() => {
        console.log('⚠️ Force resetting isUpdatingLocally flag due to timeout');
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
        console.error('Calculation error:', error);
        set({ error: `Calculation error: ${error.message}` });
      }
    },
    
    /**
     * Save to Firebase
     */
    saveToFirebase: async () => {
      const { assumptions, firebaseRef } = get();
      
      if (!firebaseRef) {
        console.log('❌ Firebase save skipped - no firebaseRef');
        return;
      }
      
      try {
        console.log('💾 Starting Firebase save...');
        set({ isAutoSaving: true });
        
        await firebaseSet(firebaseRef, {
          assumptions,
          lastUpdated: Date.now(),
          version: assumptions.version
        });
        
        console.log('✅ Firebase save successful, resetting isUpdatingLocally to false');
        
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
        console.error('❌ Error saving to Firebase:', error);
        console.log('🔄 Resetting isUpdatingLocally to false due to error');
        
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
      
      console.log('⏰ Auto-save triggered, setting up 3-second delay...');
      
      // Clear existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        console.log('🔄 Cleared previous auto-save timeout');
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        console.log('⏱️ Auto-save timeout expired, calling saveToFirebase...');
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
            // Special handling for products - Firebase state takes precedence
            console.log('🔄 Merging products: Firebase state takes precedence...');
            
            // Start with Firebase products (respects deletions)
            target[key] = { ...source[key] };
            
            // Add any new products from defaults that aren't in Firebase
            for (const productKey in merged[key]) {
              if (merged[key].hasOwnProperty(productKey) && !source[key][productKey]) {
                console.log(`📦 Adding new default product: ${productKey}`);
                target[key][productKey] = merged[key][productKey];
              }
            }
            
            console.log(`✅ Products merged: ${Object.keys(target[key]).length} total products`);
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