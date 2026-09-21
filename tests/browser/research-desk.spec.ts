import { test, expect, type Page } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const testKey = 'fictional-browser-test-key-not-a-secret';
const fixture = {
  kind: 'jev',
  model: 'jev-1.13.0',
  matches: [
    {
      id: 'ev-deepseek-cost',
      role: 'challenges',
      confidence: 0.91,
      relevance: 0.9,
    },
    {
      id: 'ev-deepseek-compute',
      role: 'context',
      confidence: 0.88,
      relevance: 0.8,
    },
  ],
  usage: { inputTokens: 1234, outputTokens: 56 },
};
async function openDesk(page: Page) {
  await page.goto('/desk');
  await expect(page.getByTestId('research-desk')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
}
async function addKey(page: Page) {
  const connection = page.locator('.desk-connection');
  if (!(await connection.evaluate((element) => element.hasAttribute('open'))))
    await connection.locator('summary').click();
  await page.getByLabel('TypeSafe API key', { exact: true }).fill(testKey);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Use key in this tab' }).click();
  await expect(page.locator('.desk-connection > summary')).toContainText(
    'Jev key added',
  );
}
test('saved examples, source filters, and cited brief work without an account', async ({
  page,
}) => {
  let networkRuns = 0;
  await page.route('**/api/research-desk', (route) => {
    networkRuns++;
    return route.abort();
  });
  await openDesk(page);
  await expect(page.getByTestId('desk-record')).toHaveCount(2);
  await expect(page.getByText('SAVED EXAMPLE')).toBeVisible();
  await page
    .getByRole('button', { name: 'Pin evidence:', exact: false })
    .first()
    .click();
  await page
    .getByRole('button', { name: 'Training without Nvidia', exact: true })
    .click();
  await expect(page.getByTestId('desk-record')).toHaveCount(4);
  await page.locator('.desk-filters > summary').click();
  await page.getByLabel('Source selection').selectOption('independent');
  await expect(page.getByTestId('desk-record')).toHaveCount(0);
  await expect(
    page.getByText(
      'The saved example’s overall finding has not been reassessed.',
      { exact: false },
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset evidence filters' }).click();
  await page.locator('.desk-filters > summary').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download brief', exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('research-brief.md');
  const text = await readFile((await download.path())!, 'utf8');
  expect(text).toContain('DeepSeek-V3 cost only $5.576 million to develop.');
  expect(text).toContain('Counterevidence:');
  expect(text).toContain('Source URL:');
  expect(text).not.toContain(testKey);
  expect(networkRuns).toBe(0);
});

test('custom keyword search never impersonates an AI verdict', async ({
  page,
}) => {
  await openDesk(page);
  await page
    .getByLabel('The claim you want to test')
    .fill('CloudMatrix throughput');
  await expect(page.getByText('KEYWORD MATCHES · NOT ASSESSED')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Supports', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Find evidence', exact: true })
    .click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.locator('.desk-connection > summary').click();
  await expect(
    page.getByLabel('TypeSafe API key', { exact: true }),
  ).toBeVisible();
});

test('own-key connection makes one explicit request, clears on refresh, and uses no browser storage', async ({
  page,
}) => {
  const bodies: unknown[] = [];
  await page.route('**/api/research-desk', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${testKey}`);
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ json: fixture });
  });
  await openDesk(page);
  await addKey(page);
  expect(bodies).toHaveLength(0);
  await page
    .getByRole('button', { name: 'Test with Jev', exact: true })
    .click();
  await expect(page.getByText('JEV ASSESSMENT', { exact: true })).toBeVisible();
  expect(bodies).toHaveLength(1);
  expect(JSON.stringify(bodies)).not.toContain(testKey);
  await expect(page.locator('.desk-connection > summary')).toContainText(
    'Your Jev is ready',
  );
  const stored = await page.evaluate(() =>
    JSON.stringify({
      local: Object.fromEntries(
        Object.keys(localStorage).map((key) => [
          key,
          localStorage.getItem(key),
        ]),
      ),
      session: Object.fromEntries(
        Object.keys(sessionStorage).map((key) => [
          key,
          sessionStorage.getItem(key),
        ]),
      ),
      cookie: document.cookie,
    }),
  );
  expect(stored).not.toContain(testKey);
  await page.reload();
  await expect(page.locator('.desk-connection > summary')).toContainText(
    'Use your own Jev',
  );
  await page.locator('.desk-connection > summary').click();
  await expect(
    page.getByLabel('TypeSafe API key', { exact: true }),
  ).toBeEmpty();
});

test('provider errors are actionable and do not retry; tab request limit works', async ({
  page,
}) => {
  let calls = 0;
  await page.route('**/api/research-desk', (route) => {
    calls++;
    return route.fulfill({
      status: 429,
      json: { error: 'TypeSafe is busy. Wait before running another check.' },
    });
  });
  await openDesk(page);
  await addKey(page);
  await page.locator('.desk-connection > summary').click();
  await page.getByLabel('Run limit for this tab').selectOption('1');
  await page
    .getByRole('button', { name: 'Test with Jev', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('TypeSafe is busy');
  await page
    .getByRole('button', { name: 'Test with Jev', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('run limit');
  expect(calls).toBe(1);
  await page.getByRole('button', { name: 'Disconnect & clear key' }).click();
  await expect(
    page.getByLabel('TypeSafe API key', { exact: true }),
  ).toBeEmpty();
});

test('new-source assessment and brief preserve the original claim after later edits', async ({
  page,
}) => {
  await page.route('**/api/research-desk', (route) =>
    route.fulfill({
      json: {
        ...fixture,
        sourceAssessment: {
          novelty: 'corroborates',
          claimSupport: 'partial',
          dimensions: [
            {
              id: 'capability',
              label: 'Capability restored',
              result: 'addresses',
              confidence: 0.9,
            },
            {
              id: 'scale',
              label: 'Repeatable scale',
              result: 'partly',
              confidence: 0.85,
            },
            {
              id: 'penalty',
              label: 'Extra resources',
              result: 'not_addressed',
              confidence: 0.9,
            },
            {
              id: 'dependency',
              label: 'Outside dependency',
              result: 'unclear',
              confidence: 0.7,
            },
            {
              id: 'enforcement',
              label: 'Enforcement resilience',
              result: 'not_addressed',
              confidence: 0.8,
            },
            {
              id: 'future',
              label: 'Next generation',
              result: 'not_addressed',
              confidence: 0.8,
            },
          ],
        },
      },
    }),
  );
  await openDesk(page);
  await page
    .getByRole('button', { name: 'Assess a new source', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Try an example', exact: true })
    .click();
  const original = await page
    .getByLabel('What does this source claim?')
    .inputValue();
  await addKey(page);
  await page
    .getByRole('button', { name: 'Assess with Jev', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Corroborates selected evidence' }),
  ).toBeVisible();
  await expect(page.locator('.desk-dimension-grid > div')).toHaveCount(6);
  await page
    .getByRole('button', { name: 'Add this source to my brief' })
    .click();
  await page
    .getByLabel('What does this source claim?')
    .fill('A completely different claim about training costs.');
  await expect(page.locator('.desk-source-assessment')).toHaveCount(0);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download brief', exact: true }).click(),
  ]);
  const text = await readFile((await download.path())!, 'utf8');
  expect(text).toContain(`Visitor claim at selection: ${original}`);
  expect(text).toContain('Assessment model: jev-1.13.0');
  expect(text).toContain('not editorially reviewed');
});

test('changing a question cancels a pending assessment without stale results', async ({
  page,
}) => {
  let release: () => void = () => {};
  let called = false;
  await page.route('**/api/research-desk', async (route) => {
    called = true;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({ json: fixture }).catch(() => {});
  });
  await openDesk(page);
  await addKey(page);
  await page
    .getByRole('button', { name: 'Test with Jev', exact: true })
    .click();
  await expect.poll(() => called).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Cancel check' }),
  ).toBeVisible();
  await page
    .getByLabel('The claim you want to test')
    .fill('A different question about CloudMatrix deployment.');
  release();
  await expect(
    page.getByRole('button', { name: 'Test with Jev', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('KEYWORD MATCHES · NOT ASSESSED')).toBeVisible();
  await expect(page.getByText('JEV ASSESSMENT', { exact: true })).toHaveCount(
    0,
  );
});

test('real endpoint refuses missing keys and cross-origin calls; page includes security headers', async ({
  request,
}) => {
  const home = await request.get('/');
  expect(home.headers()['x-frame-options']).toBe('DENY');
  expect(home.headers()['content-security-policy']).toContain(
    "frame-ancestors 'none'",
  );
  const origin = new URL(home.url()).origin;
  const body = {
    mode: 'claim',
    query: 'Does DeepSeek prove the controls failed?',
    sourcePolicy: 'all',
    caseId: '',
  };
  const missing = await request.post('/api/research-desk', {
    headers: { Origin: origin, 'X-Research-Action': 'run' },
    data: body,
  });
  expect(missing.status()).toBe(401);
  expect(missing.headers()['cache-control']).toContain('no-store');
  const foreign = await request.post('/api/research-desk', {
    headers: {
      Origin: 'https://foreign.example',
      'X-Research-Action': 'run',
      Authorization: `Bearer ${testKey}`,
    },
    data: body,
  });
  expect(foreign.status()).toBe(403);
});

test('legacy research links survive the new homepage; reduced motion is respected', async ({
  page,
}) => {
  await page.goto('/?case=case-cloudmatrix#cases');
  await expect(page).toHaveURL(/\/research\?case=case-cloudmatrix#cases$/);
  await expect(page.locator('.case-detail-header h3')).toHaveText(
    'CloudMatrix384 serving DeepSeek-R1',
  );
  await page.goto('/#matrix');
  await expect(page).toHaveURL(/\/research#matrix$/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDesk(page);
  const motion = await page
    .getByTestId('desk-record')
    .first()
    .evaluate((element) => getComputedStyle(element).animationName);
  expect(motion).toBe('none');
});

test('captures the research desk @screenshot', async ({ page }, testInfo) => {
  await openDesk(page);
  const directory = path.join(process.cwd(), 'docs', 'screenshots');
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    path: path.join(
      directory,
      `desk-${testInfo.project.name.startsWith('desktop') ? 'desktop' : 'mobile'}.png`,
    ),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  });
  await page.goto('/');
  await page.screenshot({
    path: path.join(
      directory,
      `home-${testInfo.project.name.startsWith('desktop') ? 'desktop' : 'mobile'}.png`,
    ),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  });
});

test('examples respect the selected workflow and filters, and relationship counts match the view', async ({
  page,
}) => {
  await openDesk(page);
  await page.getByRole('button', { name: 'Supports', exact: true }).click();
  await expect(page.locator('.desk-count')).toHaveText('0 of 2 records');
  await expect(
    page.getByRole('heading', {
      name: 'No supporting evidence in this selection.',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Show all evidence' }).click();
  await expect(page.getByTestId('desk-record')).toHaveCount(2);
  await page.getByTestId('desk-record').first().locator('summary').click();
  await expect(
    page.getByRole('link', { name: /Full evidence record/ }).first(),
  ).toHaveAttribute('target', '_blank');
  await page.locator('.desk-filters > summary').click();
  await page.getByLabel('Source selection').selectOption('independent');
  await page
    .getByRole('button', { name: 'Training without Nvidia', exact: true })
    .click();
  await expect(page.getByLabel('Source selection')).toHaveValue('independent');
  await page
    .getByRole('button', { name: 'Build a brief', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'The $5.6m claim', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Build a brief', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#desk-query')).toHaveValue(
    'What does DeepSeek’s cost estimate actually measure?',
  );
  await page
    .getByRole('button', { name: 'Assess a new source', exact: true })
    .click();
  await expect(page.locator('.desk-examples')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Try an example', exact: true }),
  ).toBeVisible();
});

test('homepage introduces the product and opens the independent research desk', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'A claim is a starting point.',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Open research desk', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/desk$/);
  await expect(page.getByTestId('research-desk')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  await expect(
    page.getByRole('button', { name: 'Find evidence', exact: true }),
  ).toBeEnabled();
  await page.goto('/about');
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', {
      name: 'A claim is a starting point.',
      exact: true,
    }),
  ).toBeVisible();
});
