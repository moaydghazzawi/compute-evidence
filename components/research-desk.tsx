'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  ArrowUpRight,
  ArrowUp,
  Bookmark,
  Check,
  Download,
  KeyRound,
  X,
  Plus,
  SlidersHorizontal,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react';
import { DESK_EXAMPLES } from '@/lib/research-desk-examples';
import {
  MAX_EXCERPT,
  MAX_QUERY,
  MODES,
  ROLE_LABELS,
  briefMarkdown,
  eligibleEvidence,
  isVendorSource,
  keywordMatches,
  parseDeskInput,
} from '@/lib/research-desk';
import type {
  BriefCandidate,
  BriefItem,
  DeskInput,
  DeskMatch,
  DeskMode,
  DeskResult,
  SourcePolicy,
} from '@/lib/research-desk';
import type { ResearchData } from '@/lib/research-types';
import { formatDate } from '@/lib/presentation';

const emptySource = { title: '', url: '', date: '', excerpt: '' };
const briefQuestions: Record<string, string> = {
  'deepseek-cost': 'What does DeepSeek’s cost estimate actually measure?',
  'domestic-training':
    'What does domestic training establish about hardware dependence?',
  'production-serving':
    'What evidence distinguishes production serving from a benchmark?',
  diversion: 'What does the record establish about chip diversion?',
  subsidy: 'What evidence connects public support to a named recipient?',
};
const sourceLabels = {
  new_material: 'Adds material to this selection',
  corroborates: 'Corroborates selected evidence',
  conflicts: 'Conflicts with selected evidence',
  unclear: 'Novelty remains unclear',
};
const supportLabels = {
  supports: 'Excerpt supports the claim',
  partial: 'Excerpt supports part of the claim',
  contradicts: 'Excerpt contradicts the claim',
  not_established: 'Claim not established by the excerpt',
};
const dimensionLabels = {
  addresses: 'Addresses',
  partly: 'Partly addresses',
  not_addressed: 'Not addressed',
  unclear: 'Unclear',
};
const subscribeHydration = () => () => {};

export function ResearchDesk({ data }: { data: ResearchData }) {
  const [mode, setMode] = useState<DeskMode>('claim');
  const [query, setQuery] = useState(DESK_EXAMPLES[0].query);
  const [sourcePolicy, setSourcePolicy] = useState<SourcePolicy>('all');
  const [caseId, setCaseId] = useState('');
  const [source, setSource] = useState(emptySource);
  const [result, setResult] = useState<{
    signature: string;
    value: DeskResult;
  } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [consent, setConsent] = useState(false);
  const [keyVerified, setKeyVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [runs, setRuns] = useState(0);
  const [runLimit, setRunLimit] = useState(5);
  const [pins, setPins] = useState<BriefItem[]>([]);
  const [candidate, setCandidate] = useState<BriefCandidate>();
  const [briefTitle, setBriefTitle] = useState('');
  const [lane, setLane] = useState('all');
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const requestRef = useRef<AbortController | null>(null);
  const keyDetails = useRef<HTMLDetailsElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const serialRef = useRef(0);
  const input: DeskInput = {
    mode,
    query,
    sourcePolicy,
    caseId,
    ...(mode === 'source' ? { source } : {}),
  };
  const signature = JSON.stringify(input);
  const signatureRef = useRef(signature);

  useEffect(() => {
    const forget = () => {
      requestRef.current?.abort();
      serialRef.current += 1;
      setApiKey('');
      setKeyDraft('');
      setConsent(false);
      setKeyVerified(false);
      setBusy(false);
    };
    window.addEventListener('pagehide', forget);
    return () => {
      requestRef.current?.abort();
      window.removeEventListener('pagehide', forget);
    };
  }, []);
  useEffect(() => {
    signatureRef.current = signature;
  }, [signature]);

  const currentResult = result?.signature === signature ? result.value : null;
  const example =
    mode !== 'source' && mode !== 'brief'
      ? DESK_EXAMPLES.find((item) => item.query === query.trim())
      : undefined;
  const eligible = eligibleEvidence(data, input);
  const eligibleIds = new Set(eligible.map((item) => item.id));
  const suggested: DeskMatch[] = example
    ? example.matches.filter((item) => eligibleIds.has(item.id))
    : keywordMatches(
        eligible,
        mode === 'source' ? `${query} ${source.title}` : query,
      ).map((item) => ({ id: item.id, role: 'context' }));
  let matches = currentResult
    ? currentResult.matches.filter((item) => item.role !== 'unrelated')
    : suggested;
  if (mode === 'challenge' && !currentResult)
    matches = [...matches].sort(
      (a, b) =>
        Number(b.role === 'challenges' || b.role === 'qualifies') -
        Number(a.role === 'challenges' || a.role === 'qualifies'),
    );
  const classified = Boolean(currentResult || example);
  const shown = matches.filter(
    (item) =>
      lane === 'all' ||
      (lane === 'limits'
        ? ['qualifies', 'challenges', 'unresolved'].includes(item.role)
        : item.role === 'supports'),
  );
  const sourceMap = new Map(data.sources.map((item) => [item.id, item]));
  const evidenceMap = new Map(data.evidence.map((item) => [item.id, item]));

  const cancel = () => {
    serialRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setBusy(false);
  };
  const revise = (change: () => void) => {
    cancel();
    setError('');
    setLane('all');
    change();
  };
  const updateSource = (patch: Partial<typeof emptySource>) =>
    revise(() => setSource((value) => ({ ...value, ...patch })));
  const clearKey = () => {
    cancel();
    setApiKey('');
    setKeyDraft('');
    setConsent(false);
    setKeyVerified(false);
    setError('');
    setNotice(
      'Key cleared from this tab. A request already sent may still incur usage.',
    );
  };
  const addKey = () => {
    if (!/^[\x21-\x7e]{12,512}$/.test(keyDraft.trim())) {
      setError('Enter a valid TypeSafe API key without spaces.');
      return;
    }
    if (!consent) {
      setError('Read and accept the connection notice first.');
      return;
    }
    cancel();
    setApiKey(keyDraft.trim());
    setKeyDraft('');
    setKeyVerified(false);
    setError('');
    setNotice(
      'Key added for this tab. TypeSafe will check it when you run an analysis.',
    );
    if (keyDetails.current) keyDetails.current.open = false;
  };
  const run = async () => {
    if (requestRef.current || busy) return;
    if (!apiKey) {
      setError('');
      setNotice(
        example
          ? 'Example evidence ready.'
          : `${matches.length} keyword matches. Open a record to inspect its source.`,
      );
      resultsHeading.current?.focus({ preventScroll: true });
      resultsHeading.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
      return;
    }
    if (runs >= runLimit) {
      setError(
        'You reached this tab’s run limit. Increase it in Jev settings if you want to continue.',
      );
      return;
    }
    let validated: DeskInput;
    try {
      validated = parseDeskInput(input, data);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Check your input.');
      return;
    }
    if (!eligible.length) {
      setError(
        'No evidence matches these filters. Broaden your selection first.',
      );
      return;
    }
    const controller = new AbortController();
    const serial = ++serialRef.current;
    requestRef.current = controller;
    const sentSignature = signature;
    setBusy(true);
    setError('');
    setNotice('');
    setRuns((value) => value + 1);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 45_000);
    try {
      const response = await fetch('/api/research-desk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-Research-Action': 'run',
        },
        body: JSON.stringify(validated),
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        signal: controller.signal,
      });
      const payload: unknown = await response.json();
      if (
        serial !== serialRef.current ||
        sentSignature !== signatureRef.current
      )
        return;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        throw new Error('The assessment was incomplete.');
      const body = payload as Record<string, unknown>;
      if (!response.ok) {
        if (response.status === 401) setKeyVerified(false);
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : 'The assessment could not be completed.',
        );
      }
      if (
        body.kind !== 'jev' ||
        !Array.isArray(body.matches) ||
        body.matches.some(
          (match: DeskMatch) =>
            !eligibleIds.has(match.id) ||
            !Object.hasOwn(ROLE_LABELS, match.role),
        )
      )
        throw new Error(
          'The assessment was incomplete. Please try again when ready.',
        );
      setResult({ signature: sentSignature, value: payload as DeskResult });
      setKeyVerified(true);
      setNotice('Assessment ready. Inspect the sources before relying on it.');
    } catch (issue) {
      if (
        serial === serialRef.current &&
        (!controller.signal.aborted || timedOut)
      )
        setError(
          timedOut
            ? 'The check took too long. A request already received by TypeSafe may still incur usage.'
            : issue instanceof Error
              ? issue.message
              : 'The connection failed. No automatic retry was made.',
        );
    } finally {
      clearTimeout(timeout);
      if (serial === serialRef.current) {
        requestRef.current = null;
        setBusy(false);
      }
    }
  };
  const chooseExample = (id: string) => {
    cancel();
    setError('');
    setLane('all');
    const selected = DESK_EXAMPLES.find((item) => item.id === id)!;
    setQuery(mode === 'brief' ? briefQuestions[selected.id] : selected.query);
    setResult(null);
    setNotice('');
  };
  const pin = (match: DeskMatch) => {
    setPins((items) =>
      items.some((item) => item.id === match.id)
        ? items.filter((item) => item.id !== match.id)
        : [
            ...items,
            {
              id: match.id,
              query,
              mode,
              role: classified ? match.role : 'unassessed',
              origin: currentResult
                ? 'Jev assessment'
                : example
                  ? 'Editorial example'
                  : 'Manual selection',
              ...(currentResult ? { confidence: match.confidence } : {}),
            },
          ],
    );
  };
  const saveSource = () => {
    try {
      const validated = parseDeskInput(input, data);
      if (!validated.source) return;
      setCandidate({
        source: validated.source,
        query: validated.query,
        sourcePolicy: validated.sourcePolicy,
        caseId: validated.caseId,
        model: currentResult?.model,
        assessment: currentResult?.sourceAssessment,
      });
      setNotice(
        'Source added to your brief. It remains separate from the published research.',
      );
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : 'Check the source details.',
      );
    }
  };
  const download = () => {
    const content = briefMarkdown(data, pins, briefTitle || query, candidate);
    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/markdown;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'research-brief.md';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Brief downloaded with citations and limitations.');
  };
  const demoSource = () => {
    cancel();
    setError('');
    setLane('all');
    const item = evidenceMap.get('ev-cloudmatrix-production')!;
    const sourceRecord = sourceMap.get(item.sourceId)!;
    setQuery(DESK_EXAMPLES[2].query);
    setSource({
      title: sourceRecord.title,
      url: sourceRecord.url,
      date: sourceRecord.publicationDate || '',
      excerpt: `${item.quotationOrData}\n\n${item.counterevidence}`,
    });
    setNotice(
      'Loaded an existing research excerpt for practice. It is already in this collection.',
    );
  };

  return (
    <div
      className="desk page-width"
      data-testid="research-desk"
      data-hydrated={hydrated}
    >
      <div className="desk-heading">
        <div>
          <p className="desk-kicker">CHIPS. AI. EVIDENCE.</p>
          <h1>Follow the evidence.</h1>
          <p>
            Examine China’s responses to U.S. chip restrictions. Compare the
            sources and build a cited brief.
          </p>
        </div>
        <a className="desk-research-link" href="/research">
          Read the research <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>

      <div className="desk-layout">
        <div className="desk-main">
          <section
            className="desk-composer"
            data-running={busy}
            aria-label="Research question"
          >
            <div className="desk-modes" aria-label="Research action">
              {(
                Object.entries(MODES) as [DeskMode, (typeof MODES)[DeskMode]][]
              ).map(([key, value]) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={mode === key}
                  onClick={() =>
                    revise(() => {
                      setMode(key);
                      setNotice('');
                    })
                  }
                >
                  {value.label}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="desk-query">
              {MODES[mode].prompt}
            </label>
            <textarea
              id="desk-query"
              className="desk-query"
              rows={3}
              maxLength={MAX_QUERY}
              value={query}
              onChange={(event) => revise(() => setQuery(event.target.value))}
              placeholder={
                mode === 'brief'
                  ? 'What do you want to understand?'
                  : 'A headline. An argument. A claim worth checking.'
              }
            />
            {mode === 'source' && (
              <div className="desk-source-fields">
                <div className="desk-source-top">
                  <p>Use a public excerpt. Links are not fetched.</p>
                  <button
                    type="button"
                    className="desk-text-button"
                    onClick={demoSource}
                  >
                    Try an example
                  </button>
                </div>
                <label>
                  Source title
                  <input
                    maxLength={200}
                    value={source.title}
                    onChange={(event) =>
                      updateSource({ title: event.target.value })
                    }
                    placeholder="Publication or paper title"
                  />
                </label>
                <div className="desk-source-pair">
                  <label>
                    Source link
                    <input
                      type="url"
                      maxLength={1500}
                      value={source.url}
                      onChange={(event) =>
                        updateSource({ url: event.target.value })
                      }
                      placeholder="https://…"
                    />
                  </label>
                  <label>
                    Published <span className="desk-subtle">(optional)</span>
                    <input
                      type="date"
                      value={source.date}
                      onChange={(event) =>
                        updateSource({ date: event.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  Public excerpt
                  <textarea
                    rows={5}
                    maxLength={MAX_EXCERPT}
                    value={source.excerpt}
                    onChange={(event) =>
                      updateSource({ excerpt: event.target.value })
                    }
                    placeholder="Paste the passage you want to assess. Include its qualifications."
                  />
                </label>
                <span className="desk-subtle">
                  {source.excerpt.length.toLocaleString()} /{' '}
                  {MAX_EXCERPT.toLocaleString()} characters
                </span>
              </div>
            )}
            <div className="desk-composer-bottom">
              <span>
                {apiKey
                  ? 'Uses your TypeSafe account'
                  : 'Examples and search work without a key.'}
              </span>
              {busy ? (
                <button
                  type="button"
                  className="desk-run"
                  onClick={() => {
                    cancel();
                    setNotice(
                      'Stopped waiting. A request already sent may still incur usage.',
                    );
                  }}
                >
                  <LoaderCircle
                    className="desk-spin"
                    size={17}
                    aria-hidden="true"
                  />{' '}
                  Cancel check
                </button>
              ) : (
                <button
                  type="button"
                  className="desk-run"
                  onClick={run}
                  disabled={!query.trim() || !eligible.length}
                >
                  {apiKey ? MODES[mode].action : 'Find evidence'}
                  <ArrowUp size={17} aria-hidden="true" />
                </button>
              )}
            </div>
          </section>

          {mode !== 'source' && (
            <div
              className="desk-examples"
              aria-label={
                mode === 'brief' ? 'Example questions' : 'Example claims'
              }
            >
              <span>{mode === 'brief' ? 'Try a question' : 'Try a claim'}</span>
              {DESK_EXAMPLES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={example?.id === item.id}
                  onClick={() => chooseExample(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <output className="desk-feedback" aria-live="polite">
            {notice}
          </output>
          {error && (
            <div className="desk-error" role="alert">
              {error}
            </div>
          )}

          <section
            className="desk-results"
            aria-label="Evidence results"
            aria-busy={busy}
          >
            <div className="desk-results-heading">
              <div>
                <p className="desk-kicker">
                  {currentResult
                    ? 'JEV ASSESSMENT'
                    : example
                      ? 'SAVED EXAMPLE'
                      : 'KEYWORD MATCHES · NOT ASSESSED'}
                </p>
                <h2 ref={resultsHeading} tabIndex={-1}>
                  {mode === 'challenge'
                    ? 'Challenges and qualifications'
                    : mode === 'source'
                      ? currentResult
                        ? 'Source assessment'
                        : 'Related evidence'
                      : mode === 'brief'
                        ? 'Evidence for your brief'
                        : 'Evidence for this claim'}
                </h2>
              </div>
              <span className="desk-count">
                {lane === 'all'
                  ? matches.length
                  : `${shown.length} of ${matches.length}`}{' '}
                records
              </span>
            </div>
            {example && !currentResult && (
              <p className="desk-result-note">
                {sourcePolicy === 'all' && !caseId
                  ? example.note
                  : 'This filter changes the visible evidence. The saved example’s overall finding has not been reassessed.'}
              </p>
            )}
            {!classified && (
              <p className="desk-result-note">
                Matches use words in your question. Add Jev for a semantic
                assessment, or pin sources to build your own brief.
              </p>
            )}
            {currentResult && (
              <p className="desk-result-note">
                A provisional assessment of {eligible.length} records in this
                collection. Read the evidence and its limits.
              </p>
            )}

            <div className="desk-filter-row">
              <div className="desk-lanes" aria-label="Evidence relationship">
                <button
                  type="button"
                  aria-pressed={lane === 'all'}
                  onClick={() => setLane('all')}
                >
                  All evidence
                </button>
                <button
                  type="button"
                  disabled={!classified || mode === 'brief'}
                  aria-pressed={lane === 'supports'}
                  onClick={() => setLane('supports')}
                >
                  Supports
                </button>
                <button
                  type="button"
                  disabled={!classified || mode === 'brief'}
                  aria-pressed={lane === 'limits'}
                  onClick={() => setLane('limits')}
                >
                  Challenges & limits
                </button>
              </div>
              <details className="desk-filters">
                <summary>
                  <SlidersHorizontal size={15} aria-hidden="true" /> Sources
                </summary>
                <div>
                  <label>
                    Source selection
                    <select
                      value={sourcePolicy}
                      onChange={(event) =>
                        revise(() =>
                          setSourcePolicy(event.target.value as SourcePolicy),
                        )
                      }
                    >
                      <option value="all">All sources</option>
                      <option value="exclude-vendor">
                        Exclude company-authored sources
                      </option>
                      <option value="independent">
                        Independent evaluations only
                      </option>
                    </select>
                  </label>
                  <label>
                    Research case
                    <select
                      value={caseId}
                      onChange={(event) =>
                        revise(() => setCaseId(event.target.value))
                      }
                    >
                      <option value="">All five cases</option>
                      {data.cases.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.shortTitle}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p>
                    Independent evaluation describes a source type, not
                    verification of every claim. Filters never rewrite the
                    published findings.
                  </p>
                </div>
              </details>
            </div>
            {sourcePolicy !== 'all' && (
              <p className="desk-filter-notice">
                {sourcePolicy === 'independent'
                  ? 'Only the METR autonomy evaluation qualifies. It does not verify training cost or supply-chain independence.'
                  : 'Company-authored papers, repositories, disclosures, and the NVIDIA filing are excluded.'}
              </p>
            )}

            {currentResult?.sourceAssessment && (
              <div className="desk-source-assessment">
                <p className="desk-kicker">
                  YOUR SOURCE · NOT EDITORIALLY REVIEWED
                </p>
                <h3>{sourceLabels[currentResult.sourceAssessment.novelty]}</h3>
                <p>
                  {supportLabels[currentResult.sourceAssessment.claimSupport]}
                </p>
                <div className="desk-dimension-grid">
                  {currentResult.sourceAssessment.dimensions.map((d) => (
                    <div key={d.id}>
                      <span>{d.label}</span>
                      <strong>{dimensionLabels[d.result]}</strong>
                    </div>
                  ))}
                </div>
                <p className="desk-subtle">
                  This evaluates the supplied excerpt. It does not authenticate
                  the source or verify a deployment.
                </p>
              </div>
            )}
            {mode === 'source' && (
              <button
                type="button"
                className="desk-secondary desk-save-source"
                onClick={saveSource}
              >
                <Plus size={16} aria-hidden="true" /> Add this source to my
                brief
              </button>
            )}

            <div className="desk-records">
              {shown.map((match) => {
                const item = evidenceMap.get(match.id)!;
                const recordSource = sourceMap.get(item.sourceId)!;
                const selected = pins.some((pinItem) => pinItem.id === item.id);
                return (
                  <article
                    className="desk-record"
                    key={item.id}
                    data-testid="desk-record"
                  >
                    <div className="desk-record-top">
                      <span
                        className={`desk-role ${classified ? 'role-' + match.role : ''}`}
                      >
                        {classified
                          ? mode === 'brief'
                            ? 'Relevant to your question'
                            : ROLE_LABELS[match.role]
                          : 'Keyword match'}
                      </span>
                      <button
                        type="button"
                        className="desk-pin"
                        aria-pressed={selected}
                        aria-label={`${selected ? 'Unpin' : 'Pin'} evidence: ${item.claim}`}
                        onClick={() => pin(match)}
                      >
                        {selected ? (
                          <Check size={17} aria-hidden="true" />
                        ) : (
                          <Bookmark size={17} aria-hidden="true" />
                        )}
                        <span>{selected ? 'Pinned' : 'Pin'}</span>
                      </button>
                    </div>
                    <h3>{item.claim}</h3>
                    <div className="desk-source-line">
                      <a
                        href={recordSource.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {recordSource.organization}
                        <ArrowUpRight size={13} aria-hidden="true" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      <span>
                        {recordSource.publicationDate
                          ? formatDate(recordSource.publicationDate)
                          : 'Date not established'}
                      </span>
                      {isVendorSource(recordSource) && (
                        <span>Company-authored</span>
                      )}
                    </div>
                    <details className="desk-record-details">
                      <summary>
                        Evidence & limitations{' '}
                        <Plus size={15} aria-hidden="true" />
                      </summary>
                      <div>
                        <p className="desk-detail-label">
                          RECORDED QUOTATION OR DATA
                        </p>
                        <p>{item.quotationOrData}</p>
                        <p className="desk-detail-label">COUNTEREVIDENCE</p>
                        <p>{item.counterevidence}</p>
                        <p className="desk-detail-label">STILL UNRESOLVED</p>
                        <p>{item.remainingUncertainty}</p>
                        <div className="desk-detail-meta">
                          <span>Research confidence: {item.confidence}</span>
                          <span>{item.location}</span>
                        </div>
                        {currentResult && match.confidence !== undefined && (
                          <p className="desk-subtle">
                            Jev model confidence:{' '}
                            {Math.round(match.confidence * 100)}%. This measures
                            the model’s certainty about the relationship, not
                            the probability that the claim is true.
                          </p>
                        )}
                        <a
                          className="desk-text-button"
                          href={`/evidence#${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Full evidence record{' '}
                          <span className="sr-only">(opens in a new tab)</span>
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </a>
                      </div>
                    </details>
                  </article>
                );
              })}
              {!shown.length && (
                <div className="desk-empty">
                  <h3>
                    {lane !== 'all' && matches.length
                      ? lane === 'supports'
                        ? 'No supporting evidence in this selection.'
                        : 'No challenges or limits in this selection.'
                      : eligible.length
                        ? 'No matching evidence in this view.'
                        : 'No records meet these filters.'}
                  </h3>
                  <p>
                    {lane !== 'all' && matches.length
                      ? 'Inspect the other relationships before drawing a conclusion.'
                      : 'Try a broader question or source selection. Missing evidence does not establish that a claim is false.'}
                  </p>
                  <button
                    type="button"
                    className="desk-text-button"
                    onClick={() =>
                      lane !== 'all' && matches.length
                        ? setLane('all')
                        : revise(() => {
                            setSourcePolicy('all');
                            setCaseId('');
                          })
                    }
                  >
                    {lane !== 'all' && matches.length
                      ? 'Show all evidence'
                      : 'Reset evidence filters'}
                  </button>
                </div>
              )}
            </div>
            <div className="desk-scope">
              <p>
                {data.evidence.length} records · {data.cases.length} cases ·
                Evidence through {formatDate(data.meta.evidenceThrough)}
              </p>
              {currentResult && (
                <p>
                  {currentResult.model} ·{' '}
                  {currentResult.usage.inputTokens.toLocaleString()} input
                  tokens · {currentResult.usage.outputTokens.toLocaleString()}{' '}
                  output tokens
                </p>
              )}
              <a href="/methodology">
                Scope & method <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>

        <aside className="desk-sidebar" aria-label="Your research workspace">
          <section className="desk-brief" id="my-brief">
            <div className="desk-aside-heading">
              <Bookmark size={18} aria-hidden="true" />
              <h2>Your brief</h2>
              <span>{pins.length + (candidate ? 1 : 0)}</span>
            </div>
            {!pins.length && !candidate ? (
              <div className="desk-brief-empty">
                <p>Keep what matters.</p>
                <span>
                  Pin evidence, keep its caveats, and take a cited brief with
                  you.
                </span>
              </div>
            ) : (
              <>
                <label className="desk-brief-title">
                  Brief title
                  <input
                    value={briefTitle}
                    maxLength={200}
                    onChange={(event) => setBriefTitle(event.target.value)}
                    placeholder="My research question"
                  />
                </label>
                <ol className="desk-pins">
                  {pins.map((item) => (
                    <li key={item.id}>
                      <span>{evidenceMap.get(item.id)?.claim}</span>
                      <button
                        type="button"
                        aria-label={`Remove evidence from brief: ${evidenceMap.get(item.id)?.claim}`}
                        onClick={() =>
                          setPins((items) =>
                            items.filter((pinItem) => pinItem.id !== item.id),
                          )
                        }
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ol>
                {candidate && (
                  <div className="desk-candidate">
                    <span>Visitor source: {candidate.source.title}</span>
                    <button
                      type="button"
                      aria-label="Remove visitor source from brief"
                      onClick={() => setCandidate(undefined)}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </>
            )}
            <button
              type="button"
              className="desk-download"
              disabled={!pins.length && !candidate}
              onClick={download}
            >
              <Download size={16} aria-hidden="true" /> Download brief
            </button>
            {(pins.length > 0 || candidate) && (
              <button
                type="button"
                className="desk-clear"
                onClick={() => {
                  setPins([]);
                  setCandidate(undefined);
                  setBriefTitle('');
                }}
              >
                Clear brief
              </button>
            )}
            <p className="desk-subtle">
              Kept in this tab. Download before leaving.
            </p>
          </section>

          <details className="desk-connection" ref={keyDetails}>
            <summary>
              <span>
                <KeyRound size={17} aria-hidden="true" />
                {apiKey
                  ? keyVerified
                    ? 'Your Jev is ready'
                    : 'Jev key added'
                  : 'Use your own Jev'}
              </span>
              <Plus size={16} aria-hidden="true" />
            </summary>
            <div className="desk-connection-body">
              <p>
                Jev is TypeSafe’s AI assessment service. Connect your own key
                for custom analysis. Browsing and briefs work without it.
              </p>
              {apiKey ? (
                <>
                  <p className="desk-key-state">
                    {keyVerified
                      ? 'Key accepted on the last successful check.'
                      : 'Key will be checked on your first run.'}
                  </p>
                  <button
                    type="button"
                    className="desk-secondary"
                    onClick={clearKey}
                  >
                    Disconnect & clear key
                  </button>
                </>
              ) : (
                <>
                  <label>
                    TypeSafe API key
                    <input
                      type="password"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={512}
                      value={keyDraft}
                      onChange={(event) => setKeyDraft(event.target.value)}
                      placeholder="Paste a dedicated API key"
                    />
                  </label>
                  <label className="desk-consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />
                    <span>
                      I understand that runs use my account and send my question
                      and any excerpt to TypeSafe through this website.
                    </span>
                  </label>
                  <button
                    type="button"
                    className="desk-secondary"
                    disabled={!keyDraft || !consent}
                    onClick={addKey}
                  >
                    Use key in this tab
                  </button>
                </>
              )}
              <label>
                Run limit for this tab
                <select
                  value={runLimit}
                  onChange={(event) => setRunLimit(Number(event.target.value))}
                >
                  <option value={1}>1 request</option>
                  <option value={5}>5 requests</option>
                  <option value={10}>10 requests</option>
                  <option value={25}>25 requests</option>
                </select>
              </label>
              <p className="desk-subtle">
                {runs} / {runLimit} attempts used. This is a tab safeguard, not
                an account-wide spending cap. One click sends one request; there
                are no automatic retries.
              </p>
              <p className="desk-subtle">
                The key stays in this tab’s memory and passes through our server
                when you run a check. The website does not save keys or
                submitted text. Refresh or disconnect to clear the key. Browser
                extensions and compromised scripts can still access entered
                keys.
              </p>
              <p className="desk-subtle">
                Use only public research text. TypeSafe’s data policies apply. A
                canceled request may still incur usage.
              </p>
              <div className="desk-connection-links">
                <a
                  href="https://console.typesafe.ai"
                  target="_blank"
                  rel="noreferrer"
                >
                  TypeSafe console <ArrowUpRight size={12} aria-hidden="true" />
                </a>
                <a
                  href="https://typesafe.ai/legal/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                >
                  Provider privacy <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              </div>
            </div>
          </details>
          <details className="desk-about">
            <summary>What is sent?</summary>
            <p>
              Your question, selected public evidence, and—for source
              assessment—the pasted excerpt, title, and publication date. Source
              links stay in your brief. Your key is used for authentication
              only. No request is made until you press Run.
            </p>
            <p>
              Assessments are limited to this collection. They never edit the
              published research.
            </p>
          </details>
          <a className="desk-browse" href="/evidence">
            Browse all {data.evidence.length} records{' '}
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </aside>
      </div>
      {(pins.length > 0 || candidate) && (
        <div className="desk-mobile-brief">
          <a href="#my-brief">
            <Bookmark size={15} aria-hidden="true" /> Your brief ·{' '}
            {pins.length + (candidate ? 1 : 0)}
          </a>
          <button
            type="button"
            aria-label="Download brief from toolbar"
            onClick={download}
          >
            <Download size={16} aria-hidden="true" /> Download
          </button>
        </div>
      )}
    </div>
  );
}
