'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatDate, MEDIA_TYPE_LABELS, MEDIA_TYPE_COSTS, STATUS_COLORS } from '@/lib/utils';

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

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const fetchCampaign = useCallback(() => {
    api.get(`/api/campaigns/${id}`).then((r) => setCampaign(r.data));
  }, [id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  // Poll a pending generation every 3s
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
        if (data.status === 'COMPLETED') toast.success('Generation complete!');
        else toast.error('Generation failed — credits refunded');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingId, fetchCampaign, refreshUser]);

  const startGeneration = async (mediaType: string) => {
    const cost = MEDIA_TYPE_COSTS[mediaType];
    if ((user?.credits ?? 0) < cost) {
      toast.error(`Not enough credits. Need ${cost}, have ${user?.credits}.`);
      return;
    }
    setGenerating(mediaType);
    try {
      const { data } = await api.post('/api/generations', { campaignId: id, mediaType });
      toast.success(`${MEDIA_TYPE_LABELS[mediaType]} started — ${cost} credits used`);
      setPollingId(data.id);
      fetchCampaign();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start generation');
      setGenerating(null);
    }
  };

  if (!campaign) return <div className="p-8 text-gray-400">Loading campaign…</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/campaigns" className="text-sm text-brand-600 hover:underline">← Campaigns</Link>
          <h1 className="text-2xl font-bold mt-1">{campaign.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Created {formatDate(campaign.createdAt)}</p>
        </div>
      </div>

      {/* Campaign details */}
      <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaign.productImageUrl && (
          <img src={campaign.productImageUrl} alt="Product" className="w-full rounded-lg object-cover max-h-48 border border-gray-200" />
        )}
        <div className="space-y-3">
          {campaign.description && (
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">Description</p><p className="text-sm text-gray-700 mt-1">{campaign.description}</p></div>
          )}
          {campaign.targetAudience && (
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">Target Audience</p><p className="text-sm text-gray-700 mt-1">{campaign.targetAudience}</p></div>
          )}
          {campaign.script && (
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">Script</p><p className="text-sm text-gray-700 mt-1 italic">"{campaign.script}"</p></div>
          )}
        </div>
      </div>

      {/* Generation buttons */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Generate AI Content</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MEDIA_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => startGeneration(type)}
              disabled={!!generating}
              className="card p-4 text-left hover:border-brand-400 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-2xl mb-2">
                {type === 'VIDEO' ? '🎬' : type === 'IMAGE' ? '📸' : type === 'AUDIO' ? '🎵' : '🤳'}
              </div>
              <p className="font-medium text-sm">{MEDIA_TYPE_LABELS[type]}</p>
              <p className="text-xs text-gray-400 mt-0.5">{MEDIA_TYPE_COSTS[type]} credits</p>
              {generating === type && <p className="text-xs text-brand-500 mt-1 font-medium animate-pulse">Generating…</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Generated assets */}
      {campaign.generations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Generated Assets ({campaign.generations.length})</h2>
          <div className="space-y-3">
            {campaign.generations.map((g) => (
              <div key={g.id} className="card p-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {g.mediaType === 'VIDEO' || g.mediaType === 'UGC' ? '🎬' : g.mediaType === 'IMAGE' ? '📸' : '🎵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{MEDIA_TYPE_LABELS[g.mediaType]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[g.status]}`}>{g.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(g.createdAt)} · {g.creditsUsed} credits</p>
                  {g.errorMessage && <p className="text-xs text-red-500 mt-0.5">{g.errorMessage}</p>}
                </div>
                {g.status === 'COMPLETED' && g.resultUrl && (
                  <a href={g.resultUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex-shrink-0">
                    Download
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
