import { expect, test, type Page } from '@playwright/test';
import { TEMAN } from '../src/games/glosor/ord';
import { numWord } from '../src/games/engelska/tal';
import { digital, phrase } from '../src/games/bigben/logic';
import { BYGG } from '../src/games/pirat/meningar';
import { newHero } from './helpers';

// Västerön (engelska): en hel runda i Glosviken utan röst, Hamnen och Stavklippan med en låtsasröst,
// Big Ben-tornet och Piratskeppet (bygg meningen och prepositioner med bild).

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-v-${name}.png`, fullPage: true });
};

const next = (page: Page) => page.getByRole('button', { name: /^(Nästa|Se resultat)$/ }).click();

/** En låtsasröst på svenska och engelska som minns vad den skulle säga. */
async function fakeVoices(page: Page) {
  await page.addInitScript(() => {
    const said: string[] = [];
    const voices = [
      { lang: 'sv-SE', name: 'Teströsten', localService: true, default: true, voiceURI: 'sv' },
      { lang: 'en-GB', name: 'Test voice', localService: true, default: false, voiceURI: 'en' },
    ];
    Object.assign(window, { __said: said });
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => voices, speak: (u: { text: string }) => said.push(u.text), cancel: () => {}, addEventListener: () => {} } });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { lang = ''; voice: unknown; rate = 1; text: string; constructor(text: string) { this.text = text; } } });
  });
}

/** En enhet utan röster alls (Chrome kan ha en engelsk röst även headless). */
async function noVoices(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], speak: () => {}, cancel: () => {}, addEventListener: () => {} } });
  });
}

const said = (page: Page) => page.evaluate(() => (window as unknown as { __said: string[] }).__said);
const lastSaid = async (page: Page) => (await said(page)).at(-1)!;

/** Väntar tills rösten har sagt något nytt (frågan läser upp sig själv när den visas). */
async function newSaying(page: Page, before: number): Promise<string> {
  await expect.poll(async () => (await said(page)).length).toBeGreaterThan(before);
  return lastSaid(page);
}

const WORDS = TEMAN.flatMap((t) => t.words);
const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };

/** Det engelska ordet som är rätt i Glosvikens fråga. */
async function glosa(page: Page): Promise<string> {
  const heard = page.locator('.ord-heard');
  if (await heard.count()) return (await heard.innerText()).trim();
  const prompt = await page.locator('.drill-prompt').innerText();
  const sv = /"(.+)"/.exec(prompt)?.[1];
  if (sv) return WORDS.find((w) => w[1] === sv)![0];
  const bg = await page.locator('.ord-pic .ord-swatch').evaluate((el) => (el as HTMLElement).style.background);
  return WORDS.find((w) => w[2].startsWith('#') && rgb(w[2]) === bg)![0];
}

test('Västerön → Glosviken → Färger, en hel runda utan engelsk röst (läs i stället)', async ({ page }) => {
  await noVoices(page);
  await newHero(page);
  await page.getByRole('button', { name: 'Västerön' }).click();
  await shot(page, '1-on');
  await page.getByRole('button', { name: /Glosviken/ }).click();
  await expect(page.getByRole('heading', { name: 'Glosviken' })).toBeVisible();
  await page.getByRole('button', { name: /Spela: Färger/ }).click();
  await expect(page.locator('.run-dots .dot')).toHaveCount(10);
  for (let i = 0; i < 10; i++) {
    const right = await glosa(page);
    if (i === 0) {
      await shot(page, '2-farg');
      await page.locator('.ord-choice').filter({ hasNotText: new RegExp(`^${right}$`) }).and(page.locator(`:not([aria-label="${right}"])`)).first().click();
      await expect(page.locator('.errcard')).toBeVisible();
      await expect(page.locator('.errcard')).not.toContainText(new RegExp(`(?<!\\p{L})${right}(?!\\p{L})`, 'iu'));
      await shot(page, '3-farg-fel');
    }
    await page.getByRole('button', { name: right, exact: true }).click();
    await expect(page.locator('.feedback.ok')).toBeVisible();
    await next(page);
  }
  await expect(page.getByRole('heading', { name: 'Fullt nät av engelska ord!' })).toBeVisible();
});

test('Hamnen: talen läses upp på engelska och barnet väljer siffran', async ({ page }) => {
  await fakeVoices(page);
  await newHero(page);
  await page.goto('./#/omrade/hamnen');
  await page.getByRole('button', { name: /Spela: Tal i vinden/ }).click();
  let count = 0;
  for (let i = 0; i < 10; i++) {
    await expect(page.getByRole('button', { name: '🔊 Lyssna igen' })).toBeVisible();
    await expect(page.locator('.ord-heard')).toHaveCount(0);
    const heard = await newSaying(page, count);
    const n = Array.from({ length: 13 }, (_, k) => k).find((k) => numWord(k) === heard)!;
    if (i === 0) await shot(page, '4-hamnen');
    await page.getByRole('button', { name: String(n), exact: true }).click();
    await expect(page.locator('.ord-heard')).toHaveText(heard);
    count = (await said(page)).length;
    await next(page);
  }
  await expect(page.getByRole('heading', { name: 'Du hörde varenda ord!' })).toBeVisible();
});

test('Big Ben-tornet: "half past two" är 2:30, och halv-fällan förklaras', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/big-ben-tornet');
  await page.getByRole('button', { name: /Läs tiden/ }).click();
  let trapped = false;
  for (let i = 0; i < 6; i++) {
    const sentence = await page.locator('.ord-sentence').innerText();
    const p = /It's (.+)\./.exec(sentence)![1];
    let right = '';
    for (let h = 1; h <= 12 && !right; h++) for (const m of [0, 30]) if (phrase(h, m) === p) right = digital(h, m);
    const half = /half past (\w+)/.exec(p);
    if (half && !trapped) {
      // Halv-fällan: en timme för tidigt.
      const [h] = right.split(':').map(Number);
      const trap = digital(h - 1, 30);
      if (await page.getByRole('button', { name: trap, exact: true }).count()) {
        await page.getByRole('button', { name: trap, exact: true }).click();
        await expect(page.locator('.errcard')).toContainText('Half-past-spöket');
        await shot(page, '5-halv-fel');
        trapped = true;
      }
    }
    await page.getByRole('button', { name: right, exact: true }).click();
    await expect(page.locator('.bigben-clock')).toBeVisible();
    await next(page);
  }
});

test('Stavklippan: diktat på engelska med bild och svenskt ord', async ({ page }) => {
  await fakeVoices(page);
  await newHero(page);
  await page.goto('./#/labb/stavklippan');
  await page.getByRole('button', { name: /Första diktatet/ }).click();
  await expect(page.getByLabel('Skriv ordet')).toBeVisible();
  const word = (await newSaying(page, 0)).split('.')[0];
  await shot(page, '6-diktat');
  if (test.info().project.name === 'mobil') {
    await expect(page.locator('.kbd')).toBeVisible();
    await expect(page.locator('.kbd-key', { hasText: /^å$/ })).toHaveCount(0);
    for (const ch of word) await page.locator('.kbd-key', { hasText: new RegExp(`^${ch}$`) }).click();
    await page.locator('.kbd-key.ok').click();
  } else {
    await page.getByLabel('Skriv ordet').fill(word);
    await page.getByRole('button', { name: 'Rätta' }).click();
  }
  await expect(page.locator('.feedback.ok')).toBeVisible();
});

test('Piratskeppet: bygg meningen, och en bild till prepositionerna', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/piratskeppet');
  await page.getByRole('button', { name: /Bygg meningen/ }).click();
  const tiles = (await page.locator('.ordna-pool .ord-token').allInnerTexts()).sort();
  const row = BYGG.find(([t]) => JSON.stringify([...t].sort()) === JSON.stringify(tiles))!;
  for (const t of row[0]) await page.locator('.ordna-pool').getByRole('button', { name: t, exact: true }).click();
  await shot(page, '7-bygg');
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();

  await page.getByRole('button', { name: /In, on, under/ }).click();
  await expect(page.locator('.pirat-scene svg')).toBeVisible();
  await shot(page, '8-prep');
});
