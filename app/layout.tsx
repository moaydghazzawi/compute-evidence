import type { Metadata } from 'next';

import './globals.css';

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://when-controls-raise-the-cost.moaydghazzawi.com';
const publicBaseUrl = configuredSiteUrl
  ? new URL(configuredSiteUrl)
  : undefined;
const socialImageUrl = publicBaseUrl
  ? new URL('/og.png', publicBaseUrl).toString()
  : undefined;

export const metadata: Metadata = {
  metadataBase: publicBaseUrl,
  title: {
    default: 'When Controls Raise the Cost',
    template: '%s | When Controls Raise the Cost',
  },
  description:
    'A citation-backed test of how Chinese AI development has adapted to U.S. advanced-compute restrictions.',
  applicationName: 'When Controls Raise the Cost',
  authors: [{ name: 'Moayd Ghazzawi' }],
  creator: 'Moayd Ghazzawi',
  alternates: publicBaseUrl ? { canonical: '/' } : undefined,
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: publicBaseUrl ? '/' : undefined,
    title: 'When Controls Raise the Cost',
    description:
      'China’s Responses to U.S. Advanced-Compute Restrictions—a citation-backed evidence ledger.',
    images: socialImageUrl
      ? [
          {
            url: socialImageUrl,
            width: 1730,
            height: 909,
            alt: 'When Controls Raise the Cost research project',
          },
        ]
      : undefined,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'When Controls Raise the Cost',
    description:
      'China’s Responses to U.S. Advanced-Compute Restrictions—a citation-backed evidence ledger.',
    images: socialImageUrl ? [socialImageUrl] : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
