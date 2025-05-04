'use client';

import React from 'react';
import { usePlannerStore, type AggregatedItem } from './usePlannerStore';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export function GroceryScreen() {
  const { aggregatedIngredients, groceryCheckedItems, toggleGroceryItem, totals } = usePlannerStore();

  // Get aggregated ingredients as an array for easier display
  const groceryItems = Array.from(aggregatedIngredients().values());
  const summaryTotals = totals();

  const GroceryItem = ({ item }: { item: AggregatedItem }) => {
    const isChecked = groceryCheckedItems.has(item.packageId);

    return (
      <div
        className={`flex items-center justify-between p-4 border-b last:border-0 ${isChecked ? 'opacity-50' : ''}`}
        onClick={() => toggleGroceryItem(item.packageId)}
      >
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => toggleGroceryItem(item.packageId)}
            className="cursor-pointer"
          />
          <div>
            <p className={`font-medium ${isChecked ? 'line-through' : ''}`}>
              {item.productName}
            </p>
            <p className="text-sm text-gray-500">
              {item.packsToBuy} × {item.unitSize}{item.unitType} packages
              {item.packsToBuy > item.neededFraction && (
                <span className="ml-2">
                  (need {item.neededFraction.toFixed(2)})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-medium ${isChecked ? 'line-through' : ''}`}>
            ${item.lineCost.toFixed(2)}
          </p>
          {item.savingsPercentage && item.savingsPercentage > 0 && (
            <p className="text-sm text-green-600">
              {item.savingsPercentage.toFixed(1)}% off
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 pb-24">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shopping List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {groceryItems.length > 0 ? (
              groceryItems.map(item => (
                <GroceryItem key={item.packageId} item={item} />
              ))
            ) : (
              <p className="p-4 text-center text-gray-500">
                Select some meals to generate your shopping list
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom summary bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm">
            <p className="text-gray-500">
              {groceryItems.filter(item => !groceryCheckedItems.has(item.packageId)).length} items
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg">
              Total: <span className="font-bold">${summaryTotals.saleTotal.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
