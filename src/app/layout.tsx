import type { Metadata } from 'next';
import { Inter, Noto_Serif_SC, Ma_Shan_Zheng } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const notoSerifSC = Noto_Serif_SC({
  variable: '--font-noto-serif-sc',
  weight: ['400', '700'],
  subsets: ['latin'],
  preload: false,
});

const maShanZheng = Ma_Shan_Zheng({
  variable: '--font-ma-shan-zheng',
  weight: '400',
  subsets: ['latin'],
  preload: false,
});

export const metadata: Metadata = {
  title: '红日 Redsun — Chinese Character Lookup',
  description:
    'A quick-consult tool for Mandarin learners. Draw, type, or speak a character to look it up.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSerifSC.variable} ${maShanZheng.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
