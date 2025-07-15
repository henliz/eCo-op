// C:\Users\satta\eCo-op\frontend\components\custom-recipes\EnhancedRecipeDisplay.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PdfViewer from '@/components/PDFviewer';

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  type?: string;
}

interface PricingBreakdownItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  source?: string;
}

interface Recipe {
  name: string;
  portions: number;
  url?: string;
  img?: string;
  ingredients: RecipeIngredient[];
  tags?: string[];
  currentPrice?: number;
  pricePerServing?: number;
  lastPriced?: Date;
  pricingBreakdown?: PricingBreakdownItem[];
}

interface PricingData {
  totalPrice: number;
  pricePerServing: number;
  breakdown: PricingBreakdownItem[];
  store: string;
  location: string;
  date: string;
}

interface SubmissionData {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed' | 'edited' | 'priced';
  recipe?: Recipe;
  originalRecipe?: Recipe;
  pricingData?: PricingData;
  processingSteps?: string[];
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
}

interface EnhancedRecipeDisplayProps {
  submissionData: SubmissionData;
  selectedFile: File | null;
  // currentSubmissionId: string | null; // Commented out unused prop
  // authToken: string; // Commented out unused prop
  // backendUrl: string; // Commented out unused prop
  onSaveChanges: () => void;
  onPriceRecipe: () => void;
  onSubmitToFirestore: () => void;
  onReset: () => void;
  editedData: Recipe | null;
  onEditData: (data: Recipe) => void;
  isPricing?: boolean;
  isSavingToFirestore?: boolean;
  canPriceRecipe?: boolean;
  canSaveToFirestore?: boolean;
}

const EnhancedRecipeDisplay: React.FC<EnhancedRecipeDisplayProps> = ({
  submissionData,
  selectedFile,
  // currentSubmissionId, // Commented out unused props
  // authToken,
  // backendUrl,
  onSaveChanges,
  onPriceRecipe,
  onSubmitToFirestore,
  onReset,
  editedData,
  onEditData,
  isPricing = false,
  isSavingToFirestore = false,
  canPriceRecipe = false,
  canSaveToFirestore = false
}) => {
  const [activeTab, setActiveTab] = useState<'pdf-only' | 'data-only'>('pdf-only');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">🔄 Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>;
      case 'edited':
        return <Badge className="bg-blue-100 text-blue-800">✏️ Edited</Badge>;
      case 'priced':
        return <Badge className="bg-purple-100 text-purple-800">💰 Priced</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">❌ Failed</Badge>;
      default:
        return <Badge>❓ Unknown</Badge>;
    }
  };

  // Check if data has been edited
  const hasUnsavedChanges = editedData && JSON.stringify(editedData) !== JSON.stringify(submissionData.recipe);

  // Update ingredient in edited data
  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    if (!editedData?.ingredients) return;

    const newIngredients = [...editedData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };

    onEditData({
      ...editedData,
      ingredients: newIngredients
    });
  };

  // Add new ingredient
  const addIngredient = () => {
    if (!editedData) return;

    const newIngredient: RecipeIngredient = {
      name: '',
      quantity: 0,
      unit: '',
      type: 'core'
    };

    onEditData({
      ...editedData,
      ingredients: [...(editedData.ingredients || []), newIngredient]
    });
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    if (!editedData?.ingredients) return;

    const newIngredients = editedData.ingredients.filter((_, i) => i !== index);
    onEditData({
      ...editedData,
      ingredients: newIngredients
    });
  };

  // Update recipe basic info
  const updateRecipeInfo = (field: keyof Recipe, value: string | number | string[]) => {
    if (!editedData) return;

    onEditData({
      ...editedData,
      [field]: value
    });
  };

  // Editable Recipe Display
  const EditableRecipeDisplay = () => (
    <div className="space-y-6 p-6">
      {/* Recipe Header - Editable */}
      <div className="border-b pb-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipe-name" className="text-sm font-medium text-gray-700">Recipe Name</Label>
            <Input
              id="recipe-name"
              value={editedData?.name || ''}
              onChange={(e) => updateRecipeInfo('name', e.target.value)}
              placeholder="Enter recipe name"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="portions" className="text-sm font-medium text-gray-700">Portions</Label>
              <Input
                id="portions"
                type="number"
                value={editedData?.portions || ''}
                onChange={(e) => updateRecipeInfo('portions', parseInt(e.target.value) || 0)}
                placeholder="Number of portions"
                className="mt-1"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="recipe-url" className="text-sm font-medium text-gray-700">Recipe URL (Optional)</Label>
              <Input
                id="recipe-url"
                value={editedData?.url || ''}
                onChange={(e) => updateRecipeInfo('url', e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Pricing Info (Read-only) */}
          {editedData?.currentPrice && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
              <div>
                <span className="font-semibold text-gray-700">Total Price: </span>
                <span className="text-green-600 font-bold text-lg">
                  ${editedData.currentPrice.toFixed(2)}
                </span>
              </div>
              {editedData.pricePerServing && (
                <div>
                  <span className="font-semibold text-gray-700">Price per Serving: </span>
                  <span className="text-green-600 font-bold">
                    ${editedData.pricePerServing.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ingredients - Editable */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-semibold text-gray-800">Ingredients</h4>
          <Button onClick={addIngredient} size="sm" variant="outline">
            ➕ Add Ingredient
          </Button>
        </div>

        <div className="space-y-3">
          {editedData?.ingredients?.map((ingredient: RecipeIngredient, index: number) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
              {/* Ingredient Name */}
              <div className="col-span-5">
                <Label className="text-xs text-gray-600">Ingredient</Label>
                <Input
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  placeholder="Ingredient name"
                  className="mt-1"
                />
              </div>

              {/* Quantity */}
              <div className="col-span-2">
                <Label className="text-xs text-gray-600">Quantity</Label>
                <Input
                  type="number"
                  value={ingredient.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="mt-1"
                  step="0.1"
                  min="0"
                />
              </div>

              {/* Unit */}
              <div className="col-span-3">
                <Label className="text-xs text-gray-600">Unit</Label>
                <Input
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  placeholder="cups, tbsp, etc."
                  className="mt-1"
                />
              </div>

              {/* Remove Button */}
              <div className="col-span-2">
                <Button
                  onClick={() => removeIngredient(index)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}

          {(!editedData?.ingredients || editedData.ingredients.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🥘</div>
              <p>No ingredients yet</p>
              <p className="text-sm">Click &ldquo;Add Ingredient&rdquo; to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Tags - Editable */}
      <div>
        <Label htmlFor="tags" className="text-sm font-medium text-gray-700">Tags (comma-separated)</Label>
        <Textarea
          id="tags"
          value={editedData?.tags?.join(', ') || ''}
          onChange={(e) => updateRecipeInfo('tags', e.target.value.split(',').map((tag: string) => tag.trim()).filter(Boolean))}
          placeholder="vegetarian, quick, easy, etc."
          className="mt-1"
          rows={2}
        />
      </div>

      {/* Pricing Breakdown (Read-only) */}
      {editedData?.pricingBreakdown && editedData.pricingBreakdown.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3 text-gray-700">Pricing Breakdown</h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="space-y-2">
              {editedData.pricingBreakdown.map((item: PricingBreakdownItem, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600 ml-2">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700">
                      ${item.price?.toFixed(2) || '0.00'}
                    </div>
                    {item.source && (
                      <div className="text-xs text-gray-500">
                        {item.source}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing Info */}
      {submissionData.warnings && submissionData.warnings.length > 0 && (
        <div className="border-t pt-4">
          <Alert>
            <AlertDescription>
              <div className="text-sm font-medium text-blue-800 mb-2">ℹ️ Processing Notes:</div>
              <ul className="text-xs text-blue-700 space-y-1">
                {submissionData.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'pdf-only' | 'data-only');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📄 Review: {submissionData.filename}</span>
            {getStatusBadge(submissionData.status)}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                ✏️ Unsaved changes
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {/* Price Recipe Button */}
            <Button
              onClick={onPriceRecipe}
              disabled={!canPriceRecipe || isPricing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isPricing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Pricing...
                </>
              ) : (
                '💰 Price Recipe'
              )}
            </Button>

            {/* Submit to Firestore Button */}
            <Button
              onClick={onSubmitToFirestore}
              disabled={!canSaveToFirestore || isSavingToFirestore}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSavingToFirestore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                '🔥 Save to Firestore'
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf-only">📄 Original PDF</TabsTrigger>
            <TabsTrigger value="data-only" disabled={!submissionData.recipe}>
              📋 Edit Recipe Data
            </TabsTrigger>
          </TabsList>

          {/* PDF Only View */}
          <TabsContent value="pdf-only" className="mt-4">
            <div className="h-[700px]">
              <PdfViewer
                file={selectedFile}
                filename={submissionData.filename}
                title="Original PDF"
                height="100%"
                showCard={false}
                className="border rounded bg-white h-full"
              />
            </div>
          </TabsContent>

          {/* Data Only View (User-Friendly Editor) */}
          <TabsContent value="data-only" className="mt-4">
            <div className="border rounded overflow-hidden bg-white h-[700px]">
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Recipe Data (Editable)</span>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                      ✏️ Unsaved
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {submissionData.warnings && submissionData.warnings.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-800">
                      ℹ️ {submissionData.warnings.length} Note(s)
                    </Badge>
                  )}
                  <Button
                    onClick={onReset}
                    variant="outline"
                    size="sm"
                    disabled={!submissionData.recipe}
                  >
                    Reset to Original
                  </Button>
                  <Button
                    onClick={onSaveChanges}
                    variant="outline"
                    size="sm"
                    disabled={!hasUnsavedChanges}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>

              <div className="h-[600px] overflow-auto">
                {submissionData.recipe ? (
                  <EditableRecipeDisplay />
                ) : submissionData.status === 'processing' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm text-gray-600">AI is extracting recipe data...</p>
                      {submissionData.processingSteps && (
                        <div className="mt-4 text-xs text-gray-500 max-w-xs">
                          {submissionData.processingSteps.slice(-3).map((step, index) => (
                            <div key={index} className="mb-1">{step}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-sm">No recipe data available</p>
                      <p className="text-xs text-gray-400 mt-1">The AI couldn&apos;t extract recipe data from this PDF</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedRecipeDisplay;
