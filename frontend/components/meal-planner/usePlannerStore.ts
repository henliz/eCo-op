import { create } from 'zustand';

// Types
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
}

interface Totals {
  regularTotal: number;
  saleTotal: number;
  totalSavings: number;
}

interface PlannerState {
  meals: MealCategory;
  selectedMeals: Set<string>;
  groceryCheckedItems: Set<string>;

  // Actions
  setMeals: (meals: MealCategory) => void;
  toggleMeal: (url: string) => void;
  toggleGroceryItem: (packageId: string) => void;

  // Computed values
  selectedRecipes: () => Recipe[];
  aggregatedIngredients: () => Map<string, AggregatedItem>;
  totals: () => Totals;
  mealSummary: () => { breakfast: number; lunch: number; dinner: number; total: number };
}

// Helper function for rounding logic
function isWholeUnit(unitType: string): boolean {
  return ["whole", "package", "each"].includes(unitType);
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  meals: {
    breakfast: [],
    lunch: [],
    dinner: []
  },
  selectedMeals: new Set<string>(),
  groceryCheckedItems: new Set<string>(),

  setMeals: (meals) => {
    // Select first 7 meals from each category by default
    const defaultSelectedMeals = new Set<string>();

    Object.values(meals).forEach((recipes: Recipe[]) => {
      recipes.slice(0, 7).forEach(recipe => {
        defaultSelectedMeals.add(recipe.url);
      });
    });

    set({
      meals,
      selectedMeals: defaultSelectedMeals
    });
  },

  toggleMeal: (url) => set((state) => {
    const newSelectedMeals = new Set(state.selectedMeals);
    if (newSelectedMeals.has(url)) {
      newSelectedMeals.delete(url);
    } else {
      newSelectedMeals.add(url);
    }
    return { selectedMeals: newSelectedMeals };
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

  selectedRecipes: () => {
    const state = get();
    const recipes: Recipe[] = [];

    // Collect all meals from all categories
    const allRecipes = [
      ...state.meals.breakfast,
      ...state.meals.lunch,
      ...state.meals.dinner
    ];

    // Filter only selected meals
    allRecipes.forEach(recipe => {
      if (state.selectedMeals.has(recipe.url)) {
        recipes.push(recipe);
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
      recipe.ingredients.forEach(ing => {
        // Skip ingredients marked as 'skipped'
        if (ing.source === 'skipped') return;

        // Create a packageId if it doesn't exist
        const packageId = ing.packageId || `${ing.productName || ing.recipeIngredientName}-${ing.saleUnitSize}${ing.saleUnitType}`;

        const existing = aggregateMap.get(packageId);
        if (existing) {
          existing.neededFraction += ing.saleFractionUsed || 0;
        } else {
          aggregateMap.set(packageId, {
            packageId,
            neededFraction: ing.saleFractionUsed || 0,
            unitSize: ing.saleUnitSize || 0,
            unitType: ing.saleUnitType || '',
            packPrice: ing.salePrice,
            productName: ing.productName || ing.recipeIngredientName,
            source: ing.source,
            lineCost: 0,
            packsToBuy: 0,
            isChecked: state.groceryCheckedItems.has(packageId),
            savingsPercentage: ing.savingsPercentage
          });
        }
      });
    });

    // Step 3: Compute line costs
    aggregateMap.forEach(pkg => {
      // Check if item is checked (pantry)
      if (pkg.isChecked) {
        pkg.packsToBuy = 0;
        pkg.lineCost = 0;
      } else {
        let packsToBuy = pkg.neededFraction;
        if (isWholeUnit(pkg.unitType)) {
          packsToBuy = Math.ceil(packsToBuy);
        }
        pkg.packsToBuy = packsToBuy;
        pkg.lineCost = packsToBuy * pkg.packPrice;
      }
    });

    return aggregateMap;
  },

  totals: () => {
    const state = get();
    const selectedRecipes = state.selectedRecipes();
    const aggregatedItems = state.aggregatedIngredients();

    let totalSale = 0;
    let totalRegular = 0;

    aggregatedItems.forEach(item => {
      totalSale += item.lineCost;
      totalRegular += item.packsToBuy * item.packPrice;
    });

    // For total savings from recipe selections
    const recipeSavings = selectedRecipes.reduce((sum, recipe) => sum + recipe.totalSavings, 0);
    const grocerySavings = totalRegular - totalSale;

    return {
      regularTotal: totalRegular,
      saleTotal: totalSale,
      totalSavings: recipeSavings + grocerySavings
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

    // Count selected meals by category
    (['breakfast', 'lunch', 'dinner'] as const).forEach(category => {
      state.meals[category].forEach(recipe => {
        if (state.selectedMeals.has(recipe.url)) {
          summary[category]++;
          summary.total++;
        }
      });
    });

    return summary;
  }
}));