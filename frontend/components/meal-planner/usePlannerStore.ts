import { create } from 'zustand';

// Types
export interface Store {
  id: string;
  name: string;
  location: string;
  validUntil: Date;
  filename: string;
  isAvailable: boolean;
  logo?: string; // Add logo property
  lat?: number;
  lng?: number;
  storeLocation?: StoreLocation;
  distance?: number;
  geocoded_address?: string;
  geocoded_at?: string;
}

export interface StoreLocation {
  latitude: number;
  longitude: number;
  address: string;
  postalCode?: string;
}


interface StoreIndexItem {
  id: string;
  name: string;
  location: string;
  filename: string;
  validUntil: string;
  logo?: string;
  // New fields from CSV
  location_name?: string;
  city?: string;
  postal_code?: string;
  coordinates?: string;
  flyer?: string;
  lat?: number;
  lng?: number;
  geocoded_address?: string;
  geocoded_at?: string;
}


export interface IngredientTags {
  importance?: 'core' | 'optional';
  status?: 'bought' | 'owned' | 'in_cart' | 'ignored'; // Added 'in_cart' status
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
  category?: string; // Add category property
}

export interface Recipe {
  name: string;
  url: string;
  price: number;
  servings: number;
  salePrice: number;
  regularPrice: number;
  totalSavings: number;
  flyerItemsCount: number; // Add this property to track number of flyer items
  ingredients: Ingredient[];
  multiplier?: number; // How many times this recipe will be made
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
  category?: string; // Add category property
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
  recipeMultipliers: Record<string, number>; // url -> multiplier (defaults to calculated value)
  ingredientTags: Record<string, IngredientTags>; // packageId -> tags

  // Store state
  availableStores: Store[];
  isStoresLoaded: boolean;
  selectedStore: string | null;
  isLoading: boolean;
  error: string | null;
  isDataLoaded: boolean; // Flag to track if data has been loaded
  userLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    source: 'browser' | 'postal' | 'address';
  } | null;
  locationError: string | null;
  isLocationLoading: boolean;

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
  setUserLocation: (location: PlannerState['userLocation']) => void;
  clearUserLocation: () => void;
  setLocationError: (error: string | null) => void;
  setLocationLoading: (loading: boolean) => void;
  geocodeStoreAddress: (storeId: string, address: string) => Promise<void>;

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

export function parseCoordinates(coordString: string): { latitude: number; longitude: number } | null {
  if (!coordString) return null;

  // Try different coordinate formats
  // Format 1: "lat,lng" (43.7182,-79.3762)
  const commaFormat = coordString.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (commaFormat) {
    return {
      latitude: parseFloat(commaFormat[1]),
      longitude: parseFloat(commaFormat[2])
    };
  }

  // Format 2: "lat lng" (43.7182 -79.3762)
  const spaceFormat = coordString.match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/);
  if (spaceFormat) {
    return {
      latitude: parseFloat(spaceFormat[1]),
      longitude: parseFloat(spaceFormat[2])
    };
  }

  return null;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  // Configuration
  normalMealServings: 4,
  userLocation: null,
  locationError: null,
  isLocationLoading: false,

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
    // Round up to nearest 0.5
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

      // Calculate flyerItemsCount for each recipe
      const calculateFlyerItemsCount = (recipe: Recipe) => {
        if (!recipe.ingredients) return 0;

        return recipe.ingredients.filter(ingredient =>
          //ingredient.type === 'core' &&
          ingredient.source === 'flyer'
        ).length;
      };

      // Process each recipe to add the flyerItemsCount
      const processRecipes = (recipes: Recipe[]): Recipe[] => {
        return recipes.map(recipe => ({
          ...recipe,
          flyerItemsCount: calculateFlyerItemsCount(recipe)
        }));
      };

      // Create the meal categories using the data directly
      // The structure already matches your frontend model
      const mealCategories = {
        breakfast: processRecipes(mealData.breakfast || []),
        lunch: processRecipes(mealData.lunch || []),
        dinner: processRecipes(mealData.dinner || [])
      };

      // Initialize default selections
      const defaultSelectedMeals = new Set<string>();
      const initialMultipliers: Record<string, number> = {};

      // Default to selecting the first 7 recipes in each category with calculated multipliers
      Object.values(mealCategories).forEach((recipes: Recipe[]) => {
        recipes.slice(0, 7).forEach(recipe => {
          defaultSelectedMeals.add(recipe.url);
          // Calculate initial multiplier based on normalMealServings and recipe servings
          initialMultipliers[recipe.url] = state.calculateInitialMultiplier(recipe.servings);
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
          // Calculate initial multiplier based on normalMealServings and recipe servings
          initialMultipliers[recipe.url] = state.calculateInitialMultiplier(recipe.servings);
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
      // Find the recipe to get its servings
      const recipe = [
        ...state.meals.breakfast,
        ...state.meals.lunch,
        ...state.meals.dinner
      ].find(r => r.url === url);

      if (recipe) {
        newSelectedMeals.add(url);
        // Calculate initial multiplier based on normalMealServings and recipe servings
        newMultipliers[url] = state.calculateInitialMultiplier(recipe.servings);
      }
    }

    return {
      selectedMeals: newSelectedMeals,
      recipeMultipliers: newMultipliers
    };
  }),

  // Update toggleGroceryItem function in usePlannerStore.ts to handle status changes
  toggleGroceryItem: (packageId) => set((state) => {
    const newCheckedItems = new Set(state.groceryCheckedItems);
    const newTags = { ...state.ingredientTags };

    // Get current item status
    const currentItemStatus = state.ingredientTags[packageId]?.status || 'bought';

    // If item is already in the checkedItems set, remove it and reset status
    if (newCheckedItems.has(packageId)) {
      newCheckedItems.delete(packageId);

      // If the status was 'in_cart' or 'owned', reset it to 'bought'
      if (currentItemStatus === 'in_cart' || currentItemStatus === 'owned') {
        if (!newTags[packageId]) {
          newTags[packageId] = {};
        }
        newTags[packageId] = {
          ...newTags[packageId],
          status: 'bought'
        };
      }
    }
    // If not in checkedItems, add it
    else {
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

    // Ensure multiplier is a non-negative number with precision of 0.5
    const newMultiplier = Math.max(0, multiplier);
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

  // ========== ADD ALL THESE LOCATION ACTIONS HERE ==========
  // Location actions
  setUserLocation: (location) => {
    set({ userLocation: location, locationError: null });
  },

  clearUserLocation: () => {
    set({
      userLocation: null,
      locationError: null,
      isLocationLoading: false
    });
  },

  setLocationError: (error) => {
    set({ locationError: error, isLocationLoading: false });
  },

  setLocationLoading: (loading) => {
    set({ isLocationLoading: loading });
  },

  // Geocode a store address and update the store data
  geocodeStoreAddress: async (storeId, address) => {
    const state = get();
    const store = state.availableStores.find(s => s.id === storeId);
    if (!store) return;

    try {
      const response = await fetch(
        `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(address)}&api_key=${process.env.GEOCODIO_API_KEY}&limit=1`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];

        // Update the store with location data
        const updatedStores = state.availableStores.map(s =>
          s.id === storeId
            ? {
              ...s,
              storeLocation: {
                latitude: result.location.lat,
                longitude: result.location.lng,
                address: result.formatted_address,
                postalCode: result.address_components.zip || undefined
              }
            }
            : s
        );

        set({ availableStores: updatedStores });
      }
    } catch (error) {
      console.error('Failed to geocode store address:', error);
    }
  },
  // ========== END OF LOCATION ACTIONS ==========


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
            category: ing.category,
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

    // Count selected meals by category - simply count active cards
    (['breakfast', 'lunch', 'dinner'] as const).forEach(category => {
      // Count the number of selected recipes in each category
      summary[category] = state.meals[category].filter(recipe =>
        state.selectedMeals.has(recipe.url)
      ).length;

      // Add to the total
      summary.total += summary[category];
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
      const stores: Store[] = indexData.map((storeInfo: StoreIndexItem) => {
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
          // Include all new fields
          location_name: storeInfo.location_name,
          city: storeInfo.city,
          postal_code: storeInfo.postal_code,
          coordinates: storeInfo.coordinates,
          flyer: storeInfo.flyer,
          lat: storeInfo.lat,
          lng: storeInfo.lng,
          geocoded_address: storeInfo.geocoded_address,
          geocoded_at: storeInfo.geocoded_at
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