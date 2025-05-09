'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StoreSelector from '@/components/meal-planner/StoreSelector';
import { MealPlanScreen } from '@/components/meal-planner/MealPlanScreen';
import { GroceryScreen } from '@/components/meal-planner/GroceryScreen';
import { CookScreen } from '@/components/meal-planner/CookScreen';
import { usePlannerStore } from '@/components/meal-planner/usePlannerStore';

type View = 'store' | 'plan' | 'groceries' | 'cook';

const tabs: { label: string; value: View }[] = [
  { label: '1. Store', value: 'store' },
  { label: '2. Plan', value: 'plan' },
  { label: '3. Shop', value: 'groceries' },
  { label: '4. Cook', value: 'cook' },
];

// Contextual helper text for each step (none for step 1)
const instructions: Record<View, string> = {
  store: '',
  plan: 'Pick some budget‑friendly meals to fill your weekly plan.',
  groceries: 'Review your shopping list and check items off as you go.',
  cook: 'Click on a recipe to follow the steps and enjoy your meals!',
};

export default function MealPlannerPage() {
  const [view, setView] = useState<View>('store');
  const { selectedStore, isDataLoaded, isLoading } = usePlannerStore();

  // Keep track of when we need to navigate to Plan
  const shouldNavigateToPlan = useRef(false);

  // Tabs are only enabled when a store is selected and data is loaded
  // (except for the Store tab which is always enabled)
  const isTabEnabled = (tabId: View) =>
    tabId === 'store' || (!!selectedStore && isDataLoaded);

  const handleViewChange = (newView: View) => {
    if (isTabEnabled(newView)) {
      setView(newView);
    }
  };

  // Auto-switch to Plan tab when store is selected and data is loaded
  useEffect(() => {
    // If we're on the store tab and data is loaded, and we've been flagged to navigate
    if (selectedStore && isDataLoaded && !isLoading && view === 'store' && shouldNavigateToPlan.current) {
      // Reset the flag so we don't keep triggering this
      shouldNavigateToPlan.current = false;

      // Add a small delay to allow the confirmation message to be seen
      const timer = setTimeout(() => {
        setView('plan');
      }, 1);

      return () => clearTimeout(timer);
    }
  }, [selectedStore, isDataLoaded, isLoading, view]);

  return (
    <>
      <Header />

      <div className="container mx-auto p-1 min-h-screen">
        {/* --- 4‑step selector --- */}
        <div className="relative mx-auto mt-2 mb-1 w-full max-w-md h-12">
          <div className="absolute inset-0 bg-teal-100 rounded-full" />
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
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 bg-orange-300 rounded-full"
            style={{
              width: `calc(100% / ${tabs.length})`,
              left: `calc((100% / ${tabs.length}) * ${tabs.findIndex(t => t.value === view)})`,
            }}
          />
        </div>

        {/* --- Instruction card (hidden on step 1) --- */}
        {view !== 'store' && (
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="max-w-md mx-auto mb-0.5 flex items-center justify-center text-center rounded-xl bg-white shadow-md px-4 sm:px-5 py-3 sm:py-4"
          >
            <p className="text-sm sm:text-base text-gray-700 leading-snug">
              {instructions[view]}
            </p>
          </motion.div>
        )}

        {/* --- Content panels --- */}
        {view === 'store' && <StoreSelector shouldNavigateToPlan={shouldNavigateToPlan} />}
        {view === 'plan' && <MealPlanScreen />}
        {view === 'groceries' && <GroceryScreen />}
        {view === 'cook' && <CookScreen />}
      </div>

      <Footer />
    </>
  );
}