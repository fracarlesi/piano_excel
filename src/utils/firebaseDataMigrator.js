/**
 * Firebase Data Migrator
 * 
 * Sistema per diagnosticare, migrare e sincronizzare automaticamente
 * i dati tra Firebase e i backend calculators
 */

// Import dependencies
import { database } from '../firebase/firebase.js';
import { ref, onValue, set as firebaseSet, get } from 'firebase/database';
import { techProducts } from '../assumptions-views/Tech/backend/products.js';

export class FirebaseDataMigrator {
  constructor() {
    this.firebaseRef = ref(database, 'bankPlan');
  }

  /**
   * Diagnose data structure inconsistencies
   */
  async diagnoseDataIssues() {
    console.log('=== FIREBASE DATA DIAGNOSTIC ===');
    
    try {
      const snapshot = await get(this.firebaseRef);
      const data = snapshot.val();
      
      if (!data || !data.assumptions) {
        console.log('❌ No data found in Firebase');
        return { hasIssues: true, issues: ['no_data'] };
      }

      const assumptions = data.assumptions;
      const issues = [];
      
      // Check Tech Division Structure
      console.log('\n1. Tech Division Structure Check:');
      
      // Check if techDivision exists
      if (!assumptions.techDivision) {
        console.log('❌ techDivision missing');
        issues.push('missing_tech_division');
      } else {
        console.log('✅ techDivision exists');
        
        // Check if techDivision.products exists
        if (!assumptions.techDivision.products) {
          console.log('❌ techDivision.products missing');
          issues.push('missing_tech_products');
        } else {
          console.log('✅ techDivision.products exists');
          
          // Check specific products
          const techProductKeys = Object.keys(techProducts);
          console.log('\n   Product Details:');
          
          techProductKeys.forEach(productKey => {
            const product = assumptions.techDivision.products[productKey];
            if (!product) {
              console.log(`   ❌ ${productKey} missing`);
              issues.push(`missing_${productKey}`);
            } else {
              console.log(`   ✅ ${productKey} exists`);
              
              // Check costArray specifically for cloudServices
              if (productKey === 'cloudServices') {
                if (!product.costArray) {
                  console.log(`      ❌ costArray missing`);
                  issues.push('missing_cloud_cost_array');
                } else {
                  console.log(`      ✅ costArray: [${product.costArray.slice(0, 3).join(', ')}...]`);
                  console.log(`      📊 First year cost: ${product.costArray[0]}M (expected: user input, default: 8M)`);
                  
                  // Check if user modified the default
                  if (product.costArray[0] === 8) {
                    console.log(`      ⚠️  Using default value - user may not have saved changes`);
                    issues.push('using_default_cloud_costs');
                  } else {
                    console.log(`      ✅ User modified value detected`);
                  }
                }
              }
            }
          });
        }
      }
      
      // Check Global Products Structure (legacy)
      console.log('\n2. Global Products Structure Check:');
      
      if (!assumptions.products) {
        console.log('❌ Global products missing');
        issues.push('missing_global_products');
      } else {
        console.log('✅ Global products exists');
        
        // Check if tech products are duplicated in global
        const globalTechProducts = Object.keys(assumptions.products).filter(key => 
          Object.keys(techProducts).includes(key)
        );
        
        if (globalTechProducts.length > 0) {
          console.log(`   ⚠️  Tech products found in global: ${globalTechProducts.join(', ')}`);
          issues.push('duplicate_tech_products_in_global');
        } else {
          console.log('   ✅ No duplicate tech products in global');
        }
      }
      
      // Summary
      console.log('\n=== DIAGNOSTIC SUMMARY ===');
      if (issues.length === 0) {
        console.log('✅ No issues found - data structure is correct');
      } else {
        console.log(`❌ Found ${issues.length} issues:`);
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      return { hasIssues: issues.length > 0, issues, data: assumptions };
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      return { hasIssues: true, issues: ['diagnostic_error'], error: error.message };
    }
  }

  /**
   * Auto-migrate data to correct structure
   */
  async autoMigrateData() {
    console.log('\n=== STARTING AUTO-MIGRATION ===');
    
    const diagnostic = await this.diagnoseDataIssues();
    
    if (!diagnostic.hasIssues) {
      console.log('✅ No migration needed - data is already correct');
      return { success: true, changes: [] };
    }

    const changes = [];
    let needsSave = false;
    const assumptions = diagnostic.data;

    try {
      // Fix 1: Ensure techDivision exists
      if (diagnostic.issues.includes('missing_tech_division')) {
        assumptions.techDivision = {};
        changes.push('Created techDivision');
        needsSave = true;
      }

      // Fix 2: Ensure techDivision.products exists
      if (diagnostic.issues.includes('missing_tech_products')) {
        assumptions.techDivision.products = {};
        changes.push('Created techDivision.products');
        needsSave = true;
      }

      // Fix 3: Add missing tech products with defaults
      Object.entries(techProducts).forEach(([productKey, defaultProduct]) => {
        if (diagnostic.issues.includes(`missing_${productKey}`)) {
          assumptions.techDivision.products[productKey] = { ...defaultProduct };
          changes.push(`Added ${productKey} with defaults`);
          needsSave = true;
        }
      });

      // Fix 4: Fix cloud services cost array if using defaults
      if (diagnostic.issues.includes('using_default_cloud_costs') || 
          diagnostic.issues.includes('missing_cloud_cost_array')) {
        // Keep user data if it exists, otherwise use defaults
        if (!assumptions.techDivision.products.cloudServices.costArray) {
          assumptions.techDivision.products.cloudServices.costArray = [...techProducts.cloudServices.costArray];
          changes.push('Added default cloudServices costArray');
          needsSave = true;
        }
      }

      // Fix 5: Remove duplicate tech products from global products
      if (diagnostic.issues.includes('duplicate_tech_products_in_global')) {
        Object.keys(techProducts).forEach(productKey => {
          if (assumptions.products && assumptions.products[productKey]) {
            delete assumptions.products[productKey];
            changes.push(`Removed duplicate ${productKey} from global products`);
            needsSave = true;
          }
        });
      }

      // Save changes if needed
      if (needsSave) {
        console.log('\n📝 Saving migrated data to Firebase...');
        
        await firebaseSet(this.firebaseRef, {
          assumptions,
          lastUpdated: Date.now(),
          version: assumptions.version,
          migrationInfo: {
            migratedAt: Date.now(),
            changes: changes
          }
        });
        
        console.log('✅ Migration completed successfully');
        changes.push('Saved to Firebase');
      }

      return { success: true, changes, needsSave };

    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message, changes };
    }
  }

  /**
   * Setup real-time data sync
   */
  setupRealTimeSync(callback) {
    console.log('🔄 Setting up real-time data sync...');
    
    const unsubscribe = onValue(this.firebaseRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data && data.assumptions) {
        // Verify data integrity on every change
        this.validateDataIntegrity(data.assumptions);
        
        if (callback) {
          callback(data.assumptions);
        }
      }
    });

    return unsubscribe;
  }

  /**
   * Validate data integrity in real-time
   */
  validateDataIntegrity(assumptions) {
    // Quick validation checks
    const issues = [];
    
    if (!assumptions.techDivision?.products?.cloudServices?.costArray) {
      issues.push('cloudServices.costArray missing');
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Data integrity issues detected:', issues);
      // Auto-fix if needed
      this.autoMigrateData();
    }
  }

  /**
   * Force sync user data to backend format
   */
  async forceSyncUserData() {
    console.log('🔄 Force syncing user data...');
    
    try {
      const snapshot = await get(this.firebaseRef);
      const data = snapshot.val();
      
      if (!data?.assumptions?.techDivision?.products?.cloudServices) {
        throw new Error('No tech division cloud services data found');
      }

      const cloudServices = data.assumptions.techDivision.products.cloudServices;
      
      console.log('Current cloudServices data:', {
        costArray: cloudServices.costArray,
        markupPercentage: cloudServices.markupPercentage,
        allocationMethod: cloudServices.allocationMethod
      });

      // Ensure the backend calculator will receive this data correctly
      return {
        success: true,
        cloudServicesData: cloudServices
      };

    } catch (error) {
      console.error('❌ Force sync failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const firebaseDataMigrator = new FirebaseDataMigrator();

// Auto-diagnostic function for easy use
export const runDataDiagnostic = async () => {
  return await firebaseDataMigrator.diagnoseDataIssues();
};

// Auto-migration function for easy use
export const runAutoMigration = async () => {
  return await firebaseDataMigrator.autoMigrateData();
};