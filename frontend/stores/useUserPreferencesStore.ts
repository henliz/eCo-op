import { create } from 'zustand';

// Unified preferences interface matching your Firestore structure
export interface UserPreferences {
  // Core preferences
  maxPricePerPortion: number;
  maxIngredients: number;
  newFlyerNotifications: boolean;
  weeklyNotifications: boolean;

  // Banned items (stored as arrays in Firestore)
  bannedIngredients: string[];
  bannedRecipes: string[];

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

  // Actions - Update preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;

  // Actions - Banned ingredients (convenience methods)
  addBannedIngredient: (name: string) => void;
  removeBannedIngredient: (name: string) => void;
  clearBannedIngredients: () => void;

  // Actions - Banned recipes (convenience methods)
  addBannedRecipe: (recipeId: string) => void;
  removeBannedRecipe: (recipeId: string) => void;
  clearBannedRecipes: () => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  markSynced: () => void;

  // Query methods
  isIngredientBanned: (ingredientName: string) => boolean;
  isRecipeBanned: (recipeId: string) => boolean;
  getBannedIngredientsCount: () => number;
  getBannedRecipesCount: () => number;

  // UI helper methods
  getBannedIngredientsAsItems: () => BannedItem[];
  getBannedRecipesAsItems: () => BannedItem[];
  getPreferencesSummary: () => {
    bannedIngredientsCount: number;
    bannedRecipesCount: number;
    priceRange?: string;
    maxIngredients: number;
  };
}

// Default preferences matching your Firestore structure
const DEFAULT_PREFERENCES: UserPreferences = {
  maxPricePerPortion: 10,
  maxIngredients: 6,
  newFlyerNotifications: false,
  weeklyNotifications: false,
  bannedIngredients: [],
  bannedRecipes: [],
  dietaryRestrictions: [],
};

// Utility function to generate IDs for UI items
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useUserPreferencesStore = create<UserPreferencesState>((set, get) => ({
  // Initial state
  preferences: null,
  loading: false,
  saving: false,
  error: null,
  lastSynced: null,
  hasUnsavedChanges: false,

  // Unified load from backend
  loadPreferences: async (makeAPICall) => {
    set({ loading: true, error: null });

    try {
      console.log('Store: Loading user preferences...');

      // Single API call to get all preferences
      const userProfile = await makeAPICall('/user-preferences/profile', 'GET', null, true);

      if (userProfile && typeof userProfile === 'object') {
        console.log('Store: User profile loaded:', userProfile);

        // Map backend data to frontend structure
        const preferences: UserPreferences = {
          maxPricePerPortion: userProfile.maxPricePerPortion || DEFAULT_PREFERENCES.maxPricePerPortion,
          maxIngredients: userProfile.maxIngredients || DEFAULT_PREFERENCES.maxIngredients,
          newFlyerNotifications: userProfile.newFlyerNotifications || DEFAULT_PREFERENCES.newFlyerNotifications,
          weeklyNotifications: userProfile.weeklyNotifications || DEFAULT_PREFERENCES.weeklyNotifications,
          bannedIngredients: userProfile.bannedIngredients || DEFAULT_PREFERENCES.bannedIngredients,
          bannedRecipes: userProfile.bannedRecipes || DEFAULT_PREFERENCES.bannedRecipes,
          dietaryRestrictions: userProfile.dietaryRestrictions || DEFAULT_PREFERENCES.dietaryRestrictions,
          createdAt: userProfile.createdAt ? new Date(userProfile.createdAt) : undefined,
          updatedAt: userProfile.updatedAt ? new Date(userProfile.updatedAt) : undefined,
        };

        set({
          preferences,
          loading: false,
          lastSynced: new Date(),
          hasUnsavedChanges: false,
          error: null,
        });
      } else {
        console.warn('Store: No user profile data received, using defaults');
        set({
          preferences: { ...DEFAULT_PREFERENCES },
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
        loading: false,
        error: 'Failed to load preferences - using defaults'
      });
    }
  },

  // Unified save to backend
  savePreferences: async (makeAPICall) => {
    const state = get();
    if (!state.preferences) {
      throw new Error('No preferences to save');
    }

    set({ saving: true, error: null });

    try {
      console.log('Store: Saving preferences...', state.preferences);

      // Single API call to save all preferences
      const response = await makeAPICall('/user-preferences/profile', 'PUT', {
        maxPricePerPortion: state.preferences.maxPricePerPortion,
        maxIngredients: state.preferences.maxIngredients,
        newFlyerNotifications: state.preferences.newFlyerNotifications,
        weeklyNotifications: state.preferences.weeklyNotifications,
        bannedIngredients: state.preferences.bannedIngredients,
        bannedRecipes: state.preferences.bannedRecipes,
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
    } catch (error) {
      console.error('Store: Error saving preferences:', error);
      set({
        saving: false,
        error: 'Failed to save preferences'
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

  // Convenience methods for banned recipes
  addBannedRecipe: (recipeId) => {
    const state = get();
    const current = state.preferences?.bannedRecipes || [];

    if (!current.includes(recipeId)) {
      get().updatePreferences({
        bannedRecipes: [...current, recipeId]
      });
    }
  },

  removeBannedRecipe: (recipeId) => {
    const state = get();
    const current = state.preferences?.bannedRecipes || [];

    get().updatePreferences({
      bannedRecipes: current.filter(id => id !== recipeId)
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

  // Query methods
  isIngredientBanned: (ingredientName) => {
    const state = get();
    return state.preferences?.bannedIngredients?.includes(ingredientName) || false;
  },

  isRecipeBanned: (recipeId) => {
    const state = get();
    return state.preferences?.bannedRecipes?.includes(recipeId) || false;
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

  getBannedRecipesAsItems: () => {
    const state = get();
    const bannedRecipes = state.preferences?.bannedRecipes || [];

    return bannedRecipes.map(recipeId => ({
      id: recipeId, // Use recipe ID as the key
      name: recipeId, // For now, display the ID as name (could be enhanced with recipe name lookup)
      addedAt: new Date(), // We don't store individual timestamps
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
}));