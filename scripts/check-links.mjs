import { loadResearchData } from './research-data.mjs';

const data = await loadResearchData();
const queue = [...data.sources];
const results = [];
const workerCount = Math.min(6, queue.length);

async function check(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(source.url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/pdf;q=0.9,*/*;q=0.8',
        'user-agent': 'when-controls-raise-the-cost/0.1 source-link-check',
      },
    });
    await response.body?.cancel();
    const restricted = [401, 403, 429].includes(response.status);
    return {
      id: source.id,
      status: response.status,
      ok: response.ok || restricted,
      restricted,
      finalUrl: response.url,
    };
  } catch (error) {
    return {
      id: source.id,
      status: null,
      ok: false,
      restricted: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function worker() {
  while (queue.length) {
    const source = queue.shift();
    if (source) results.push(await check(source));
  }
}

await Promise.all(Array.from({ length: workerCount }, () => worker()));
results.sort((a, b) => a.id.localeCompare(b.id));

for (const result of results) {
  const label = result.ok ? (result.restricted ? 'reachable/restricted' : 'ok') : 'failed';
  console.log(`${label.padEnd(20)} ${String(result.status ?? 'ERR').padEnd(4)} ${result.id}${result.error ? ` — ${result.error}` : ''}`);
}

const failures = results.filter((result) => !result.ok);
const restricted = results.filter((result) => result.restricted);
console.log(`\n${results.length - failures.length}/${results.length} source URLs reachable; ${restricted.length} returned an access-control or rate-limit response.`);
if (failures.length) process.exitCode = 1;
