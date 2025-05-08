'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { usePlannerStore, type Recipe } from './usePlannerStore';
import { ExternalLink, Mail, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const placeholderImage = '/Robo_Research.png';

export function CookScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { selectedMeals, meals, recipeMultipliers } = usePlannerStore();

  // Gather selected recipes and organize by meal type
  const selectedRecipesByType = useMemo(() => {
    const byType = {
      breakfast: [] as Recipe[],
      lunch: [] as Recipe[],
      dinner: [] as Recipe[]
    };

    meals.breakfast.forEach(recipe => {
      if (selectedMeals.has(recipe.url)) {
        byType.breakfast.push(recipe);
      }
    });

    meals.lunch.forEach(recipe => {
      if (selectedMeals.has(recipe.url)) {
        byType.lunch.push(recipe);
      }
    });

    meals.dinner.forEach(recipe => {
      if (selectedMeals.has(recipe.url)) {
        byType.dinner.push(recipe);
      }
    });

    return byType;
  }, [selectedMeals, meals]);

  // Get all selected recipes as a flat array
  const allSelectedRecipes = useMemo(() => [
    ...selectedRecipesByType.breakfast,
    ...selectedRecipesByType.lunch,
    ...selectedRecipesByType.dinner
  ], [selectedRecipesByType]);

  // Determine recipe type
  const getRecipeType = (recipe: Recipe): 'breakfast' | 'lunch' | 'dinner' => {
    if (selectedRecipesByType.breakfast.some(r => r.url === recipe.url)) return 'breakfast';
    if (selectedRecipesByType.lunch.some(r => r.url === recipe.url)) return 'lunch';
    return 'dinner';
  };

  // Filtered recipes by search query
  const filteredRecipes = useMemo<Recipe[]>(() => {
    if (!searchQuery) return allSelectedRecipes;
    return allSelectedRecipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSelectedRecipes, searchQuery]);

  // Simple alert for email functionality
  const handleEmailRecipes = () => {
    alert("The email recipe feature is coming soon!");
  };

  return (
    <div className="flex flex-col pb-20">
      {/* Search and filter header */}
      <div className="sticky top-0 bg-white z-10 p-4 shadow-md">
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-4 w-full">
            <Image
              src={placeholderImage}
              alt="Chef"
              width={50}
              height={50}
              className="rounded-full"
            />
            <h2 className="text-xl font-bold">Your Recipes</h2>
          </div>

          <div className="flex flex-col sm:flex-row w-full items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <Button
              onClick={handleEmailRecipes}
              className="flex items-center gap-2 bg-white border border-teal-600 text-teal-600 hover:bg-teal-50 w-full sm:w-auto"
            >
              <Mail size={18} />
              <span>Email My Recipes</span>
              <span className="ml-1 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full flex items-center">
                <AlertCircle size={12} className="mr-0.5" />
                Soon
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content: Recipe cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 px-0 py-2">
        {/* Recipe cards */}
        <div className="lg:col-span-3 space-y-2">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <motion.div
                key={recipe.url}
                onClick={() => setSelectedRecipe(recipe)}
                initial={false}
                animate={{ scale: selectedRecipe?.url === recipe.url ? 1.03 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="cursor-pointer"
              >
                <Card className={`
                  transition-colors
                  hover:bg-gray-100
                  ${selectedRecipe?.url === recipe.url ? 'bg-teal-100 border-teal-300' : 'bg-white'}
                `}>
                  <CardHeader className="px-2">
                    <CardTitle className="flex flex-col gap-0">
                      {/* Row 1: Recipe name (left) and meal type (right) */}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">{recipe.name}</span>

                        {/* Meal Type Badge */}
                        <span className={`text-xs px-2 py-1 rounded ${
                          getRecipeType(recipe) === 'breakfast' 
                            ? 'bg-amber-100 text-amber-800' 
                            : getRecipeType(recipe) === 'lunch'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getRecipeType(recipe).charAt(0).toUpperCase() + getRecipeType(recipe).slice(1)}
                        </span>
                      </div>

                      {/* Row 2: Servings (left) and multiplier (right) */}
                      <div className="flex justify-between items-center">
                        {/* Show servings if available */}
                        <div className="text-xs text-gray-500">
                          Serves: {recipe.servings * (recipeMultipliers[recipe.url] || 1)}
                        </div>

                        {/* Multiplier */}
                        {(recipeMultipliers[recipe.url] || 0) > 0 && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">
                            ×{recipeMultipliers[recipe.url] || 1}
                          </span>
                        )}
                      </div>

                      {/* Row 3: View recipe link */}
                      <a
                        href={recipe.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1 mt-1"
                      >
                        <ExternalLink size={14} />
                        View Original Recipe
                      </a>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No recipes found. Try adjusting your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}