import './globals.css';

export const metadata = {
  title: 'Lotus 0.1 Max — Sovereign Global Frontier Intelligence (550B)',
  description: 'Lotus 0.1 Max delivers doctoral-level reasoning powered by NVIDIA NIM 550B & 30B infrastructure. Live on OpenRouter and hosted at lotus-max.vercel.app.',
  keywords: ['AI model', 'Lotus 0.1 Max', 'OpenRouter', 'NVIDIA NIM', 'Lotus AI', 'Llama 3.2', 'Nemotron'],
  openGraph: {
    title: 'Lotus 0.1 Max — Sovereign Global Frontier Intelligence',
    description: 'Doctoral-level AI reasoning model powered by NVIDIA NIM 550B & 30B infrastructure.',
    url: 'https://lotus-max.vercel.app',
    siteName: 'Lotus AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lotus 0.1 Max — Sovereign Global Frontier Intelligence',
    description: 'Live on OpenRouter at lotus-max.vercel.app',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFFFFF'><path d='M12 2L2 22h20L12 2z'/></svg>" />
      </head>
      <body>
        <div className="bg-grid"></div>
        {children}
      </body>
    </html>
  );
}
