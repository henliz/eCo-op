# Frontend Architecture Documentation

## Overview

This document describes the frontend architecture for the eCo-op meal planning application. The architecture has been refactored from a monolithic store pattern into a modular, well-separated system that promotes maintainability, testability, and clear separation of concerns.

## Core Principles

### 1. **Separation of Concerns**
Each store has a single, well-defined responsibility:
- **MealPlanStore**: Recipe data and selection state
- **GroceryStore**: Shopping list and ingredient aggregation
- **StoreLocationStore**: Store discovery and location services
- **UserPreferencesStore**: User settings and preferences
- **PlanSyncStore**: Backend synchronization and persistence

### 2. **Loose Coupling**
Stores communicate through:
- **Dependency injection** (function parameters)
- **Event callbacks** (onStateChange)
- **Orchestrator coordination** (usePlannerStores)

### 3. **Backward Compatibility**
The orchestrator maintains the same API as the original monolithic store, enabling gradual migration.

## Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    usePlannerStores                         │
│                    (Orchestrator)                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Cross-Store Logic                      │    │
│  │  • Auto-save coordination                          │    │
│  │  • State synchronization                           │    │
│  │  • Event management                                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ MealPlan    │ │ Grocery     │ │StoreLocation│ │ PlanSync    │
│ Store       │ │ Store       │ │ Store       │ │ Store       │
│             │ │             │ │             │ │             │
│• Meal data  │ │• Aggregation│ │• Discovery  │ │• Auto-save  │
│• Selection  │ │• Shopping   │ │• Location   │ │• Backend    │
│• Multipliers│ │• Checking   │ │• Distance   │ │• Versioning │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

## Individual Store Details

### useMealPlanStore.ts

**Purpose**: Manages meal data, recipe selection, and multipliers.

**Key Responsibilities**:
- Fetch meal data from API
- Manage recipe selection state (multipliers)
- Calculate initial multipliers based on household size
- Provide computed values (selectedRecipes, mealSummary)

**State Structure**:
```typescript
interface MealPlanState {
  meals: MealCategory;           // All available recipes
  normalMealServings: number;    // Household size
  isDataLoaded: boolean;         // Data fetch status
  isLoading: boolean;            // Loading indicator
  error: string | null;          // Error state
}
```

**Key Methods**:
- `fetchMealData(store, makeAPICall)` - Fetch recipes for selected store
- `toggleMeal(url)` - Toggle recipe selection on/off
- `setRecipeMultiplier(url, multiplier)` - Set specific multiplier
- `selectedRecipes()` - Get all selected recipes
- `calculateInitialMultiplier(servings)` - Calculate default multiplier

**Event Integration**:
- Triggers `onStateChange` callback after state mutations
- Used by orchestrator for auto-save coordination

### useGroceryStore.ts

**Purpose**: Manages grocery list functionality and ingredient aggregation.

**Key Responsibilities**:
- Aggregate ingredients from selected recipes
- Manage grocery item checking/status
- Handle ingredient tags and metadata
- Calculate shopping totals

**State Structure**:
```typescript
interface GroceryState {
  groceryCheckedItems: Set<string>;              // Checked items
  ingredientTags: Record<string, IngredientTags>; // Item metadata
}
```

**Key Methods**:
- `aggregatedIngredients(selectedRecipes)` - Combine recipe ingredients
- `toggleGroceryItem(packageId)` - Check/uncheck grocery items
- `totals(selectedRecipes)` - Calculate price totals
- `setIngredientTags(packageId, tags)` - Set item metadata

**Dependency Pattern**:
- Takes `selectedRecipes` as parameter (dependency injection)
- No direct access to other stores

### useStoreLocationStore.ts

**Purpose**: Handles store discovery, selection, and location services.

**Key Responsibilities**:
- Discover available stores from API
- Manage store selection
- Handle user location (GPS, postal code)
- Calculate distances to stores

**State Structure**:
```typescript
interface StoreLocationState {
  availableStores: Store[];         // All discovered stores
  selectedStore: string | null;     // Currently selected store
  userLocation: UserLocation | null; // User's location
  isStoresLoaded: boolean;          // Discovery status
}
```

**Key Methods**:
- `discoverStores()` - Fetch store list from API
- `setSelectedStore(storeId)` - Select a store
- `setUserLocation(location)` - Set user location
- `getNearbyStores(maxDistance)` - Get stores within distance

### useUserPreferencesStore.ts

**Purpose**: Manages user preferences, dietary restrictions, and banned items.

**Key Responsibilities**:
- User dietary preferences
- Banned ingredients and recipes
- Subscription limits
- Preference persistence

**State Structure**:
```typescript
interface UserPreferencesState {
  preferences: UserPreferences | null;
  subscriptionLimits: SubscriptionLimitsData | null;
  loading: boolean;
  saving: boolean;
}
```

**Key Features**:
- Handles both ingredient exclusions and recipe bans
- Manages subscription tier limits
- Provides convenience methods for common operations

### usePlanSyncStore.ts

**Purpose**: Handles backend synchronization, auto-save, and plan persistence.

**Key Responsibilities**:
- Auto-save with debouncing
- Load/save/delete user plans
- Change detection
- Sync state management

**State Structure**:
```typescript
interface PlanSyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  planId: string | null;
  version: number;
  lastSavedState: string | null; // Baseline for change detection
}
```

**Key Methods**:
- `saveUserPlan(makeAPICall, getPlanData)` - Save plan to backend
- `loadUserPlan(makeAPICall, setPlanData)` - Load plan from backend
- `hasUnsavedChanges(getPlanData)` - Detect changes
- `createStateSnapshot(planData)` - Create change detection baseline

## Orchestrator Pattern (usePlannerStores.ts)

### Purpose
The orchestrator provides:
1. **Unified API** - Single import for components
2. **Cross-store coordination** - Auto-save, state sync
3. **Backward compatibility** - Same interface as old monolithic store
4. **Event management** - Coordinates between stores

### Auto-Save System

The auto-save system is **React-managed** (not Zustand-managed) to avoid timeout issues:

```typescript
// React-managed timeout (works reliably)
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const triggerAutoSave = () => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  
  saveTimeoutRef.current = setTimeout(async () => {
    // Auto-save logic
  }, 10000);
};
```

**Auto-save Flow**:
1. User makes change (toggle recipe, etc.)
2. Individual store calls `onStateChange` callback
3. Orchestrator's `triggerAutoSave` is called
4. 10-second debounced timeout is set/reset
5. After 10 seconds of no changes, auto-save executes

### Cross-Store Computed Values

The orchestrator provides computed values that depend on multiple stores:

```typescript
const aggregatedIngredients = useCallback(() => {
  return grocery.aggregatedIngredients(mealPlan.selectedRecipes());
}, [grocery, mealPlan]);
```

### Baseline Management

Auto-save requires a baseline to detect changes:

```typescript
// Initial baseline is set when component mounts with data
if (storeLocation.selectedStore && mealPlan.meals.breakfast.length > 0) {
  const initialSnapshot = planSync.createStateSnapshot(initialData);
  // Set baseline for change detection
}
```

## Component Integration Patterns

### Using the Orchestrator (Recommended)

```typescript
import { usePlannerStores } from '@/stores/usePlannerStores';

export function MyComponent() {
  const { 
    meals, 
    selectedStore, 
    toggleMeal, 
    aggregatedIngredients 
  } = usePlannerStores();
  
  // Use unified interface
}
```

### Using Individual Stores (Advanced)

```typescript
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { useGroceryStore } from '@/stores/useGroceryStore';

export function MyComponent() {
  const mealPlan = useMealPlanStore();
  const grocery = useGroceryStore();
  
  // Manual coordination required
  const aggregatedIngredients = grocery.aggregatedIngredients(
    mealPlan.selectedRecipes()
  );
}
```

### Direct Store Access (Non-React contexts)

```typescript
import { getPlannerStores } from '@/stores/usePlannerStores';

// Outside React components
const store = getPlannerStores();
store.fetchMealData();
store.setState({ selectedStore: 'some-id' });
```

## Data Flow Patterns

### 1. User Action → State Change → Auto-Save

```
User toggles recipe
    ↓
MealPlanStore.toggleMeal()
    ↓
onStateChange callback
    ↓
Orchestrator.triggerAutoSave()
    ↓
10-second debounced save
```

### 2. Store Selection → Data Loading

```
User selects store
    ↓
StoreLocationStore.setSelectedStore()
    ↓
Orchestrator.enhancedSetSelectedStore()
    ↓
MealPlanStore.clearMealData()
    ↓
MealPlanStore.fetchMealData()
```

### 3. Plan Loading → State Hydration

```
PlanSyncStore.loadUserPlan()
    ↓
Backend returns enriched recipes
    ↓
Orchestrator.setPlanData()
    ↓
Updates all individual stores
    ↓
UI reflects loaded state
```

## API Integration

### Authentication Flow

```typescript
// AuthContext exposes makeAPICall globally
window.__plannerMakeAPICall = makeAPICall;

// Stores use dependency injection
const fetchData = async (makeAPICall: APICallFunction) => {
  const response = await makeAPICall('/endpoint', 'GET', null, true);
};
```

### Error Handling

```typescript
// Stores handle their own errors
try {
  const response = await makeAPICall('/endpoint', 'GET');
  if (!response.success) {
    throw new Error(response.error);
  }
} catch (error) {
  set({ error: error.message });
}
```

## Testing Strategies

### Unit Testing Individual Stores

```typescript
import { useMealPlanStore } from '@/stores/useMealPlanStore';

test('toggleMeal should update multiplier', () => {
  const store = useMealPlanStore.getState();
  store.toggleMeal('recipe-url');
  
  const recipes = store.selectedRecipes();
  expect(recipes).toHaveLength(1);
});
```

### Integration Testing with Orchestrator

```typescript
import { usePlannerStores } from '@/stores/usePlannerStores';

test('auto-save should trigger after recipe toggle', async () => {
  const { toggleMeal } = usePlannerStores();
  
  toggleMeal('recipe-url');
  
  // Wait for auto-save
  await new Promise(resolve => setTimeout(resolve, 11000));
  
  // Assert save was called
});
```

### Mocking API Calls

```typescript
const mockMakeAPICall = jest.fn().mockResolvedValue({
  success: true,
  data: mockMealData
});

window.__plannerMakeAPICall = mockMakeAPICall;
```

## Common Patterns & Best Practices

### ✅ DO

1. **Use the orchestrator for most components**
   ```typescript
   const plannerStores = usePlannerStores();
   ```

2. **Pass data as parameters to avoid coupling**
   ```typescript
   grocery.aggregatedIngredients(selectedRecipes)
   ```

3. **Use dependency injection for API calls**
   ```typescript
   fetchMealData(selectedStore, makeAPICall)
   ```

4. **Trigger auto-save via onStateChange callbacks**
   ```typescript
   // In store action
   setTimeout(() => state.onStateChange?.(), 0);
   ```

5. **Use React refs for timeout management**
   ```typescript
   const timeoutRef = useRef<NodeJS.Timeout | null>(null);
   ```

### ❌ DON'T

1. **Don't access other stores directly from within a store**
   ```typescript
   // ❌ Bad
   const otherStore = useOtherStore.getState();
   
   // ✅ Good
   const computeValue = (dataFromOtherStore) => { ... }
   ```

2. **Don't store timeouts in Zustand state**
   ```typescript
   // ❌ Bad - causes infinite loops
   set({ timeout: setTimeout(...) });
   
   // ✅ Good - use React refs
   timeoutRef.current = setTimeout(...);
   ```

3. **Don't call setState in useEffect without guards**
   ```typescript
   // ❌ Bad - infinite loop
   useEffect(() => {
     setState({ ... });
   }, [someState]);
   
   // ✅ Good - use flags or separate effects
   useEffect(() => {
     if (!hasSet.current) {
       hasSet.current = true;
       setState({ ... });
     }
   }, []);
   ```

4. **Don't mix hook and non-hook store access**
   ```typescript
   // ❌ Bad - inconsistent patterns
   const hookData = usePlannerStores();
   const directData = getPlannerStores().getState();
   
   // ✅ Good - pick one pattern per component
   const { data } = usePlannerStores();
   ```

## Migration Guide

### From Old Monolithic Store

1. **Replace imports**:
   ```typescript
   // Old
   import { usePlannerStore } from '@/components/meal-planner/usePlannerStore';
   
   // New
   import { usePlannerStores as usePlannerStore } from '@/stores/usePlannerStores';
   ```

2. **Replace selector patterns**:
   ```typescript
   // Old
   const meals = usePlannerStore(s => s.meals);
   const toggleMeal = usePlannerStore(s => s.toggleMeal);
   
   // New
   const { meals, toggleMeal } = usePlannerStore();
   ```

3. **Replace direct store access**:
   ```typescript
   // Old
   usePlannerStore.getState().fetchMealData();
   
   // New
   import { getPlannerStores } from '@/stores/usePlannerStores';
   getPlannerStores().fetchMealData();
   ```

## Performance Considerations

### Computed Value Optimization

```typescript
// Use useCallback for expensive computations
const aggregatedIngredients = useCallback(() => {
  return grocery.aggregatedIngredients(mealPlan.selectedRecipes());
}, [grocery, mealPlan]); // Only recalculate when stores change
```

### Auto-Save Debouncing

- **10-second delay** prevents excessive API calls
- **Change detection** avoids saves when no actual changes
- **React-managed timeouts** prevent memory leaks

### Store Independence

- Each store can be optimized independently
- No unnecessary re-renders from unrelated changes
- Better tree-shaking and code splitting potential

## Troubleshooting

### Auto-Save Not Working

1. Check if `onStateChange` callback is set:
   ```typescript
   console.log('Callback set?', mealPlan.onStateChange);
   ```

2. Verify baseline exists:
   ```typescript
   console.log('Baseline?', planSync.lastSavedState);
   ```

3. Check timeout execution:
   ```typescript
   // Add logging to triggerAutoSave function
   console.log('Setting timeout...');
   ```

### Infinite Loops

1. Check useEffect dependencies
2. Verify no setState in render cycles
3. Use refs for values that shouldn't trigger re-renders

### State Synchronization Issues

1. Ensure orchestrator is being used consistently
2. Check that data flows through proper channels
3. Verify event callbacks are properly set up

## Future Considerations

### Potential Improvements

1. **TypeScript Strictness**: Replace remaining `any` types with proper interfaces
2. **Store Persistence**: Add local storage backup for offline capability
3. **Optimistic Updates**: Update UI immediately, sync in background
4. **Real-time Sync**: WebSocket integration for multi-device sync
5. **State Machines**: Use XState for complex state transitions

### Scaling Patterns

1. **Feature Stores**: Add stores for new features (reviews, social, etc.)
2. **Domain Separation**: Group related stores into domains
3. **Micro-Frontends**: Each store could become its own module
4. **Service Layer**: Extract API logic into separate service layer

---

This architecture provides a solid foundation for the eCo-op frontend while maintaining flexibility for future growth and changes. The modular design ensures that future developers can understand, maintain, and extend the codebase with confidence.