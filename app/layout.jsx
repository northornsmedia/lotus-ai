import './globals.css';

export const metadata = {
  metadataBase: new URL('https://lotus-max.vercel.app'),
  title: 'Lotus 0.1 Max — Sovereign Global Frontier Intelligence (550B)',
  description: 'Lotus 0.1 Max delivers doctoral-level reasoning powered by sovereign distributed neural infrastructure. Developed by Lotus Labs.',
  keywords: ['AI model', 'Lotus 0.1 Max', 'Lotus Labs', 'Frontier Intelligence', 'Reasoning Model', '3.2M Context'],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Lotus 0.1 Max — Sovereign Global Frontier Intelligence',
    description: 'Doctoral-level AI reasoning model developed sovereignly by Lotus Labs.',
    url: 'https://lotus-max.vercel.app',
    siteName: 'Lotus Labs',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'Lotus Labs Official Logo' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lotus 0.1 Max — Sovereign Global Frontier Intelligence',
    description: 'Developed by Lotus Labs. Free Developer API at lotus-max.vercel.app',
    images: ['/logo.png'],
  }
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
