// frontend/hooks/usePlannerSync.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlannerStores as usePlannerStore } from '@/stores/usePlannerStores';

// Create a makeAPICall function that mirrors your AuthContext logic
const createAPICall = (accessToken: string | null) => {
  return async (endpoint: string, method = 'GET', body?: any, useAuth = false) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (useAuth && accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      method,
      headers,
      mode: 'cors',
      credentials: 'include'
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  };
};

export const usePlannerSync = () => {
  const { currentUser, accessToken } = useAuth();
  const {
    loadUserPlan,
    saveUserPlan,
    deleteUserPlan,
    isSyncing,
    lastSyncError
  } = usePlannerStore();

  // Prevent infinite loading
  const [hasLoadedPlan, setHasLoadedPlan] = useState(false);

  // Create wrapper functions with useCallback to prevent recreation
  const loadPlan = useCallback(async () => {
    if (!currentUser || !accessToken) return;
    const makeAPICall = createAPICall(accessToken);
    await loadUserPlan(makeAPICall);
  }, [currentUser, accessToken, loadUserPlan]);

  const savePlan = useCallback(async () => {
    if (!currentUser || !accessToken) return;
    const makeAPICall = createAPICall(accessToken);
    await saveUserPlan(makeAPICall);
  }, [currentUser, accessToken, saveUserPlan]);

  const deletePlan = useCallback(async () => {
    if (!currentUser || !accessToken) return;
    const makeAPICall = createAPICall(accessToken);
    await deleteUserPlan(makeAPICall);
  }, [currentUser, accessToken, deleteUserPlan]);

  // Auto-load user plan when they log in (only once)
  useEffect(() => {
    if (currentUser?.uid && accessToken && !hasLoadedPlan) {
      console.log('[usePlannerSync] Auto-loading user plan for:', currentUser.email);
      setHasLoadedPlan(true);
      loadPlan().catch((error) => {
        console.warn('[usePlannerSync] Auto-load failed (user might not have a saved plan):', error);
        // Don't reset hasLoadedPlan on error - we still tried to load
      });
    }
  }, [currentUser?.uid, accessToken, hasLoadedPlan]); // Removed loadPlan from dependencies

  // Reset hasLoadedPlan when user changes (logout/login)
  useEffect(() => {
    if (!currentUser?.uid) {
      setHasLoadedPlan(false);
    }
  }, [currentUser?.uid]);

  return {
    loadPlan,
    savePlan,
    deletePlan,
    isSyncing,
    lastSyncError,
    isAuthenticated: !!currentUser,
    userId: currentUser?.uid,
    hasLoadedPlan, // Expose this for debugging
  };
};