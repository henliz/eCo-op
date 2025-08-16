// hooks/usePreferences.ts
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferencesStore } from '@/stores/useUserPreferencesStore';

export const usePreferences = () => {
  const { currentUser, makeAPICall } = useAuth();
  const preferencesData = useUserPreferencesStore(state => state.preferences);
  const preferencesLoading = useUserPreferencesStore(state => state.loading);
  const subscriptionLimits = useUserPreferencesStore(state => state.subscriptionLimits);
  const loadPreferences = useUserPreferencesStore(state => state.loadPreferences);
  const loadSubscriptionLimits = useUserPreferencesStore(state => state.loadSubscriptionLimits);
  const getPreferencesSummary = useUserPreferencesStore(state => state.getPreferencesSummary);

  useEffect(() => {
    if (currentUser && makeAPICall && preferencesData === null && !preferencesLoading) {
      // Load both preferences and subscription limits
      loadPreferences(makeAPICall).catch(console.error);

      // Also load subscription limits if not already loaded
      if (!subscriptionLimits) {
        loadSubscriptionLimits(makeAPICall).catch(console.error);
      }
    }
  }, [currentUser, makeAPICall, preferencesData, preferencesLoading, subscriptionLimits, loadPreferences, loadSubscriptionLimits]);

  return {
    preferencesData,
    preferencesLoading,
    subscriptionLimits,
    subscriptionTier: subscriptionLimits?.tier || 'free',
    summary: getPreferencesSummary()
  };
};