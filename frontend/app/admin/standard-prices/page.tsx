'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

/** Backend DTO shape */
type StdPriceDTO = {
  id?: string;
  standard_name: string;
  standard_price: number; // dollars
  unit_size?: number | string;
  unit_type?: string;
  source?: string;
  status?: 'draft' | 'validated' | string; // backend might send unexpected values
  updatedAt?: unknown;
};

/** UI shape (normalized) */
type StdPrice = {
  id?: string;
  name: string;
  price: number; // dollars
  unitSize?: number;
  unitType?: string;
  source?: string;
  status?: 'draft' | 'validated';
  updatedAt?: unknown;
};

type ListRespDTO = {
  data: StdPriceDTO[];
  total?: number;
  limit?: number;
  offset?: number;
};

/** Auth context call signature (narrowed) */
type MakeAPICall = (
  endpoint: string,
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  useAuth?: boolean
) => Promise<unknown>;

/** Convert backend -> UI */
function normalize(dto: StdPriceDTO): StdPrice {
  const status =
    dto.status === 'draft' || dto.status === 'validated' ? dto.status : 'draft';

  return {
    id: dto.id,
    name: dto.standard_name ?? '',
    price:
      typeof dto.standard_price === 'number'
        ? dto.standard_price
        : Number(dto.standard_price ?? 0),
    unitSize:
      typeof dto.unit_size === 'number'
        ? dto.unit_size
        : dto.unit_size != null
        ? Number(dto.unit_size)
        : undefined,
    unitType: dto.unit_type || undefined,
    source: dto.source || undefined,
    status,
    updatedAt: dto.updatedAt,
  };
}

/** Convert UI -> backend */
function toDto(u: StdPrice): StdPriceDTO {
  return {
    id: u.id,
    standard_name: u.name,
    standard_price: Number.isFinite(u.price) ? Number(u.price) : 0,
    unit_size:
      u.unitSize != null && Number.isFinite(Number(u.unitSize))
        ? Number(u.unitSize)
        : undefined,
    unit_type: u.unitType || undefined,
    source: u.source || undefined,
    status: u.status || 'draft',
  };
}

export default function AdminStandardPricesPage() {
  const { makeAPICall, currentUser } = useAuth();
  const call = makeAPICall as MakeAPICall;

  const [items, setItems] = useState<StdPrice[]>([]);
  const [query, setQuery] = useState('');
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<StdPrice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [items, query]);

  const hasMore = total == null ? true : items.length < total;

  const loadPage = async (nextOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('limit', String(limit));
      qs.set('offset', String(nextOffset));
      if (query.trim()) qs.set('q', query.trim());

      const resp = (await call(
        `/admin/standard-prices?${qs.toString()}`,
        'GET',
        null,
        true
      )) as ListRespDTO;

      const batch = (resp?.data ?? []).map(normalize);
      setItems((prev) => (nextOffset === 0 ? batch : [...prev, ...batch]));
      setTotal(typeof resp?.total === 'number' ? resp.total : null);
      setOffset(nextOffset + limit);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Admin — Standard Prices</h1>

      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Search name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={() => loadPage(0)} disabled={loading}>
          Refresh
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setEditing({ name: '', price: 0, unitType: 'each' })}>
          New
        </Button>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      <div className="grid gap-2">
        {filtered.map((p) => (
          <Card key={p.id ?? p.name} className="p-3 flex items-start justify-between">
            <div className="min-w-0">
              <div className="font-medium truncate">{p.name || '—'}</div>
              <div className="text-xs text-gray-600">
                Unit:{' '}
                {p.unitSize != null
                  ? `${p.unitSize}${p.unitType ? ` ${p.unitType}` : ''}`
                  : p.unitType
                  ? p.unitType
                  : '—'}
              </div>
              <div className="text-xs text-gray-600">
                Price:{' '}
                {Number.isFinite(p.price) ? `$${p.price.toFixed(2)}` : '—'}
              </div>
              {p.source && (
                <div className="text-[11px] text-gray-500 truncate">
                  Source: {p.source}
                </div>
              )}
              {p.status && (
                <div className="text-[11px] text-gray-500 truncate">
                  Status: {p.status}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!p.id) {
                    setEditing(p);
                    return;
                  }
                  try {
                    const fresh = (await call(
                      `/admin/standard-prices/${p.id}`,
                      'GET',
                      null,
                      true
                    )) as StdPriceDTO;
                    setEditing(normalize(fresh));
                  } catch {
                    // Fall back to current if detail 404s
                    setEditing(p);
                  }
                }}
              >
                Edit
              </Button>
              {p.id && (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!confirm(`Delete price for "${p.name}"?`)) return;
                    await call(`/admin/standard-prices/${p.id}`, 'DELETE', null, true);
                    setItems((prev) => prev.filter((x) => x.id !== p.id));
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
              const idx = prev.findIndex((x) => x.id === saved.id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = saved;
                return copy;
              }
              return [saved, ...prev];
            });
          }}
          makeAPICall={call}
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
  initial: StdPrice;
  onCancel: () => void;
  onSaved: (p: StdPrice) => void;
  makeAPICall: MakeAPICall;
}) {
  const [name, setName] = useState(initial.name || '');
  const [unitType, setUnitType] = useState(initial.unitType || 'each');
  const [unitSize, setUnitSize] = useState<number | undefined>(initial.unitSize);
  const [price, setPrice] = useState<number>(
    Number.isFinite(initial.price) ? initial.price : 0
  );
  const [source, setSource] = useState(initial.source || '');
  const [status, setStatus] = useState<StdPrice['status']>(
    initial.status || 'draft'
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const bodyDto = toDto({
        id: initial.id,
        name,
        price: Number(price || 0),
        unitType: unitType || undefined,
        unitSize:
          unitSize != null && Number.isFinite(Number(unitSize))
            ? Number(unitSize)
            : undefined,
        source: source.trim() || undefined,
        status,
      });

      const endpoint = initial.id
        ? `/admin/standard-prices/${initial.id}`
        : `/admin/standard-prices`;
      const method: 'POST' | 'PUT' = initial.id ? 'PUT' : 'POST';

      const res = await makeAPICall(endpoint, method, bodyDto, true);
      const resId =
        (res as { id?: string } | null | undefined)?.id ?? initial.id;

      // fetch fresh detail (ensures server-normalized data)
      const freshDto = (await makeAPICall(
        `/admin/standard-prices/${resId}`,
        'GET',
        null,
        true
      )) as StdPriceDTO;

      onSaved(normalize(freshDto));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // keep the modal scrollable and buttons sticky (same pattern we used elsewhere)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div className="relative mx-4 my-8 w-full max-w-xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
            <h2 className="text-lg font-semibold">
              {initial.id ? 'Edit Standard Price' : 'New Standard Price'}
            </h2>
          </div>

          <div className="px-4 py-3 max-h-[70vh] overflow-y-auto space-y-2">
            {err && <div className="text-red-600 mb-2">{err}</div>}

            <div>
              <label className="text-sm">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Unit Size</label>
                <Input
                  type="number"
                  value={unitSize ?? ''}
                  onChange={(e) =>
                    setUnitSize(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="e.g., 454"
                />
              </div>
              <div>
                <label className="text-sm">Unit Type</label>
                <Input
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  placeholder="e.g., g, ml, oz, each"
                />
              </div>
            </div>

            <div>
              <label className="text-sm">Price (USD)</label>
              <Input
                type="number"
                step="0.01"
                value={Number.isFinite(price) ? String(price) : ''}
                onChange={(e) =>
                  setPrice(e.target.value === '' ? 0 : Number(e.target.value))
                }
              />
            </div>

            <div>
              <label className="text-sm">Source (optional)</label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} />
            </div>

            <div>
              <label className="text-sm">Status</label>
              <select
                className="w-full border rounded-md h-9 px-3 text-sm"
                value={status ?? 'draft'}
                onChange={(e) =>
                  setStatus(
                    e.target.value === 'validated' ? 'validated' : 'draft'
                  )
                }
              >
                <option value="draft">draft</option>
                <option value="validated">validated</option>
              </select>
            </div>
          </div>

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
