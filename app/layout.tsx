import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'When Controls Raise the Cost',
    template: '%s | When Controls Raise the Cost',
  },
  description: 'A citation-backed test of how Chinese AI development has adapted to U.S. advanced-compute restrictions.',
  applicationName: 'When Controls Raise the Cost',
  authors: [{ name: 'Moayd Ghazzawi' }],
  openGraph: {
    type: 'website',
    title: 'When Controls Raise the Cost',
    description: 'China’s Responses to U.S. Advanced-Compute Restrictions—a citation-backed evidence ledger.',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'When Controls Raise the Cost research project' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'When Controls Raise the Cost',
    description: 'China’s Responses to U.S. Advanced-Compute Restrictions—a citation-backed evidence ledger.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
