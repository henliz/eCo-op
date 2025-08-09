import { create } from 'zustand';

// API Call function type
type APICallFunction = (
  endpoint: string,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: unknown,
  requireAuth?: boolean
) => Promise<unknown>;

// API Response interfaces
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
    allRecipes?: any[];  // Full Recipe objects with enriched data
    groceryCheckedItems?: string[];
    ingredientTags?: Record<string, any>;
  };
}

// Plan data interface for saving/loading
export interface PlanData {
  householdSize: number;
  selectedStore: string | null;
  allRecipes: any[];  // Contains all recipes with their selection state
  groceryCheckedItems: string[];
  ingredientTags: Record<string, any>;
}

// Data getter function types for dependency injection
export type GetPlanDataFunction = () => PlanData;
export type SetPlanDataFunction = (data: Partial<PlanData>) => void;

interface PlanSyncState {
  // Sync state
  isSyncing: boolean;
  lastSynced: Date | null;
  lastSyncError: string | null;
  planId: string | null;
  version: number;

  // Auto-save state
  saveTimeout: NodeJS.Timeout | null;
  lastSavedState: string | null;
  autoSaveEnabled: boolean;

  // Actions - Plan management
  loadUserPlan: (makeAPICall: APICallFunction, setPlanData: SetPlanDataFunction) => Promise<void>;
  saveUserPlan: (makeAPICall: APICallFunction, getPlanData: GetPlanDataFunction) => Promise<void>;
  deleteUserPlan: (makeAPICall: APICallFunction) => Promise<void>;

  // Actions - Auto-save
  debouncedSave: (getPlanData: GetPlanDataFunction, makeAPICall: APICallFunction) => void;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  clearSaveTimeout: () => void;

  // Actions - State management
  setSyncState: (state: Partial<Pick<PlanSyncState, 'isSyncing' | 'lastSynced' | 'lastSyncError' | 'planId' | 'version'>>) => void;
  resetSyncState: () => void;
  markSynced: (planId?: string, version?: number) => void;

  // Utility methods
  hasUnsavedChanges: (getPlanData: GetPlanDataFunction) => boolean;
  getLastSyncInfo: () => { lastSynced: Date | null; planId: string | null; version: number };
  createStateSnapshot: (planData: PlanData) => string;
}

export const usePlanSyncStore = create<PlanSyncState>((set, get) => ({
  // Initial state
  isSyncing: false,
  lastSynced: null,
  lastSyncError: null,
  planId: null,
  version: 0,
  saveTimeout: null,
  lastSavedState: null,
  autoSaveEnabled: true,

  // Plan management actions
  loadUserPlan: async (makeAPICall, setPlanData) => {
    try {
      console.log('[PlanSyncStore] Loading user plan...');
      set({ isSyncing: true, lastSyncError: null });

      const response = await makeAPICall('/user-plans', 'GET', null, true) as LoadPlanResponse;

      if (response.success && response.data) {
        const plan = response.data;
        console.log('[PlanSyncStore] Plan loaded successfully:', {
          planId: response.planId,
          version: response.version,
          hasRecipes: !!(plan.allRecipes && plan.allRecipes.length > 0)
        });

        // Update other stores through the setter function
        setPlanData({
          householdSize: plan.householdSize || 4,
          selectedStore: plan.selectedStore || null,
          allRecipes: plan.allRecipes || [],
          groceryCheckedItems: plan.groceryCheckedItems || [],
          ingredientTags: plan.ingredientTags || {},
        });

        // Update sync state
        set({
          planId: response.planId || null,
          version: response.version || 0,
          lastSynced: new Date(),
          isSyncing: false,
          lastSyncError: null,
        });

        // Reset baseline after successful load
        const state = get();
        const currentData: PlanData = {
          householdSize: plan.householdSize || 4,
          selectedStore: plan.selectedStore || null,
          allRecipes: plan.allRecipes || [],
          groceryCheckedItems: plan.groceryCheckedItems || [],
          ingredientTags: plan.ingredientTags || {},
        };
        state.lastSavedState = state.createStateSnapshot(currentData);

      } else {
        // No existing plan found
        console.log('[PlanSyncStore] No existing plan found, using defaults');
        setPlanData({
          householdSize: 4,
          selectedStore: null,
          allRecipes: [],
          groceryCheckedItems: [],
          ingredientTags: {},
        });

        set({
          planId: null,
          version: 0,
          lastSynced: null,
          isSyncing: false,
          lastSyncError: null,
        });
      }
    } catch (error) {
      console.error('[PlanSyncStore] Error loading user plan:', error);
      set({
        lastSyncError: 'Failed to load user plan',
        isSyncing: false
      });
      throw error;
    }
  },

  saveUserPlan: async (makeAPICall, getPlanData) => {
    try {
      console.log('[PlanSyncStore] Saving user plan...');
      set({ isSyncing: true, lastSyncError: null });

      const planData = getPlanData();

      const response = await makeAPICall('/user-plans', 'PUT', planData, true) as SavePlanResponse;

      if (response.success) {
        console.log('[PlanSyncStore] Plan saved successfully:', {
          planId: response.planId,
          version: response.version
        });

        set({
          planId: response.planId,
          version: response.version,
          lastSynced: new Date(),
          isSyncing: false,
          lastSyncError: null,
        });

        // Reset baseline after successful save
        const state = get();
        state.lastSavedState = state.createStateSnapshot(planData);

      } else {
        throw new Error(response.error || 'Failed to save user plan');
      }
    } catch (error) {
      console.error('[PlanSyncStore] Error saving user plan:', error);
      set({
        lastSyncError: 'Failed to save user plan',
        isSyncing: false
      });
      throw error;
    }
  },

  deleteUserPlan: async (makeAPICall) => {
    try {
      console.log('[PlanSyncStore] Deleting user plan...');
      set({ isSyncing: true, lastSyncError: null });

      const response = await makeAPICall('/user-plans', 'DELETE', null, true) as APIResponse;

      if (response.success) {
        console.log('[PlanSyncStore] User plan deleted successfully');
        set({
          planId: null,
          version: 0,
          lastSynced: null,
          isSyncing: false,
          lastSyncError: null,
          lastSavedState: null,
        });
      } else {
        throw new Error(response.error || 'Failed to delete user plan');
      }
    } catch (error) {
      console.error('[PlanSyncStore] Error deleting user plan:', error);
      set({
        lastSyncError: 'Failed to delete user plan',
        isSyncing: false
      });
      throw error;
    }
  },

  // Auto-save functionality
  debouncedSave: (getPlanData, makeAPICall) => {
    const state = get();

    if (!state.autoSaveEnabled) {
      return;
    }

    // Clear existing timeout
    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
    } else {
    }

    // Set new timeout
    const newTimeout = setTimeout(async () => {
      try {
        const planData = getPlanData();

        // Get fresh state when timeout executes, not stale closure state
        const currentState = get();

        // Check if there are actually changes
        if (!currentState.hasUnsavedChanges(getPlanData)) {
          return;
        }

        // Validate that we have the minimum required data for auto-save
        if (!planData.selectedStore) {
          return;
        }

        await currentState.saveUserPlan(makeAPICall, getPlanData);

      } catch (error) {
        console.error('[PlanSyncStore] Auto-save failed:', error);
        set({ lastSyncError: 'Auto-save failed' });
      }
    }, 10000); // 10 second delay

    set({ saveTimeout: newTimeout });
  },

  enableAutoSave: () => {
    console.log('[PlanSyncStore] Auto-save enabled');
    set({ autoSaveEnabled: true });
  },

  disableAutoSave: () => {
    console.log('[PlanSyncStore] Auto-save disabled');
    const state = get();
    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
    }
    set({ autoSaveEnabled: false, saveTimeout: null });
  },

  clearSaveTimeout: () => {
    const state = get();
    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
      set({ saveTimeout: null });
    }
  },

  // State management actions
  setSyncState: (newState) => {
    set(newState);
  },

  resetSyncState: () => {
    const state = get();
    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
    }
    set({
      isSyncing: false,
      lastSynced: null,
      lastSyncError: null,
      planId: null,
      version: 0,
      saveTimeout: null,
      lastSavedState: null,
    });
  },

  markSynced: (planId, version) => {
    set({
      lastSynced: new Date(),
      lastSyncError: null,
      ...(planId !== undefined && { planId }),
      ...(version !== undefined && { version }),
    });
  },

  // Utility methods
  hasUnsavedChanges: (getPlanData) => {
    const state = get();

    try {
      const planData = getPlanData();

      // No changes if no baseline or no store selected
      if (!state.lastSavedState || !planData.selectedStore) {
        return false;
      }

      // Compare current state with last saved state
      const currentState = state.createStateSnapshot(planData);
      const hasChanges = currentState !== state.lastSavedState;

      return hasChanges;
    } catch (error) {
      console.error('[PlanSyncStore] Error checking for unsaved changes:', error);
      return false;
    }
  },

  getLastSyncInfo: () => {
    const state = get();
    return {
      lastSynced: state.lastSynced,
      planId: state.planId,
      version: state.version,
    };
  },

  createStateSnapshot: (planData) => {
    try {
      // Create a minimal snapshot for change detection
      return JSON.stringify({
        householdSize: planData.householdSize,
        selectedStore: planData.selectedStore,
        selectedRecipes: planData.allRecipes.map((r: any) => ({
          url: r.url,
          multiplier: r.multiplier,
          isSelected: r.isSelected
        })),
        groceryCheckedItems: planData.groceryCheckedItems.sort(),
        ingredientTags: planData.ingredientTags
      });
    } catch (error) {
      console.error('[PlanSyncStore] Error creating state snapshot:', error);
      return JSON.stringify({});
    }
  },

  // NEW: Set initial baseline
  setInitialBaseline: (planData: PlanData) => {
    const snapshot = get().createStateSnapshot(planData);
    set({ lastSavedState: snapshot });
  },
}));