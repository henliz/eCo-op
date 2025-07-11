// C:\Users\satta\eCo-op\frontend\components\custom-recipes\PricingResultModal.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  pricePerUnit?: number;
  source?: string;
}

interface PricingBreakdownItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  pricePerUnit?: number;
  source?: string;
}

interface Recipe {
  name: string;
  portions: number;
  ingredients: Ingredient[];
}

interface PricingResult {
  success: boolean;
  message: string;
  pricing?: {
    totalPrice: number;
    pricePerServing: number;
    formattedPrice: string;
    formattedPricePerServing: string;
    breakdown: PricingBreakdownItem[];
    store: string;
    location: string;
    date: string;
    pricedAt: Date;
  };
  recipe?: Recipe;
  missingIngredients?: Ingredient[];
  canRetry?: boolean;
}

interface PricingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricingResult: PricingResult;
  onSubmitToFirestore: () => void;
  isSavingToFirestore: boolean;
  canSaveToFirestore: boolean;
}

const PricingResultModal: React.FC<PricingResultModalProps> = ({
  isOpen,
  onClose,
  pricingResult,
  onSubmitToFirestore,
  isSavingToFirestore,
  canSaveToFirestore
}) => {
  // FIXED: Add proper null/undefined checks
  const formatIngredientDisplay = (ingredient: Ingredient): string => {
    if (!ingredient) return 'Unknown ingredient';

    const { name, quantity, unit } = ingredient;

    // Add safety checks for undefined/null values
    if (!name) return 'Unknown ingredient';
    if (quantity === undefined || quantity === null || quantity === 0 || unit === 'to taste' || unit === 'as needed') {
      return `${name} - ${unit || 'unknown unit'}`;
    }

    // Ensure quantity is a number before processing
    let safeQuantity: number;
    if (typeof quantity === 'number') {
      safeQuantity = quantity;
    } else {
      // Handle any non-number type by converting to 0
      safeQuantity = 0;
    }

    const quantityStr = safeQuantity % 1 === 0 ? safeQuantity.toString() : safeQuantity.toFixed(2).replace(/\.?0+$/, '');
    return `${name} - ${quantityStr} ${unit || 'unit'}`;
  };

  const formatDate = (date: string | Date): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // FIXED: Add safety check for price values
  const formatPrice = (price: number | string | undefined | null): string => {
    if (price === undefined || price === null || isNaN(Number(price))) {
      return '$0.00';
    }
    const safePrice = typeof price === 'number' ? price : parseFloat(price.toString()) || 0;
    return `$${safePrice.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {pricingResult.success ? (
              <>
                <span className="text-2xl">💰</span>
                Pricing Results
              </>
            ) : (
              <>
                <span className="text-2xl">❌</span>
                Pricing Failed
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {pricingResult.success
              ? 'Your recipe has been successfully priced!'
              : 'There was an issue pricing your recipe.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Results */}
          {pricingResult.success && pricingResult.pricing && (
            <>
              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💵 Price Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border">
                      <div className="text-2xl font-bold text-green-700">
                        {pricingResult.pricing.formattedPrice || formatPrice(pricingResult.pricing.totalPrice)}
                      </div>
                      <div className="text-sm text-green-600">Total Recipe Cost</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border">
                      <div className="text-2xl font-bold text-blue-700">
                        {pricingResult.pricing.formattedPricePerServing || formatPrice(pricingResult.pricing.pricePerServing)}
                      </div>
                      <div className="text-sm text-blue-600">Cost per Serving</div>
                    </div>
                  </div>

                  {/* Pricing Metadata */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Store: </span>
                      <span className="text-gray-600">{pricingResult.pricing.store || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Location: </span>
                      <span className="text-gray-600">{pricingResult.pricing.location || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Priced: </span>
                      <span className="text-gray-600">
                        {pricingResult.pricing.pricedAt ? formatDate(pricingResult.pricing.pricedAt) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredient Breakdown */}
              {pricingResult.pricing.breakdown && pricingResult.pricing.breakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🧾 Ingredient Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pricingResult.pricing.breakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{item?.name || 'Unknown item'}</div>
                            <div className="text-sm text-gray-600">
                              {item?.quantity || 0} {item?.unit || 'unit'}
                              {item?.source && (
                                <span className="ml-2 text-xs text-gray-500">
                                  from {item.source}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-700">
                              {formatPrice(item?.price)}
                            </div>
                            {item?.pricePerUnit && (
                              <div className="text-xs text-gray-500">
                                {formatPrice(item.pricePerUnit)}/{item?.unit || 'unit'}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Error Results */}
          {!pricingResult.success && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription>
                <div className="font-medium text-red-800 mb-2">❌ Pricing Error</div>
                <div className="text-red-700">{pricingResult.message}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-Adding Ingredients (Changed from "Missing") */}
          {pricingResult.missingIngredients && pricingResult.missingIngredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>🔄</span>
                  Auto-Adding Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-3">
                  Our system is automatically adding these ingredients to improve pricing accuracy:
                </div>
                <div className="space-y-2">
                  {pricingResult.missingIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Auto-Adding
                      </Badge>
                      <span className="text-gray-700">
                        {formatIngredientDisplay(ingredient)}
                      </span>
                    </div>
                  ))}
                </div>
                {pricingResult.canRetry && (
                  <div className="mt-3 text-sm text-gray-600">
                    💡 You can edit the ingredient names and try pricing again for better matches.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recipe Information */}
          {pricingResult.recipe && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📝 Recipe Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Name: </span>
                    <span className="text-gray-600">{pricingResult.recipe.name || 'Untitled'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Portions: </span>
                    <span className="text-gray-600">{pricingResult.recipe.portions || 'Unknown'}</span>
                  </div>
                  {pricingResult.recipe.ingredients && (
                    <div className="md:col-span-2">
                      <span className="font-semibold text-gray-700">Ingredients: </span>
                      <span className="text-gray-600">{pricingResult.recipe.ingredients.length} items</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {pricingResult.success && (
            <Button
              onClick={onSubmitToFirestore}
              disabled={!canSaveToFirestore || isSavingToFirestore}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSavingToFirestore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving to Firestore...
                </>
              ) : (
                <>
                  <span className="mr-2">🔥</span>
                  Save to Firestore
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PricingResultModal;

