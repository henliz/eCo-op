import { IngredientType, ItemStatus, PriceSource } from './common';

export interface IngredientTags {
  importance?: 'core' | 'optional';
  status?: ItemStatus;      //'bought' | 'owned' | 'in_cart' | 'ignored'; Added 'in_cart' status <-- Isnt this just Item Status?
  storeSection?: string;
}

export interface PriceInfo {
    price: number;
    fractionUsed?: number;
    unitSize?: number;
    unitType?: string;
}

export interface BaseIngredient {
  recipeIngredientName: string;
  type?: IngredientType;
  source: PriceSource;
  sourceDate?: string;
  productName?: string;
  packageId?: string;
  category?: string;
  tags?: IngredientTags;
}

export interface Ingredient extends BaseIngredient {
  salePrice: number;
  saleFractionUsed?: number;
  saleUnitSize?: number;
  saleUnitType?: string;
  regularPrice: number;
  regularFractionUsed?: number;
  savingsPercentage?: number;
}

export interface AggregatedItem {
  packageId: string;
  neededFraction: number;
  unitSize: number;
  unitType: string;
  packPrice: number;
  productName: string;
  source: PriceSource;  //'flyer' | 'database' | 'skipped' | 'free';  <-- replaced this with PriceSource
  lineCost: number;
  packsToBuy: number;
  isChecked: boolean;
  savingsPercentage?: number;
  tags?: IngredientTags;
  category?: string; // Add category property
}
