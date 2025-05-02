import React, { useState, useMemo } from "react";
import mealPlanData from "../data/data.json"; // <- place the uploaded JSON next to this file and rename accordingly
import { Card, CardContent } from "@/components/ui/card";
import { Button }             from "@/components/ui/button";
import { Checkbox }           from "@/components/ui/checkbox";
import { motion } from "framer-motion";

/**
 * Aggregate a grocery list from a list of selected recipes.
 * For simplicity we sum identical ingredient names and ignore unit conversions.
 */
function buildGroceryList(selectedRecipes) {
  const map = new Map();

  selectedRecipes.forEach((recipe) => {
    recipe.ingredients.forEach((ing) => {
      const key = ing.recipeIngredientName.toLowerCase();
      const existing = map.get(key) || { ...ing, totalFraction: 0 };
      existing.totalFraction += ing.saleFractionUsed ?? 1;
      map.set(key, existing);
    });
  });

  // Convert map to sorted array
  return Array.from(map.values()).sort((a, b) => a.recipeIngredientName.localeCompare(b.recipeIngredientName));
}

export default function RecipeSelector() {
  // Flatten recipes with metadata
  const recipes = useMemo(() => {
    const items = [];
    mealPlanData.forEach((day) => {
      ["breakfast", "lunch", "dinner"].forEach((slot) => {
        (day.meals[slot] || []).forEach((recipe, idx) => {
          items.push({
            id: `${day.day}-${slot}-${idx}`,
            day: day.day,
            slot,
            ...recipe,
          });
        });
      });
    });
    return items;
  }, []);

  const [selectedIds, setSelectedIds] = useState(() => new Set(recipes.map((r) => r.id))); // default: all in

  const selectedRecipes = recipes.filter((r) => selectedIds.has(r.id));
  const groceryList = useMemo(() => buildGroceryList(selectedRecipes), [selectedRecipes]);

  const toggleRecipe = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(recipes.map((r) => r.id)));
  const clearAll = () => setSelectedIds(new Set());

  return (
    <div className="grid lg:grid-cols-2 gap-6 p-6">
      {/* Recipe list */}
      <Card className="overflow-y-auto max-h-[80vh]">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Weekly Recipes</h2>
            <div className="space-x-2">
              <Button variant="outline" onClick={selectAll}>Select All</Button>
              <Button variant="outline" onClick={clearAll}>Clear All</Button>
            </div>
          </div>
          {recipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-2xl p-3 hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIds.has(recipe.id)}
                onCheckedChange={() => toggleRecipe(recipe.id)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{recipe.name}</div>
                <div className="text-sm text-muted-foreground">
                  {recipe.day} &bull; {recipe.slot.charAt(0).toUpperCase() + recipe.slot.slice(1)}
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Grocery list */}
      <Card className="overflow-y-auto max-h-[80vh]">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Grocery List ({groceryList.length})</h2>
          {groceryList.length === 0 ? (
            <p className="text-muted-foreground">No ingredients selected.</p>
          ) : (
            <ul className="space-y-1">
              {groceryList.map((ing) => (
                <li key={ing.recipeIngredientName} className="flex justify-between">
                  <span>{ing.recipeIngredientName}</span>
                  {/* Display approximate quantity if available */}
                  {ing.saleUnitSize && (
                    <span className="text-muted-foreground text-sm">
                      ~{(ing.totalFraction * ing.saleUnitSize).toFixed(2)} {ing.saleUnitType || "units"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
