import { ArrowUpRight } from 'lucide-react';
import { researchData } from '@/lib/research';
import { formatDate } from '@/lib/presentation';
import { TOOL_NAME } from '@/lib/site-identity';
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-main">
        <div>
          <a className="footer-title" href="/">
            {TOOL_NAME}
          </a>
          <p>Created by Moayd Ghazzawi.</p>
          <p className="footer-note">
            Judgments describe the reviewed public record. Evidence through{' '}
            {formatDate(researchData.meta.evidenceThrough)}.
          </p>
        </div>
        <nav aria-label="Footer">
          <a href="/desk">Research desk</a>
          <a href="/research">Research</a>
          <a href="/">About the tool</a>
          <a href="/methodology">Methodology</a>
          <a href="/evidence">Evidence library</a>
          <a href="/data/research-dataset.json" download>
            JSON dataset
          </a>
          <a href="/data/evidence.csv" download>
            CSV dataset
          </a>
          <a
            href="https://github.com/moaydghazzawi/when-controls-raise-the-cost"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </div>
      <div className="page-width footer-bottom">
        <span>Independent research · v{researchData.meta.version}</span>
        <span>
          Reviewed {formatDate(researchData.meta.reviewedOn)} · Revisable
          judgments.
        </span>
      </div>
    </footer>
  );
}
