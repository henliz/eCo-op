'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminGate } from '@/components/admin/AdminGate';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

type AdminRecipe = {
  id: string;
  name: string;
  portions: number;
  tags?: string[];
  status?: 'draft' | 'validated';
  img?: string;
  url?: string;
  updatedAt?: unknown;
  visibility?: 'public' | 'private';
};

type ListResponse = { data: AdminRecipe[]; limit: number; offset: number; total: number };

type UpsertRecipeDto = {
  id?: string;
  name: string;
  portions: number;
  ingredients: { name: string; quantity?: number; unit?: string; type?: string }[];
  url?: string;
  img?: string;
  tags?: string[];
  status?: 'draft' | 'validated';
  visibility?: 'public' | 'private';
};

export default function AdminRecipesPage() {
  return (
    <AdminGate>
      <RecipesInner />
    </AdminGate>
  );
}

const normalizeImageSrc = (src?: string) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  return src.startsWith('/') ? src : `/${src}`;
};

function RecipesInner() {
  const { makeAPICall } = useAuth();

  // list state
  const [items, setItems] = useState<AdminRecipe[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<'all' | 'draft' | 'validated'>('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // modal/form state
  const [editing, setEditing] = useState<UpsertRecipeDto | null>(null);

  const hasMore = items.length < total;

  const fetchPage = async (nextOffset: number) => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(nextOffset));
      if (status !== 'all') params.set('status', status);

      const res: ListResponse = await makeAPICall(`/admin/recipes?${params.toString()}`, 'GET', null, true);
      if (!res || !Array.isArray(res.data)) throw new Error('Bad response');

      setItems(prev => nextOffset === 0 ? res.data : [...prev, ...res.data]);
      setTotal(res.total ?? res.data.length);
      setOffset(nextOffset + limit);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const loadRemainingPages = async () => {
    // Load until we've fetched everything (to make client contains-search complete)
    if (loading) return;
    let next = offset;
    while (items.length < total) {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String(next));
        if (status !== 'all') params.set('status', status);

        const res: ListResponse = await makeAPICall(`/admin/recipes?${params.toString()}`, 'GET', null, true);
        if (!res || !Array.isArray(res.data)) break;
        setItems(prev => [...prev, ...res.data]);
        setTotal(res.total ?? res.data.length);
        next += limit;
        setOffset(next);
      } catch {
        break;
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // initial load
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hasQuery = q.trim().length > 0;
    if (hasQuery && items.length < total) {
      // fire & forget; we already show a spinner via loading state
      void loadRemainingPages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    // reset and refetch when status changes
    setItems([]);
    setTotal(0);
    setOffset(0);
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (editing) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [editing]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const qq = q.toLowerCase();
    return items.filter(r =>
      r.name.toLowerCase().includes(qq) || (r.tags ?? []).some(t => t.toLowerCase().includes(qq))
    );
  }, [items, q]);

  const onCreate = () => {
    setEditing({
      name: '',
      portions: 4,
      ingredients: [],
      tags: [],
      status: 'draft',
      visibility: 'public',
    });
  };

  const onEdit = async (r: AdminRecipe) => {
    try {
      // If you already have GET /admin/recipes/:id, use it:
      const full = await makeAPICall(`/admin/recipes/${r.id}`, 'GET', null, true) as {
        id: string;
        name: string;
        portions: number;
        img?: string;
        url?: string;
        tags?: string[];
        status?: 'draft' | 'validated';
        visibility?: 'public' | 'private';
        ingredients?: { name: string; quantity?: number; unit?: string; type?: string }[];
      };

      setEditing({
        id: full.id,
        name: full.name,
        portions: full.portions,
        img: full.img,
        url: full.url,
        tags: full.tags ?? [],
        status: full.status ?? 'draft',
        visibility: full.visibility ?? 'public',
        ingredients: full.ingredients ?? [],
      });
    } catch {
      // Fallback to what we have if single fetch isn’t implemented yet
      setEditing({
        id: r.id,
        name: r.name,
        portions: r.portions,
        ingredients: [],
        tags: r.tags ?? [],
        status: r.status ?? 'draft',
        url: r.url,
        img: r.img,
        visibility: r.visibility ?? 'public',
      });
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return;
    await makeAPICall(`/admin/recipes/${id}`, 'DELETE', null, true);
    setItems(prev => prev.filter(x => x.id !== id));
    setTotal(prev => Math.max(0, prev - 1));
  };

  const onPublish = async (id: string) => {
    await makeAPICall(`/admin/recipes/${id}/publish`, 'POST', null, true);
    setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'validated' } : x));
  };

  const onUnpublish = async (id: string) => {
    await makeAPICall(`/admin/recipes/${id}/unpublish`, 'POST', null, true);
    setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'draft' } : x));
  };

  const onSave = async (dto: UpsertRecipeDto) => {
    if (dto.id) {
      await makeAPICall(`/admin/recipes/${dto.id}`, 'PUT', dto, true);
      setItems(prev => prev.map(x => x.id === dto.id ? { ...x, ...dto } as AdminRecipe : x));
    } else {
      const res = await makeAPICall(`/admin/recipes`, 'POST', dto, true) as { id: string };
      setItems(prev => [{ id: res.id, name: dto.name, portions: dto.portions, tags: dto.tags, status: dto.status, img: dto.img, url: dto.url }, ...prev]);
      setTotal(prev => prev + 1);
    }
    setEditing(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Admin · Recipes</h1>

      {/* controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <Input
          placeholder="Search…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value as 'all' | 'draft' | 'validated')}
          className="border rounded px-2 py-1"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="validated">Published</option>
        </select>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => fetchPage(0)} disabled={loading}>Refresh</Button>
        <Button onClick={onCreate}>New Recipe</Button>
      </div>

      {err && <div className="text-red-600 mb-2">{err}</div>}

      {/* list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(r => (
            <Card key={r.id} className="p-3 flex gap-3">
              <div className="w-20 h-20 rounded bg-gray-100 overflow-hidden relative flex-shrink-0">
                {r.img ? (
                    (() => {
                      const safe = normalizeImageSrc(r.img);
                      return safe ? (
                          <Image
                              src={safe}
                              alt={r.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                              // skip Next optimizer for remote URLs until domains are configured
                              unoptimized={safe.startsWith('http')}
                          />
                      ) : (
                          <div className="w-full h-full grid place-items-center text-xs text-gray-400">No image</div>
                      );
                    })()
                ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-gray-400">No image</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {(r.visibility ?? 'public')}{' · '}{(r.status ?? 'draft')}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-0.5">Serves {r.portions}</div>
                {r.tags && r.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.tags.map(t => <span key={t}
                                             className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200">{t}</span>)}
                    </div>
                )}
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(r)}>Edit</Button>
                  {r.status === 'validated'
                      ? <Button size="sm" variant="outline" onClick={() => onUnpublish(r.id)}>Unpublish</Button>
                      : <Button size="sm" variant="outline" onClick={() => onPublish(r.id)}>Publish</Button>}
                  <Button size="sm" variant="destructive" onClick={() => onDelete(r.id)}>Delete</Button>
                </div>
              </div>
            </Card>
        ))}
      </div>

      {/* pagination */}
      <div className="flex justify-center mt-4">
        <Button onClick={() => fetchPage(offset)} disabled={loading || !hasMore}>
          {loading ? 'Loading…' : hasMore ? 'Load more' : 'All caught up'}
        </Button>
      </div>

      {/* modal */}
      {editing && (
          <EditModal
              initial={editing}
              onCancel={() => setEditing(null)}
              onSave={onSave}
          />
      )}
    </div>
  );
}

function EditModal({
                     initial,
                     onCancel,
                     onSave,
                   }: {
  initial: UpsertRecipeDto;
  onCancel: () => void;
  onSave: (dto: UpsertRecipeDto) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [portions, setPortions] = useState(initial.portions);
  const [img, setImg] = useState(initial.img ?? '');
  const [url, setUrl] = useState(initial.url ?? '');
  const [tags, setTags] = useState((initial.tags ?? []).join(', '));
  const [status, setStatus] = useState<NonNullable<UpsertRecipeDto['status']>>(initial.status ?? 'draft');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<NonNullable<UpsertRecipeDto['visibility']>>(initial.visibility ?? 'public');

  type Ingredient = { name: string; quantity?: number; unit?: string; type?: string };
  const [ings, setIngs] = useState<Ingredient[]>(initial.ingredients ?? []);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const dto: UpsertRecipeDto = {
        id: initial.id,
        name: name.trim(),
        portions: Number(portions || 0),
        img: img.trim() || undefined,
        url: url.trim() || undefined,
        tags: tags.split(',').map(s => s.trim()).filter(Boolean),
        status,
        visibility,     // <-- include
        ingredients: ings, // <-- include
      };
      await onSave(dto);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* backdrop (click to close) */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* modal shell */}
      <div className="relative mx-4 my-8 w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* header (sticky) */}
          <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {initial.id ? 'Edit Recipe' : 'New Recipe'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className="px-2 py-1 rounded hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          {/* scrollable body */}
          <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
            {err && <div className="text-red-600 mb-2">{err}</div>}

            <div className="grid gap-2">
              <label className="text-sm">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} />

              <label className="text-sm mt-2">Portions</label>
              <Input
                type="number"
                value={portions}
                onChange={e => setPortions(Number(e.target.value))}
              />

              <label className="text-sm mt-2">Image URL</label>
              <Input value={img} onChange={e => setImg(e.target.value)} />

              <label className="text-sm mt-2">Source URL</label>
              <Input value={url} onChange={e => setUrl(e.target.value)} />

              <label className="text-sm mt-2">Tags (comma-separated)</label>
              <Input value={tags} onChange={e => setTags(e.target.value)} />

              <label className="text-sm mt-2">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'draft' | 'validated')}
                className="border rounded px-2 py-1"
              >
                <option value="draft">Draft</option>
                <option value="validated">Published</option>
              </select>

              <label className="text-sm mt-2">Visibility</label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as 'public' | 'private')}
                className="border rounded px-2 py-1"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>

              <label className="text-sm mt-2">Ingredients</label>
              <IngredientsEditor value={ings} onChange={setIngs} />
            </div>
          </div>

          {/* footer (sticky) */}
          <div className="sticky bottom-0 z-10 bg-white border-t px-4 py-3 flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IngredientsEditor({
                             value,
                             onChange,
                           }: {
  value: { name: string; quantity?: number; unit?: string; type?: string }[];
  onChange: (v: { name: string; quantity?: number; unit?: string; type?: string }[]) => void;
}) {
  const addRow = () => onChange([...value, { name: '', quantity: undefined, unit: '' }]);
  const removeRow = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const patch = (i: number, p: Partial<{ name: string; quantity?: number; unit?: string; type?: string }>) =>
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...p } : row)));

  return (
    <div className="border rounded-md p-2">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-sm">Ingredients ({value.length})</div>
        <button type="button" className="text-sm px-2 py-1 rounded bg-gray-100" onClick={addRow}>
          + Add
        </button>
      </div>
      <div className="grid gap-2">
        {value.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input
              className="col-span-5 border rounded px-2 py-1"
              placeholder="name"
              value={row.name}
              onChange={(e) => patch(i, { name: e.target.value })}
            />
            <input
              className="col-span-2 border rounded px-2 py-1"
              type="number"
              placeholder="qty"
              value={row.quantity ?? ''}
              onChange={(e) => patch(i, { quantity: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
            <input
              className="col-span-3 border rounded px-2 py-1"
              placeholder="unit"
              value={row.unit ?? ''}
              onChange={(e) => patch(i, { unit: e.target.value })}
            />
            <button
              type="button"
              className="col-span-2 text-sm px-2 py-1 rounded bg-red-50 text-red-700"
              onClick={() => removeRow(i)}
            >
              Remove
            </button>
          </div>
        ))}
        {value.length === 0 && <div className="text-xs text-gray-500 italic">No ingredients yet.</div>}
      </div>
    </div>
  );
}
