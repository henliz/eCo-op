// app/plan/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import Header from '@/components/layout/Header';
import StoreSelector from '@/components/meal-planner/StoreSelector';
import { MealPlanScreen } from '@/components/meal-planner/MealPlanScreen';
import { GroceryScreen } from '@/components/meal-planner/GroceryScreen';

type View = 'store' | 'plan' | 'groceries';

const tabs: { label: string; value: View }[] = [
  { label: '1. Select Store', value: 'store' },
  { label: '2. Pick Meals',   value: 'plan' },
  { label: '3. Buy Groceries', value: 'groceries' },
];

export default function MealPlannerPage() {
  const [view, setView] = useState<View>('store');

  return (
    <>
      <Header />
      <small><br></br></small>

      <div className="container mx-auto p-4 min-h-screen">
        {/* --- OVERSIZED PILL TOGGLE --- */}
        <div className="relative mx-auto mb-8 w-full max-w-md h-12">
          {/* background track */}
          <div className="absolute inset-0 bg-teal-100 rounded-full" />

          {/* buttons */}
          <div className="absolute inset-0 flex">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setView(tab.value)}      // no more `as any`
                className={`
                  flex-1 z-10 rounded-full px-4 py-2
                  text-center font-medium transition
                  ${view === tab.value
                    ? 'bg-orange-300 text-white'
                    : 'text-gray-900'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* sliding highlight */}
          <motion.div
            layoutId="tabHighlight"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 bg-orange-300 rounded-full"
            style={{
              width: `calc(100% / ${tabs.length})`,
              left:  `calc((100% / ${tabs.length}) * ${tabs.findIndex(t => t.value === view)})`,
            }}
          />
        </div>
        <small><br></br></small>
        {/* --- Content Panels --- */}
        {view === 'store'     && <StoreSelector />}
        {view === 'plan'      && <MealPlanScreen />}
        {view === 'groceries' && <GroceryScreen />}
      </div>
    </>
  );
}

