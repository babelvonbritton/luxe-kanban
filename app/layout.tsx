import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

/**
 * Font via next/font (Google Fonts) — di-download & di-host sendiri saat build,
 * sehingga situs statis TIDAK melakukan request ke pihak ketiga saat runtime.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Luxe Kanban — Premium Task Board',
  description:
    'Papan Kanban mewah & minimalis: kelola tugas dengan drag & drop, simpan aman di perangkat Anda, backup ZIP dengan tahapan terverifikasi.',
};

export const viewport: Viewport = {
  themeColor: '#07080b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${cormorant.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
