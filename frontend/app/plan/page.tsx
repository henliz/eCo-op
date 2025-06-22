'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ContinuePlanBanner } from '@/components/meal-planner/ContinuePlanBanner';
import StoreSelector from '@/components/meal-planner/StoreSelector';
import { HouseholdSizeSelector } from '@/components/meal-planner/HouseholdSizeSelector';
import { MealPlanScreen } from '@/components/meal-planner/MealPlanScreen';
import { GroceryScreen } from '@/components/meal-planner/GroceryScreen';
import { CookScreen } from '@/components/meal-planner/CookScreen';
import { usePlannerStore } from '@/components/meal-planner/usePlannerStore';
import LoadingScreen from '@/components/meal-planner/LoadingScreen';

// Add these imports for testing
import { usePlannerSync } from '@/hooks/usePlannerSync';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    __plannerMakeAPICall?: (
      endpoint: string,
      method?: 'GET' | 'PUT' | 'DELETE',
      body?: unknown,
      useAuth?: boolean
    ) => Promise<unknown>;
  }
}

type View = 'store' | 'plan' | 'groceries' | 'cook' | 'loading'; // Add loading as a view type

const tabs: { label: string; value: View }[] = [
  { label: '1-Set', value: 'store' },
  { label: '2-Plan', value: 'plan' },
  { label: '3-Shop', value: 'groceries' },
  { label: '4-Cook', value: 'cook' },
];

// Contextual helper text for each step
const instructions: Record<Exclude<View, 'loading'>, React.ReactNode> = {
  store: 'Please select a store and set your household size to continue.',
  plan: 'Select recipes by clicking on them. Deals tally flyer items where $ savings are advertised.',
  groceries: (
    <span>
      Pink items are used in very small quantities.<br></br>Click <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom mx-0.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> for any you already have at home. <br></br>Use <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom mx-0.5"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg> when you add items to your cart.
    </span>
  ),
  cook: 'Click on a recipe to see the cooking instructions.',
};

// Development sync test component
function SyncTestButtons() {
  const { currentUser } = useAuth();
  const {
    loadPlan,
    savePlan,
    deletePlan,
    isSyncing,
    lastSyncError,
    isAuthenticated
  } = usePlannerSync();

  const {
    normalMealServings,
    selectedStore,
    selectedRecipes,
    planId,
    version,
    setNormalMealServings
  } = usePlannerStore();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleAddTestData = () => {
    setNormalMealServings(6);
    // Note: We can't easily add test meals here since they need to exist in the store
    // But changing household size is enough to test the sync
  };

  const handleClearData = () => {
    setNormalMealServings(4);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-red-100 border border-red-300 rounded-lg p-2 text-xs">
        <p className="text-red-700">Dev: Please log in to test sync</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-50 border border-blue-300 rounded-lg p-3 text-xs z-30">
      <div className="mb-2">
        <strong>Dev Sync Test</strong> | API: {API_BASE_URL} | User: {currentUser?.email}
      </div>

      <div className="mb-2 text-xs">
        Household: {normalMealServings} | Store: {selectedStore || 'None'} | Meals: {selectedRecipes().length} | Plan: {planId ? `v${version}` : 'None'}
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={handleAddTestData}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Test Data
        </button>
        <button
          onClick={handleClearData}
          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
        >
          Clear
        </button>
        <button
          onClick={loadPlan}
          disabled={isSyncing}
          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
        >
          {isSyncing ? 'Loading...' : 'Load'}
        </button>
        <button
          onClick={savePlan}
          disabled={isSyncing}
          className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50"
        >
          {isSyncing ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={deletePlan}
          disabled={isSyncing}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50"
        >
          {isSyncing ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {lastSyncError && (
        <div className="mt-2 p-1 bg-red-100 border border-red-200 rounded text-red-700">
          Error: {lastSyncError}
        </div>
      )}
    </div>
  );
}

export default function MealPlannerPage() {
  const { makeAPICall } = useAuth(); // Get the API function

  // Expose makeAPICall to the store via window
  useEffect(() => {
    window.__plannerMakeAPICall = makeAPICall;

    // Cleanup on unmount
    return () => {
      delete window.__plannerMakeAPICall;
    };
  }, [makeAPICall]);

  const [view, setView] = useState<View>('store');
  const { selectedStore, isDataLoaded, isLoading } = usePlannerStore();
  const [showLoading, setShowLoading] = useState(false);
  const hasTransitionedToPlan = useRef(false);

  // Keep track of when we need to navigate to Plan
  const shouldNavigateToPlan = useRef(false);

  // Tabs are only enabled when a store is selected and data is loaded
  // (except for the Store tab which is always enabled)
  const isTabEnabled = (tabId: View) =>
    tabId === 'store' || (!!selectedStore && isDataLoaded);

  // Enhanced scroll to top function that ensures consistent behavior
  const scrollToTop = useCallback(() => {
    // First try the smooth scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // As a fallback, also set a timeout to ensure the scroll happens
    // This helps in cases where the smooth scroll might be interrupted
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 100);
  }, []);

  // Handle view changes and scroll to top when switching views
  const handleViewChange = (newView: View) => {
    if (isTabEnabled(newView)) {
      // Set the view first
      setView(newView);

      // Then scroll to top
      scrollToTop();
    }
  };

  // Track loading progress and switch to plan view at 40%
  const handleLoadingProgress = useCallback((progress: number) => {
    // When we reach 40% and haven't transitioned yet, switch to plan view in the background
    if (progress >= 40 && !hasTransitionedToPlan.current) {
      console.log("Loading reached 40%, switching to plan view in background");
      hasTransitionedToPlan.current = true;

      // Use setTimeout to avoid React's "Cannot update a component while rendering a different component" error
      setTimeout(() => {
        setView('plan');
      }, 0);
    }
  }, []);

  // Track when loading animation completes
  const handleLoadingComplete = useCallback(() => {
    console.log("Loading complete callback triggered");

    // Start the fade out of the loading screen
    setTimeout(() => {
      setShowLoading(false);
      // Reset the transition flag when loading is completely done
      hasTransitionedToPlan.current = false;
    }, 300);
  }, []);

  // Modified auto-switch to show loading screen when store is selected
  useEffect(() => {
    // If we're on the store tab and data is loaded, and we've been flagged to navigate
    if (selectedStore && isDataLoaded && !isLoading && view === 'store' && shouldNavigateToPlan.current) {
      console.log("Store selected, showing loading screen");

      // Reset the flag so we don't keep triggering this
      shouldNavigateToPlan.current = false;

      // Reset transition flag for the new loading screen
      hasTransitionedToPlan.current = false;

      // First show the loading screen overlay
      setShowLoading(true);

      // AFTER a tiny delay, set the view to plan behind the loading screen
      // The switch to 'plan' will happen at 40% progress via the handleLoadingProgress callback
    }
  }, [selectedStore, isDataLoaded, isLoading, view]);

  // Add an effect to ensure scroll to top specifically when switching to groceries view
  useEffect(() => {
    if (view === 'groceries') {
      // Ensure we're at the top when the groceries view is active
      scrollToTop();
    }
  }, [view, scrollToTop]);

return (
  <>
    {/* Loading screen overlay - always in DOM but conditionally visible */}
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-700 ease-in-out ${showLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {showLoading && <LoadingScreen onComplete={handleLoadingComplete} onProgress={handleLoadingProgress} />}
    </div>

    {/* Fixed Header */}
    <Header />

    {/* Sticky tabs section - positioned right below the header */}
    <div className="sticky top-14 left-0 right-0 z-40">
      <div className="container mx-auto p-1">
        {/* --- 4‑step selector --- */}
        <div className="relative mx-auto mt-0 mb-1 w-full max-w-md h-12">
          <div className="absolute inset-0 bg-teal-100 rounded-full"/>
          <div className="absolute inset-0 flex">
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => handleViewChange(tab.value)}
                    className={`flex-1 z-10 rounded-full px-4 py-2 text-center font-medium transition
                  ${view === tab.value ? 'bg-orange-300 text-white' : 'text-gray-900'}
                  ${!isTabEnabled(tab.value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isTabEnabled(tab.value)}
                >
                  {tab.label}
                </button>
            ))}
          </div>
          <motion.div
              layoutId="tabHighlight"
              transition={{type: 'spring', stiffness: 300, damping: 30}}
              className="absolute inset-0 bg-orange-300 rounded-full"
              style={{
                width: `calc(100% / ${tabs.length})`,
                left: `calc((100% / ${tabs.length}) * ${tabs.findIndex(t => t.value === view)})`,
              }}
          />
        </div>
      </div>
    </div>

    {/* Content section */}
    <div className="container mx-auto p-1 min-h-screen">
      {/* --- Instruction card (part of scrollable content) --- */}
      <div
        className="max-w-md mx-auto mb-1 rounded-lg bg-orange-50 shadow-sm px-4 flex py-1"
        style={{ minHeight: "28px" }}
      >
        <div className="self-center flex items-start w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 text-amber-500 flex-shrink-0 mt-0.5"
          >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
          </svg>
          <span className="text-sm text-gray-700 italic inline-block align-middle">
            {instructions[view as Exclude<View, 'loading'>]}
          </span>
        </div>
      </div>

      {/* --- Content panels --- */}
      {view === 'store' && (
        <>
          <ContinuePlanBanner onContinue={() => handleViewChange('plan')} />
          <HouseholdSizeSelector />
          <StoreSelector shouldNavigateToPlan={shouldNavigateToPlan} />
        </>
      )}
      {view === 'plan' && <MealPlanScreen />}
      {view === 'groceries' && <GroceryScreen />}
      {view === 'cook' && <CookScreen />}
    </div>

    {/* Footer with lower z-index than the summary bar */}
    <div className="relative z-0">
      <Footer />
    </div>

    {/* Development sync test buttons - only visible in development */}
    <SyncTestButtons />
  </>
); // Closing parenthesis for return statement
}