// components/dashboard/PreferencesOverview.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Settings, AlertCircle, ChefHat, ShoppingCart, Bell } from 'lucide-react';

interface PreferencesOverviewProps {
  summary: {
    bannedIngredientsCount: number;
    bannedRecipesCount: number;
    priceRange?: string;
    maxIngredients: number;
  };
}

export const PreferencesOverview: React.FC<PreferencesOverviewProps> = ({ summary }) => {
  return (
    <div className="space-y-6">
      {/* Main Preferences Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <User size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Food Preferences</h2>
        <p className="text-gray-600 mb-6">
          Manage your dietary preferences, banned ingredients, and meal planning settings.
        </p>
        <Button
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => window.location.href = '/meal-preferences'}
        >
          <Settings size={20} className="mr-2" />
          Manage Preferences
        </Button>
      </div>

      {/* Current Preferences Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Banned Ingredients */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle size={16} className="text-white" />
              </div>
              <span className="font-medium text-red-800">Banned Ingredients</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{summary.bannedIngredientsCount}</div>
            <div className="text-sm text-red-600">items avoided</div>
          </div>

          {/* Banned Recipes */}
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <ChefHat size={16} className="text-white" />
              </div>
              <span className="font-medium text-orange-800">Banned Recipes</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{summary.bannedRecipesCount}</div>
            <div className="text-sm text-orange-600">recipes excluded</div>
          </div>

          {/* Max Ingredients */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Settings size={16} className="text-white" />
              </div>
              <span className="font-medium text-blue-800">Max Ingredients</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{summary.maxIngredients}</div>
            <div className="text-sm text-blue-600">per recipe</div>
          </div>

          {/* Price Range */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <ShoppingCart size={16} className="text-white" />
              </div>
              <span className="font-medium text-green-800">Price Range</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {summary.priceRange ? summary.priceRange.replace('Under ', '') : '$10'}
            </div>
            <div className="text-sm text-green-600">max per portion</div>
          </div>
        </div>
      </div>

      {/* Quick Preference Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-red-50 transition-colors"
            onClick={() => window.location.href = '/meal-preferences'}
          >
            <AlertCircle size={24} className="text-red-600" />
            <span className="text-sm font-medium">Manage Banned Items</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
            onClick={() => window.location.href = '/meal-preferences'}
          >
            <Settings size={24} className="text-blue-600" />
            <span className="text-sm font-medium">Recipe Settings</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
            onClick={() => window.location.href = '/meal-preferences'}
          >
            <Bell size={24} className="text-purple-600" />
            <span className="text-sm font-medium">Notifications</span>
          </Button>
        </div>
      </div>
    </div>
  );
};