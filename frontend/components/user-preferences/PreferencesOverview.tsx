// frontend/components/user-preferences/PreferencesOverview.tsx
'use client';

import React, { useState } from 'react';
import { useUserPreferencesStore } from '@/stores/useUserPreferencesStore';
import { Settings, Plus, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

interface PreferencesOverviewProps {
  className?: string;
}

export const PreferencesOverview: React.FC<PreferencesOverviewProps> = ({ className = '' }) => {
  const preferences = useUserPreferencesStore();
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');

  const summary = preferences.getPreferencesSummary();

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      preferences.addBannedIngredient(newIngredient.trim());
      setNewIngredient('');
      setShowAddIngredient(false);
    }
  };

  const getHealthScore = () => {
    // Simple health score calculation
    let score = 100;
    if (summary.bannedIngredientsCount > 10) score -= 20;
    if (summary.bannedRecipesCount > 5) score -= 15;
    if (!summary.priceRange) score -= 10;
    return Math.max(score, 60);
  };

  // Get banned items as UI-friendly objects
  const bannedIngredients = preferences.getBannedIngredientsAsItems();
  const bannedRecipes = preferences.getBannedRecipesAsItems();

  const healthScore = getHealthScore();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Meal Preferences</h3>
            <p className="text-sm text-gray-500">Your dietary settings</p>
          </div>
        </div>

        {/* Health Score Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            healthScore >= 90 ? 'bg-green-500' : 
            healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium text-gray-600">{healthScore}%</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Banned Ingredients */}
        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-red-800">Banned Items</span>
          </div>
          <div className="text-lg font-bold text-red-900">
            {summary.bannedIngredientsCount + summary.bannedRecipesCount}
          </div>
          <div className="text-xs text-red-600">
            {summary.bannedIngredientsCount} ingredients, {summary.bannedRecipesCount} recipes
          </div>
        </div>

        {/* Price Range */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Budget</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {summary.priceRange || 'No limit'}
          </div>
          <div className="text-xs text-green-600">
            {summary.maxIngredients ? `Max ${summary.maxIngredients} ingredients` : 'No ingredient limit'}
          </div>
        </div>
      </div>

      {/* Quick Add Ingredient */}
      {showAddIngredient ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
              placeholder="Enter ingredient to ban (e.g., peanuts)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleAddIngredient}
              disabled={!newIngredient.trim()}
              className="px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ban
            </button>
            <button
              onClick={() => {
                setShowAddIngredient(false);
                setNewIngredient('');
              }}
              className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddIngredient(true)}
          className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Quick ban ingredient
        </button>
      )}

      {/* Recent Banned Items */}
      {(bannedIngredients.length > 0 || bannedRecipes.length > 0) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recently Banned</h4>
          <div className="space-y-1">
            {bannedIngredients.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs bg-red-50 px-2 py-1 rounded">
                <span className="text-red-800">{item.name}</span>
                <button
                  onClick={() => preferences.removeBannedIngredient(item.name)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            {bannedRecipes.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs bg-red-50 px-2 py-1 rounded">
                <span className="text-red-800 truncate">{item.name}</span>
                <button
                  onClick={() => preferences.removeBannedRecipe(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            // Navigate to full preferences page
            window.location.href = '/meal-preferences';
          }}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Manage All Preferences
        </button>

        <button
          onClick={() => {
            preferences.updatePreferences({ maxPricePerPortion: 8.00, maxIngredients: 15 });
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Quick Setup
        </button>
      </div>

      {/* Status Indicators */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            {preferences.hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span>Changes pending</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Synced</span>
              </>
            )}
          </div>

          {preferences.lastSynced && (
            <span className="text-gray-400">
              Updated {new Date(preferences.lastSynced).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
