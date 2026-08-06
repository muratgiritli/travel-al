import { useCallback, useEffect, useState } from 'react';
import {
  RawCountry,
  Category,
  UnauthorizedError,
  getCountries,
  createCountry,
  saveCountry,
} from './api';
import {
  Button,
  Card,
  CATEGORY_OPTIONS,
  categoryLabel,
  Field,
  Label,
  Select,
} from './ui';
import CountryEditor from './CountryEditor';

export default function CountriesTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [countries, setCountries] = useState<RawCountry[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    getCountries()
      .then((d) => setCountries(d.countries))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  if (editingId) {
    return (
      <CountryEditor
        id={editingId}
        onBack={() => setEditingId(null)}
        onSaved={onSaved}
        onError={onError}
        onUnauthorized={onUnauthorized}
        onChanged={load}
      />
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = countries.filter((c) => {
    if (catFilter && c.category !== catFilter) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.iso2.toLowerCase().includes(q) ||
      categoryLabel(c.category).toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Field label="Search" value={search} onChange={setSearch} placeholder="Name, id, ISO2, category…" />
          </div>
          <div className="sm:w-56">
            <Select
              label="Category"
              value={catFilter}
              onChange={setCatFilter}
              options={[{ value: '', label: 'All categories' }, ...CATEGORY_OPTIONS]}
            />
          </div>
          <Button onClick={() => setShowAdd(true)}>+ Add country</Button>
        </div>
      </Card>

      {showAdd && (
        <AddCountry
          onClose={() => setShowAdd(false)}
          onCreated={(id) => {
            setShowAdd(false);
            load();
            setEditingId(id);
          }}
          onError={onError}
          onUnauthorized={onUnauthorized}
        />
      )}

      <Card>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              className="text-left px-3.5 py-3 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer"
              style={{ border: '1px solid #e5e7eb', background: '#fff' }}
              onClick={() => setEditingId(c.id)}
            >
              <div className="text-[14px] font-medium text-gray-800">
                {c.flag_emoji} {c.name}
                {c.is_active === false && <span className="ml-1 text-[11px] text-red-500">(unpublished)</span>}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-between gap-2">
                <span>{categoryLabel(c.category)}</span>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await saveCountry(c.id, { is_active: c.is_active === false });
                      load();
                      onSaved();
                    } catch (err) {
                      if (err instanceof UnauthorizedError) onUnauthorized();
                      else onError((err as Error).message);
                    }
                  }}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full hover:opacity-80"
                  style={c.is_active === false
                    ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
                    : { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                >
                  {c.is_active === false ? 'Publish' : 'Unpublish'}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-gray-400 text-[13px]">No countries match.</p>}
        </div>
      </Card>
    </div>
  );
}

function AddCountry({
  onClose,
  onCreated,
  onError,
  onUnauthorized,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [name, setName] = useState('');
  const [iso2, setIso2] = useState('');
  const [flag, setFlag] = useState('🏳️');
  const [category, setCategory] = useState<Category>('evisa_direct');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) {
      onError('Name is required');
      return;
    }
    setBusy(true);
    try {
      const res = await createCountry({ name: name.trim(), iso2, flag_emoji: flag, category });
      onCreated(res.country.id);
    } catch (err) {
      if (err instanceof UnauthorizedError) onUnauthorized();
      else onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[15px] text-gray-900">New country</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-[13px]">Cancel</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Name" value={name} onChange={setName} checkForbidden />
        <Field label="ISO2" value={iso2} onChange={setIso2} />
        <Field label="Flag emoji" value={flag} onChange={setFlag} />
        <Select
          label="Category"
          value={category}
          onChange={(v) => setCategory(v as Category)}
          options={CATEGORY_OPTIONS}
        />
      </div>
      <div className="mt-4">
        <Label>&nbsp;</Label>
        <Button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create country'}</Button>
      </div>
    </Card>
  );
}
