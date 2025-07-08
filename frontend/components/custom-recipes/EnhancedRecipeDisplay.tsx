// C:\Users\satta\eCo-op\frontend\components\custom-recipes\EnhancedRecipeDisplay.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PdfViewer from '@/components/PDFviewer';

// Dynamic import for ReactJson
const ReactJson = React.lazy(() => import('react-json-view'));

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  type?: string;
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
  pricingBreakdown?: any[];
}

interface SubmissionData {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed' | 'edited' | 'priced';
  recipe?: Recipe;
  originalRecipe?: Recipe;
  pricingData?: any;
  processingSteps?: string[];
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
}

interface EnhancedRecipeDisplayProps {
  submissionData: SubmissionData;
  selectedFile: File | null;
  currentSubmissionId: string | null;
  authToken: string;
  backendUrl: string;
  onSaveChanges: () => void;
  onPriceRecipe: () => void;
  onSubmitToFirestore: () => void;
  onReset: () => void;
  editedData: any;
  onEditData: (data: any) => void;
  isPricing?: boolean;
  isSavingToFirestore?: boolean;
  canPriceRecipe?: boolean;
  canSaveToFirestore?: boolean;
}

const EnhancedRecipeDisplay: React.FC<EnhancedRecipeDisplayProps> = ({
  submissionData,
  selectedFile,
  currentSubmissionId,
  authToken,
  backendUrl,
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
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'pdf-only' | 'data-only'>('side-by-side');

  const formatIngredientDisplay = (ingredient: RecipeIngredient): string => {
    const { name, quantity, unit } = ingredient;
    
    if (quantity === 0 || unit === 'to taste' || unit === 'as needed') {
      return `${name} - ${unit}`;
    }
    
    const quantityStr = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2).replace(/\.?0+$/, '');
    return `${name} - ${quantityStr} ${unit}`;
  };

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

  const coreIngredients = submissionData.recipe?.ingredients.filter(ing => ing.type === 'core' || !ing.type) || [];
  const optionalIngredients = submissionData.recipe?.ingredients.filter(ing => ing.type && ing.type !== 'core') || [];

  // Check if data has been edited
  const hasUnsavedChanges = editedData && JSON.stringify(editedData) !== JSON.stringify(submissionData.recipe);

  // JSON Viewer Component
  const JsonViewer = ({ data, onEdit }: { data: any; onEdit: (e: any) => void }) => {
    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-96">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ReactJson
          src={data || {}}
          onEdit={onEdit}
          onAdd={onEdit}
          onDelete={onEdit}
          theme="rjv-default"
          displayDataTypes={false}
          displayObjectSize={false}
          enableClipboard={false}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            fontSize: '12px',
            height: '100%'
          }}
        />
      </React.Suspense>
    );
  };

  // User-friendly recipe display
  const UserFriendlyRecipeDisplay = () => (
    <div className="space-y-6 p-6">
      {/* Recipe Header */}
      <div className="border-b pb-4">
        <h3 className="text-2xl font-bold mb-3 text-gray-800">
          {submissionData.recipe?.name || 'Untitled Recipe'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Portions: </span>
            <span className="text-gray-600">{submissionData.recipe?.portions || 'Unknown'}</span>
          </div>
          
          {submissionData.recipe?.currentPrice && (
            <div>
              <span className="font-semibold text-gray-700">Total Price: </span>
              <span className="text-green-600 font-bold text-lg">
                ${submissionData.recipe.currentPrice.toFixed(2)}
              </span>
            </div>
          )}

          {submissionData.recipe?.pricePerServing && (
            <div>
              <span className="font-semibold text-gray-700">Price per Serving: </span>
              <span className="text-green-600 font-bold">
                ${submissionData.recipe.pricePerServing.toFixed(2)}
              </span>
            </div>
          )}

          {submissionData.recipe?.lastPriced && (
            <div>
              <span className="font-semibold text-gray-700">Last Priced: </span>
              <span className="text-gray-600">
                {new Date(submissionData.recipe.lastPriced).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {submissionData.recipe?.url && (
            <div className="md:col-span-2">
              <span className="font-semibold text-gray-700">Recipe URL: </span>
              <a 
                href={submissionData.recipe.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline break-all"
              >
                {submissionData.recipe.url}
              </a>
            </div>
          )}
          
          {submissionData.recipe?.tags && submissionData.recipe.tags.length > 0 && (
            <div className="md:col-span-2">
              <span className="font-semibold text-gray-700">Tags: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {submissionData.recipe.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Core Ingredients */}
      {coreIngredients.length > 0 && (
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-800">Ingredients</h4>
          <ul className="space-y-3">
            {coreIngredients.map((ingredient, index) => (
              <li key={index} className="flex items-start bg-gray-50 p-3 rounded-lg">
                <span className="text-blue-600 font-bold mr-3 mt-1">•</span>
                <span className="flex-1 text-gray-700">{formatIngredientDisplay(ingredient)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Optional Ingredients */}
      {optionalIngredients.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3 text-gray-700">Optional Ingredients</h4>
          <ul className="space-y-2">
            {optionalIngredients.map((ingredient, index) => (
              <li key={index} className="flex items-start bg-yellow-50 p-2 rounded">
                <span className="text-yellow-600 font-bold mr-3 mt-1">○</span>
                <span className="flex-1 text-gray-600 text-sm">{formatIngredientDisplay(ingredient)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pricing Breakdown */}
      {submissionData.recipe?.pricingBreakdown && submissionData.recipe.pricingBreakdown.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3 text-gray-700">Pricing Breakdown</h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="space-y-2">
              {submissionData.recipe.pricingBreakdown.map((item, index) => (
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
              <div className="text-sm font-medium text-yellow-800 mb-2">⚠️ Processing Notes:</div>
              <ul className="text-xs text-yellow-700 space-y-1">
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
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="side-by-side">📄📋 Side by Side</TabsTrigger>
            <TabsTrigger value="pdf-only">📄 PDF Info</TabsTrigger>
            <TabsTrigger value="data-only" disabled={!submissionData.recipe}>
              📋 Data Only
            </TabsTrigger>
          </TabsList>

          {/* Side by Side View */}
          <TabsContent value="side-by-side" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[700px]">
              {/* PDF Viewer */}
              <PdfViewer
                file={selectedFile}
                submissionId={currentSubmissionId}
                authToken={authToken}
                backendUrl={backendUrl}
                filename={submissionData.filename}
                title="Original PDF"
                height="100%"
                showCard={false}
                className="border rounded bg-white"
              />

              {/* User-Friendly Recipe Display */}
              <div className="border rounded overflow-hidden bg-white">
                <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                  <span className="font-medium">Extracted Recipe</span>
                  <div className="flex gap-2">
                    <Button 
                      onClick={onReset} 
                      variant="outline" 
                      size="sm" 
                      disabled={!submissionData.recipe}
                    >
                      Reset
                    </Button>
                    <Button 
                      onClick={onSaveChanges} 
                      variant="outline" 
                      size="sm"
                      disabled={!hasUnsavedChanges}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                
                <div className="h-[650px] overflow-auto">
                  {submissionData.recipe ? (
                    <UserFriendlyRecipeDisplay />
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* PDF Only View */}
          <TabsContent value="pdf-only" className="mt-4">
            <div className="h-[700px]">
              <PdfViewer
                file={selectedFile}
                submissionId={currentSubmissionId}
                authToken={authToken}
                backendUrl={backendUrl}
                filename={submissionData.filename}
                title="Original PDF"
                height="100%"
                showCard={false}
                className="border rounded bg-white h-full"
              />
            </div>
          </TabsContent>

          {/* Data Only View (JSON Editor) */}
          <TabsContent value="data-only" className="mt-4">
            <div className="border rounded overflow-hidden bg-white h-[700px]">
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Recipe JSON Data (Editable)</span>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                      ✏️ Unsaved
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {submissionData.warnings && submissionData.warnings.length > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      ⚠️ {submissionData.warnings.length} Warning(s)
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
              
              {/* Warnings */}
              {submissionData.warnings && submissionData.warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border-b border-yellow-200">
                  <div className="text-sm font-medium text-yellow-800 mb-1">⚠️ Processing Warnings:</div>
                  {submissionData.warnings.map((warning, index) => (
                    <div key={index} className="text-xs text-yellow-700">• {warning}</div>
                  ))}
                </div>
              )}
              
              <div className="h-[600px] overflow-auto">
                {submissionData.recipe ? (
                  <JsonViewer
                    data={editedData}
                    onEdit={(e) => onEditData(e.updated_src)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">📋</div>
                      <p>No recipe data available</p>
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