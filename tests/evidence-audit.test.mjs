import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sha256,
  checkQuotes,
  selectContext,
  buildRequest,
  requestKey,
  validateResponse,
  reviewFlags,
  renderReport,
} from '../scripts/evidence-audit.mjs';

const evidence = {
  claim: 'The vendor reports training on 6,000 accelerators.',
  quotationOrData: '“MFU of 30.0%”',
  location: 'Abstract',
  counterevidence: 'Vendor-reported.',
  remainingUncertainty: 'No independent audit.',
};
const source = {
  title: 'Training report',
  organization: 'Vendor',
  sourceType: 'Technical preprint',
  url: 'https://example.org/paper',
};
const snapshot = { retrievedUrl: source.url, sha256: sha256('source text') };

test('source capture labels paywall previews as partial and preserves table rows', () => {
  const run = spawnSync(
    'python3',
    [
      '-c',
      `
import importlib.util,sys
spec=importlib.util.spec_from_file_location('capture',sys.argv[1])
capture=importlib.util.module_from_spec(spec)
spec.loader.exec_module(capture)
assert capture.source_coverage('Public preview. This post is for paid subscribers') == 'selected excerpts'
assert capture.source_coverage('Complete public report.') == 'full captured text'
parser=capture.SourceText()
parser.feed('<table><tr><th>Model</th>\\n<th>MFU</th></tr><tr><td><p>Pangu</p></td>\\n<td>30.0%</td></tr></table><script>hidden</script>')
assert '| Model | MFU' in parser.text()
assert '| Pangu | 30.0%' in parser.text()
assert 'hidden' not in parser.text()
`,
      fileURLToPath(
        new URL('../scripts/capture-audit-sources.py', import.meta.url),
      ),
    ],
    { encoding: 'utf8' },
  );
  assert.equal(run.status, 0, run.stderr);
});
const request = buildRequest(evidence, source, snapshot, {
  coverage: 'full text',
  text: 'The vendor reports MFU of 30.0% on 6,000 accelerators.',
});
function response() {
  const answer = {
    type: 'choice',
    choice: 'supported',
    confidence: 0.93,
    probabilities: {
      supported: 0.95,
      partial: 0.05,
      contradicted: 0,
      not_established: 0,
    },
  };
  return {
    model: 'jev-test',
    answers: {
      claim_support: structuredClone(answer),
      data_support: structuredClone(answer),
      missing_qualification: { type: 'noul', noul: 0.1 },
    },
    usage: { input_tokens: 500, output_tokens: 100 },
  };
}

test('quotation matching tolerates typography, but catches invented wording', () => {
  assert.equal(
    checkQuotes('“MFU of 30.0%”', 'We report MFU of\n30.0%.')[0].found,
    true,
  );
  assert.equal(
    checkQuotes('“independently verified”', 'Vendor reported.')[0].found,
    false,
  );
  assert.deepEqual(
    checkQuotes('A paraphrase reporting 6,000 NPUs.', 'other text'),
    [],
  );
});

test('retrieval includes nearby context and marks incomplete coverage', () => {
  const text = `${'Unrelated paragraph.\n'.repeat(100)}Scope: vendor experiment only.\nMFU of 30.0% on 6,000 accelerators.\nNo independent audit.\n${'Unrelated paragraph.\n'.repeat(100)}`;
  const context = selectContext(text, evidence, 1000);
  assert.equal(context.coverage, 'selected excerpts');
  assert.match(context.text, /No independent audit/);
  assert.match(context.text, /\[L\d+\]/);
  assert.ok(context.text.length <= 1000);
});

test('changed claims, source content, questions and model invalidate cached answers', () => {
  const key = requestKey(request);
  for (const mutate of [
    (r) => {
      r.state.record.claim = 'Independent replication established.';
    },
    (r) => {
      r.state.source.sha256 = sha256('changed source');
    },
    (r) => {
      r.questions.claim_support.instructions += ' New rubric.';
    },
    (r) => {
      r.model = 'jev-new';
    },
  ]) {
    const changed = structuredClone(request);
    mutate(changed);
    assert.notEqual(requestKey(changed), key);
  }
  assert.equal(requestKey(structuredClone(request)), key);
});

test('malformed API answers never count as successful checks', () => {
  assert.doesNotThrow(() => validateResponse(response(), request));
  for (const mutate of [
    (r) => {
      delete r.answers.data_support;
    },
    (r) => {
      r.answers.claim_support.choice = 'invented';
    },
    (r) => {
      r.answers.claim_support.probabilities.supported = 0.1;
    },
    (r) => {
      r.answers.missing_qualification.noul = 2;
    },
    (r) => {
      r.usage.input_tokens = -1;
    },
  ]) {
    const malformed = response();
    mutate(malformed);
    assert.throws(() => validateResponse(malformed, request));
  }
});

test('model uncertainty is distinct from a detected evidence issue', () => {
  const result = response();
  result.answers.claim_support.confidence = 0.5;
  result.answers.missing_qualification.noul = 0.5;
  assert.deepEqual(reviewFlags(result, []).flags, []);
  assert.equal(reviewFlags(result, []).uncertainty.length, 2);
  result.answers.claim_support.choice = 'contradicted';
  assert.match(reviewFlags(result, []).flags[0], /contradicted/);
  assert.match(
    reviewFlags(response(), [{ found: false }]).flags[0],
    /not located/,
  );
});

test('reports keep source coverage and research confidence separate from model judgment', () => {
  const report = renderReport({
    records: [
      {
        id: 'ev-test',
        claim: 'Test',
        sourceUrl: source.url,
        status: 'no flag',
        flags: [],
        researchConfidence: 'Low',
        response: response(),
      },
    ],
    generatedAt: 'test',
    datasetHash: 'abc',
    liveCalls: 0,
    cacheHits: 1,
    usage: { input_tokens: 0, output_tokens: 0 },
    model: 'test',
    threshold: 0.8,
  });
  assert.match(report, /Research confidence: \*\*Low\*\*, unchanged/);
  assert.match(report, /evidence#ev-test/);
  assert.match(report, /not independently verified/);
});

test('help works offline without reading credentials or modifying canonical data', async () => {
  const dataset = new URL('../data/research.json', import.meta.url);
  const before = await readFile(dataset, 'utf8');
  const run = spawnSync(
    process.execPath,
    ['scripts/audit-evidence.mjs', '--help'],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
      env: { PATH: process.env.PATH },
    },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /no API calls/);
  assert.equal(await readFile(dataset, 'utf8'), before);
});

test('CLI resumes from cache, invalidates changed claims, and refuses tampered source snapshots', async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'jev-audit-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const folder of ['scripts', 'data', 'private/jev-audit/sources'])
    await mkdir(path.join(dir, folder), { recursive: true });
  for (const name of [
    'audit-evidence.mjs',
    'evidence-audit.mjs',
    'research-data.mjs',
  ]) {
    await cp(
      new URL(`../scripts/${name}`, import.meta.url),
      path.join(dir, 'scripts', name),
    );
  }
  const dataset = JSON.parse(
    await readFile(new URL('../data/research.json', import.meta.url), 'utf8'),
  );
  const first = dataset.evidence[0];
  const originalSource = dataset.sources.find((s) => s.id === first.sourceId);
  const dataFile = path.join(dir, 'data/research.json');
  await writeFile(dataFile, JSON.stringify(dataset));
  const text = 'A deliberately simple fixture, not real evidence.\n';
  const sourcesDir = path.join(dir, 'private/jev-audit/sources');
  await writeFile(path.join(sourcesDir, 'source.txt'), text);
  await writeFile(
    path.join(sourcesDir, 'manifest.json'),
    JSON.stringify({
      version: 1,
      sources: {
        [originalSource.id]: {
          status: 'ok',
          sourceUrl: originalSource.url,
          retrievedUrl: originalSource.url,
          retrievedAt: '2026-09-22',
          textFile: 'source.txt',
          sha256: sha256(text),
        },
      },
    }),
  );
  const helper = path.join(dir, 'fake-helper.py');
  await writeFile(
    helper,
    `import json,sys\nfrom pathlib import Path\nr=json.loads(Path(sys.argv[2]).read_text())\na={}\nfor k,q in r['questions'].items():\n if q['type']=='noul': a[k]={'type':'noul','noul':0.1}\n else: a[k]={'type':'choice','choice':'supported','confidence':1,'probabilities':{key:int(key=='supported') for key in q['criteria']}}\nprint(json.dumps({'model':r['model'],'answers':a,'usage':{'input_tokens':10,'output_tokens':10}}))\n`,
  );
  const run = (...args) =>
    spawnSync(
      process.execPath,
      ['scripts/audit-evidence.mjs', '--only', first.id, ...args],
      { cwd: dir, encoding: 'utf8', env: { PATH: process.env.PATH } },
    );
  const reportFile = path.join(
    dir,
    `private/jev-audit/report-${first.id}.json`,
  );
  const report = async () => JSON.parse(await readFile(reportFile, 'utf8'));
  assert.equal(run('--live', '--helper', helper).status, 0);
  assert.equal((await report()).liveCalls, 1);
  assert.equal(run().status, 0);
  assert.equal((await report()).cacheHits, 1);
  assert.equal((await report()).liveCalls, 0);
  assert.deepEqual(JSON.parse(await readFile(dataFile, 'utf8')), dataset);
  first.claim = 'Changed claim requiring a fresh judgment.';
  await writeFile(dataFile, JSON.stringify(dataset));
  assert.equal(run().status, 0);
  assert.equal((await report()).records[0].status, 'prepared');
  assert.equal((await report()).liveCalls, 0);
  await writeFile(path.join(sourcesDir, 'source.txt'), 'Tampered source');
  assert.equal(run().status, 1);
  assert.match(
    (await report()).records[0].flags.join(' '),
    /checksum mismatch/,
  );
});
