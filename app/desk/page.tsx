import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Research desk',
  alternates: { canonical: '/desk' },
};
import { ResearchDesk } from '@/components/research-desk';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { researchData } from '@/lib/research';

export default function DeskPage() {
  return (
    <>
      <SiteHeader current="desk" />
      <main id="main-content">
        <ResearchDesk data={researchData} />
      </main>
      <SiteFooter />
    </>
  );
}
