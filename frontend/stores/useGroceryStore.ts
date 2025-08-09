import { create } from 'zustand';

// Import Recipe and Ingredient types from MealPlanStore
export interface Ingredient {
  recipeIngredientName: string;
  saleUnitSize?: number;
  saleUnitType?: string;
  salePrice: number;
  saleFractionUsed?: number;
  regularPrice: number;
  regularFractionUsed?: number;
  type?: 'core' | 'optional' | 'garnish' | 'to taste';
  source: 'flyer' | 'database' | 'missing' | 'skipped' | 'free';
  sourceDate?: string;
  productName?: string;
  packageId?: string;
  savingsPercentage?: number;
  category?: string;
}

export interface Recipe {
  name: string;
  url: string;
  img?: string;
  price: number;
  salePrice: number;
  regularPrice: number;
  totalSavings: number;
  servings: number;
  flyerItemsCount: number;
  ingredients: Ingredient[];
  multiplier: number;
  isSelected: boolean;
  store: string;
  location: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  date: string;
  validFromDate: string;
  validToDate: string;
  pricingContext?: {
    store: string;
    location: string;
    dataDate: string;
    validFromDate: string;
    validToDate: string;
    queryDate: string;
  };
}

// Ingredient tags interface
export interface IngredientTags {
  importance?: 'core' | 'optional';
  status?: 'bought' | 'owned' | 'in_cart' | 'ignored';
  storeSection?: string;
}

// Aggregated item interface
export interface AggregatedItem {
  packageId: string;
  neededFraction: number;
  unitSize: number;
  unitType: string;
  packPrice: number;
  productName: string;
  source: 'flyer' | 'database' | 'missing' | 'skipped' | 'free';
  lineCost: number;
  packsToBuy: number;
  isChecked: boolean;
  savingsPercentage?: number;
  tags?: IngredientTags;
  category?: string;
}

// Totals interface
export interface Totals {
  regularTotal: number;
  saleTotal: number;
  totalSavings: number;
}

interface GroceryState {
  // Core data
  groceryCheckedItems: Set<string>;
  ingredientTags: Record<string, IngredientTags>;

  // Actions - Grocery item management
  toggleGroceryItem: (packageId: string) => void;
  setGroceryCheckedItems: (items: Set<string>) => void;
  clearGroceryCheckedItems: () => void;

  // Actions - Ingredient tag management
  setIngredientTag: (packageId: string, tag: keyof IngredientTags, value: string | undefined) => void;
  setIngredientTags: (packageId: string, tags: Partial<IngredientTags>) => void;
  setAllIngredientTags: (tags: Record<string, IngredientTags>) => void;
  clearIngredientTags: () => void;

  // Computed values (take selectedRecipes as input to avoid direct dependencies)
  aggregatedIngredients: (selectedRecipes: Recipe[]) => Map<string, AggregatedItem>;
  totals: (selectedRecipes: Recipe[]) => Totals;
  groceryTotals: (selectedRecipes: Recipe[]) => {
    totalItems: number;
    checkedItems: number;
    uncheckedItems: number;
    totalCost: number;
    checkedCost: number;
    uncheckedCost: number;
  };

  // Utility methods
  isItemChecked: (packageId: string) => boolean;
  getItemTags: (packageId: string) => IngredientTags | undefined;
  getCheckedItemsArray: () => string[];

  // Event callbacks (for triggering saves in other stores)
  onStateChange?: () => void;
}

export const useGroceryStore = create<GroceryState>((set, get) => ({
  // Initial state
  groceryCheckedItems: new Set<string>(),
  ingredientTags: {},
  onStateChange: undefined,

  // Grocery item management actions
  toggleGroceryItem: (packageId) => {
    set((state) => {
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

      return {
        groceryCheckedItems: newCheckedItems,
        ingredientTags: newTags
      };
    });

    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      state.onStateChange?.();
    }, 0);
  },

  setGroceryCheckedItems: (items) => {
    set({ groceryCheckedItems: new Set(items) });
    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      state.onStateChange?.();
    }, 0);
  },

  clearGroceryCheckedItems: () => {
    set({ groceryCheckedItems: new Set() });
    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      state.onStateChange?.();
    }, 0);
  },

  // Ingredient tag management actions
  setIngredientTag: (packageId, tag, value) => {
    set((state) => {
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
    });

    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      state.onStateChange?.();
    }, 0);
  },

  setIngredientTags: (packageId, tags) => {
    set((state) => {
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
    });

    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      state.onStateChange?.();
    }, 0);
  },

  setAllIngredientTags: (tags) => {
    set({ ingredientTags: { ...tags } });
    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      state.onStateChange?.();
    }, 0);
  },

  clearIngredientTags: () => {
    set({ ingredientTags: {} });
    // Trigger state change callback for auto-save
    setTimeout(() => {
      const state = get();
      state.onStateChange?.();
    }, 0);
  },

  // Computed values - take selectedRecipes as input to avoid dependencies
  aggregatedIngredients: (selectedRecipes) => {
    const state = get();
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
            packPrice: ing.salePrice || 0,
            productName: ing.productName || ing.recipeIngredientName,
            source: ing.source || 'database',
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

  totals: (selectedRecipes) => {
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

  groceryTotals: (selectedRecipes) => {
    const state = get();
    const aggregatedItems = state.aggregatedIngredients(selectedRecipes);

    let totalItems = 0;
    let checkedItems = 0;
    let totalCost = 0;
    let checkedCost = 0;

    aggregatedItems.forEach(item => {
      totalItems++;
      totalCost += item.lineCost;

      if (item.isChecked) {
        checkedItems++;
        checkedCost += item.lineCost;
      }
    });

    return {
      totalItems,
      checkedItems,
      uncheckedItems: totalItems - checkedItems,
      totalCost,
      checkedCost,
      uncheckedCost: totalCost - checkedCost
    };
  },

  // Utility methods
  isItemChecked: (packageId) => {
    const state = get();
    return state.groceryCheckedItems.has(packageId);
  },

  getItemTags: (packageId) => {
    const state = get();
    return state.ingredientTags[packageId];
  },

  getCheckedItemsArray: () => {
    const state = get();
    return Array.from(state.groceryCheckedItems);
  },
}));