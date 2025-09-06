'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Plus, Check, Users, DollarSign, Loader2, ChefHat, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlannerStores } from '@/stores';

// Use the same Recipe interface from the meal plan store
interface PricedRecipeFromAPI {
  id: string;
  recipeId: string;
  name: string;
  url: string;
  img?: string;
  salePrice: number;
  regularPrice: number;
  totalSavings: number;
  salePricePerServing: number;
  regularPricePerServing: number;
  savingsPerServing: number;
  savingsPercentage: number;
  servings: number;
  costPerServing: number;
  estimatedPrepTime: string;
  store: string;
  location: string;
  date: string;
  mealType: string;
  validFromDate: string;
  validToDate: string;
  sortIndex?: number;
  pricingContext: {
    store: string;
    location: string;
    dataDate: string;
    validFromDate: string;
    validToDate: string;
    queryDate: string;
    pricedAt?: string;
    sortIndex?: number;
  };
  ingredients: Array<{
    recipeIngredientName: string;
    saleUnitSize?: number;
    saleUnitType?: string;
    salePrice: number;
    saleFractionUsed?: number;
    regularPrice: number;
    regularFractionUsed?: number;
    type?: 'core' | 'optional' | 'garnish' | 'to taste';
    source: 'flyer' | 'database' | 'missing' | 'skipped' | 'free';
    sourceDate?: string;
    productName?: string;
    packageId?: string;
    savingsPercentage?: number;
    category?: string;
  }>;
}

interface PricedRecipeBrowserProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onClose?: () => void;
  onRecipeSelect?: (recipe: PricedRecipeFromAPI) => void;
  className?: string;
}

export const PricedRecipeBrowser: React.FC<PricedRecipeBrowserProps> = ({
  mealType,
  onClose,
  onRecipeSelect,
  className = ''
}) => {
  const { makeAPICall } = useAuth();
  const { getSelectedStore, toggleMeal, meals, setMeals } = usePlannerStores();

  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState<PricedRecipeFromAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [apiSubscriptionInfo, setApiSubscriptionInfo] = useState<{
    tier: string;                           // ADD THIS
    recipeBrowseLimit: number;              // ADD THIS
    recipeBrowseSearch: boolean;            // ADD THIS
    totalRecipesInCatalog: number;
    recipesAvailableToUser: number;
    recipesRestrictedBySubscription: number;
  } | null>(null);

  const subscriptionInfo = apiSubscriptionInfo;

  //DEBUG====================
  console.log('=== DEBUG SUBSCRIPTION DATA ===');
  console.log('apiSubscriptionInfo from API:', apiSubscriptionInfo);
  console.log('subscriptionInfo (final):', subscriptionInfo);  // FIXED: removed undefined variables

  // Specific checks for UI conditions
  console.log('=== UI CONDITION CHECKS ===');
  console.log('Search should be disabled?', subscriptionInfo?.recipeBrowseSearch === false);
  console.log('Show subscription banner?',
    subscriptionInfo &&  // FIXED: SubscriptionInfo -> subscriptionInfo
    subscriptionInfo.tier === 'free' &&  // FIXED: SubscriptionInfo -> subscriptionInfo
    subscriptionInfo.recipesRestrictedBySubscription > 0  // FIXED: SubscriptionInfo -> subscriptionInfo
  );
  console.log('Show upgrade prompt?',
    subscriptionInfo &&  // FIXED: SubscriptionInfo -> subscriptionInfo
    subscriptionInfo.tier === 'free' &&  // FIXED: SubscriptionInfo -> subscriptionInfo
    !pagination.hasNext &&
    subscriptionInfo.recipesRestrictedBySubscription > 0  // FIXED: SubscriptionInfo -> subscriptionInfo
  );
  //DEBUG END====================

  const selectedStore = getSelectedStore();

  // Load priced recipes for the specific meal type and store
  const loadPricedRecipes = useCallback(async (page: number = 1, search: string = '') => {
    if (!selectedStore) {
      setError('No store selected. Please select a store first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate the date (same logic as in useMealPlanStore)
      const validUntilDate = new Date(selectedStore.validUntil);
      const dataDate = new Date(validUntilDate);
      dataDate.setDate(dataDate.getDate() - 7);
      const date = dataDate.toISOString().split('T')[0];

      // Use the browse endpoint for comprehensive recipe access
      const params = new URLSearchParams({
        store: selectedStore.name,
        location: selectedStore.location,
        date: date,
        mealType: mealType,
        page: page.toString(),
        limit: '50',
      });

      // Add search term if provided
      if (search.trim()) {
        params.append('search', search.trim());
      }

      console.log(`[PricedRecipeBrowser] Loading ${mealType} recipes page ${page} for ${selectedStore.name} at ${selectedStore.location}`);

      // Use the browse endpoint directly
      const response = await makeAPICall(`/meal-plans/browse?${params}`, 'GET', null, true);

      if (response.success && response.data) {
        console.log(`[PricedRecipeBrowser] Loaded ${response.data.length} ${mealType} recipes from browse endpoint`);
        setRecipes(response.data);

        // Set pagination info
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          // Default pagination if not provided
          setPagination({
            page: 1,
            limit: response.data.length,
            total: response.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          });
        }

        // NEW: Update API subscription info
        if (response.subscription) {
          setApiSubscriptionInfo({
            tier: response.subscription.tier,                                    // ADD THIS
            recipeBrowseLimit: response.subscription.recipeBrowseLimit,          // ADD THIS
            recipeBrowseSearch: response.subscription.recipeBrowseSearch,        // ADD THIS
            totalRecipesInCatalog: response.subscription.totalRecipesInCatalog,
            recipesAvailableToUser: response.subscription.recipesAvailableToUser,
            recipesRestrictedBySubscription: response.subscription.recipesRestrictedBySubscription
          });
          console.log(`[PricedRecipeBrowser] Complete subscription data stored:`, response.subscription);
        }
      } else {
        throw new Error(response.error || 'Failed to load priced recipes');
      }
    } catch (err) {
      console.error('Error loading priced recipes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load priced recipes');
      setRecipes([]);
      setPagination({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      setLoading(false);
    }
  }, [selectedStore, mealType, makeAPICall]);

  // Load recipes when component mounts or key dependencies change
  useEffect(() => {
    loadPricedRecipes(1, searchTerm);
  }, [loadPricedRecipes, searchTerm]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        loadPricedRecipes(1, searchTerm);
      } else {
        // Reset to page 1 when searching
        setPagination(prev => ({ ...prev, page: 1 }));
        loadPricedRecipes(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadPricedRecipes, pagination.page]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadPricedRecipes(newPage, searchTerm);
    }
  };

  // Remove the old filteredRecipes logic since filtering is now handled by the backend
  const displayRecipes = recipes;

  const handleRecipeToggle = (recipeUrl: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeUrl)) {
      newSelected.delete(recipeUrl);
    } else {
      newSelected.add(recipeUrl);
    }
    setSelectedRecipes(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedRecipes.size === 0) return;

    try {
      // Get the selected recipe objects
      const selectedRecipeObjects = Array.from(selectedRecipes)
        .map(url => recipes.find(recipe => recipe.url === url))
        .filter(recipe => recipe !== undefined);

      // Add each selected recipe to the meal plan using the store's method
      // First, we need to convert API recipes to store Recipe format and add them to the store
      const currentMeals = meals;
      const newRecipes = selectedRecipeObjects.map(apiRecipe => ({
        // Convert API recipe to store Recipe format (same as transformMealPlanToRecipe)
        name: apiRecipe.name,
        url: apiRecipe.url,
        img: apiRecipe.img,
        price: apiRecipe.salePrice,
        salePrice: apiRecipe.salePrice,
        regularPrice: apiRecipe.regularPrice,
        totalSavings: apiRecipe.totalSavings,
        servings: apiRecipe.servings,
        flyerItemsCount: apiRecipe.ingredients?.filter(ing => ing.source === 'flyer').length || 0,
        ingredients: apiRecipe.ingredients || [],
        multiplier: 0, // Will be set when toggled
        isSelected: false, // Will be set when toggled
        store: apiRecipe.store,
        location: apiRecipe.location,
        mealType: mealType,
        date: apiRecipe.date,
        validFromDate: apiRecipe.validFromDate,
        validToDate: apiRecipe.validToDate,
        pricingContext: apiRecipe.pricingContext
      }));

      // Add new recipes to the appropriate meal category
      const updatedMeals = {
        ...currentMeals,
        [mealType]: [...currentMeals[mealType], ...newRecipes]
      };

      // Update the store with new recipes
      setMeals(updatedMeals);

      // Now toggle each recipe to select it (they exist in store now)
      selectedRecipes.forEach(recipeUrl => {
        toggleMeal(recipeUrl);
      });

      setSelectedRecipes(new Set());

      // Show success feedback
      const message = `Successfully added ${selectedRecipes.size} recipe(s) to your ${mealType} plan!`;
      alert(message);

      // Close the browser after adding
      onClose?.();
    } catch (error) {
      console.error('Error adding recipes to meal plan:', error);
      alert('Failed to add recipes to meal plan. Please try again.');
    }
  };

  const handleAddSingleRecipe = (recipe: PricedRecipeFromAPI) => {
    try {
      // Convert API recipe to store Recipe format
      const storeRecipe = {
        name: recipe.name,
        url: recipe.url,
        img: recipe.img,
        price: recipe.salePrice,
        salePrice: recipe.salePrice,
        regularPrice: recipe.regularPrice,
        totalSavings: recipe.totalSavings,
        servings: recipe.servings,
        flyerItemsCount: recipe.ingredients?.filter(ing => ing.source === 'flyer').length || 0,
        ingredients: recipe.ingredients || [],
        multiplier: 0, // Will be set when toggled
        isSelected: false, // Will be set when toggled
        store: recipe.store,
        location: recipe.location,
        mealType: mealType,
        date: recipe.date,
        validFromDate: recipe.validFromDate,
        validToDate: recipe.validToDate,
        pricingContext: recipe.pricingContext
      };

      // Add recipe to the appropriate meal category
      const currentMeals = meals;
      const updatedMeals = {
        ...currentMeals,
        [mealType]: [...currentMeals[mealType], storeRecipe]
      };

      // Update store with new recipe
      setMeals(updatedMeals);

      // Now toggle the recipe to select it
      toggleMeal(recipe.url);

      // Trigger callback if provided
      onRecipeSelect?.(recipe);

      // Show success feedback
      alert(`Added "${recipe.name}" to your ${mealType} plan!`);

      // Close browser
      onClose?.();
    } catch (error) {
      console.error('Error adding recipe to meal plan:', error);
      alert('Failed to add recipe to meal plan. Please try again.');
    }
  };

  const mealTypeConfig = {
    breakfast: {
      title: 'Browse Breakfast Recipes',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    lunch: {
      title: 'Browse Lunch Recipes',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    dinner: {
      title: 'Browse Dinner Recipes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    }
  };

  const config = mealTypeConfig[mealType];

  if (!selectedStore) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Please select a store first to browse recipes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${config.color}`}>{config.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedStore.name} - {selectedStore.location}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={
              subscriptionInfo?.recipeBrowseSearch === false
                ? "Search available with Premium upgrade..."
                : "Search recipes by name or ingredient..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={subscriptionInfo?.recipeBrowseSearch === false}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              subscriptionInfo?.recipeBrowseSearch === false 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : ''
            }`}
          />
          {subscriptionInfo?.recipeBrowseSearch === false && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Premium Only
              </span>
            </div>
          )}
        </div>

        {/* Subscription Status Banner */}
        {subscriptionInfo && subscriptionInfo.tier === 'free' && subscriptionInfo.recipesRestrictedBySubscription > 0 && (
          <div className={`mb-4 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${config.color}`}>
                  Showing {subscriptionInfo.recipesAvailableToUser} of {subscriptionInfo.totalRecipesInCatalog} available recipes
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {subscriptionInfo.recipesRestrictedBySubscription} more recipes available with Premium
                </p>
              </div>
              <button className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-full hover:from-blue-600 hover:to-purple-700 transition-colors">
                Upgrade to Premium
              </button>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        {selectedRecipes.size > 0 && (
          <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
            <span className={`text-sm font-medium ${config.color}`}>
              {selectedRecipes.size} recipe(s) selected
            </span>
            <button
              onClick={handleAddSelected}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to {mealType} plan
            </button>
            <button
              onClick={() => setSelectedRecipes(new Set())}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => loadPricedRecipes(1, searchTerm)}
              className="mt-2 text-red-600 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading priced recipes...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayRecipes.map(recipe => {
                const isSelected = selectedRecipes.has(recipe.url);

                return (
                  <div
                    key={recipe.url}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {/* Recipe Image */}
                    {recipe.img && (
                      <div className="aspect-video bg-gray-200 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={recipe.img}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => handleRecipeToggle(recipe.url)}
                            className={`p-1 rounded-full ${
                              isSelected 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-600 text-white opacity-75 hover:opacity-100'
                            }`}
                            title={isSelected ? 'Remove from selection' : 'Add to selection'}
                          >
                            {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      {/* Recipe Title */}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {recipe.name}
                      </h3>

                      {/* Recipe Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{recipe.servings} servings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${recipe.salePricePerServing.toFixed(2)}/serving</span>
                        </div>
                      </div>

                      {/* Pricing Information */}
                      <div className="mb-3 p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Total Cost:</span>
                          <div className="flex items-center gap-2">
                            {recipe.totalSavings > 0 && (
                              <span className="text-green-600 font-medium">
                                Save ${recipe.totalSavings.toFixed(2)}
                              </span>
                            )}
                            <span className="font-semibold">${recipe.salePrice.toFixed(2)}</span>
                            {recipe.regularPrice > recipe.salePrice && (
                              <span className="text-gray-500 line-through text-xs">
                                ${recipe.regularPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ingredients Preview */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          {recipe.ingredients.length} ingredients
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {ingredient.recipeIngredientName}
                            </span>
                          ))}
                          {recipe.ingredients.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{recipe.ingredients.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Flyer Items Indicator */}
                      {recipe.ingredients.some(ing => ing.source === 'flyer') && (
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            <Tag className="w-3 h-3" />
                            Flyer deals included
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddSingleRecipe(recipe)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${config.color} ${config.bgColor} hover:opacity-80`}
                        >
                          Add to Plan
                        </button>
                        <button
                          onClick={() => handleRecipeToggle(recipe.url)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Prep Time */}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          Est. prep time: {recipe.estimatedPrepTime}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} recipes
                  {subscriptionInfo && subscriptionInfo.tier === 'free' && !pagination.hasNext && subscriptionInfo.recipesRestrictedBySubscription > 0 && (
                    <span className="text-gray-500">
                      {" "}• {subscriptionInfo.recipesRestrictedBySubscription} more with Premium
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Free Tier Limit Reached Message */}
            {subscriptionInfo && subscriptionInfo.tier === 'free' && !pagination.hasNext && subscriptionInfo.recipesRestrictedBySubscription > 0 && (
              <div className="mt-6 text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Discovered more recipes? 🍳
                </h3>
                <p className="text-gray-600 mb-3">
                  You&apos;ve reached your free browsing limit. Upgrade to Premium to access all {subscriptionInfo.totalRecipesInCatalog} {mealType} recipes, use search, and unlock unlimited meal planning.
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors shadow-lg">
                  Upgrade to Premium
                </button>
              </div>
            )}
          </>
        )}

        {!loading && displayRecipes.length === 0 && !error && (
          <div className="text-center py-8">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              {searchTerm
                ? `No ${mealType} recipes found matching "${searchTerm}"`
                : `No ${mealType} recipes available for this store`
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 text-sm underline"
              >
                Clear search to see all recipes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};