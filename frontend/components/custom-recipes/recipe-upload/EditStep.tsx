// components/RecipeUpload/EditStep.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserRecipeDto } from '@/types';
import { useRecipeEditor } from '@/hooks/recipe-upload/useRecipeEditor';

interface EditStepProps {
  editedRecipe: UserRecipeDto;
  setEditedRecipe: (recipe: UserRecipeDto) => void;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export const EditStep: React.FC<EditStepProps> = ({
  editedRecipe,
  setEditedRecipe,
  isSaving,
  onReset,
  onSave
}) => {
  const {
    updateEditedRecipe,
    updateIngredient,
    addIngredient,
    removeIngredient,
    updateInstruction,
    addInstruction,
    removeInstruction
  } = useRecipeEditor(editedRecipe, setEditedRecipe);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit Recipe Data</span>
          <div className="flex gap-2">
            <Button onClick={onReset} variant="outline">
              🔄 Start Over
            </Button>
            <Button 
              onClick={onSave} 
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                '💾 Save Recipe'
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Recipe Name</Label>
              <Input
                id="name"
                value={editedRecipe.name}
                onChange={(e) => updateEditedRecipe({ name: e.target.value })}
                placeholder="Enter recipe name"
              />
            </div>
            <div>
              <Label htmlFor="portions">Portions</Label>
              <Input
                id="portions"
                type="number"
                value={editedRecipe.portions}
                onChange={(e) => updateEditedRecipe({ portions: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={editedRecipe.description || ''}
              onChange={(e) => updateEditedRecipe({ description: e.target.value })}
              placeholder="Brief description of the recipe"
              rows={2}
            />
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Ingredients</Label>
              <Button onClick={addIngredient} size="sm" variant="outline">
                ➕ Add Ingredient
              </Button>
            </div>
            
            <div className="space-y-2">
              {editedRecipe.ingredients?.map((ingredient, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                  <div className="col-span-6">
                    <Input
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      placeholder="Ingredient name"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="text-sm"
                      step="0.1"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      placeholder="Unit"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      onClick={() => removeIngredient(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 w-full p-1"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Instructions</Label>
              <Button onClick={addInstruction} size="sm" variant="outline">
                ➕ Add Step
              </Button>
            </div>
            
            <div className="space-y-2">
              {editedRecipe.instructions?.map((instruction, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium mt-1">
                    {index + 1}
                  </div>
                  <Textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder={`Step ${index + 1} instructions...`}
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    onClick={() => removeInstruction(index)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 mt-1"
                  >
                    🗑️
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={editedRecipe.tags?.join(', ') || ''}
              onChange={(e) => updateEditedRecipe({ 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              })}
              placeholder="vegetarian, quick, easy, etc."
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <select
                id="visibility"
                value={editedRecipe.visibility}
                onChange={(e) => updateEditedRecipe({ visibility: e.target.value as 'private' | 'public' })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={editedRecipe.status}
                onChange={(e) => updateEditedRecipe({ status: e.target.value as 'draft' | 'validated' | 'needs_investigation' })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="validated">Validated</option>
                <option value="needs_investigation">Needs Investigation</option>
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};