import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-heebo' });

export const metadata: Metadata = {
  title: 'Presenter AI — סטודיו לתוכן AI',
  description: 'צור סרטוני פרסומת AI, תוכן UGC, תמונות מוצר ומגישים וירטואליים מתמונות וטקסט.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        {children}
        <Toaster position="top-left" />
      </body>
    </html>
  );
}
