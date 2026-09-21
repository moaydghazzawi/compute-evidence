import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
const researchData = JSON.parse(
  await readFile(new URL('../../data/research.json', import.meta.url), 'utf8'),
);

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const routes = [
  { path: '/', label: 'homepage' },
  { path: '/research', label: 'research' },
  { path: '/evidence', label: 'evidence ledger' },
  { path: '/methodology', label: 'methodology' },
  { path: '/desk', label: 'research desk' },
];

test('local previews refuse private files and raw imports', async ({
  request,
}, testInfo) => {
  const directory = path.join(process.cwd(), 'private');
  const name = `preview-access-test-${testInfo.project.name}.json`;
  const file = path.join(directory, name);
  const marker = `private-audit-probe-${testInfo.project.name}`;
  await mkdir(directory, { recursive: true });
  await writeFile(file, JSON.stringify({ marker }));
  try {
    for (const url of [
      `/private/${name}`,
      `/private/${name}?raw`,
      `/@fs${encodeURI(file)}`,
      `/@fs${encodeURI(file)}?import`,
    ]) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(403);
      expect(await response.text()).not.toContain(marker);
    }
  } finally {
    await rm(file, { force: true });
  }
});

async function openSettled(page: Page, pathname: string) {
  await page.goto(pathname, { waitUntil: 'domcontentloaded' });
  await page.locator('main').waitFor();
  await page.evaluate(async () => {
    if ('fonts' in document) await document.fonts.ready;
  });
  const explorer = page.getByTestId('case-explorer');
  if (await explorer.count())
    await expect(explorer).toHaveAttribute('data-hydrated', 'true');
  const library = page.getByTestId('evidence-library');
  if (await library.count())
    await expect(library).toHaveAttribute('data-hydrated', 'true');
}

async function expectNoPageOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    ),
  }));
  expect(
    widths.documentWidth,
    `Document width ${widths.documentWidth}px exceeds viewport ${widths.viewportWidth}px`,
  ).toBeLessThanOrEqual(widths.viewportWidth + 1);
}

test.describe('route quality gates', () => {
  for (const route of routes) {
    test(`${route.label} has no serious accessibility violations or page overflow`, async ({
      page,
    }) => {
      const runtimeErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') runtimeErrors.push(message.text());
      });
      page.on('pageerror', (error) => runtimeErrors.push(error.message));
      await openSettled(page, route.path);
      await expectNoPageOverflow(page);
      await expect(page.locator('body')).not.toContainText(
        /ChatGPT|Sign in|Log in/i,
      );
      await expect(page.locator('a[href*="signin-with-chatgpt"]')).toHaveCount(
        0,
      );
      const audit = await new AxeBuilder({ page }).analyze();
      const blocking = audit.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical',
      );
      const summary = blocking.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.flatMap((node) => node.target.map(String)),
      }));
      expect(summary).toEqual([]);
      expect(runtimeErrors, `Runtime errors on ${route.path}`).toEqual([]);
    });
  }
});

test('all evidence filters produce the expected case and remain keyboard reachable', async ({
  page,
}) => {
  await openSettled(page, '/research');
  await expect(page.getByTestId('case-explorer')).toHaveAttribute(
    'data-hydrated',
    'true',
  );
  const caseList = page.locator('.case-list');
  const caseButtons = caseList.locator('button');
  const resetButton = page.getByRole('button', { name: 'Reset all filters' });

  await expect(caseButtons).toHaveCount(5);
  await expect(page.getByText('05 / 05 cases', { exact: true })).toBeVisible();

  const checkSelect = async (
    label: string,
    value: string,
    expectedHeading: string,
  ) => {
    await page.getByRole('combobox', { name: label }).selectOption(value);
    await expect(caseButtons).toHaveCount(1);
    await expect(
      page.getByRole('heading', { name: expectedHeading, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('01 / 05 cases', { exact: true }),
    ).toBeVisible();
    await resetButton.click();
    await expect(caseButtons).toHaveCount(5);
  };

  await checkSelect(
    'Response type',
    'rerouted-access',
    'Operation Gatekeeper GPU diversion network',
  );
  await page.locator('.case-more-filters > summary').click();
  await checkSelect('Case date', '2024', 'DeepSeek-V3 on Nvidia H800');
  await checkSelect(
    'Source type',
    'Government enforcement',
    'Operation Gatekeeper GPU diversion network',
  );
  await checkSelect(
    'Confidence',
    'Low',
    'Tax preferences and local compute subsidies',
  );
  await checkSelect(
    'Dependency',
    'Unknown',
    'Tax preferences and local compute subsidies',
  );

  const search = page.getByRole('textbox', { name: 'Search cases' });
  await search.fill('Gatekeeper');
  await expect(caseButtons).toHaveCount(1);
  await expect(
    page.getByRole('heading', {
      name: 'Operation Gatekeeper GPU diversion network',
      exact: true,
    }),
  ).toBeVisible();
  await resetButton.click();
  await search.focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('combobox', { name: 'Response type' }),
  ).toBeFocused();
});

test('JSON and CSV datasets are linked, downloadable, and populated', async ({
  page,
  request,
}) => {
  await openSettled(page, '/research');
  const jsonResponse = await request.get('/data/research-dataset.json');
  expect(jsonResponse.ok()).toBeTruthy();
  const dataset = await jsonResponse.json();
  expect(dataset.cases).toHaveLength(5);
  expect(dataset.evidence).toHaveLength(researchData.evidence.length);
  expect(dataset.meta.version).toBe(researchData.meta.version);

  const csvResponse = await request.get('/data/evidence.csv');
  expect(csvResponse.ok()).toBeTruthy();
  const csv = await csvResponse.text();
  expect(csv).toContain('"evidence_id"');
  expect(csv.match(/^"ev-/gm)).toHaveLength(researchData.evidence.length);

  for (const item of [
    { href: '/data/research-dataset.json', filename: 'research-dataset.json' },
    { href: '/data/evidence.csv', filename: 'evidence.csv' },
  ]) {
    const link = page.locator(`footer a[download][href="${item.href}"]`);
    await expect(link).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      link.click(),
    ]);
    expect(download.suggestedFilename()).toBe(item.filename);
  }
});

test('metadata avoids local share URLs and uses the SVG favicon', async ({
  page,
}) => {
  await openSettled(page, '/research');
  const metadata = await page.evaluate(() => ({
    canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.href,
    icon: document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href,
    ogImage: document.querySelector<HTMLMetaElement>(
      'meta[property="og:image"]',
    )?.content,
    twitterImage: document.querySelector<HTMLMetaElement>(
      'meta[name="twitter:image"]',
    )?.content,
  }));

  expect(metadata.icon).toMatch(/\/favicon\.svg$/);
  for (const value of [
    metadata.canonical,
    metadata.ogImage,
    metadata.twitterImage,
  ].filter(Boolean)) {
    expect(value).toMatch(/^https:\/\//);
    expect(value).not.toContain('localhost');
  }
  expect(metadata.twitterImage).toBe(metadata.ogImage);
});

test('mobile navigation exposes every primary destination', async ({
  page,
}, testInfo) => {
  test.skip(
    !testInfo.project.name.startsWith('mobile'),
    'Mobile-navigation check',
  );
  await openSettled(page, '/evidence');
  await page.locator('summary[aria-label="Open navigation menu"]').click();

  const mobileNav = page.getByRole('navigation', { name: 'Mobile primary' });
  for (const label of [
    'Research desk',
    'Research',
    'Evidence',
    'Method',
    'Home',
  ]) {
    await expect(
      mobileNav.getByRole('link', { name: label, exact: true }),
    ).toBeVisible();
  }

  await mobileNav.getByRole('link', { name: 'Method', exact: true }).click();
  await expect(page).toHaveURL(/\/methodology$/);
  await expect(
    page.getByRole('heading', { name: 'How the judgments are made.' }),
  ).toBeVisible();
});

test('filtered evidence URLs expose the expected reciprocal record set', async ({
  page,
}) => {
  await openSettled(page, '/evidence?case=case-cloudmatrix');
  await expect(page.locator('.results-toolbar p')).toContainText(
    '7 of 21 evidence records',
  );
  await expect(
    page.getByRole('heading', {
      name: /Ascend 910-series chips likely involved/,
    }),
  ).toBeVisible();
});

test('case permalinks survive reload, filtering, and browser history', async ({
  page,
}) => {
  await openSettled(page, '/research?case=case-cloudmatrix#cases');
  const title = page.locator('.case-detail-header h3');
  await expect(title).toHaveText('CloudMatrix384 serving DeepSeek-R1');
  await page.locator('.case-more-filters > summary').click();
  await page
    .getByRole('combobox', { name: 'Confidence', exact: true })
    .selectOption('Low');
  await expect(title).toHaveText('Tax preferences and local compute subsidies');
  await expect(page).toHaveURL(/confidence=Low/);
  await page.goBack();
  await expect(title).toHaveText('CloudMatrix384 serving DeepSeek-R1');
  await page.reload();
  await expect(title).toHaveText('CloudMatrix384 serving DeepSeek-R1');
  await page.goForward();
  await expect(title).toHaveText('Tax preferences and local compute subsidies');
});

test('invalid filter URLs recover and empty results can be reset', async ({
  page,
}) => {
  await openSettled(page, '/research?case=missing&confidence=invalid');
  await expect(page.locator('.case-detail-header h3')).toHaveText(
    'DeepSeek-V3 on Nvidia H800',
  );
  await page.locator('.case-more-filters > summary').click();
  await expect(
    page.getByRole('combobox', { name: 'Confidence', exact: true }),
  ).toHaveValue('all');
  await page
    .getByRole('textbox', { name: 'Search cases' })
    .fill('this-record-does-not-exist');
  await expect(
    page.getByRole('heading', { name: /No cases match/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset all filters' }).click();
  await expect(page.locator('.case-list button')).toHaveCount(5);
});

test('evidence search exports only the shown records and links to the exact case', async ({
  page,
}) => {
  await openSettled(page, '/evidence?case=case-cloudmatrix');
  await page.getByRole('textbox', { name: 'Search evidence' }).fill('34.8');
  await expect(page.locator('.evidence-card')).toHaveCount(1);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export 1 records' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('evidence-1-records.csv');
  const file = await download.path();
  expect(file).not.toBeNull();
  const csv = await readFile(file!, 'utf8');
  expect(csv.match(/^"ev-/gm)).toHaveLength(1);
  expect(csv).toContain('ev-cloudmatrix-production');
  await page.reload();
  await expect(page.locator('.evidence-card')).toHaveCount(1);
  await page.locator('.evidence-card-footer a').click();
  await expect(page).toHaveURL(/case=case-cloudmatrix#cases/);
  await expect(page.locator('.case-detail-header h3')).toHaveText(
    'CloudMatrix384 serving DeepSeek-R1',
  );
});

test('record permalinks open evidence and filtering clears stale anchors', async ({
  page,
}) => {
  await openSettled(page, '/evidence#ev-cloudmatrix-production');
  await expect(
    page.locator('#ev-cloudmatrix-production details'),
  ).toHaveAttribute('open', '');
  await page
    .getByRole('combobox', { name: 'Research case' })
    .selectOption('case-pangu-ultra');
  await expect(page).not.toHaveURL(/#ev-/);
  await expect(page.locator('.evidence-card')).toHaveCount(4);
});

test('copy-link fallback offers the actual case permalink', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Clipboard denied');
        },
      },
    });
  });
  await openSettled(
    page,
    '/research?case=case-cloudmatrix&confidence=Moderate#cases',
  );
  await page
    .locator('.case-detail')
    .getByRole('button', { name: 'Copy link', exact: true })
    .click();
  await expect(page.getByRole('textbox', { name: 'Link to copy' })).toHaveValue(
    /\/research\?case=case-cloudmatrix#cases$/,
  );
});

test('mobile case picker preserves keyboard focus', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile case picker');
  await openSettled(page, '/research');
  const picker = page.getByRole('combobox', { name: 'Selected case' });
  await picker.focus();
  await picker.selectOption('case-cloudmatrix');
  await expect(picker).toBeFocused();
  await expect(page.locator('.case-detail-header h3')).toHaveText(
    'CloudMatrix384 serving DeepSeek-R1',
  );
});

test('all comparison dimensions and timeline source disclosures work', async ({
  page,
}) => {
  await openSettled(page, '/research');
  for (const dimension of researchData.cases[0].tests) {
    const button = page
      .getByRole('group', { name: 'Comparison dimension' })
      .getByRole('button', { name: new RegExp(dimension.label) });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    const table = page.locator('.comparison-table');
    await expect(table.locator('tbody tr')).toHaveCount(5);
    await expect(table.locator('tbody tr').first()).toContainText(
      dimension.answer,
    );
  }
  const events = page.locator('.timeline-event');
  for (let index = 0; index < researchData.timeline.length; index++) {
    const event = events.nth(index);
    await event.locator('summary').click();
    await expect(event.locator('.timeline-sources a')).toHaveCount(
      researchData.timeline[index].sourceIds.length,
    );
    await expect(event.locator('.timeline-caveat')).toBeVisible();
  }
  await expectNoPageOverflow(page);
});

test('captures the signed-off responsive overview @screenshot', async ({
  page,
}, testInfo) => {
  await openSettled(page, '/research');
  await page.locator('#cases').waitFor();
  const suffix = testInfo.project.name.startsWith('desktop')
    ? 'desktop'
    : 'mobile';
  const directory = path.join(process.cwd(), 'docs', 'screenshots');
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    path: path.join(directory, `overview-${suffix}.png`),
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  });
});
