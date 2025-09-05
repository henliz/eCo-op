// frontend/hooks/useAppDataLoader.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlannerStores } from '@/stores/usePlannerStores';

export const useAppDataLoader = () => {
  const { makeAPICall } = useAuth();
  const { loadUserPlan, discoverStores, isStoresLoaded } = usePlannerStores();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async (intent: 'auto' | 'continue' | 'new') => {
    // Prevent multiple concurrent loads
    if (isLoading) {
      console.log('[AppDataLoader] Already loading, skipping');
      return;
    }

    console.log('[AppDataLoader] loadData called with intent:', intent);

    // Check for skip flags first
    const skipAutoLoad = sessionStorage.getItem('skipAutoLoad');
    const skipFlag = sessionStorage.getItem('skipFlag');

    if (intent === 'auto' && (skipAutoLoad || skipFlag)) {
      console.log('[AppDataLoader] Skip flag detected, removing and skipping load');
      // DON'T remove the flag immediately - let it persist for multiple mounts
      // sessionStorage.removeItem('skipAutoLoad');
      // sessionStorage.removeItem('skipFlag');

      // Instead, mark this loader instance as skipped and set timeout to clean up
      setIsLoaded(true);

      // Clean up flags after all mounts are likely complete (2 seconds)
      setTimeout(() => {
        sessionStorage.removeItem('skipAutoLoad');
        sessionStorage.removeItem('skipFlag');
        console.log('[AppDataLoader] Skip flags cleaned up after timeout');
      }, 2000);

      return;
    }

    console.log('[AppDataLoader] No skip flags, proceeding with load. Intent:', intent);

    if (intent === 'new') {
      console.log('[AppDataLoader] New plan requested - marking as loaded without loading');
      setIsLoaded(true);
      return;
    }

    if (!makeAPICall) {
      console.log('[AppDataLoader] No makeAPICall available, cannot load');
      setIsLoaded(true); // Mark as loaded to prevent infinite retries
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      setError(null);

      // STEP 1: Ensure stores are discovered first
      if (!isStoresLoaded) {
        console.log('[AppDataLoader] Discovering stores before loading user plan...');
        await discoverStores();
        console.log('[AppDataLoader] Store discovery completed');
      } else {
        console.log('[AppDataLoader] Stores already loaded, skipping discovery');
      }

      // STEP 2: Now load the user plan (which will set selectedStore)
      console.log('[AppDataLoader] Loading saved user plan');
      await loadUserPlan(makeAPICall);

      console.log('[AppDataLoader] Data loading completed successfully');

    } catch (err) {
      console.error('[AppDataLoader] Error loading data:', err);
      setHasError(true);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setIsLoaded(true); // Always mark as loaded to prevent infinite loops
    }
  }, [makeAPICall, loadUserPlan, discoverStores, isStoresLoaded]);

  return {
    loadData,
    isLoaded,
    isLoading,
    hasError,
    error
  };
};