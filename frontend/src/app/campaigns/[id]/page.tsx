'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatDate, MEDIA_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils';

interface Campaign {
  id: string; title: string; description?: string; targetAudience?: string;
  script?: string; productImageUrl?: string; status: string; createdAt: string;
  generations: Generation[];
}
interface Generation {
  id: string; mediaType: string; status: string; resultUrl?: string;
  thumbnailUrl?: string; creditsUsed: number; createdAt: string; errorMessage?: string;
}

const MEDIA_TYPES = ['VIDEO', 'IMAGE', 'AUDIO', 'UGC'] as const;

const MEDIA_TYPE_ICONS: Record<string, string> = {
  VIDEO: '🎬',
  IMAGE: '📸',
  AUDIO: '🎵',
  UGC: '🤳',
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const fetchCampaign = useCallback(() => {
    api.get(`/api/campaigns/${id}`).then((r) => setCampaign(r.data));
  }, [id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  useEffect(() => {
    if (!pollingId) return;
    const interval = setInterval(async () => {
      const { data } = await api.get(`/api/generations/${pollingId}`);
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(interval);
        setPollingId(null);
        setGenerating(null);
        fetchCampaign();
        refreshUser();
        if (data.status === 'COMPLETED') toast.success('היצירה הושלמה! 🎉');
        else toast.error('היצירה נכשלה');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingId, fetchCampaign, refreshUser]);

  const startGeneration = async (mediaType: string) => {
    setGenerating(mediaType);
    try {
      const { data } = await api.post('/api/generations', { campaignId: id, mediaType });
      toast.success(`${MEDIA_TYPE_LABELS[mediaType]} — מתחיל ליצור`);
      setPollingId(data.id);
      fetchCampaign();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'שגיאה בהפעלת היצירה');
      setGenerating(null);
    }
  };

  if (!campaign) return <div className="p-8 text-gray-400">טוען קמפיין…</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/campaigns" className="text-sm text-brand-600 hover:underline">→ קמפיינים</Link>
          <h1 className="text-2xl font-bold mt-1">{campaign.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">נוצר {formatDate(campaign.createdAt)}</p>
        </div>
      </div>

      <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaign.productImageUrl && (
          <img src={campaign.productImageUrl} alt="מוצר" className="w-full rounded-lg object-cover max-h-48 border border-gray-200" />
        )}
        <div className="space-y-3">
          {campaign.description && (
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">תיאור</p><p className="text-sm text-gray-700 mt-1">{campaign.description}</p></div>
          )}
          {campaign.targetAudience && (
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">קהל יעד</p><p className="text-sm text-gray-700 mt-1">{campaign.targetAudience}</p></div>
          )}
          {campaign.script && (
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">תסריט</p><p className="text-sm text-gray-700 mt-1 italic">&ldquo;{campaign.script}&rdquo;</p></div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ייצר תוכן AI</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MEDIA_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => startGeneration(type)}
              disabled={!!generating}
              className="card p-4 text-right hover:border-brand-400 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-2xl mb-2">{MEDIA_TYPE_ICONS[type]}</div>
              <p className="font-medium text-sm">{MEDIA_TYPE_LABELS[type]}</p>
              <p className="text-xs text-green-600 font-medium mt-0.5">חינם ♾️</p>
              {generating === type && <p className="text-xs text-brand-500 mt-1 font-medium animate-pulse">מייצר…</p>}
            </button>
          ))}
        </div>
      </div>

      {campaign.generations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">נכסים שנוצרו ({campaign.generations.length})</h2>
          <div className="space-y-3">
            {campaign.generations.map((g) => (
              <div key={g.id} className="card p-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {MEDIA_TYPE_ICONS[g.mediaType] ?? '🎬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{MEDIA_TYPE_LABELS[g.mediaType]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[g.status]}`}>{STATUS_LABELS[g.status] ?? g.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(g.createdAt)}</p>
                  {g.errorMessage && <p className="text-xs text-red-500 mt-0.5">{g.errorMessage}</p>}
                </div>
                {g.status === 'COMPLETED' && g.resultUrl && (
                  <a href={g.resultUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex-shrink-0">
                    הורד
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
