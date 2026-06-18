import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';

const heebo = Heebo({ subsets: ['hebrew', 'latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'עגלת הקפה – חווה של פעם',
  description: 'הזמינו קפה ומשקאות מכל מקום בחווה',
};

export default function FarmLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} bg-amber-50 text-stone-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}
