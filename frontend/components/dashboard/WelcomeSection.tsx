// components/dashboard/WelcomeSection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Crown, Star } from 'lucide-react';

interface WelcomeSectionProps {
  hasData: boolean;
  userName: string;
  greeting: string;
  subscriptionTier?: 'free' | 'premium'; // Add subscription tier prop
}

// Subscription badge component
const SubscriptionBadge: React.FC<{ tier: 'free' | 'premium' }> = ({ tier }) => {
  if (tier === 'premium') {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
        <Crown size={14} />
        <span>Premium</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
      <Star size={14} />
      <span>Free Plan</span>
    </div>
  );
};

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  hasData,
  userName,
  greeting,
  subscriptionTier = 'free' // Default to free if not provided
}) => {
  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

          {/* Subscription Badge - Top Right */}
          <div className="absolute top-4 right-4">
            <SubscriptionBadge tier={subscriptionTier} />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {greeting}, {userName}! 👋
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Your Kitchen Dashboard!</h2>
          <p className="text-gray-600 text-lg mb-6">
            It looks like you haven&apos;t started meal planning yet. Let&apos;s get you set up with some delicious recipes!
          </p>
          <div className="space-y-4">
            <Button
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => window.location.href = '/plan?tab=plan'}
            >
              🎯 Start Meal Planning
            </Button>
            <p className="text-sm text-gray-500">
              Choose your store, browse recipes, and build your weekly meal plan
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-3xl p-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

      {/* Subscription Badge - Top Right */}
      <div className="absolute top-4 right-4">
        <SubscriptionBadge tier={subscriptionTier} />
      </div>

      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {userName}! 👋
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
  );
};