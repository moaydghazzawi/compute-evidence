'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Verdict } from '@/components/verdict';
import type { Evidence, ResearchCase, Source, TaxonomyItem } from '@/lib/research-types';

interface Props {
  cases: ResearchCase[];
  evidence: Evidence[];
  sources: Source[];
  responseTypes: TaxonomyItem[];
  classifications: TaxonomyItem[];
}

const ALL = 'all';

type FilterValues = {
  query: string;
  responseType: string;
  year: string;
  sourceType: string;
  confidence: string;
  dependency: string;
};

type SelectFilter = Exclude<keyof FilterValues, 'query'>;

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

function matchingCases(cases: ResearchCase[], evidenceById: Map<string, Evidence>, filters: FilterValues) {
  const normalized = filters.query.trim().toLowerCase();
  return cases.filter((item) => {
    const itemSourceTypes = new Set(item.evidenceIds.map((id) => evidenceById.get(id)?.sourceType).filter(Boolean));
    const searchable = `${item.title} ${item.finding} ${item.uncertainties.join(' ')}`.toLowerCase();
    return (!normalized || searchable.includes(normalized))
      && (filters.responseType === ALL || item.responseTypes.includes(filters.responseType))
      && (filters.year === ALL || item.date.startsWith(filters.year))
      && (filters.sourceType === ALL || itemSourceTypes.has(filters.sourceType))
      && (filters.confidence === ALL || item.confidence === filters.confidence)
      && (filters.dependency === ALL || item.dependencyStatus === filters.dependency);
  });
}

export function CaseExplorer({ cases, evidence, sources, responseTypes, classifications }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [responseType, setResponseType] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [sourceType, setSourceType] = useState(ALL);
  const [confidence, setConfidence] = useState(ALL);
  const [dependency, setDependency] = useState(ALL);
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? '');

  const evidenceById = useMemo(() => new Map(evidence.map((item) => [item.id, item])), [evidence]);
  const sourceById = useMemo(() => new Map(sources.map((item) => [item.id, item])), [sources]);
  const classificationById = useMemo(() => new Map(classifications.map((item) => [item.id, item])), [classifications]);
  const responseById = useMemo(() => new Map(responseTypes.map((item) => [item.id, item])), [responseTypes]);
  const sourceTypes = useMemo(() => [...new Set(evidence.map((item) => item.sourceType))].sort(), [evidence]);
  const dependencies = useMemo(() => [...new Set(cases.map((item) => item.dependencyStatus))].sort(), [cases]);
  const years = useMemo(() => [...new Set(cases.map((item) => item.date.slice(0, 4)))].sort(), [cases]);

  const currentFilters = useMemo(
    () => ({ query, responseType, year, sourceType, confidence, dependency }),
    [confidence, dependency, query, responseType, sourceType, year],
  );
  const filtered = useMemo(() => matchingCases(cases, evidenceById, currentFilters), [cases, currentFilters, evidenceById]);
  const activeCase = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const activeClassification = activeCase ? classificationById.get(activeCase.classification) : undefined;
  const activeEvidence = activeCase
    ? activeCase.evidenceIds.map((id) => evidenceById.get(id)).filter((item): item is Evidence => Boolean(item))
    : [];

  const reset = () => {
    setQuery('');
    setResponseType(ALL);
    setYear(ALL);
    setSourceType(ALL);
    setConfidence(ALL);
    setDependency(ALL);
  };

  const hasFilters = Boolean(query) || [responseType, year, sourceType, confidence, dependency].some((value) => value !== ALL);

  useEffect(() => {
    rootRef.current?.setAttribute('data-hydrated', 'true');
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    const allowed: Record<SelectFilter, Set<string>> = {
      responseType: new Set([ALL, ...responseTypes.map((item) => item.id)]),
      year: new Set([ALL, ...years]),
      sourceType: new Set([ALL, ...sourceTypes]),
      confidence: new Set([ALL, 'High', 'Moderate', 'Low']),
      dependency: new Set([ALL, ...dependencies]),
    };

    try {
      const registration = context.registerTool({
        name: 'filter_research_cases',
        title: 'Filter research cases',
        description: 'Apply the same response, date, source, confidence, dependency, and text filters available in the visible case explorer.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            responseType: { type: 'string', enum: [...allowed.responseType] },
            year: { type: 'string', enum: [...allowed.year] },
            sourceType: { type: 'string', enum: [...allowed.sourceType] },
            confidence: { type: 'string', enum: [...allowed.confidence] },
            dependency: { type: 'string', enum: [...allowed.dependency] },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Filters must be an object.');
          const candidate = input as Partial<FilterValues>;
          const next: FilterValues = {
            query: typeof candidate.query === 'string' ? candidate.query : '',
            responseType: candidate.responseType ?? ALL,
            year: candidate.year ?? ALL,
            sourceType: candidate.sourceType ?? ALL,
            confidence: candidate.confidence ?? ALL,
            dependency: candidate.dependency ?? ALL,
          };

          for (const key of ['responseType', 'year', 'sourceType', 'confidence', 'dependency'] as SelectFilter[]) {
            if (!allowed[key].has(next[key])) throw new Error(`Unsupported ${key}: ${next[key]}`);
          }

          setQuery(next.query);
          setResponseType(next.responseType);
          setYear(next.year);
          setSourceType(next.sourceType);
          setConfidence(next.confidence);
          setDependency(next.dependency);
          const matches = matchingCases(cases, evidenceById, next);
          return { count: matches.length, caseIds: matches.map((item) => item.id), filters: next };
        },
      }, { signal: lifecycle.signal });
      void Promise.resolve(registration).catch(() => undefined);
    } catch {
      return;
    }

    return () => lifecycle.abort();
  }, [cases, dependencies, evidenceById, responseTypes, sourceTypes, years]);

  return (
    <div data-hydrated="false" data-testid="case-explorer" ref={rootRef}>
      <div className="border border-border bg-card p-4 lg:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="size-4 text-cobalt" />
            <p className="text-xs font-bold uppercase tracking-[0.12em]">Filter the evidence</p>
          </div>
          <p aria-live="polite" className="font-mono text-[11px] text-muted-foreground">
            {String(filtered.length).padStart(2, '0')} / {String(cases.length).padStart(2, '0')} cases
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_repeat(5,minmax(130px,1fr))_auto]">
          <label className="relative block md:col-span-2 xl:col-span-1" htmlFor="case-search">
            <span className="sr-only">Search cases</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="rounded-none bg-background pl-8 text-xs" id="case-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search claims or gaps" value={query} />
          </label>
          <FilterSelect allLabel="All responses" label="Response type" onChange={setResponseType} value={responseType} options={responseTypes.map((item) => [item.id, item.label])} />
          <FilterSelect allLabel="All dates" label="Case date" onChange={setYear} value={year} options={years.map((item) => [item, item])} />
          <FilterSelect allLabel="All source types" label="Source type" onChange={setSourceType} value={sourceType} options={sourceTypes.map((item) => [item, item])} />
          <FilterSelect allLabel="Any confidence" label="Confidence" onChange={setConfidence} value={confidence} options={['High', 'Moderate', 'Low'].map((item) => [item, item])} />
          <FilterSelect allLabel="Any dependency" label="Dependency" onChange={setDependency} value={dependency} options={dependencies.map((item) => [item, item])} />
          <Button aria-label="Reset all filters" className="h-8 rounded-none" disabled={!hasFilters} onClick={reset} size="icon" variant="outline"><RotateCcw className="size-3.5" /></Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <ol className="border border-border bg-card" aria-label="Filtered research cases">
          {filtered.length ? filtered.map((item, index) => {
            const classification = classificationById.get(item.classification)!;
            return (
              <li className="border-b border-border last:border-b-0" key={item.id}>
                <button
                  aria-pressed={activeCase?.id === item.id}
                  className="case-selector group w-full p-4 text-left"
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{item.confidence} confidence</span>
                  </div>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-cobalt">{item.responseTypes.map((id) => responseById.get(id)?.label).join(' · ')}</p>
                  <h3 className="mt-1 font-heading text-xl leading-tight">{item.shortTitle}</h3>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Verdict classification={classification} compact />
                    <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              </li>
            );
          }) : (
            <li className="p-8 text-center">
              <p className="font-heading text-xl">No case matches every filter.</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">The empty state is meaningful: the MVP has only five deliberately documented cases.</p>
              <Button className="mt-5 rounded-none" onClick={reset} size="sm" variant="outline">Clear filters</Button>
            </li>
          )}
        </ol>

        {activeCase && activeClassification ? (
          <article className="border border-border bg-card" aria-labelledby={`${activeCase.id}-title`}>
            <div className="grid gap-5 border-b border-border p-5 lg:grid-cols-[1fr_auto] lg:p-7">
              <div>
                <p className="eyebrow">Selected case · {activeCase.period}</p>
                <h3 className="font-heading text-3xl tracking-tight lg:text-4xl" id={`${activeCase.id}-title`}>{activeCase.title}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{activeCase.finding}</p>
              </div>
              <div className="lg:text-right">
                <Verdict classification={activeClassification} />
                <p className="mt-3 text-[11px] font-semibold text-muted-foreground">{activeCase.dependencyStatus}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 2xl:grid-cols-3">
              {activeCase.tests.map((test, index) => (
                <section className="min-h-48 border-b border-border p-5 sm:border-r sm:[&:nth-child(2n)]:border-r-0 2xl:[&:nth-child(2n)]:border-r 2xl:[&:nth-child(3n)]:border-r-0" key={test.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground">Q{index + 1}</span>
                    <span className="status-tag">{test.status}</span>
                  </div>
                  <h4 className="mt-6 text-xs font-extrabold uppercase tracking-[0.08em]">{test.label}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{test.answer}</p>
                </section>
              ))}
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-2 lg:p-7">
              <section>
                <p className="eyebrow">Remaining uncertainty</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {activeCase.uncertainties.map((item) => <li className="flex gap-2" key={item}><span className="mt-1 size-1.5 shrink-0 bg-signal" />{item}</li>)}
                </ul>
              </section>
              <section>
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow">Evidence packet</p>
                  <a className="text-[11px] font-bold text-cobalt hover:underline" href={`/evidence?case=${activeCase.id}`}>Open all {activeEvidence.length}</a>
                </div>
                <div className="space-y-2">
                  {activeEvidence.slice(0, 3).map((item) => {
                    const source = sourceById.get(item.sourceId);
                    return (
                      <a className="block border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground transition-colors hover:border-cobalt hover:text-foreground" href={`/evidence#${item.id}`} key={item.id}>
                        {item.claim} <span className="font-semibold text-foreground">[{source?.organization}]</span>
                      </a>
                    );
                  })}
                </div>
              </section>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}

function FilterSelect({ allLabel, label, value, onChange, options }: { allLabel: string; label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  const id = `filter-${label.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <label className="block" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <NativeSelect aria-label={label} className="w-full" id={id} onChange={(event) => onChange(event.target.value)} size="default" value={value}>
        <NativeSelectOption value={ALL}>{allLabel}</NativeSelectOption>
        {options.map(([optionValue, optionLabel]) => <NativeSelectOption key={optionValue} value={optionValue}>{optionLabel}</NativeSelectOption>)}
      </NativeSelect>
    </label>
  );
}
