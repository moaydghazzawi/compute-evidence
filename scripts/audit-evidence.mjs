import { execFile } from 'node:child_process';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify, parseArgs } from 'node:util';
import {
  loadResearchData,
  validateSchema,
  validateCitations,
} from './research-data.mjs';
import {
  AUDIT_VERSION,
  DEFAULT_MODEL,
  REVIEW_THRESHOLD,
  sha256,
  checkQuotes,
  selectContext,
  buildRequest,
  requestKey,
  validateResponse,
  reviewFlags,
  renderReport,
} from './evidence-audit.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const execFileAsync = promisify(execFile);
const { values } = parseArgs({
  options: {
    live: { type: 'boolean', default: false },
    refresh: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
    model: { type: 'string', default: DEFAULT_MODEL },
    helper: { type: 'string' },
    only: { type: 'string' },
    threshold: { type: 'string', default: String(REVIEW_THRESHOLD) },
  },
});

if (values.help) {
  console.log(`Private Jev evidence audit (no dataset writes).
  pnpm audit:sources                  Capture public sources (Python + pypdf for PDFs)
  pnpm audit:evidence                 Prepare requests; reuse cached answers; no API calls
  pnpm audit:evidence --live          Evaluate uncached records using TYPESAFE_API_KEY
  --helper /absolute/path/jev.py      Use a local Keychain helper instead of an env key
  --only evidence-id                  Audit one record
  --refresh                          Discard cached judgments (requires --live)
  --model ${DEFAULT_MODEL}            Pin the model; changing it invalidates cached answers
  --threshold 0.8                    Review-priority cutoff, not a correctness guarantee
Outputs and sources stay in private/jev-audit/. Network/API failures exit nonzero.`);
} else {
  try {
    await main();
  } catch (error) {
    console.error(`Evidence audit: ${error.message}`);
    process.exitCode = 1;
  }
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function callJev(request, requestFile) {
  if (values.helper) {
    try {
      const { stdout } = await execFileAsync(
        'python3',
        [path.resolve(values.helper), '--request', requestFile],
        { timeout: 110000, maxBuffer: 1000000 },
      );
      return JSON.parse(stdout);
    } catch {
      throw new Error(
        'Jev helper failed; check Keychain/network access. No automatic retry was made.',
      );
    }
  }
  const key = process.env.TYPESAFE_API_KEY;
  if (!key)
    throw new Error('Set TYPESAFE_API_KEY or provide --helper for a live run.');
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(60000),
    redirect: 'error',
  });
  if (!response.ok)
    throw new Error(
      `TypeSafe HTTP ${response.status}; no automatic retry was made.`,
    );
  return response.json();
}

async function main() {
  const threshold = Number(values.threshold);
  if (!Number.isFinite(threshold) || threshold < 0.5 || threshold > 1)
    throw new Error('--threshold must be between 0.5 and 1');
  if (values.refresh && !values.live)
    throw new Error('--refresh requires --live');
  const data = await loadResearchData();
  const errors = [...validateSchema(data), ...validateCitations(data)];
  if (errors.length)
    throw new Error(`Fix data validation first: ${errors.join('; ')}`);
  const records = data.evidence.filter(
    (row) => !values.only || row.id === values.only,
  );
  if (!records.length) throw new Error(`Unknown evidence ID: ${values.only}`);
  const output = path.join(root, 'private/jev-audit');
  if (values.live && !values.helper && !process.env.TYPESAFE_API_KEY) {
    const localConfig = await readJson(path.join(output, 'config.json'));
    if (localConfig?.helper) values.helper = localConfig.helper;
  }
  const sourcesDir = path.join(output, 'sources');
  const requestsDir = path.join(output, 'requests');
  const cacheDir = path.join(output, 'cache');
  await mkdir(requestsDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });
  const manifest = await readJson(path.join(sourcesDir, 'manifest.json'));
  if (manifest && (manifest.version !== 1 || !manifest.sources))
    throw new Error('Unsupported source manifest');
  const sources = new Map(data.sources.map((source) => [source.id, source]));
  const report = {
    version: AUDIT_VERSION,
    generatedAt: new Date().toISOString(),
    datasetHash: sha256(JSON.stringify(data)),
    model: values.model,
    threshold,
    liveCalls: 0,
    cacheHits: 0,
    usage: { input_tokens: 0, output_tokens: 0 },
    records: [],
  };
  for (const evidence of records) {
    const source = sources.get(evidence.sourceId);
    const row = {
      id: evidence.id,
      claim: evidence.claim,
      sourceId: source.id,
      sourceUrl: source.url,
      researchConfidence: evidence.confidence,
      status: 'unavailable',
      flags: [],
    };
    report.records.push(row);
    try {
      const snapshot = manifest?.sources[source.id];
      if (snapshot?.status !== 'ok') {
        row.flags.push(
          snapshot?.error ?? 'Source not captured; run pnpm audit:sources',
        );
        continue;
      }
      if (snapshot.sourceUrl !== source.url)
        throw new Error('Source URL changed; recapture before auditing');
      const textPath = await realpath(path.join(sourcesDir, snapshot.textFile));
      if (!textPath.startsWith(`${await realpath(sourcesDir)}${path.sep}`))
        throw new Error('Source text must stay inside the snapshot directory');
      const text = await readFile(textPath, 'utf8');
      if (sha256(text) !== snapshot.sha256)
        throw new Error('Source checksum mismatch; recapture before auditing');
      const context = selectContext(text, evidence);
      if (snapshot.coverage === 'selected excerpts')
        context.coverage = 'selected excerpts';
      row.snapshot = snapshot;
      row.coverage = context.coverage;
      if (!context.text) {
        row.flags.push(
          'No relevant excerpts retrieved; inspect source manually',
        );
        continue;
      }
      const request = buildRequest(
        evidence,
        source,
        snapshot,
        context,
        values.model,
      );
      const key = requestKey(request);
      row.requestFile = `requests/${evidence.id}-${key.slice(0, 12)}.json`;
      const requestFile = path.join(output, row.requestFile);
      const cacheFile = path.join(cacheDir, `${key}.json`);
      await writeFile(requestFile, `${JSON.stringify(request, null, 2)}\n`);
      row.quotes = checkQuotes(evidence.quotationOrData, text);
      const cached = !values.refresh && (await readJson(cacheFile));
      let response;
      if (cached) {
        if (cached.requestKey !== key)
          throw new Error('Cache fingerprint mismatch');
        response = validateResponse(cached.response, request);
        report.cacheHits++;
      } else if (values.live) {
        report.liveCalls++;
        response = validateResponse(
          await callJev(request, requestFile),
          request,
        );
        report.usage.input_tokens += response.usage.input_tokens;
        report.usage.output_tokens += response.usage.output_tokens;
        await writeFile(
          cacheFile,
          `${JSON.stringify({ requestKey: key, evaluatedAt: new Date().toISOString(), response }, null, 2)}\n`,
        );
      } else {
        row.status = 'prepared';
        row.flags.push('No cached result; use --live to evaluate');
        continue;
      }
      row.response = response;
      row.responseFile = `cache/${key}.json`;
      Object.assign(row, reviewFlags(response, row.quotes, threshold));
      row.status = row.flags.length
        ? 'review'
        : row.uncertainty.length
          ? 'uncertain'
          : 'no flag';
    } catch (error) {
      row.status = 'error';
      row.flags.push(error.message);
    } finally {
      console.log(
        `${row.id}: ${row.status}${row.flags.length ? ` — ${row.flags.join('; ')}` : ''}`,
      );
    }
  }
  const basename = values.only ? `report-${values.only}` : 'report';
  await writeFile(
    path.join(output, `${basename}.json`),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(path.join(output, `${basename}.md`), renderReport(report));
  console.log(`Report: ${path.join(output, `${basename}.md`)}`);
  console.log(
    `${report.liveCalls} new calls, ${report.cacheHits} cached; ${report.usage.input_tokens} new input tokens.`,
  );
  if (
    report.records.some((row) => ['error', 'unavailable'].includes(row.status))
  )
    process.exitCode = 1;
}
