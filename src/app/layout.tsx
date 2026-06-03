import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mira.whitemirror.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MIRA — AI Business Representative',
    template: '%s · MIRA',
  },
  description: 'Auto-follow up on overdue invoices in your voice. MIRA recovers revenue while you sleep.',
  applicationName: 'MIRA',
  keywords: ['AI', 'invoice', 'follow-up', 'automation', 'voice', 'recovery', 'collections'],
  authors: [{ name: 'WhiteMirror', url: 'https://whitemirror.com' }],
  creator: 'WhiteMirror',
  publisher: 'WhiteMirror',
  category: 'Business Software',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'MIRA — AI Business Representative',
    description: 'Auto-follow up on overdue invoices in your voice. MIRA recovers revenue while you sleep.',
    siteName: 'MIRA',
    url: siteUrl,
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'MIRA — AI Business Representative',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MIRA — AI Business Representative',
    description: 'Auto-follow up on overdue invoices in your voice.',
    images: ['/opengraph-image'],
    creator: '@whitemirror',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.svg',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF7' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0F1A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="mira-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
