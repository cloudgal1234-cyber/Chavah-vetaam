'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store';

const features = [
  { icon: '🎬', title: 'AI Video Ads', desc: 'Generate scroll-stopping video ads in minutes with a virtual AI presenter.' },
  { icon: '🤳', title: 'UGC Content', desc: 'Produce authentic-looking user-generated content at scale.' },
  { icon: '📸', title: 'Product Photos', desc: 'Studio-quality product images generated from a single photo.' },
  { icon: '🗣️', title: 'Voiceovers', desc: 'Natural-sounding voiceovers in dozens of voices and languages.' },
];

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600">
      <header className="flex items-center justify-between px-8 py-5">
        <span className="text-2xl font-bold text-white tracking-tight">Presenter AI</span>
        <div className="flex gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary">Sign In</Link>
              <Link href="/auth/register" className="btn-primary">Get Started Free</Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-24 text-center">
        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
          Create AI-Powered<br />Video Ads in Minutes
        </h1>
        <p className="text-lg text-brand-200 mb-10 max-w-2xl mx-auto">
          Turn any product image and description into polished video ads, UGC clips, and product photos — powered by AI.
        </p>
        <Link href="/auth/register" className="btn-primary text-base px-8 py-3">
          Start for Free — 100 Credits
        </Link>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          {features.map((f) => (
            <div key={f.title} className="card p-6 bg-white/10 border-white/20 text-white backdrop-blur">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-brand-200 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
