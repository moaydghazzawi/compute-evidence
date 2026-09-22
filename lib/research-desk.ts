import type { Evidence, ResearchData, Source } from './research-types';
import { SITE_URL } from './site-identity.ts';

export const DESK_MODEL = 'jev-1.13.0';
export const MAX_QUERY = 1200;
export const MAX_EXCERPT = 6000;
export const MODES = {
  claim: {
    label: 'Test a claim',
    prompt: 'The claim you want to test',
    action: 'Test with Jev',
  },
  challenge: {
    label: 'Challenge my view',
    prompt: 'The argument you want to challenge',
    action: 'Find counterevidence with Jev',
  },
  source: {
    label: 'Assess a new source',
    prompt: 'What does this source claim?',
    action: 'Assess with Jev',
  },
  brief: {
    label: 'Build a brief',
    prompt: 'Your research question',
    action: 'Rank evidence with Jev',
  },
} as const;
export type DeskMode = keyof typeof MODES;
export type SourcePolicy = 'all' | 'exclude-vendor' | 'independent';
export type EvidenceRole =
  | 'supports'
  | 'qualifies'
  | 'challenges'
  | 'context'
  | 'unresolved'
  | 'unrelated';
export const ROLE_LABELS: Record<EvidenceRole, string> = {
  supports: 'Supports the claim',
  qualifies: 'Adds a qualification',
  challenges: 'Challenges the claim',
  context: 'Relevant context',
  unresolved: 'Relationship unclear',
  unrelated: 'Not relevant',
};
export interface DeskInput {
  mode: DeskMode;
  query: string;
  sourcePolicy: SourcePolicy;
  caseId: string;
  source?: { title: string; url: string; date: string; excerpt: string };
}
export interface DeskMatch {
  id: string;
  role: EvidenceRole;
  confidence?: number;
  relevance?: number;
}
export interface SourceAssessment {
  novelty: 'new_material' | 'corroborates' | 'conflicts' | 'unclear';
  claimSupport: 'supports' | 'partial' | 'contradicts' | 'not_established';
  dimensions: {
    id: string;
    label: string;
    result: 'addresses' | 'partly' | 'not_addressed' | 'unclear';
    confidence: number;
  }[];
}
export interface DeskResult {
  kind: 'jev';
  model: string;
  matches: DeskMatch[];
  sourceAssessment?: SourceAssessment;
  usage: { inputTokens: number; outputTokens: number };
}
export interface DeskExample {
  id: string;
  label: string;
  query: string;
  note: string;
  matches: DeskMatch[];
}
export interface BriefItem {
  id: string;
  query: string;
  mode: DeskMode;
  role: EvidenceRole | 'unassessed';
  origin: 'Editorial example' | 'Jev assessment' | 'Manual selection';
  confidence?: number;
}
export interface BriefCandidate {
  source: NonNullable<DeskInput['source']>;
  query: string;
  sourcePolicy: SourcePolicy;
  caseId: string;
  model?: string;
  assessment?: SourceAssessment;
}

// Explicit source identities: a primary source is not necessarily independently verified.
const VENDOR_SOURCES = new Set([
  'deepseek-v3-report',
  'deepseek-v3-repository',
  'nvidia-2024-10k',
  'pangu-ultra-paper',
  'pangu-ultra-repository',
  'cloudmatrix-paper',
  'huawei-superpod-deployment',
  'cloudmatrix-maas-paper',
]);
export function isVendorSource(source: Source) {
  return VENDOR_SOURCES.has(source.id);
}
export function eligibleEvidence(
  data: ResearchData,
  input: Pick<DeskInput, 'sourcePolicy' | 'caseId'>,
) {
  const sources = new Map(data.sources.map((source) => [source.id, source]));
  return data.evidence.filter((item) => {
    const source = sources.get(item.sourceId);
    if (!source || (input.caseId && !item.caseIds.includes(input.caseId)))
      return false;
    if (input.sourcePolicy === 'exclude-vendor' && isVendorSource(source))
      return false;
    if (
      input.sourcePolicy === 'independent' &&
      source.sourceType !== 'Independent evaluation'
    )
      return false;
    return true;
  });
}
export function keywordMatches(items: Evidence[], query: string) {
  const stop = new Set([
    'does',
    'that',
    'this',
    'with',
    'from',
    'have',
    'what',
    'which',
    'their',
    'about',
    'the',
    'and',
    'for',
    'are',
    'was',
  ]);
  const words = [
    ...new Set(
      (query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
        (word) => word.length > 2 && !stop.has(word),
      ),
    ),
  ];
  if (!words.length) return items;
  return items
    .map((item) => ({
      item,
      score: words.reduce(
        (sum, word) =>
          sum +
          (`${item.claim} ${item.quotationOrData} ${item.counterevidence} ${item.remainingUncertainty}`
            .toLowerCase()
            .includes(word)
            ? 1
            : 0),
        0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
export function safeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      value.length > 1500
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
export function parseDeskInput(value: unknown, data: ResearchData): DeskInput {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Enter a research question.');
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).some(
      (key) =>
        !['mode', 'query', 'caseId', 'sourcePolicy', 'source'].includes(key),
    )
  )
    throw new Error('Unexpected request fields.');
  if (typeof input.mode !== 'string' || !Object.hasOwn(MODES, input.mode))
    throw new Error('Choose a research action.');
  if (
    typeof input.query !== 'string' ||
    input.query.trim().length < 8 ||
    input.query.length > MAX_QUERY
  )
    throw new Error(`Use a question or claim of 8–${MAX_QUERY} characters.`);
  if (
    typeof input.sourcePolicy !== 'string' ||
    !['all', 'exclude-vendor', 'independent'].includes(input.sourcePolicy)
  )
    throw new Error('Choose a source filter.');
  if (
    typeof input.caseId !== 'string' ||
    (input.caseId && !data.cases.some((item) => item.id === input.caseId))
  )
    throw new Error('Choose a case from this dataset.');
  const result: DeskInput = {
    mode: input.mode as DeskMode,
    query: input.query.trim(),
    caseId: input.caseId,
    sourcePolicy: input.sourcePolicy as SourcePolicy,
  };
  if (result.mode === 'source') {
    if (
      !input.source ||
      typeof input.source !== 'object' ||
      Array.isArray(input.source)
    )
      throw new Error('Add the public source excerpt and its link.');
    const source = input.source as Record<string, unknown>;
    if (
      Object.keys(source).some(
        (key) => !['title', 'url', 'date', 'excerpt'].includes(key),
      )
    )
      throw new Error('Unexpected source fields.');
    if (
      typeof source.title !== 'string' ||
      !source.title.trim() ||
      source.title.length > 200
    )
      throw new Error('Add a source title of up to 200 characters.');
    if (typeof source.url !== 'string' || !safeSourceUrl(source.url))
      throw new Error(
        'Use an HTTPS source link without a username or password.',
      );
    if (
      typeof source.date !== 'string' ||
      (source.date &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(source.date) ||
          !Number.isFinite(Date.parse(source.date)) ||
          new Date(source.date).toISOString().slice(0, 10) !== source.date))
    )
      throw new Error('Use a valid publication date, or leave it blank.');
    if (
      typeof source.excerpt !== 'string' ||
      source.excerpt.trim().length < 40 ||
      source.excerpt.length > MAX_EXCERPT
    )
      throw new Error(
        `Paste 40–${MAX_EXCERPT} characters from the public source.`,
      );
    result.source = {
      title: source.title.trim(),
      url: safeSourceUrl(source.url)!,
      date: source.date,
      excerpt: source.excerpt.trim(),
    };
  } else if (input.source !== undefined)
    throw new Error('Source excerpts are only accepted for source assessment.');
  return result;
}
// Export visitor prose as literal text: Markdown viewers may load embedded images.
function markdownText(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(/[\\`*_{}[\]()#+!|]/g, '\\$&')
    .replace(/^(\s*)([-=])/gm, '$1\\$2');
}

export function briefMarkdown(
  data: ResearchData,
  items: BriefItem[],
  title: string,
  candidate?: BriefCandidate,
) {
  const lines = [
    '# Research brief',
    '',
    markdownText(title.trim() || 'Selected evidence'),
    '',
    `Research: ${data.meta.title}`,
    `Evidence cutoff: ${data.meta.evidenceThrough}; targeted review: ${data.meta.reviewedOn}.`,
    'This is a visitor-created selection, not a new editorial finding. Jev assessments are provisional; model confidence is not factual certainty.',
    '',
  ];
  for (const selected of items) {
    const item = data.evidence.find((record) => record.id === selected.id);
    const source = data.sources.find((record) => record.id === item?.sourceId);
    if (!item || !source) continue;
    lines.push(
      `## ${item.claim}`,
      '',
      `Selection: ${selected.origin}`,
      `Question: ${markdownText(selected.query || 'Manual evidence browsing')}`,
      `Action: ${MODES[selected.mode].label}`,
      `Relation to that question: ${selected.role === 'unassessed' ? 'Not assessed' : ROLE_LABELS[selected.role]}`,
      `Research confidence: ${item.confidence}`,
      ...(selected.confidence === undefined
        ? []
        : [
            `Jev model confidence: ${Math.round(selected.confidence * 100)}% (not probability the claim is true)`,
          ]),
      '',
      `Evidence: ${item.quotationOrData}`,
      '',
      `Counterevidence: ${item.counterevidence}`,
      '',
      `Unresolved: ${item.remainingUncertainty}`,
      '',
      `Source: ${source.title}`,
      `Organization: ${source.organization}`,
      `Source URL: ${source.url}`,
      `Location: ${item.location}`,
      `Publication date: ${source.publicationDate ?? 'Not established'}`,
      `Evidence record: ${SITE_URL}/evidence#${item.id}`,
      '',
    );
  }
  if (candidate) {
    lines.push(
      '## Visitor-supplied source — not editorially reviewed',
      '',
      markdownText(candidate.source.title),
      `Source URL: ${markdownText(candidate.source.url)}`,
      `Publication date: ${candidate.source.date || 'Not provided'}`,
      `Visitor claim at selection: ${markdownText(candidate.query)}`,
      `Source filter at selection: ${candidate.sourcePolicy}`,
      `Case selection: ${candidate.caseId || 'All cases'}`,
      `Assessment model: ${candidate.model || 'Not assessed'}`,
      '',
      markdownText(candidate.source.excerpt),
      '',
    );
    if (candidate.assessment)
      lines.push(
        `Jev novelty assessment: ${candidate.assessment.novelty.replaceAll('_', ' ')}`,
        `Excerpt support for visitor claim: ${candidate.assessment.claimSupport.replaceAll('_', ' ')}`,
        ...candidate.assessment.dimensions.map(
          (d) =>
            `${d.label}: ${d.result.replaceAll('_', ' ')} (model confidence ${Math.round(d.confidence * 100)}%)`,
        ),
        '',
      );
  }
  return lines.join('\n');
}
