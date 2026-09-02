import type { Metadata } from 'next';
import { ArrowDown, ArrowRight, Braces, CircleAlert, FileSearch, Scale } from 'lucide-react';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Verdict } from '@/components/verdict';
import { researchData } from '@/lib/research';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'The six-question test, source hierarchy, limitations, and falsifiers behind the research judgments.',
};

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-border bg-ink text-paper">
          <div className="mx-auto grid max-w-[1480px] gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-10 lg:py-14">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Methodology / version {researchData.meta.version}</p>
              <h1 className="max-w-5xl font-heading text-5xl tracking-[-0.045em] lg:text-7xl">Separate progress from proof of policy failure.</h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-paper/65">The method asks what capability returned, what it cost, what it still depends on, and whether it can be repeated—not whether a dramatic result exists.</p>
            </div>
            <aside className="self-end border-l border-paper/20 pl-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-signal">Research posture</p>
              <p className="mt-2 font-heading text-2xl">Treat uncertainty as a field to populate, not a sentence to hide.</p>
              <a className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-paper/70 hover:text-paper" href="/evidence">Inspect the ledger <ArrowRight className="size-3.5" /></a>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div>
              <Scale aria-hidden="true" className="size-6 text-cobalt" />
              <p className="mt-7 eyebrow">Interpretive rule</p>
              <h2 className="font-heading text-4xl tracking-[-0.035em]">Why progress does not equal failure.</h2>
            </div>
            <div className="prose-research">
              <p>Export controls can matter without stopping every model release. A Chinese developer may restore a capability by using more chips, older chips, a larger network, more electricity, greater engineering effort, a fragile foreign route, or public money. That outcome is evidence of adaptation. It becomes evidence that a control weakened only when the relevant capability is repeatable at useful scale and dependence falls at the control point being tested.</p>
              <p>The distinction is causal. Observing progress after a rule does not reveal what would have happened without the rule, how much the response cost, or whether the same method supports the next generation. This project therefore avoids binary “worked / failed” scoring.</p>
              <div className="mt-6 border-l-4 border-signal bg-card p-5">
                <p className="font-heading text-2xl leading-snug">Current finding: {researchData.meta.currentFinding}</p>
                <p className="mt-2 text-sm text-muted-foreground">That finding can change as stronger, independently auditable evidence arrives.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-[1480px] px-5 py-12 lg:px-10 lg:py-16">
            <div className="mb-8 max-w-3xl">
              <p className="eyebrow">The common instrument</p>
              <h2 className="font-heading text-4xl tracking-[-0.035em]">The same six questions for every response.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">No case receives a bespoke standard. Answers must remain tied to evidence cards and major unknowns stay visible.</p>
            </div>
            <ol className="grid border-l border-t border-border md:grid-cols-2 xl:grid-cols-3">
              {researchData.methodology.sixQuestions.map((question, index) => (
                <li className="min-h-52 border-b border-r border-border p-6" key={question}>
                  <span className="font-mono text-[10px] text-cobalt">Q{index + 1}</span>
                  <p className="mt-10 font-heading text-2xl leading-snug">{question}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-12 lg:px-10 lg:py-16">
          <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_500px] lg:items-end">
            <div>
              <p className="eyebrow">Decision rule</p>
              <h2 className="font-heading text-4xl tracking-[-0.035em]">A judgment states the mechanism.</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">The label is narrower than the case headline. It describes whether the relevant control point was displaced, paid around, bypassed, or not yet demonstrated.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {researchData.classifications.map((item, index) => (
              <article className="flex min-h-64 flex-col border border-border bg-card p-5" key={item.id}>
                <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                <div className="mt-auto pt-10">
                  <Verdict classification={item} />
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.definition}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-12 lg:grid-cols-2 lg:px-10 lg:py-16">
            <section>
              <FileSearch aria-hidden="true" className="size-5 text-cobalt" />
              <p className="mt-7 eyebrow">Source hierarchy</p>
              <h2 className="font-heading text-3xl">Start with the record closest to the claim.</h2>
              <ol className="mt-6 border-t border-border">
                {researchData.methodology.sourceHierarchy.map((item, index) => (
                  <li className="grid grid-cols-[36px_1fr] gap-3 border-b border-border py-4 text-sm leading-relaxed" key={item}>
                    <span className="font-mono text-[10px] text-cobalt">0{index + 1}</span><span>{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">A company preprint is primary evidence of what the company reported. It is not independent proof that the result is reproducible or the comparison is like-for-like.</p>
            </section>
            <section>
              <Braces aria-hidden="true" className="size-5 text-cobalt" />
              <p className="mt-7 eyebrow">Evidence-card contract</p>
              <h2 className="font-heading text-3xl">Claim-sized data, reciprocal references.</h2>
              <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
                {['Claim', 'Source and type', 'Publication + access dates', 'Quotation or data', 'Exact source location', 'Counterevidence', 'Confidence', 'Remaining uncertainty'].map((item, index) => (
                  <div className="bg-background p-4 text-xs font-bold" key={item}><span className="mr-2 font-mono text-[9px] text-cobalt">{String(index + 1).padStart(2, '0')}</span>{item}</div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Automated checks validate the shape and citation graph. Human review still determines whether a claim accurately represents its source.</p>
            </section>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div>
              <CircleAlert aria-hidden="true" className="size-6 text-rust" />
              <p className="mt-7 eyebrow">Known limits</p>
              <h2 className="font-heading text-4xl tracking-[-0.035em]">What this MVP cannot establish.</h2>
            </div>
            <ul className="grid gap-px border border-border bg-border md:grid-cols-2">
              {researchData.methodology.limitations.map((item, index) => (
                <li className="bg-card p-5 text-sm leading-relaxed" key={item}><span className="mb-5 block font-mono text-[10px] text-rust">L{index + 1}</span>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-ink text-paper">
          <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-12 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-10 lg:py-16">
            <div>
              <ArrowDown aria-hidden="true" className="size-6 text-signal" />
              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Falsifiers</p>
              <h2 className="mt-2 font-heading text-4xl tracking-[-0.035em]">What would change my mind.</h2>
            </div>
            <ol className="border-t border-paper/20">
              {researchData.methodology.whatWouldChangeMind.map((item, index) => (
                <li className="grid grid-cols-[44px_1fr] gap-4 border-b border-paper/20 py-5 text-sm leading-relaxed text-paper/75" key={item}>
                  <span className="font-mono text-[10px] text-signal">F{index + 1}</span><span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
