'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StoreSelector from '@/components/meal-planner/StoreSelector';
import { MealPlanScreen } from '@/components/meal-planner/MealPlanScreen';
import { GroceryScreen } from '@/components/meal-planner/GroceryScreen';
import { CookScreen } from '@/components/meal-planner/CookScreen'; // NEW
import { usePlannerStore } from '@/components/meal-planner/usePlannerStore';

type View = 'store' | 'plan' | 'groceries' | 'cook'; // UPDATED

const tabs: { label: string; value: View }[] = [
  { label: '1. Store',    value: 'store' },
  { label: '2. Plan',     value: 'plan' },
  { label: '3. Shop',     value: 'groceries' },
  { label: '4. Cook',     value: 'cook' },        // NEW
];

export default function MealPlannerPage() {
  const [view, setView] = useState<View>('store');
  const { selectedStore, isDataLoaded } = usePlannerStore();

  // Helper to determine if tabs should be enabled
  const isTabEnabled = (tabId: View) => {
    if (tabId === 'store') return true;
    // Other tabs only enabled once store is selected and data is loaded
    return !!selectedStore && isDataLoaded;
  };

  // Handle tab change
  const handleViewChange = (newView: View) => {
    if (isTabEnabled(newView)) {
      setView(newView);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-1 min-h-screen">
        {/* --- OVERSIZED PILL TOGGLE --- */}
        <div className="relative mx-auto mt-2 mb-2 w-full max-w-md h-12">
          <div className="absolute inset-0 bg-teal-100 rounded-full" />
          <div className="absolute inset-0 flex">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleViewChange(tab.value)}
                className={`
                  flex-1 z-10 rounded-full px-4 py-2
                  text-center font-medium transition
                  ${view === tab.value
                    ? 'bg-orange-300 text-white'
                    : 'text-gray-900'}
                  ${!isTabEnabled(tab.value) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
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

        {/* --- Content Panels --- */}
        {view === 'store' && <StoreSelector />}
        {view === 'plan' && isTabEnabled('plan') && <MealPlanScreen />}
        {view === 'groceries' && isTabEnabled('groceries') && <GroceryScreen />}
        {view === 'cook' && isTabEnabled('cook') && <CookScreen />} {/* NEW */}
      </div>

      <Footer />
    </>
  );
}


