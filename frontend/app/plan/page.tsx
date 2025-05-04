'use client';

import React from 'react';
import { MealPlanScreen } from '@/components/meal-planner/MealPlanScreen';
import { GroceryScreen } from '@/components/meal-planner/GroceryScreen';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MealPlannerPage() {

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <Tabs defaultValue="plan" className="h-full">
        <div className="sticky top-0 z-20 bg-white">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="plan">Meal Plan</TabsTrigger>
            <TabsTrigger value="groceries">Groceries</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="plan" className="overflow-y-auto">
          <MealPlanScreen />
        </TabsContent>
        <TabsContent value="groceries" className="overflow-y-auto">
          <GroceryScreen />
        </TabsContent>
      </Tabs>
    </div>
  );
}