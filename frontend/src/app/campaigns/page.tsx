'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Campaign {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  _count: { generations: number };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/campaigns')
      .then((r) => setCampaigns(r.data))
      .catch(() => toast.error('שגיאה בטעינת קמפיינים'))
      .finally(() => setLoading(false));
  }, []);

  const deleteCampaign = async (id: string) => {
    if (!confirm('למחוק את הקמפיין וכל הנכסים שנוצרו?')) return;
    await api.delete(`/api/campaigns/${id}`);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success('הקמפיין נמחק');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">קמפיינים</h1>
        <Link href="/campaigns/new" className="btn-primary">+ קמפיין חדש</Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען…</div>
      ) : campaigns.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📁</p>
          <p className="font-medium">אין קמפיינים עדיין</p>
          <p className="text-sm mt-1">צור את הקמפיין הראשון שלך כדי להתחיל ליצור תוכן AI.</p>
          <Link href="/campaigns/new" className="btn-primary mt-4 inline-flex">בוא נתחיל</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <Link href={`/campaigns/${c.id}`} className="font-semibold text-gray-900 hover:text-brand-600 hover:underline">
                  {c.title}
                </Link>
                {c.description && <p className="text-sm text-gray-500 truncate mt-0.5">{c.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{formatDate(c.createdAt)}</span>
                  <span>·</span>
                  <span>{c._count.generations} יצירות</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mr-4">
                <Link href={`/campaigns/${c.id}`} className="btn-secondary text-xs">פתח</Link>
                <button onClick={() => deleteCampaign(c.id)} className="btn-secondary text-xs text-red-500 hover:border-red-200 hover:bg-red-50">מחק</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
