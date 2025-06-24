This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

------------------------

# Auto-Save & Data Loading Architecture Documentation

## Overview

This document describes the comprehensive auto-save and data loading system implemented for the meal planner application. The system ensures user data is never lost and provides seamless synchronization between client state and backend storage.

## Architecture Components

### 1. **State Management (usePlannerStore.ts)**
The core state management uses Zustand with comprehensive auto-save capabilities.

#### Key Features:
- **Single Source of Truth**: All user selections stored in one centralized store
- **Change Detection**: Automatic detection of state changes via snapshot comparison
- **Debounced Saves**: Prevents excessive API calls during rapid user interactions
- **Conflict Prevention**: Coordinated save operations to prevent data corruption

#### Core Methods:
```typescript
// Change detection
hasUnsavedChanges: () => boolean

// Debounced auto-save (10-second delay)
debouncedSave: () => void

// Manual save operations
saveUserPlan: (makeAPICall) => Promise<void>
loadUserPlan: (makeAPICall) => Promise<void>
deleteUserPlan: (makeAPICall) => Promise<void>
```

### 2. **Auto-Save Hook (useAutoSave.ts)**
A React hook that provides comprehensive auto-save coverage for various user scenarios.

#### Save Triggers:
- **🚪 Page Exit**: User closes tab, refreshes, or navigates away
- **⏰ Periodic**: Every 30 seconds during idle time
- **🎯 Manual**: Explicit save calls when needed

#### Features:
- **Debouncing**: Minimum 5-second intervals between saves
- **Change Detection**: Only saves when actual changes exist
- **Error Handling**: Graceful failure with user notifications
- **Browser Warnings**: Alerts users before losing unsaved changes

## Data Flow Architecture

### State Change Flow
```
User Action → Store Method → Change Detection → Auto-Save Trigger
     ↓              ↓              ↓               ↓
toggleMeal()  → multiplier=1  → snapshot≠last → debouncedSave()
     ↓              ↓              ↓               ↓
10s delay     → API call      → success       → baseline reset
```

### Change Detection System
```typescript
// Snapshot creation - captures essential state
const createStateSnapshot = (state: PlannerState) => {
  return JSON.stringify({
    normalMealServings: state.normalMealServings,
    selectedStore: state.selectedStore,
    selectedRecipes: state.selectedRecipes().map(r => ({
      url: r.url,
      multiplier: r.multiplier,
      isSelected: r.isSelected
    })),
    groceryCheckedItems: Array.from(state.groceryCheckedItems),
    ingredientTags: state.ingredientTags
  });
};

// Change detection - compares current vs saved
hasUnsavedChanges: () => {
  const currentState = createStateSnapshot(get());
  return currentState !== lastSavedState;
}
```

### Baseline Management
The system maintains a "baseline" snapshot that represents the last successfully saved state:

```typescript
let lastSavedState: string | null = null;

// Updated after successful operations:
// 1. After successful save
// 2. After successful load
// 3. Reset on new user session
```

## Multi-Layer Auto-Save Strategy

### Layer 1: User Action Auto-Save (Primary)
**Trigger**: User interactions (selecting meals, changing quantities, etc.)
**Timing**: 10-second debounced delay
**Purpose**: Handles active usage scenarios

```typescript
// Triggered by user actions
toggleMeal: (url) => {
  // ... update state ...
  setTimeout(() => get().debouncedSave(), 0);
}
```

### Layer 2: Periodic Auto-Save (Safety Net)
**Trigger**: Time-based interval
**Timing**: Every 30 seconds
**Purpose**: Catches changes missed by primary layer

### Layer 3: Exit Auto-Save (Emergency)
**Trigger**: Browser beforeunload event
**Timing**: Immediate
**Purpose**: Last-chance save when user leaves

```typescript
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges()) {
    performSave('beforeunload');
    e.preventDefault();
    e.returnValue = 'You have unsaved meal plan changes.';
  }
};
```

## Data Loading Strategy

### Smart Loading System
The system intelligently determines when to load vs. use cached data:

```typescript
fetchMealData: async () => {
  // Skip if data already loaded for current store
  if (state.isDataLoaded && state.selectedStore) {
    return;
  }
  
  // Fetch fresh data from API
  // Store with full context and user selections
}
```

### Context Preservation
Loaded data includes full temporal and pricing context:

```typescript
interface Recipe {
  // User selection state
  multiplier: number;
  isSelected: boolean;
  
  // Pricing context
  store: string;
  location: string;
  validFromDate: string;
  validToDate: string;
  
  // Full ingredient data
  ingredients: Ingredient[];
}
```

## API Integration

### Authentication Integration
Auto-save integrates with the existing auth system:

```typescript
// Exposed via window for store access
useEffect(() => {
  (window as any).__plannerMakeAPICall = makeAPICall;
}, [makeAPICall]);

// Used by store for authenticated requests
const makeAPICall = getAPICall();
await store.saveUserPlan(makeAPICall);
```

### API Endpoints
- **PUT /user-plans**: Save complete user plan state
- **GET /user-plans**: Load user's saved plan with enriched data
- **DELETE /user-plans**: Remove user's plan

### Data Enrichment
The backend enriches saved minimal data with full recipe details:

```typescript
// Saved to backend (minimal)
{
  selectedStore: "store-id",
  allRecipes: [{ url, multiplier, isSelected, mealType }],
  groceryCheckedItems: ["item1", "item2"],
  ingredientTags: { "item1": { status: "bought" } }
}

// Returned from backend (enriched)
{
  selectedStore: "store-id", 
  allRecipes: [{ 
    url, multiplier, isSelected, mealType,
    name, price, ingredients, validFromDate, validToDate
  }],
  // ... rest enriched with full context
}
```

## Error Handling & Recovery

### Save Failure Recovery
```typescript
try {
  await store.saveUserPlan(makeAPICall);
  lastSavedState = currentState; // Success: update baseline
} catch (error) {
  console.error('Auto-save failed:', error);
  // User retains changes, will retry on next trigger
}
```

### Load Failure Fallback
```typescript
try {
  await loadUserPlan(makeAPICall);
} catch (error) {
  // Gracefully fall back to empty state
  // User can start fresh or retry
}
```

## Performance Optimizations

### Debouncing Strategy
- **Primary saves**: 10-second delay (user activity)
- **Periodic saves**: 30-second intervals (background)
- **Duplicate prevention**: 5-second minimum between any saves

### Change Detection Efficiency
- **Selective snapshots**: Only captures state that matters for saves
- **JSON comparison**: Fast string comparison instead of deep object comparison
- **Lazy evaluation**: Only checks when save is attempted

### Memory Management
- **Snapshot cleanup**: Old snapshots automatically garbage collected
- **State normalization**: Efficient data structures in store

## Usage Examples

### Basic Integration
```typescript
// In your page component
import { useAutoSave } from './useAutoSave';

export default function MealPlannerPage() {
  const { saveNow, isSaving } = useAutoSave();
  
  return (
    <div>
      {isSaving && <SaveIndicator />}
      <MealPlannerComponents />
      <button onClick={() => saveNow('manual')}>Save Now</button>
    </div>
  );
}
```

### Store Integration
```typescript
// User actions automatically trigger saves
const { toggleMeal, setRecipeMultiplier } = usePlannerStore();

// These automatically save after 10 seconds
toggleMeal('recipe-url');
setRecipeMultiplier('recipe-url', 2);
```

## Future Enhancements

### Potential Improvements
1. **Optimistic Updates**: Show changes immediately, sync in background
2. **Conflict Resolution**: Handle simultaneous edits from multiple devices
3. **Offline Support**: Queue saves when network unavailable
4. **Version History**: Allow users to revert to previous versions
5. **Real-time Sync**: WebSocket-based live synchronization

### Monitoring & Analytics
- **Save Success Rates**: Track auto-save reliability
- **User Behavior**: Analyze when users most commonly lose data
- **Performance Metrics**: Monitor save operation timing
- **Error Patterns**: Identify common failure scenarios

## Troubleshooting

### Common Issues
1. **Saves not triggering**: Check if `makeAPICall` is properly exposed on window
2. **Duplicate saves**: Verify debouncing logic and baseline updates
3. **Lost changes**: Ensure `hasUnsavedChanges()` is properly implemented
4. **Load failures**: Check authentication state and API connectivity

### Debug Logging
The system includes comprehensive logging:
```
[PlannerStore] Changes detected, auto-saving...
[AutoSave] Saving (periodic)...
[AutoSave] ✅ Saved successfully (periodic)
```

## Conclusion

This auto-save architecture provides a robust, user-friendly system that prevents data loss while maintaining good performance. The multi-layered approach ensures coverage of all user scenarios, from active usage to unexpected exits, while the change detection system prevents unnecessary API calls.

The design is extensible and can accommodate future enhancements like offline support and real-time collaboration while maintaining the core reliability that users depend on.
