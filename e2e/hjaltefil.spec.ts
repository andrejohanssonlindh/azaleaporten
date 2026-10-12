import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-hf-${name}.png`, fullPage: true });
};

const setKastanjer = (page: Page, n: number) => page.evaluate((n) => {
  const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
  const k = `azaleaporten:h:${id}:hero`;
  localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k)!), kastanjer: n }));
}, n);

test('barnet sparar hjälten i en fil och hämtar tillbaka den, även på en tom enhet', async ({ page, context }) => {
  await newHero(page);
  await setKastanjer(page, 77);
  await page.goto('./#/gard');
  await expect(page.getByText('Senast sparad: aldrig')).toBeVisible();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Spara i en fil' }).click();
  const file = await dl;
  expect(file.suggestedFilename()).toMatch(/^azaleaporten-Hjälte2-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await file.path();
  await expect(page.getByText(/Senast sparad: \d/)).toBeVisible();
  await shot(page, '1-sparad');

  // Hjälten spelar vidare, och sedan hämtas den gamla filen: varning, och filen vinner.
  await setKastanjer(page, 200);
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    localStorage.setItem(`azaleaporten:h:${id}:andrad`, JSON.stringify({ v: 1, at: new Date(Date.now() + 60_000).toISOString() }));
  });
  await page.goto('./#/hjaltar');
  await page.locator('.hero-card.new.file-btn input').setInputFiles(path);
  await expect(page.getByRole('dialog', { name: 'Hämta hjälte' })).toContainText('Hjälten här har spelat efter att filen sparades');
  await shot(page, '2-varning');
  await page.getByRole('button', { name: 'Hämta ändå' }).click();
  await expect(page.getByRole('group', { name: 'Karta över ön' })).toBeVisible();
  await expect(page.getByText('Hjälte2 är tillbaka!')).toBeVisible();
  await page.goto('./#/gard');
  await expect(page.locator('.purse')).toContainText('🌰 77');

  // En annan enhet utan hjältar.
  const other = await context.browser()!.newContext({ baseURL: test.info().project.use.baseURL });
  const p2 = await other.newPage();
  await p2.route('**/packs/familj.enc', (r) => r.fulfill({ status: 404, body: '' }));
  await p2.goto('./');
  await p2.getByRole('button', { name: 'Öppna porten' }).click();
  await expect(p2.getByText('Har du redan en hjälte i en fil?')).toBeVisible();
  await p2.locator('.file-btn input').setInputFiles({ name: 'hjalte.json', mimeType: 'application/json', buffer: await readFile(path) });
  await expect(p2.getByRole('group', { name: 'Karta över ön' })).toBeVisible();
  await p2.goto('./#/gard');
  await expect(p2.locator('.purse')).toContainText('🌰 77');
  await other.close();
});

test('en fil som inte är en hjälte avvisas', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/hjaltar');
  await page.locator('.hero-card.new.file-btn input').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hej":1}') });
  await expect(page.getByText('Det där är ingen hjältefil.')).toBeVisible();
});
