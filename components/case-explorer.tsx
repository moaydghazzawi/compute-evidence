'use client';
import { useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  RotateCcw,
  FileText,
  CircleHelp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { FilterSelect } from '@/components/filter-select';
import { CopyLink } from '@/components/copy-link';
import { Verdict } from '@/components/verdict';
import { useUrlState } from '@/lib/use-url-state';
import type {
  Evidence,
  ResearchCase,
  Source,
  TaxonomyItem,
} from '@/lib/research-types';

interface Props {
  cases: ResearchCase[];
  evidence: Evidence[];
  sources: Source[];
  responseTypes: TaxonomyItem[];
  classifications: TaxonomyItem[];
}
const defaults = {
  q: '',
  response: 'all',
  year: 'all',
  source: 'all',
  confidence: 'all',
  dependency: 'all',
  judgment: 'all',
  case: '',
};
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};
declare global {
  interface Document {
    readonly modelContext?: ModelContext;
  }
}

export function CaseExplorer({
  cases,
  evidence,
  sources,
  responseTypes,
  classifications,
}: Props) {
  const detailRef = useRef<HTMLHeadingElement>(null);
  const evidenceById = useMemo(
    () => new Map(evidence.map((item) => [item.id, item])),
    [evidence],
  );
  const sourceById = useMemo(
    () => new Map(sources.map((item) => [item.id, item])),
    [sources],
  );
  const sourceTypes = useMemo(
    () => [...new Set(evidence.map((item) => item.sourceType))].sort(),
    [evidence],
  );
  const years = useMemo(
    () => [...new Set(cases.map((item) => item.date.slice(0, 4)))].sort(),
    [cases],
  );
  const dependencies = useMemo(
    () => [...new Set(cases.map((item) => item.dependencyStatus))].sort(),
    [cases],
  );
  const options = useMemo(
    () => ({
      response: ['all', ...responseTypes.map((item) => item.id)],
      year: ['all', ...years],
      source: ['all', ...sourceTypes],
      confidence: ['all', 'High', 'Moderate', 'Low'],
      dependency: ['all', ...dependencies],
      judgment: ['all', ...classifications.map((item) => item.id)],
      case: ['', ...cases.map((item) => item.id)],
    }),
    [responseTypes, years, sourceTypes, dependencies, classifications, cases],
  );
  const { state, update, ready } = useUrlState(defaults, options);
  function matches(filters: typeof defaults) {
    const query = filters.q.trim().toLowerCase();
    return cases.filter((item) => {
      const records = item.evidenceIds.map((id) => evidenceById.get(id)!);
      const searchable = [
        item.title,
        item.shortTitle,
        item.finding,
        ...item.uncertainties,
        ...item.tests.map((t) => t.answer),
        ...records.flatMap((e) => [
          e.claim,
          e.quotationOrData,
          sourceById.get(e.sourceId)?.organization ?? '',
        ]),
      ]
        .join(' ')
        .toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (filters.response === 'all' ||
          item.responseTypes.includes(filters.response)) &&
        (filters.year === 'all' || item.date.startsWith(filters.year)) &&
        (filters.source === 'all' ||
          records.some((e) => e.sourceType === filters.source)) &&
        (filters.confidence === 'all' ||
          item.confidence === filters.confidence) &&
        (filters.dependency === 'all' ||
          item.dependencyStatus === filters.dependency) &&
        (filters.judgment === 'all' || item.classification === filters.judgment)
      );
    });
  }
  const filtered = matches(state);
  const activeCase =
    filtered.find((item) => item.id === state.case) ?? filtered[0];
  const activeClassification = classifications.find(
    (item) => item.id === activeCase?.classification,
  );
  const activeEvidence =
    activeCase?.evidenceIds.map((id) => evidenceById.get(id)!) ?? [];
  const count = Object.entries(state).filter(
    ([key, value]) =>
      key !== 'case' && value !== defaults[key as keyof typeof defaults],
  ).length;
  const reset = () => update(defaults);
  function selectCase(id: string, reveal = false) {
    update({ case: id });
    if (reveal)
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'instant'
            : 'smooth',
          block: 'start',
        });
      });
  }
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      const registration = context.registerTool(
        {
          name: 'filter_research_cases',
          title: 'Filter research cases',
          description:
            'Filter the visible research cases by response, anchor year, source type, confidence, dependency, judgment, and text.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              responseType: { type: 'string', enum: options.response },
              year: { type: 'string', enum: options.year },
              sourceType: { type: 'string', enum: options.source },
              confidence: { type: 'string', enum: options.confidence },
              dependency: { type: 'string', enum: options.dependency },
              judgment: { type: 'string', enum: options.judgment },
            },
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (!input || typeof input !== 'object' || Array.isArray(input))
              throw new Error('Filters must be an object.');
            const candidate = input as Record<string, unknown>;
            const next = {
              ...defaults,
              q: typeof candidate.query === 'string' ? candidate.query : '',
            };
            for (const [inputKey, key] of Object.entries({
              responseType: 'response',
              year: 'year',
              sourceType: 'source',
              confidence: 'confidence',
              dependency: 'dependency',
              judgment: 'judgment',
            })) {
              const field = key as keyof typeof options;
              const value = candidate[inputKey] ?? 'all';
              if (typeof value !== 'string' || !options[field].includes(value))
                throw new Error('Unsupported ' + inputKey);
              next[field] = value;
            }
            update(next);
            const found = matches(next);
            return {
              count: found.length,
              caseIds: found.map((item) => item.id),
              filters: next,
            };
          },
        },
        { signal: lifecycle.signal },
      );
      void Promise.resolve(registration).catch(() => undefined);
    } catch {
      return;
    }
    return () => lifecycle.abort();
  });

  return (
    <div data-hydrated={String(ready)} data-testid="case-explorer">
      <div className="filter-toolbar">
        <div className="filter-toolbar-top">
          <label className="search-field" htmlFor="case-search">
            <Search size={18} aria-hidden="true" />
            <Input
              id="case-search"
              aria-label="Search cases"
              placeholder="Search cases, claims, or questions…"
              value={state.q}
              onChange={(event) => update({ q: event.target.value }, true)}
            />
          </label>
          <div className="filter-count" aria-live="polite">
            {String(filtered.length).padStart(2, '0')} /{' '}
            {String(cases.length).padStart(2, '0')} cases
          </div>
          <Button
            className="utility-button reset-button"
            variant="outline"
            onClick={reset}
            disabled={!count}
            aria-label="Reset all filters"
          >
            <RotateCcw size={15} aria-hidden="true" /> Reset
            {count ? ' (' + count + ')' : ''}
          </Button>
        </div>
        <div className="filters-grid">
          <FilterSelect
            label="Response type"
            allLabel="All responses"
            value={state.response}
            onChange={(response) => update({ response })}
            options={responseTypes.map((item) => [item.id, item.label])}
          />
          <FilterSelect
            label="Case date"
            allLabel="All anchor years"
            value={state.year}
            onChange={(year) => update({ year })}
            options={years.map((item) => [item, item])}
          />
          <FilterSelect
            label="Source type"
            allLabel="All source types"
            value={state.source}
            onChange={(source) => update({ source })}
            options={sourceTypes.map((item) => [item, item])}
          />
          <FilterSelect
            label="Confidence"
            allLabel="Any confidence"
            value={state.confidence}
            onChange={(confidence) => update({ confidence })}
            options={['High', 'Moderate', 'Low'].map((item) => [item, item])}
          />
          <FilterSelect
            label="Dependency"
            allLabel="Any dependency"
            value={state.dependency}
            onChange={(dependency) => update({ dependency })}
            options={dependencies.map((item) => [item, item])}
          />
          <FilterSelect
            label="Judgment"
            allLabel="All judgments"
            value={state.judgment}
            onChange={(judgment) => update({ judgment })}
            options={classifications.map((item) => [item.id, item.label])}
          />
        </div>
      </div>
      {filtered.length ? (
        <div className="case-workspace">
          <div className="mobile-case-picker">
            <label htmlFor="mobile-case">Selected case</label>
            <NativeSelect
              className="w-full"
              id="mobile-case"
              value={activeCase?.id}
              onChange={(event) => selectCase(event.target.value, true)}
            >
              {filtered.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.shortTitle}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <ol className="case-list" aria-label="Filtered research cases">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  className="case-selector"
                  type="button"
                  aria-pressed={activeCase?.id === item.id}
                  onClick={() => selectCase(item.id)}
                >
                  <span className="case-list-top">
                    <span className="record-number">
                      {String(cases.indexOf(item) + 1).padStart(2, '0')}
                    </span>
                    <span>{item.evidenceIds.length} records</span>
                  </span>
                  <span className="case-response">
                    {item.responseTypes
                      .map(
                        (id) => responseTypes.find((t) => t.id === id)?.label,
                      )
                      .join(' · ')}
                  </span>
                  <h3>{item.shortTitle}</h3>
                  <Verdict
                    classification={classifications.find(
                      (c) => c.id === item.classification,
                    )!}
                    compact
                  />
                  <ArrowRight
                    className="case-arrow"
                    size={16}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ol>
          {activeCase && activeClassification ? (
            <article
              className="case-detail"
              aria-labelledby={activeCase.id + '-title'}
            >
              <div className="case-detail-header">
                <div className="case-detail-meta">
                  <span className="eyebrow">
                    Case{' '}
                    {String(cases.indexOf(activeCase) + 1).padStart(2, '0')}{' '}
                    <span className="eyebrow-divider">/</span>{' '}
                    {activeCase.period}
                  </span>
                  <CopyLink path={'/?case=' + activeCase.id + '#cases'} />
                </div>
                <h3 id={activeCase.id + '-title'} tabIndex={-1} ref={detailRef}>
                  {activeCase.title}
                </h3>
                <p className="case-finding">{activeCase.finding}</p>
                <div className="case-verdict-row">
                  <Verdict classification={activeClassification} />
                  <span className="confidence">
                    {activeCase.confidence} confidence
                  </span>
                </div>
              </div>
              <div className="case-tests">
                {activeCase.tests.map((test, index) => (
                  <section key={test.id}>
                    <div className="test-heading">
                      <span className="record-number">0{index + 1}</span>
                      <h4>{test.label}</h4>
                      <span className="status-tag">{test.status}</span>
                    </div>
                    <p>{test.answer}</p>
                  </section>
                ))}
              </div>
              <div className="case-bottom">
                <section>
                  <h4>
                    <CircleHelp size={17} aria-hidden="true" />
                    Still unresolved
                  </h4>
                  <ul>
                    {activeCase.uncertainties.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <div className="case-evidence-heading">
                    <h4>
                      <FileText size={17} aria-hidden="true" />
                      Evidence
                    </h4>
                    <a href={'/evidence?case=' + activeCase.id}>
                      View all {activeEvidence.length}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  </div>
                  <div className="case-evidence-links">
                    {activeEvidence.slice(0, 3).map((item) => (
                      <a
                        key={item.id}
                        href={'/evidence?case=' + activeCase.id + '#' + item.id}
                      >
                        <span>{item.claim}</span>
                        <small>
                          {sourceById.get(item.sourceId)?.organization}
                        </small>
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            </article>
          ) : null}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} aria-hidden="true" />
          <h3>No cases match these filters.</h3>
          <p>
            Try a broader search or remove a filter to return to the{' '}
            {cases.length} documented cases.
          </p>
          <Button onClick={reset} className="utility-button" variant="outline">
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
