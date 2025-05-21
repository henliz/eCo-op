export type ISODateString = string;

export enum PriceSource {
  FLYER = 'flyer',
  DATABASE = 'database',
  MISSING = 'missing',
  SKIPPED = 'skipped',
  FREE = 'free'
}

export enum ItemStatus {
  BOUGHT = 'bought',
  OWNED = 'owned',
  IN_CART = 'in_cart', // <-- Added an in_cart status here
  IGNORED = 'ignored'
}

export enum IngredientType {
  CORE = 'core',
  OPTIONAL = 'optional',
  GARNISH = 'garnish',
  TO_TASTE = 'to taste'
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';