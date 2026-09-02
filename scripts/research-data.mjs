import { readFile } from 'node:fs/promises';

const REQUIRED_EVIDENCE_FIELDS = [
  'id',
  'caseIds',
  'claim',
  'sourceId',
  'sourceType',
  'publicationDate',
  'accessDate',
  'quotationOrData',
  'location',
  'counterevidence',
  'confidence',
  'remainingUncertainty',
  'relationship',
];

const TEST_IDS = ['capability', 'scale', 'penalty', 'dependency', 'enforcement', 'future'];
const CONFIDENCE_LEVELS = new Set(['High', 'Moderate', 'Low']);
const RELATIONSHIPS = new Set(['supports', 'qualifies', 'counters']);

export async function loadResearchData() {
  const path = new URL('../data/research.json', import.meta.url);
  return JSON.parse(await readFile(path, 'utf8'));
}

function duplicates(values) {
  const seen = new Set();
  return values.filter((value) => (seen.has(value) ? true : (seen.add(value), false)));
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateSchema(data) {
  const errors = [];
  for (const key of ['meta', 'responseTypes', 'classifications', 'methodology', 'timeline', 'cases', 'evidence', 'sources']) {
    if (!(key in data)) errors.push(`Missing top-level field: ${key}`);
  }
  if (errors.length) return errors;

  for (const field of ['title', 'subtitle', 'question', 'version', 'status', 'evidenceThrough', 'accessed', 'currentFinding', 'summary', 'conversationSummary']) {
    if (!data.meta[field]) errors.push(`meta.${field} is required`);
  }
  if (!isIsoDate(data.meta.evidenceThrough)) errors.push('meta.evidenceThrough must be an ISO date');
  if (!isIsoDate(data.meta.accessed)) errors.push('meta.accessed must be an ISO date');

  const collections = ['responseTypes', 'classifications', 'timeline', 'cases', 'evidence', 'sources'];
  for (const collection of collections) {
    if (!Array.isArray(data[collection]) || data[collection].length === 0) {
      errors.push(`${collection} must be a non-empty array`);
      continue;
    }
    const duplicateIds = duplicates(data[collection].map((item) => item.id));
    if (duplicateIds.length) errors.push(`${collection} has duplicate IDs: ${duplicateIds.join(', ')}`);
  }

  const responseTypeIds = new Set(data.responseTypes.map((item) => item.id));
  const classificationIds = new Set(data.classifications.map((item) => item.id));

  for (const item of data.cases) {
    for (const field of ['id', 'title', 'shortTitle', 'date', 'period', 'classification', 'confidence', 'dependencyStatus', 'finding']) {
      if (!item[field]) errors.push(`${item.id || 'case'} missing ${field}`);
    }
    if (!isIsoDate(item.date)) errors.push(`${item.id}.date must be an ISO date`);
    if (!classificationIds.has(item.classification)) errors.push(`${item.id} has unknown classification ${item.classification}`);
    if (!CONFIDENCE_LEVELS.has(item.confidence)) errors.push(`${item.id} has invalid confidence ${item.confidence}`);
    if (!Array.isArray(item.responseTypes) || item.responseTypes.length === 0) errors.push(`${item.id}.responseTypes must be non-empty`);
    for (const responseType of item.responseTypes ?? []) {
      if (!responseTypeIds.has(responseType)) errors.push(`${item.id} has unknown response type ${responseType}`);
    }
    if (!Array.isArray(item.tests) || item.tests.length !== 6) errors.push(`${item.id} must have exactly six tests`);
    const testIds = item.tests?.map((test) => test.id) ?? [];
    if (TEST_IDS.some((id) => !testIds.includes(id))) errors.push(`${item.id} does not include all six canonical tests`);
    for (const test of item.tests ?? []) {
      if (!test.label || !test.status || !test.answer) errors.push(`${item.id}.${test.id} needs label, status, and answer`);
    }
    if (!Array.isArray(item.evidenceIds) || item.evidenceIds.length === 0) errors.push(`${item.id}.evidenceIds must be non-empty`);
    if (!Array.isArray(item.uncertainties) || item.uncertainties.length === 0) errors.push(`${item.id}.uncertainties must be non-empty`);
  }

  for (const item of data.evidence) {
    for (const field of REQUIRED_EVIDENCE_FIELDS) {
      if (!(field in item) || item[field] === '' || item[field] === undefined) errors.push(`${item.id || 'evidence'} missing ${field}`);
    }
    if (!Array.isArray(item.caseIds) || item.caseIds.length === 0) errors.push(`${item.id}.caseIds must be non-empty`);
    if (item.publicationDate !== null && !isIsoDate(item.publicationDate)) errors.push(`${item.id}.publicationDate must be an ISO date or null`);
    if (!isIsoDate(item.accessDate)) errors.push(`${item.id}.accessDate must be an ISO date`);
    if (!CONFIDENCE_LEVELS.has(item.confidence)) errors.push(`${item.id} has invalid confidence ${item.confidence}`);
    if (!RELATIONSHIPS.has(item.relationship)) errors.push(`${item.id} has invalid relationship ${item.relationship}`);
  }

  for (const item of data.sources) {
    for (const field of ['id', 'title', 'organization', 'url', 'sourceType', 'accessDate']) {
      if (!item[field]) errors.push(`${item.id || 'source'} missing ${field}`);
    }
    if (!isHttpsUrl(item.url)) errors.push(`${item.id}.url must be HTTPS`);
    if (item.publicationDate !== null && !isIsoDate(item.publicationDate)) errors.push(`${item.id}.publicationDate must be an ISO date or null`);
    if (!isIsoDate(item.accessDate)) errors.push(`${item.id}.accessDate must be an ISO date`);
    if (typeof item.primary !== 'boolean') errors.push(`${item.id}.primary must be boolean`);
  }

  const timelineDates = data.timeline.map((item) => item.date);
  const sortedTimelineDates = [...timelineDates].sort((a, b) => a.localeCompare(b));
  if (timelineDates.some((date, index) => date !== sortedTimelineDates[index])) errors.push('timeline must be in ascending date order');
  for (const item of data.timeline) {
    for (const field of ['id', 'date', 'displayDate', 'title', 'summary', 'status', 'caveat']) {
      if (!item[field]) errors.push(`${item.id || 'timeline item'} missing ${field}`);
    }
    if (!isIsoDate(item.date)) errors.push(`${item.id}.date must be an ISO date`);
    if (!Array.isArray(item.sourceIds) || item.sourceIds.length === 0) errors.push(`${item.id}.sourceIds must be non-empty`);
  }

  if (!Array.isArray(data.methodology.sixQuestions) || data.methodology.sixQuestions.length !== 6) errors.push('methodology.sixQuestions must contain exactly six questions');
  for (const field of ['sourceHierarchy', 'limitations', 'whatWouldChangeMind']) {
    if (!Array.isArray(data.methodology[field]) || data.methodology[field].length === 0) errors.push(`methodology.${field} must be non-empty`);
  }

  return errors;
}

export function validateCitations(data) {
  const errors = [];
  const sourceIds = new Set(data.sources.map((source) => source.id));
  const evidenceIds = new Set(data.evidence.map((item) => item.id));
  const caseIds = new Set(data.cases.map((item) => item.id));
  const casesById = new Map(data.cases.map((item) => [item.id, item]));
  const citedSources = new Set();

  for (const item of data.evidence) {
    if (!sourceIds.has(item.sourceId)) errors.push(`${item.id} cites missing source ${item.sourceId}`);
    else citedSources.add(item.sourceId);
    for (const caseId of item.caseIds) {
      if (!caseIds.has(caseId)) errors.push(`${item.id} refers to missing case ${caseId}`);
      else if (!casesById.get(caseId).evidenceIds.includes(item.id)) {
        errors.push(`${item.id} / ${caseId} citation is not reciprocal`);
      }
    }
  }

  for (const item of data.cases) {
    for (const evidenceId of item.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) errors.push(`${item.id} refers to missing evidence ${evidenceId}`);
      const evidence = data.evidence.find((candidate) => candidate.id === evidenceId);
      if (evidence && !evidence.caseIds.includes(item.id)) errors.push(`${item.id} / ${evidenceId} citation is not reciprocal`);
    }
  }

  for (const item of data.timeline) {
    for (const sourceId of item.sourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`${item.id} cites missing source ${sourceId}`);
      else citedSources.add(sourceId);
    }
  }

  const uncited = data.sources.map((source) => source.id).filter((id) => !citedSources.has(id));
  if (uncited.length) errors.push(`Uncited sources: ${uncited.join(', ')}`);

  const representedResponseTypes = new Set(data.cases.flatMap((item) => item.responseTypes));
  for (const item of data.responseTypes) {
    if (!representedResponseTypes.has(item.id)) errors.push(`No case represents response type ${item.id}`);
  }
  const representedClassifications = new Set(data.cases.map((item) => item.classification));
  for (const item of data.classifications) {
    if (!representedClassifications.has(item.id)) errors.push(`No case represents classification ${item.id}`);
  }

  return errors;
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function evidenceToCsv(data) {
  const sources = new Map(data.sources.map((source) => [source.id, source]));
  const cases = new Map(data.cases.map((item) => [item.id, item]));
  const headers = [
    'evidence_id',
    'case_ids',
    'case_titles',
    'claim',
    'source_id',
    'source_title',
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
  const rows = data.evidence.map((item) => {
    const source = sources.get(item.sourceId);
    return [
      item.id,
      item.caseIds,
      item.caseIds.map((id) => cases.get(id)?.title ?? id),
      item.claim,
      item.sourceId,
      source?.title,
      source?.url,
      item.sourceType,
      item.publicationDate,
      item.accessDate,
      item.quotationOrData,
      item.location,
      item.counterevidence,
      item.confidence,
      item.remainingUncertainty,
      item.relationship,
    ].map(csvCell).join(',');
  });
  return [headers.map(csvCell).join(','), ...rows].join('\n') + '\n';
}
