import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { EvidenceLibrary } from '@/components/evidence-library';
import { researchData } from '@/lib/research';
export const metadata: Metadata = {
  title: 'Evidence library',
  description:
    'Search the claims, sources, counterevidence, and uncertainty behind each research judgment.',
  alternates: { canonical: '/evidence' },
};
export default async function EvidencePage({
  searchParams,
}: {
  searchParams?: Promise<{ case?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const selectedCase = researchData.cases.find(
    (item) => item.id === params?.case,
  );
  return (
    <>
      <SiteHeader current="evidence" />
      <main id="main-content">
        <section className="page-width subpage-intro">
          <p className="eyebrow">The research record</p>
          <div className="subpage-heading">
            <div>
              <h1>The source record.</h1>
              <p>
                Inspect the source behind each claim, its strongest
                qualification, and the questions still open.
              </p>
            </div>
            <div className="subpage-stat">
              <strong>{researchData.evidence.length}</strong>
              <span>records across {researchData.cases.length} cases</span>
            </div>
          </div>
        </section>
        <section className="page-width library-section">
          <EvidenceLibrary
            data={researchData}
            initialCase={selectedCase?.id ?? 'all'}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
