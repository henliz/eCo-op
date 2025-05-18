'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StoreSelector from '@/components/meal-planner/StoreSelector';
import { HouseholdSizeSelector } from '@/components/meal-planner/HouseholdSizeSelector';
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

// Contextual helper text for each step
const instructions: Record<View, string> = {
  store: 'Please select a store and set your household size to continue.',
  plan: 'Select recipes by clicking on them. Deals tally flyer items where $ savings are quantified.',
  groceries: 'Items with pink background are pantry staples: Check if you have these before buying. Recipes only need a small portion.',
  cook: 'Click on a recipe to see the cooking instructions.',
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

  // Handle view changes and scroll to top when switching views
  const handleViewChange = (newView: View) => {
    if (isTabEnabled(newView)) {
      // Scroll to top when changing views
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        // Scroll to top before changing view
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setView('plan');
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [selectedStore, isDataLoaded, isLoading, view]);

return (
  <>
    {/* Fixed Header */}
    <Header />

    {/* Sticky tabs section - positioned right below the header */}
    <div className="sticky top-14 left-0 right-0 bg-white z-20 shadow-sm">
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



    {/* Content section without the extra padding-top since we have the spacer */}
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
            {instructions[view]}
          </span>
        </div>
      </div>

      {/* --- Content panels --- */}
      {view === 'store' && (
        <>
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
  </>
); // Closing parenthesis for return statement
} // Closing brace for MealPlannerPage function