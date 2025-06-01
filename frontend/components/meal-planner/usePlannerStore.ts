import { create } from 'zustand';

// Configuration - Force production API for now
const API_URL = 'https://api.skrimp.ai';

// Types (keeping your existing types)
export interface Store {
  id: string;
  name: string;
  location: string;
  validUntil: Date;
  filename: string;
  isAvailable: boolean;
  logo?: string;
  // New fields from CSV
  location_name?: string;
  city?: string;
  postal_code?: string;
  coordinates?: string;
  flyer?: string;
}

export interface IngredientTags {
  importance?: 'core' | 'optional';
  status?: 'bought' | 'owned' | 'in_cart' | 'ignored';
  storeSection?: string;
}

export interface Ingredient {
  recipeIngredientName: string;
  saleUnitSize?: number;
  saleUnitType?: string;
  salePrice: number;
  saleFractionUsed?: number;
  regularPrice: number;
  regularFractionUsed?: number;
  type?: 'core' | 'optional' | 'garnish' | 'to taste';
  source: 'flyer' | 'database' | 'skipped' | 'free';
  sourceDate?: string;
  productName?: string;
  packageId?: string;
  savingsPercentage?: number;
  tags?: IngredientTags;
  category?: string;
}

export interface Recipe {
  name: string;
  url: string;
  price: number;
  servings: number;
  salePrice: number;
  regularPrice: number;
  totalSavings: number;
  flyerItemsCount: number;
  ingredients: Ingredient[];
  multiplier?: number;
  img?: string;
}

export interface MealCategory {
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
}

export interface AggregatedItem {
  packageId: string;
  neededFraction: number;
  unitSize: number;
  unitType: string;
  packPrice: number;
  productName: string;
  source: 'flyer' | 'database' | 'skipped' | 'free';
  lineCost: number;
  packsToBuy: number;
  isChecked: boolean;
  savingsPercentage?: number;
  tags?: IngredientTags;
  category?: string;
}

interface Totals {
  regularTotal: number;
  saleTotal: number;
  totalSavings: number;
}

interface PlannerState {
  // Configuration
  normalMealServings: number;

  // Data state
  meals: MealCategory;
  selectedMeals: Set<string>;
  groceryCheckedItems: Set<string>;
  recipeMultipliers: Record<string, number>;
  ingredientTags: Record<string, IngredientTags>;

  // Store state
  availableStores: Store[];
  isStoresLoaded: boolean;
  selectedStore: string | null;
  isLoading: boolean;
  error: string | null;
  isDataLoaded: boolean;

  // Actions
  setSelectedStore: (storeId: string) => void;
  fetchMealData: () => Promise<void>;
  setMeals: (meals: MealCategory) => void;
  toggleMeal: (url: string) => void;
  toggleGroceryItem: (packageId: string) => void;
  setRecipeMultiplier: (url: string, multiplier: number) => void;
  setIngredientTag: (packageId: string, tag: keyof IngredientTags, value: string | undefined) => void;
  setIngredientTags: (packageId: string, tags: Partial<IngredientTags>) => void;
  discoverStores: () => Promise<void>;
  setNormalMealServings: (servings: number) => void;

  // Computed values
  selectedRecipes: () => Recipe[];
  aggregatedIngredients: () => Map<string, AggregatedItem>;
  totals: () => Totals;
  mealSummary: () => { breakfast: number; lunch: number; dinner: number; total: number };
  calculateInitialMultiplier: (servings: number) => number;
}

// For debugging purposes
const logMessage = (msg: string) => {
  console.log(`[PlannerStore] ${msg}`);
};

// Helper function to round up to the nearest 0.5
const roundUpToHalf = (num: number): number => {
  return Math.ceil(num * 2) / 2;
};

// Helper function to transform API meal plan to Recipe format
const transformApiMealPlan = (apiMealPlan: {
  id: string;
  name: string;
  url?: string;
  totalCost?: number;
  salePrice?: number;
  servings?: number;
  regularPrice?: number;
  totalSavings?: number;
  recipes?: Array<{
    ingredients?: Ingredient[];
    [key: string]: unknown;
  }>;
  img?: string;
  [key: string]: unknown;
}): Recipe => {
  // Calculate flyer items count
  const ingredients = apiMealPlan.recipes?.[0]?.ingredients || [];
  const flyerItemsCount = ingredients.filter(
    (ing) => ing.source === 'flyer'
  )?.length || 0;

  return {
    name: apiMealPlan.name,
    url: apiMealPlan.url || `#${apiMealPlan.id}`, // Use ID as fallback URL
    price: apiMealPlan.totalCost || apiMealPlan.salePrice || 0,
    servings: apiMealPlan.servings || 1,
    salePrice: apiMealPlan.salePrice || apiMealPlan.totalCost || 0,
    regularPrice: apiMealPlan.regularPrice || apiMealPlan.salePrice || 0,
    totalSavings: apiMealPlan.totalSavings || 0,
    flyerItemsCount,
    ingredients,
    img: apiMealPlan.img
  };
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  // Configuration
  normalMealServings: 4,

  // Initial data state
  meals: {
    breakfast: [],
    lunch: [],
    dinner: []
  },
  selectedMeals: new Set<string>(),
  groceryCheckedItems: new Set<string>(),
  recipeMultipliers: {},
  ingredientTags: {},

  // Initial store state
  selectedStore: null,
  isLoading: false,
  error: null,
  isDataLoaded: false,
  availableStores: [],
  isStoresLoaded: false,

  // Calculate initial multiplier based on recipe servings and normalMealServings
  calculateInitialMultiplier: (servings: number) => {
    const state = get();
    return roundUpToHalf(state.normalMealServings / servings);
  },

  // Set normal meal servings
  setNormalMealServings: (servings: number) => {
    set({ normalMealServings: servings });
  },

  // Set selected store
  setSelectedStore: (storeId) => {
    logMessage(`Setting store to: ${storeId}`);
    const state = get();
    const store = state.availableStores.find(s => s.id === storeId);

    if (!store || !store.isAvailable) {
      set({ error: 'Selected store is not available' });
      return;
    }

    set({
      selectedStore: storeId,
      isLoading: true,
      error: null,
      isDataLoaded: false
    });
  },

  // Fetch meal data from API based on selected store
  fetchMealData: async () => {
    const state = get();
    logMessage(`fetchMealData called. isDataLoaded: ${state.isDataLoaded}, selectedStore: ${state.selectedStore}`);

    // Skip if already loaded or no store selected
    if (state.isDataLoaded && state.selectedStore) {
      logMessage('Data already loaded, skipping fetch');
      return;
    }

    if (!state.selectedStore) {
      logMessage('No store selected, skipping fetch');
      return;
    }

    const selectedStore = state.availableStores.find(s => s.id === state.selectedStore);
    if (!selectedStore) {
      set({
        error: 'Selected store not found in available stores',
        isLoading: false
      });
      return;
    }

    try {
      logMessage(`Starting API fetch for ${selectedStore.name}`);
      set({ isLoading: true, error: null });

      // Fetch meal plans from API filtered by the selected store's ID
      const response = await fetch(`${API_URL}/meal-plans?store=${encodeURIComponent(selectedStore.id)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch meal plans: ${response.status} ${response.statusText}`);
      }

      const apiData = await response.json();
      logMessage(`API data fetched successfully for store ${selectedStore.name} (${selectedStore.id})`);

      if (!apiData.success || !apiData.data) {
        throw new Error('Invalid API response format');
      }

      // Group meal plans by meal type
      const mealData: MealCategory = {
        breakfast: [],
        lunch: [],
        dinner: []
      };

      apiData.data.forEach((mealPlan: {
        name: string;
        id: string;
        url?: string;
        totalCost?: number;
        salePrice?: number;
        servings?: number;
        regularPrice?: number;
        totalSavings?: number;
        mealType?: string;
        recipes?: Array<{
          ingredients?: Ingredient[];
          [key: string]: unknown;
        }>;
        img?: string;
        [key: string]: unknown;
      }) => {
        const recipe = transformApiMealPlan(mealPlan);
        const mealType = mealPlan.mealType as keyof MealCategory;

        if (mealType && mealData[mealType]) {
          mealData[mealType].push(recipe);
        }
      });

      logMessage('Meal data processed successfully:');
      console.log({
        breakfastCount: mealData.breakfast.length,
        lunchCount: mealData.lunch.length,
        dinnerCount: mealData.dinner.length
      });

      // Initialize default selections
      const defaultSelectedMeals = new Set<string>();
      const initialMultipliers: Record<string, number> = {};

      // Default to selecting the first 7 recipes in each category
      Object.values(mealData).forEach((recipes: Recipe[]) => {
        recipes.slice(0, 7).forEach(recipe => {
          defaultSelectedMeals.add(recipe.url);
          initialMultipliers[recipe.url] = state.calculateInitialMultiplier(recipe.servings);
        });

        recipes.slice(7).forEach(recipe => {
          initialMultipliers[recipe.url] = 0;
        });
      });

      // Update the store
      set({
        meals: mealData,
        selectedMeals: defaultSelectedMeals,
        recipeMultipliers: initialMultipliers,
        isLoading: false,
        isDataLoaded: true
      });

      logMessage('Store update complete');
    } catch (err) {
      console.error("Error fetching meal data:", err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load meal plans',
        isDataLoaded: false
      });
    }
  },

  // Discover stores from API using store index
  discoverStores: async () => {
    logMessage('Discovering available stores from API...');
    set({ isLoading: true, error: null });

    try {
      // Fetch the full store index from API
      const storeIndexResponse = await fetch(`${API_URL}/meal-plans/stores/index`);

      if (!storeIndexResponse.ok) {
        throw new Error('Failed to load store index from API');
      }

      const storeIndexData = await storeIndexResponse.json();

      if (!storeIndexData.success || !storeIndexData.data?.stores) {
        throw new Error('Invalid store index response format');
      }

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Create store objects from store index
      const stores: Store[] = storeIndexData.data.stores.map((storeInfo: {
        id: string;
        name: string;
        location: string;
        filename: string;
        validUntil: string;
        logo?: string;
        location_name?: string;
        city?: string;
        postal_code?: string;
        coordinates?: string;
        flyer?: string;
      }) => {
        const validUntil = new Date(storeInfo.validUntil);
        const isAvailable = validUntil >= currentDate;

        return {
          id: storeInfo.id,
          name: storeInfo.name,
          location: storeInfo.location,
          filename: storeInfo.filename,
          validUntil,
          isAvailable,
          logo: storeInfo.logo,
          location_name: storeInfo.location_name,
          city: storeInfo.city,
          postal_code: storeInfo.postal_code,
          coordinates: storeInfo.coordinates,
          flyer: storeInfo.flyer
        };
      });

      // Sort by name
      stores.sort((a, b) => a.name.localeCompare(b.name));

      logMessage(`Discovered ${stores.length} stores from store index`);

      set({
        availableStores: stores,
        isLoading: false,
        isStoresLoaded: true
      });
    } catch (err) {
      console.error("Error discovering stores:", err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to discover stores',
        isStoresLoaded: false
      });
    }
  },

  // Keep all your existing actions unchanged
  setMeals: (meals) => {
    const state = get();
    if (state.selectedMeals.size === 0) {
      const defaultSelectedMeals = new Set<string>();
      const initialMultipliers: Record<string, number> = {};

      Object.values(meals).forEach((recipes: Recipe[]) => {
        recipes.slice(0, 7).forEach(recipe => {
          defaultSelectedMeals.add(recipe.url);
          initialMultipliers[recipe.url] = state.calculateInitialMultiplier(recipe.servings);
        });

        recipes.slice(7).forEach(recipe => {
          initialMultipliers[recipe.url] = 0;
        });
      });

      set({
        meals,
        selectedMeals: defaultSelectedMeals,
        recipeMultipliers: initialMultipliers
      });
    } else {
      set({ meals });
    }
  },

  toggleMeal: (url) => set((state) => {
    const newSelectedMeals = new Set(state.selectedMeals);
    const newMultipliers = { ...state.recipeMultipliers };

    if (newSelectedMeals.has(url)) {
      newSelectedMeals.delete(url);
      newMultipliers[url] = 0;
    } else {
      const recipe = [
        ...state.meals.breakfast,
        ...state.meals.lunch,
        ...state.meals.dinner
      ].find(r => r.url === url);

      if (recipe) {
        newSelectedMeals.add(url);
        newMultipliers[url] = state.calculateInitialMultiplier(recipe.servings);
      }
    }

    return {
      selectedMeals: newSelectedMeals,
      recipeMultipliers: newMultipliers
    };
  }),

  toggleGroceryItem: (packageId) => set((state) => {
    const newCheckedItems = new Set(state.groceryCheckedItems);
    const newTags = { ...state.ingredientTags };

    const currentItemStatus = state.ingredientTags[packageId]?.status || 'bought';

    if (newCheckedItems.has(packageId)) {
      newCheckedItems.delete(packageId);

      if (currentItemStatus === 'in_cart' || currentItemStatus === 'owned') {
        if (!newTags[packageId]) {
          newTags[packageId] = {};
        }
        newTags[packageId] = {
          ...newTags[packageId],
          status: 'bought'
        };
      }
    } else {
      newCheckedItems.add(packageId);
    }

    return {
      groceryCheckedItems: newCheckedItems,
      ingredientTags: newTags
    };
  }),

  setRecipeMultiplier: (url, multiplier) => set((state) => {
    const newMultipliers = { ...state.recipeMultipliers };
    const newSelectedMeals = new Set(state.selectedMeals);

    const newMultiplier = Math.max(0, multiplier);
    newMultipliers[url] = newMultiplier;

    if (newMultiplier > 0) {
      newSelectedMeals.add(url);
    } else {
      newSelectedMeals.delete(url);
    }

    return {
      recipeMultipliers: newMultipliers,
      selectedMeals: newSelectedMeals
    };
  }),

  setIngredientTag: (packageId, tag, value) => set((state) => {
    const newTags = { ...state.ingredientTags };

    if (!newTags[packageId]) {
      newTags[packageId] = {};
    }

    newTags[packageId] = {
      ...newTags[packageId],
      [tag]: value
    };

    return { ingredientTags: newTags };
  }),

  setIngredientTags: (packageId, tags) => set((state) => {
    const newTags = { ...state.ingredientTags };

    if (!newTags[packageId]) {
      newTags[packageId] = {};
    }

    newTags[packageId] = {
      ...newTags[packageId],
      ...tags
    };

    return { ingredientTags: newTags };
  }),

  // Keep all your existing computed values unchanged
  selectedRecipes: () => {
    const state = get();
    const recipes: Recipe[] = [];

    const allRecipes = [
      ...state.meals.breakfast,
      ...state.meals.lunch,
      ...state.meals.dinner
    ];

    allRecipes.forEach(recipe => {
      if (state.selectedMeals.has(recipe.url)) {
        const multiplier = state.recipeMultipliers[recipe.url] || 1;
        recipes.push({
          ...recipe,
          multiplier
        });
      }
    });

    return recipes;
  },

  aggregatedIngredients: () => {
    const state = get();
    const selectedRecipes = state.selectedRecipes();
    const aggregateMap = new Map<string, AggregatedItem>();

    selectedRecipes.forEach(recipe => {
      const multiplier = recipe.multiplier || 1;

      recipe.ingredients.forEach(ing => {
        if (ing.source === 'skipped') return;

        const packageId = ing.packageId || `${ing.productName || ing.recipeIngredientName}-${ing.saleUnitSize}${ing.saleUnitType}`;

        const existing = aggregateMap.get(packageId);
        if (existing) {
          existing.neededFraction += (ing.saleFractionUsed || 0) * multiplier;
        } else {
          const tags = state.ingredientTags[packageId];

          aggregateMap.set(packageId, {
            packageId,
            neededFraction: (ing.saleFractionUsed || 0) * multiplier,
            unitSize: ing.saleUnitSize || 0,
            unitType: ing.saleUnitType || '',
            packPrice: ing.salePrice,
            productName: ing.productName || ing.recipeIngredientName,
            source: ing.source,
            lineCost: 0,
            packsToBuy: 0,
            isChecked: state.groceryCheckedItems.has(packageId),
            savingsPercentage: ing.savingsPercentage,
            category: ing.category,
            tags
          });
        }
      });
    });

    aggregateMap.forEach(pkg => {
      const packsToBuy = Math.ceil(pkg.neededFraction);
      pkg.packsToBuy = packsToBuy;
      pkg.lineCost = packsToBuy * pkg.packPrice;
    });

    return aggregateMap;
  },

  totals: () => {
    const state = get();
    const selectedRecipes = state.selectedRecipes();

    let totalSale = 0;
    let totalRegular = 0;

    selectedRecipes.forEach(recipe => {
      const multiplier = recipe.multiplier || 1;
      totalSale += recipe.salePrice * multiplier;
      totalRegular += recipe.regularPrice * multiplier;
    });

    const totalSavings = totalRegular - totalSale;

    return {
      regularTotal: totalRegular,
      saleTotal: totalSale,
      totalSavings
    };
  },

  mealSummary: () => {
    const state = get();
    const summary = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      total: 0
    };

    (['breakfast', 'lunch', 'dinner'] as const).forEach(category => {
      summary[category] = state.meals[category].filter(recipe =>
        state.selectedMeals.has(recipe.url)
      ).length;

      summary.total += summary[category];
    });

    return summary;
  },
}));



