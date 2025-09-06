'use client';
//import { useStoreLocationStore } from '@/stores/useStoreLocationStore';
import { useStoreLocationStore } from "@/stores";

import { useUserPreferencesStore } from '@/stores/useUserPreferencesStore';

export const StoreTest = () => {
  const storeLocation = useStoreLocationStore();
  const preferences = useUserPreferencesStore();

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3>Store Test</h3>
      <p>Available stores: {storeLocation.availableStores.length}</p>
      <p>Selected store: {storeLocation.selectedStore || 'None'}</p>
      <p>Banned ingredients: {preferences.getBannedIngredientsCount()}</p>

      <button
        onClick={() => storeLocation.discoverStores()}
        className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
      >
        Discover Stores
      </button>

      <button
        onClick={() => preferences.addBannedIngredient('peanuts')}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Ban Peanuts
      </button>
    </div>
  );
};