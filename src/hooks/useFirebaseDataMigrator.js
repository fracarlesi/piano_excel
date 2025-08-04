/**
 * React Hook for Firebase Data Migration
 * 
 * Provides easy integration with the Firebase Data Migrator
 */

import { useState, useEffect, useCallback } from 'react';
import { firebaseDataMigrator } from '../utils/firebaseDataMigrator.js';

export const useFirebaseDataMigrator = () => {
  const [diagnosticStatus, setDiagnosticStatus] = useState({
    isRunning: false,
    lastRun: null,
    hasIssues: false,
    issues: [],
    error: null
  });

  const [migrationStatus, setMigrationStatus] = useState({
    isRunning: false,
    lastRun: null,
    changes: [],
    error: null
  });

  const [isRealTimeSyncActive, setIsRealTimeSyncActive] = useState(false);

  /**
   * Run diagnostic check
   */
  const runDiagnostic = useCallback(async () => {
    setDiagnosticStatus(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      const result = await firebaseDataMigrator.diagnoseDataIssues();
      
      setDiagnosticStatus({
        isRunning: false,
        lastRun: new Date(),
        hasIssues: result.hasIssues,
        issues: result.issues || [],
        error: result.error || null
      });

      return result;
    } catch (error) {
      setDiagnosticStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error.message
      }));
      throw error;
    }
  }, []);

  /**
   * Run auto-migration
   */
  const runMigration = useCallback(async () => {
    setMigrationStatus(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      const result = await firebaseDataMigrator.autoMigrateData();
      
      setMigrationStatus({
        isRunning: false,
        lastRun: new Date(),
        changes: result.changes || [],
        error: result.error || null
      });

      // Re-run diagnostic to verify migration
      if (result.success) {
        runDiagnostic();
      }

      return result;
    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error.message
      }));
      throw error;
    }
  }, [runDiagnostic]);

  /**
   * Setup real-time sync
   */
  const setupRealTimeSync = useCallback((callback) => {
    if (isRealTimeSyncActive) {
      console.warn('Real-time sync is already active');
      return null;
    }

    const unsubscribe = firebaseDataMigrator.setupRealTimeSync(callback);
    setIsRealTimeSyncActive(true);

    // Return cleanup function
    return () => {
      unsubscribe();
      setIsRealTimeSyncActive(false);
    };
  }, [isRealTimeSyncActive]);

  /**
   * Auto-diagnostic on mount
   */
  useEffect(() => {
    // Run diagnostic on component mount
    runDiagnostic();
  }, [runDiagnostic]);

  /**
   * Auto-migration if issues are found
   */
  const autoFixIssues = useCallback(async () => {
    if (diagnosticStatus.hasIssues && !migrationStatus.isRunning) {
      console.log('Auto-fixing detected issues...');
      return await runMigration();
    }
    return { success: true, message: 'No issues to fix' };
  }, [diagnosticStatus.hasIssues, migrationStatus.isRunning, runMigration]);

  return {
    // Status
    diagnosticStatus,
    migrationStatus,
    isRealTimeSyncActive,

    // Actions
    runDiagnostic,
    runMigration,
    autoFixIssues,
    setupRealTimeSync,

    // Helper computed properties
    hasIssues: diagnosticStatus.hasIssues,
    isHealthy: !diagnosticStatus.hasIssues && !diagnosticStatus.error,
    needsMigration: diagnosticStatus.hasIssues && diagnosticStatus.issues.length > 0,
    
    // Quick actions
    quickFix: autoFixIssues
  };
};