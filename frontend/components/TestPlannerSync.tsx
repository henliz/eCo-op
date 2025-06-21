'use client';

import React from 'react';
import { usePlannerSync } from '@/hooks/usePlannerSync';
import { usePlannerStore } from '@/components/meal-planner/usePlannerStore';
import { useAuth } from '@/contexts/AuthContext';

export default function TestPlannerSync() {
  const { currentUser } = useAuth();
  const {
    loadPlan,
    savePlan,
    deletePlan,
    isSyncing,
    lastSyncError,
    isAuthenticated
  } = usePlannerSync();

  const {
    normalMealServings,
    selectedStore,
    selectedRecipes,
    groceryCheckedItems,
    planId,
    version,
    setNormalMealServings
  } = usePlannerStore();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleAddTestData = () => {
    setNormalMealServings(6);
    // Could add more test data here if needed
  };

  const handleClearData = () => {
    setNormalMealServings(4);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-red-800">Authentication Required</h2>
        <p className="text-red-700">Please log in to test the planner sync functionality.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Planner Sync Test</h2>

      {/* Connection Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">Connection Info</h3>
        <p>API URL: {API_BASE_URL}</p>
        <p>User: {currentUser?.email}</p>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      </div>

      {/* Current State */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold mb-2">Current Planner State</h3>
        <p>Household Size: &quot;{normalMealServings}&quot;</p>
        <p>Selected Store: &quot;{selectedStore || 'None'}&quot;</p>
        <p>Selected Meals: &quot;{selectedRecipes().length}&quot;</p>
        <p>Recipe Multipliers: &quot{selectedRecipes().length}&quot;</p>
        <p>Grocery Items: &quot;{groceryCheckedItems.size}&quot;</p>
        <p>Plan ID: &quot;{planId || 'None'}&quot;</p>
        <p>Version: &quot;{version}&quot;</p>
      </div>

      {/* Test Controls */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Test Controls</h3>
        <div className="space-x-2">
          <button
            onClick={handleAddTestData}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Test Data
          </button>
          <button
            onClick={handleClearData}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Sync Controls */}
      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
        <h3 className="font-semibold mb-2">Sync Operations</h3>
        <div className="space-x-2">
          <button
            onClick={loadPlan}
            disabled={isSyncing}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isSyncing ? 'Loading...' : 'Load Plan'}
          </button>
          <button
            onClick={savePlan}
            disabled={isSyncing}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {isSyncing ? 'Saving...' : 'Save Plan'}
          </button>
          <button
            onClick={deletePlan}
            disabled={isSyncing}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isSyncing ? 'Deleting...' : 'Delete Plan'}
          </button>
        </div>
      </div>

      {/* Status */}
      {isSyncing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-700">Syncing...</p>
        </div>
      )}

      {lastSyncError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold mb-2 text-red-800">Sync Error</h3>
          <p className="text-red-700">{lastSyncError}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-gray-100 border border-gray-200 rounded">
        <h3 className="font-semibold mb-2">Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click &quot;Add Test Data&quot; to change household size to 6</li>
          <li>Click &quot;Save Plan&quot; to save current state</li>
          <li>Click &quot;Clear Data&quot; to reset household size to 4</li>
          <li>Click &quot;Load Plan&quot; to restore saved state</li>
          <li>Click &quot;Delete Plan&quot; to remove saved plan</li>
        </ol>
      </div>
    </div>
  );
}