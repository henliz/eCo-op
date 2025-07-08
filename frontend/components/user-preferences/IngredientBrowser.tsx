'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Plus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useUserPreferencesStore } from '@/stores/useUserPreferencesStore';
import { useAuth } from '@/contexts/AuthContext';
import CategoryIcons from '@/components/icons/CategoryIcons';

interface Ingredient {
  id: string;
  name: string;
  aliases: string[];
  category?: string;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  allergens?: string[];
  alternatives?: string[];
}

interface IngredientBrowserProps {
  onClose?: () => void;
  className?: string;
}

export const IngredientBrowser: React.FC<IngredientBrowserProps> = ({ onClose, className = '' }) => {
  const { makeAPICall } = useAuth();
  const preferences = useUserPreferencesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());

  // Load ingredients on mount and when search changes
  const loadIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('q', searchTerm.trim());
      }
      params.append('limit', '50');

      const endpoint = searchTerm.trim()
        ? '/user-preferences/ingredients/search'
        : '/user-preferences/ingredients/available';

      const response = await makeAPICall(`${endpoint}?${params}`);
      setIngredients(response || []);
    } catch (err) {
      console.error('Error loading ingredients:', err);
      setError('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, makeAPICall]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  // Filter ingredients by category
  const filteredIngredients = useMemo(() => {
    if (selectedCategory === 'all') {
      return ingredients;
    }
    return ingredients.filter(ingredient =>
      ingredient.category === selectedCategory
    );
  }, [ingredients, selectedCategory]);

  // Get unique categories from ingredients
  const categories = useMemo(() => {
    const cats = new Set(
      ingredients
        .map(ing => ing.category)
        .filter((cat): cat is string => Boolean(cat))
    );
    return Array.from(cats).sort();
  }, [ingredients]);

  const handleIngredientToggle = (ingredientName: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(ingredientName)) {
      newSelected.delete(ingredientName);
    } else {
      newSelected.add(ingredientName);
    }
    setSelectedIngredients(newSelected);
  };

  const handleBanSelected = async () => {
    if (selectedIngredients.size === 0) return;

    try {
      // Add each selected ingredient to banned list
      selectedIngredients.forEach(ingredientName => {
        preferences.addBannedIngredient(ingredientName);
      });

      setSelectedIngredients(new Set());

      // Show success feedback
      alert(`Successfully banned ${selectedIngredients.size} ingredient(s)`);
    } catch (error) {
      console.error('Error banning ingredients:', error);
      alert('Failed to ban ingredients. Please try again.');
    }
  };

  const handleUnbanIngredient = async (ingredientName: string) => {
    try {
      // Find the banned ingredient by name and remove by ID
      const bannedItems = preferences.getBannedIngredientsAsItems();
      const bannedItem = bannedItems.find(
        item => item.name.toLowerCase() === ingredientName.toLowerCase()
      );
      if (bannedItem) {
        preferences.removeBannedIngredient(bannedItem.id);
      }
    } catch (error) {
      console.error('Error unbanning ingredient:', error);
      alert('Failed to unban ingredient. Please try again.');
    }
  };

  const isIngredientBanned = (ingredientName: string) => {
    return preferences.isIngredientBanned(ingredientName);
  };

  const getCategoryIcon = (category: string) => {
    // Create a mapping of category strings to icon components
    const iconComponents: Record<string, React.ComponentType> = {
      'dairy': CategoryIcons.dairy,
      'meat': CategoryIcons.meat,
      'produce': CategoryIcons.produce,
      'vegetables': CategoryIcons.vegetables,
      'fruits': CategoryIcons.fruits,
      'grains': CategoryIcons.pantry,
      'seafood': CategoryIcons.seafood,
      'condiments': CategoryIcons.condiments,
      'spices': CategoryIcons.spices,
      'nuts': CategoryIcons.pantry,
      'beverages': CategoryIcons.beverages,
      'frozen': CategoryIcons.frozen,
      'bakery': CategoryIcons.bakery,
      'deli': CategoryIcons.deli,
      'breakfast': CategoryIcons.breakfast,
    };

    const IconComponent = iconComponents[category] || CategoryIcons.other;
    return <IconComponent />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Ingredient Browser</h2>
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
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(category)}
              <span className="capitalize">{category}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        {selectedIngredients.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedIngredients.size} ingredient(s) selected
            </span>
            <button
              onClick={handleBanSelected}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Ban Selected
            </button>
            <button
              onClick={() => setSelectedIngredients(new Set())}
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
            <span className="ml-2 text-gray-600">Loading ingredients...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIngredients.map(ingredient => {
              const isBanned = isIngredientBanned(ingredient.name);
              const isSelected = selectedIngredients.has(ingredient.name);

              return (
                <div
                  key={ingredient.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isBanned
                      ? 'bg-red-50 border-red-200'
                      : isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !isBanned && handleIngredientToggle(ingredient.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {ingredient.category && getCategoryIcon(ingredient.category)}
                      <div>
                        <h3 className="font-medium text-gray-900">{ingredient.name}</h3>
                        {ingredient.aliases && ingredient.aliases.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Also known as: {ingredient.aliases.slice(0, 2).join(', ')}
                            {ingredient.aliases.length > 2 && '...'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isBanned ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnbanIngredient(ingredient.name);
                          }}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="Unban this ingredient"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : isSelected ? (
                        <Check className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {ingredient.allergens && ingredient.allergens.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ingredient.allergens.map(allergen => (
                        <span
                          key={allergen}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredIngredients.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No ingredients found matching your search' : 'No ingredients available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
