"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Calendar, ChefHat, RefreshCw } from 'lucide-react';
import type { Store } from "@/stores";
import { useRouter } from "next/navigation";
import { useStoreLocationStore } from "@/stores";


interface Recipe {
  name: string;
  isSelected: boolean;
  flyerItemsCount?: number;
  totalSavings?: number;
  salePrice?: number;
  validFromDate?: string;
  validToDate?: string;
}

interface MealData {
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
}

interface WeeklyPlanProps {
  hasData: boolean;
  meals: MealData;
  // Note: selectedStore, totals, mealSummary kept for future use but marked as optional
  selectedStore?: Store;
  totals?: () => { totalSavings: number; saleTotal: number };
  mealSummary?: () => { total: number };
}

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({
  hasData,
  meals,
}) => {

  const router = useRouter();
  // Read current selection directly from the store (ids survive across pages on soft nav)
  const { selectedStore: selectedStoreId } = useStoreLocationStore.getState();

  function goToPlanner(mode: "new" | "edit") {
    const qs = new URLSearchParams({
          tab: "plan",
       mode, // let /plan know if it's a new plan vs edit
       ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
     });
     router.push(`/plan?${qs.toString()}`);
   }

  if (!hasData) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Planned Meals</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Meals Planned Yet</h3>
          <p className="text-gray-600 mb-4">Start planning to see your meals here</p>
          <Button
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-2 rounded-xl transition-all duration-300"
            onClick={() => goToPlanner("new")}
          >
            Start Planning
          </Button>
        </div>
      </div>
    );
  }

  // Calculate meal selections
  const selectedBreakfasts = meals.breakfast.filter(r => r.isSelected);
  const selectedLunches = meals.lunch.filter(r => r.isSelected);
  const selectedDinners = meals.dinner.filter(r => r.isSelected);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div
              className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center">
            <ChefHat size={20} className="text-white"/>
          </div>
          <h2 className="text-xl sm:text-xl font-semibold text-gray-800">Planned Meals</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-3 sm:shrink-0">
          <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto whitespace-nowrap hover:bg-green-50 transition-colors"
              onClick={() => goToPlanner("new")}

          >
            <RefreshCw size={16} className="mr-2"/>
            New Plan
          </Button>
          <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto whitespace-nowrap hover:bg-blue-50 transition-colors"
              onClick={() => goToPlanner("edit")}
          >
            <Edit3 size={16} className="mr-2"/>
            Edit Plan
          </Button>
        </div>
      </div>

      {/* Meal Breakdown */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Your Weekly Meals</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-800">Breakfast</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{selectedBreakfasts.length}</div>
            <div className="text-xs text-yellow-600">recipes selected</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">Lunch</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{selectedLunches.length}</div>
            <div className="text-xs text-blue-600">recipes selected</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-purple-800">Dinner</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{selectedDinners.length}</div>
            <div className="text-xs text-purple-600">recipes selected</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">
            {selectedBreakfasts.length + selectedLunches.length + selectedDinners.length} meals planned
          </div>
          <div className="text-sm text-gray-600">
            Ready for your week ahead
          </div>
        </div>
      </div>
    </div>
  );
};