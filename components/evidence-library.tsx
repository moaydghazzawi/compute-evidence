'use client';
import { useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  Search,
  Download,
  RotateCcw,
  ChevronDown,
  ShieldQuestion,
  CircleHelp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterSelect } from '@/components/filter-select';
import { CopyLink } from '@/components/copy-link';
import { useUrlState } from '@/lib/use-url-state';
import { formatDate } from '@/lib/presentation';
import type { ResearchData } from '@/lib/research-types';

const defaults = {
  q: '',
  case: 'all',
  source: 'all',
  confidence: 'all',
  relationship: 'all',
};
export function EvidenceLibrary({
  data,
  initialCase = 'all',
}: {
  data: ResearchData;
  initialCase?: string;
}) {
  const sourceById = useMemo(
    () => new Map(data.sources.map((item) => [item.id, item])),
    [data.sources],
  );
  const sourceTypes = useMemo(
    () => [...new Set(data.evidence.map((item) => item.sourceType))].sort(),
    [data.evidence],
  );
  const options = useMemo(
    () => ({
      case: ['all', ...data.cases.map((item) => item.id)],
      source: ['all', ...sourceTypes],
      confidence: ['all', 'High', 'Moderate', 'Low'],
      relationship: ['all', 'supports', 'qualifies', 'counters'],
    }),
    [data.cases, sourceTypes],
  );
  const { state, update: updateUrl, ready } = useUrlState(defaults, options);
  const update = (changes: Partial<typeof defaults>, replace = false) =>
    updateUrl(changes, replace, true);
  const filters = ready ? state : { ...defaults, case: initialCase };
  const query = filters.q.trim().toLowerCase();
  const records = data.evidence.filter((item) => {
    const source = sourceById.get(item.sourceId)!;
    return (
      (!query ||
        [
          item.claim,
          item.quotationOrData,
          item.location,
          item.counterevidence,
          item.remainingUncertainty,
          source.title,
          source.organization,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)) &&
      (filters.case === 'all' || item.caseIds.includes(filters.case)) &&
      (filters.source === 'all' || item.sourceType === filters.source) &&
      (filters.confidence === 'all' ||
        item.confidence === filters.confidence) &&
      (filters.relationship === 'all' ||
        item.relationship === filters.relationship)
    );
  });
  const count = Object.entries(filters).filter(
    ([key, value]) => value !== defaults[key as keyof typeof defaults],
  ).length;
  const reset = () => update(defaults);
  useEffect(() => {
    const reveal = () => {
      const id = window.location.hash.slice(1);
      const target = document.getElementById(id);
      if (!target || !id.startsWith('ev-')) return;
      const detail = target.querySelector('details');
      if (detail) detail.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    };
    if (ready) reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, [ready]);
  function exportCsv() {
    const headers = [
      'evidence_id',
      'case_ids',
      'claim',
      'source_title',
      'source_organization',
      'source_url',
      'source_type',
      'publication_date',
      'access_date',
      'quotation_or_data',
      'source_location',
      'counterevidence',
      'confidence',
      'remaining_uncertainty',
      'relationship',
    ];
    const rows = records.map((item) => {
      const source = sourceById.get(item.sourceId)!;
      return [
        item.id,
        item.caseIds.join('; '),
        item.claim,
        source.title,
        source.organization,
        source.url,
        item.sourceType,
        item.publicationDate ?? '',
        item.accessDate,
        item.quotationOrData,
        item.location,
        item.counterevidence,
        item.confidence,
        item.remainingUncertainty,
        item.relationship,
      ];
    });
    const cell = (value: string) =>
      '"' +
      (/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""') +
      '"';
    const csv =
      '\uFEFF' +
      [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') +
      '\r\n';
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'evidence-' + records.length + '-records.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div data-testid="evidence-library" data-hydrated={String(ready)}>
      <div className="evidence-toolbar filter-toolbar">
        <div className="filter-toolbar-top">
          <label className="search-field" htmlFor="evidence-search">
            <Search size={18} aria-hidden="true" />
            <Input
              id="evidence-search"
              aria-label="Search evidence"
              placeholder="Search claims, sources, quotations…"
              value={filters.q}
              onChange={(event) => update({ q: event.target.value }, true)}
            />
          </label>
          <Button
            className="utility-button reset-button"
            variant="outline"
            onClick={reset}
            disabled={!count}
          >
            <RotateCcw aria-hidden="true" size={15} />
            Clear filters{count ? ' (' + count + ')' : ''}
          </Button>
        </div>
        <div className="evidence-filter-grid">
          <FilterSelect
            name="evidence-case"
            label="Research case"
            allLabel="All cases"
            value={filters.case}
            onChange={(value) => update({ case: value })}
            options={data.cases.map((item) => [item.id, item.shortTitle])}
          />
          <FilterSelect
            name="evidence-source"
            label="Source type"
            allLabel="All source types"
            value={filters.source}
            onChange={(source) => update({ source })}
            options={sourceTypes.map((item) => [item, item])}
          />
          <FilterSelect
            name="evidence-confidence"
            label="Confidence"
            allLabel="Any confidence"
            value={filters.confidence}
            onChange={(confidence) => update({ confidence })}
            options={['High', 'Moderate', 'Low'].map((item) => [item, item])}
          />
          <FilterSelect
            name="evidence-relationship"
            label="Relationship"
            allLabel="All relationships"
            value={filters.relationship}
            onChange={(relationship) => update({ relationship })}
            options={['supports', 'qualifies', 'counters'].map((item) => [
              item,
              item[0].toUpperCase() + item.slice(1),
            ])}
          />
        </div>
      </div>
      <div className="results-toolbar">
        <p aria-live="polite">
          <strong>{records.length}</strong> of {data.evidence.length} evidence
          records
          {filters.case !== 'all' ? (
            <span>
              {' '}
              ·{' '}
              {data.cases.find((item) => item.id === filters.case)?.shortTitle}
            </span>
          ) : null}
        </p>
        <div>
          <CopyLink />
          <Button
            className="utility-button"
            variant="outline"
            disabled={!records.length}
            onClick={exportCsv}
          >
            <Download size={16} aria-hidden="true" />
            Export {records.length} records
          </Button>
        </div>
      </div>
      {records.length ? (
        <ol className="evidence-list" aria-label="Evidence records">
          {records.map((item) => {
            const source = sourceById.get(item.sourceId)!;
            return (
              <li className="evidence-card" id={item.id} key={item.id}>
                <article aria-labelledby={item.id + '-claim'}>
                  <div className="evidence-card-top">
                    <span className="record-number">
                      EV-
                      {String(data.evidence.indexOf(item) + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={
                        'relationship relationship-' + item.relationship
                      }
                    >
                      {item.relationship}
                    </span>
                    <span
                      className={
                        'confidence confidence-' + item.confidence.toLowerCase()
                      }
                    >
                      {item.confidence} confidence
                    </span>
                  </div>
                  <h2 id={item.id + '-claim'}>{item.claim}</h2>
                  <a
                    className="evidence-source"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span>
                      <strong>{source.organization}</strong>
                      <span>{source.title}</span>
                    </span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                  <div className="evidence-provenance">
                    <span>
                      {source.primary ? 'Primary source' : 'Secondary source'}
                    </span>
                    <span>{item.sourceType}</span>
                    <span>
                      Published{' '}
                      {item.publicationDate
                        ? formatDate(item.publicationDate)
                        : 'date unverified'}
                    </span>
                  </div>
                  <details className="evidence-details">
                    <summary>
                      Inspect evidence and counterevidence{' '}
                      <ChevronDown size={17} aria-hidden="true" />
                    </summary>
                    <div className="evidence-detail-body">
                      <div className="source-excerpt">
                        <p className="eyebrow">Quotation or reported data</p>
                        <blockquote>{item.quotationOrData}</blockquote>
                        <dl>
                          <div>
                            <dt>Exact location</dt>
                            <dd>{item.location}</dd>
                          </div>
                          <div>
                            <dt>Source accessed</dt>
                            <dd>{formatDate(item.accessDate)}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="evidence-caveats">
                        <section>
                          <h3>
                            <ShieldQuestion size={17} aria-hidden="true" />
                            Counterevidence
                          </h3>
                          <p>{item.counterevidence}</p>
                        </section>
                        <section>
                          <h3>
                            <CircleHelp size={17} aria-hidden="true" />
                            Remaining uncertainty
                          </h3>
                          <p>{item.remainingUncertainty}</p>
                        </section>
                      </div>
                    </div>
                  </details>
                  <div className="evidence-card-footer">
                    <div>
                      <span>Applies to</span>
                      {item.caseIds.map((id) => (
                        <a key={id} href={'/?case=' + id + '#cases'}>
                          {data.cases.find((c) => c.id === id)?.shortTitle}
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                    <CopyLink
                      path={'/evidence#' + item.id}
                      label="Record link"
                    />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="empty-state">
          <Search size={28} aria-hidden="true" />
          <h2>No evidence matches these filters.</h2>
          <p>
            Try another phrase or clear the filters to see the full library.
          </p>
          <Button variant="outline" className="utility-button" onClick={reset}>
            Show all evidence
          </Button>
        </div>
      )}
      <p className="library-note">
        “Primary” identifies an original or official source for the recorded
        claim. It does not mean that the finding has been independently
        verified. Full JSON and CSV datasets are available below.
      </p>
    </div>
  );
}
