'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';

const ERROR_MESSAGES: Record<string, string> = {
  github_denied: 'הכניסה עם GitHub בוטלה.',
  github_token: 'שגיאה בקבלת אסימון מ-GitHub. אנא נסה שוב.',
  github_no_email: 'לחשבון GitHub שלך אין אימייל ציבורי מאומת. אנא הוסף אחד ונסה שוב.',
  github_error: 'הכניסה עם GitHub נכשלה. אנא נסה שוב.',
  google_denied: 'הכניסה עם Google בוטלה.',
  google_token: 'שגיאה בקבלת אסימון מ-Google. אנא נסה שוב.',
  google_no_email: 'לא ניתן לקבל אימייל מחשבון Google שלך. אנא נסה שוב.',
  google_error: 'הכניסה עם Google נכשלה. אנא נסה שוב.',
  google_not_configured: 'הכניסה עם Google אינה זמינה כרגע.',
  magic_expired: 'הקישור פג תוקף או כבר נוצל. בקש קישור חדש.',
  magic_invalid: 'קישור לא תקין. אנא נסה שוב.',
};

function CallbackHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error(ERROR_MESSAGES[error] || 'הכניסה נכשלה');
      router.replace('/auth/login');
      return;
    }

    if (token) {
      localStorage.setItem('pat_token', token);
      refreshUser().then(() => {
        toast.success('נכנסת בהצלחה! 🎉');
        router.replace('/dashboard');
      });
    } else {
      router.replace('/auth/login');
    }
  }, [params, router, refreshUser]);

  return null;
}

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-10 w-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">מסיים כניסה…</p>
      </div>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
