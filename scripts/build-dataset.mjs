import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { evidenceToCsv, loadResearchData, validateCitations, validateSchema } from './research-data.mjs';

const data = await loadResearchData();
const errors = [...validateSchema(data), ...validateCitations(data)];
if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const json = JSON.stringify(data, null, 2) + '\n';
const csv = evidenceToCsv(data);
const outputs = [
  [new URL('../public/data/research-dataset.json', import.meta.url), json],
  [new URL('../public/data/evidence.csv', import.meta.url), csv],
];

if (process.argv.includes('--check')) {
  let mismatch = false;
  for (const [path, expected] of outputs) {
    const actual = await readFile(path, 'utf8').catch(() => '');
    if (actual !== expected) {
      console.error(`${path.pathname} is not up to date`);
      mismatch = true;
    }
  }
  if (mismatch) process.exit(1);
  console.log('generated datasets: up to date');
} else {
  await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
  for (const [path, contents] of outputs) await writeFile(path, contents);
  console.log(`wrote ${data.evidence.length} evidence records to JSON and CSV`);
}
