import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Presenter AI — AI-Powered Video & Content Studio',
  description: 'Generate AI video ads, UGC content, product photos, and virtual presenters from images and text.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
