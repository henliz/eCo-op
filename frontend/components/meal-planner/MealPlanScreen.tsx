'use client';

import React from 'react';
import { usePlannerStore, type Recipe, type MealCategory } from './usePlannerStore';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MealCard } from './MealCard';

export function MealPlanScreen() {
  const {
    meals,
    selectedMeals,
    toggleMeal,
    mealSummary,
    totals,
    recipeMultipliers,
    setRecipeMultiplier,
    isLoading,
    error
  } = usePlannerStore();

  const MealSection = ({
    title,
    recipes,
    mealType,
  }: {
    title: string;
    recipes: Recipe[];
    mealType: keyof MealCategory;
  }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const summary = mealSummary();

    const sectionSaleTotal = recipes
      .filter(r => selectedMeals.has(r.url))
      .reduce((sum, r) => sum + r.salePrice * (recipeMultipliers[r.url] || 1), 0);

    const sectionSavingsTotal = recipes
      .filter(r => selectedMeals.has(r.url))
      .reduce((sum, r) => sum + r.totalSavings * (recipeMultipliers[r.url] || 1), 0);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{title}</h2>
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">{summary[mealType]} meals selected</span>
              <div className="text-sm text-green-600">
                Sale: ${sectionSaleTotal.toFixed(2)}
              </div>
              <div className="text-sm text-green-600 font-bold">
                Save: ${sectionSavingsTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {recipes.map((recipe, idx) => (
              <MealCard
                key={recipe.url + idx}
                recipe={recipe}
                isSelected={selectedMeals.has(recipe.url)}
                multiplier={recipeMultipliers[recipe.url] || 0}
                onToggle={toggleMeal}
                onMultiplierChange={setRecipeMultiplier}
              />
            ))}
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
    <div className="container mx-auto p-4 pb-24">
      <div className="space-y-6">
        <MealSection title="Breakfast" recipes={meals.breakfast} mealType="breakfast" />
        <MealSection title="Lunch"       recipes={meals.lunch}     mealType="lunch" />
        <MealSection title="Dinner"      recipes={meals.dinner}    mealType="dinner" />
      </div>

      {/* Bottom summary bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm">
            <p className="text-gray-500">Total meals: {mealSummary().total}</p>
          </div>
          <div className="text-right">
            <p className="text-lg">
              Regular total:{' '}
              <span className="line-through">
                ${summaryTotals.regularTotal.toFixed(2)}
              </span>
            </p>
            <p className="text-lg">
              Sale total:{' '}
              <span className="font-bold">
                ${summaryTotals.saleTotal.toFixed(2)}
              </span>
            </p>
            <p className="text-lg text-green-600 font-bold">
              Total savings:{' '}
              ${summaryTotals.totalSavings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
