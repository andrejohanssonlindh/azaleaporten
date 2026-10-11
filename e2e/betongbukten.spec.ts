import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-g-${name}.png`, fullPage: true });
};

const PARKS = ['fluffy', 'svampen', 'oxie', 'sibbarp', 'bryggeriet', 'kroksback', 'stapelbaddsparken'];

test('Betongbukten: alla parker är öppna och regionbossen är låst', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/region/betongbukten');
  await expect(page.locator('.area-open')).toHaveCount(7);
  await expect(page.locator('.region-boss.locked')).toContainText('Betongbuktens Mästare (0/3)');
  await shot(page, '0-region');
});

test('varje bana i varje park ritar sin fråga', async ({ page }) => {
  test.setTimeout(120_000);
  await newHero(page);
  for (const park of PARKS) {
    await page.goto(`./#/labb/${park}`);
    const stages = page.locator('.seg button');
    await expect(stages.first()).toBeVisible(); // spelet laddas först
    const n = await stages.count();
    expect(n).toBeGreaterThan(8);
    for (let i = 0; i < n; i++) {
      await stages.nth(i).click();
      await expect(page.locator('.eq')).toBeVisible();
      if (process.env.SHOTS) await page.locator('.kq').screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-g-${park}-${String(i).padStart(2, '0')}.png` });
    }
  }
});

test('räknaren, kladdpapperet och formelkortet i Stapelbäddsparken', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/stapelbaddsparken');
  await page.getByRole('button', { name: /Runt hjulet/ }).click();
  await page.getByRole('button', { name: '🧮 Räknare' }).click();
  for (const k of ['Pi', 'Gånger', '1', '0', 'Är lika med']) await page.getByRole('button', { name: k, exact: true }).click();
  await expect(page.locator('.calc-out')).toHaveText('31,415927');
  await expect(page.locator('.calc-tape')).toContainText('π×10 = 31,415927');
  await shot(page, 'raknare');
  await page.getByRole('button', { name: '📒 Formler' }).click();
  await expect(page.locator('.formulas')).toContainText('O = π · d');
  await page.getByRole('button', { name: '📝 Anteckna' }).click();
  await page.getByLabel('Anteckningar').fill('d = 2 · r');
  await page.getByRole('button', { name: '✏️ Rita' }).click();
  const paper = page.getByLabel(/Kladdpapper/);
  const box = (await paper.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 80);
  await page.mouse.up();
  await shot(page, 'kladd');
  // Nästa fråga: verktygslådan minns fliken, och anteckningarna finns kvar.
  await page.getByLabel('Ditt svar').fill('1');
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.errcard')).toBeVisible();
  await page.getByRole('button', { name: /Byt|Runt hjulet/ }).first().click();
  await page.getByRole('button', { name: '📝 Anteckna' }).click();
  await expect(page.getByLabel('Anteckningar')).toHaveValue('d = 2 · r');
});
