'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { usePlannerStore } from '../../components/meal-planner/usePlannerStore';
import { useUserPreferencesStore } from '@/stores/useUserPreferencesStore';
import {
  Home,
  User,
  BookOpen,
  Settings,
  Search,
  Heart,
  Edit3,
  ShoppingCart,
  ChefHat,
  Calendar,
  Clock,
  Star,
  Plus,
  Bell,
  Utensils,
  AlertCircle
} from 'lucide-react';

interface MealPlanDay {
  day: string;
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

interface UserRecipe {
  id: string;
  name: string;
  image?: string;
  portions: number;
  ingredients: string[];
  isBookmarked?: boolean;
  isUserCreated: boolean;
  tags: string[];
  cookTime: string;
}

// Define our custom font styles
const headingFont = { fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif', fontWeight: '700' };
const bodyFont = { fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif' };

const DashboardPage: React.FC = () => {
  const { currentUser, loading: authLoading, makeAPICall } = useAuth();

  // Get real data from planner store
  const meals = usePlannerStore((s) => s.meals);
  const selectedStore = usePlannerStore((s) => s.selectedStore);
  const selectedRecipes = usePlannerStore((s) => s.selectedRecipes);
  const mealSummary = usePlannerStore((s) => s.mealSummary);
  const totals = usePlannerStore((s) => s.totals);
  const loadUserPlan = usePlannerStore((s) => s.loadUserPlan);

  // Add preferences store
  const preferences = useUserPreferencesStore();

  const [activeSection, setActiveSection] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [hasTriedToLoad, setHasTriedToLoad] = useState<boolean>(false);

  // Load user's saved meal plan when dashboard mounts
  useEffect(() => {
    if (currentUser && makeAPICall && !hasTriedToLoad) {
      setHasTriedToLoad(true);
      loadUserPlan(makeAPICall).catch(() => {
        // Ignore errors - user might not have a saved plan
      });
    }
  }, [currentUser, makeAPICall, hasTriedToLoad, loadUserPlan]);

  // Load preferences for summary display
  useEffect(() => {
    if (currentUser && makeAPICall && preferences.preferences === null) {
      preferences.loadPreferences(makeAPICall).catch(console.error);
    }
  }, [currentUser, makeAPICall, preferences]);

  // Check if user has any meal plan data
  const hasData: boolean = Boolean(selectedStore && selectedRecipes && selectedRecipes().length > 0);

  // Use real data if available, otherwise fallback
  const weekMealPlan: MealPlanDay[] = hasData ? (() => {
    const today = new Date();
    const weekPlan: MealPlanDay[] = [];

    // Get all selected meals for each type
    const selectedBreakfasts = meals.breakfast.filter(r => r.isSelected);
    const selectedLunches = meals.lunch.filter(r => r.isSelected);
    const selectedDinners = meals.dinner.filter(r => r.isSelected);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Distribute meals across the week - cycle through available meals or show "No meal planned"
      const breakfastMeal = selectedBreakfasts[i % selectedBreakfasts.length]?.name || 'No meal planned';
      const lunchMeal = selectedLunches[i % selectedLunches.length]?.name || 'No meal planned';
      const dinnerMeal = selectedDinners[i % selectedDinners.length]?.name || 'No meal planned';

      weekPlan.push({
        day: dayNames[date.getDay()],
        date: date.getDate().toString(),
        breakfast: selectedBreakfasts.length > 0 ? breakfastMeal : 'No meal planned',
        lunch: selectedLunches.length > 0 ? lunchMeal : 'No meal planned',
        dinner: selectedDinners.length > 0 ? dinnerMeal : 'No meal planned'
      });
    }

    return weekPlan;
  })() : [
    { day: 'Mon', date: '7', breakfast: 'Avocado Toast', lunch: 'Greek Salad', dinner: 'Pasta Primavera' },
    { day: 'Tue', date: '8', breakfast: 'Chia Pudding', lunch: 'Quinoa Bowl', dinner: 'Stir Fry' },
    { day: 'Wed', date: '9', breakfast: 'French Toast', lunch: 'Soup & Salad', dinner: 'Fish Tacos' },
    { day: 'Thu', date: '10', breakfast: 'Smoothie Bowl', lunch: 'Wrap', dinner: 'Curry' },
    { day: 'Fri', date: '11', breakfast: 'Oatmeal', lunch: 'Buddha Bowl', dinner: 'Pizza Night' },
    { day: 'Sat', date: '12', breakfast: 'Pancakes', lunch: 'Brunch Special', dinner: 'BBQ' },
    { day: 'Sun', date: '13', breakfast: 'Eggs Benedict', lunch: 'Light Salad', dinner: 'Roast Dinner' }
  ];

  const userRecipes: UserRecipe[] = hasData ? (() => {
    const allRecipes = [...meals.breakfast, ...meals.lunch, ...meals.dinner];
    return allRecipes.map(recipe => ({
      id: recipe.url || recipe.name,
      name: recipe.name,
      image: recipe.img,
      portions: recipe.servings,
      ingredients: recipe.ingredients?.map(ing => ing.recipeIngredientName) || [],
      isBookmarked: recipe.isSelected,
      isUserCreated: false,
      tags: [recipe.mealType, ...(recipe.flyerItemsCount > 0 ? ['on-sale'] : [])],
      cookTime: '30 min'
    }));
  })() : [];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = (): string => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserDisplayName = (): string => {
    if (!currentUser?.email) return 'Chef';

    const emailPrefix = currentUser.email.split('@')[0];

    if (emailPrefix.includes('.')) {
      const firstName = emailPrefix.split('.')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }
    if (emailPrefix.includes('_')) {
      const firstName = emailPrefix.split('_')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }

    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  const getCurrentMeal = (): string => {
    const hour = currentTime.getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    return 'dinner';
  };

  const getCurrentMealRecipe = () => {
    if (!hasData || !todaysMeal) return null;

    const currentMealType = getCurrentMeal();
    const currentMealName = todaysMeal[currentMealType as keyof MealPlanDay] as string;

    if (!currentMealName || currentMealName === 'No meal planned') return null;

    // Find the recipe in our meal data that matches the current meal
    const allRecipes = [...meals.breakfast, ...meals.lunch, ...meals.dinner];
    const matchingRecipe = allRecipes.find(recipe =>
      recipe.name === currentMealName &&
      recipe.mealType === currentMealType &&
      recipe.isSelected
    );

    return matchingRecipe;
  };

  const handleStartCooking = () => {
    const currentRecipe = getCurrentMealRecipe();
    if (currentRecipe?.url) {
      // Open the recipe URL in a new tab
      window.open(currentRecipe.url, '_blank');
    } else {
      // Fallback - redirect to meal planning page
      window.location.href = '/plan';
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home, color: 'text-green-600' },
    { id: 'preferences', label: 'Preferences', icon: User, color: 'text-blue-600' },
    { id: 'recipes', label: 'My Recipes', icon: BookOpen, color: 'text-purple-600' },
    { id: 'settings', label: 'Account', icon: Settings, color: 'text-orange-600' }
  ];

  const filteredRecipes = userRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const todaysMeal = weekMealPlan.find(day => day.date === currentTime.getDate().toString());
  const currentMealType = getCurrentMeal();
  const currentMeal = todaysMeal?.[currentMealType as keyof MealPlanDay] as string;

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center" style={bodyFont}>
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading your kitchen...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4" style={bodyFont}>
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4" style={headingFont}>Access Required</h1>
            <p className="text-gray-600 mb-6">Please log in to access your personal dashboard</p>
            <Button
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => window.location.href = '/login'}
            >
              Log In
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const renderOverview = () => {
    if (!hasData) {
      return (
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
            <div className="relative flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={headingFont}>
                  {getGreeting()}, {getUserDisplayName()}! 👋
                </h1>
                <p className="text-white/90 text-lg">Ready to start meal planning?</p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <ChefHat size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Get Started Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4" style={headingFont}>Welcome to Your Kitchen Dashboard!</h2>
            <p className="text-gray-600 text-lg mb-6">
              It looks like you haven&apos;t started meal planning yet. Let&apos;s get you set up with some delicious recipes!
            </p>
            <div className="space-y-4">
              <Button
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = '/plan'}
              >
                🎯 Start Meal Planning
              </Button>
              <p className="text-sm text-gray-500">
                Choose your store, browse recipes, and build your weekly meal plan
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2" style={headingFont}>Plan Your Week</h3>
              <p className="text-sm text-gray-600">Choose recipes for breakfast, lunch, and dinner</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2" style={headingFont}>Save Money</h3>
              <p className="text-sm text-gray-600">Get recipes using items on sale at your local store</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ChefHat size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2" style={headingFont}>Cook & Enjoy</h3>
              <p className="text-sm text-gray-600">Follow step-by-step instructions for delicious meals</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={headingFont}>
                {getGreeting()}, {getUserDisplayName()}! 👋
              </h1>
              <p className="text-white/90 text-lg">Ready to cook something amazing?</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <ChefHat size={40} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats from Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{mealSummary().total}</div>
            <div className="text-sm text-gray-600">Recipes Planned</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">${totals().totalSavings.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Money Saved</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">${totals().saleTotal.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Total Cost</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">Real Data</div>
            <div className="text-sm text-gray-600">Connected</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Meal */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
                <Utensils size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800" style={headingFont}>Right Now</h2>
            </div>
            {currentMeal && currentMeal !== 'No meal planned' ? (
              <div className="space-y-3">
                <p className="text-gray-600">Time for {currentMealType}!</p>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-orange-800 text-lg">{currentMeal}</h3>
                  <p className="text-orange-600 text-sm mt-1">Tap to view recipe & instructions</p>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                  onClick={handleStartCooking}
                >
                  Start Cooking 🍳
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No meal planned right now</p>
                <Button
                  variant="outline"
                  className="hover:bg-blue-50 transition-colors"
                  onClick={() => window.location.href = '/plan'}
                >
                  Plan Today&apos;s Meals
                </Button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800" style={headingFont}>Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-blue-50 transition-colors" onClick={() => window.location.href = '/plan'}>
                <ShoppingCart size={18} className="text-blue-600" />
                View Shopping List
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-purple-50 transition-colors" onClick={() => window.location.href = '/plan'}>
                <Calendar size={18} className="text-purple-600" />
                Edit Meal Plan
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-green-50 transition-colors" onClick={() => window.location.href = '/meal-preferences'}>
                <Settings size={18} className="text-green-600" />
                Manage Food Preferences
              </Button>
            </div>
          </div>
        </div>

        {/* Deals Expiry Alert */}
        <Alert className="bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200">
          <Bell className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Heads up!</strong> Some of your saved deals expire tomorrow. Check your shopping list to make sure you don&apos;t miss out! 🛒
          </AlertDescription>
        </Alert>

        {/* This Week's Meal Plan */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800" style={headingFont}>This Week&apos;s Plan</h2>
            </div>
            <Button variant="outline" size="sm" className="hover:bg-blue-50 transition-colors" onClick={() => window.location.href = '/plan'}>
              <Edit3 size={16} className="mr-2" />
              Edit Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekMealPlan.map((day) => (
              <div key={day.day} className={`rounded-xl p-4 border transition-all duration-300 hover:shadow-md ${
                day.date === currentTime.getDate().toString()
                  ? 'bg-gradient-to-br from-green-100 to-blue-100 border-green-200 ring-2 ring-green-400/50'
                  : 'bg-gray-50/50 border-gray-200 hover:bg-white'
              }`}>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{day.day}</div>
                  <div className={`text-2xl font-bold mb-3 ${
                    day.date === currentTime.getDate().toString() ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {day.date}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="bg-yellow-100 rounded px-2 py-1 text-yellow-800 truncate">
                      {day.breakfast}
                    </div>
                    <div className="bg-blue-100 rounded px-2 py-1 text-blue-800 truncate">
                      {day.lunch}
                    </div>
                    <div className="bg-purple-100 rounded px-2 py-1 text-purple-800 truncate">
                      {day.dinner}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPreferences = () => {
    const summary = preferences.getPreferencesSummary();

    return (
      <div className="space-y-6">
        {/* Main Preferences Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={headingFont}>Food Preferences</h2>
          <p className="text-gray-600 mb-6">
            Manage your dietary preferences, banned ingredients, and meal planning settings.
          </p>
          <Button
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => window.location.href = '/meal-preferences'}
          >
            <Settings size={20} className="mr-2" />
            Manage Preferences
          </Button>
        </div>

        {/* Current Preferences Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4" style={headingFont}>Current Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Banned Ingredients */}
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertCircle size={16} className="text-white" />
                </div>
                <span className="font-medium text-red-800">Banned Ingredients</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{summary.bannedIngredientsCount}</div>
              <div className="text-sm text-red-600">items avoided</div>
            </div>

            {/* Banned Recipes */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <ChefHat size={16} className="text-white" />
                </div>
                <span className="font-medium text-orange-800">Banned Recipes</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{summary.bannedRecipesCount}</div>
              <div className="text-sm text-orange-600">recipes excluded</div>
            </div>

            {/* Max Ingredients */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Settings size={16} className="text-white" />
                </div>
                <span className="font-medium text-blue-800">Max Ingredients</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{summary.maxIngredients}</div>
              <div className="text-sm text-blue-600">per recipe</div>
            </div>

            {/* Price Range */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={16} className="text-white" />
                </div>
                <span className="font-medium text-green-800">Price Range</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {summary.priceRange ? summary.priceRange.replace('Under ', '') : '$10'}
              </div>
              <div className="text-sm text-green-600">max per portion</div>
            </div>
          </div>
        </div>

        {/* Quick Preference Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4" style={headingFont}>Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              onClick={() => window.location.href = '/meal-preferences'}
            >
              <AlertCircle size={24} className="text-red-600" />
              <span className="text-sm font-medium">Manage Banned Items</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
              onClick={() => window.location.href = '/meal-preferences'}
            >
              <Settings size={24} className="text-blue-600" />
              <span className="text-sm font-medium">Recipe Settings</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
              onClick={() => window.location.href = '/meal-preferences'}
            >
              <Bell size={24} className="text-purple-600" />
              <span className="text-sm font-medium">Notifications</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderRecipes = () => (
    <div key={`recipes-${activeSection}`} className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800" style={headingFont}>My Recipe Library</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search recipes, tags, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
          />
        </div>
      </div>

      {/* Recipe Categories */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="rounded-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100">
          <Heart size={14} className="mr-1" />
          Selected ({userRecipes.filter(r => r.isBookmarked).length})
        </Button>
        <Button variant="outline" size="sm" className="rounded-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
          <Plus size={14} className="mr-1" />
          On Sale ({userRecipes.filter(r => r.tags.includes('on-sale')).length})
        </Button>
        <Button variant="outline" size="sm" className="rounded-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
          <Star size={14} className="mr-1" />
          Available ({userRecipes.length})
        </Button>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 relative z-10">
            {recipe.image && (
              <div className="w-full h-48 mb-4 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg mb-2 hover:text-purple-600 transition-colors" style={headingFont}>
                  {recipe.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Utensils size={14} />
                    {recipe.portions} portions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {recipe.cookTime}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {recipe.isBookmarked && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Heart size={14} className="text-purple-600" />
                  </div>
                )}
                {recipe.tags.includes('on-sale') && (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus size={14} className="text-green-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {recipe.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2 h-10 hover:bg-purple-50 transition-colors">
                <Edit3 size={16} />
                View Recipe
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍳</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2" style={headingFont}>No recipes found</h3>
          <p className="text-gray-600">Try adjusting your search or add some new recipes!</p>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
            <Settings size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800" style={headingFont}>Account Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Email Settings */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4" style={headingFont}>Email & Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="flex gap-3">
                  <Input
                    value={currentUser.email || ''}
                    disabled
                    className="flex-1 bg-gray-50"
                  />
                  <Button variant="outline" className="hover:bg-blue-50 transition-colors">
                    Change Email
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="flex gap-3">
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className="flex-1 bg-gray-50"
                  />
                  <Button variant="outline" className="hover:bg-blue-50 transition-colors">
                    Change Password
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4" style={headingFont}>Subscription</h3>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-green-800" style={headingFont}>Free Plan</h4>
                  <p className="text-sm text-green-600">Perfect for getting started</p>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white transition-all duration-300">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4" style={headingFont}>Account Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-blue-50 transition-colors">
                <User size={18} className="text-blue-600" />
                Export My Data
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-amber-50 transition-colors">
                <Bell size={18} className="text-amber-600" />
                Notification Settings
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-red-50 text-red-600 border-red-200 transition-colors">
                <Settings size={18} />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'preferences': return renderPreferences();
      case 'recipes': return renderRecipes();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50" style={bodyFont}>
        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 bg-white/80 backdrop-blur-sm shadow-lg border-r border-white/20 min-h-screen">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center">
                  <ChefHat size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800" style={headingFont}>Dashboard</h2>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                        activeSection === item.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:bg-gray-50 hover:scale-102'
                      }`}
                    >
                      <Icon size={20} className={activeSection === item.id ? 'text-white' : item.color} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 relative z-0">
            <div className="max-w-6xl mx-auto">
              {renderActiveSection()}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-white/20 px-4 py-2">
          <div className="flex justify-around">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white transform scale-110'
                      : 'text-gray-600'
                  }`}
                >
                  <Icon size={20} className={activeSection === item.id ? 'text-white' : item.color} />
                  <span className="text-xs font-medium mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default DashboardPage;
