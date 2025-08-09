'use client';

import React, { useState } from 'react';
import { type Recipe, type MealCategory } from '@/stores/usePlannerStores';
import { usePlannerStores as usePlannerStore } from '@/stores/usePlannerStores';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Coffee, Utensils, ChefHat } from 'lucide-react';
import { MealCard } from './MealCard';
import { CustomRecipeCard } from './CustomRecipeCard';


// Inline RecommendationCard component
interface RecommendationCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onRecommend: () => void;
  isLoading?: boolean;
}

const mealTypeConfig = {
  breakfast: {
    icon: Coffee,
    title: 'Recommend 10 Breakfasts',
    description: 'Get personalized breakfast recommendations based on your store and preferences',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-100'
  },
  lunch: {
    icon: Utensils,
    title: 'Recommend 10 Lunches',
    description: 'Discover lunch options perfect for your household size and budget',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-100'
  },
  dinner: {
    icon: ChefHat,
    title: 'Recommend 10 Dinners',
    description: 'Find delicious dinner recipes with current deals and savings',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100'
  }
};

function RecommendationCard({ mealType, onRecommend, isLoading = false }: RecommendationCardProps) {
  const config = mealTypeConfig[mealType];
  const Icon = config.icon;

  return (
    <div
      className={`
        relative w-full flex flex-col items-center justify-center text-center 
        min-h-[10rem] max-h-[10rem] overflow-hidden 
        cursor-pointer transition-all duration-200
        border-2 border-dashed rounded-lg
        ${config.bgColor} ${config.borderColor} ${config.hoverColor}
        ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
      `}
      onClick={isLoading ? undefined : onRecommend}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
            <span className="text-xs text-gray-600">Loading...</span>
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`${config.color} mb-3`}>
        <Icon className="w-8 h-8 mx-auto" />
      </div>

      {/* Title */}
      <h3 className={`text-sm sm:text-base font-semibold mb-2 leading-snug ${config.color}`}>
        {config.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-snug px-2">
        {config.description}
      </p>

      {/* Call to action hint */}
      <div className={`mt-2 text-xs font-medium ${config.color}`}>
        Click to get recommendations →
      </div>
    </div>
  );
}

export function MealPlanScreen() {
  // Lift collapsible state up to the parent component
  const [openSections, setOpenSections] = useState({
    breakfast: true,
    lunch: true,
    dinner: true
  });

  // UPDATED: Use simplified store - no more separate selection state
  const {
    meals,
    setRecipeMultiplier,
    toggleMeal,
    mealSummary,
    totals,
    isLoading,
    error,
    fetchMealRecommendations,
    isMealTypeLoading,
    getSelectedStore
  } = usePlannerStore();

  const handleSectionToggle = (section: keyof MealCategory) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRecommendMealType = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const selectedStore = getSelectedStore();
    if (!selectedStore) {
      console.error('No store selected for fetching recommendations');
      return;
    }

    //const makeAPICall = (window as any).__plannerMakeAPICall;
    //if (!makeAPICall) {
    //  console.error('API call function not available');
    //  return;
    //}

    try {
      await fetchMealRecommendations(mealType);
    } catch (error) {
      console.error(`Failed to fetch ${mealType} recommendations:`, error);
    }
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
    const isLoading = isMealTypeLoading(mealType);

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
          <div className="pt-3">
            {/* Show recommendation cards if no recipes, otherwise show recipe grid */}
            {recipes.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1">
                <RecommendationCard
                  mealType={mealType}
                  onRecommend={() => handleRecommendMealType(mealType)}
                  isLoading={isLoading}
                />
                <CustomRecipeCard
                  mealType={mealType}
                  onCustomSelect={() => {
                    // TODO: Implement custom recipe selection
                    console.log(`Custom recipe selection for ${mealType} - Coming soon!`);
                  }}
                  isComingSoon={true}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1">
                {recipes.map((recipe, idx) => (
                  <MealCard
                    key={recipe.url + idx}
                    recipe={recipe}
                    isSelected={recipe.isSelected}
                    multiplier={recipe.multiplier}
                    onToggle={toggleMeal}
                    onMultiplierChange={setRecipeMultiplier}
                  />
                ))}

                {/* Custom recipe addition card - only show if we have recipes */}
                <CustomRecipeCard
                  mealType={mealType}
                  onCustomSelect={() => {
                    // TODO: Implement custom recipe selection
                    console.log(`Custom recipe selection for ${mealType} - Coming soon!`);
                  }}
                  isComingSoon={true}
                />
              </div>
            )}
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