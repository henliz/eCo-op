'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ContinuePlanBanner } from '@/components/meal-planner/ContinuePlanBanner';
import StoreSelector from '@/components/meal-planner/StoreSelector';
import { HouseholdSizeSelector } from '@/components/meal-planner/HouseholdSizeSelector';
import { MealPlanScreen } from '@/components/meal-planner/MealPlanScreen';
import { GroceryScreen } from '@/components/meal-planner/GroceryScreen';
import { CookScreen } from '@/components/meal-planner/CookScreen';
import { usePlannerStores as usePlannerStore , getPlannerStores} from '@/stores';
import LoadingScreen from '@/components/meal-planner/LoadingScreen';
import { useAppDataLoader } from '@/hooks/useAppDataLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreLocationStore } from "@/stores";


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

type View = 'set' | 'plan' | 'shop' | 'cook' | 'loading'; // Add loading as a view type

const tabs: { label: string; value: View }[] = [
  { label: '1-Set', value: 'set' },
  { label: '2-Plan', value: 'plan' },
  { label: '3-Shop', value: 'shop' },
  { label: '4-Cook', value: 'cook' },
];

// Contextual helper text for each step
const instructions: Record<Exclude<View, 'loading'>, React.ReactNode> = {
  set: 'Please select a store and set your household size to continue.',
  plan: 'Select recipes by clicking on them. Deals tally flyer items where $ savings are advertised.',
  shop: (
    <span>
      Pink items are used in very small quantities.<br></br>Click <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom mx-0.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> for any you already have at home. <br></br>Use <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom mx-0.5"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg> when you add items to your cart.
    </span>
  ),
  cook: 'Click on a recipe to see the cooking instructions.',
};

// Smart tab selection logic
function getSmartDefaultTab(args: {
  hasStore: boolean;
  normalMealServings?: number;
  mealCount: number;
  uncheckedItems: number;
}): View {

  const { hasStore, normalMealServings, mealCount, uncheckedItems } = args;
  if (!hasStore || !normalMealServings) return 'set';
  if (mealCount === 0) return 'plan';
  const allAcquired = uncheckedItems === 0;
  return allAcquired ? 'cook' : 'shop';
}

export default function MealPlannerPage() {

  const { makeAPICall, currentUser } = useAuth();
  const searchParams = useSearchParams();
  const { loadData, isLoaded } = useAppDataLoader();
  const plannerStore = usePlannerStore();
  const { getSelectedStore, isDataLoaded, isLoading, clearMealData } = plannerStore;

  const selectedStoreObject = getSelectedStore();
  // Ensure we clear only once even if effects re-run
  const clearedForNewRef = useRef(false);
  // Get the clearer from the planner stores hook

  // --- NEW: pull store state & actions
  const {
    isStoresLoaded,
    discoverStores,
    setSelectedStore,
  } = useStoreLocationStore();

  useEffect(() => {
    // --- NEW: honor ?mode=new to avoid loading a saved plan
      const mode = searchParams.get('mode');
      if (currentUser && !isLoaded && mode !== 'new') {
        loadData('auto');
      }
  }, [currentUser, isLoaded, loadData, searchParams]);

  // --- NEW: if mode=new, clear any existing plan once
  useEffect(() => {
    const mode = searchParams.get('mode'); // ← correct variable name
    if (mode === 'new' && !clearedForNewRef.current) {
      try {
        clearMealData(); // ← use the hook method
        clearedForNewRef.current = true;
        const hasStore = !!selectedStoreObject;
        const hasServings = !!plannerStore.normalMealServings;
        setView(hasStore && hasServings ? 'plan' : 'set');
        setInitialTabSet(true); // block smart chooser
      } catch (e) {
        console.warn('[Planner] clearMealData failed:', e);
      }
    }
  }, [searchParams, clearMealData, selectedStoreObject, plannerStore]);

  // --- NEW: ensure the store index exists on hard loads / direct visits
  useEffect(() => {
    if (!isStoresLoaded) {
      void discoverStores();
    }
  }, [isStoresLoaded, discoverStores]);

  // --- NEW: set the store from the URL once stores are available
  useEffect(() => {
    const id = searchParams.get('storeId');
    if (id && isStoresLoaded && id !== selectedStoreObject?.id) {
      setSelectedStore(id);
    }
  }, [searchParams, isStoresLoaded, setSelectedStore, selectedStoreObject?.id]);

  // Expose makeAPICall to the store via window
  useEffect(() => {
    window.__plannerMakeAPICall = makeAPICall;
    return () => {
      delete window.__plannerMakeAPICall;
    };
  }, [makeAPICall]);

  const [showLoading, setShowLoading] = useState(false);
  const hasTransitionedToPlan = useRef(false);

  // Initialize view state but don't set it yet - we'll determine it after data loads
  const [view, setView] = useState<View>('set'); // Default fallback
  const [initialTabSet, setInitialTabSet] = useState(false);

  // Keep track of when we need to navigate to Plan
  const shouldNavigateToPlan = useRef(false);

  // Check URL parameter immediately on mount (don't wait for data)
  useEffect(() => {
    if (!initialTabSet) {
      const urlTab = searchParams.get('tab') as View;

      if (urlTab && ['set', 'plan', 'shop', 'cook'].includes(urlTab)) {
         const hasStore = !!selectedStoreObject;
         const hasServings = !!plannerStore.normalMealServings;
         const needsSetup = !hasStore || !hasServings;
         const coerced = (urlTab !== 'set' && needsSetup) ? 'set' : urlTab;
         setView(coerced as View);
         setInitialTabSet(true);
         return;
      }
    }
  }, [searchParams, initialTabSet, selectedStoreObject, plannerStore]);

  const urlTab = (searchParams.get('tab') || '').toLowerCase();
  const hasUrlTab = urlTab === 'set' || urlTab === 'plan' || urlTab === 'shop' || urlTab === 'cook';
  const mode = (searchParams.get('mode') || '').toLowerCase();

  const mealCount = plannerStore.selectedRecipes().length;
  const uncheckedItems = plannerStore.groceryTotals().uncheckedItems;
  useEffect(() => {
    if (hasUrlTab || mode === 'new') return; // <-- hard stop: do not override explicit URL or new-plan flow
    if (!initialTabSet && isDataLoaded && !isLoading) {
      const selectedTab = getSmartDefaultTab({
        hasStore: !!selectedStoreObject,
        normalMealServings: plannerStore.normalMealServings,
        mealCount,
        uncheckedItems,
      });
      setView(selectedTab);
      setInitialTabSet(true);
    }
  }, [
    hasUrlTab,
    mode,
    initialTabSet,
    isDataLoaded,
    isLoading,
    selectedStoreObject,
    plannerStore,
    plannerStore.normalMealServings,
    mealCount,
    uncheckedItems,
  ]);

  // Tabs are only enabled when a store is selected and data is loaded
  const isTabEnabled = (tabId: View) =>
    tabId === 'set' || !!selectedStoreObject;

  // Enhanced scroll to top function that ensures consistent behavior
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle view changes and scroll to top when switching views
  const handleViewChange = (newView: View) => {
    if (isTabEnabled(newView)) {
      // SAVE BEFORE SWITCHING TABS - BUT ONLY IF AUTHENTICATED
      const store = getPlannerStores();
      if (store.hasUnsavedChanges() &&
          window.__plannerMakeAPICall &&
          currentUser) { // Add authentication check
        console.log(`[TabChange] Saving before switching to ${newView}`);
        store.saveUserPlan(window.__plannerMakeAPICall).catch((error: unknown) => {
          console.error('[TabChange] Save failed:', error);
        });
      }
      scrollToTop();
      setView(newView);
    }
  };

  // Track loading progress and switch to plan view at 40%
  const handleLoadingProgress = useCallback((progress: number) => {
    // When we reach 40% and haven't transitioned yet, switch to plan view in the background
    if (progress >= 40 && !hasTransitionedToPlan.current) {
      hasTransitionedToPlan.current = true;

      // Use setTimeout to avoid React's "Cannot update a component while rendering a different component" error
      setTimeout(() => {
        setView('plan');
      }, 0);
    }
  }, []);

  // Track when loading animation completes
  const handleLoadingComplete = useCallback(() => {

    // Start the fade out of the loading screen
    setTimeout(() => {
      setShowLoading(false);
      // Reset the transition flag when loading is completely done
      hasTransitionedToPlan.current = false;
    }, 300);
  }, []);

  // Modified auto-switch to show loading screen when store is selected
  useEffect(() => {
    if (selectedStoreObject && view === 'set' && shouldNavigateToPlan.current) {
      shouldNavigateToPlan.current = false;
      hasTransitionedToPlan.current = false;
      setShowLoading(true);
    }
  }, [selectedStoreObject, view]); // Minimal dependencies

  // Add an effect to ensure scroll to top specifically when switching to shop view
  useEffect(() => {
    if (view === 'shop') {
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
        {/* --- 4-step selector --- */}
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
      {view === 'set' && (
        <>
          <ContinuePlanBanner onContinue={() => handleViewChange('plan')} />
          <HouseholdSizeSelector />
          <StoreSelector shouldNavigateToPlan={shouldNavigateToPlan} />
        </>
      )}
      {view === 'plan' && <MealPlanScreen />}
      {view === 'shop' && <GroceryScreen />}
      {view === 'cook' && <CookScreen />}
    </div>

    {/* Footer with lower z-index than the summary bar */}
    <div className="relative z-0">
      <Footer />
    </div>

  </>
); // Closing parenthesis for return statement
}