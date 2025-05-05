'use client';

import React, { useEffect, useState } from 'react';
import { usePlannerStore, type Recipe, type MealCategory } from './usePlannerStore';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MealCard } from './MealCard';

// Type for the JSON data structure
interface JsonDay {
  day: string;
  meals: {
    breakfast?: Recipe[];
    lunch?: Recipe[];
    dinner?: Recipe[];
  };
}

export function MealPlanScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { meals, selectedMeals, setMeals, toggleMeal, mealSummary, totals } = usePlannerStore();

  // Fetch meal data on mount
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await fetch('/data/enhanced-meal-plan.json');
        if (!response.ok) {
          throw new Error('Failed to fetch meal plan data');
        }
        const data: JsonDay[] = await response.json();

        // Transform the JSON data to match our store structure
        const mealCategories: MealCategory = {
          breakfast: [],
          lunch: [],
          dinner: []
        };

        // Extract all meals by category
        data.forEach(day => {
          if (day.meals.breakfast) {
            mealCategories.breakfast.push(...day.meals.breakfast);
          }
          if (day.meals.lunch) {
            mealCategories.lunch.push(...day.meals.lunch);
          }
          if (day.meals.dinner) {
            mealCategories.dinner.push(...day.meals.dinner);
          }
        });

        setMeals(mealCategories);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meal plan');
        setIsLoading(false);
      }
    };

    fetchMeals();
  }, [setMeals]);

  const MealSection = ({ title, recipes, mealType }: { title: string; recipes: Recipe[]; mealType: keyof MealCategory }) => {
    const [isOpen, setIsOpen] = useState(true);
    const summary = mealSummary();
    const selectedCount = summary[mealType];
    const totalCount = recipes.length;

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{title}</h2>
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {selectedCount} / {totalCount} selected
              </span>
              <div className="text-sm text-green-600">
                Sale: ${recipes
                  .filter(r => selectedMeals.has(r.url))
                  .reduce((sum, r) => sum + r.salePrice, 0)
                  .toFixed(2)}
              </div>
              <div className="text-sm text-green-600 font-bold">
                Save: ${recipes
                  .filter(r => selectedMeals.has(r.url))
                  .reduce((sum, r) => sum + r.totalSavings, 0)
                  .toFixed(2)}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe, index) => (
              <MealCard
                key={recipe.url + index}
                recipe={recipe}
                isSelected={selectedMeals.has(recipe.url)}
                onToggle={toggleMeal}
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
        <MealSection title="Lunch" recipes={meals.lunch} mealType="lunch" />
        <MealSection title="Dinner" recipes={meals.dinner} mealType="dinner" />
      </div>

      {/* Bottom summary bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm">
            <p className="text-gray-500">Total meals: {mealSummary().total}</p>
          </div>
          <div className="text-right">
            <p className="text-lg">
              Regular total: <span className="line-through">${summaryTotals.regularTotal.toFixed(2)}</span>
            </p>
            <p className="text-lg">
              Sale total: <span className="font-bold">${summaryTotals.saleTotal.toFixed(2)}</span>
            </p>
            <p className="text-lg text-green-600 font-bold">
              Total savings: ${summaryTotals.totalSavings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}