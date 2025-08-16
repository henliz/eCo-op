// Fixed hooks/useDashboardData.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlannerStores } from '@/stores/usePlannerStores';

export const useDashboardData = () => {
  const { currentUser, makeAPICall } = useAuth();
  const { loadUserPlan, meals, selectedStore, selectedRecipes, mealSummary, totals } = usePlannerStores();
  const [hasTriedToLoad, setHasTriedToLoad] = useState(false);

  // Load user's saved meal plan when dashboard mounts
  useEffect(() => {
    if (currentUser && makeAPICall && !hasTriedToLoad) {
      setHasTriedToLoad(true);
      loadUserPlan(makeAPICall).catch(() => {
        // Ignore errors - user might not have a saved plan
      });
    }
  }, [currentUser, makeAPICall, hasTriedToLoad, loadUserPlan]);

  // FIXED: Check if user has any meal plan data
  // Instead of only checking selected recipes, check if we have loaded any meals or have a store
  const hasData = Boolean(
    selectedStore || // Has selected a store
    (meals && (
      (meals.breakfast?.length || 0) +
      (meals.lunch?.length || 0) +
      (meals.dinner?.length || 0)
    ) > 0) // OR has loaded meal data
  );

  // Debug logging (remove in production)
  console.log('📊 Dashboard Data Status:', {
    hasData,
    selectedStore: !!selectedStore,
    mealsLoaded: {
      breakfast: meals?.breakfast?.length || 0,
      lunch: meals?.lunch?.length || 0,
      dinner: meals?.dinner?.length || 0,
      total: (meals?.breakfast?.length || 0) + (meals?.lunch?.length || 0) + (meals?.dinner?.length || 0)
    },
    selectedRecipesCount: selectedRecipes ? selectedRecipes().length : 0
  });

  return {
    hasData,
    meals,
    selectedStore,
    selectedRecipes,
    mealSummary,
    totals,
    currentUser
  };
};
