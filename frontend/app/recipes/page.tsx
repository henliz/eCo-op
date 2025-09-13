'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RecipeViewer } from '@/components/meal-planner/RecipeViewer';

// Minimal base-recipe type (unpriced)
type BaseRecipe = {
  id: string;
  name: string;
  portions: number;
  ingredients: { name: string; quantity?: number; unit?: string; type?: string }[];
  url?: string;
  img?: string;
  tags?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  visibility?: 'private' | 'public';
};

type RecipesListResponse =
  | { data?: BaseRecipe[] }           // controller could wrap
  | BaseRecipe[];                     // or return a bare array

export default function RecipesPage() {
  const { makeAPICall, currentUser } = useAuth();

  const [recipes, setRecipes] = useState<BaseRecipe[]>([]);
  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // server-side search (debounced)
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const normalize = (resp: RecipesListResponse): BaseRecipe[] =>
    Array.isArray(resp) ? resp : Array.isArray(resp?.data) ? resp.data! : [];

  const fetchPage = async (nextOffset: number, opts?: { reset?: boolean; q?: string }) => {
    const q = (opts?.q ?? debouncedQuery).trim();
    setLoading(true);
    setError(null);
    try {
      // If your backend has a global prefix, change to `/api/user-preferences/...`
      const base = q.length >= 2
        ? `/user-preferences/recipes/search?q=${encodeURIComponent(q)}`
        : `/user-preferences/recipes/available`;
      const sep = base.includes('?') ? '&' : '?';
      const endpoint = `${base}${sep}limit=${limit}&offset=${nextOffset}`;

      const resp = (await makeAPICall(endpoint, 'GET', null, true)) as RecipesListResponse;
      const batch = normalize(resp).map(r => ({
        ...r,
        createdAt: r.createdAt ? String(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? String(r.updatedAt) : undefined,
      }));

      setRecipes(prev =>
        opts?.reset || nextOffset === 0
          ? batch
          : [...prev, ...batch.filter(n => !prev.some(p => p.id === n.id))]
      );

      // The service doesn’t return a total; infer pagination from page size
      setHasMore(batch.length === limit);
      setOffset(nextOffset + batch.length); // advance by actual page size
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Initial load (and when auth changes)
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchPage(0, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Re-run when the debounced search changes
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchPage(0, { reset: true, q: debouncedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-3">Browse Recipes</h1>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Search by name, tag, or ingredient…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="flex-1" />
        <Button variant="outline" disabled={loading} onClick={() => fetchPage(0, { reset: true, q: debouncedQuery })}>
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Grid */}
      {recipes.length === 0 && !loading ? (
        <div className="text-gray-600">
          {debouncedQuery ? 'No recipes matched your search.' : 'No recipes found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}

      {/* Load more */}
      <div className="flex justify-center mt-4">
        <Button onClick={() => fetchPage(offset)} disabled={loading || !hasMore}>
          {loading ? 'Loading…' : hasMore ? 'Load more' : 'All caught up'}
        </Button>
      </div>
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: BaseRecipe }) {
  const ingredients = useMemo(
    () =>
      (recipe.ingredients || []).map((ing) =>
        [ing.name, ing.quantity != null ? `— ${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}` : '']
          .filter(Boolean)
          .join(' ')
      ),
    [recipe.ingredients]
  );

  return (
    <Card className="p-3 flex gap-3">
      {/* thumb */}
      <div className="w-24 h-24 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
        {recipe.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.img} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
        )}
      </div>

      {/* meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-medium truncate">{recipe.name}</h2>
          <span className="text-xs text-gray-500 whitespace-nowrap">Serves {recipe.portions}</span>
        </div>

        {/* tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {recipe.tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2">
          <RecipeViewer title={recipe.name} url={recipe.url || '#'} ingredients={ingredients} />
        </div>
      </div>
    </Card>
  );
}
