import { loadResearchData, validateCitations, validateSchema } from './research-data.mjs';

const data = await loadResearchData();
const mode = process.argv[2] ?? '--all';
const checks = mode === '--schema'
  ? [{ name: 'schema', check: validateSchema }]
  : mode === '--citations'
    ? [{ name: 'citations', check: validateCitations }]
    : [{ name: 'schema', check: validateSchema }, { name: 'citations', check: validateCitations }];

let errorCount = 0;
for (const { name, check } of checks) {
  const errors = check(data);
  if (errors.length) {
    errorCount += errors.length;
    console.error(`${name}: ${errors.length} error(s)`);
    for (const error of errors) console.error(`- ${String(error)}`);
  } else {
    console.log(`${name}: ok`);
  }
}

if (errorCount) process.exitCode = 1;
