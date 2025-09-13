'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Density = {
  gramsPerCup?: number;
  gramsPerUnit?: Record<string, number>;
};

type IngredientDTO = {
  id?: string;
  name: string;
  category?: string;
  aliases?: string[];
  density: Density; // required on create
  status?: 'draft' | 'validated';
  source?: string;
  updatedAt?: unknown;
};

type ListResp = {
  data: IngredientDTO[];
  total?: number;
  limit?: number;
  offset?: number;
};

// small helper to coerce backend payloads safely (handles both raw doc and { data: doc })
function normalize(dto: unknown): IngredientDTO {
  const root = (dto ?? {}) as Record<string, unknown>;
  const obj =
    root && typeof root === 'object' && root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;

  const densityObj = (obj.density ?? {}) as Record<string, unknown>;
  const gramsPerCup =
    typeof densityObj.gramsPerCup === 'number'
      ? densityObj.gramsPerCup
      : undefined;

  const gpuRaw = densityObj.gramsPerUnit as Record<string, unknown> | undefined;
  const gramsPerUnit =
    gpuRaw && typeof gpuRaw === 'object'
      ? Object.fromEntries(
          Object.entries(gpuRaw).flatMap(([k, v]) =>
            typeof v === 'number' ? [[k, v]] : []
          )
        )
      : undefined;

  return {
    id: typeof obj.id === 'string' ? obj.id : undefined,
    name: typeof obj.name === 'string' ? obj.name : '',
    category: typeof obj.category === 'string' ? obj.category : 'food',
    aliases: Array.isArray(obj.aliases)
      ? (obj.aliases as unknown[]).flatMap((a) =>
          typeof a === 'string' ? [a] : []
        )
      : [],
    density: { gramsPerCup, gramsPerUnit },
    status:
      obj.status === 'draft' || obj.status === 'validated'
        ? obj.status
        : 'draft',
    source: typeof obj.source === 'string' ? obj.source : 'admin',
    updatedAt: obj.updatedAt,
  };
}

export default function AdminIngredientsPage() {
  const { makeAPICall, currentUser } = useAuth();
  const [items, setItems] = useState<IngredientDTO[]>([]);
  const [query, setQuery] = useState('');
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<IngredientDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const inName = (it.name || '').toLowerCase().includes(q);
      const inAliases = (it.aliases || []).some((a) =>
        (a || '').toLowerCase().includes(q)
      );
      return inName || inAliases;
    });
  }, [items, query]);

  const hasMore = total == null ? true : items.length < total;

  const loadPage = async (nextOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        limit: String(limit),
        offset: String(nextOffset),
      });
      if (query.trim()) qs.set('q', query.trim());
      const resp = (await makeAPICall(
        `/admin/ingredients?${qs.toString()}`,
        'GET',
        null,
        true
      )) as ListResp;

      const batch = (resp?.data || []).map(normalize);
      setItems((prev) => (nextOffset === 0 ? batch : [...prev, ...batch]));
      setTotal(typeof resp?.total === 'number' ? resp.total : null);
      setOffset(nextOffset + limit);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || 'Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Admin — Ingredients</h1>

      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Search name or alias…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={() => loadPage(0)} disabled={loading}>
          Refresh
        </Button>
        <div className="flex-1" />
        <Button
          onClick={() =>
            setEditing({
              name: '',
              category: 'food',
              aliases: [],
              density: { gramsPerCup: undefined, gramsPerUnit: {} },
              status: 'draft',
              source: 'admin',
            })
          }
        >
          New
        </Button>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      <div className="grid gap-2">
        {filtered.map((it) => (
          <Card key={it.id ?? it.name} className="p-3 flex items-start justify-between">
            <div className="min-w-0">
              <div className="font-medium truncate">{it.name || '—'}</div>
              {!!(it.aliases?.length) && (
                <div className="text-xs text-gray-600 truncate">
                  Aliases: {it.aliases.join(', ')}
                </div>
              )}
              <div className="text-xs text-gray-600">
                Density: {it.density?.gramsPerCup ? `${it.density.gramsPerCup} g/cup` : '—'}
              </div>
              {!!it.density?.gramsPerUnit && Object.keys(it.density.gramsPerUnit).length > 0 && (
                <div className="text-[11px] text-gray-500 truncate">
                  Units:{' '}
                  {Object.entries(it.density.gramsPerUnit)
                    .map(([k, v]) => `${k}=${v}g`)
                    .join(', ')}
                </div>
              )}
              {it.status && (
                <div className="text-[11px] text-gray-500">Status: {it.status}</div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!it.id) {
                    setEditing(it);
                    return;
                  }
                  try {
                    const fresh = await makeAPICall(
                      `/admin/ingredients/${it.id}`,
                      'GET',
                      null,
                      true
                    );
                    setEditing(normalize(fresh));
                  } catch {
                    setEditing(it);
                  }
                }}
              >
                Edit
              </Button>
              {it.id && (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!confirm(`Delete "${it.name}"?`)) return;
                    await makeAPICall(
                      `/admin/ingredients/${it.id}`,
                      'DELETE',
                      null,
                      true
                    );
                    setItems((prev) => prev.filter((x) => x.id !== it.id));
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <Button onClick={() => loadPage(offset)} disabled={loading || !hasMore}>
          {loading ? 'Loading…' : hasMore ? 'Load more' : 'All caught up'}
        </Button>
      </div>

      {editing && (
        <EditModal
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            setItems((prev) => {
              const idx = saved.id ? prev.findIndex((p) => p.id === saved.id) : -1;
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = saved;
                return copy;
              }
              return [saved, ...prev];
            });
          }}
          makeAPICall={makeAPICall}
        />
      )}
    </div>
  );
}

function EditModal({
  initial,
  onCancel,
  onSaved,
  makeAPICall,
}: {
  initial: IngredientDTO;
  onCancel: () => void;
  onSaved: (p: IngredientDTO) => void;
  makeAPICall: (
    endpoint: string,
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
    useAuth?: boolean
  ) => Promise<unknown>;
}) {
  const [name, setName] = useState(initial.name || '');
  const [category, setCategory] = useState(initial.category || 'food');
  const [aliasesText, setAliasesText] = useState(
    (initial.aliases || []).join(', ')
  );
  const [gramsPerCup, setGramsPerCup] = useState<number | ''>(
    typeof initial.density?.gramsPerCup === 'number'
      ? initial.density.gramsPerCup
      : ''
  );
  const [rows, setRows] = useState<Array<{ unit: string; grams: number | '' }>>(
    Object.entries(initial.density?.gramsPerUnit || {}).map(([unit, grams]) => ({
      unit,
      grams,
    }))
  );
  const [status, setStatus] = useState<'draft' | 'validated'>(
    initial.status || 'draft'
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addRow = () => setRows((prev) => [...prev, { unit: '', grams: '' }]);
  const removeRow = (i: number) =>
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<{ unit: string; grams: number | '' }>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const aliases = aliasesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const gramsPerUnit: Record<string, number> = {};
      rows.forEach(({ unit, grams }) => {
        const key = unit.trim().toLowerCase().replace(/\s+/g, '_');
        const val = typeof grams === 'string' ? Number(grams) : grams;
        if (key && Number.isFinite(val)) gramsPerUnit[key] = val as number;
      });

      const density: Density = {};
      if (gramsPerCup !== '' && Number.isFinite(Number(gramsPerCup))) {
        density.gramsPerCup = Number(gramsPerCup);
      }
      if (Object.keys(gramsPerUnit).length > 0) density.gramsPerUnit = gramsPerUnit;

      if (density.gramsPerCup == null && !density.gramsPerUnit) {
        throw new Error(
          'Please provide density: grams per cup and/or at least one grams-per-unit row.'
        );
      }

      const body: IngredientDTO = {
        name,
        category,
        aliases,
        density,
        status,
        source: 'admin',
      };

      const endpoint = initial.id
        ? `/admin/ingredients/${initial.id}`
        : `/admin/ingredients`;
      const method = initial.id ? 'PUT' : 'POST';

      const resp = (await makeAPICall(
        endpoint,
        method,
        body,
        true
      )) as Record<string, unknown>;
      const id =
        initial.id ??
        (typeof resp?.id === 'string' ? (resp.id as string) : undefined);

      // read fresh copy for consistent list mapping (supports raw doc or { data })
      const fresh = (await makeAPICall(
        `/admin/ingredients/${id}`,
        'GET',
        null,
        true
      )) as unknown;

      onSaved(normalize(fresh));
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* click-away */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      {/* modal */}
      <div className="relative mx-4 my-8 w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* sticky header */}
          <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
            <h2 className="text-lg font-semibold">
              {initial.id ? 'Edit Ingredient' : 'New Ingredient'}
            </h2>
          </div>

          {/* scrollable body */}
          <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
            {err && <div className="text-red-600 mb-2">{err}</div>}

            <label className="text-sm">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />

            <label className="text-sm mt-2">Category</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., food"
            />

            <label className="text-sm mt-2">Aliases (comma-separated)</label>
            <Input
              value={aliasesText}
              onChange={(e) => setAliasesText(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-sm">Grams per Cup</label>
                <Input
                  type="number"
                  value={gramsPerCup}
                  onChange={(e) =>
                    setGramsPerCup(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="self-end text-xs text-gray-500">
                Provide this and/or rows below.
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">Grams per Unit (rows)</label>
                <Button variant="outline" size="sm" onClick={addRow}>
                  Add row
                </Button>
              </div>
              <div className="mt-2 grid gap-2">
                {rows.map((r, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                  >
                    <Input
                      placeholder="unit key (e.g., whole, tbsp)"
                      value={r.unit}
                      onChange={(e) => updateRow(i, { unit: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="grams"
                      value={r.grams === '' ? '' : String(r.grams)}
                      onChange={(e) =>
                        updateRow(i, {
                          grams:
                            e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                    />
                    <Button variant="ghost" onClick={() => removeRow(i)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <label className="text-sm mt-3">Status</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={status === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatus('draft')}
              >
                Draft
              </Button>
              <Button
                variant={status === 'validated' ? 'default' : 'outline'}
                onClick={() => setStatus('validated')}
              >
                Validated
              </Button>
            </div>
          </div>

          {/* sticky footer */}
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
