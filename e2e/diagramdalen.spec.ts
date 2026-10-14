import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

// Diagramdalen (statistik): läsa streck (fel tre gånger → svaret visas), rita streck, bygga staplar,
// trycka på rätt stapel och läsa ett bilddiagram.

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-d-${name}.png`, fullPage: true });
};

/** Talen i tabellen som barnet bygger från (den första tabellen på sidan). */
const tableValues = (page: Page) => page.locator('.dia-tab').first().locator('.dia-varde').allInnerTexts().then((t) => t.map(Number));

test('Diagramdalen → Fågeltornet: läs strecken, fel tre gånger och svaret visas', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Diagramdalen' }).click();
  await expect(page.getByText('Statistik')).toBeVisible();
  await shot(page, '1-dalen');
  await page.getByRole('button', { name: /Fågeltornet/ }).click();
  await page.getByRole('button', { name: /Spela: Första strecken/ }).click();
  await expect(page.locator('.dia-tally').first()).toBeVisible();
  await shot(page, '2-streck');
  const input = page.getByLabel('Ditt svar');
  for (let k = 0; k < 3; k++) {
    await input.fill('99');
    await page.getByRole('button', { name: 'Rätta' }).click();
    await expect(page.locator('.errcard')).toBeVisible();
  }
  await shot(page, '3-fel');
  const shown = await page.locator('.err-task').innerText();
  const right = /Rätt svar är (\d+)/.exec(shown)![1];
  await input.fill(right);
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await expect(page.locator('.dia-rad.hit')).toHaveCount(1);
});

test('Fågeltornet: rita streck från en tabell', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/fageltornet');
  await page.getByRole('button', { name: /Rita strecken/ }).click();
  const want = await tableValues(page);
  expect(want.length).toBe(3);
  const rows = page.locator('.dia-rad.bygg');
  for (let i = 0; i < want.length; i++) for (let k = 0; k < want[i]; k++) await rows.nth(i).getByRole('button', { name: /Ett streck till/ }).click();
  await shot(page, '4-rita');
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();
});

test('Skördemarknaden: bygg staplar, tryck på rätt stapel och läs ett bilddiagram', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/skordemarknaden');
  await page.getByRole('button', { name: /Bygg staplar/ }).click();
  const want = await tableValues(page);
  // Först en stapel för låg: "ett steg fel".
  for (let i = 0; i < want.length; i++) for (let k = 0; k < want[i] - (i === 0 ? 1 : 0); k++) await page.getByRole('button', { name: /^Högre:/ }).nth(i).click();
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.err-title')).toHaveText('Kolla höjden');
  await shot(page, '5-bygg');
  await page.getByRole('button', { name: /^Högre:/ }).nth(0).click();
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await shot(page, '6-byggd');

  await page.goto('./#/labb/skordemarknaden');
  await page.getByRole('button', { name: /Högst och lägst/ }).click();
  const bars = page.locator('.dia-tap[role="button"]');
  await shot(page, '7-tryck');
  for (let i = 0; i < await bars.count(); i++) {
    await bars.nth(i).click();
    if (await page.locator('.feedback.ok').isVisible()) break;
    await expect(page.locator('.errcard')).toBeVisible();
  }
  await expect(page.locator('.feedback.ok')).toBeVisible();

  await page.goto('./#/labb/skordemarknaden');
  await page.getByRole('button', { name: /Halva bilder/ }).click();
  await expect(page.locator('.dia-pikto.halv').first()).toBeVisible();
  await expect(page.locator('.dia-nyckel')).toContainText(/Nyckel: .+ = \d+/);
  await shot(page, '8-bild');
});
