'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePlannerStore } from './usePlannerStore';
import { format } from 'date-fns';

// The parent page will pass this ref so we can set it when a store is selected
interface StoreSelectorProps {
  shouldNavigateToPlan: React.MutableRefObject<boolean>;
}

export default function StoreSelector({ shouldNavigateToPlan }: StoreSelectorProps) {
  const {
    selectedStore,
    setSelectedStore,
    isLoading,
    error,
    availableStores,
    isStoresLoaded,
    discoverStores
  } = usePlannerStore();

  // Discover stores on component mount
  useEffect(() => {
    if (!isStoresLoaded && !isLoading) {
      discoverStores();
    }
  }, [isStoresLoaded, isLoading, discoverStores]);

  const handleStoreSelect = (storeId: string) => {
    setSelectedStore(storeId);

    // Signal that we should navigate to the Plan tab after loading
    shouldNavigateToPlan.current = true;

    // Add a short delay then explicitly trigger fetchMealData
    setTimeout(() => {
      usePlannerStore.getState().fetchMealData();
    }, 100);
  };

  return (
    <motion.section
      className="py-2 bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="container mx-auto">
        {/* Error message */}
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
        )}

        {/* MOBILE-ONLY: flex-row below md; desktop still flex-col→md:flex-row */}
        <div className="flex flex-row md:flex-col md:flex-row items-start gap-5 py-4">
          {/* Robot image */}
          <div className="w-1/3 text-center flex-shrink-0">
            <Image
              src="/Robo_Chef.png"
              alt="Friendly chef robot"
              width={190}
              height={190}
              className="mx-auto"
            />
            {/* Show count of available stores */}
            <div className="mt-4 text-center">
              {isStoresLoaded && (
                <p className="text-gray-700 font-medium">
                  {availableStores.filter(s => s.isAvailable).length} stores available
                </p>
              )}
              <p className="mt-2 text-gray-600">
                {isStoresLoaded ?
                  "Select a store to see deals and plan meals" :
                  "Checking for stores with current deals..."}
              </p>
            </div>
          </div>

          {/* Store buttons */}
          <div className="w-2/3">
            {isLoading && !isStoresLoaded ? (
              <div className="flex justify-center mt-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-600">Discovering available stores...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableStores
                    .sort((a, b) => (a.isAvailable === b.isAvailable) ? 0 : a.isAvailable ? -1 : 1)
                    .map(store => (
                    <button
                      key={store.id}
                      onClick={() => store.isAvailable && handleStoreSelect(store.id)}
                      disabled={!store.isAvailable}
                      className={`
                        flex flex-col items-start justify-center w-full
                        px-6 py-3 rounded-[30px] text-lg font-medium transition
                        ${selectedStore === store.id
                          ? 'bg-[#5BC4B4] text-white'
                          : store.isAvailable
                            ? 'bg-orange-200 text-gray-800 hover:bg-orange-300'
                            : 'bg-gray-200 text-gray-500'}
                        ${!store.isAvailable ? 'opacity-70 cursor-not-allowed' : ''}
                      `}
                    >
                      <span className="text-lg">{store.name}</span>
                      <span className="text-sm">{store.location}</span>
                      <span className="text-xs mt-1">
                        {store.isAvailable
                          ? `Deals expire ${format(store.validUntil, 'MMM d, yyyy')}`
                          : `Deals ended ${format(store.validUntil, 'MMM d, yyyy')}`}
                      </span>
                    </button>
                  ))}
                </div>

                {isStoresLoaded && availableStores.length === 0 && (
                  <div className="text-center p-4 bg-gray-100 rounded-lg mt-4">
                    <p className="text-gray-700">No stores with current sales were found. Please check back later.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Loading indicator for store data */}
        {isLoading && selectedStore && (
          <div className="flex justify-center mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading meal deals for {availableStores.find(s => s.id === selectedStore)?.name}...</p>
          </div>
        )}

      </div>
    </motion.section>
  );
}