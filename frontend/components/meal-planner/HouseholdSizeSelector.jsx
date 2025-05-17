'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Users } from 'lucide-react';
import { usePlannerStore } from './usePlannerStore';

export function HouseholdSizeSelector() {
  // Access just what we need from the store
  const normalMealServings = usePlannerStore(state => state.normalMealServings);
  const setNormalMealServings = usePlannerStore(state => state.setNormalMealServings);

  // Get recipes and multipliers
  const selectedMeals = usePlannerStore(state => state.selectedMeals);
  const recipeMultipliers = usePlannerStore(state => state.recipeMultipliers);
  const setRecipeMultiplier = usePlannerStore(state => state.setRecipeMultiplier);
  const meals = usePlannerStore(state => state.meals);

  // Use a ref to track previous household size to avoid unnecessary updates
  const prevSizeRef = useRef(normalMealServings);

  // Flag to prevent updates on initial mount
  const initialMountRef = useRef(true);

  // Effect to update recipe multipliers when household size changes
  useEffect(() => {
    // Skip the effect on initial mount
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    // Only run this effect if the household size has actually changed
    if (prevSizeRef.current === normalMealServings) {
      return;
    }

    // Update the previous size ref
    prevSizeRef.current = normalMealServings;

    // Get all selected recipes
    const allMeals = [
      ...meals.breakfast,
      ...meals.lunch,
      ...meals.dinner
    ];

    // Only update recipes that need updating to avoid infinite loops
    Array.from(selectedMeals).forEach(url => {
      const recipe = allMeals.find(r => r.url === url);
      if (recipe) {
        // Calculate what the multiplier should be based on household size
        const calculatedMultiplier = Math.ceil(normalMealServings / recipe.servings * 2) / 2;
        const currentMultiplier = recipeMultipliers[url] || 0;

        // Only update if the calculated multiplier is different from current
        if (Math.abs(calculatedMultiplier - currentMultiplier) > 0.01) {
          setRecipeMultiplier(url, calculatedMultiplier);
        }
      }
    });
  }, [normalMealServings, meals, selectedMeals, recipeMultipliers, setRecipeMultiplier]);

  // Simple increment/decrement handlers
  const decrement = () => {
    if (normalMealServings <= 1) return;
    setNormalMealServings(Math.max(1, normalMealServings - 1));
  };

  const increment = () => {
    setNormalMealServings(Math.min(12, normalMealServings + 1));
  };

  return (
    <Card className="bg-white shadow-sm max-w-md mx-auto mb-6">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-teal-600" />
            <h3 className="font-medium text-lg">Household Size</h3>
          </div>

          <p className="text-sm text-gray-600 text-center mb-4">
            How many people will you be cooking for?
          </p>

          <div className="flex items-center justify-center">
            <button
              onClick={decrement}
              className="bg-gray-200 hover:bg-gray-300 w-12 h-12 flex items-center justify-center rounded-l-lg text-gray-700"
              disabled={normalMealServings <= 1}
            >
              <Minus size={20} />
            </button>

            <div
              className="w-20 h-12 flex items-center justify-center font-bold text-2xl bg-teal-100"
            >
              {normalMealServings}
            </div>

            <button
              onClick={increment}
              className="bg-gray-200 hover:bg-gray-300 w-12 h-12 flex items-center justify-center rounded-r-lg text-gray-700"
              disabled={normalMealServings >= 12}
            >
              <Plus size={20} />
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            All recipes will be scaled to serve {normalMealServings} people
          </p>
        </div>
      </CardContent>
    </Card>
  );
}