import React, { useState, useMemo, useEffect } from 'react';
import { usePlannerStore, type Recipe } from './usePlannerStore';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const placeholderImage = '/Robo_Research.png';

export function CookScreen() {
  const [choice, setChoice] = useState<string>('');
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const { selectedMeals, meals } = usePlannerStore();

  // Gather selected recipes
  const selectedRecipes = useMemo<Recipe[]>(() => {
    const all: Recipe[] = [...meals.breakfast, ...meals.lunch, ...meals.dinner];
    return all.filter(r => selectedMeals.has(r.url));
  }, [selectedMeals, meals]);

  // Dropdown options (recipe names)
  const options = useMemo<string[]>(() => selectedRecipes.map(r => r.name), [selectedRecipes]);

  // Selected recipe object
  const chosenRecipe = useMemo<Recipe | undefined>(
    () => selectedRecipes.find(r => r.name === choice),
    [choice, selectedRecipes]
  );

  // Reset error/loading when choice changes
  useEffect(() => {
    setIframeError(false);
    setIframeLoaded(false);
  }, [choice]);

  // HEAD request to check embedding policy (optional but useful)
  useEffect(() => {
    if (!chosenRecipe) return;
    fetch(chosenRecipe.url, { method: 'HEAD' })
      .then(res => {
        const xfo = res.headers.get('x-frame-options') || '';
        const csp = res.headers.get('content-security-policy') || '';
        if (/deny|sameorigin/i.test(xfo) || /frame-ancestors\s+'none'/i.test(csp)) {
          setIframeError(true);
        }
      })
      .catch(() => setIframeError(true));
  }, [chosenRecipe]);

  // Proxy URL for iframe
  const iframeSrc = chosenRecipe
    ? `/api/proxy?url=${encodeURIComponent(chosenRecipe.url)}`
    : '';

  return (
    <div className="flex flex-col items-center mt-8 space-y-6">
      {/* Chef avatar and selector */}
      <div className="flex items-start space-x-4">
        <img src={placeholderImage} alt="Chef" className="w-45 h-45 object-cover rounded-full" />
        <div className="relative bg-blue-100 border border-blue-200 p-4 rounded-xl max-w-xs">
          {/* Bubble tail */}
          <div className="absolute -left-3 top-8 w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-r-6 border-r-blue-100" />
          <label htmlFor="recipe" className="block text-gray-700 font-medium mb-2">
            {choice ? `Cooking: ${choice}` : 'What are we cooking today?'}
          </label>
          <input
            id="recipe"
            list="recipes"
            value={choice}
            onChange={e => setChoice(e.target.value)}
            placeholder={options.length ? 'Search or select a meal...' : 'No recipes selected'}
            className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
          />
          <datalist id="recipes">
            {options.map(name => <option key={name} value={name} />)}
          </datalist>
        </div>
      </div>

      {/* Display iframe or fallback */}
      {choice && chosenRecipe ? (
        <div className="w-full max-w-3xl relative">
          {!iframeError && (
            <iframe
              src={iframeSrc}
              title={chosenRecipe.name}
              className="w-full h-[60vh] border rounded overflow-hidden"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeError(true)}
            />
          )}

          {/* Loader while waiting */}
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <p className="text-gray-500">Loading recipe preview…</p>
            </div>
          )}

          {/* Fallback panel */}
          {iframeError && (
            <div className="bg-amber-50 p-6 rounded-md flex flex-col gap-4">
              <div className="flex items-start gap-3 text-amber-700">
                <AlertCircle size={24} className="flex-shrink-0" />
                <span className="text-sm">
                  Oops! We couldn’t embed this recipe here. You can still use this recipe at the home cook's page below.
                </span>
              </div>
              <Button
                onClick={() => window.open(chosenRecipe.url, '_blank')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 flex items-center justify-center gap-2"
              >
                <ExternalLink size={20} />
                Visit Full Recipe
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600 text-center">Select a recipe to begin cooking.</p>
      )}
    </div>
  );
}
