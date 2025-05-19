'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { usePlannerStore } from './usePlannerStore';
import { StoreCard } from './StoreCard';

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

  // State for search filter
  const [searchTerm, setSearchTerm] = React.useState('');

  // Discover stores on component mount
  useEffect(() => {
    if (!isStoresLoaded && !isLoading) {
      discoverStores();
    }
  }, [isStoresLoaded, isLoading, discoverStores]);

  const handleStoreSelect = (storeId: string) => {
    console.log("Selected store:", storeId);
    setSelectedStore(storeId);

    // Signal that we should navigate to the Plan tab after loading
    shouldNavigateToPlan.current = true;

    // Add a short delay then explicitly trigger fetchMealData
    setTimeout(() => {
      usePlannerStore.getState().fetchMealData();
    }, 100);
  };

  // Sort stores: available first, then alphabetically, then filter by search term
  const filteredStores = [...availableStores]
    .sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .filter(store => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        store.name.toLowerCase().includes(searchLower) ||
        store.location.toLowerCase().includes(searchLower) ||
        store.id.toLowerCase().includes(searchLower) ||
        (store.filename && store.filename.toLowerCase().includes(searchLower))
      );
    });

  return (
    <div className="bg-white rounded-xl py-2 px-5 mb-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800">Local Store</h3>
        </div>

        {/* Search input */}
        {isStoresLoaded && !isLoading && (
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stores..."
              className="pl-8 pr-4 py-1 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && !isStoresLoaded ? (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Discovering available stores...</p>
        </div>
      ) : (
        <div className="store-columns">
          {/* First card is robot */}
          <div className="store-card bg-teal-50 rounded-[30px] p-4 flex flex-col items-center justify-center">
            <Image
              src="/Robo_Chef.png"
              alt="Friendly chef robot"
              width={150}
              height={150}
              className="mx-auto"
            />
            <div className="mt-3 text-center">
              {isStoresLoaded && (
                <p className="text-gray-700 font-medium text-lg">
                  {availableStores.filter(s => s.isAvailable).length} stores available
                </p>
              )}
            </div>
          </div>

          {/* Store cards */}
          {filteredStores.map(store => (
            <div key={store.id} className="store-card">
              <StoreCard
                store={store}
                isSelected={selectedStore === store.id}
                disabled={!store.isAvailable}
                onClick={() => store.isAvailable && handleStoreSelect(store.id)}
              />
            </div>
          ))}

          {/* No results message */}
          {filteredStores.length === 0 && searchTerm && (
            <div className="store-card bg-gray-50 rounded-[30px] p-4 text-center">
              <p className="text-gray-500">No stores match your search for &ldquo;{searchTerm}&rdquo;</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-teal-600 hover:text-teal-800 text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {isStoresLoaded && availableStores.length === 0 && (
        <div className="text-center p-4 bg-gray-100 rounded-lg mt-4">
          <p className="text-gray-700">No stores with current sales were found. Please check back later.</p>
        </div>
      )}

      {/* Loading indicator for store data */}
      {isLoading && selectedStore && (
        <div className="flex justify-center mt-4 mb-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading meal deals for {availableStores.find(s => s.id === selectedStore)?.name}...</p>
        </div>
      )}

      {/* CSS for column-based layout */}
      <style jsx>{`
        .store-columns {
          column-count: 2; /* Default to 2 columns on mobile */
          column-gap: 12px;
          width: 100%;
        }
        
        .store-card {
          break-inside: avoid;
          margin-bottom: 12px;
          display: inline-block;
          width: 100%;
        }
        
        /* Very small screens: 1 column */
        @media (max-width: 480px) {
          .store-columns {
            column-count: 1;
          }
        }
        
        /* Desktop: 3 columns */
        @media (min-width: 768px) {
          .store-columns {
            column-count: 3;
          }
        }
      `}</style>
    </div>
  );
}