'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store';

const features = [
  { icon: '🎬', title: 'סרטוני פרסומת AI', desc: 'צור סרטוני פרסומת מרשימים תוך דקות עם מגיש AI וירטואלי.' },
  { icon: '🤳', title: 'תוכן UGC', desc: 'ייצר תוכן גולשים אותנטי בקנה מידה גדול ובמהירות.' },
  { icon: '📸', title: 'תמונות מוצר', desc: 'תמונות מוצר באיכות סטודיו שנוצרות מתמונה אחת בלבד.' },
  { icon: '🗣️', title: 'פסקול', desc: 'פסקול טבעי בעשרות קולות ושפות, מיוצר בשניות.' },
];

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-bl from-brand-950 via-brand-800 to-brand-600">
      <header className="flex items-center justify-between px-8 py-5">
        <span className="text-2xl font-bold text-white tracking-tight">Presenter AI</span>
        <div className="flex gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-primary">לוח הבקרה</Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary">כניסה</Link>
              <Link href="/auth/register" className="btn-primary">התחל בחינם</Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-24 text-center">
        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
          צור מודעות וידאו<br />בעזרת AI תוך דקות
        </h1>
        <p className="text-lg text-brand-200 mb-10 max-w-2xl mx-auto">
          הפוך כל תמונת מוצר לסרטוני פרסומת, קליפי UGC ותמונות מוצר מקצועיות — בעזרת AI, בחינם לגמרי.
        </p>
        <Link href="/auth/register" className="btn-primary text-base px-8 py-3">
          התחל עכשיו — בחינם לגמרי ♾️
        </Link>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-6 text-right">
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
