# User Preferences Component Architecture - eCo-op Integration

## 🏗️ Component Structure

Based on your existing frontend architecture, here's the integrated user preferences system:

```
frontend/components/user-preferences/
├── UserPreferencesProvider.tsx     # Context provider for preferences state
├── PreferencesOverview.tsx         # Summary card for homepage integration
├── ingredients/
│   ├── IngredientBrowser.tsx       # Browse/search all ingredients
│   ├── IngredientSearchBox.tsx     # Autocomplete search component
│   ├── BannedIngredientsList.tsx   # Manage banned ingredients
│   └── IngredientCard.tsx          # Individual ingredient display
├── recipes/
│   ├── RecipeBrowser.tsx           # Browse/search all recipes
│   ├── RecipeSearchBox.tsx         # Recipe search component
│   ├── BannedRecipesList.tsx       # Manage recipe blacklist
│   └── RecipeCard.tsx              # Individual recipe display
├── settings/
│   ├── PreferencesSettings.tsx     # Price/ingredient limits
│   ├── NotificationSettings.tsx    # Notification preferences
│   └── PreferencesForm.tsx         # Complete preferences form
└── shared/
    ├── SearchableList.tsx          # Reusable search/filter component
    ├── PreferenceToggle.tsx        # Reusable toggle component
    └── PreferencesModal.tsx        # Modal wrapper for settings
```

## 🏠 Homepage Integration Design

### Updated Homepage Layout
```typescript
// app/page.tsx structure with preferences integration
<UserHomepage>
  <WelcomeHeader />
  <QuickActions />
  
  {/* Existing Components */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <PreferencesOverview />          // 👈 Our new component
    <CurrentMealPlanSummary />       // From existing meal planner
    <ShoppingListSummary />          // From GroceryScreen data
    <HouseholdSizeCard />            // From HouseholdSizeSelector
    <LocalStoreCard />               // From StoreSelector
    <RecentRecipesCard />            // New addition
    <PricingAlertsCard />            // New addition
  </div>
  
  <RecentMealPlans />
  <SavedRecipes />
</UserHomepage>
```

### PreferencesOverview Component Design
```typescript
interface PreferencesOverviewProps {
  className?: string;
}

// Compact dashboard card showing:
// - Quick stats: "5 banned ingredients, 3 banned recipes"
// - Price range indicator: "$50-75/week for 4 people"
// - Quick actions: "Add ingredient", "Manage settings"
// - Visual health score indicator
// - Notification status
```

## 🔧 State Management Integration

### Enhanced Context Provider
```typescript
interface UserPreferencesContext {
  // Data
  preferences: UserPreferences | null;
  bannedIngredients: string[];
  bannedRecipes: string[];
  
  // Integration with existing stores
  mealPlannerStore: ReturnType<typeof usePlannerStore>; // Zustand integration
  authContext: AuthContextType; // Existing auth integration
  
  // Loading states
  loading: boolean;
  saving: boolean;
  
  // Actions
  updateBannedIngredients: (ingredients: string[]) => Promise<void>;
  updateBannedRecipes: (recipes: string[]) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Search/browse with existing API
  searchIngredients: (query: string) => Promise<Ingredient[]>;
  searchRecipes: (query: string) => Promise<Recipe[]>;
  
  // Integration methods
  syncWithMealPlanner: () => void;
  applyPreferencesToCurrentPlan: () => void;
}
```

### Integration with Existing Systems

#### 1. **Meal Planner Integration**
```typescript
// Enhanced usePlannerStore with preferences
const usePlannerStore = create<PlannerState & PreferencesIntegration>((set, get) => ({
  // ... existing state
  
  // New preference-aware methods
  generateMealPlanWithPreferences: async () => {
    const preferences = useUserPreferences();
    const filteredRecipes = await filterRecipesByPreferences(preferences);
    // Generate meal plan excluding banned items
  },
  
  validateGroceryListAgainstPreferences: () => {
    // Check grocery items against banned ingredients
    // Highlight conflicts and suggest alternatives
  }
}));
```

#### 2. **Auth Context Integration**
```typescript
// Enhanced AuthContext with preferences
const AuthProvider = ({ children }) => {
  // ... existing auth logic
  
  const [userPreferences, setUserPreferences] = useState(null);
  
  const refreshProfile = async () => {
    // ... existing profile refresh
    // Also fetch user preferences
    const preferences = await makeAPICall('/api/user/preferences');
    setUserPreferences(preferences);
  };
  
  // ... rest of provider
};
```

## 📱 Component Interaction Flows

### Flow 1: Homepage Quick Actions
```
User on homepage sees PreferencesOverview
├── Shows: "5 banned ingredients, 2 banned recipes, $60-80/week"
├── Click "Add ingredient" → IngredientSearchBox modal opens
├── User types "peanuts", sees autocomplete suggestions
├── Selects ingredient, adds to banned list
├── Modal closes, PreferencesOverview updates automatically
└── Meal planner store receives preference update via context
```

### Flow 2: Meal Planning Integration
```
User generating new meal plan
├── MealPlanScreen calls generateMealPlanWithPreferences()
├── System filters out recipes containing banned ingredients
├── If user has price limits, considers budget constraints
├── Generated plan respects all user preferences
└── User sees "Filtered X recipes based on your preferences" message
```

### Flow 3: Grocery List Validation
```
User on GroceryScreen
├── System runs validateGroceryListAgainstPreferences()
├── Highlights any items that conflict with preferences
├── Shows warning: "Peanut butter conflicts with banned ingredient: peanuts"
├── Offers suggestion: "Try almond butter instead?"
└── User can accept suggestion or override preference
```

## 🎨 UI Components Specifications

### 1. **PreferencesOverview Card**
```typescript
// Compact dashboard card (fits in homepage grid)
- Header: "Your Preferences" with settings gear icon
- Stats section: Icons + numbers for banned items
- Budget indicator: Progress bar or range display
- Quick actions: 2-3 prominent buttons
- Status indicators: Notifications, sync status
- Expandable details on click/hover
```

### 2. **Enhanced Search Components**
```typescript
// Builds on existing search patterns from your app
- Consistent with RecipeSelector.jsx style
- Autocomplete with category filtering
- Visual ingredient/recipe cards
- Batch selection capabilities
- Integration with existing CategoryIcons.tsx
```

### 3. **Settings Integration**
```typescript
// Extends existing Header.tsx notification toggle pattern
- Consistent toggle switches (reuse from Header)
- Slider components (similar to HouseholdSizeSelector)
- Form validation (consistent with auth forms)
- Save states and loading indicators
```

## 🔗 API Integration Points

### Leveraging Existing Endpoints
```typescript
// Build on existing API patterns from AuthContext
const preferencesAPI = {
  // Extends existing makeAPICall pattern
  getPreferences: () => makeAPICall('/api/user/preferences'),
  updatePreferences: (data) => makeAPICall('/api/user/preferences', 'PUT', data),
  
  // Ingredient/recipe search (extends existing recipe endpoints)
  searchIngredients: (query) => makeAPICall(`/api/ingredients/search?q=${query}`),
  searchRecipes: (query) => makeAPICall(`/api/recipes/search?q=${query}`),
  
  // Integration with meal planning
  validateMealPlan: (planData) => makeAPICall('/api/meal-plan/validate', 'POST', planData),
};
```

### Data Sync Strategy
```typescript
// Leverages existing usePlannerSync.ts pattern
const usePreferencesSync = () => {
  const { makeAPICall } = useAuth();
  const plannerStore = usePlannerStore();
  
  // Sync preferences when they change
  // Update meal planner when preferences update
  // Handle optimistic updates like existing grocery items
};
```

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create UserPreferencesProvider.tsx
- [ ] Build basic PreferencesOverview card
- [ ] Integrate with homepage layout
- [ ] Add preference data to AuthContext

### Phase 2: Core Functionality (Week 2)
- [ ] Build IngredientSearchBox with autocomplete
- [ ] Create BannedIngredientsList management
- [ ] Implement PreferencesSettings form
- [ ] Add API integration for CRUD operations

### Phase 3: Advanced Integration (Week 3)
- [ ] Integrate with meal planner (filter recipes)
- [ ] Add grocery list validation
- [ ] Build RecipeBrowser with preferences
- [ ] Implement real-time sync across components

### Phase 4: Polish & Optimization (Week 4)
- [ ] Add animations and micro-interactions
- [ ] Optimize performance with React.memo
- [ ] Add comprehensive error handling
- [ ] User testing and refinements

## 🎯 Key Integration Benefits

1. **Seamless UX**: Preferences work automatically across meal planning and shopping
2. **Consistent Design**: Reuses existing patterns and components
3. **Performance**: Leverages existing Zustand store and caching
4. **Maintainable**: Follows established architecture patterns
5. **Scalable**: Easy to add new preference types and integrations


This architecture ensures your user preferences system feels like a natural extension of your existing eCo-op app, rather than a bolt-on feature.
