import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const routes = [
  { path: '/', label: 'home' },
  { path: '/evidence', label: 'evidence ledger' },
  { path: '/methodology', label: 'methodology' },
];

async function openSettled(page: Page, pathname: string) {
  await page.goto(pathname, { waitUntil: 'domcontentloaded' });
  await page.locator('main').waitFor();
  await page.evaluate(async () => {
    if ('fonts' in document) await document.fonts.ready;
  });
  const explorer = page.getByTestId('case-explorer');
  if (await explorer.count()) await expect(explorer).toHaveAttribute('data-hydrated', 'true');
}

async function expectNoPageOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
  }));
  expect(
    widths.documentWidth,
    `Document width ${widths.documentWidth}px exceeds viewport ${widths.viewportWidth}px`,
  ).toBeLessThanOrEqual(widths.viewportWidth + 1);
}

test.describe('route quality gates', () => {
  for (const route of routes) {
    test(`${route.label} has no serious accessibility violations or page overflow`, async ({ page }) => {
      const runtimeErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') runtimeErrors.push(message.text());
      });
      page.on('pageerror', (error) => runtimeErrors.push(error.message));
      await openSettled(page, route.path);
      await expectNoPageOverflow(page);
      const audit = await new AxeBuilder({ page }).analyze();
      const blocking = audit.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
      const summary = blocking.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.flatMap((node) => node.target.map(String)),
      }));
      expect(blocking, JSON.stringify(summary, null, 2)).toEqual([]);
      expect(runtimeErrors, `Runtime errors on ${route.path}`).toEqual([]);
    });
  }
});

test('all evidence filters produce the expected case and remain keyboard reachable', async ({ page }) => {
  await openSettled(page, '/');
  await expect(page.getByTestId('case-explorer')).toHaveAttribute('data-hydrated', 'true');
  const caseList = page.getByRole('list', { name: 'Filtered research cases' });
  const caseButtons = caseList.locator('button');
  const resetButton = page.getByRole('button', { name: 'Reset all filters' });

  await expect(caseButtons).toHaveCount(5);
  await expect(page.getByText('05 / 05 cases', { exact: true })).toBeVisible();

  const checkSelect = async (label: string, value: string, expectedHeading: string) => {
    await page.getByRole('combobox', { name: label }).selectOption(value);
    await expect(caseButtons).toHaveCount(1);
    await expect(page.getByRole('heading', { name: expectedHeading, exact: true })).toBeVisible();
    await expect(page.getByText('01 / 05 cases', { exact: true })).toBeVisible();
    await resetButton.click();
    await expect(caseButtons).toHaveCount(5);
  };

  await checkSelect('Response type', 'rerouted-access', 'Operation Gatekeeper GPU diversion network');
  await checkSelect('Case date', '2024', 'DeepSeek-V3 on Nvidia H800');
  await checkSelect('Source type', 'Government enforcement', 'Operation Gatekeeper GPU diversion network');
  await checkSelect('Confidence', 'Low', 'Tax preferences and local compute subsidies');
  await checkSelect('Dependency', 'Unknown', 'Tax preferences and local compute subsidies');

  const search = page.getByRole('textbox', { name: 'Search cases' });
  await search.fill('Gatekeeper');
  await expect(caseButtons).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Operation Gatekeeper GPU diversion network', exact: true })).toBeVisible();
  await resetButton.click();
  await search.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Response type' })).toBeFocused();
});

test('JSON and CSV datasets are linked, downloadable, and populated', async ({ page, request }) => {
  await openSettled(page, '/');
  const jsonResponse = await request.get('/data/research-dataset.json');
  expect(jsonResponse.ok()).toBeTruthy();
  const dataset = await jsonResponse.json();
  expect(dataset.cases).toHaveLength(5);
  expect(dataset.evidence).toHaveLength(19);

  const csvResponse = await request.get('/data/evidence.csv');
  expect(csvResponse.ok()).toBeTruthy();
  const csv = await csvResponse.text();
  expect(csv).toContain('"evidence_id"');
  expect(csv.match(/^"ev-/gm)).toHaveLength(19);

  for (const item of [
    { href: '/data/research-dataset.json', filename: 'research-dataset.json' },
    { href: '/data/evidence.csv', filename: 'evidence.csv' },
  ]) {
    const link = page.locator(`footer a[download][href="${item.href}"]`);
    await expect(link).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
    expect(download.suggestedFilename()).toBe(item.filename);
  }
});

test('metadata avoids local share URLs and uses the SVG favicon', async ({ page }) => {
  await openSettled(page, '/');
  const metadata = await page.evaluate(() => ({
    canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    icon: document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href,
    ogImage: document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content,
    twitterImage: document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')?.content,
  }));

  expect(metadata.icon).toMatch(/\/favicon\.svg$/);
  for (const value of [metadata.canonical, metadata.ogImage, metadata.twitterImage].filter(Boolean)) {
    expect(value).toMatch(/^https:\/\//);
    expect(value).not.toContain('localhost');
  }
  expect(metadata.twitterImage).toBe(metadata.ogImage);
});

test('mobile navigation exposes every primary destination', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-navigation check');
  await openSettled(page, '/evidence');
  await page.locator('summary[aria-label="Open navigation menu"]').click();

  const mobileNav = page.getByRole('navigation', { name: 'Mobile primary' });
  for (const label of ['Cases', 'Matrix', 'Timeline', 'Evidence', 'Method']) {
    await expect(mobileNav.getByRole('link', { name: label, exact: true })).toBeVisible();
  }

  await mobileNav.getByRole('link', { name: 'Method', exact: true }).click();
  await expect(page).toHaveURL(/\/methodology$/);
  await expect(page.getByRole('heading', { name: 'Separate progress from proof of policy failure.' })).toBeVisible();
});

test('filtered evidence URLs expose the expected reciprocal record set', async ({ page }) => {
  await openSettled(page, '/evidence?case=case-cloudmatrix');
  await expect(page.getByText('EVIDENCE LEDGER / 5 RECORDS')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ascend 910-series chips likely involved/ })).toBeVisible();
});

test('captures the signed-off responsive overview @screenshot', async ({ page }, testInfo) => {
  await openSettled(page, '/');
  await page.locator('#cases').waitFor();
  const suffix = testInfo.project.name.startsWith('desktop') ? 'desktop' : 'mobile';
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
