// frontend/app/meal-preferences/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';

interface UserMealPreferences {
  userId: string;
  maxIngredients: number;
  maxPricePerPortion: number;
  bannedIngredients: string[];
  bannedRecipes: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const DEFAULT_PREFERENCES: Omit<UserMealPreferences, 'userId'> = {
  maxIngredients: 20,
  maxPricePerPortion: 10.00,
  bannedIngredients: [],
  bannedRecipes: []
};

export default function MealPreferencesPage() {
  const { currentUser, makeAPICall } = useAuth();
  const [preferences, setPreferences] = useState<Omit<UserMealPreferences, 'userId'>>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Form state for banned ingredients input
  const [newBannedIngredient, setNewBannedIngredient] = useState('');
  const [newBannedRecipe, setNewBannedRecipe] = useState('');

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await makeAPICall('/meal-plans/preferences', 'GET', null, true);

      if (response.success && response.data) {
        const data = response.data;
        setPreferences({
          maxIngredients: data.maxIngredients,
          maxPricePerPortion: data.maxPricePerPortion,
          bannedIngredients: data.bannedIngredients || [],
          bannedRecipes: data.bannedRecipes || []
        });
      } else {
        // No preferences found or unsuccessful response, use defaults
        setPreferences(DEFAULT_PREFERENCES);
        setMessage({ type: 'info', text: 'Please set your meal preferences' });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Check if it's a 404 error (no preferences exist yet)
      if (error instanceof Error && error.message && error.message.includes('404')) {
        setPreferences(DEFAULT_PREFERENCES);
        setMessage({ type: 'info', text: 'Please set your meal preferences' });
      } else {
        setMessage({ type: 'error', text: 'Failed to load preferences. Using defaults.' });
        setPreferences(DEFAULT_PREFERENCES);
      }
    } finally {
      setLoading(false);
    }
  }, [makeAPICall]);

  useEffect(() => {
    if (currentUser) {
      loadPreferences();
    }
  }, [currentUser, loadPreferences]);

  const savePreferences = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await makeAPICall('/meal-plans/preferences', 'PUT', preferences, true);

      if (response.success && response.data) {
        const savedData = response.data;
        setPreferences({
          maxIngredients: savedData.maxIngredients,
          maxPricePerPortion: savedData.maxPricePerPortion,
          bannedIngredients: savedData.bannedIngredients || [],
          bannedRecipes: savedData.bannedRecipes || []
        });
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const deletePreferences = async () => {
    if (!confirm('Are you sure you want to reset all preferences to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await makeAPICall('/meal-plans/preferences', 'DELETE', null, true);

      if (response.success) {
        setPreferences(DEFAULT_PREFERENCES);
        setMessage({ type: 'success', text: 'Preferences reset to defaults!' });
      } else {
        throw new Error('Failed to delete preferences');
      }
    } catch (error) {
      console.error('Error deleting preferences:', error);
      setMessage({ type: 'error', text: 'Failed to reset preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const addBannedIngredient = () => {
    const ingredient = newBannedIngredient.trim().toLowerCase();
    if (ingredient && !preferences.bannedIngredients.includes(ingredient)) {
      setPreferences(prev => ({
        ...prev,
        bannedIngredients: [...prev.bannedIngredients, ingredient]
      }));
      setNewBannedIngredient('');
    }
  };

  const removeBannedIngredient = (ingredient: string) => {
    setPreferences(prev => ({
      ...prev,
      bannedIngredients: prev.bannedIngredients.filter(item => item !== ingredient)
    }));
  };

  const addBannedRecipe = () => {
    const recipe = newBannedRecipe.trim();
    if (recipe && !preferences.bannedRecipes.includes(recipe)) {
      setPreferences(prev => ({
        ...prev,
        bannedRecipes: [...prev.bannedRecipes, recipe]
      }));
      setNewBannedRecipe('');
    }
  };

  const removeBannedRecipe = (recipe: string) => {
    setPreferences(prev => ({
      ...prev,
      bannedRecipes: prev.bannedRecipes.filter(item => item !== recipe)
    }));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Meal Preferences</h1>
            <p className="text-gray-600">Please log in to manage your meal preferences.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Meal Preferences</h1>
            <p className="text-gray-600">Loading your preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Meal Preferences</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-8">
            {/* Maximum Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Ingredients per Recipe
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={preferences.maxIngredients}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  maxIngredients: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recipes with more than this many ingredients will be filtered out
              </p>
            </div>

            {/* Maximum Price Per Portion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Price per Serving (CAD)
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">$</span>
                <input
                  type="number"
                  min="0.50"
                  max="50.00"
                  step="0.25"
                  value={preferences.maxPricePerPortion}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    maxPricePerPortion: Math.max(0.5, parseFloat(e.target.value) || 0.5)
                  }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Recipes costing more than this per serving will be filtered out
              </p>
            </div>

            {/* Banned Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banned Ingredients
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newBannedIngredient}
                  onChange={(e) => setNewBannedIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBannedIngredient()}
                  placeholder="Enter ingredient name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addBannedIngredient}
                  disabled={!newBannedIngredient.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {preferences.bannedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preferences.bannedIngredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {ingredient}
                      <button
                        onClick={() => removeBannedIngredient(ingredient)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Recipes containing any of these ingredients will be filtered out
              </p>
            </div>

            {/* Banned Recipes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banned Recipes
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newBannedRecipe}
                  onChange={(e) => setNewBannedRecipe(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBannedRecipe()}
                  placeholder="Enter recipe ID or URL..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addBannedRecipe}
                  disabled={!newBannedRecipe.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {preferences.bannedRecipes.length > 0 && (
                <div className="space-y-2">
                  {preferences.bannedRecipes.map((recipe, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded"
                    >
                      <span className="text-sm text-red-800 truncate flex-1 mr-2">
                        {recipe}
                      </span>
                      <button
                        onClick={() => removeBannedRecipe(recipe)}
                        className="text-red-600 hover:text-red-800 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                These specific recipes will be excluded from meal plans
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
            <button
              onClick={deletePreferences}
              disabled={saving}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Defaults
            </button>

            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}