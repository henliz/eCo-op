'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { usePlannerStore, type Recipe } from './usePlannerStore';
import { Combobox } from '@headlessui/react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const placeholderImage = '/Robo_Research.png';

export function CookScreen() {
  const [choice, setChoice] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const { selectedMeals, meals } = usePlannerStore();

  // Gather selected recipes
  const selectedRecipes = useMemo<Recipe[]>(() => {
    const all: Recipe[] = [...meals.breakfast, ...meals.lunch, ...meals.dinner];
    return all.filter(r => selectedMeals.has(r.url));
  }, [selectedMeals, meals]);

  // Recipe names
  const options = useMemo<string[]>(() => selectedRecipes.map(r => r.name), [selectedRecipes]);

  // Filtered by search query
  const filteredOptions = useMemo<string[]>(() => {
    return options.filter(name =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Selected recipe object
  const chosenRecipe = useMemo<Recipe | undefined>(
    () => selectedRecipes.find(r => r.name === choice),
    [choice, selectedRecipes]
  );

  // Reset error/loading when choice changes
  useEffect(() => {
    setIframeError(false);
    setIframeLoaded(false);
  }, [choice]);

  // HEAD request to check embedding policy
  useEffect(() => {
    if (!chosenRecipe) return;
    fetch(chosenRecipe.url, { method: 'HEAD' })
      .then(res => {
        const xfo = res.headers.get('x-frame-options') || '';
        const csp = res.headers.get('content-security-policy') || '';
        if (/deny|sameorigin/i.test(xfo) || /frame-ancestors\s+'none'/i.test(csp)) {
          setIframeError(true);
        }
      })
      .catch(() => setIframeError(true));
  }, [chosenRecipe]);

  // Proxy URL for iframe
  const iframeSrc = chosenRecipe
    ? `/api/proxy?url=${encodeURIComponent(chosenRecipe.url)}`
    : '';

  return (
    <div className="flex flex-col items-center mt-8 space-y-6">
      {/* Avatar and searchable combobox */}
      <div className="flex items-start space-x-4">
        <Image
          src={placeholderImage}
          alt="Chef"
          width={45}
          height={45}
          className="rounded-full"
        />
        <div className="relative bg-blue-100 border border-blue-200 p-4 rounded-xl max-w-xs w-full">
          {/* Bubble tail */}
          <div className="absolute -left-3 top-8 w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-r-6 border-r-blue-100" />
          <Combobox value={choice} onChange={(val) => setChoice(val ?? '')} nullable>
            <Combobox.Label className="block text-gray-700 font-medium mb-2">
              {choice ? `Cooking: ${choice}` : 'What are we cooking today?'}
            </Combobox.Label>
            <Combobox.Input
              className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
              displayValue={(name: string) => name}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={options.length ? 'Type or select a meal...' : 'No recipes selected'}
            />
            <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(name => (
                  <Combobox.Option
                    key={name}
                    value={name}
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 ${
                        active ? 'bg-blue-200' : ''
                      }`
                    }
                  >
                    {name}
                  </Combobox.Option>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500">No matches found.</div>
              )}
            </Combobox.Options>
          </Combobox>
        </div>
      </div>

      {/* Display iframe or fallback */}
      {choice && chosenRecipe ? (
        <div className="w-full max-w-3xl relative">
          {!iframeError && (
            <iframe
              src={iframeSrc}
              title={chosenRecipe.name}
              className="w-full h-[60vh] border rounded overflow-hidden"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeError(true)}
            />
          )}
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <p className="text-gray-500">Loading recipe preview...</p>
            </div>
          )}
          {iframeError && (
            <div className="bg-amber-50 p-6 rounded-md flex flex-col gap-4">
              <div className="flex items-start gap-3 text-amber-700">
                <AlertCircle size={24} />
                <span className="text-sm">
                  Oops! We couldn&apos;t embed this recipe here. You can still support the home cook below.
                </span>
              </div>
              <Button
                onClick={() => window.open(chosenRecipe.url, '_blank')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 flex items-center justify-center gap-2"
              >
                <ExternalLink size={20} />
                Visit Full Recipe
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600 text-center">Select a recipe to begin cooking.</p>
      )}
    </div>
  );
}
