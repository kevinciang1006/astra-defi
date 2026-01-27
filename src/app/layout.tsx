import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'AstraDeFi - Multi-Chain Yield Dashboard',
    template: '%s | AstraDeFi',
  },
  description:
    'Track your DeFi portfolio across Ethereum, Arbitrum, Optimism, Polygon, and Base. Real-time prices, yield tracking, and historical performance.',
  keywords: ['DeFi', 'yield farming', 'portfolio tracker', 'Ethereum', 'crypto dashboard'],
  authors: [{ name: 'AstraDeFi' }],
  openGraph: {
    title: 'AstraDeFi - Multi-Chain Yield Dashboard',
    description: 'Track your DeFi portfolio across multiple chains in one place.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AstraDeFi - Multi-Chain Yield Dashboard',
    description: 'Track your DeFi portfolio across multiple chains in one place.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
