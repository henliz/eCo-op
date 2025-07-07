// frontend/app/dashboard/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { PreferencesOverview } from '@/components/user-preferences/PreferencesOverview';
import { useStoreLocationStore } from '@/stores/useStoreLocationStore';
import { usePlannerStore } from '@/components/meal-planner/usePlannerStore';
import {
  MapPin,
  ShoppingCart,
  ChefHat,
  Clock,
  TrendingUp,
  Calendar,
  Utensils,
  DollarSign,
  Settings
} from 'lucide-react';

// Quick Action Card Component
const QuickActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  color: string;
}> = ({ icon, title, description, action, onClick, color }) => (
  <div className={`${color} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`} onClick={onClick}>
    <div className="flex items-start gap-3">
      <div className="p-2 bg-white/20 rounded-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-white/80 text-sm mb-2">{description}</p>
        <button className="text-white text-sm font-medium hover:underline">
          {action} →
        </button>
      </div>
    </div>
  </div>
);

// Current Store Card Component
const CurrentStoreCard: React.FC = () => {
  const storeLocation = useStoreLocationStore();
  const selectedStore = storeLocation.getSelectedStore();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Your Store</h3>
          <p className="text-sm text-gray-500">Currently selected</p>
        </div>
      </div>

      {selectedStore ? (
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900">{selectedStore.name}</h4>
            <p className="text-sm text-gray-600">{selectedStore.location}</p>
            {selectedStore.distance && (
              <p className="text-xs text-gray-500">{selectedStore.distance.toFixed(1)} km away</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = '/plan'}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Plan Meals
            </button>
            <button
              onClick={() => window.location.href = '/plan'}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-3">No store selected</p>
          <button
            onClick={() => window.location.href = '/plan'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Choose Your Store
          </button>
        </div>
      )}
    </div>
  );
};

// Meal Plan Summary Card Component
const MealPlanSummaryCard: React.FC = () => {
  const plannerStore = usePlannerStore();
  const summary = plannerStore.mealSummary();
  const totals = plannerStore.totals();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <Utensils className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Current Meal Plan</h3>
          <p className="text-sm text-gray-500">{summary.total} meals selected</p>
        </div>
      </div>

      {summary.total > 0 ? (
        <div className="space-y-4">
          {/* Meal Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-yellow-50 rounded-lg p-2">
              <div className="text-lg font-bold text-yellow-800">{summary.breakfast}</div>
              <div className="text-xs text-yellow-600">Breakfast</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2">
              <div className="text-lg font-bold text-orange-800">{summary.lunch}</div>
              <div className="text-xs text-orange-600">Lunch</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2">
              <div className="text-lg font-bold text-purple-800">{summary.dinner}</div>
              <div className="text-xs text-purple-600">Dinner</div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Total Cost</span>
              <span className="font-bold text-gray-900">${totals.saleTotal.toFixed(2)}</span>
            </div>
            {totals.totalSavings > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-600">Savings</span>
                <span className="text-xs font-medium text-green-600">-${totals.totalSavings.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = '/plan'}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              View Plan
            </button>
            <button
              onClick={() => window.location.href = '/plan'}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              Edit
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-3">No meals planned yet</p>
          <button
            onClick={() => window.location.href = '/plan'}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
          >
            Start Planning
          </button>
        </div>
      )}
    </div>
  );
};

// Shopping List Summary Card Component
const ShoppingListSummaryCard: React.FC = () => {
  const plannerStore = usePlannerStore();
  const aggregatedItems = plannerStore.aggregatedIngredients();
  const totalItems = aggregatedItems.size;
  const checkedItems = Array.from(aggregatedItems.values()).filter(item => item.isChecked).length;
  const totalCost = Array.from(aggregatedItems.values()).reduce((sum, item) => sum + item.lineCost, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <ShoppingCart className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Shopping List</h3>
          <p className="text-sm text-gray-500">{totalItems} items total</p>
        </div>
      </div>

      {totalItems > 0 ? (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900">{checkedItems}/{totalItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Total</span>
              <span className="font-bold text-gray-900">${totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = '/plan'}
              className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
            >
              View List
            </button>
            <button
              onClick={() => {
                // Print functionality
                window.print();
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              Print
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-3">No items to shop for</p>
          <button
            onClick={() => window.location.href = '/plan'}
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
          >
            Plan Some Meals
          </button>
        </div>
      )}
    </div>
  );
};

export default function UserDashboard() {
  const { currentUser } = useAuth();

  // Redirect if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to eCo-op</h1>
            <p className="text-gray-600 mb-6">Please log in to access your personalized meal planning dashboard.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'plan':
        window.location.href = '/plan';
        break;
      case 'preferences':
        window.location.href = '/meal-preferences';
        break;
      case 'recipes':
        // Future recipe browser
        console.log('Recipe browser coming soon...');
        break;
      case 'history':
        // Future meal plan history
        console.log('Meal plan history coming soon...');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser.displayName || currentUser.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">
            Plan your meals, manage your preferences, and save money on groceries.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            icon={<ChefHat className="w-6 h-6 text-white" />}
            title="Plan Meals"
            description="Create your weekly meal plan"
            action="Start Planning"
            onClick={() => handleQuickAction('plan')}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <QuickActionCard
            icon={<Settings className="w-6 h-6 text-white" />}
            title="Preferences"
            description="Manage dietary restrictions"
            action="Update Settings"
            onClick={() => handleQuickAction('preferences')}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <QuickActionCard
            icon={<Utensils className="w-6 h-6 text-white" />}
            title="Browse Recipes"
            description="Discover new meal ideas"
            action="Explore Recipes"
            onClick={() => handleQuickAction('recipes')}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <QuickActionCard
            icon={<Clock className="w-6 h-6 text-white" />}
            title="Meal History"
            description="View past meal plans"
            action="See History"
            onClick={() => handleQuickAction('history')}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Store and Preferences */}
          <div className="space-y-6">
            <CurrentStoreCard />
            <PreferencesOverview />
          </div>

          {/* Middle Column - Meal Plan */}
          <div className="space-y-6">
            <MealPlanSummaryCard />

            {/* Weekly Overview - Placeholder for future */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">This Week</h3>
                  <p className="text-sm text-gray-500">Meal schedule overview</p>
                </div>
              </div>

              <div className="text-center py-6">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">Weekly calendar view coming soon</p>
                <p className="text-xs text-gray-500">Track your meal schedule by day</p>
              </div>
            </div>
          </div>

          {/* Right Column - Shopping and Stats */}
          <div className="space-y-6">
            <ShoppingListSummaryCard />

            {/* Savings Summary - Placeholder for future */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Savings Tracker</h3>
                  <p className="text-sm text-gray-500">Your money-saving progress</p>
                </div>
              </div>

              <div className="text-center py-6">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">Savings tracking coming soon</p>
                <p className="text-xs text-gray-500">See how much you save with smart planning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Placeholder for future */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Activity feed coming soon</p>
            <p className="text-sm text-gray-500">Track your meal planning activities and achievements</p>
          </div>
        </div>
      </div>
    </div>
  );
}