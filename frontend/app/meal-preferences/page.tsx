'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferencesStore } from '@/stores/useUserPreferencesStore';
import Header from '@/components/layout/Header';
import { IngredientBrowser } from '@/components/user-preferences/IngredientBrowser';
import { RecipeBrowser } from '@/components/user-preferences/RecipeBrowser';
import {
  Settings,
  ChefHat,
  AlertCircle,
  Bell,
  DollarSign,
  Hash,
  X,
  Plus,
  Filter,
  Save,
  RefreshCw
} from 'lucide-react';

export default function PreferencesPage() {
  const { currentUser, makeAPICall } = useAuth();
  const preferences = useUserPreferencesStore();
  const loadedRef = useRef(false);

  const [activeTab, setActiveTab] = useState('ingredients');
  const [showIngredientBrowser, setShowIngredientBrowser] = useState(false);
  const [showRecipeBrowser, setShowRecipeBrowser] = useState(false);

  // Wrap loadPreferences in useCallback to stabilize the function reference
  const loadPreferences = useCallback(async () => {
    if (currentUser && !loadedRef.current && !preferences.preferences) {
      try {
        loadedRef.current = true;
        await preferences.loadPreferences(makeAPICall);
      } catch (error) {
        console.error('Error loading preferences:', error);
        loadedRef.current = false; // Reset on error so we can try again
      }
    }
  }, [currentUser, makeAPICall, preferences]);

  // Load preferences when user is available
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Handle saving preferences
  const handleSavePreferences = async () => {
    try {
      await preferences.savePreferences(makeAPICall);
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    }
  };

  // Handle preference updates
  const updateMaxIngredients = (value: number) => {
    preferences.updatePreferences({ maxIngredients: value });
  };

  const updateMaxPricePerPortion = (value: number) => {
    preferences.updatePreferences({ maxPricePerPortion: value });
  };

  const updateNewFlyerNotifications = (value: boolean) => {
    preferences.updatePreferences({ newFlyerNotifications: value });
  };

  const updateWeeklyNotifications = (value: boolean) => {
    preferences.updatePreferences({ weeklyNotifications: value });
  };

  const handleRemoveBannedIngredient = (ingredientName: string) => {
    preferences.removeBannedIngredient(ingredientName);
  };

  const handleRemoveBannedRecipe = (recipeId: string) => {
    preferences.removeBannedRecipe(recipeId);
  };

  if (preferences.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-600">Loading your preferences...</span>
          </div>
        </div>
      </div>
    );
  }

  // Get current preferences values with defaults
  const currentPrefs = preferences.preferences;
  const maxIngredients = currentPrefs?.maxIngredients || 6;
  const maxPricePerPortion = currentPrefs?.maxPricePerPortion || 10;
  const newFlyerNotifications = currentPrefs?.newFlyerNotifications || false;
  const weeklyNotifications = currentPrefs?.weeklyNotifications || false;

  const bannedIngredients = preferences.getBannedIngredientsAsItems();
  const bannedRecipes = preferences.getBannedRecipesAsItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Preferences</h1>
              <p className="text-gray-600">
                Customize your meal planning experience by managing your dietary preferences and restrictions.
              </p>
            </div>

            {/* Save button with status */}
            <div className="flex items-center gap-4">
              {preferences.hasUnsavedChanges && (
                <span className="text-sm text-orange-600 font-medium">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSavePreferences}
                disabled={preferences.saving || !preferences.hasUnsavedChanges}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {preferences.saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save All Preferences
                  </>
                )}
              </button>
            </div>
          </div>

          {preferences.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{preferences.error}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'ingredients', label: 'Ingredients', icon: Filter },
                { id: 'recipes', label: 'Recipes', icon: ChefHat },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'ingredients' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Banned Ingredients</h2>
                  <p className="text-gray-600">Recipes containing these ingredients will be excluded from your meal plans.</p>
                </div>
                <button
                  onClick={() => setShowIngredientBrowser(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Browse Ingredients
                </button>
              </div>

              {bannedIngredients.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No banned ingredients yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click &quot;Browse Ingredients&quot; to add ingredients you want to avoid
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bannedIngredients.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <span className="text-red-800 font-medium">{item.name}</span>
                        {item.category && (
                          <span className="text-xs text-red-600 ml-2">({item.category})</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveBannedIngredient(item.name)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recipes' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Banned Recipes</h2>
                  <p className="text-gray-600">These recipes will not appear in your meal plans.</p>
                </div>
                <button
                  onClick={() => setShowRecipeBrowser(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Browse Recipes
                </button>
              </div>

              {bannedRecipes.length === 0 ? (
                <div className="text-center py-8">
                  <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No banned recipes yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click &quot;Browse Recipes&quot; to add recipes you want to avoid
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bannedRecipes.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <span className="text-red-800 font-medium">{item.name}</span>
                      <button
                        onClick={() => handleRemoveBannedRecipe(item.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Meal Planning Settings</h2>

              <div className="space-y-8">
                {/* Recipe Complexity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Maximum Ingredients per Recipe
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="3"
                      max="15"
                      value={maxIngredients}
                      onChange={(e) => updateMaxIngredients(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 w-8">
                      {maxIngredients}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Recipes with more than {maxIngredients} ingredients will be excluded
                  </p>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Maximum Price per Portion
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="2"
                      max="25"
                      step="0.5"
                      value={maxPricePerPortion}
                      onChange={(e) => updateMaxPricePerPortion(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 w-12">
                      ${maxPricePerPortion}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Recipes costing more than ${maxPricePerPortion} per portion will be excluded
                  </p>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    <Bell className="w-5 h-5 inline mr-2" />
                    Notifications
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">New Flyer Notifications</p>
                        <p className="text-sm text-gray-600">
                          Get notified when new store flyers are available
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newFlyerNotifications}
                          onChange={(e) => updateNewFlyerNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Weekly Meal Planning</p>
                        <p className="text-sm text-gray-600">
                          Get weekly reminders to plan your meals
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={weeklyNotifications}
                          onChange={(e) => updateWeeklyNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showIngredientBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <IngredientBrowser onClose={() => setShowIngredientBrowser(false)} />
          </div>
        </div>
      )}

      {showRecipeBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <RecipeBrowser onClose={() => setShowRecipeBrowser(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
