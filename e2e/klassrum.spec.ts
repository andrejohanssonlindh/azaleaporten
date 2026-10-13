import { expect, test, type Page } from '@playwright/test';
import { answer, newHero, solve } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-k-${name}.png`, fullPage: true });
};

test('Klassrummet: en lektion från stigen, steg för steg, prova själv och klar', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/omrade/tabellgruvan');
  const sign = page.locator('.path .lesson-sign', { hasText: 'Vad är delat med?' });
  await expect(sign).toBeVisible();
  await shot(page, '1-stigen');
  await sign.click();
  await expect(page.getByRole('heading', { name: 'Två sätt att tänka på delat' })).toBeVisible();
  await page.getByRole('button', { name: 'Nästa →' }).click();
  await expect(page.getByRole('heading', { name: 'Sätt 1: Dela lika' })).toBeVisible();
  await page.getByRole('button', { name: /Visa nästa steg/ }).click();
  await page.getByRole('button', { name: /Visa nästa steg/ }).click();
  await expect(page.locator('.lesson-steps li')).toHaveCount(3); // två steg + knappen
  await shot(page, '2-steg');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Nästa →' }).click();
  await expect(page.getByRole('heading', { name: /Prova själv/ })).toBeVisible();
  // Ett fel här räknas inte: rätta och gå vidare.
  const right = await solve(page);
  await page.getByLabel('Ditt svar').fill(String(right + 1));
  await page.getByRole('button', { name: 'Rätta' }).click();
  await page.getByLabel('Ditt svar').fill(String(right));
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.getByText('Rätt direkt: 0 av 1')).toBeVisible();
  await shot(page, '3-prova');
  await page.getByRole('button', { name: '✓ Klart!' }).click();
  await expect(page.getByText(/Bra jobbat!/)).toBeVisible();
  await page.getByRole('button', { name: 'Tillbaka till Tabellgruvan' }).first().click();
  await expect(page.locator('.path .lesson-sign.read', { hasText: 'Vad är delat med?' })).toBeVisible();
  // Inga fel loggades från lektionen: inget förslag på stigen.
  await expect(page.locator('.lesson-sign.need')).toHaveCount(0);
});

test('Klassrummet i en runda: mild knapp, Mästare Kastanj frågar en gång, rundan ligger kvar', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/omrade/tabellgruvan');
  await page.getByRole('button', { name: /Spela: Tvåan, femman, tian/ }).click();
  await expect(page.locator('.lesson-nudge')).toHaveCount(0);
  await answer(page, true);
  await expect(page.locator('.lesson-nudge')).toHaveCount(0); // ett fel: inget förslag än
  await answer(page, true);
  const nudge = page.locator('.lesson-nudge.mild');
  await expect(nudge).toContainText('Vad är gånger?');
  await shot(page, '4-mild');

  // Lektionen ligger över rundan; frågan under rörs inte.
  const before = await page.locator('.eq').textContent();
  await nudge.click();
  await expect(page.getByRole('dialog', { name: /Klassrummet/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gånger är grupper' })).toBeVisible();
  await shot(page, '5-lager');
  await page.getByRole('button', { name: 'Tillbaka till frågan' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.locator('.eq').textContent()).toBe(before);
  await expect(page.locator('.run-dots .dot.bad')).toHaveCount(2);

  // Tredje felet av tre: stark. Mästare Kastanj frågar före nästa fråga.
  await answer(page, true);
  await expect(page.getByText(/Det här verkar knepigt just nu/)).toBeVisible();
  await shot(page, '6-stark');
  await page.getByRole('button', { name: 'Jag kör vidare' }).click();
  await expect(page.locator('.lesson-nudge.stark')).toBeVisible();
  for (let i = 3; i < 10; i++) await answer(page);
  // Mästare Kastanj frågar bara en gång per runda.
  await expect(page.locator('.result-card')).toBeVisible();
  await expect(page.locator('.result-card .lesson-nudge')).toContainText('Vad är gånger?');
  await shot(page, '7-resultat');
  await page.locator('.result-card .lesson-nudge').click();
  await expect(page.getByRole('heading', { name: 'Gånger är grupper' })).toBeVisible();
  await page.getByRole('button', { name: /^← Tabellgruvan/ }).click();
  await expect(page.locator('.path .lesson-sign.need', { hasText: 'Vad är gånger?' })).toBeVisible();
  await shot(page, '8-tips-pa-stigen');
});
