import { create } from 'zustand';

// Types - extracted from the original store
export interface Ingredient {
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
}

export interface Recipe {
  // Basic recipe identification
  name: string;
  url: string;
  img?: string;

  // Pricing information
  price: number;
  salePrice: number;
  regularPrice: number;
  totalSavings: number;

  // Recipe details
  servings: number;
  flyerItemsCount: number;
  ingredients: Ingredient[];

  // Selection state - SINGLE SOURCE OF TRUTH
  multiplier: number;         // 0 = not selected, >0 = selected with this multiplier
  isSelected: boolean;        // Computed property: multiplier > 0

  // Context information
  store: string;
  location: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  date: string;

  // Temporal validity
  validFromDate: string;
  validToDate: string;

  // Additional context
  pricingContext?: {
    store: string;
    location: string;
    dataDate: string;
    validFromDate: string;
    validToDate: string;
    queryDate: string;
  };
}

export interface MealCategory {
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
}

// API Response types
interface DualPricedIngredient {
  name: string;
  quantity: number;
  unit: string;
  type?: string;
  regularListPrice: number;
  saleListPrice: number;
  regularPrice: number;
  regularSource: 'flyer' | 'database' | 'missing' | 'skipped' | 'free';
  regularSourceName?: string;
  regularSourceDate?: string;
  regularConversionFailed?: boolean;
  regularUnitSize?: number;
  regularUnitType?: string;
  regularFractionUsed?: number;
  regularProductName?: string;
  salePrice: number;
  saleSource: 'flyer' | 'database' | 'missing' | 'skipped' | 'free';
  saleSourceName?: string;
  saleSourceDate?: string;
  saleConversionFailed?: boolean;
  saleUnitSize?: number;
  saleUnitType?: string;
  saleFractionUsed?: number;
  saleProductName?: string;
  onSale: boolean;
  savings: number;
  savingsPercentage: number;
  regularPriceAlias?: string;
  salePriceAlias?: string;
  densityAlias?: string;
  recipeIngredientName: string;
  category?: string;
}

interface APIResponse {
  success: boolean;
  error?: string;
}

interface MealDataResponse extends APIResponse {
  data?: Array<{
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
    ingredients: DualPricedIngredient[];
  }>;
  total?: number;
  userPreferences?: {
    applied: boolean;
    maxIngredients?: number;
    maxPricePerPortion?: number;
    bannedIngredientsCount?: number;
    bannedRecipesCount?: number;
  };
}

// Store interface for dependency injection
export interface Store {
  id: string;
  name: string;
  location: string;
  validUntil: Date;
  filename: string;
  isAvailable: boolean;
  logo?: string;
  lat?: number;
  lng?: number;
  distance?: number;
  geocoded_address?: string;
  geocoded_at?: string;
}

// API Call function type
type APICallFunction = (
  endpoint: string,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: unknown,
  requireAuth?: boolean
) => Promise<unknown>;

interface MealPlanState {
  // Core data
  meals: MealCategory;
  normalMealServings: number;

  // Loading states - now per meal type
  isDataLoaded: boolean;
  isLoading: boolean;
  loadingMealTypes: Set<'breakfast' | 'lunch' | 'dinner'>; // Track which meal types are loading
  error: string | null;

  // Actions - Configuration
  setNormalMealServings: (servings: number) => void;

  // Actions - Data management
  fetchMealData: (selectedStore: Store, makeAPICall: APICallFunction) => Promise<void>; // Keep for backward compatibility
  fetchMealRecommendations: (mealType: 'breakfast' | 'lunch' | 'dinner', selectedStore: Store, makeAPICall: APICallFunction) => Promise<void>; // New action
  setMeals: (meals: MealCategory) => void;
  clearMealData: () => void;

  // Actions - Recipe selection
  toggleMeal: (url: string) => void;
  setRecipeMultiplier: (url: string, multiplier: number) => void;

  // Computed values
  selectedRecipes: () => Recipe[];
  mealSummary: () => { breakfast: number; lunch: number; dinner: number; total: number };
  calculateInitialMultiplier: (servings: number) => number;
  isMealTypeLoading: (mealType: 'breakfast' | 'lunch' | 'dinner') => boolean; // Check if specific meal type is loading

  // Event callbacks (for triggering saves in other stores)
  onStateChange?: () => void;
}

// Helper function to round up to the nearest 0.5
const roundUpToHalf = (num: number): number => {
  return Math.ceil(num * 2) / 2;
};

// Transform API response to Recipe format
const transformMealPlanToRecipe = (
  mealPlan: NonNullable<MealDataResponse['data']>[0],
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Recipe => ({
  name: mealPlan.name,
  url: mealPlan.url,
  img: mealPlan.img,
  price: mealPlan.salePrice,
  salePrice: mealPlan.salePrice,
  regularPrice: mealPlan.regularPrice,
  totalSavings: mealPlan.totalSavings,
  servings: mealPlan.servings,
  flyerItemsCount: mealPlan.ingredients?.filter(ing => ing.saleSource === 'flyer').length || 0,
  ingredients: (mealPlan.ingredients || []).map(ing => ({
    recipeIngredientName: ing.recipeIngredientName,
    saleUnitSize: ing.saleUnitSize || 0,
    saleUnitType: ing.saleUnitType || '',
    salePrice: ing.salePrice,
    saleFractionUsed: ing.saleFractionUsed || 0,
    regularPrice: ing.regularPrice,
    regularFractionUsed: ing.regularFractionUsed || 0,
    type: (ing.type as 'core' | 'optional' | 'garnish' | 'to taste') || 'core',
    source: ing.saleSource,
    sourceDate: ing.saleSourceDate,
    productName: ing.saleProductName || ing.recipeIngredientName,
    packageId: `${ing.saleProductName || ing.recipeIngredientName}-${ing.saleUnitSize || 0}${ing.saleUnitType || ''}`,
    savingsPercentage: ing.savingsPercentage,
    category: ing.category
  })),
  multiplier: 0,
  isSelected: false,
  store: mealPlan.store,
  location: mealPlan.location,
  mealType: mealType,
  date: mealPlan.date,
  validFromDate: mealPlan.validFromDate,
  validToDate: mealPlan.validToDate,
  pricingContext: mealPlan.pricingContext
});

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  // Initial state
  meals: {
    breakfast: [],
    lunch: [],
    dinner: []
  },
  normalMealServings: 4,
  isDataLoaded: false,
  isLoading: false,
  loadingMealTypes: new Set(),
  error: null,
  onStateChange: undefined,

  // Configuration actions
  setNormalMealServings: (servings) => {
    set({ normalMealServings: servings });
    // Trigger state change callback for auto-save
    const state = get();
    state.onStateChange?.();
  },

  // Data management actions
  fetchMealData: async (selectedStore, makeAPICall) => {
    // Keep original behavior for backward compatibility - fetch all meal types
    const state = get();
    const logMessage = (msg: string) => console.log(`[MealPlanStore] ${msg}`);

    if (state.isDataLoaded) {
      logMessage('Data already loaded, skipping fetch');
      return;
    }

    try {
      logMessage(`Starting data fetch for ${selectedStore.name} at ${selectedStore.location} via API`);
      set({ isLoading: true, error: null });

      const validUntilDate = new Date(selectedStore.validUntil);
      const dataDate = new Date(validUntilDate);
      dataDate.setDate(dataDate.getDate() - 7);
      const date = dataDate.toISOString().split('T')[0];

      const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
      const apiCalls = mealTypes.map(async (mealType) => {
        const endpoint = `/meal-plans?store=${encodeURIComponent(selectedStore.name)}&location=${encodeURIComponent(selectedStore.location)}&date=${date}&mealType=${mealType}`;

        logMessage(`Making authenticated API call for ${mealType}: ${endpoint}`);

        const accessToken = localStorage.getItem('accessToken');
        const isAuthenticated = !!(accessToken && accessToken !== 'null');
        const apiResponse = await makeAPICall(endpoint, 'GET', null, isAuthenticated) as MealDataResponse;

        if (!apiResponse.success) {
          throw new Error(`API returned error for ${mealType}: ${apiResponse.error || 'Unknown error'}`);
        }

        return { mealType, data: apiResponse.data || [] };
      });

      const results = await Promise.all(apiCalls);

      const mealCategories: MealCategory = {
        breakfast: [],
        lunch: [],
        dinner: []
      };

      results.forEach(({ mealType, data }) => {
        const recipes: Recipe[] = data.map((mealPlan) => transformMealPlanToRecipe(mealPlan, mealType));
        mealCategories[mealType] = recipes;
        logMessage(`Processed ${recipes.length} ${mealType} recipes`);
      });

      set({
        meals: mealCategories,
        isLoading: false,
        isDataLoaded: true,
        error: null
      });

      logMessage('Meal data fetch completed successfully');

    } catch (err) {
      console.error("Error fetching meal data:", err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load meal plan',
        isDataLoaded: false
      });
    }
  },

  // NEW: Fetch recommendations for a specific meal type
  fetchMealRecommendations: async (mealType, selectedStore, makeAPICall) => {
    const state = get();
    const logMessage = (msg: string) => console.log(`[MealPlanStore] ${msg}`);

    // Check if this meal type is already loaded
    if (state.meals[mealType].length > 0) {
      logMessage(`${mealType} already has data, skipping fetch`);
      return;
    }

    try {
      logMessage(`Fetching recommendations for ${mealType} from ${selectedStore.name}`);

      // Add this meal type to loading set
      set(state => ({
        loadingMealTypes: new Set([...state.loadingMealTypes, mealType]),
        error: null
      }));

      const validUntilDate = new Date(selectedStore.validUntil);
      const dataDate = new Date(validUntilDate);
      dataDate.setDate(dataDate.getDate() - 7);
      const date = dataDate.toISOString().split('T')[0];

      const endpoint = `/meal-plans?store=${encodeURIComponent(selectedStore.name)}&location=${encodeURIComponent(selectedStore.location)}&date=${date}&mealType=${mealType}`;

      logMessage(`Making authenticated API call for ${mealType}: ${endpoint}`);

      const accessToken = localStorage.getItem('accessToken');
      const isAuthenticated = !!(accessToken && accessToken !== 'null');
      const apiResponse = await makeAPICall(endpoint, 'GET', null, isAuthenticated) as MealDataResponse;

      if (!apiResponse.success) {
        throw new Error(`API returned error for ${mealType}: ${apiResponse.error || 'Unknown error'}`);
      }

      const recipes: Recipe[] = (apiResponse.data || []).map((mealPlan) => transformMealPlanToRecipe(mealPlan, mealType));

      logMessage(`Processed ${recipes.length} ${mealType} recipes`);

      // Update only this meal type
      set(state => {
        const newLoadingMealTypes = new Set(state.loadingMealTypes);
        newLoadingMealTypes.delete(mealType);

        return {
          meals: {
            ...state.meals,
            [mealType]: recipes
          },
          loadingMealTypes: newLoadingMealTypes,
          error: null,
          // Mark as data loaded if this was the first meal type loaded
          isDataLoaded: state.isDataLoaded || recipes.length > 0
        };
      });

      logMessage(`${mealType} recommendations fetch completed successfully`);

    } catch (err) {
      console.error(`Error fetching ${mealType} recommendations:`, err);
      set(state => {
        const newLoadingMealTypes = new Set(state.loadingMealTypes);
        newLoadingMealTypes.delete(mealType);

        return {
          loadingMealTypes: newLoadingMealTypes,
          error: err instanceof Error ? err.message : `Failed to load ${mealType} recommendations`
        };
      });
    }
  },

  setMeals: (meals) => {
    set({ meals });
  },

  clearMealData: () => {
    set({
      meals: {
        breakfast: [],
        lunch: [],
        dinner: []
      },
      isDataLoaded: false,
      loadingMealTypes: new Set(),
      error: null
    });
  },

  // Recipe selection actions
  toggleMeal: (url) => {
    set((state) => {
      const updatedMeals = { ...state.meals };

      // Find and update the recipe across all meal types
      (Object.keys(updatedMeals) as Array<keyof MealCategory>).forEach(mealType => {
        updatedMeals[mealType] = updatedMeals[mealType].map(recipe => {
          if (recipe.url === url) {
            const newMultiplier = recipe.multiplier > 0 ? 0 : state.calculateInitialMultiplier(recipe.servings);
            return {
              ...recipe,
              multiplier: newMultiplier,
              isSelected: newMultiplier > 0
            };
          }
          return recipe;
        });
      });

      return { meals: updatedMeals };
    });

    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      console.log('[MealPlanStore] toggleMeal completed, calling onStateChange?', !!state.onStateChange);
      state.onStateChange?.();
    }, 0);
  },

  setRecipeMultiplier: (url, multiplier) => {
    set((state) => {
      const updatedMeals = { ...state.meals };
      const newMultiplier = Math.max(0, multiplier);

      (Object.keys(updatedMeals) as Array<keyof MealCategory>).forEach(mealType => {
        updatedMeals[mealType] = updatedMeals[mealType].map(recipe => {
          if (recipe.url === url) {
            return {
              ...recipe,
              multiplier: newMultiplier,
              isSelected: newMultiplier > 0
            };
          }
          return recipe;
        });
      });

      return { meals: updatedMeals };
    });

    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      state.onStateChange?.();
    }, 0);
  },

  // Computed values
  selectedRecipes: () => {
    const state = get();
    const allRecipes = [
      ...state.meals.breakfast,
      ...state.meals.lunch,
      ...state.meals.dinner
    ];

    return allRecipes.filter(recipe => recipe.isSelected);
  },

  mealSummary: () => {
    const state = get();
    const summary = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      total: 0
    };

    (Object.keys(summary) as Array<keyof typeof summary>).forEach(category => {
      if (category !== 'total') {
        summary[category] = state.meals[category].filter(recipe => recipe.isSelected).length;
        summary.total += summary[category];
      }
    });

    return summary;
  },

  calculateInitialMultiplier: (servings) => {
    const state = get();
    // Round up to nearest 0.5
    return roundUpToHalf(state.normalMealServings / servings);
  },

  // NEW: Check if specific meal type is loading
  isMealTypeLoading: (mealType) => {
    const state = get();
    return state.loadingMealTypes.has(mealType);
  },
}));