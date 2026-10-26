import React, { useMemo, useState } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  searchPlaceholder = 'Search…',
  pageSize = 8,
  empty = 'No records found.'
}: {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  pageSize?: number;
  empty?: string;
}) {
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let data = rows;
    if (term) {
      data = rows.filter((row) =>
        columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(term))
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      data = [...data].sort((a, b) => {
        const av = col?.sortValue ? col.sortValue(a) : a[sortKey];
        const bv = col?.sortValue ? col.sortValue(b) : b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [rows, q, sortKey, sortDir, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={searchPlaceholder}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm w-full sm:max-w-xs"
        />
        <div className="text-xs text-slate-500">{filtered.length} records</div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left min-w-[720px]">
          <thead className="bg-[#059669] text-white font-semibold text-[13px]">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="p-3 cursor-pointer select-none" onClick={() => toggleSort(c.key)}>
                  {c.label}
                  {sortKey === c.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
            {slice.length === 0 && (
              <tr>
                <td className="p-8 text-center text-slate-400" colSpan={columns.length}>{empty}</td>
              </tr>
            )}
            {slice.map((row, idx) => (
              <tr key={row.id || row.user_id || row.batch_id || row.inventory_id || idx} className="hover:bg-emerald-50/60">
                {columns.map((c) => (
                  <td key={c.key} className="p-3 align-top">{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 text-xs">
        <button disabled={safePage === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border disabled:opacity-40">Prev</button>
        <span>Page {safePage + 1} / {pages}</span>
        <button disabled={safePage >= pages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
