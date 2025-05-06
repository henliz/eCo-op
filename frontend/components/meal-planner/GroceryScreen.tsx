'use client';

import React, { useState } from 'react';
import { usePlannerStore, type AggregatedItem, type IngredientTags } from './usePlannerStore';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { GroceryItem } from './GroceryItem';

/* -------------------------------- types -------------------------------- */
interface GroupedItems {
  section: string;
  items: AggregatedItem[];
}

interface GroceryTotals {
  mealCost: number;     // Cost of the portions used in recipes
  leftoverCost: number; // Cost of the unused portions
  totalCost: number;    // Total cost to purchase all selected items
  totalSavings: number; // Savings on selected items
}

/* ------------------------------- screen -------------------------------- */
export function GroceryScreen() {
  const {
    aggregatedIngredients,
    groceryCheckedItems,
    toggleGroceryItem,
    setIngredientTags,
    totals // Access meal totals
  } = usePlannerStore();

  const [showDiscretionary, setShowDiscretionary] = useState(false);
  const [groupBySection, setGroupBySection] = useState(false);

  const groceryItems = Array.from(aggregatedIngredients().values());

  /* ---------------------- split items into two buckets ---------------------- */
  const essentialItems = groceryItems
    .filter(item => {
      if (item.tags?.status === 'ignored') return false;
      return item.tags?.importance === 'core' || item.neededFraction * 100 >= 20;
    })
    .sort(sortLogic(groupBySection, groceryCheckedItems));

  const discretionaryItems = groceryItems
    .filter(item => {
      if (item.tags?.status === 'ignored') return false;
      return item.tags?.importance === 'optional' || item.neededFraction * 100 < 20;
    })
    .sort(sortLogic(groupBySection, groceryCheckedItems));

  /* ------------------------------ totals ----------------------------------- */
  // Calculate the new grocery totals
  const calculateGroceryTotals = (): GroceryTotals => {
    const allItems = [...essentialItems, ...discretionaryItems];
    let mealCost = 0;
    let leftoverCost = 0;
    let totalCost = 0;
    let totalSavings = 0;

    // Only consider items that are checked
    const selectedItems = allItems.filter(item =>
      groceryCheckedItems.has(item.packageId) &&
      item.tags?.status !== 'owned'
    );

    selectedItems.forEach(item => {
      // Calculate cost of portion used in recipes
      const usedFraction = Math.min(item.neededFraction, 1);
      const usedCost = item.packPrice * usedFraction;
      mealCost += usedCost;

      // Calculate cost of leftover portion
      const leftoverFraction = Math.max(0, 1 - item.neededFraction);
      const unusedCost = item.packPrice * leftoverFraction;
      leftoverCost += unusedCost;

      // Calculate total cost (full package price)
      totalCost += item.packPrice;

      // Calculate savings based on savings percentage
      if (item.savingsPercentage) {
        const regularPrice = item.packPrice / (1 - item.savingsPercentage / 100);
        totalSavings += regularPrice - item.packPrice;
      }
    });

    return {
      mealCost,
      leftoverCost,
      totalCost,
      totalSavings
    };
  };

  const groceryTotals = calculateGroceryTotals();

  /* ----------------------------- handlers ---------------------------------- */
  const handleUpdateTags = (packageId: string, tags: Partial<IngredientTags>) =>
    setIngredientTags(packageId, tags);

  /* --------------------------- grouping helper ------------------------------ */
  const getGroupedItems = (items: AggregatedItem[]): GroupedItems[] => {
    if (!groupBySection) return items.map(i => ({ section: '', items: [i] }));

    const sections = new Set<string>();
    items.forEach(i => sections.add(i.tags?.storeSection || 'Uncategorized'));

    return Array.from(sections)
      .sort()
      .map(section => ({
        section,
        items: items.filter(i => (i.tags?.storeSection || 'Uncategorized') === section)
      }));
  };

  const renderItems = (items: AggregatedItem[]) => {
    if (groupBySection) {
      return getGroupedItems(items).map(g => (
        <div key={g.section} className="mb-2">
          <div className="bg-gray-100 p-0 font-medium text-sm flex items-center">
            <Tag size={14} className="mr-1" />
            {g.section}
          </div>
          {g.items.map(i => (
            <GroceryItem
              key={i.packageId}
              item={i}
              isChecked={groceryCheckedItems.has(i.packageId)}
              onToggle={toggleGroceryItem}
              onUpdateTags={handleUpdateTags}
            />
          ))}
        </div>
      ));
    }

    return items.map(i => (
      <GroceryItem
        key={i.packageId}
        item={i}
        isChecked={groceryCheckedItems.has(i.packageId)}
        onToggle={toggleGroceryItem}
        onUpdateTags={handleUpdateTags}
      />
    ));
  };

  /* ----------------------------- JSX --------------------------------------- */
  return (
      <div
          className="container mx-0 p-0 !px-0"
          style={{scrollPaddingTop: '80px', scrollPaddingBottom: '200px'}}
      >
        {/* header */}
        <div className="bg-white flex justify-between items-center mb-2 px-2">
          <span className="text-xl font-bold">Shopping List</span>
          <button
              onClick={() => setGroupBySection(!groupBySection)}
              className={`flex items-center gap-0 px-0 py-0 rounded-md text-sm ${
                  groupBySection ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
              }`}
          >
            <Tag size={16}/>
            {groupBySection ? 'Grouped by Section' : 'Group by Section'}
          </button>
        </div>

        {/* ---------------- Essential Card ---------------- */}
        <Card>
          <CardHeader className="p-0">
            <CardTitle>
              <div className="w-full bg-gray-200">
                {/* Row 1: Similar to discretionary */}
                <div className="flex justify-between items-center py-2 px-4">
                  <div className="flex items-center gap-2">
                    {/* Empty to match structure */}
                  </div>
                  {/* No chevron since this doesn't collapse */}
                </div>

                {/* Row 2: Column headers */}
                <div className="flex justify-between items-center px-4 py-2 border-b">
                  <div className="flex-1">
                    <span className="text-lg font-bold">Essentials</span>
                  </div>

                  <div className="flex items-center">
                    {/* Qty column header */}
                    <div className="w-16 text-right font-semibold text-sm text-gray-600">
                      Qty
                    </div>

                    {/* Each column header */}
                    <div className="w-20 text-right font-semibold text-sm text-gray-600">
                      Each
                    </div>

                    {/* Total column header */}
                    <div className="w-20 text-right font-semibold text-sm text-gray-600">
                      Total
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="!p-0">
                {essentialItems.length ? (
                  renderItems(essentialItems)
                ) : (
                  <p className="p-2 text-center text-gray-500">
                    Select some meals to generate your shopping list
                  </p>
                )}
              </CardContent>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* ---------------- Optional Card ---------------- */}
        {discretionaryItems.length > 0 && (
            <Card>
              <CardHeader className="p-0">
                <CardTitle>
                  <Collapsible open={showDiscretionary} onOpenChange={setShowDiscretionary}>
                    <CollapsibleTrigger className="w-full bg-gray-200">
                      {/* Row 1: Title and selection count */}
                      <div className="flex justify-between items-center py-2 px-4">
                        <div className="flex items-center gap-2">

                        </div>
                        {showDiscretionary ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                      </div>

                      {/* Row 2: Column headers */}
                      <div className="flex justify-between items-center px-4 py-2 border-b">
                        <div className="flex-1">
                          <span className="text-lg font-bold">Discretionary</span>
                        </div>

                        <div className="flex items-center">
                          {/* Qty column header - exactly matching width */}
                          <div className="w-16 text-right font-semibold text-sm text-gray-600">
                          Qty
                          </div>

                          {/* Each column header - exactly matching width */}
                          <div className="w-20 text-right font-semibold text-sm text-gray-600">
                            Each
                          </div>

                          {/* Total column header - exactly matching width */}
                          <div className="w-20 text-right font-semibold text-sm text-gray-600">
                            Total
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="p-0">
                        {renderItems(discretionaryItems)}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </CardTitle>
              </CardHeader>
            </Card>
        )}

        {/* Bottom summary bar with enhanced totals */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t py-2 px-3 shadow-lg pb-4">
          <div className="container mx-auto">
            {/* TOTALS header */}
            <div className="text-center mb-1">
              <span className="font-bold text-lg">TOTALS</span>
            </div>

            {/* Enhanced stats row with 4 metrics - ledger style */}
            <div className="flex justify-center items-center">
              <div className="grid grid-cols-4 gap-4 w-full max-w-2xl">
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-600 text-right">Meal Cost</span>
                  <span className="font-bold text-right">${groceryTotals.mealCost.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-600 text-right">Future Use</span>
                  <span className="font-bold text-amber-600 text-right">${groceryTotals.leftoverCost.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-600 text-right">Grocery Bill</span>
                  <span className="font-bold text-right">${groceryTotals.totalCost.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-600 text-right">Savings</span>
                  <span className="font-bold text-green-600 text-right">${groceryTotals.totalSavings.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

/* ----------------------------- helpers ---------------------------------- */
function sortLogic(
    groupBy: boolean,
    checked: Set<string>
): (a: AggregatedItem, b: AggregatedItem) => number {
  return (a, b) => {
    const statusOrder: Record<'bought' | 'owned' | 'ignored', number> = {bought: 2, owned: 1, ignored: 0};
    const aStatus = a.tags?.status || 'bought';
    const bStatus = b.tags?.status || 'bought';
    if (aStatus !== bStatus) return statusOrder[aStatus] - statusOrder[bStatus];

    const aChecked = checked.has(a.packageId);
    const bChecked = checked.has(b.packageId);
    if (aChecked !== bChecked) return aChecked ? 1 : -1;

    if (groupBy) {
      const aSec = a.tags?.storeSection || '';
      const bSec = b.tags?.storeSection || '';
      if (aSec !== bSec) return aSec.localeCompare(bSec);
    }

    return b.lineCost - a.lineCost;
  };
}

