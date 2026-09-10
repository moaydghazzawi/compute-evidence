import { ArrowRight, ArrowUpRight, Download, BookOpen } from 'lucide-react';
import { CaseExplorer } from '@/components/case-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ComparisonMatrix } from '@/components/comparison-matrix';
import { researchData } from '@/lib/research';
import { formatDate } from '@/lib/presentation';

const sourceById = new Map(
  researchData.sources.map((source) => [source.id, source]),
);

export default function Home() {
  return (
    <>
      <SiteHeader current="overview" />
      <main id="main-content">
        <section className="overview-intro page-width">
          <div className="intro-main">
            <p className="eyebrow">
              Research by Moayd Ghazzawi{' '}
              <span className="eyebrow-divider">/</span> China & advanced
              computing
            </p>
            <h1>
              When Controls
              <br />
              <em>Raise the Cost.</em>
            </h1>
            <p className="intro-description">
              How has Chinese AI development adapted to U.S. chip restrictions?
              Examine the capability recovered, the cost incurred, and the
              dependencies that remain.
            </p>
            <div className="intro-meta">
              <span>
                Evidence through{' '}
                <time dateTime={researchData.meta.evidenceThrough}>
                  {formatDate(researchData.meta.evidenceThrough)}
                </time>
              </span>
              <a href="/methodology">
                Read the research method{' '}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
          <aside
            className="finding-panel"
            aria-label="Current research finding"
          >
            <div className="finding-label">
              <BookOpen size={16} aria-hidden="true" />
              <span>The current finding</span>
            </div>
            <p className="finding-title">{researchData.meta.currentFinding}</p>
            <p className="finding-context">
              Useful capability has returned. The evidence still leaves
              substantial costs and upstream dependencies unresolved.
            </p>
            <a href="#matrix">
              Compare the judgments <ArrowRight size={16} aria-hidden="true" />
            </a>
          </aside>
        </section>
        <div className="page-width">
          <section className="research-stats" aria-label="Dataset summary">
            <Stat value={researchData.cases.length} label="Response cases" />
            <Stat
              value={researchData.evidence.length}
              label="Evidence records"
            />
            <Stat
              value={researchData.sources.length}
              label="Cited sources"
              detail={
                researchData.sources.filter((s) => s.primary).length +
                ' primary'
              }
            />
            <Stat
              value={researchData.timeline.length}
              label="Policy milestones"
            />
          </section>
        </div>
        <section className="page-width section-space" id="cases">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / Explore the responses</p>
              <h2>{researchData.cases.length} cases. One common test.</h2>
            </div>
            <p>
              Choose a case to examine its evidence, costs, and remaining
              questions.
            </p>
          </div>
          <CaseExplorer
            cases={researchData.cases}
            classifications={researchData.classifications}
            evidence={researchData.evidence}
            responseTypes={researchData.responseTypes}
            sources={researchData.sources}
          />
        </section>
        <section className="section-surface" id="matrix">
          <div className="page-width section-space">
            <div className="section-heading">
              <div>
                <p className="eyebrow">02 / Compare the outcomes</p>
                <h2>Where each response holds up.</h2>
              </div>
              <p>
                Read all cases across the six dimensions. Each judgment applies
                to the specific control point examined.
              </p>
            </div>
            <ComparisonMatrix
              cases={researchData.cases}
              classifications={researchData.classifications}
            />
          </div>
        </section>
        <section className="page-width section-space" id="timeline">
          <div className="section-heading">
            <div>
              <p className="eyebrow">03 / Policy context</p>
              <h2>A changing set of rules.</h2>
            </div>
            <p>
              Dates distinguish announcements, effective rules, and suspensions.
              Expand a milestone for its scope and original sources.
            </p>
          </div>
          <ol className="policy-timeline">
            {researchData.timeline.map((event, index) => (
              <li key={event.id}>
                <div className="timeline-date">
                  <span className="record-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <time dateTime={event.date}>{event.displayDate}</time>
                </div>
                <details className="timeline-event">
                  <summary>
                    <span>
                      <span className="timeline-status">{event.status}</span>
                      <h3>{event.title}</h3>
                    </span>
                    <span className="expand-symbol" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className="timeline-body">
                    <p>{event.summary}</p>
                    <p className="timeline-caveat">
                      <strong>Scope and caveat.</strong> {event.caveat}
                    </p>
                    <div className="timeline-sources">
                      <span className="eyebrow">Original sources</span>
                      {event.sourceIds.map((id) => {
                        const source = sourceById.get(id)!;
                        return (
                          <a
                            key={id}
                            href={source.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {source.organization}: {source.title}
                            <ArrowUpRight size={16} aria-hidden="true" />
                            <span className="sr-only"> (opens in new tab)</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </section>
        <section className="research-brief section-surface">
          <div className="page-width section-space brief-grid">
            <div>
              <p className="eyebrow">The research in two minutes</p>
              <h2>What the record supports.</h2>
              <a className="text-link" href="/methodology">
                Method and limitations{' '}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div>
              <p className="brief-copy">
                {researchData.meta.conversationSummary}
              </p>
              <div className="brief-actions">
                <a className="action-link" href="/evidence">
                  Explore the evidence{' '}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
                <a
                  className="action-link secondary"
                  download
                  href="/data/research-dataset.json"
                >
                  <Download size={16} aria-hidden="true" /> Download research
                  data
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="research-stat">
      <span className="stat-value">{String(value).padStart(2, '0')}</span>
      <span className="stat-label">
        {label}
        {detail ? <small>{detail}</small> : null}
      </span>
    </div>
  );
}
