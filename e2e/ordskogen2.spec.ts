import { expect, test, type Page } from '@playwright/test';
import { MENINGAR } from '../src/games/ordklass/ord';
import { shown, tokensOf } from '../src/games/ordklass/logic';
import { TEXTER } from '../src/games/berattelse/texter';
import { newHero } from './helpers';

// Ordklassernas tempel och Berättelsebiblioteket: tryck på rätt ordklass, och en hel läsrunda.

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-o2-${name}.png`, fullPage: true });
};

test('Ordklassernas tempel: hitta verbet, rätta ett fel', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/ordklassernas-tempel');
  await page.getByRole('button', { name: /Hitta verbet/ }).click();
  const words = await page.locator('.ord-tokens .ord-token').allInnerTexts();
  const i = MENINGAR.findIndex((_, k) => shown(k).join(' ') === words.join(' '));
  expect(i, words.join(' ')).toBeGreaterThanOrEqual(0);
  const t = tokensOf(i);
  await shot(page, '1-tempel');
  await page.locator('.ord-tokens .ord-token').nth(t.findIndex((x) => x.c === 's')).click();
  await expect(page.locator('.errcard')).toContainText('substantiv');
  await page.locator('.ord-tokens .ord-token').nth(t.findIndex((x) => x.c === 'v')).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await shot(page, '2-tempel-ratt');
});

test('Berättelsebiblioteket: en hel runda med ett rättat fel', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Ordskogen' }).click();
  await page.getByRole('button', { name: /Berättelsebiblioteket/ }).click();
  await expect(page.getByRole('heading', { name: 'Berättelsebiblioteket' })).toBeVisible();
  await page.getByRole('button', { name: /Spela: Det står i texten/ }).click();
  await expect(page.locator('.run-dots .dot')).toHaveCount(10);
  for (let n = 0; n < 10; n++) {
    const titel = await page.locator('.las-text h3').textContent() ?? '';
    const prompt = await page.locator('.drill-prompt').innerText();
    const f = TEXTER.find((t) => t.titel === titel)!.fragor.find((x) => x.q === prompt)!;
    if (n === 0) {
      await shot(page, '3-bibliotek');
      await page.getByRole('button', { name: f.fel[0][0], exact: true }).click();
      await expect(page.locator('.errcard')).toBeVisible();
      await expect(page.locator('.errcard')).not.toContainText(f.svar);
      await shot(page, '4-bibliotek-fel');
    }
    await page.getByRole('button', { name: f.svar, exact: true }).click();
    await expect(page.locator('.feedback.ok')).toBeVisible();
    await page.getByRole('button', { name: /^(Nästa|Se resultat)$/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'En ny hylla öppnas!' })).toBeVisible();
});
