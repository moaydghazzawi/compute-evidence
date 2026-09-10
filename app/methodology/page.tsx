import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Verdict } from '@/components/verdict';
import { researchData } from '@/lib/research';
export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'The six-question test, source hierarchy, limitations, and evidence that could change the research judgments.',
  alternates: { canonical: '/methodology' },
};
const sections = [
  { id: 'research-question', label: 'Research question' },
  { id: 'six-questions', label: 'The six-question test' },
  { id: 'judgments', label: 'How judgments work' },
  { id: 'source-standard', label: 'Source standard' },
  { id: 'limitations', label: 'Known limitations' },
  { id: 'change-my-mind', label: 'What would change the finding' },
];
export default function MethodologyPage() {
  return (
    <>
      <SiteHeader current="methodology" />
      <main id="main-content">
        <section className="page-width subpage-intro">
          <p className="eyebrow">Methodology / v{researchData.meta.version}</p>
          <div className="subpage-heading">
            <div>
              <h1>How the judgments are made.</h1>
              <p>
                Every case answers the same six questions. Capability, cost, and
                dependence are examined separately.
              </p>
            </div>
          </div>
        </section>
        <div className="page-width method-layout">
          <aside className="method-nav">
            <p className="eyebrow">On this page</p>
            <nav aria-label="Methodology contents">
              {sections.map((s) => (
                <a key={s.id} href={'#' + s.id}>
                  {s.label}
                </a>
              ))}
            </nav>
            <a className="text-link" href="/evidence">
              Inspect the evidence
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </aside>
          <div className="method-content">
            <section id="research-question">
              <p className="eyebrow">01 / The question</p>
              <h2>What did the response actually change?</h2>
              <p className="method-question">{researchData.meta.question}</p>
              <p>
                Export controls can impose costs while Chinese developers
                continue to release capable models. A developer may use more
                chips, a larger network, more electricity, substantial
                engineering, a fragile supply route, or state support. Each
                mechanism has different implications for the control being
                tested.
              </p>
              <p>
                Progress after a rule cannot, by itself, establish what would
                have happened without it. The record must show what capability
                returned, whether it can be repeated, and which dependencies
                remain. Reported resource requirements do not measure the extra
                cost caused by controls without a credible comparison.
              </p>
              <div className="method-callout">
                <span className="eyebrow">Current finding</span>
                <p>{researchData.meta.currentFinding}</p>
              </div>
            </section>
            <section id="six-questions">
              <p className="eyebrow">02 / The common test</p>
              <h2>Six questions for every case.</h2>
              <ol className="question-grid">
                {researchData.methodology.sixQuestions.map(
                  (question, index) => (
                    <li key={question}>
                      <span className="record-number">0{index + 1}</span>
                      <p>{question}</p>
                    </li>
                  ),
                )}
              </ol>
              <a className="text-link" href="/#matrix">
                Compare all six dimensions{' '}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </section>
            <section id="judgments">
              <p className="eyebrow">03 / The interpretation</p>
              <h2>A judgment has a defined scope.</h2>
              <p>
                Each classification applies to the control point examined.
                Finished-chip substitution does not establish independence in
                memory, manufacturing equipment, fabrication, packaging, or
                optics.
              </p>
              <div className="judgment-list">
                {researchData.classifications.map((item) => (
                  <article key={item.id}>
                    <Verdict classification={item} />
                    <p>{item.definition}</p>
                    <a
                      className="text-link"
                      href={'/?judgment=' + item.id + '#cases'}
                    >
                      Explore matching cases{' '}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>
            </section>
            <section id="source-standard">
              <p className="eyebrow">04 / Sources</p>
              <h2>Start close to the recorded claim.</h2>
              <ol className="source-hierarchy">
                {researchData.methodology.sourceHierarchy.map((item, index) => (
                  <li key={item}>
                    <span className="record-number">0{index + 1}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ol>
              <p>
                A vendor paper is primary evidence of what the vendor reported.
                Independent reproduction, comparable workload assumptions, and
                complete cost measurements are separate questions.
              </p>
              <p>
                Each record includes a claim, source, dates, exact location,
                quotation or data, counterevidence, confidence, and remaining
                uncertainty. Citation checks connect each record to its cases.
                Source interpretation still requires human judgment.
              </p>
            </section>
            <section id="limitations">
              <p className="eyebrow">05 / Limits</p>
              <h2>What this record cannot establish.</h2>
              <ul className="method-list">
                {researchData.methodology.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section id="change-my-mind">
              <p className="eyebrow">06 / Revising the finding</p>
              <h2>Evidence that would change the assessment.</h2>
              <ul className="method-list">
                {researchData.methodology.whatWouldChangeMind.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a className="action-link" href="/evidence">
                Return to the evidence{' '}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
