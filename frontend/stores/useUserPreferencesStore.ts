import { create } from 'zustand';

// NEW: Add subscription limits interfaces (simple)
export interface SubscriptionLimitsData {
  tier: "free" | "premium";
  limits: {
    personalRecipes: number;        // -1 = unlimited
    ingredientExclusions: number;   // -1 = unlimited
    bannedRecipes: number;          // -1 = unlimited
  };
  usage: {
    personalRecipesCount: number;
    ingredientExclusionsCount: number;
    bannedRecipesCount: number;
  };
  canAddPersonalRecipe: boolean;
  canAddIngredientExclusion: boolean;
  canAddBannedRecipe: boolean;
}

// NEW: Recipe object interface (instead of just string IDs)
export interface BannedRecipe {
  id: string;
  name: string;
}

// UPDATED: Change bannedRecipes from string[] to BannedRecipe[]
export interface UserPreferences {
  // Core preferences
  maxPricePerPortion: number;
  maxIngredients: number;

  // Banned items (stored as arrays in Firestore)
  bannedIngredients: string[];
  bannedRecipes: BannedRecipe[]; // CHANGED: from string[] to BannedRecipe[]

  // Optional fields
  dietaryRestrictions?: string[];

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

// UI helper interface for banned items with metadata
export interface BannedItem {
  id: string;
  name: string;
  addedAt: Date;
  category?: string;
}

interface UserPreferencesState {
  // Core state - single source of truth
  preferences: UserPreferences | null;

  // NEW: Add subscription limits state
  subscriptionLimits: SubscriptionLimitsData | null;

  // Loading states
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Sync info
  lastSynced: Date | null;
  hasUnsavedChanges: boolean;

  // Actions - Load/Save (unified)
  loadPreferences: (makeAPICall: (endpoint: string, method?: string, body?: any, useAuth?: boolean) => Promise<any>) => Promise<void>;
  savePreferences: (makeAPICall: (endpoint: string, method?: string, body?: any, useAuth?: boolean) => Promise<any>) => Promise<void>;

  // NEW: Load subscription limits
  loadSubscriptionLimits: (makeAPICall: (endpoint: string, method?: string, body?: any, useAuth?: boolean) => Promise<any>) => Promise<void>;

  // Actions - Update preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;

  // Actions - Banned ingredients (convenience methods)
  addBannedIngredient: (name: string) => void;
  removeBannedIngredient: (name: string) => void;
  clearBannedIngredients: () => void;

  // Actions - Banned recipes (convenience methods) - UPDATED: now work with objects
  addBannedRecipe: (recipe: BannedRecipe) => void; // CHANGED: now takes BannedRecipe object
  removeBannedRecipe: (recipeId: string) => void;
  clearBannedRecipes: () => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  markSynced: () => void;

  // Query methods - UPDATED for new recipe format
  isIngredientBanned: (ingredientName: string) => boolean;
  isRecipeBanned: (recipeId: string) => boolean;
  getBannedIngredientsCount: () => number;
  getBannedRecipesCount: () => number;

  // UI helper methods
  getBannedIngredientsAsItems: () => BannedItem[];
  getBannedRecipesAsItems: () => BannedItem[]; // UPDATED: now returns recipe names
  getPreferencesSummary: () => {
    bannedIngredientsCount: number;
    bannedRecipesCount: number;
    priceRange?: string;
    maxIngredients: number;
  };

  // NEW: Simple limit checking helpers
  canAddIngredientExclusion: () => boolean;
  canAddBannedRecipe: () => boolean;
  getUsageStatus: () => {
    ingredients: { current: number; limit: number; canAdd: boolean };
    recipes: { current: number; limit: number; canAdd: boolean };
  };
}

// Default preferences matching your Firestore structure
const DEFAULT_PREFERENCES: UserPreferences = {
  maxPricePerPortion: 10,
  maxIngredients: 6,
  bannedIngredients: [],
  bannedRecipes: [], // Now empty array of BannedRecipe objects
  dietaryRestrictions: [],
};

// Utility function to generate IDs for UI items
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useUserPreferencesStore = create<UserPreferencesState>((set, get) => ({
  // Initial state
  preferences: null,
  subscriptionLimits: null, // NEW
  loading: false,
  saving: false,
  error: null,
  lastSynced: null,
  hasUnsavedChanges: false,

  // UPDATED: Load preferences and limits
  loadPreferences: async (makeAPICall) => {
    set({ loading: true, error: null });

    try {
      console.log('Store: Loading user preferences...');

      // Load preferences and try to load limits (don't fail if limits fail)
      const userProfile = await makeAPICall('/user-preferences/profile', 'GET', null, true);

      let limitsData = null;
      try {
        const limitsResponse = await makeAPICall('/user-preferences/limits', 'GET', null, true);
        limitsData = limitsResponse?.data || null;
      } catch (err) {
        console.warn('Failed to load limits, continuing without them:', err);
      }

      if (userProfile && typeof userProfile === 'object') {
        console.log('Store: User profile loaded:', userProfile);

        // UPDATED: Handle both old format (strings) and new format (objects) for banned recipes
        let bannedRecipes: BannedRecipe[] = [];
        if (userProfile.bannedRecipes) {
          bannedRecipes = userProfile.bannedRecipes.map((recipe: any) => {
            if (typeof recipe === 'string') {
              // Old format - convert string to object
              return { id: recipe, name: recipe };
            } else {
              // New format - already an object with id and name
              return recipe;
            }
          });
        }

        const preferences: UserPreferences = {
          maxPricePerPortion: userProfile.maxPricePerPortion || DEFAULT_PREFERENCES.maxPricePerPortion,
          maxIngredients: userProfile.maxIngredients || DEFAULT_PREFERENCES.maxIngredients,
          bannedIngredients: userProfile.bannedIngredients || DEFAULT_PREFERENCES.bannedIngredients,
          bannedRecipes, // UPDATED: use processed recipe objects
          dietaryRestrictions: userProfile.dietaryRestrictions || DEFAULT_PREFERENCES.dietaryRestrictions,
          createdAt: userProfile.createdAt ? new Date(userProfile.createdAt) : undefined,
          updatedAt: userProfile.updatedAt ? new Date(userProfile.updatedAt) : undefined,
        };

        set({
          preferences,
          subscriptionLimits: limitsData, // NEW: store limits
          loading: false,
          lastSynced: new Date(),
          hasUnsavedChanges: false,
          error: null,
        });
      } else {
        console.warn('Store: No user profile data received, using defaults');
        set({
          preferences: { ...DEFAULT_PREFERENCES },
          subscriptionLimits: limitsData,
          loading: false,
          lastSynced: new Date(),
          hasUnsavedChanges: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Store: Error loading preferences:', error);
      set({
        preferences: { ...DEFAULT_PREFERENCES },
        subscriptionLimits: null,
        loading: false,
        error: 'Failed to load preferences - using defaults'
      });
    }
  },

  // NEW: Load subscription limits separately
  loadSubscriptionLimits: async (makeAPICall) => {
    try {
      const response = await makeAPICall('/user-preferences/limits', 'GET', null, true);
      if (response?.success) {
        set({ subscriptionLimits: response.data });
      }
    } catch (error) {
      console.error('Store: Error loading limits:', error);
      set({ subscriptionLimits: null });
    }
  },

  // UPDATED: Save with new banned recipes format
  savePreferences: async (makeAPICall) => {
    const state = get();
    if (!state.preferences) {
      throw new Error('No preferences to save');
    }

    set({ saving: true, error: null });

    try {
      console.log('Store: Saving preferences...', state.preferences);

      // UPDATED: Send banned recipes as objects (backend now expects objects)
      const response = await makeAPICall('/user-preferences/profile', 'PUT', {
        maxPricePerPortion: state.preferences.maxPricePerPortion,
        maxIngredients: state.preferences.maxIngredients,
        bannedIngredients: state.preferences.bannedIngredients,
        bannedRecipes: state.preferences.bannedRecipes, // Now sends BannedRecipe objects
        dietaryRestrictions: state.preferences.dietaryRestrictions,
      }, true);

      if (response && response.success) {
        console.log('Store: Preferences saved successfully');
        set({
          saving: false,
          lastSynced: new Date(),
          hasUnsavedChanges: false,
          error: null,
        });
      } else {
        throw new Error(response?.error || 'Failed to save preferences');
      }
    } catch (error: any) {
      console.error('Store: Error saving preferences:', error);
      set({
        saving: false,
        error: error?.message || 'Failed to save preferences'
      });
      throw error;
    }
  },

  // Update preferences (marks as unsaved)
  updatePreferences: (updates) => {
    set((state) => ({
      preferences: state.preferences ? {
        ...state.preferences,
        ...updates,
      } : {
        ...DEFAULT_PREFERENCES,
        ...updates,
      },
      hasUnsavedChanges: true,
    }));
  },

  resetPreferences: () => {
    set({
      preferences: { ...DEFAULT_PREFERENCES },
      hasUnsavedChanges: true,
    });
  },

  // Convenience methods for banned ingredients
  addBannedIngredient: (name) => {
    const state = get();
    const current = state.preferences?.bannedIngredients || [];

    if (!current.includes(name)) {
      get().updatePreferences({
        bannedIngredients: [...current, name]
      });
    }
  },

  removeBannedIngredient: (name) => {
    const state = get();
    const current = state.preferences?.bannedIngredients || [];

    get().updatePreferences({
      bannedIngredients: current.filter(item => item !== name)
    });
  },

  clearBannedIngredients: () => {
    get().updatePreferences({
      bannedIngredients: []
    });
  },

  // UPDATED: Convenience methods for banned recipes (now work with objects)
  addBannedRecipe: (recipe: BannedRecipe) => {
    const state = get();
    const current = state.preferences?.bannedRecipes || [];

    if (!current.some(r => r.id === recipe.id)) {
      get().updatePreferences({
        bannedRecipes: [...current, recipe]
      });
    }
  },

  removeBannedRecipe: (recipeId) => {
    const state = get();
    const current = state.preferences?.bannedRecipes || [];

    get().updatePreferences({
      bannedRecipes: current.filter(recipe => recipe.id !== recipeId)
    });
  },

  clearBannedRecipes: () => {
    get().updatePreferences({
      bannedRecipes: []
    });
  },

  // Utility actions
  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),
  setError: (error) => set({ error }),

  markSynced: () => {
    set({
      lastSynced: new Date(),
      hasUnsavedChanges: false,
      error: null,
    });
  },

  // UPDATED: Query methods for new recipe format
  isIngredientBanned: (ingredientName) => {
    const state = get();
    return state.preferences?.bannedIngredients?.includes(ingredientName) || false;
  },

  isRecipeBanned: (recipeId) => {
    const state = get();
    return state.preferences?.bannedRecipes?.some(recipe => recipe.id === recipeId) || false;
  },

  getBannedIngredientsCount: () => {
    const state = get();
    return state.preferences?.bannedIngredients?.length || 0;
  },

  getBannedRecipesCount: () => {
    const state = get();
    return state.preferences?.bannedRecipes?.length || 0;
  },

  // UI helper methods - convert arrays to BannedItem objects for display
  getBannedIngredientsAsItems: () => {
    const state = get();
    const bannedIngredients = state.preferences?.bannedIngredients || [];

    return bannedIngredients.map(name => ({
      id: name, // Use name as ID for consistency
      name,
      addedAt: new Date(), // We don't store individual timestamps
      category: undefined, // We don't store categories yet
    }));
  },

  // UPDATED: Now returns actual recipe names instead of IDs!
  getBannedRecipesAsItems: () => {
    const state = get();
    const bannedRecipes = state.preferences?.bannedRecipes || [];

    return bannedRecipes.map(recipe => ({
      id: recipe.id,
      name: recipe.name, // NOW SHOWS ACTUAL RECIPE NAMES! 🎉
      addedAt: new Date(),
    }));
  },

  getPreferencesSummary: () => {
    const state = get();
    const prefs = state.preferences;

    let priceRange: string | undefined;
    if (prefs?.maxPricePerPortion) {
      priceRange = `Under $${prefs.maxPricePerPortion}/portion`;
    }

    return {
      bannedIngredientsCount: prefs?.bannedIngredients?.length || 0,
      bannedRecipesCount: prefs?.bannedRecipes?.length || 0,
      priceRange,
      maxIngredients: prefs?.maxIngredients || DEFAULT_PREFERENCES.maxIngredients,
    };
  },

  // NEW: Simple limit checking helpers
  canAddIngredientExclusion: () => {
    const state = get();
    return state.subscriptionLimits?.canAddIngredientExclusion ?? true;
  },

  canAddBannedRecipe: () => {
    const state = get();
    return state.subscriptionLimits?.canAddBannedRecipe ?? true;
  },

  getUsageStatus: () => {
    const state = get();
    const limits = state.subscriptionLimits;
    const currentIngredients = get().getBannedIngredientsCount();
    const currentRecipes = get().getBannedRecipesCount();

    return {
      ingredients: {
        current: currentIngredients,
        limit: limits?.limits.ingredientExclusions ?? -1,
        canAdd: limits?.canAddIngredientExclusion ?? true,
      },
      recipes: {
        current: currentRecipes,
        limit: limits?.limits.bannedRecipes ?? -1,
        canAdd: limits?.canAddBannedRecipe ?? true,
      },
    };
  },
}));
