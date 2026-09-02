import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Braces,
  FileCheck2,
  Scale,
} from 'lucide-react';

import { CaseExplorer } from '@/components/case-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Verdict } from '@/components/verdict';
import { researchData } from '@/lib/research';

const sourceById = new Map(researchData.sources.map((source) => [source.id, source]));
const classificationById = new Map(researchData.classifications.map((item) => [item.id, item]));
const responseById = new Map(researchData.responseTypes.map((item) => [item.id, item]));

export default function Home() {
  const primarySourceCount = researchData.sources.filter((source) => source.primary).length;

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-border bg-ink text-paper">
          <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-10 lg:py-16">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-paper/60">
                <span className="border border-paper/25 px-2 py-1 text-paper">{researchData.meta.status}</span>
                <span>Evidence through 02 Sep 2026</span>
                <span aria-hidden="true" className="size-1 bg-signal" />
                <span>v{researchData.meta.version}</span>
              </div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.19em] text-signal">{researchData.meta.subtitle}</p>
              <h1 className="max-w-5xl font-heading text-[clamp(2.65rem,6vw,6.6rem)] leading-[0.9] tracking-[-0.055em]">
                When controls raise the cost.
              </h1>
              <p className="mt-7 max-w-3xl text-base leading-relaxed text-paper/72 lg:text-lg">{researchData.meta.question}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a className="inline-flex min-h-10 items-center gap-2 bg-paper px-4 text-xs font-extrabold text-ink transition-colors hover:bg-signal" href="#cases">
                  Test the cases <ArrowRight aria-hidden="true" className="size-4" />
                </a>
                <a className="inline-flex min-h-10 items-center gap-2 border border-paper/30 px-4 text-xs font-extrabold text-paper transition-colors hover:border-paper" href="/evidence">
                  Inspect every claim <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              </div>
            </div>
            <aside className="self-end border-l border-paper/20 pl-6" aria-label="Current research finding">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Current reading</p>
              <p className="font-heading text-3xl leading-[1.08]">{researchData.meta.currentFinding}</p>
              <p className="mt-4 text-xs leading-relaxed text-paper/60">Provisional, claim-sized, and built to be revised. Capability is tested separately from cost, dependence, and repeatability.</p>
            </aside>
          </div>
        </section>

        <section className="border-b border-border bg-card" aria-label="Dataset summary">
          <div className="mx-auto grid max-w-[1480px] grid-cols-2 lg:grid-cols-4 lg:px-10">
            <Stat label="Policy milestones" value={researchData.timeline.length} />
            <Stat label="Response cases" value={researchData.cases.length} />
            <Stat label="Evidence records" value={researchData.evidence.length} />
            <Stat label={`Primary of ${researchData.sources.length} sources`} value={primarySourceCount} />
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-12 lg:px-10 lg:py-16" id="cases">
          <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <p className="eyebrow">Case comparison / five records</p>
              <h2 className="font-heading text-4xl tracking-[-0.035em] lg:text-5xl">Test the workaround, not the headline.</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">Each case receives the same six questions. Use the filters to isolate a response type, time, source class, confidence level, or dependency finding.</p>
          </div>
          <CaseExplorer
            cases={researchData.cases}
            classifications={researchData.classifications}
            evidence={researchData.evidence}
            responseTypes={researchData.responseTypes}
            sources={researchData.sources}
          />
        </section>

        <section className="border-y border-border bg-card" id="matrix">
          <div className="mx-auto max-w-[1480px] px-5 py-12 lg:px-10 lg:py-16">
            <div className="mb-7 grid gap-4 lg:grid-cols-[1fr_520px] lg:items-end">
              <div>
                <p className="eyebrow">Comparison matrix</p>
                <h2 className="font-heading text-4xl tracking-[-0.035em]">Four judgments, not one score.</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">“Genuine weakening” applies only to the control point actually displaced. A domestic accelerator can weaken finished-chip denial while leaving HBM, fabrication, power, and scale unresolved.</p>
            </div>
            <div className="overflow-x-auto border border-border">
              <a className="sr-only focus:not-sr-only focus:block focus:bg-signal focus:p-2 focus:text-ink" href="#matrix-end">Skip comparison matrix</a>
              <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
                <caption className="sr-only">Cross-case matrix comparing capability, cost, dependency, enforceability, and judgment</caption>
                <thead className="bg-ink text-paper">
                  <tr className="text-[10px] uppercase tracking-[0.12em]">
                    <th className="px-4 py-3 font-bold">Response / case</th>
                    <th className="px-4 py-3 font-bold">Capability</th>
                    <th className="px-4 py-3 font-bold">Cost penalty</th>
                    <th className="px-4 py-3 font-bold">Dependency</th>
                    <th className="px-4 py-3 font-bold">Enforcement</th>
                    <th className="px-4 py-3 font-bold">Judgment</th>
                  </tr>
                </thead>
                <tbody>
                  {researchData.cases.map((item) => {
                    const classification = classificationById.get(item.classification)!;
                    return (
                      <tr className="border-t border-border align-top" key={item.id}>
                        <th className="max-w-64 bg-background/50 px-4 py-5 font-normal">
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-cobalt">{item.responseTypes.map((id) => responseById.get(id)?.label).join(' · ')}</span>
                          <span className="mt-1 block font-heading text-lg leading-tight">{item.shortTitle}</span>
                        </th>
                        <MatrixCell answer={item.tests[0].answer} status={item.tests[0].status} />
                        <MatrixCell answer={item.tests[2].answer} status={item.tests[2].status} />
                        <MatrixCell answer={item.tests[3].answer} status={item.tests[3].status} />
                        <MatrixCell answer={item.tests[4].answer} status={item.tests[4].status} />
                        <td className="px-4 py-5"><Verdict classification={classification} compact /><span className="mt-3 block text-[10px] text-muted-foreground">{item.confidence} confidence</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <span id="matrix-end" />
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-12 lg:px-10 lg:py-16" id="timeline">
          <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <p className="eyebrow">Policy timeline / Oct 2022–present</p>
              <h2 className="font-heading text-4xl tracking-[-0.035em]">The rule in force matters.</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">Announcement, publication, effective, compliance, suspension, and license-review dates are not interchangeable. Each entry preserves that distinction.</p>
          </div>
          <ol className="timeline border-t border-border">
            {researchData.timeline.map((event, index) => (
              <li className="grid gap-4 border-b border-border py-6 md:grid-cols-[170px_minmax(0,1fr)_300px]" key={event.id}>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <time className="mt-2 block text-sm font-extrabold" dateTime={event.date}>{event.displayDate}</time>
                  <span className="mt-2 inline-flex border-l-2 border-cobalt bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground">{event.status}</span>
                </div>
                <div>
                  <h3 className="font-heading text-2xl leading-tight">{event.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{event.summary}</p>
                  <p className="mt-3 text-xs leading-relaxed"><span className="font-bold">Caveat:</span> {event.caveat}</p>
                </div>
                <div className="space-y-2 md:border-l md:border-border md:pl-5">
                  <p className="eyebrow">Authority</p>
                  {event.sourceIds.map((sourceId) => {
                    const source = sourceById.get(sourceId)!;
                    return (
                      <a className="group flex items-start justify-between gap-3 text-xs leading-relaxed text-muted-foreground hover:text-foreground" href={source.url} key={sourceId} rel="noreferrer" target="_blank">
                        <span>{source.organization}: {source.title}</span>
                        <ArrowUpRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-border bg-ink text-paper">
          <div className="mx-auto grid max-w-[1480px] gap-8 px-5 py-12 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-10 lg:py-16">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Two-minute summary</p>
              <h2 className="font-heading text-4xl leading-tight">Progress is an outcome. Control failure is a causal claim.</h2>
              <a className="mt-7 inline-flex items-center gap-2 text-xs font-extrabold text-signal hover:underline" href="/methodology">Read the full method <ArrowRight aria-hidden="true" className="size-4" /></a>
            </div>
            <p className="max-w-4xl text-base leading-[1.85] text-paper/74 lg:text-lg">{researchData.meta.conversationSummary}</p>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="border border-border bg-card p-6">
              <Scale aria-hidden="true" className="size-5 text-cobalt" />
              <p className="mt-8 eyebrow">Interpretation discipline</p>
              <h2 className="font-heading text-2xl">Capability, cost, and dependence are scored separately.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A model release can show restored capability while leaving the policy’s delay, resource burden, or upstream leverage intact.</p>
            </article>
            <article className="border border-border bg-card p-6">
              <FileCheck2 aria-hidden="true" className="size-5 text-cobalt" />
              <p className="mt-8 eyebrow">Evidence design</p>
              <h2 className="font-heading text-2xl">Every claim carries its own objection.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Nineteen cards pair source location and data with counterevidence, confidence, and remaining uncertainty.</p>
            </article>
            <article className="border border-border bg-card p-6">
              <Braces aria-hidden="true" className="size-5 text-cobalt" />
              <p className="mt-8 eyebrow">Reproducible artifact</p>
              <h2 className="font-heading text-2xl">The research record is inspectable and downloadable.</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                <a className="inline-flex min-h-9 items-center gap-2 bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-85" download href="/data/research-dataset.json"><ArrowDownToLine className="size-3.5" /> JSON</a>
                <a className="inline-flex min-h-9 items-center gap-2 border border-border px-3 text-xs font-bold hover:bg-muted" download href="/data/evidence.csv"><ArrowDownToLine className="size-3.5" /> CSV</a>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-border p-5 last:border-r-0 odd:border-b lg:border-b-0 lg:first:border-l">
      <span className="font-heading text-4xl tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
    </div>
  );
}

function MatrixCell({ status, answer }: { status: string; answer: string }) {
  return (
    <td className="max-w-56 px-4 py-5">
      <span className="status-tag">{status}</span>
      <span className="mt-3 block leading-relaxed text-muted-foreground">{answer}</span>
    </td>
  );
}
