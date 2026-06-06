'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface FormData {
  title: string;
  description: string;
  targetAudience: string;
  script: string;
  productImageUrl: string;
}

export default function NewCampaignPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    try {
      const { data: campaign } = await api.post('/api/campaigns', data);
      toast.success('הקמפיין נוצר!');
      router.push(`/campaigns/${campaign.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'שגיאה ביצירת קמפיין');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">קמפיין חדש</h1>
        <p className="text-gray-500 text-sm mt-1">מלא את פרטי המוצר או השירות כדי להתחיל ליצור תוכן AI.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם הקמפיין *</label>
          <input className="input" placeholder="השקת קיץ" {...register('title', { required: 'חובה להזין שם' })} />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המוצר / השירות</label>
          <textarea className="input min-h-[80px] resize-y" placeholder="תאר את המוצר או השירות ויתרונותיו…" {...register('description')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">קהל יעד</label>
          <input className="input" placeholder="גילאים 25-40, חובבי כושר, שוק ישראלי" {...register('targetAudience')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תסריט / טקסט בסיס ל-AI</label>
          <textarea className="input min-h-[100px] resize-y" placeholder="כתוב את המסר העיקרי שה-AI ישתמש בו ליצירת התוכן…" {...register('script')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">קישור לתמונה (מוצר / שירות / לוגו)</label>
          <input className="input" placeholder="https://example.com/image.jpg" {...register('productImageUrl')} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'יוצר…' : 'צור קמפיין'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">ביטול</button>
        </div>
      </form>
    </div>
  );
}
