export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  type?: string; // Made more flexible to match component expectations
}

// Base Recipe interface (what EnhancedRecipeDisplay expects)
export interface Recipe {
  name: string;
  portions: number;
  ingredients: RecipeIngredient[];
  tags?: string[];
  parsingNotes?: string[];
}

// Extended Recipe with additional fields for backend storage
export interface ParsedRecipeDto extends Recipe {
  ownerId: string;
  visibility: 'private' | 'public';
  status: 'draft' | 'validated' | 'needs_investigation' | 'rejected' | 'test_data';
}

export interface SubmissionData {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed' | 'edited' | 'priced';
  recipe?: ParsedRecipeDto;
  originalRecipe?: ParsedRecipeDto;
  pricingData?: any;
  processingSteps?: string[];
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PricingResult {
  success: boolean;
  message: string;
  details?: {
    totalIngredients: number;
    successfullyPriced: number;
    failed: number;
    fixed: number;
    regularPrice?: number;
    salePrice?: number;
  };
  pricing?: {
    totalPrice: number;
    pricePerServing: number;
    formattedPrice: string;
    formattedPricePerServing: string;
    breakdown: any[];
    store: string;
    location: string;
    date: string;
    pricedAt: Date;
  };
  recipe?: any;
  missingIngredients?: any[];
  canRetry?: boolean;
}