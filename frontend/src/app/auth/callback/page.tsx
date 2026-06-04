'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';

const ERROR_MESSAGES: Record<string, string> = {
  github_denied: 'GitHub sign-in was cancelled.',
  github_token: 'Failed to obtain GitHub token. Please try again.',
  github_no_email: 'Your GitHub account has no verified public email. Please add one and retry.',
  github_error: 'GitHub sign-in failed. Please try again.',
};

function CallbackHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error(ERROR_MESSAGES[error] || 'Sign-in failed');
      router.replace('/auth/login');
      return;
    }

    if (token) {
      localStorage.setItem('pat_token', token);
      refreshUser().then(() => {
        toast.success('Signed in with GitHub!');
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
        <p className="text-gray-500 text-sm">Completing sign-in…</p>
      </div>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
