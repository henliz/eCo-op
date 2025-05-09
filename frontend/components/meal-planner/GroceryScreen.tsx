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
  futureUseCost: number; // Cost of the unused portions
  groceryBill: number;  // Total cost to purchase all selected items
  totalSavings: number; // Savings on selected items
}

/* ------------------------------- screen -------------------------------- */
export function GroceryScreen() {
  const {
    aggregatedIngredients,
    groceryCheckedItems,
    toggleGroceryItem,
    setIngredientTags,
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
  // Calculate the new grocery totals with corrected math
  const calculateGroceryTotals = (): GroceryTotals => {
    const allItems = [...essentialItems, ...discretionaryItems];
    let mealCost = 0;
    let futureUseCost = 0;
    let groceryBill = 0;
    let totalSavings = 0;

    // Only consider items that are checked and not owned
    const selectedItems = allItems.filter(item =>
      groceryCheckedItems.has(item.packageId) &&
      item.tags?.status !== 'owned'
    );

    selectedItems.forEach(item => {
      // Quantity to purchase is always rounded up
      const quantityToBuy = Math.ceil(Math.max(0.001, item.neededFraction - 0.05));

      // Calculate meal cost (portion actually used in recipes)
      const usedCost = item.packPrice * item.neededFraction;
      mealCost += usedCost;

      // Calculate future use cost (portion not used in current recipes)
      const unusedCost = item.packPrice * Math.max(0, quantityToBuy - item.neededFraction);
      futureUseCost += unusedCost;

      // Calculate total grocery bill (full packages purchased)
      const totalItemCost = item.packPrice * quantityToBuy;
      groceryBill += totalItemCost;

      // Calculate savings based on savings percentage
      if (item.savingsPercentage) {
        // If we're saving 20%, then the sale price is 80% of regular price
        // So regularPrice = salePrice / (1 - savingsPercentage/100)
        const salePrice = totalItemCost; // totalItemCost is already using the sale price
        const regularPrice = salePrice / (1 - item.savingsPercentage / 100);
        totalSavings += (regularPrice - salePrice);
      }
    });

    return {
      mealCost,
      futureUseCost,
      groceryBill,
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
            <>

              {/* Instruction card for pantry staples explanation */}
              <div className="max-w-md mx-auto mb-0.5 rounded-lg bg-orange-50 shadow-sm px-4 relative my-2 mx-1"
                   style={{height: "45px"}}>
                <p className="text-sm text-gray-700 italic m-0 absolute left-0 right-0 text-center flex items-center justify-center mx-1"
                   style={{top: "50%", transform: "translateY(-50%)"}}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-1 text-amber-500"
                  >
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                    <path d="M9 18h6"></path>
                    <path d="M10 22h4"></path>
                  </svg>
                    Pantry Staples: You&apos;ll only use a small portion of these items in the recipes. Check your kitchen before buying.
                </p>
              </div>

              <Card>
                <CardHeader className="p-0">
                  <CardTitle>
                    <Collapsible open={showDiscretionary} onOpenChange={setShowDiscretionary}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex justify-between items-center p-2 bg-gray-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">Pantry Staples</span>
                            {/* Chevron icon next to title */}
                            <div className="ml-2">
                              {showDiscretionary ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {/* Qty column header */}
                            <div className="w-16 text-right font-semibold text-sm text-gray-600">Qty</div>
                            {/* Each column header */}
                            <div className="w-20 text-right font-semibold text-sm text-gray-600">Each</div>
                            {/* Total column header */}
                            <div className="w-20 text-right font-semibold text-sm text-gray-600">Total</div>
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
            </>
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
                  <span className="font-bold text-amber-600 text-right">${groceryTotals.futureUseCost.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-600 text-right">Grocery Bill</span>
                  <span className="font-bold text-right">${groceryTotals.groceryBill.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-600 text-right">Deals</span>
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

