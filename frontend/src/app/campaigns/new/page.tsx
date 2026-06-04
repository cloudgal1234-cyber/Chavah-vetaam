'use client';
import { useState } from 'react';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => v && formData.append(k, v));
      if (imageFile) formData.append('productImage', imageFile);

      const { data: campaign } = await api.post('/api/campaigns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

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
        <p className="text-gray-500 text-sm mt-1">מלא את פרטי המוצר כדי להתחיל ליצור תוכן AI.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם הקמפיין *</label>
          <input className="input" placeholder="השקת מוצר קיץ" {...register('title', { required: 'חובה להזין שם' })} />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המוצר</label>
          <textarea className="input min-h-[80px] resize-y" placeholder="תאר את המוצר ויתרונותיו…" {...register('description')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">קהל יעד</label>
          <input className="input" placeholder="גילאים 25-40, חובבי כושר, שוק ישראלי" {...register('targetAudience')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תסריט / טקסט לפסקול</label>
          <textarea className="input min-h-[100px] resize-y" placeholder="כתוב את הטקסט שמגיש ה-AI יגיד…" {...register('script')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תמונת מוצר</label>
          <div className="flex items-start gap-4">
            <label className="btn-secondary cursor-pointer">
              העלה תמונה
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="תצוגה מקדימה" className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
            )}
          </div>
          {!imageFile && (
            <div className="mt-2">
              <input className="input" placeholder="או הדבק קישור לתמונה" {...register('productImageUrl')} />
            </div>
          )}
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
