"use client";
import RecipeSelector from "@/components/RecipeSelector";   // see note ↓

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <RecipeSelector />
    </main>
  );
}
