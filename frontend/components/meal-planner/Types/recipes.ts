import { Ingredient } from './ingredients';

export interface BaseRecipe {
  name: string;
  url: string;
  servings: number;
  img?: string;
}

// Recipe with pricing info
export interface Recipe extends BaseRecipe {
  price: number;
  salePrice: number;
  regularPrice: number;
  totalSavings: number;
  flyerItemsCount: number;
  ingredients: Ingredient[];
  multiplier?: number;
}

// Meal categories
export interface MealCategory {
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
}

// Price totals
export interface PriceTotals {
  regularTotal: number;
  saleTotal: number;
  totalSavings: number;
}

// Meal summary counts
export interface MealSummary {
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}