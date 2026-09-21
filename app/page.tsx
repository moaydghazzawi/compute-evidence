import { LegacyResearchRedirect } from '@/components/legacy-research-redirect';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { researchData } from '@/lib/research';
import { formatDate } from '@/lib/presentation';

export default function HomePage() {
  return (
    <>
      <LegacyResearchRedirect />
      <SiteHeader current="home" />
      <main id="main-content" className="about-page page-width">
        <section className="about-intro">
          <p className="desk-kicker">MEET COMPUTE EVIDENCE</p>
          <h1>
            A claim is a<br />
            <span>starting point.</span>
          </h1>
          <p>
            Find the evidence behind it. See what challenges it. Keep a brief
            you can trace back to its sources.
          </p>
          <a className="about-start" href="/desk">
            Open research desk <ArrowRight size={17} aria-hidden="true" />
          </a>
          <span className="about-free">
            Start with the examples. No account needed.
          </span>
        </section>

        <section className="about-context" aria-labelledby="about-scope">
          <div>
            <p className="desk-kicker">ONE FOCUSED COLLECTION</p>
            <h2 id="about-scope">Chips. AI. The effect of controls.</h2>
          </div>
          <div>
            <p>
              The first collection examines how Chinese AI development has
              responded to U.S. advanced-compute restrictions—from DeepSeek’s
              efficiency gains to domestic accelerators and diverted supply.
            </p>
            <p className="about-stats">
              {researchData.cases.length} cases · {researchData.evidence.length}{' '}
              evidence records · {researchData.sources.length} sources
            </p>
            <a className="desk-text-button" href="/research">
              Read the research <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section
          className="about-actions"
          aria-labelledby="about-actions-title"
        >
          <h2 id="about-actions-title">What you can do.</h2>
          <div>
            <h3>Test a claim</h3>
            <p>Compare an assertion with the reviewed record.</p>
          </div>
          <div>
            <h3>Challenge your view</h3>
            <p>
              Bring the strongest qualifications and counterevidence forward.
            </p>
          </div>
          <div>
            <h3>Assess a new source</h3>
            <p>
              Paste a public excerpt and examine what it adds to this
              collection.
            </p>
          </div>
          <div>
            <h3>Build a brief</h3>
            <p>
              Collect useful records and export a source-linked reading packet.
            </p>
          </div>
        </section>

        <section
          className="about-questions"
          aria-labelledby="about-questions-title"
        >
          <h2 id="about-questions-title">A few things to know.</h2>
          <details>
            <summary>Do I need a Jev account?</summary>
            <p>
              No. Saved examples, keyword search, source filters, and briefs
              work without one. Your own TypeSafe API key enables custom Jev
              assessments. Those runs use your account; adding a key alone does
              not make a paid request.
            </p>
          </details>
          <details>
            <summary>What does Jev actually do?</summary>
            <p>
              It judges how evidence relates to your claim, ranks records for a
              research question, or assesses a pasted source against six
              research dimensions. Its assessments are provisional. A model’s
              confidence is not the probability that a claim is true.
            </p>
          </details>
          <details>
            <summary>How current is the evidence?</summary>
            <p>
              The collection covers evidence through{' '}
              {formatDate(researchData.meta.evidenceThrough)}, with targeted
              corrections reviewed on {formatDate(researchData.meta.reviewedOn)}
              . It is selective, not a live news search. New excerpts stay in
              your workspace and do not change the published findings.
            </p>
          </details>
          <details>
            <summary>What happens to my key and research?</summary>
            <p>
              Your key stays in this tab’s memory until you disconnect, refresh,
              or leave. An explicit run sends the key through this website’s
              server to TypeSafe, along with your question, selected evidence,
              and any supplied excerpt. This website does not save keys or
              submitted text. TypeSafe’s data policies apply. Use a dedicated
              key and public material. A request already received may incur
              usage even if you cancel.
            </p>
            <a
              href="https://typesafe.ai/legal/privacy-policy"
              target="_blank"
              rel="noreferrer"
            >
              Read TypeSafe’s privacy policy{' '}
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </details>
          <details>
            <summary>Who made this?</summary>
            <p>
              Created by Moayd Ghazzawi. The underlying study,{' '}
              <em>When Controls Raise the Cost</em>, keeps every judgment
              connected to sources, counterevidence, and questions that could
              change the conclusion.
            </p>
            <a href="/methodology">
              Read the methodology <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </details>
        </section>
        <div className="about-end">
          <h2>Follow a question further.</h2>
          <a className="about-start" href="/desk">
            Open research desk <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
