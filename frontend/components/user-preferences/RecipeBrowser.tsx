'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Plus, Check, Users, AlertCircle, Loader2, ChefHat } from 'lucide-react';
import { useUserPreferencesStore } from '@/stores/useUserPreferencesStore';
import { useAuth } from '@/contexts/AuthContext';

// Use your actual backend Recipe interface
interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  type?: string; // core, optional, garnish, to taste
}

interface Recipe {
  id?: string;
  name: string;
  portions: number;
  ingredients: RecipeIngredient[];
  url?: string;
  img?: string;
  tags?: string[];
  ownerId: string;
  visibility: 'private' | 'public';
  status: 'draft' | 'validated' | 'needs_investigation' | 'rejected' | 'test_data';
  createdAt: Date;
  updatedAt: Date;
}

interface RecipeBrowserProps {
  onClose?: () => void;
  className?: string;
}

export const RecipeBrowser: React.FC<RecipeBrowserProps> = ({ onClose, className = '' }) => {
  const { makeAPICall } = useAuth();
  const preferences = useUserPreferencesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());

  // Load recipes on mount and when search changes
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('q', searchTerm.trim());
      }
      params.append('limit', '50');

      const endpoint = searchTerm.trim()
        ? '/user-preferences/recipes/search'
        : '/user-preferences/recipes/available';

      const response = await makeAPICall(`${endpoint}?${params}`);
      setRecipes(response || []);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, makeAPICall]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Get unique tags from recipes
  const tags = useMemo(() => {
    const allTags = new Set<string>();
    recipes.forEach(recipe => {
      recipe.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [recipes]);

  // Filter recipes by tag
  const filteredRecipes = useMemo(() => {
    if (selectedTag === 'all') {
      return recipes;
    }
    return recipes.filter(recipe =>
      recipe.tags?.includes(selectedTag)
    );
  }, [recipes, selectedTag]);

  const handleRecipeToggle = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);
  };

  // UPDATED: Now uses the new BannedRecipe object format
  const handleBanSelected = async () => {
    if (selectedRecipes.size === 0) return;

    try {
      // Convert selected recipe IDs to BannedRecipe objects
      selectedRecipes.forEach(recipeId => {
        if (recipeId) {
          const recipe = recipes.find(r => r.id === recipeId);
          if (recipe) {
            // UPDATED: Pass BannedRecipe object instead of just ID
            preferences.addBannedRecipe({
              id: recipe.id!,
              name: recipe.name
            });
          }
        }
      });

      setSelectedRecipes(new Set());

      // Show success feedback
      alert(`Successfully banned ${selectedRecipes.size} recipe(s)`);
    } catch (error) {
      console.error('Error banning recipes:', error);
      alert('Failed to ban recipes. Please try again.');
    }
  };

  const handleUnbanRecipe = async (recipeId: string) => {
    try {
      // Remove recipe by ID (this stays the same)
      preferences.removeBannedRecipe(recipeId);
    } catch (error) {
      console.error('Error unbanning recipe:', error);
      alert('Failed to unban recipe. Please try again.');
    }
  };

  const isRecipeBanned = (recipeId: string) => {
    return preferences.isRecipeBanned(recipeId);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recipe Browser</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedTag === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {tags.slice(0, 8).map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
          {tags.length > 8 && (
            <span className="text-sm text-gray-500 px-2 py-1">
              +{tags.length - 8} more
            </span>
          )}
        </div>

        {/* Actions */}
        {selectedRecipes.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedRecipes.size} recipe(s) selected
            </span>
            <button
              onClick={handleBanSelected}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Ban Selected
            </button>
            <button
              onClick={() => setSelectedRecipes(new Set())}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading recipes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => {
              const isBanned = isRecipeBanned(recipe.id || '');
              const isSelected = selectedRecipes.has(recipe.id || '');

              return (
                <div
                  key={recipe.id}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isBanned
                      ? 'bg-red-50 border-red-200'
                      : isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => !isBanned && handleRecipeToggle(recipe.id || '')}
                >
                  {/* Recipe Image */}
                  {recipe.img && (
                    <div className="aspect-video bg-gray-200 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={recipe.img}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {isBanned ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnbanRecipe(recipe.id || '');
                            }}
                            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            title="Unban this recipe"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : isSelected ? (
                          <div className="p-1 bg-blue-500 text-white rounded-full">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1 bg-gray-600 text-white rounded-full opacity-75">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Recipe Title */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {recipe.name}
                    </h3>

                    {/* Recipe Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{recipe.portions} portions</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recipe.status === 'validated' ? 'bg-green-100 text-green-800' :
                        recipe.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {recipe.status}
                      </span>
                    </div>

                    {/* Ingredients Preview */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        {recipe.ingredients.length} ingredients
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {ingredient.name}
                          </span>
                        ))}
                        {recipe.ingredients.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            +{recipe.ingredients.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {recipe.tags.length > 3 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            +{recipe.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Recipe URL */}
                    {recipe.url && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 truncate">
                          Source: {recipe.url}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredRecipes.length === 0 && (
          <div className="text-center py-8">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              {searchTerm ? 'No recipes found matching your search' : 'No recipes available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
