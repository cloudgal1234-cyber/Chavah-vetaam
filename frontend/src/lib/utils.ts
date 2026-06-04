import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCredits(n: number) {
  return n.toLocaleString();
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export const MEDIA_TYPE_LABELS: Record<string, string> = {
  VIDEO: 'AI Video Ad',
  IMAGE: 'Product Photo',
  AUDIO: 'Voiceover',
  UGC: 'UGC Presenter',
};

export const MEDIA_TYPE_COSTS: Record<string, number> = {
  VIDEO: 20,
  IMAGE: 5,
  AUDIO: 8,
  UGC: 15,
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};
