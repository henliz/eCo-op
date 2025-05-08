import { create } from 'zustand';

// Types
export interface Store {
  id: string;
  name: string;
  location: string;
  validUntil: Date;
  filename: string;
  isAvailable: boolean;
}

interface StoreIndexItem {
  id: string;
  name: string;
  location: string;
  filename: string;
  validUntil: string;
}

export interface IngredientTags {
  importance?: 'core' | 'optional';
  status?: 'bought' | 'owned' | 'ignored';
  storeSection?: string;
}

interface Ingredient {
  recipeIngredientName: string;
  saleUnitSize?: number;
  saleUnitType?: string;
  salePrice: number;
  saleFractionUsed?: number;
  regularPrice: number;
  regularFractionUsed?: number;
  source: 'flyer' | 'database' | 'skipped';
  sourceDate?: string;
  productName?: string;
  packageId?: string;
  savingsPercentage?: number;
  tags?: IngredientTags;
}

export interface Recipe {
  name: string;
  url: string;
  price: number;
  servings: number;
  salePrice: number;
  regularPrice: number;
  totalSavings: number;
  ingredients: Ingredient[];
  multiplier?: number; // How many times this recipe will be made
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
  source: 'flyer' | 'database' | 'skipped';
  lineCost: number;
  packsToBuy: number;
  isChecked: boolean;
  savingsPercentage?: number;
  tags?: IngredientTags;
}


interface Totals {
  regularTotal: number;
  saleTotal: number;
  totalSavings: number;
}


interface PlannerState {
  // Data state
  meals: MealCategory;
  selectedMeals: Set<string>;
  groceryCheckedItems: Set<string>;
  recipeMultipliers: Record<string, number>; // url -> multiplier (defaults to 1)
  ingredientTags: Record<string, IngredientTags>; // packageId -> tags

  // Store state
  availableStores: Store[];
  isStoresLoaded: boolean;
  selectedStore: string | null;
  isLoading: boolean;
  error: string | null;
  isDataLoaded: boolean; // Flag to track if data has been loaded

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

  // Computed values
  selectedRecipes: () => Recipe[];
  aggregatedIngredients: () => Map<string, AggregatedItem>;
  totals: () => Totals;
  mealSummary: () => { breakfast: number; lunch: number; dinner: number; total: number };
}

// For debugging purposes
const logMessage = (msg: string) => {
  console.log(`[PlannerStore] ${msg}`);
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
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

  // Set selected store
  setSelectedStore: (storeId) => {
    logMessage(`Setting store to: ${storeId}`);
    const state = get();
    const store = state.availableStores.find(s => s.id === storeId);

    if (!store || !store.isAvailable) {
      set({ error: 'Selected store is not available' });
      return;
    }

    // Always reset isDataLoaded when changing stores to force data reload
    set({
      selectedStore: storeId,
      isLoading: true,
      error: null,
      isDataLoaded: false // Reset this flag to force data reload
    });
  },

  // Fetch meal data based on selected store
  fetchMealData: async () => {
  const state = get();
  const logMessage = (msg: string) => console.log(`[PlannerStore] ${msg}`);

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

  // Find the selected store
  const selectedStore = state.availableStores.find(s => s.id === state.selectedStore);
  if (!selectedStore) {
    set({
      error: 'Selected store not found in available stores',
      isLoading: false
    });
    return;
  }

  try {
    logMessage(`Starting data fetch for ${selectedStore.name}, using file: ${selectedStore.filename}`);
    set({ isLoading: true, error: null });

    // Fetch the store data file using the filename
    const response = await fetch(`/data/${selectedStore.filename}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch meal plan data: ${response.status} ${response.statusText}`);
    }

    logMessage('Data fetched successfully, parsing JSON...');

    // Parse the data - no need to transform structure
    const mealData = await response.json();

    logMessage('JSON parsed successfully. Structure:');
    console.log({
      breakfastCount: mealData.breakfast?.length || 0,
      lunchCount: mealData.lunch?.length || 0,
      dinnerCount: mealData.dinner?.length || 0
    });

    // Create the meal categories using the data directly
    // The structure already matches your frontend model
    const mealCategories = {
      breakfast: mealData.breakfast || [],
      lunch: mealData.lunch || [],
      dinner: mealData.dinner || []
    };

    // Initialize default selections
    const defaultSelectedMeals = new Set<string>();
    const initialMultipliers: Record<string, number> = {};

    // Default to selecting the first 7 recipes in each category
    Object.values(mealCategories).forEach((recipes: Recipe[]) => {
      recipes.slice(0, 7).forEach(recipe => {
        defaultSelectedMeals.add(recipe.url);
        initialMultipliers[recipe.url] = 1;
      });

      recipes.slice(7).forEach(recipe => {
        initialMultipliers[recipe.url] = 0;
      });
    });

    // Update the store
    set({
      meals: mealCategories,
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
      error: err instanceof Error ? err.message : 'Failed to load meal plan',
      isDataLoaded: false
    });
  }
},

  // Original actions (slightly modified)
  setMeals: (meals) => {
    // Only initialize selections if they don't exist yet
    const state = get();
    if (state.selectedMeals.size === 0) {
      const defaultSelectedMeals = new Set<string>();
      const initialMultipliers: Record<string, number> = {};

      Object.values(meals).forEach((recipes: Recipe[]) => {
        recipes.slice(0, 7).forEach(recipe => {
          defaultSelectedMeals.add(recipe.url);
          initialMultipliers[recipe.url] = 1; // Default multiplier
        });

        // Set zero multiplier for unselected recipes
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
      // Just update meals, preserving selections
      set({ meals });
    }
  },

  toggleMeal: (url) => set((state) => {
    const newSelectedMeals = new Set(state.selectedMeals);
    const newMultipliers = { ...state.recipeMultipliers };

    if (newSelectedMeals.has(url)) {
      newSelectedMeals.delete(url);
      newMultipliers[url] = 0; // Set multiplier to 0 when unselected
    } else {
      newSelectedMeals.add(url);
      newMultipliers[url] = 1; // Set multiplier to 1 when selected
    }

    return {
      selectedMeals: newSelectedMeals,
      recipeMultipliers: newMultipliers
    };
  }),

  toggleGroceryItem: (packageId) => set((state) => {
    const newCheckedItems = new Set(state.groceryCheckedItems);
    if (newCheckedItems.has(packageId)) {
      newCheckedItems.delete(packageId);
    } else {
      newCheckedItems.add(packageId);
    }
    return { groceryCheckedItems: newCheckedItems };
  }),

  setRecipeMultiplier: (url, multiplier) => set((state) => {
    const newMultipliers = { ...state.recipeMultipliers };
    const newSelectedMeals = new Set(state.selectedMeals);

    // Ensure multiplier is a non-negative integer
    const newMultiplier = Math.max(0, Math.round(multiplier));
    newMultipliers[url] = newMultiplier;

    // Update selection based on multiplier
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

    // Initialize if no tags exist yet
    if (!newTags[packageId]) {
      newTags[packageId] = {};
    }

    // Update the specific tag
    newTags[packageId] = {
      ...newTags[packageId],
      [tag]: value
    };

    return { ingredientTags: newTags };
  }),

  setIngredientTags: (packageId, tags) => set((state) => {
    const newTags = { ...state.ingredientTags };

    // Initialize if no tags exist yet
    if (!newTags[packageId]) {
      newTags[packageId] = {};
    }

    // Update all provided tags
    newTags[packageId] = {
      ...newTags[packageId],
      ...tags
    };

    return { ingredientTags: newTags };
  }),

  // Computed values
  selectedRecipes: () => {
    const state = get();
    const recipes: Recipe[] = [];

    // Collect all meals from all categories
    const allRecipes = [
      ...state.meals.breakfast,
      ...state.meals.lunch,
      ...state.meals.dinner
    ];

    // Filter only selected meals and add multiplier
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

    // Step 1 & 2: Aggregate ingredients
    selectedRecipes.forEach(recipe => {
      // Use multiplier (default to 1 if not set)
      const multiplier = recipe.multiplier || 1;

      recipe.ingredients.forEach(ing => {
        // Skip ingredients marked as 'skipped'
        if (ing.source === 'skipped') return;

        // Create a packageId if it doesn't exist
        const packageId = ing.packageId || `${ing.productName || ing.recipeIngredientName}-${ing.saleUnitSize}${ing.saleUnitType}`;

        const existing = aggregateMap.get(packageId);
        if (existing) {
          // Multiply by recipe multiplier
          existing.neededFraction += (ing.saleFractionUsed || 0) * multiplier;
        } else {
          // Get tags if they exist
          const tags = state.ingredientTags[packageId];

          aggregateMap.set(packageId, {
            packageId,
            // Multiply by recipe multiplier
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
            tags
          });
        }
      });
    });

    // Step 3: Compute line costs
    aggregateMap.forEach(pkg => {
      const packsToBuy = Math.ceil(pkg.neededFraction);

      // Line cost is always calculated; checking just marks the item
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

    // Calculate totals based on multipliers
    selectedRecipes.forEach(recipe => {
      const multiplier = recipe.multiplier || 1;
      totalSale += recipe.salePrice * multiplier;
      totalRegular += recipe.regularPrice * multiplier;
    });

    // For total savings
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

    // Count selected meals by category, considering multipliers
    (['breakfast', 'lunch', 'dinner'] as const).forEach(category => {
      state.meals[category].forEach(recipe => {
        if (state.selectedMeals.has(recipe.url)) {
          const multiplier = state.recipeMultipliers[recipe.url] || 1;
          summary[category] += multiplier;
          summary.total += multiplier;
        }
      });
    });

    return summary;
  },

  discoverStores: async () => {
  const logMessage = (msg: string) => console.log(`[PlannerStore] ${msg}`);
  logMessage('Discovering available stores...');
  set({ isLoading: true, error: null });

  try {
    // Fetch the store index file
    const response = await fetch('/data/store-index.json');

    if (!response.ok) {
      throw new Error('Failed to load store index file');
    }

    const indexData = await response.json();
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Compare dates only

    // Process the stores from the index
    const stores: Store[] = indexData.stores.map((storeInfo: StoreIndexItem) => {
      const validUntil = new Date(storeInfo.validUntil);
      const isAvailable = validUntil >= currentDate;

      return {
        id: storeInfo.id,
        name: storeInfo.name,
        location: storeInfo.location,
        filename: storeInfo.filename,
        validUntil,
        isAvailable
      };
    });

    // Sort by name
    stores.sort((a, b) => a.name.localeCompare(b.name));

    logMessage(`Discovered ${stores.length} stores`);

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
}


}));
