import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

let config = {};
try {
  config = JSON.parse(
    await readFile(
      new URL('../private/jev-audit/config.json', import.meta.url),
      'utf8',
    ),
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const child = spawn(
  config.python ?? 'python3',
  [
    fileURLToPath(new URL('./capture-audit-sources.py', import.meta.url)),
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
);
child.on('error', () => {
  console.error(
    'Source capture: Python could not start; check the python path in private/jev-audit/config.json.',
  );
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
