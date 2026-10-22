import './globals.css';

export const metadata = {
  metadataBase: new URL('https://lotus-max.vercel.app'),
  title: 'Lotus 0.1 Max — Free 3.2M Context Sovereign AI API (10,000 RPM)',
  description: '100% Free OpenAI-compatible API with 3.2M token context, beating GPT-6 Astra and Claude Opus 5.5 in STEM evaluations. Zero credit card, 10,000 RPM, sub-140ms TTFT. Instant drop-in for Cursor, VS Code, and Python.',
  keywords: [
    'free ai api',
    'openai alternative',
    'cursor ai api',
    'free llm api',
    '3.2M context window',
    'lotus 0.1 max',
    'lotus labs',
    'frontier intelligence',
    'free chatgpt api',
    'gpt-6 alternative',
    'claude alternative',
    'continue dev api',
    'aider free api',
    'open source ai',
    'stem reasoning ai'
  ],
  authors: [{ name: 'Lotus Labs', url: 'https://lotus-max.vercel.app' }],
  creator: 'Lotus Labs',
  publisher: 'Lotus Labs',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Lotus 0.1 Max — Free 3.2M Context Sovereign AI API',
    description: '100% Free Developer Tier • 10,000 RPM • 3,200,000 Token Ingestion • Sub-140ms TTFT • 100% OpenAI Drop-In Compatible.',
    url: 'https://lotus-max.vercel.app',
    siteName: 'Lotus Labs',
    images: [
      {
        url: '/og-image.jpg',
        width: 1920,
        height: 1080,
        alt: 'Lotus 0.1 Max — 3.2M Context Sovereign AI Banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lotus 0.1 Max — Free 3.2M Token Context AI API',
    description: '100% Free Developer Access • 10,000 RPM • 3.2M Context • Sub-140ms Latency • OpenAI Compatible.',
    images: ['/og-image.jpg'],
    creator: '@lotuslabs',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <div className="bg-grid"></div>
        {children}
      </body>
    </html>
  );
}
