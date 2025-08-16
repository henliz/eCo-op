import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Home, Package } from 'lucide-react';

interface Totals {
  totalSavings: number;
  saleTotal: number;
}

interface MealSummary {
  total: number;
}

interface ShoppingListProps {
  hasData: boolean;
  // Note: totals and mealSummary kept for future use but marked as optional
  totals?: () => Totals;
  mealSummary?: () => MealSummary;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ hasData }) => {
  if (!hasData) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
            <ShoppingCart size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Shopping List</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">No shopping list yet</p>
          <Button
            variant="outline"
            className="w-full justify-center gap-3 h-12 hover:bg-blue-50 transition-colors"
            onClick={() => window.location.href = '/plan?tab=plan'}
          >
            <Package size={18} className="text-blue-600" />
            Create Your First Meal Plan
          </Button>
        </div>
      </div>
    );
  }

  // Get grocery progress data with simplified two-state system
  // Note: This would need to be passed from the parent component that has access to usePlannerStores
  // Two explicit states: 'owned' (home icon) and 'in_cart' (cart icon)
  // Everything else = needs action
  const groceryProgress = {
    totalItems: 24,
    needsAction: 10,        // Anything that's NOT 'owned' or 'in_cart'
    owned: 6,               // status: 'owned' (home icon)
    inCart: 8,              // status: 'in_cart' (cart icon)
    totalCost: 127.50,
    needsActionCost: 58.90,
    ownedCost: 36.80,       // Cost saved by having at home
    inCartCost: 31.80       // Cost in shopping cart
  };

  const completionPercentage = groceryProgress.totalItems > 0
    ? Math.round(((groceryProgress.owned + groceryProgress.inCart) / groceryProgress.totalItems) * 100)
    : 0;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
          <ShoppingCart size={20} className="text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Shopping List</h2>
      </div>

      {/* Progress Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Shopping Progress</span>
          <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Shopping Stats - Two Explicit States + Everything Else */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
          <div className="flex items-center gap-1 mb-1">
            <Home size={14} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">Owned</span>
          </div>
          <div className="text-lg font-bold text-green-600">{groceryProgress.owned}</div>
          <div className="text-xs text-green-600">${groceryProgress.ownedCost.toFixed(2)} saved</div>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <div className="flex items-center gap-1 mb-1">
            <ShoppingCart size={14} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">In Cart</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{groceryProgress.inCart}</div>
          <div className="text-xs text-blue-600">${groceryProgress.inCartCost.toFixed(2)}</div>
        </div>

        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
          <div className="flex items-center gap-1 mb-1">
            <Package size={14} className="text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">Need</span>
          </div>
          <div className="text-lg font-bold text-orange-600">{groceryProgress.needsAction}</div>
          <div className="text-xs text-orange-600">${groceryProgress.needsActionCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Total Cost */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mb-6">
        <div className="text-center">
          <div className="text-xs text-purple-600 font-medium mb-1">Total Shopping Cost</div>
          <div className="text-2xl font-bold text-purple-600">${groceryProgress.totalCost.toFixed(2)}</div>
          <div className="text-xs text-purple-500">{groceryProgress.totalItems} items</div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-12 transition-all duration-300"
        onClick={() => window.location.href = '/plan?tab=shop'}
      >
        <ShoppingCart size={18} className="mr-2" />
        View Full Shopping List
      </Button>
    </div>
  );
};