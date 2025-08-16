import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Heart, Plus, Star, Edit3, Utensils, Clock, ChefHat } from 'lucide-react';

interface UserRecipe {
  id: string;
  name: string;
  image?: string;
  portions: number;
  ingredients: string[];
  isBookmarked?: boolean;
  isUserCreated: boolean;
  tags: string[];
  cookTime: string;
}

interface Ingredient {
  recipeIngredientName: string;
}

interface Recipe {
  name: string;
  url?: string;
  img?: string;
  servings: number;
  ingredients?: Ingredient[];
  isSelected: boolean;
  mealType: string;
  flyerItemsCount: number;
}

interface MealData {
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
}

interface RecipeLibraryProps {
  hasData: boolean;
  meals: MealData;
}

export const RecipeLibrary: React.FC<RecipeLibraryProps> = ({ hasData, meals }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Generate user recipes from meal data
  const userRecipes: UserRecipe[] = hasData ? (() => {
    const allRecipes = [...meals.breakfast, ...meals.lunch, ...meals.dinner];
    return allRecipes.map(recipe => ({
      id: recipe.url || recipe.name,
      name: recipe.name,
      image: recipe.img,
      portions: recipe.servings,
      ingredients: recipe.ingredients?.map((ing: Ingredient) => ing.recipeIngredientName) || [],
      isBookmarked: recipe.isSelected,
      isUserCreated: false,
      tags: [recipe.mealType, ...(recipe.flyerItemsCount > 0 ? ['on-sale'] : [])],
      cookTime: '30 min'
    }));
  })() : [];

  const filteredRecipes = userRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">My Recipe Library</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search recipes, tags, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
          />
        </div>
      </div>

      {/* Recipe Categories */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="rounded-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100">
          <Heart size={14} className="mr-1" />
          Selected ({userRecipes.filter(r => r.isBookmarked).length})
        </Button>
        <Button variant="outline" size="sm" className="rounded-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
          <Plus size={14} className="mr-1" />
          On Sale ({userRecipes.filter(r => r.tags.includes('on-sale')).length})
        </Button>
        <Button variant="outline" size="sm" className="rounded-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
          <Star size={14} className="mr-1" />
          Available ({userRecipes.length})
        </Button>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 relative z-10">
            {recipe.image && (
              <div className="w-full h-48 mb-4 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg mb-2 hover:text-purple-600 transition-colors">
                  {recipe.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Utensils size={14} />
                    {recipe.portions} portions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {recipe.cookTime}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {recipe.isBookmarked && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Heart size={14} className="text-purple-600" />
                  </div>
                )}
                {recipe.tags.includes('on-sale') && (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus size={14} className="text-green-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {recipe.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2 h-10 hover:bg-purple-50 transition-colors">
                <Edit3 size={16} />
                View Recipe
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍳</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No recipes found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search or' : ''} Add some recipes to your meal plan!
          </p>
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl transition-all duration-300"
            onClick={() => window.location.href = '/plan'}
          >
            <ChefHat size={16} className="mr-2" />
            Start Meal Planning
          </Button>
        </div>
      )}
    </div>
  );
};