// hooks/useRecipeEditor.ts
import { useCallback } from 'react';
import { UserRecipeDto, RecipeIngredient } from '@/types';
import { debugLog } from '@/utils/recipe-upload/fileUtils';

export const useRecipeEditor = (
  editedRecipe: UserRecipeDto | null,
  setEditedRecipe: (recipe: UserRecipeDto) => void
) => {
  const updateEditedRecipe = useCallback((updates: Partial<UserRecipeDto>) => {
    if (!editedRecipe) return;
    
    const updated = { ...editedRecipe, ...updates };
    debugLog('Updating edited recipe', updates);
    setEditedRecipe(updated);
  }, [editedRecipe, setEditedRecipe]);

  const updateIngredient = useCallback((index: number, field: keyof RecipeIngredient, value: string | number) => {
    if (!editedRecipe?.ingredients) return;

    const newIngredients = [...editedRecipe.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };

    updateEditedRecipe({ ingredients: newIngredients });
  }, [editedRecipe, updateEditedRecipe]);

  const addIngredient = useCallback(() => {
    if (!editedRecipe) return;

    const newIngredient: RecipeIngredient = {
      name: '',
      quantity: 0,
      unit: '',
      type: 'core'
    };

    updateEditedRecipe({
      ingredients: [...(editedRecipe.ingredients || []), newIngredient]
    });
  }, [editedRecipe, updateEditedRecipe]);

  const removeIngredient = useCallback((index: number) => {
    if (!editedRecipe?.ingredients) return;

    const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index);
    updateEditedRecipe({ ingredients: newIngredients });
  }, [editedRecipe, updateEditedRecipe]);

  const updateInstruction = useCallback((index: number, value: string) => {
    if (!editedRecipe?.instructions) return;

    const newInstructions = [...editedRecipe.instructions];
    newInstructions[index] = value;
    updateEditedRecipe({ instructions: newInstructions });
  }, [editedRecipe, updateEditedRecipe]);

  const addInstruction = useCallback(() => {
    if (!editedRecipe) return;

    updateEditedRecipe({
      instructions: [...(editedRecipe.instructions || []), '']
    });
  }, [editedRecipe, updateEditedRecipe]);

  const removeInstruction = useCallback((index: number) => {
    if (!editedRecipe?.instructions) return;

    const newInstructions = editedRecipe.instructions.filter((_, i) => i !== index);
    updateEditedRecipe({ instructions: newInstructions });
  }, [editedRecipe, updateEditedRecipe]);

  return {
    updateEditedRecipe,
    updateIngredient,
    addIngredient,
    removeIngredient,
    updateInstruction,
    addInstruction,
    removeInstruction
  };
};