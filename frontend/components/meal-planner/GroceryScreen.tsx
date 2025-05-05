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

/* ------------------------------- screen -------------------------------- */
export function GroceryScreen() {
  const {
    aggregatedIngredients,
    groceryCheckedItems,
    toggleGroceryItem,
    setIngredientTags
  } = usePlannerStore();

  const [showDiscretionary, setShowDiscretionary] = useState(false);
  const [groupBySection, setGroupBySection] = useState(false);

  const groceryItems = Array.from(aggregatedIngredients().values());

  /* ---------------------- split items into two buckets ---------------------- */
  const essentialItems = groceryItems
    .filter(item => {
      if (item.tags?.status === 'ignored') return false;
      return item.tags?.importance === 'core' || item.neededFraction * 100 >= 5;
    })
    .sort(sortLogic(groupBySection, groceryCheckedItems));

  const discretionaryItems = groceryItems
    .filter(item => {
      if (item.tags?.status === 'ignored') return false;
      return item.tags?.importance === 'optional' || item.neededFraction * 100 < 5;
    })
    .sort(sortLogic(groupBySection, groceryCheckedItems));

  /* ------------------------------ totals ----------------------------------- */
  const groceryTotal = [
    ...essentialItems.filter(i => i.tags?.status !== 'owned'),
    ...discretionaryItems.filter(
      i => groceryCheckedItems.has(i.packageId) && i.tags?.status !== 'owned'
    )
  ].reduce((sum, i) => sum + i.lineCost, 0);

  const checkedOptionalCount = discretionaryItems.filter(i =>
    groceryCheckedItems.has(i.packageId)
  ).length;

  const totalItemCount =
    essentialItems.filter(i => i.tags?.status !== 'owned').length +
    discretionaryItems.filter(
      i => groceryCheckedItems.has(i.packageId) && i.tags?.status !== 'owned'
    ).length;

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
          <div className="bg-gray-100 p-2 font-medium text-sm flex items-center">
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
      className="container mx-auto p-4"
      style={{ scrollPaddingTop: '80px', scrollPaddingBottom: '200px' }}
    >
      {/* combined sticky header */}
      <div className="sticky top-0 z-30 bg-white flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Shopping List</h1>
        <button
          onClick={() => setGroupBySection(!groupBySection)}
          className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
            groupBySection ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
          }`}
        >
          <Tag size={16} />
          {groupBySection ? 'Grouped by Section' : 'Group by Section'}
        </button>
      </div>

      {/* ---------------- Essential Card ---------------- */}
      <Card>
        {/* enlarged sticky header */}
        <div className="sticky top-16 z-20 bg-white border-b shadow-sm">
          <div className="flex justify-between items-center px-4 py-4">
            <span className="text-lg font-bold">Essential Items</span>
            <div className="flex items-center gap-6 text-sm font-semibold text-gray-600">
              <span className="min-w-[2rem] text-center">Qty</span>
              <span className="min-w-[3rem] text-center">Each</span>
              <span className="min-w-[3rem] text-center">Total</span>
              <span className="min-w-[3rem] text-center">Savings</span>
              <span className="min-w-[1.5rem] text-center" />
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {essentialItems.length ? (
            renderItems(essentialItems)
          ) : (
            <p className="p-4 text-center text-gray-500">
              Select some meals to generate your shopping list
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Optional Card ---------------- */}
      {discretionaryItems.length > 0 && (
        <Card>
          <CardHeader className="py-2">
            <CardTitle>
              <Collapsible open={showDiscretionary} onOpenChange={setShowDiscretionary}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex justify-between items-center px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">Optional Items</span>
                      <span className="text-sm font-normal text-gray-500">
                        ({checkedOptionalCount}/{discretionaryItems.length} selected)
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-6 text-sm font-semibold text-gray-600">
                        <span className="min-w-[2rem] text-center">Qty</span>
                        <span className="min-w-[3rem] text-center">Each</span>
                        <span className="min-w-[3rem] text-center">Total</span>
                        <span className="min-w-[3rem] text-center">Savings</span>
                        <span className="min-w-[1.5rem] text-center" />
                      </div>
                      {showDiscretionary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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

      {/* bottom summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <p className="text-sm text-gray-500">{totalItemCount} items to buy</p>
          <p className="text-lg">
            Total: <span className="font-bold">${groceryTotal.toFixed(2)}</span>
          </p>
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
    const statusOrder: Record<'bought' | 'owned' | 'ignored', number> = { bought: 2, owned: 1, ignored: 0 };
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
