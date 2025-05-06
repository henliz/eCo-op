'use client';

import React from 'react';
import Image from 'next/image';
import { usePlannerStore } from './usePlannerStore';

export default function StoreSelector() {
  const {
    selectedStore,
    setSelectedStore,
    fetchMealData,
    isLoading,
    error,
    isDataLoaded,
    availableStores
  } = usePlannerStore();

  // Handle store selection
  const handleStoreSelect = (storeId: string) => {
    setSelectedStore(storeId);
    if (!isDataLoaded) {
      fetchMealData();
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="bg-[#5BC4B4] rounded-lg px-6 py-4 mb-8">
          <h2 className="font-bold text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl leading-snug">
            Where are you shopping today?
          </h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Content with image and buttons - with clear spacing */}
        <div className="flex flex-col md:flex-row items-start gap-8 py-8">
          {/* Robot image */}
          <div className="text-center">
            <Image
              src="/Robo_Chef.png"
              alt="Friendly chef robot"
              width={180}
              height={180}
              className="mx-auto"
            />
            {/* Legend button showing what grey means */}
            <div className="mt-4 text-center">
              <button
                className="
                  px-6 py-3 rounded-full text-center text-lg font-medium
                  bg-gray-200 text-gray-500 opacity-70 cursor-default
                "
              >
                Coming Soon
              </button>
              <p className="mt-2 text-gray-600">Greyed stores are not yet available</p>
            </div>
          </div>

          {/* Store buttons - in a separate container with explicit spacing */}
          <div className="mt-8 md:mt-0">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              {availableStores.map(store => (
                <button
                  key={store.id}
                  onClick={() => store.isAvailable && handleStoreSelect(store.id)}
                  className={`
                    px-6 py-3 rounded-full text-center text-lg font-medium
                    transition
                    ${selectedStore === store.id
                      ? 'bg-blue-600 text-white'
                      : store.isAvailable
                        ? 'bg-orange-200 text-gray-800 hover:bg-orange-300'
                        : 'bg-gray-200 text-gray-500'}
                    ${!store.isAvailable ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                  disabled={!store.isAvailable}
                >
                  {store.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading store data...</p>
          </div>
        )}

        {/* Selected store info */}
        {selectedStore && !isLoading && isDataLoaded && (
          <div className="text-center mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-gray-700">
              You&apos;ve selected <span className="font-bold">
                {availableStores.find(s => s.id === selectedStore)?.name}
              </span>.
              <br />
              Now you can proceed to the &quot;Pick Meals&quot; tab to start planning your meals!
            </p>
          </div>
        )}

        {/* No store selected prompt */}
        {!selectedStore && !isLoading && (
          <div className="text-center mt-6 p-4 bg-orange-50 rounded-lg text-gray-700">
            Please select a store to view available meal plans
          </div>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-8 text-xs text-gray-400 border-t pt-4">
            <p>Debug: {selectedStore ? 'Store selected' : 'No store'} |
              {isLoading ? 'Loading' : 'Not loading'} |
              {isDataLoaded ? 'Data loaded' : 'No data'} |
              {error ? `Error: ${error}` : 'No error'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}