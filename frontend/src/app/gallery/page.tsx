'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDate, MEDIA_TYPE_LABELS, STATUS_COLORS } from '@/lib/utils';

interface Generation {
  id: string; mediaType: string; status: string; resultUrl?: string;
  thumbnailUrl?: string; creditsUsed: number; createdAt: string;
  campaign: { id: string; title: string };
}

const FILTERS = ['ALL', 'VIDEO', 'IMAGE', 'AUDIO', 'UGC'] as const;

export default function GalleryPage() {
  const [items, setItems] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filter !== 'ALL') params.set('mediaType', filter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);

    api.get(`/api/generations?${params}`)
      .then((r) => { setItems(r.data.items); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [filter, statusFilter, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gallery</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} asset{total !== 1 ? 's' : ''} generated</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary">+ New Campaign</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {f === 'ALL' ? 'All Types' : MEDIA_TYPE_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {['ALL', 'COMPLETED', 'PROCESSING', 'FAILED'].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${statusFilter === s ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading gallery…</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-2">🖼️</p>
          <p>No assets found. Try adjusting filters or <Link href="/campaigns/new" className="text-brand-600 hover:underline">create a campaign</Link>.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((g) => (
              <div key={g.id} className="card overflow-hidden group">
                <div className="h-40 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-5xl relative">
                  {g.mediaType === 'VIDEO' || g.mediaType === 'UGC' ? '🎬' : g.mediaType === 'IMAGE' ? '📸' : '🎵'}
                  {g.status === 'COMPLETED' && g.resultUrl && (
                    <a href={g.resultUrl} target="_blank" rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm font-medium rounded-t-xl">
                      Download ↓
                    </a>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{MEDIA_TYPE_LABELS[g.mediaType]}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[g.status]}`}>{g.status}</span>
                  </div>
                  <Link href={`/campaigns/${g.campaign.id}`} className="text-xs text-gray-400 hover:text-brand-600 truncate block">
                    {g.campaign.title}
                  </Link>
                  <p className="text-xs text-gray-300 mt-1">{formatDate(g.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
              <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="btn-secondary text-sm disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
