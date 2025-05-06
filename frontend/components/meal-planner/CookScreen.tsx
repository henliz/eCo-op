import React, { useState, useMemo } from 'react';
import { usePlannerStore, type Recipe } from './usePlannerStore';

const placeholderImage = '/Robo_Research.png'; // replace with your image path

export function CookScreen() {
  const [choice, setChoice] = useState<string>('');
  const { selectedMeals, meals } = usePlannerStore();

  // Derive selected recipe names
  const options = useMemo<string[]>(() => {
    const all: Recipe[] = [
      ...meals.breakfast,
      ...meals.lunch,
      ...meals.dinner,
    ];
    return all
      .filter((r) => selectedMeals.has(r.url))
      .map((r) => r.name);
  }, [selectedMeals, meals]);

  return (
    <div className="flex flex-col items-center mt-8 space-y-6">
      {/* Avatar + persistent speech bubble */}
      <div className="flex items-start space-x-4">
        {/* Chef image */}
        <img
          src={placeholderImage}
          alt="Chef"
          className="w-45 h-45 object-cover rounded-full"
        />

        {/* Speech bubble with selector always visible */}
        <div className="relative bg-blue-100 border border-blue-200 p-4 rounded-xl max-w-xs">
          {/* Tail pointing to image */}
          <div
            className="absolute -left-3 top-8 w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-r-6 border-r-blue-100"
          />

          <label
            htmlFor="recipe"
            className="block text-gray-700 font-medium mb-2"
          >
            {choice ? `Cooking: ${choice}` : 'What are we cooking today?'}
          </label>
          <input
            id="recipe"
            list="recipes"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            placeholder={
              options.length > 0 ? 'Search or select a meal...' : 'No recipes selected'
            }
            className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
          />
          <datalist id="recipes">
            {options.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
      </div>

      {choice ? (
        // Show iframe when a choice is made
        <div className="w-full max-w-3xl h-[60vh] border rounded overflow-hidden">
          <iframe
            src={choice} /* replace with actual link/pdf */
            title={choice}
            className="w-full h-full"
          />
        </div>
      ) : (
        // Prompt when no choice
        <p className="text-gray-600 text-center">
          Select a recipe to begin cooking.
        </p>
      )}
    </div>
  );
}
