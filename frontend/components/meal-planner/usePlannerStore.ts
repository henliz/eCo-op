import { create } from 'zustand';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skrimp.ai';
let saveTimeout: NodeJS.Timeout | null = null;
let lastSavedState: string | null = null;

// Types

type APICallFunction = (
  endpoint: string,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: unknown,
  requireAuth?: boolean
) => Promise<unknown>;


interface APIResponse {
  success: boolean;
  error?: string;
}

interface SavePlanResponse extends APIResponse {
  planId: string;
  version: number;
}

interface LoadPlanResponse extends APIResponse {
  planId?: string;
  version?: number;
  data?: {
    householdSize?: number;
    selectedStore?: string | null;
    allRecipes?: Recipe[];  // ← FIXED: Full Recipe objects, not minimal fields
    groceryCheckedItems?: string[];
    ingredientTags?: Record<string, IngredientTags>;
  };
}

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

// Enhanced Recipe interface - single source of truth for all recipe state
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
  flyerItemsCount: number;    // Track number of flyer items
  ingredients: Ingredient[];

  // Selection state - SINGLE SOURCE OF TRUTH
  multiplier: number;         // 0 = not selected, >0 = selected with this multiplier
  isSelected: boolean;        // Computed property: multiplier > 0

  // Context information - from API response
  store: string;
  location: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  date: string;               // Query date used to fetch this recipe

  // Temporal validity - from API response
  validFromDate: string;      // When this pricing starts being valid
  validToDate: string;        // When this pricing expires

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

  // Data state - SIMPLIFIED
  meals: MealCategory;
  ingredientTags: Record<string, IngredientTags>;
  groceryCheckedItems: Set<string>;

  // Store state
  availableStores: Store[];
  isStoresLoaded: boolean;
  selectedStore: string | null;
  isLoading: boolean;
  error: string | null;
  isDataLoaded: boolean;
  userLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    source: 'browser' | 'postal' | 'address';
  } | null;
  locationError: string | null;
  isLocationLoading: boolean;

  // Actions - UPDATED
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

  // ADD THIS LINE:
  debouncedSave: () => void;

  // Computed values - SIMPLIFIED
  selectedRecipes: () => Recipe[];
  aggregatedIngredients: () => Map<string, AggregatedItem>;
  totals: () => Totals;
  mealSummary: () => { breakfast: number; lunch: number; dinner: number; total: number };
  calculateInitialMultiplier: (servings: number) => number;

  // Sync properties
  isSyncing: boolean;
  lastSynced: Date | null;
  lastSyncError: string | null;
  planId: string | null;
  version: number;

  // Sync methods
  loadUserPlan: (makeAPICall: APICallFunction) => Promise<void>;
  saveUserPlan: (makeAPICall: APICallFunction) => Promise<void>;
  deleteUserPlan: (makeAPICall: APICallFunction) => Promise<void>;
  hasUnsavedChanges: () => boolean;

}


// For debugging purposes
const logMessage = (msg: string) => {
  console.log(`[PlannerStore] ${msg}`);
};

// Helper function to round up to the nearest 0.5
const roundUpToHalf = (num: number): number => {
  return Math.ceil(num * 2) / 2;
};

const createStateSnapshot = (state: PlannerState) => {
    return JSON.stringify({
      normalMealServings: state.normalMealServings,
      selectedStore: state.selectedStore,
      selectedRecipes: state.selectedRecipes().map((r: Recipe) => ({
        url: r.url,
        multiplier: r.multiplier,
        isSelected: r.isSelected
      })),
      groceryCheckedItems: Array.from(state.groceryCheckedItems),
      ingredientTags: state.ingredientTags
    });
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
  lastSynced: null,

  isSyncing: false,
  lastSyncError: null,
  planId: null,
  version: 0,



  debouncedSave: () => {
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    const state = get();

    if (state.selectedStore && state.isDataLoaded) {
      // Use the helper function
      const currentState = createStateSnapshot(state);

      if (currentState !== lastSavedState) {
        console.log('[PlannerStore] Changes detected, auto-saving...');

        const makeAPICall = (window as typeof window).__plannerMakeAPICall;
        if (makeAPICall) {
          state.saveUserPlan(makeAPICall)
            .then(() => {
              lastSavedState = currentState; // Update baseline after successful save
              console.log('[PlannerStore] Auto-save successful');
            })
            .catch((error) => {
              console.error('[PlannerStore] Auto-save failed:', error);
            });
        } else {
          console.log('[PlannerStore] makeAPICall not available, skipping auto-save');
        }
      } else {
        console.log('[PlannerStore] No changes detected, skipping auto-save');
      }
    }
  }, 10000);
},



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

  // Fixed fetchMealData - just use validUntil from the store data
  fetchMealData: async () => {
  const state = get();
  const logMessage = (msg: string) => console.log(`[PlannerStore] ${msg}`);

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
    set({ error: 'Selected store not found in available stores', isLoading: false });
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
      const apiUrl = `${API_BASE_URL}/meal-plans?store=${encodeURIComponent(selectedStore.name)}&location=${encodeURIComponent(selectedStore.location)}&date=${date}&mealType=${mealType}`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${mealType} data: ${response.status} ${response.statusText}`);
      }

      const apiResponse = await response.json();
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
      // Transform API data to enhanced Recipe format with all context
      interface APIPlanResponse extends Partial<Recipe> {
        id?: string;
        totalCost?: number;
      }

      const recipes: Recipe[] = data.map((plan: APIPlanResponse) => ({
        // Basic recipe info
        name: plan.name,
        url: plan.url || `${plan.id}`,
        img: plan.img,

        // Pricing
        price: plan.salePrice || plan.totalCost,
        salePrice: plan.salePrice || plan.totalCost,
        regularPrice: plan.regularPrice || plan.salePrice,
        totalSavings: plan.totalSavings || 0,

        // Recipe details
        servings: plan.servings,
        flyerItemsCount: plan.ingredients?.filter(ing => ing.source === 'flyer').length || 0,
        ingredients: plan.ingredients || [],

        // Selection state - SINGLE SOURCE OF TRUTH
        multiplier: 0,           // Start unselected
        isSelected: false,       // Computed from multiplier

        // Context from API response
        store: plan.store,
        location: plan.location,
        mealType: mealType,
        date: plan.date,
        validFromDate: plan.validFromDate,
        validToDate: plan.validToDate,
        pricingContext: plan.pricingContext
      }));

      mealCategories[mealType] = recipes;
    });

    set({
      meals: mealCategories,
      isLoading: false,
      isDataLoaded: true
    });

  } catch (err) {
    console.error("Error fetching meal data:", err);
    set({
      isLoading: false,
      error: err instanceof Error ? err.message : 'Failed to load meal plan',
      isDataLoaded: false
    });
  }
},

  // Updated setMeals function - remove default selections
  setMeals: (meals) => {
  set({ meals });
},

  toggleMeal: (url) => set((state) => {
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
    setTimeout(() => get().debouncedSave(), 0);
    return { meals: updatedMeals };
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
    setTimeout(() => get().debouncedSave(), 0);
    return {
      groceryCheckedItems: newCheckedItems,
      ingredientTags: newTags
    };
  }),

  setRecipeMultiplier: (url, multiplier) => set((state) => {
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
    setTimeout(() => get().debouncedSave(), 0);
    return { meals: updatedMeals };
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
    setTimeout(() => get().debouncedSave(), 0);
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
  const allRecipes = [
    ...state.meals.breakfast,
    ...state.meals.lunch,
    ...state.meals.dinner
  ];

  return allRecipes.filter(recipe => recipe.isSelected);
},

  hasLoadablePlan: () => {
    const state = get();
    return !!(state.planId && state.selectedStore && state.lastSynced);
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
            packPrice: ing.salePrice || 0,          // API provides salePrice (which was mapped from saleListPrice)
            productName: ing.productName || ing.recipeIngredientName,
            source: ing.source || 'database',       // API provides source (which was mapped from saleSource)
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

  (Object.keys(summary) as Array<keyof typeof summary>).forEach(category => {
    if (category !== 'total') {
      summary[category] = state.meals[category].filter(recipe => recipe.isSelected).length;
      summary.total += summary[category];
    }
  });

  return summary;
},

  discoverStores: async () => {
    const logMessage = (msg: string) => console.log(`[PlannerStore] ${msg}`);
    logMessage('Discovering available stores...');

    set({ isLoading: true, error: null });

    try {
      logMessage('Attempting to fetch store index from API...');

      // 🚨 FIXED: Use deployed API
      const response = await fetch('https://api.skrimp.ai/meal-plans/stores/index');

      logMessage(`Fetch response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Failed to load store index: ${response.status} ${response.statusText}`);
      }

      logMessage('Parsing JSON...');
      const apiResponse = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Invalid API response format');
      }

      // Extract stores from API response
      const indexData = apiResponse.data;
      const storesArray = indexData.stores || [];

      if (!Array.isArray(storesArray)) {
        console.error('Invalid data structure:', indexData);
        throw new Error('Store index data is not in the expected format');
      }

      logMessage(`Parsed JSON successfully. Found ${storesArray.length} stores`);
      console.log('Sample store data:', storesArray.slice(0, 2));

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      logMessage(`Current date for comparison: ${currentDate.toISOString()}`);

      // Process the stores from the array (same logic as before)
      const stores: Store[] = storesArray.map((storeInfo: StoreIndexItem, index: number) => {
        try {
          const validUntil = new Date(storeInfo.validUntil);
          const isAvailable = validUntil >= currentDate;

          // Parse coordinates if they exist
          let lat = storeInfo.lat;
          let lng = storeInfo.lng;

          if (!lat || !lng) {
            const coords = parseCoordinates(storeInfo.coordinates || '');
            if (coords) {
              lat = coords.latitude;
              lng = coords.longitude;
            }
          }

          const store = {
            id: storeInfo.id,
            name: storeInfo.name,
            location: storeInfo.location,
            filename: storeInfo.filename,
            validUntil,
            isAvailable,
            logo: storeInfo.logo,
            lat,
            lng,
            // Include all new fields
            location_name: storeInfo.location_name,
            city: storeInfo.city,
            postal_code: storeInfo.postal_code,
            coordinates: storeInfo.coordinates,
            flyer: storeInfo.flyer,
            geocoded_address: storeInfo.geocoded_address,
            geocoded_at: storeInfo.geocoded_at
          };

          if (index < 3) {
            logMessage(`Sample store ${index}: ${store.name} - ${store.location} - Available: ${store.isAvailable}`);
          }

          return store;
        } catch (storeError) {
          console.error(`Error processing store at index ${index}:`, storeError, storeInfo);
          throw storeError;
        }
      });

      // Sort by name
      stores.sort((a, b) => a.name.localeCompare(b.name));

      logMessage(`Successfully processed ${stores.length} stores`);
      const availableCount = stores.filter(s => s.isAvailable).length;
      logMessage(`Available stores: ${availableCount}/${stores.length}`);

      set({
        availableStores: stores,
        isLoading: false,
        isStoresLoaded: true,
        error: null
      });

      logMessage('Store discovery completed successfully');
    } catch (err) {
      console.error("Error discovering stores:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to discover stores';
      console.error("Full error details:", err);

      set({
        isLoading: false,
        error: errorMessage,
        isStoresLoaded: false,
        availableStores: []
      });

      logMessage(`Store discovery failed: ${errorMessage}`);
    }
  },

  // NEW: Save user plan to backend
  saveUserPlan: async (makeAPICall: APICallFunction) => {
    try {
      set({ isSyncing: true, lastSyncError: null });
      const state = get();

      // Extract ALL recipes with minimal temporal context
      const allRecipes = [
        ...state.meals.breakfast,
        ...state.meals.lunch,
        ...state.meals.dinner
      ]
      .map(recipe => ({
        url: recipe.url,
        isSelected: recipe.isSelected,
        multiplier: recipe.multiplier,
        store: recipe.store,
        location: recipe.location,
        validFromDate: recipe.validFromDate,
        validToDate: recipe.validToDate,
        mealType: recipe.mealType
      }));

      const planData = {
        householdSize: state.normalMealServings,
        selectedStore: state.selectedStore,
        allRecipes,                                   // NEW: save ALL recipes with their state
        groceryCheckedItems: Array.from(state.groceryCheckedItems),
        ingredientTags: state.ingredientTags,
      };

      const response = await makeAPICall('/user-plans', 'PUT', planData, true) as SavePlanResponse;

      if (response.success) {
        set({
          planId: response.planId,
          version: response.version,
          lastSynced: new Date(),
          isSyncing: false,
        });
        // ✅ ADD THIS: Reset baseline after successful save
        const state = get();
        lastSavedState = createStateSnapshot(state);
        console.log('[PlannerStore] Save baseline reset after successful save');

      } else {
        throw new Error('Failed to save user plan');
      }
    } catch (error) {
      console.error('Error saving user plan:', error);
      set({ lastSyncError: 'Failed to save user plan', isSyncing: false });
      throw error;
    }
  },

  // 2. Updated loadUserPlan - call API with exact saved parameters then layer on selections
  loadUserPlan: async (makeAPICall: APICallFunction) => {
  try {
    set({ isSyncing: true, lastSyncError: null });

    const response = await makeAPICall('/user-plans', 'GET', null, true) as LoadPlanResponse;

    if (response.success && response.data) {
      const plan = response.data;

      // Step 1: Load basic settings
      set({
        normalMealServings: plan.householdSize || 4,
        selectedStore: plan.selectedStore || null,
        groceryCheckedItems: new Set(plan.groceryCheckedItems || []),
        ingredientTags: plan.ingredientTags || {},
        planId: response.planId || null,
        version: response.version || 0,
      });

      // Step 2: Use the fully enriched recipes directly from the backend
      const savedRecipes = plan.allRecipes || [];
      console.log('[PlannerStore] Loading enriched recipes:', savedRecipes.length);

      if (savedRecipes.length > 0) {
        // Group the enriched recipes by meal type
        const mealCategories: MealCategory = {
          breakfast: [],
          lunch: [],
          dinner: []
        };

        savedRecipes.forEach(recipe => {
          // The recipe is already fully enriched with ingredients, pricing, etc.
          // Just ensure it has the correct structure
          const enrichedRecipe: Recipe = {
            // Basic recipe info (from backend enrichment)
            name: recipe.name,
            url: recipe.url,
            img: recipe.img,

            // Pricing (from backend enrichment)
            price: recipe.salePrice || recipe.price,
            salePrice: recipe.salePrice,
            regularPrice: recipe.regularPrice,
            totalSavings: recipe.totalSavings || 0,

            // Recipe details (from backend enrichment)
            servings: recipe.servings,
            flyerItemsCount: recipe.ingredients?.filter(ing => ing.source === 'flyer').length || 0,
            ingredients: recipe.ingredients || [],

            // User selections (preserved from saved data)
            multiplier: recipe.multiplier,
            isSelected: recipe.isSelected,

            // Context (from backend)
            store: recipe.store,
            location: recipe.location,
            mealType: recipe.mealType,
            date: recipe.date,
            validFromDate: recipe.validFromDate,
            validToDate: recipe.validToDate,
            pricingContext: recipe.pricingContext
          };

          // Add to the appropriate meal type category
          if (mealCategories[recipe.mealType]) {
            mealCategories[recipe.mealType].push(enrichedRecipe);
          }
        });

        // Set the meals directly - no need to match with existing data
        set({
          meals: mealCategories,
          isDataLoaded: true  // Mark data as loaded since we have enriched recipes
        });

        console.log('[PlannerStore] Loaded enriched meals:', {
          breakfast: mealCategories.breakfast.length,
          lunch: mealCategories.lunch.length,
          dinner: mealCategories.dinner.length
        });
      }

      set({
        lastSynced: new Date(),
        isSyncing: false,
      });
      // ✅ ADD THIS: Reset baseline after successful load
      const state = get();
      lastSavedState = createStateSnapshot(state);
      console.log('[PlannerStore] Save baseline reset after successful load');


    } else {
      // No existing plan found, just set default values
      console.log('[PlannerStore] No existing plan found, using defaults');
      set({
        normalMealServings: 4,
        selectedStore: null,
        groceryCheckedItems: new Set(),
        ingredientTags: {},
        planId: null,
        version: 0,
        isSyncing: false,
      });
    }
  } catch (error) {
    console.error('Error loading user plan:', error);
    set({
      lastSyncError: 'Failed to load user plan',
      isSyncing: false
    });
    throw error;
  }
},

  // NEW: Delete user plan from backend
  deleteUserPlan: async (makeAPICall: APICallFunction) => {
    try {
      set({ isSyncing: true, lastSyncError: null });

      const response = await makeAPICall('/user-plans', 'DELETE', null, true) as APIResponse;

      if (response.success) {
        set({
          planId: null,
          version: 0,
          lastSynced: null,
          isSyncing: false,
        });
        console.log('[PlannerStore] User plan deleted successfully');
      } else {
        throw new Error('Failed to delete user plan');
      }
    } catch (error) {
      console.error('Error deleting user plan:', error);
      set({
        lastSyncError: 'Failed to delete user plan',
        isSyncing: false
      });
      throw error;
    }
  },

  hasUnsavedChanges: () => {
    const state = get();

    // No changes if no store selected or data not loaded
    if (!state.selectedStore || !state.isDataLoaded) {
      return false;
    }

    // Compare current state with last saved state
    const currentState = createStateSnapshot(state);
    const hasChanges = currentState !== lastSavedState;

    return hasChanges;
  },

}));