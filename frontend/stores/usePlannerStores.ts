import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useMealPlanStore, type Recipe, type MealCategory, type Ingredient } from './useMealPlanStore';
import { useGroceryStore, type AggregatedItem, type Totals, type IngredientTags } from './useGroceryStore';
import { useStoreLocationStore, type Store, type UserLocation, type StoreLocation } from './useStoreLocationStore';
import { useUserPreferencesStore } from './useUserPreferencesStore';
import { usePlanSyncStore, type PlanData } from './usePlanSyncStore';

// Re-export types for easier importing
export type { Recipe, MealCategory, Ingredient, AggregatedItem, Totals, IngredientTags, Store, UserLocation, StoreLocation, PlanData };

// API Call function type
type APICallFunction = (
  endpoint: string,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: unknown,
  requireAuth?: boolean
) => Promise<unknown>;

// Combined interface that maintains backward compatibility
export interface PlannerStores {
  // ===== MEAL PLAN STORE =====
  // Data
  meals: MealCategory;
  normalMealServings: number;
  isDataLoaded: boolean;
  isLoading: boolean;

  // Actions
  setNormalMealServings: (servings: number) => void;
  fetchMealData: () => Promise<void>;
  setMeals: (meals: MealCategory) => void;
  clearMealData: () => void;
  toggleMeal: (url: string) => void;
  setRecipeMultiplier: (url: string, multiplier: number) => void;

  // Computed
  selectedRecipes: () => Recipe[];
  mealSummary: () => { breakfast: number; lunch: number; dinner: number; total: number };
  calculateInitialMultiplier: (servings: number) => number;

  // ===== GROCERY STORE =====
  // Data
  groceryCheckedItems: Set<string>;
  ingredientTags: Record<string, IngredientTags>;

  // Actions
  toggleGroceryItem: (packageId: string) => void;
  setGroceryCheckedItems: (items: Set<string>) => void;
  clearGroceryCheckedItems: () => void;
  setIngredientTag: (packageId: string, tag: keyof IngredientTags, value: string | undefined) => void;
  setIngredientTags: (packageId: string, tags: Partial<IngredientTags>) => void;
  setAllIngredientTags: (tags: Record<string, IngredientTags>) => void;
  clearIngredientTags: () => void;

  // Computed (these are cross-store computed values)
  aggregatedIngredients: () => Map<string, AggregatedItem>;
  totals: () => Totals;
  groceryTotals: () => {
    totalItems: number;
    checkedItems: number;
    uncheckedItems: number;
    totalCost: number;
    checkedCost: number;
    uncheckedCost: number;
  };

  // Utility
  isItemChecked: (packageId: string) => boolean;
  getItemTags: (packageId: string) => IngredientTags | undefined;
  getCheckedItemsArray: () => string[];

  // ===== STORE LOCATION STORE =====
  // Data
  availableStores: Store[];
  selectedStore: string | null;
  isStoresLoaded: boolean;
  userLocation: UserLocation | null;
  locationError: string | null;
  isLocationLoading: boolean;

  // Actions
  setSelectedStore: (storeId: string | null) => void;
  discoverStores: () => Promise<void>;
  refreshStores: () => Promise<void>;
  setUserLocation: (location: UserLocation | null) => void;
  clearUserLocation: () => void;
  setLocationError: (error: string | null) => void;
  setLocationLoading: (loading: boolean) => void;
  geocodeStoreAddress: (storeId: string, address: string) => Promise<void>;

  // Computed
  getSelectedStore: () => Store | null;
  getAvailableStores: () => Store[];
  getNearbyStores: (maxDistance?: number) => Store[];
  getStoreById: (storeId: string) => Store | null;

  // ===== USER PREFERENCES STORE =====
  // Access to the full user preferences store
  userPreferences: ReturnType<typeof useUserPreferencesStore>;

  // ===== PLAN SYNC STORE =====
  // Sync state
  isSyncing: boolean;
  lastSynced: Date | null;
  lastSyncError: string | null;
  planId: string | null;
  version: number;

  // Actions
  loadUserPlan: (makeAPICall: APICallFunction) => Promise<void>;
  saveUserPlan: (makeAPICall: APICallFunction) => Promise<void>;
  deleteUserPlan: (makeAPICall: APICallFunction) => Promise<void>;
  debouncedSave: () => void;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  hasUnsavedChanges: () => boolean;
  getLastSyncInfo: () => { lastSynced: Date | null; planId: string | null; version: number };

  // ===== GLOBAL STATE =====
  error: string | null; // Combined error state from all stores

  // ===== BACKWARD COMPATIBILITY HELPERS =====
  // These maintain the exact same API as the original monolithic store
  hasLoadablePlan: () => boolean;
}

export const usePlannerStores = (): PlannerStores => {
  // Initialize all stores
  const mealPlan = useMealPlanStore();
  const grocery = useGroceryStore();
  const storeLocation = useStoreLocationStore();
  const userPreferences = useUserPreferencesStore();
  const planSync = usePlanSyncStore();

  // Move timeout management to React component (not Zustand store)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const baselineSetRef = useRef<boolean>(false); // Prevent infinite baseline creation

  // ===== SETUP CROSS-STORE COMMUNICATION =====

  // Setup auto-save callbacks
  useEffect(() => {
    // Create the data getter function for plan sync
    const getPlanData = (): PlanData => {
      const selectedRecipes = mealPlan.selectedRecipes();

      // Extract ALL recipes with their selection state (like the original)
      const allRecipes = [
        ...mealPlan.meals.breakfast,
        ...mealPlan.meals.lunch,
        ...mealPlan.meals.dinner
      ].map(recipe => ({
        url: recipe.url,
        name: recipe.name,
        img: recipe.img,
        salePrice: recipe.salePrice,
        regularPrice: recipe.regularPrice,
        totalSavings: recipe.totalSavings,
        servings: recipe.servings,
        flyerItemsCount: recipe.flyerItemsCount,
        ingredients: recipe.ingredients,
        isSelected: recipe.isSelected,
        multiplier: recipe.multiplier,
        store: recipe.store,
        location: recipe.location,
        validFromDate: recipe.validFromDate,
        validToDate: recipe.validToDate,
        mealType: recipe.mealType,
        date: recipe.date,
        pricingContext: recipe.pricingContext
      }));

      return {
        householdSize: mealPlan.normalMealServings,
        selectedStore: storeLocation.selectedStore,
        allRecipes,
        groceryCheckedItems: grocery.getCheckedItemsArray(),
        ingredientTags: grocery.ingredientTags,
      };
    };

    // Create the auto-save function with React-managed timeout
    const triggerAutoSave = () => {
      const makeAPICall = (window as any).__plannerMakeAPICall;

      if (!makeAPICall) {
        return;
      }

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout using React ref (not Zustand state)
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('[PlannerStores] ⏰ React timeout executing auto-save...');

          const currentPlanData = getPlanData();

          // Check if we have authentication available
          const makeAPICall = (window as any).__plannerMakeAPICall;
          if (!makeAPICall) {
            console.log('[PlannerStores] No API call function available, skipping auto-save');
            return;
          }

          // AUTHENTICATION CHECK: Test if user is authenticated before attempting save
          try {
            // Try a simple authenticated request to verify the user is still logged in
            await makeAPICall('/auth/verify', 'GET', null, true);
          } catch (authError) {
            console.log('[PlannerStores] User not authenticated, skipping auto-save');
            return;
          }

          // Check if there are actually changes
          if (!planSync.hasUnsavedChanges(() => currentPlanData)) {
            console.log('[PlannerStores] No changes detected, skipping auto-save');
            return;
          }

          // Validate minimum required data
          if (!currentPlanData.selectedStore) {
            console.log('[PlannerStores] No store selected, skipping auto-save');
            return;
          }

          console.log('[PlannerStores] Changes detected, executing auto-save...');
          await planSync.saveUserPlan(makeAPICall, () => currentPlanData);
          console.log('[PlannerStores] Auto-save completed successfully');

        } catch (error) {
          // Handle different types of errors gracefully
          if (error instanceof Error) {
            if (error.message.includes('Authentication') || error.message.includes('expired')) {
              console.log('[PlannerStores] Auto-save skipped - user authentication expired');
            } else {
              console.error('[PlannerStores] Auto-save failed:', error.message);
            }
          } else {
            console.error('[PlannerStores] Auto-save failed with unknown error:', error);
          }
        }
      }, 10000);
    };

    // Set up auto-save callbacks in individual stores
    mealPlan.onStateChange = triggerAutoSave;
    grocery.onStateChange = triggerAutoSave;

    // Cleanup
    return () => {
      mealPlan.onStateChange = undefined;
      grocery.onStateChange = undefined;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      baselineSetRef.current = false; // Reset for next mount
    };
  }, [mealPlan, grocery, planSync, storeLocation.selectedStore]);

  // CREATE INITIAL BASELINE - Separate useEffect to avoid infinite loops
  useEffect(() => {
    if (storeLocation.selectedStore &&
        mealPlan.meals.breakfast.length > 0 &&
        !baselineSetRef.current) {

      // Create the data getter function for baseline
      const getPlanData = (): PlanData => {
        const allRecipes = [
          ...mealPlan.meals.breakfast,
          ...mealPlan.meals.lunch,
          ...mealPlan.meals.dinner
        ].map(recipe => ({
          url: recipe.url,
          name: recipe.name,
          img: recipe.img,
          salePrice: recipe.salePrice,
          regularPrice: recipe.regularPrice,
          totalSavings: recipe.totalSavings,
          servings: recipe.servings,
          flyerItemsCount: recipe.flyerItemsCount,
          ingredients: recipe.ingredients,
          isSelected: recipe.isSelected,
          multiplier: recipe.multiplier,
          store: recipe.store,
          location: recipe.location,
          validFromDate: recipe.validFromDate,
          validToDate: recipe.validToDate,
          mealType: recipe.mealType,
          date: recipe.date,
          pricingContext: recipe.pricingContext
        }));

        return {
          householdSize: mealPlan.normalMealServings,
          selectedStore: storeLocation.selectedStore,
          allRecipes,
          groceryCheckedItems: grocery.getCheckedItemsArray(),
          ingredientTags: grocery.ingredientTags,
        };
      };

      const initialData = getPlanData();
      const initialSnapshot = planSync.createStateSnapshot(initialData);

      // Mark that we've set the baseline to prevent infinite loops
      baselineSetRef.current = true;

      // Use the Zustand store's setState method
      (usePlanSyncStore as any).setState({ lastSavedState: initialSnapshot });
    }
  }, [storeLocation.selectedStore, mealPlan.meals.breakfast.length]); // Only depend on store and data existence

  // ===== CROSS-STORE COMPUTED VALUES =====

  // Memoize expensive computations that depend on multiple stores
  const aggregatedIngredients = useCallback(() => {
    return grocery.aggregatedIngredients(mealPlan.selectedRecipes());
  }, [grocery, mealPlan]);

  const totals = useCallback(() => {
    return grocery.totals(mealPlan.selectedRecipes());
  }, [grocery, mealPlan]);

  const groceryTotals = useCallback(() => {
    return grocery.groceryTotals(mealPlan.selectedRecipes());
  }, [grocery, mealPlan]);

  // ===== ENHANCED ACTIONS WITH CROSS-STORE COORDINATION =====

  const enhancedFetchMealData = useCallback(async () => {
    const selectedStoreObj = storeLocation.getSelectedStore();
    if (!selectedStoreObj) {
      console.warn('[PlannerStores] No store selected for fetching meal data');
      return;
    }

    const makeAPICall = (window as any).__plannerMakeAPICall;
    if (!makeAPICall) {
      throw new Error('Authentication not available. Please log in.');
    }

    await mealPlan.fetchMealData(selectedStoreObj, makeAPICall);
  }, [mealPlan, storeLocation]);

  const enhancedSetSelectedStore = useCallback((storeId: string | null) => {
    // Clear meal data when changing stores
    mealPlan.clearMealData();

    // Set the store
    storeLocation.setSelectedStore(storeId);
  }, [mealPlan, storeLocation]);

  const enhancedLoadUserPlan = useCallback(async (makeAPICall: APICallFunction) => {
    const setPlanData = (data: Partial<PlanData>) => {

      // Update individual stores
      if (data.householdSize !== undefined) {
        mealPlan.setNormalMealServings(data.householdSize);
      }

      if (data.selectedStore !== undefined) {
        // Don't clear meal data during load - we want to preserve it
        storeLocation.setSelectedStore(data.selectedStore);
      }

      if (data.groceryCheckedItems !== undefined) {
        grocery.setGroceryCheckedItems(new Set(data.groceryCheckedItems));
      }

      if (data.ingredientTags !== undefined) {
        grocery.setAllIngredientTags(data.ingredientTags);
      }

      // Handle enriched recipes from backend
      if (data.allRecipes && data.allRecipes.length > 0) {
        console.log('[PlannerStores] Loading enriched recipes from backend:', data.allRecipes.length);

        // Group the enriched recipes by meal type
        const mealCategories: MealCategory = {
          breakfast: [],
          lunch: [],
          dinner: []
        };

        data.allRecipes.forEach((recipe: any) => {
          const mealType = recipe.mealType as keyof MealCategory;
          if (mealType && mealCategories[mealType]) {
            mealCategories[mealType].push(recipe);
          }
        });

        // Set the meals and mark data as loaded
        mealPlan.setMeals(mealCategories);

        // Mark meal data as loaded since we have enriched recipes
        useMealPlanStore.setState({ isDataLoaded: true });
      }
    };

    await planSync.loadUserPlan(makeAPICall, setPlanData);
  }, [planSync, mealPlan, storeLocation, grocery]);

  const enhancedSaveUserPlan = useCallback(async (makeAPICall: APICallFunction) => {
    const getPlanData = (): PlanData => {
      const allRecipes = [
        ...mealPlan.meals.breakfast,
        ...mealPlan.meals.lunch,
        ...mealPlan.meals.dinner
      ].map(recipe => ({
        url: recipe.url,
        name: recipe.name,
        img: recipe.img,
        salePrice: recipe.salePrice,
        regularPrice: recipe.regularPrice,
        totalSavings: recipe.totalSavings,
        servings: recipe.servings,
        flyerItemsCount: recipe.flyerItemsCount,
        ingredients: recipe.ingredients,
        isSelected: recipe.isSelected,
        multiplier: recipe.multiplier,
        store: recipe.store,
        location: recipe.location,
        validFromDate: recipe.validFromDate,
        validToDate: recipe.validToDate,
        mealType: recipe.mealType,
        date: recipe.date,
        pricingContext: recipe.pricingContext
      }));

      return {
        householdSize: mealPlan.normalMealServings,
        selectedStore: storeLocation.selectedStore,
        allRecipes,
        groceryCheckedItems: grocery.getCheckedItemsArray(),
        ingredientTags: grocery.ingredientTags,
      };
    };

    await planSync.saveUserPlan(makeAPICall, getPlanData);
  }, [planSync, mealPlan, storeLocation, grocery]);

  const enhancedDebouncedSave = useCallback(() => {
    const makeAPICall = (window as any).__plannerMakeAPICall;
    if (!makeAPICall) {
      console.warn('[PlannerStores] makeAPICall not available for debounced save');
      return;
    }

    const getPlanData = (): PlanData => {
      const allRecipes = [
        ...mealPlan.meals.breakfast,
        ...mealPlan.meals.lunch,
        ...mealPlan.meals.dinner
      ].map(recipe => ({
        url: recipe.url,
        name: recipe.name,
        img: recipe.img,
        salePrice: recipe.salePrice,
        regularPrice: recipe.regularPrice,
        totalSavings: recipe.totalSavings,
        servings: recipe.servings,
        flyerItemsCount: recipe.flyerItemsCount,
        ingredients: recipe.ingredients,
        isSelected: recipe.isSelected,
        multiplier: recipe.multiplier,
        store: recipe.store,
        location: recipe.location,
        validFromDate: recipe.validFromDate,
        validToDate: recipe.validToDate,
        mealType: recipe.mealType,
        date: recipe.date,
        pricingContext: recipe.pricingContext
      }));

      return {
        householdSize: mealPlan.normalMealServings,
        selectedStore: storeLocation.selectedStore,
        allRecipes,
        groceryCheckedItems: grocery.getCheckedItemsArray(),
        ingredientTags: grocery.ingredientTags,
      };
    };

    planSync.debouncedSave(getPlanData, makeAPICall);
  }, [planSync, mealPlan, storeLocation, grocery]);

  const enhancedHasUnsavedChanges = useCallback(() => {
    const getPlanData = (): PlanData => {
      const allRecipes = [
        ...mealPlan.meals.breakfast,
        ...mealPlan.meals.lunch,
        ...mealPlan.meals.dinner
      ].map(recipe => ({
        url: recipe.url,
        name: recipe.name,
        img: recipe.img,
        salePrice: recipe.salePrice,
        regularPrice: recipe.regularPrice,
        totalSavings: recipe.totalSavings,
        servings: recipe.servings,
        flyerItemsCount: recipe.flyerItemsCount,
        ingredients: recipe.ingredients,
        isSelected: recipe.isSelected,
        multiplier: recipe.multiplier,
        store: recipe.store,
        location: recipe.location,
        validFromDate: recipe.validFromDate,
        validToDate: recipe.validToDate,
        mealType: recipe.mealType,
        date: recipe.date,
        pricingContext: recipe.pricingContext
      }));

      return {
        householdSize: mealPlan.normalMealServings,
        selectedStore: storeLocation.selectedStore,
        allRecipes,
        groceryCheckedItems: grocery.getCheckedItemsArray(),
        ingredientTags: grocery.ingredientTags,
      };
    };

    return planSync.hasUnsavedChanges(getPlanData);
  }, [planSync, mealPlan, storeLocation, grocery]);

  // ===== COMPUTE COMBINED ERROR STATE =====
  const combinedError = useMemo(() => {
    return mealPlan.error || storeLocation.error || planSync.lastSyncError;
  }, [mealPlan.error, storeLocation.error, planSync.lastSyncError]);

  // ===== BACKWARD COMPATIBILITY HELPERS =====
  const hasLoadablePlan = useCallback(() => {
    return !!(planSync.planId && storeLocation.selectedStore && planSync.lastSynced);
  }, [planSync.planId, storeLocation.selectedStore, planSync.lastSynced]);

  // ===== RETURN UNIFIED INTERFACE =====
  return {
    // Meal Plan Store
    meals: mealPlan.meals,
    normalMealServings: mealPlan.normalMealServings,
    isDataLoaded: mealPlan.isDataLoaded,
    isLoading: mealPlan.isLoading,
    setNormalMealServings: mealPlan.setNormalMealServings,
    fetchMealData: enhancedFetchMealData,
    setMeals: mealPlan.setMeals,
    clearMealData: mealPlan.clearMealData,
    toggleMeal: mealPlan.toggleMeal,
    setRecipeMultiplier: mealPlan.setRecipeMultiplier,
    selectedRecipes: mealPlan.selectedRecipes,
    mealSummary: mealPlan.mealSummary,
    calculateInitialMultiplier: mealPlan.calculateInitialMultiplier,

    // Grocery Store
    groceryCheckedItems: grocery.groceryCheckedItems,
    ingredientTags: grocery.ingredientTags,
    toggleGroceryItem: grocery.toggleGroceryItem,
    setGroceryCheckedItems: grocery.setGroceryCheckedItems,
    clearGroceryCheckedItems: grocery.clearGroceryCheckedItems,
    setIngredientTag: grocery.setIngredientTag,
    setIngredientTags: grocery.setIngredientTags,
    setAllIngredientTags: grocery.setAllIngredientTags,
    clearIngredientTags: grocery.clearIngredientTags,
    aggregatedIngredients,
    totals,
    groceryTotals,
    isItemChecked: grocery.isItemChecked,
    getItemTags: grocery.getItemTags,
    getCheckedItemsArray: grocery.getCheckedItemsArray,

    // Store Location Store
    availableStores: storeLocation.availableStores,
    selectedStore: storeLocation.selectedStore,
    isStoresLoaded: storeLocation.isStoresLoaded,
    userLocation: storeLocation.userLocation,
    locationError: storeLocation.locationError,
    isLocationLoading: storeLocation.isLocationLoading,
    setSelectedStore: enhancedSetSelectedStore,
    discoverStores: storeLocation.discoverStores,
    refreshStores: storeLocation.refreshStores,
    setUserLocation: storeLocation.setUserLocation,
    clearUserLocation: storeLocation.clearUserLocation,
    setLocationError: storeLocation.setLocationError,
    setLocationLoading: storeLocation.setLocationLoading,
    geocodeStoreAddress: storeLocation.geocodeStoreAddress,
    getSelectedStore: storeLocation.getSelectedStore,
    getAvailableStores: storeLocation.getAvailableStores,
    getNearbyStores: storeLocation.getNearbyStores,
    getStoreById: storeLocation.getStoreById,

    // User Preferences Store (full access)
    userPreferences,

    // Plan Sync Store
    isSyncing: planSync.isSyncing,
    lastSynced: planSync.lastSynced,
    lastSyncError: planSync.lastSyncError,
    planId: planSync.planId,
    version: planSync.version,
    loadUserPlan: enhancedLoadUserPlan,
    saveUserPlan: enhancedSaveUserPlan,
    deleteUserPlan: planSync.deleteUserPlan,
    debouncedSave: enhancedDebouncedSave,
    enableAutoSave: planSync.enableAutoSave,
    disableAutoSave: planSync.disableAutoSave,
    hasUnsavedChanges: enhancedHasUnsavedChanges,
    getLastSyncInfo: planSync.getLastSyncInfo,

    // Combined state
    error: combinedError,

    // Backward compatibility
    hasLoadablePlan,
  };
};

// Non-hook accessor for direct store access (outside React components)
export const getPlannerStores = () => {
  const mealPlan = useMealPlanStore.getState();
  const grocery = useGroceryStore.getState();
  const storeLocation = useStoreLocationStore.getState();
  const userPreferences = useUserPreferencesStore.getState();
  const planSync = usePlanSyncStore.getState();

  // Create enhanced action functions that coordinate between stores
  const enhancedSaveUserPlan = async (makeAPICall: APICallFunction) => {
    const getPlanData = (): PlanData => {
      const allRecipes = [
        ...mealPlan.meals.breakfast,
        ...mealPlan.meals.lunch,
        ...mealPlan.meals.dinner
      ].map(recipe => ({
        url: recipe.url,
        name: recipe.name,
        img: recipe.img,
        salePrice: recipe.salePrice,
        regularPrice: recipe.regularPrice,
        totalSavings: recipe.totalSavings,
        servings: recipe.servings,
        flyerItemsCount: recipe.flyerItemsCount,
        ingredients: recipe.ingredients,
        isSelected: recipe.isSelected,
        multiplier: recipe.multiplier,
        store: recipe.store,
        location: recipe.location,
        validFromDate: recipe.validFromDate,
        validToDate: recipe.validToDate,
        mealType: recipe.mealType,
        date: recipe.date,
        pricingContext: recipe.pricingContext
      }));

      return {
        householdSize: mealPlan.normalMealServings,
        selectedStore: storeLocation.selectedStore,
        allRecipes,
        groceryCheckedItems: Array.from(grocery.groceryCheckedItems),
        ingredientTags: grocery.ingredientTags,
      };
    };

    await planSync.saveUserPlan(makeAPICall, getPlanData);
  };

  const enhancedHasUnsavedChanges = () => {
    const getPlanData = (): PlanData => {
      const allRecipes = [
        ...mealPlan.meals.breakfast,
        ...mealPlan.meals.lunch,
        ...mealPlan.meals.dinner
      ].map(recipe => ({
        url: recipe.url,
        name: recipe.name,
        img: recipe.img,
        salePrice: recipe.salePrice,
        regularPrice: recipe.regularPrice,
        totalSavings: recipe.totalSavings,
        servings: recipe.servings,
        flyerItemsCount: recipe.flyerItemsCount,
        ingredients: recipe.ingredients,
        isSelected: recipe.isSelected,
        multiplier: recipe.multiplier,
        store: recipe.store,
        location: recipe.location,
        validFromDate: recipe.validFromDate,
        validToDate: recipe.validToDate,
        mealType: recipe.mealType,
        date: recipe.date,
        pricingContext: recipe.pricingContext
      }));

      return {
        householdSize: mealPlan.normalMealServings,
        selectedStore: storeLocation.selectedStore,
        allRecipes,
        groceryCheckedItems: Array.from(grocery.groceryCheckedItems),
        ingredientTags: grocery.ingredientTags,
      };
    };

    return planSync.hasUnsavedChanges(getPlanData);
  };

  return {
    // Direct state access
    getState: () => ({
      meals: mealPlan.meals,
      selectedStore: storeLocation.selectedStore,
      selectedRecipes: mealPlan.selectedRecipes(),
      isDataLoaded: mealPlan.isDataLoaded,
      isLoading: mealPlan.isLoading,
      availableStores: storeLocation.availableStores,
      error: mealPlan.error || storeLocation.error || planSync.lastSyncError,
      // Add other commonly accessed properties
      normalMealServings: mealPlan.normalMealServings,
      groceryCheckedItems: grocery.groceryCheckedItems,
      ingredientTags: grocery.ingredientTags,
      isStoresLoaded: storeLocation.isStoresLoaded,
      isSyncing: planSync.isSyncing,
      lastSynced: planSync.lastSynced,
    }),

    // Direct actions
    setState: (newState: any) => {
      // Handle setState calls by routing to appropriate stores
      if (newState.selectedStore !== undefined) {
        storeLocation.setSelectedStore(newState.selectedStore);
      }
      if (newState.isLoading !== undefined) {
        useMealPlanStore.setState({ isLoading: newState.isLoading });
      }
      if (newState.error !== undefined) {
        useMealPlanStore.setState({ error: newState.error });
      }
      if (newState.isDataLoaded !== undefined) {
        useMealPlanStore.setState({ isDataLoaded: newState.isDataLoaded });
      }
      if (newState.availableStores !== undefined) {
        useStoreLocationStore.setState({ availableStores: newState.availableStores });
      }
    },

    // Direct method access
    fetchMealData: async () => {
      const selectedStore = storeLocation.getSelectedStore();
      if (selectedStore) {
        const makeAPICall = (window as any).__plannerMakeAPICall;
        await mealPlan.fetchMealData(selectedStore, makeAPICall);
      }
    },

    selectedRecipes: mealPlan.selectedRecipes,

    // Add the missing methods
    hasUnsavedChanges: enhancedHasUnsavedChanges,
    saveUserPlan: enhancedSaveUserPlan,
  };
};