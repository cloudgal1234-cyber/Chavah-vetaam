import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export const MEDIA_TYPE_LABELS: Record<string, string> = {
  VIDEO: 'סרטון פרסומת AI',
  IMAGE: 'תמונת מוצר',
  AUDIO: 'פסקול',
  UGC: 'מגיש UGC',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  PROCESSING: 'בעיבוד',
  COMPLETED: 'הושלם',
  FAILED: 'נכשל',
  active: 'פעיל',
  draft: 'טיוטה',
};
