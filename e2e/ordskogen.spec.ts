import { expect, test, type Page } from '@playwright/test';
import { RIM } from '../src/games/rim/ord';
import { BYGG, KOMMA } from '../src/games/mening/meningar';
import { chunksOf, kommaTokens, orders } from '../src/games/mening/logic';
import { newHero } from './helpers';

// Rimbäcken och Meningssmedjan: en hel runda med ett rättat fel, bygga meningar och sätta komma.

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-o-${name}.png`, fullPage: true });
};

const next = (page: Page) => page.getByRole('button', { name: /^(Nästa|Se resultat)$/ }).click();

test('Ordskogen → Rimbäcken → Vad rimmar?, en hel runda med ett rättat fel', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Ordskogen' }).click();
  await page.getByRole('button', { name: /Rimbäcken/ }).click();
  await expect(page.getByRole('heading', { name: 'Rimbäcken' })).toBeVisible();
  await shot(page, '1-backen');
  await page.getByRole('button', { name: /Spela: Vad rimmar\?/ }).click();
  await expect(page.locator('.run-dots .dot')).toHaveCount(10);
  for (let i = 0; i < 10; i++) {
    const prompt = await page.locator('.drill-prompt').innerText();
    const word = /"(.+)"/.exec(prompt)![1];
    const group = RIM.find(([, ws]) => ws.includes(word))![1];
    const alts = await page.locator('.ord-choice').allInnerTexts();
    const right = alts.find((a) => group.includes(a) && a !== word)!;
    if (i === 0) {
      await shot(page, '2-rim');
      await page.locator('.ord-choice').filter({ hasNotText: new RegExp(`^${right}$`) }).first().click();
      await expect(page.locator('.errcard')).toBeVisible();
      await expect(page.locator('.errcard')).not.toContainText(right);
      await shot(page, '3-rim-fel');
    }
    await page.getByRole('button', { name: right, exact: true }).click();
    await expect(page.locator('.feedback.ok')).toBeVisible();
    await next(page);
  }
  await expect(page.getByRole('heading', { name: 'Bäcken porlar av glädje!' })).toBeVisible();
});

/** Raden i BYGG vars bitar ligger i högen. */
async function byggRow(page: Page): Promise<number> {
  const tiles = (await page.locator('.ordna-pool .ord-token').allInnerTexts()).sort();
  const i = BYGG.findIndex((_, k) => JSON.stringify(chunksOf(k).map((c) => c.text).sort()) === JSON.stringify(tiles));
  if (i < 0) throw new Error(`Okända bitar: ${tiles.join(', ')}`);
  return i;
}

/** Bitarna i den ordning de står i en rätt mening (en bit kan ha flera ord). */
function inOrder(row: number, sentence: string): string[] {
  const left = chunksOf(row).map((c) => c.text);
  const out: string[] = [];
  let rest = sentence;
  while (rest) {
    const t = left.filter((x) => !out.includes(x) && (rest === x || rest.startsWith(`${x} `))).sort((a, b) => b.length - a.length)[0];
    out.push(t);
    rest = rest.slice(t.length).trimStart();
  }
  return out;
}

test('Meningssmedjan: bygg meningen av bitar, rätta en fel ordning', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/meningssmedjan');
  await page.getByRole('button', { name: /Bygg meningen/ }).click();
  const row = await byggRow(page);
  const tiles = await page.locator('.ordna-pool .ord-token').allInnerTexts();
  await shot(page, '4-bygg');
  // Bitarna i den ordning de ligger är aldrig rätt (de blandas tills de inte är det).
  for (const t of tiles) await page.locator('.ordna-pool').getByRole('button', { name: t, exact: true }).click();
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.errcard')).toBeVisible();
  await shot(page, '5-bygg-fel');
  // Ta tillbaka bitarna och lägg dem rätt.
  while (await page.locator('.ordna-line .ord-token.placed').count()) await page.locator('.ordna-line .ord-token.placed').first().click();
  for (const t of inOrder(row, orders(row)[0])) await page.locator('.ordna-pool').getByRole('button', { name: t, exact: true }).click();
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await expect(page.locator('.ordna-line.done')).toBeVisible();
  await shot(page, '6-bygg-ratt');
});

test('Meningssmedjan: tryck där kommat ska stå', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/meningssmedjan');
  await page.getByRole('button', { name: /^.*Kommatecken/ }).first().click();
  const shown = (await page.locator('.ord-tokens .ord-token').allInnerTexts()).join(' ');
  const i = KOMMA.findIndex((_, k) => kommaTokens(k).tokens.join(' ') === shown);
  expect(i, shown).toBeGreaterThanOrEqual(0);
  const { tokens, target } = kommaTokens(i);
  await page.locator('.ord-tokens .ord-token').nth(target === 0 ? 1 : 0).click();
  await expect(page.locator('.errcard')).toBeVisible();
  await page.locator('.ord-tokens .ord-token').nth(target).click();
  await expect(page.locator('.ord-token.hit .ord-mark')).toHaveText(',');
  await expect(page.locator('.explain')).toContainText(KOMMA[i][0]);
  expect(tokens[target]).toBeTruthy();
  await shot(page, '7-komma');
});
