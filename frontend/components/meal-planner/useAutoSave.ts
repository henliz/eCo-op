import { useEffect, useRef } from 'react';
import { usePlannerStore } from './usePlannerStore';

type APICallFunction = (
  endpoint: string,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: unknown,
  requireAuth?: boolean
) => Promise<unknown>;

/**
 * useAutoSave - App Router version for Next.js 13+
 *
 * Handles saving in these scenarios:
 * 1. 🚪 User leaves site (closes tab, refreshes, types new URL)
 * 2. ⏰ Periodic auto-save every 30 seconds
 * 3. 🎯 Manual trigger when specific actions occur
 */
export function useAutoSave() {
  // Track if we're currently saving to prevent duplicate saves
  const isSavingRef = useRef(false);
  const lastSaveTimeRef = useRef(Date.now());

  // Get the makeAPICall function from the global window object
  const getAPICall = () => (window as typeof window & { __plannerMakeAPICall?: APICallFunction }).__plannerMakeAPICall;

  // Simple save function - no useCallback, no circular dependencies
  const executeSave = async (reason: string) => {
    const makeAPICall = getAPICall();

    // Get fresh hasUnsavedChanges value
    const store = usePlannerStore.getState();
    const hasChanges = store.hasUnsavedChanges();

    // Skip if no API function, already saving, or no changes
    if (!makeAPICall || isSavingRef.current || !hasChanges) {
      console.log(`[AutoSave] Skipping save (${reason}): ${
        !makeAPICall ? 'no API' : isSavingRef.current ? 'already saving' : 'no changes'
      }`);
      return;
    }

    // Don't save too frequently (minimum 5 seconds between saves)
    const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
    if (timeSinceLastSave < 5000) {
      console.log(`[AutoSave] Skipping save (${reason}): too recent (${timeSinceLastSave}ms ago)`);
      return;
    }

    try {
      isSavingRef.current = true;
      console.log(`[AutoSave] Saving (${reason})...`);

      // Use the store's saveUserPlan method
      await store.saveUserPlan(makeAPICall);
      lastSaveTimeRef.current = Date.now();

      console.log(`[AutoSave] ✅ Saved successfully (${reason})`);
    } catch (error) {
      console.error(`[AutoSave] ❌ Save failed (${reason}):`, error);
    } finally {
      isSavingRef.current = false;
    }
  };

  useEffect(() => {
    // 1. 🚪 Handle user leaving the site entirely
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Get fresh hasUnsavedChanges value
      const store = usePlannerStore.getState();
      if (store.hasUnsavedChanges()) {
        // Try to save synchronously (limited time)
        executeSave('beforeunload');

        // Show browser warning if user has unsaved changes
        e.preventDefault();
        e.returnValue = 'You have unsaved meal plan changes.';
        return 'You have unsaved meal plan changes.';
      }
    };

    // 2. ⏰ Periodic auto-save every 30 seconds
    const autoSaveInterval = setInterval(() => {
      executeSave('periodic');
    }, 30000); // 30 seconds

    // Set up event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(autoSaveInterval);

      // Final save on component unmount if needed
      const store = usePlannerStore.getState();
      if (store.hasUnsavedChanges() && !isSavingRef.current) {
        executeSave('component-unmount');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - we want stable event listeners that use fresh closures

  // Return a manual save function for explicit saves
  return {
    saveNow: executeSave,
    isSaving: isSavingRef.current
  };
}