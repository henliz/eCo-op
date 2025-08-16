// types/dashboard.ts
export interface MealData {
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
}

export interface Recipe {
  name: string;
  url?: string;
  img?: string;
  servings: number;
  ingredients?: Ingredient[];
  isSelected: boolean;
  mealType: string;
  flyerItemsCount: number;
}

export interface Ingredient {
  recipeIngredientName: string;
}

export interface MealSummary {
  total: number;
}

export interface Totals {
  totalSavings: number;
  saleTotal: number;
}