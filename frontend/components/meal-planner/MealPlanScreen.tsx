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
          <div className="flex items-center justify-between p-2 bg-gray-200 rounded-lg">
            <span className="text-xl font-semibold">{title}</span>

            {/* Ledger style aligned stats - Meals, Deals, Cost in that order */}
            <div className="flex items-center gap-6">
              {/* Meals */}
              <div className="text-right">
                <div className="text-sm font-medium">Meals</div>
                <div className="text-sm">{summary[mealType]}</div>
              </div>

              {/* Deals */}
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">Deals</div>
                <div className="text-sm font-bold text-green-600">${sectionSavingsTotal.toFixed(2)}</div>
              </div>

              {/* Cost */}
              <div className="text-right">
                <div className="text-sm font-medium">Cost</div>
                <div className="text-sm">${sectionSaleTotal.toFixed(2)}</div>
              </div>

              {/* Expand/Collapse icon */}
              <div className="ml-2">
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1 pt-3"> {/* Reduced from gap-4 p-4 */}
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
    <div className="mx-auto px-0 sm:px-0 pb-1"> {/* Remove "container" class here */}
      <div className="space-y-2"> {/* Reduced from space-y-6 */}
        <MealSection title="Breakfast" recipes={meals.breakfast} mealType="breakfast" />
        <MealSection title="Lunch"     recipes={meals.lunch}     mealType="lunch" />
        <MealSection title="Dinner"    recipes={meals.dinner}    mealType="dinner" />
      </div>

      {/* Bottom summary bar - keeping original spread-out style with new sequence */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t py-2 px-3 shadow-lg pb-4">
        <div className="container mx-auto">
          {/* TOTALS header */}
          <div className="text-center mb-1">
            <span className="font-bold text-lg">TOTALS</span>
          </div>

          {/* Stats row - reordered to: Meals, Deals, Cost but spread out like before */}
          <div className="flex justify-around items-center">
            <div className="flex items-center gap-8">
              <p className="text-gray-500 !mb-0">Meals: <span className="font-bold">{mealSummary().total}</span></p>
              <div>
                <span>Deals: </span>
                <span className="font-bold text-green-600">${summaryTotals.totalSavings.toFixed(2)}</span>
              </div>
              <div>
                <span>Cost: </span>
                <span className="font-bold">${summaryTotals.saleTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}