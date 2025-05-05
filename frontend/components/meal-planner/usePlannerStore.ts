import { create } from 'zustand';

// Types
export interface IngredientTags {
  importance?: 'core' | 'optional';
  status?: 'bought' | 'owned' | 'ignored';
  storeSection?: string;
}

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
  tags?: IngredientTags;
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
  multiplier?: number; // How many times this recipe will be made
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
  tags?: IngredientTags;
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
  recipeMultipliers: Record<string, number>; // url -> multiplier (defaults to 1)
  ingredientTags: Record<string, IngredientTags>; // packageId -> tags

  // Actions
  setMeals: (meals: MealCategory) => void;
  toggleMeal: (url: string) => void;
  toggleGroceryItem: (packageId: string) => void;
  setRecipeMultiplier: (url: string, multiplier: number) => void;
  setIngredientTag: (packageId: string, tag: keyof IngredientTags, value: string | undefined) => void;
  setIngredientTags: (packageId: string, tags: Partial<IngredientTags>) => void;

  // Computed values
  selectedRecipes: () => Recipe[];
  aggregatedIngredients: () => Map<string, AggregatedItem>;
  totals: () => Totals;
  mealSummary: () => { breakfast: number; lunch: number; dinner: number; total: number };
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  meals: {
    breakfast: [],
    lunch: [],
    dinner: []
  },
  selectedMeals: new Set<string>(),
  groceryCheckedItems: new Set<string>(),
  recipeMultipliers: {},
  ingredientTags: {},

  setMeals: (meals) => {
    // Select first 7 meals from each category by default
    const defaultSelectedMeals = new Set<string>();
    const initialMultipliers: Record<string, number> = {};

    Object.values(meals).forEach((recipes: Recipe[]) => {
      recipes.slice(0, 7).forEach(recipe => {
        defaultSelectedMeals.add(recipe.url);
        initialMultipliers[recipe.url] = 1; // Default multiplier for selected recipes
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
  },

  toggleMeal: (url) => set((state) => {
    const newSelectedMeals = new Set(state.selectedMeals);
    const newMultipliers = { ...state.recipeMultipliers };

    if (newSelectedMeals.has(url)) {
      newSelectedMeals.delete(url);
      newMultipliers[url] = 0; // Set multiplier to 0 when unselected
    } else {
      newSelectedMeals.add(url);
      newMultipliers[url] = 1; // Set multiplier to 1 when selected
    }

    return {
      selectedMeals: newSelectedMeals,
      recipeMultipliers: newMultipliers
    };
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

  setRecipeMultiplier: (url, multiplier) => set((state) => {
    const newMultipliers = { ...state.recipeMultipliers };
    const newSelectedMeals = new Set(state.selectedMeals);

    // Ensure multiplier is a non-negative integer
    const newMultiplier = Math.max(0, Math.round(multiplier));
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

    // Count selected meals by category, considering multipliers
    (['breakfast', 'lunch', 'dinner'] as const).forEach(category => {
      state.meals[category].forEach(recipe => {
        if (state.selectedMeals.has(recipe.url)) {
          const multiplier = state.recipeMultipliers[recipe.url] || 1;
          summary[category] += multiplier;
          summary.total += multiplier;
        }
      });
    });

    return summary;
  }
}));
