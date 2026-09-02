import type { Metadata } from 'next';
import { ArrowDownToLine, ArrowUpRight, CheckCircle2, CircleDashed, ShieldQuestion } from 'lucide-react';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { researchData } from '@/lib/research';

export const metadata: Metadata = {
  title: 'Evidence ledger',
  description: 'Claim-sized evidence, source locations, counterevidence, confidence, and remaining uncertainty for every case.',
};

type PageProps = {
  searchParams?: Promise<{ case?: string }>;
};

const sourceById = new Map(researchData.sources.map((source) => [source.id, source]));
const caseById = new Map(researchData.cases.map((item) => [item.id, item]));

export default async function EvidencePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedCase = params?.case ? caseById.get(params.case) : undefined;
  const records = selectedCase
    ? researchData.evidence.filter((item) => item.caseIds.includes(selectedCase.id))
    : researchData.evidence;

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-border bg-ink text-paper">
          <div className="mx-auto grid max-w-[1480px] gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_350px] lg:px-10 lg:py-14">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Evidence ledger / {records.length} records</p>
              <h1 className="font-heading text-5xl tracking-[-0.045em] lg:text-7xl">Every claim should survive inspection.</h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-paper/65">Each card records the proposition, the best available public source, the exact place to look, the strongest qualification, and what remains unknown.</p>
            </div>
            <aside className="self-end border-l border-paper/20 pl-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-signal">Visible subset</p>
              <p className="mt-2 font-heading text-2xl">{selectedCase?.title ?? 'All five research cases'}</p>
              {selectedCase ? <a className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-paper/70 hover:text-paper" href="/evidence">Show all records <ArrowUpRight className="size-3.5" /></a> : null}
            </aside>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-10">
            <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Confidence describes the scoped claim.</strong> “Primary” means original or official for that claim—not independent verification.</p>
            <div className="flex gap-2">
              <a className="inline-flex min-h-8 items-center gap-2 border border-border px-3 text-xs font-bold hover:bg-muted" download href="/data/evidence.csv"><ArrowDownToLine className="size-3.5" /> CSV</a>
              <a className="inline-flex min-h-8 items-center gap-2 bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-85" download href="/data/research-dataset.json"><ArrowDownToLine className="size-3.5" /> JSON</a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-10 lg:px-10 lg:py-14" aria-label="Evidence records">
          <ol className="grid gap-4 xl:grid-cols-2">
            {records.map((item, index) => {
              const source = sourceById.get(item.sourceId)!;
              const itemCases = item.caseIds.map((id) => caseById.get(id)).filter(Boolean);
              return (
                <li className="evidence-card scroll-mt-24 border border-border bg-card" id={item.id} key={item.id}>
                  <article aria-labelledby={`${item.id}-claim`}>
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/60 px-5 py-3">
                      <span className="font-mono text-[10px] text-muted-foreground">EV-{String(index + 1).padStart(2, '0')} · {item.id}</span>
                      <div className="flex items-center gap-2">
                        <Relationship value={item.relationship} />
                        <span className={`confidence confidence-${item.confidence.toLowerCase()}`}>{item.confidence} confidence</span>
                      </div>
                    </header>
                    <div className="p-5 lg:p-6">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-cobalt">Claim</p>
                      <h2 className="mt-2 font-heading text-2xl leading-snug" id={`${item.id}-claim`}>{item.claim}</h2>

                      <a className="group mt-6 block border-l-3 border-cobalt bg-accent/60 p-4" href={source.url} rel="noreferrer" target="_blank">
                        <span className="flex items-start justify-between gap-4">
                          <span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-accent-foreground">{item.sourceType} · {source.primary ? 'Primary' : 'Independent / secondary'}</span>
                            <span className="mt-1 block text-sm font-extrabold text-foreground">{source.title}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">{source.organization}</span>
                          </span>
                          <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-cobalt transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                      </a>

                      <dl className="mt-5 grid gap-px border border-border bg-border text-xs sm:grid-cols-3">
                        <Datum label="Published" value={item.publicationDate ?? 'Date not verified'} />
                        <Datum label="Accessed" value={item.accessDate} />
                        <Datum label="Location" value={item.location} />
                      </dl>

                      <section className="mt-5">
                        <h3 className="eyebrow">Quotation or data</h3>
                        <blockquote className="border-l-2 border-foreground pl-4 font-heading text-lg leading-relaxed">{item.quotationOrData}</blockquote>
                      </section>

                      <div className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
                        <section>
                          <h3 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-rust"><ShieldQuestion aria-hidden="true" className="size-3.5" /> Counterevidence</h3>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.counterevidence}</p>
                        </section>
                        <section>
                          <h3 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber"><CircleDashed aria-hidden="true" className="size-3.5" /> Remaining uncertainty</h3>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.remainingUncertainty}</p>
                        </section>
                      </div>

                      <footer className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                        <span>Applies to</span>
                        {itemCases.map((researchCase) => <a className="border border-border bg-background px-2 py-1 normal-case tracking-normal text-foreground hover:border-cobalt" href="/#cases" key={researchCase?.id}>{researchCase?.shortTitle}</a>)}
                      </footer>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-3">
      <dt className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 leading-relaxed">{value}</dd>
    </div>
  );
}

function Relationship({ value }: { value: 'supports' | 'qualifies' | 'counters' }) {
  const label = value === 'supports' ? 'Supports' : value === 'qualifies' ? 'Qualifies' : 'Counters';
  return <span className={`relationship relationship-${value}`}><CheckCircle2 aria-hidden="true" className="size-3" />{label}</span>;
}
