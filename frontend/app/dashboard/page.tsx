// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Import custom hooks
import { usePreferences } from '@/hooks/usePreferences';
import { useAppDataLoader } from '@/hooks/useAppDataLoader';

// Import components
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { WeeklyPlan } from '@/components/dashboard/WeeklyPlan';
import { ShoppingList } from '@/components/dashboard/ShoppingList';
import { PreferencesOverview } from '@/components/dashboard/PreferencesOverview';
import { RecipeLibrary } from '@/components/dashboard/RecipeLibrary';

// Import planner stores
import { usePlannerStores } from "@/stores/usePlannerStores";

import {
  Home,
  User,
  BookOpen,
  Settings,
  ChefHat,
  ChevronRight
} from 'lucide-react';

// Menu configuration
const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home, color: 'text-green-600' },
  { id: 'preferences', label: 'Preferences', icon: User, color: 'text-blue-600' },
  { id: 'recipes', label: 'My Recipes', icon: BookOpen, color: 'text-purple-600' },
  { id: 'settings', label: 'Account', icon: Settings, color: 'text-orange-600' }
];

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const currentTime = new Date();

  // Centralized data loading
  const { loadData, isLoaded } = useAppDataLoader();

  useEffect(() => {
    if (currentUser && !isLoaded) {
      loadData('auto');
    }
  }, [currentUser, isLoaded, loadData]);


  // Get all data from centralized stores
  const {
    meals,
    mealSummary,
    totals,
    getSelectedStore,
    normalMealServings,
  } = usePlannerStores();

  const selectedStoreObject = getSelectedStore();

  // Calculate hasData directly here
  const hasData = Boolean(
    selectedStoreObject ||
    (meals && ((meals.breakfast?.length || 0) + (meals.lunch?.length || 0) + (meals.dinner?.length || 0)) > 0)
  );

  const { summary, preferencesData, subscriptionTier } = usePreferences();


  // Helper functions
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

  // Mobile-optimized renderOverview function with summary cards
  const renderOverview = () => {
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-4 lg:px-0">
        {/* Welcome Section */}
        <WelcomeSection
          hasData={hasData}
          userName={getUserDisplayName()}
          greeting={getGreeting()}
          subscriptionTier={subscriptionTier}
        />

        {/* Primary Cards - Stacked on mobile, side-by-side on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WeeklyPlan
            hasData={hasData}
            meals={meals}
            selectedStore={selectedStoreObject || undefined}
            totals={totals}
            mealSummary={mealSummary}
          />
          <ShoppingList
            hasData={hasData}
            totals={totals}
            mealSummary={mealSummary}
          />
        </div>

        {/* Summary Navigation Cards - Consistent styling with main cards */}
        <div className="space-y-4">
          {/* Preferences Summary Card */}
          <div
            onClick={() => setActiveSection('preferences')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">My Preferences</h2>
              </div>
              <div className="text-gray-400">
                <ChevronRight size={20} />
              </div>
            </div>

            <div className="space-y-3">
              {/* Household Size */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Household Size:</span>
                <span className="text-sm font-medium text-gray-800">{normalMealServings || 2} people</span>
              </div>

              {/* Local Store */}
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-600">Local Store:</span>
                <div className="text-right">
                  {selectedStoreObject ? (
                    <>
                      <span className="text-sm font-medium text-gray-800">{selectedStoreObject.name}</span>
                      <div className="text-xs text-gray-500">{selectedStoreObject.location}</div>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-gray-800">None selected</span>
                  )}
                </div>
              </div>

              {/* Blocked Ingredients */}
              {summary && summary.bannedIngredientsCount > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Blocked Ingredients:</span>
                    <span className="text-sm font-medium text-gray-800">{summary.bannedIngredientsCount} items</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {preferencesData?.bannedIngredients?.slice(0, 3).map((ingredientName, index) => (
                      <span key={index} className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                        {ingredientName}
                      </span>
                    ))}
                    {(preferencesData?.bannedIngredients?.length || 0) > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">+{(preferencesData?.bannedIngredients?.length || 0) - 3} more</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Blocked Ingredients:</span>
                  <span className="text-sm text-gray-500 italic">None</span>
                </div>
              )}
            </div>
          </div>

          {/* Recipe Library Summary Card */}
          <div
            onClick={() => setActiveSection('recipes')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                  <BookOpen size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">My Recipe Collection</h2>
              </div>
              <div className="text-gray-400">
                <ChevronRight size={20} />
              </div>
            </div>

            <div className="space-y-3">
              {/* Recipe counts by meal type */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{meals?.breakfast?.length || 0}</div>
                  <div className="text-xs text-gray-600">Breakfast</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{meals?.lunch?.length || 0}</div>
                  <div className="text-xs text-gray-600">Lunch</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{meals?.dinner?.length || 0}</div>
                  <div className="text-xs text-gray-600">Dinner</div>
                </div>
              </div>

              {/* Total summary */}
              <div className="pt-3 border-t border-gray-200 text-center">
                <div className="text-sm text-gray-600">
                  {hasData ? `${(meals?.breakfast?.length || 0) + (meals?.lunch?.length || 0) + (meals?.dinner?.length || 0)} total recipes available` : 'Start building your collection'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreferences = () => (
    <PreferencesOverview summary={summary} />
  );

  const renderRecipes = () => (
    <RecipeLibrary hasData={hasData} meals={meals} />
  );

  const renderSettings = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
          <Settings size={20} className="text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Account Settings</h2>
      </div>
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Account settings coming soon!</p>
        <p className="text-sm text-gray-500">Email: {currentUser?.email}</p>
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

  // Loading state
  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading your kitchen...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return (
      <>
        <Header />
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h1>
            <p className="text-gray-600 mb-6">Please log in to access your personal dashboard</p>
            <Button
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => router.push('/login')}

            >
              Log In
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="flex">

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 bg-white/80 backdrop-blur-sm shadow-lg border-r border-white/20 min-h-screen overflow-x-clip">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div
                    className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center">
                  <ChefHat size={20} className="text-white"/>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
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
                                  : 'text-gray-700 hover:bg-gray-50 hover:scale-[1.02]'
                          }`}
                      >
                        <Icon size={20} className={activeSection === item.id ? 'text-white' : item.color}/>
                        <span className="font-medium">{item.label}</span>
                      </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="container mx-auto p-1">
              <div className="pt-4 lg:pt-8 pb-10 lg:pb-4 px-0 sm:px-0 lg:px-6 relative z-0">
                <div className="max-w-7xl mx-auto">
                  {renderActiveSection()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-white/20 px-4 py-2 overflow-x-clip">
          <div className="flex justify-around">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                  <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                          activeSection === item.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ring-2 ring-offset-2 ring-orange-400 shadow-md'
                              : 'text-gray-600'
                      }`}
                  >
                    <Icon size={20} className={activeSection === item.id ? 'text-white' : item.color}/>
                    <span className="text-xs font-medium mt-1">{item.label}</span>
                  </button>
              );
            })}
          </div>
        </div>
      </div>

      <Footer/>
    </>
  );
};

export default DashboardPage;