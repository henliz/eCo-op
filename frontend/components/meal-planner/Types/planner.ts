import { Recipe, MealCategory, PriceTotals, MealSummary } from './recipes';
import { AggregatedItem, IngredientTags } from './ingredients';
import { Store } from './stores';

// Planner state interface
export interface PlannerState {
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


  selectedRecipes: () => Recipe[];
  aggregatedIngredients: () => Map<string, AggregatedItem>;
  totals: () => PriceTotals;
  mealSummary: () => MealSummary;
  calculateInitialMultiplier: (servings: number) => number;
}