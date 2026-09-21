import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DESK_MODEL,
  briefMarkdown,
  eligibleEvidence,
  keywordMatches,
  parseDeskInput,
  safeSourceUrl,
} from '../lib/research-desk.ts';
import { DESK_EXAMPLES } from '../lib/research-desk-examples.ts';
import {
  buildDeskRequest,
  handleResearchDesk,
  parseDeskResponse,
  PROVIDER_URL,
} from '../lib/research-desk-server.ts';

const data = JSON.parse(
  fs.readFileSync(new URL('../data/research.json', import.meta.url), 'utf8'),
);
const base = {
  mode: 'claim',
  query: 'Does DeepSeek prove the restrictions failed?',
  sourcePolicy: 'all',
  caseId: '',
};
const sampleSource = {
  title: 'Public example paper',
  url: 'https://example.org/paper',
  date: '2026-09-22',
  excerpt:
    'A public excerpt describing the model training configuration and its reported limitations.',
};
const fictionalKey = 'fictional-test-key-not-a-credential';
const apiRequest = (
  body = base,
  headers = {},
  url = 'https://research.example/api/research-desk',
) =>
  new Request(url, {
    method: 'POST',
    headers: {
      Origin: new URL(url).origin,
      'Content-Type': 'application/json',
      'X-Research-Action': 'run',
      Authorization: `Bearer ${fictionalKey}`,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
function providerResponse(built, selections = {}) {
  return {
    model: DESK_MODEL,
    answers: Object.fromEntries(
      Object.entries(built.request.questions).map(([id, question]) => {
        const choices = Object.keys(question.criteria);
        const choice = selections[id] ?? choices[0];
        return [
          id,
          {
            type: 'choice',
            choice,
            confidence: 0.94,
            probabilities: Object.fromEntries(
              choices.map((key) => [key, key === choice ? 1 : 0]),
            ),
          },
        ];
      }),
    ),
    usage: { input_tokens: 1000, output_tokens: 100 },
  };
}

test('examples use real evidence; provenance filters do not imply independent verification', () => {
  for (const example of DESK_EXAMPLES)
    for (const match of example.matches)
      assert(
        data.evidence.some((item) => item.id === match.id),
        match.id,
      );
  const independent = eligibleEvidence(data, {
    sourcePolicy: 'independent',
    caseId: '',
  });
  assert.deepEqual(
    independent.map((item) => item.sourceId),
    ['metr-deepseek-v3'],
  );
  const excluded = eligibleEvidence(data, {
    sourcePolicy: 'exclude-vendor',
    caseId: '',
  });
  assert(!excluded.some((item) => item.sourceId === 'deepseek-v3-report'));
  assert(excluded.some((item) => item.sourceId === 'semianalysis-cloudmatrix'));
  assert.equal(
    eligibleEvidence(data, {
      sourcePolicy: 'independent',
      caseId: 'case-pangu-ultra',
    }).length,
    0,
  );
  assert.equal(keywordMatches(data.evidence, 'zxxyyzzabcq').length, 0);
});

test('strict inputs reject executable links, excess fields, dates, and oversized research', () => {
  assert.equal(safeSourceUrl('javascript:alert(1)'), null);
  assert.equal(safeSourceUrl('https://person:secret@example.org'), null);
  for (const patch of [
    { mode: '__proto__' },
    { sourcePolicy: 'verified' },
    { sourcePolicy: ['independent'] },
    { query: 'a'.repeat(1201) },
    { model: 'custom' },
    { caseId: 'invented' },
    { source: sampleSource },
  ])
    assert.throws(() => parseDeskInput({ ...base, ...patch }, data));
  assert.throws(() =>
    parseDeskInput(
      {
        ...base,
        mode: 'source',
        source: { ...sampleSource, date: '2026-02-31' },
      },
      data,
    ),
  );
  assert.equal(
    parseDeskInput({ ...base, mode: 'source', source: sampleSource }, data)
      .source.url,
    sampleSource.url,
  );
});

test('each mode constructs bounded typed requests from approved public fields', () => {
  for (const mode of ['claim', 'challenge', 'brief', 'source']) {
    const built = buildDeskRequest(
      { ...base, mode, ...(mode === 'source' ? { source: sampleSource } : {}) },
      data,
    );
    assert.equal(built.request.model, DESK_MODEL);
    assert.equal(
      Object.keys(built.request.questions).length,
      data.evidence.length + (mode === 'source' ? 8 : 0),
    );
    const serialized = JSON.stringify(built.request);
    assert(!serialized.includes('conversationSummary'));
    assert(!serialized.includes('/Users/'));
    assert(!serialized.includes('Authorization'));
    assert(!serialized.includes(sampleSource.url));
    const parsed = parseDeskResponse(providerResponse(built), built, mode);
    assert.equal(parsed.matches.length, data.evidence.length);
    if (mode === 'source')
      assert.equal(parsed.sourceAssessment.dimensions.length, 6);
  }
});

test('provider responses must be complete with valid distributions and known identifiers', () => {
  const built = buildDeskRequest(base, data);
  const fixture = providerResponse(built);
  delete fixture.answers[data.evidence[0].id];
  assert.throws(() => parseDeskResponse(fixture, built, 'claim'));
  const malformed = providerResponse(built);
  malformed.answers[data.evidence[0].id].probabilities.supports = 15;
  assert.throws(() => parseDeskResponse(malformed, built, 'claim'));
  const unknownModel = providerResponse(built);
  unknownModel.model = 'unexpected';
  assert.throws(() => parseDeskResponse(unknownModel, built, 'claim'));
});

test('the request uses only the visitor key, fixed endpoint, no redirects, and no retries', async () => {
  let calls = 0;
  const response = await handleResearchDesk(
    apiRequest(),
    data,
    async (url, options) => {
      calls++;
      assert.equal(url, PROVIDER_URL);
      assert.equal(options.headers.Authorization, `Bearer ${fictionalKey}`);
      assert.equal(options.redirect, 'error');
      assert.equal(options.cache, 'no-store');
      assert(!options.body.includes(fictionalKey));
      return Response.json(providerResponse(buildDeskRequest(base, data)));
    },
  );
  assert.equal(calls, 1);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  const text = await response.text();
  assert(!text.includes(fictionalKey));
  assert.equal(JSON.parse(text).matches.length, data.evidence.length);
});

test('missing keys, cross-origin use, HTTP, malformed and oversize requests never reach TypeSafe', async () => {
  let calls = 0;
  const neverFetch = async () => {
    calls++;
    throw new Error('must not run');
  };
  const cases = [
    [apiRequest(base, { Authorization: '' }), 401],
    [apiRequest(base, { Origin: 'https://attacker.example' }), 403],
    [apiRequest(base, { Origin: '' }), 403],
    [apiRequest(base, { 'Sec-Fetch-Site': 'cross-site' }), 403],
    [apiRequest(base, { 'Content-Type': 'text/plain' }), 415],
    [apiRequest(base, { 'X-Research-Action': '' }), 415],
    [apiRequest(base, {}, 'http://research.example/api/research-desk'), 403],
    [apiRequest({ ...base, endpoint: 'https://attacker.example' }), 400],
    [apiRequest('{'), 400],
    [apiRequest(' '.repeat(33000)), 413],
  ];
  for (const [request, status] of cases)
    assert.equal(
      (await handleResearchDesk(request, data, neverFetch)).status,
      status,
    );
  assert.equal(calls, 0);
});

test('provider errors and invalid responses reveal no raw keys, prompts, or provider messages', async () => {
  for (const [status, expected] of [
    [401, 401],
    [402, 402],
    [429, 429],
    [529, 429],
    [500, 502],
    [302, 502],
  ]) {
    let calls = 0;
    const response = await handleResearchDesk(apiRequest(), data, async () => {
      calls++;
      return new Response(`secret ${fictionalKey}`, { status });
    });
    assert.equal(response.status, expected);
    assert.equal(calls, 1);
    assert(!(await response.text()).includes(fictionalKey));
  }
  const oversized = await handleResearchDesk(
    apiRequest(),
    data,
    async () => new Response('x'.repeat(161000)),
  );
  assert.equal(oversized.status, 502);
});

test('request cancellation reaches provider fetch without retry', async () => {
  const controller = new AbortController();
  const request = new Request(apiRequest(), { signal: controller.signal });
  const pending = handleResearchDesk(request, data, async (_url, options) => {
    controller.abort();
    assert.equal(options.signal.aborted, true);
    throw new Error('Aborted');
  });
  assert.equal((await pending).status, 504);
});

test('a stalled inbound stream has a deadline and never reaches the provider', async (t) => {
  const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, 'timeout', (duration) => {
    assert.equal(duration, 10_000);
    return nativeTimeout(20);
  });
  let canceled = false;
  const stream = new ReadableStream({
    cancel() {
      canceled = true;
    },
  });
  const request = new Request('https://research.example/api/research-desk', {
    method: 'POST',
    headers: {
      Origin: 'https://research.example',
      'Content-Type': 'application/json',
      'X-Research-Action': 'run',
      Authorization: `Bearer ${fictionalKey}`,
    },
    body: stream,
    duplex: 'half',
  });
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    const response = await handleResearchDesk(request, data, async () => {
      throw new Error('must not reach provider');
    });
    assert.equal(response.status, 408);
    assert.equal(canceled, true);
  } finally {
    clearTimeout(keepAlive);
  }
});

test('briefs preserve selected-question provenance, source caveats, and provisional material', () => {
  const item = data.evidence[0];
  const text = briefMarkdown(
    data,
    [
      {
        id: item.id,
        query: base.query,
        mode: 'claim',
        role: 'qualifies',
        origin: 'Jev assessment',
        confidence: 0.8,
      },
    ],
    'My brief',
    {
      source: sampleSource,
      query: 'Original source assessment claim',
      sourcePolicy: 'all',
      caseId: '',
    },
  );
  assert(text.includes(item.counterevidence));
  assert(text.includes(item.remainingUncertainty));
  assert(text.includes(base.query));
  assert(text.includes('not probability the claim is true'));
  assert(text.includes('Visitor-supplied source — not editorially reviewed'));
  assert(
    text.includes(
      'Visitor claim at selection: Original source assessment claim',
    ),
  );
  assert(!text.includes(fictionalKey));
});

test('visitor text remains literal in downloaded Markdown briefs', () => {
  const untrusted =
    '![remote](https://example.invalid/image.png) <img src="https://example.invalid/raw.png">';
  const text = briefMarkdown(
    data,
    [
      {
        id: data.evidence[0].id,
        query: untrusted,
        mode: 'claim',
        role: 'unassessed',
        origin: 'Manual selection',
      },
    ],
    untrusted,
    {
      query: untrusted,
      sourcePolicy: 'all',
      caseId: '',
      source: {
        ...sampleSource,
        title: untrusted,
        excerpt: untrusted,
        url: 'https://example.org/![remote](https://example.invalid/image.png)',
      },
    },
  );
  assert(!text.includes('![remote]('));
  assert(!text.includes('<img'));
  assert(text.includes('\\!\\[remote\\]\\('));
  assert(text.includes('&lt;img'));
});
