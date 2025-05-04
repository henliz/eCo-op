'use client';

import React from 'react';
import { MealPlanScreen } from '@/components/meal-planner/MealPlanScreen';
import { GroceryScreen } from '@/components/meal-planner/GroceryScreen';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MealPlannerPage() {

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="plan">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="plan">Meal Plan</TabsTrigger>
          <TabsTrigger value="groceries">Groceries</TabsTrigger>
        </TabsList>
        <TabsContent value="plan">
          <MealPlanScreen />
        </TabsContent>
        <TabsContent value="groceries">
          <GroceryScreen />
        </TabsContent>
      </Tabs>
    </div>
  );
}