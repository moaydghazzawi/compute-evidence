import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evidenceToCsv,
  loadResearchData,
  validateCitations,
  validateSchema,
} from '../scripts/research-data.mjs';

test('research data passes the schema contract', async () => {
  const data = await loadResearchData();
  assert.deepEqual(validateSchema(data), []);
});

test('every citation resolves in both directions', async () => {
  const data = await loadResearchData();
  assert.deepEqual(validateCitations(data), []);
});

test('CSV transformation preserves one row per evidence card', async () => {
  const data = await loadResearchData();
  const csv = evidenceToCsv(data);
  const rows = csv.trimEnd().split('\n');
  assert.equal(rows.length, data.evidence.length + 1);
  assert.match(rows[0], /"claim"/);
  assert.match(rows[0], /"remaining_uncertainty"/);
  assert.match(csv, /"DeepSeek-V3 on Nvidia H800"/);
});

test('all response types and judgment classes appear in the MVP', async () => {
  const data = await loadResearchData();
  const responseTypes = new Set(data.cases.flatMap((item) => item.responseTypes));
  const classifications = new Set(data.cases.map((item) => item.classification));
  assert.deepEqual([...responseTypes].sort((a, b) => a.localeCompare(b)), data.responseTypes.map((item) => item.id).sort((a, b) => a.localeCompare(b)));
  assert.deepEqual([...classifications].sort((a, b) => a.localeCompare(b)), data.classifications.map((item) => item.id).sort((a, b) => a.localeCompare(b)));
});
