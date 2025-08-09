'use client';

import React, { useState } from 'react';
import { type Recipe, type MealCategory } from '@/stores/usePlannerStores';
import { usePlannerStores as usePlannerStore } from '@/stores/usePlannerStores';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MealCard } from './MealCard';

export function MealPlanScreen() {
  // Lift collapsible state up to the parent component
  const [openSections, setOpenSections] = useState({
    breakfast: true,
    lunch: true,
    dinner: true
  });

  // UPDATED: Use simplified store - no more separate selection state
  //const meals               = usePlannerStore(s => s.meals);
  //const setRecipeMultiplier = usePlannerStore(s => s.setRecipeMultiplier);
  //const toggleMeal          = usePlannerStore(s => s.toggleMeal);
  //const mealSummary         = usePlannerStore(s => s.mealSummary);
  //const totals              = usePlannerStore(s => s.totals);
  //const isLoading           = usePlannerStore(s => s.isLoading);
  //const error               = usePlannerStore(s => s.error);
  const {
    meals,
    setRecipeMultiplier,
    toggleMeal,
    mealSummary,
    totals,
    isLoading,
    error
  } = usePlannerStore();

  const handleSectionToggle = (section: keyof MealCategory) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const MealSection = ({
    title,
    recipes,
    mealType,
  }: {
    title: string;
    recipes: Recipe[];
    mealType: keyof MealCategory;
  }) => {
    const summary = mealSummary();

    // UPDATED: Calculate totals from recipe objects directly
    const sectionSaleTotal = recipes
      .filter(r => r.isSelected)  // ← Use recipe.isSelected instead of selectedMeals.has()
      .reduce((sum, r) => sum + r.salePrice * r.multiplier, 0);  // ← Use recipe.multiplier

    const sectionSavingsTotal = recipes
      .filter(r => r.isSelected)  // ← Use recipe.isSelected
      .reduce((sum, r) => sum + r.totalSavings * r.multiplier, 0);  // ← Use recipe.multiplier

    return (
      <Collapsible
        open={openSections[mealType]}
        onOpenChange={() => handleSectionToggle(mealType)}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-2 bg-gray-200 rounded-lg">
            <span className="text-xl font-semibold">{title}</span>

            {/* Ledger style aligned stats - Meals, Deals, Cost in that order */}
            <div className="flex items-center gap-6">
              {/* Meals */}
              <div className="text-right">
                <div className="text-sm font-medium">Recipes</div>
                <div className="text-sm text-center">{summary[mealType]}</div>
              </div>

              {/* Deals */}
              <div className="text-right">
                <div className="text-sm font-medium">Deals</div>
                <div className="text-sm">${sectionSavingsTotal.toFixed(2)}</div>
              </div>

              {/* Cost */}
              <div className="text-right">
                <div className="text-sm font-medium">Cost</div>
                <div className="text-sm">${sectionSaleTotal.toFixed(2)}</div>
              </div>

              {/* Expand/Collapse icon */}
              <div className="ml-2">
                {openSections[mealType] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1 pt-3">
            {recipes.map((recipe, idx) => (
              <MealCard
                key={recipe.url + idx}
                recipe={recipe}
                isSelected={recipe.isSelected}      // ← Use recipe.isSelected directly
                multiplier={recipe.multiplier}      // ← Use recipe.multiplier directly
                onToggle={toggleMeal}
                onMultiplierChange={setRecipeMultiplier}
              />
            ))}

            {/* Recipe suggestion card */}
            <div className="bg-blue-50 rounded-lg p-3 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center min-h-[10rem] max-h-[10rem] overflow-hidden cursor-pointer hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 mb-2">
                <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 font-semibold mb-1 leading-snug">
                Have a favourite recipe you&apos;d like to see included?
              </p>
              <p className="text-xs text-gray-600 leading-snug">
                Please <a href="mailto:info@skrimp.ai?subject=Recipe Suggestion"
                   className="text-blue-600 hover:underline">
                  email us
                </a> at info@skrimp.ai
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading meal plan...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  const summaryTotals = totals();

  return (
    <>
      <div className="mx-auto px-0 sm:px-0">
        <div className="space-y-2">
          <MealSection title="Breakfast" recipes={meals.breakfast} mealType="breakfast" />
          <MealSection title="Lunch"     recipes={meals.lunch}     mealType="lunch" />
          <MealSection title="Dinner"    recipes={meals.dinner}    mealType="dinner" />
        </div>
      </div>

      {/* STICKY Summary Bar - Full width of viewport */}
<div className="sticky bottom-0 left-0 right-0 w-screen ml-[calc(-50vw+50%)] bg-gray-200 border-t py-2 shadow-lg pb-4 z-10 mt-2">
  <div className="w-full px-4">
    {/* TOTALS header */}
    <div className="text-center mb-1">
      <span className="font-bold text-lg">TOTALS</span>
    </div>

    {/* Stats row */}
    <div className="flex justify-around items-center">
      <div className="flex items-center gap-8">
        <p className="text-gray-500 !mb-0">Recipes: <span className="font-bold">{mealSummary().total}</span></p>
        <div>
          <span>Deals: </span>
          <span className="font-bold">${summaryTotals.totalSavings.toFixed(2)}</span>
        </div>
        <div>
          <span>Cost: </span>
          <span className="font-bold">${summaryTotals.saleTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
</div>
    </>
  );
}
