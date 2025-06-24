import React, { useEffect, useState } from 'react';
import { usePlannerStore } from './usePlannerStore';
import { useAuth } from '@/contexts/AuthContext';

interface ContinuePlanProps {
  onContinue: () => void; // Callback to jump to plan tab
}

export const ContinuePlanBanner: React.FC<ContinuePlanProps> = ({ onContinue }) => {
  const { makeAPICall } = useAuth();
  const {
    loadUserPlan,
    selectedStore,
    normalMealServings,
    lastSynced,
    planId,
    availableStores,
    isSyncing,
    selectedRecipes  // ← Move this here with other store hooks
  } = usePlannerStore();

  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [loadComplete, setLoadComplete] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check if plan is already loaded, or attempt to load
  useEffect(() => {
    const checkOrLoad = async () => {
      if (!hasAttemptedLoad) {
        setHasAttemptedLoad(true);

        // First check if we already have a plan loaded
        const currentlyHasValidPlan = planId && selectedStore && lastSynced;

        if (currentlyHasValidPlan) {
          console.log('[ContinuePlan] Plan already loaded, skipping load attempt');
          setLoadComplete(true);
          return;
        }

        // Only attempt to load if we don't have a plan and we have makeAPICall
        if (makeAPICall) {
          try {
            console.log('[ContinuePlan] Attempting to load user plan...');
            await loadUserPlan(makeAPICall);
            console.log('[ContinuePlan] Load completed successfully');
            setLoadComplete(true);
          } catch (error) {
            console.log('[ContinuePlan] No existing plan found or load failed:', error);
            setLoadError('No plan found');
            setLoadComplete(true);
          }
        } else {
          // No makeAPICall available, just mark as complete
          console.log('[ContinuePlan] No makeAPICall available, marking as complete');
          setLoadComplete(true);
        }
      }
    };

    checkOrLoad();
  }, [makeAPICall, hasAttemptedLoad, loadUserPlan, planId, selectedStore, lastSynced]);

  // Don't render anything until load attempt is complete
  if (!loadComplete || isSyncing) {
    return (
      <div className="bg-white rounded-xl py-4 px-5 mb-1 shadow-sm">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500 mr-3"></div>
          <span className="text-sm text-gray-700">Checking for saved plan...</span>
        </div>
      </div>
    );
  }

  // Now check if we have a valid plan (after load is complete)
  // A plan is "continuable" if we have a store, recent sync, and some meal data
  const recipes = selectedRecipes();
  const hasValidPlan = selectedStore && lastSynced && recipes.length > 0;

  // Get store display info
  const storeInfo = hasValidPlan
    ? availableStores.find(s => s.id === selectedStore)
    : null;

  // Format the last sync date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleContinue = () => {
    console.log('[ContinuePlan] Continuing with existing plan');
    onContinue(); // Jump to plan tab
  };

  // Log the current state for debugging
  console.log('[ContinuePlan] Current state:', {
    hasValidPlan,
    planId,
    selectedStore,
    lastSynced,
    storeInfo: storeInfo?.name,
    loadComplete,
    loadError,
    recipesCount: recipes.length
  });

  if (hasValidPlan && storeInfo) {
    return (
      <div className="bg-white rounded-xl py-4 px-5 mb-1 shadow-sm">
        <div className="flex items-stretch gap-6">
          {/* Robot mascot - left side */}
          <div className="flex-shrink-0 flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Robo_Plan.png"
              alt="Plan Robot"
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Content - right side */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                Your Last Plan
              </h3>
              <div className="bg-teal-100 w-10 h-10 flex items-center justify-center rounded-lg">
                <span className="text-lg">📋</span>
              </div>
            </div>

            {/* Plan details */}
            <div className="mb-3 flex-1">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">{storeInfo.name}</span>, {storeInfo.location}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(lastSynced!)} • {normalMealServings} people • {recipes.length} meals selected
              </p>
            </div>

            {/* Button */}
            <button
              onClick={handleContinue}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <span className="mr-2">🚀</span>
              Continue this plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No plan found or error
  return (
    <div className="bg-white rounded-xl py-4 px-5 mb-1 shadow-sm">
      <div className="flex items-stretch gap-6">
        {/* Robot mascot - left side (grayed out) */}
        <div className="flex-shrink-0 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Robo_Plan.png"
            alt="Plan Robot"
            className="w-24 h-24 object-contain opacity-30"
          />
        </div>

        {/* Content - right side */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              No Current Plan
            </h3>
            <div className="bg-gray-100 w-10 h-10 flex items-center justify-center rounded-lg">
              <span className="text-lg opacity-50">📋</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-3 flex-1">
            <p className="text-sm text-gray-600">
              Start fresh by selecting your household size and store below
            </p>
          </div>

          {/* Disabled button */}
          <button
            disabled
            className="w-full bg-gray-200 text-gray-400 font-medium py-2.5 px-4 rounded-lg cursor-not-allowed flex items-center justify-center"
          >
            <span className="mr-2 opacity-50">📋</span>
            Continue this plan
          </button>
        </div>
      </div>
    </div>
  );
};