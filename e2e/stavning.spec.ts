import { expect, test, type Page } from '@playwright/test';
import { ENTRIES } from '../src/games/stavning/logic';
import { core } from '../src/engines/ord/check';
import { newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-s-${name}.png`, fullPage: true });
};

/** Headless-Chrome har inga röster: en låtsasröst som bara minns vad den skulle säga. */
async function fakeVoice(page: Page) {
  await page.addInitScript(() => {
    const said: string[] = [];
    const voice = { lang: 'sv-SE', name: 'Teströsten', localService: true, default: true, voiceURI: 'test' };
    Object.assign(window, { __said: said });
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [voice], speak: (u: { text: string }) => said.push(u.text), cancel: () => {}, addEventListener: () => {} } });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { lang = ''; voice: unknown; rate = 1; text: string; constructor(text: string) { this.text = text; } } });
  });
}

/** Ordet som ska i luckan: meningen på skärmen jämförs med orden i träsket. */
async function rightWord(page: Page): Promise<string> {
  const shown = await page.locator('.ord-sentence').evaluate((p) =>
    [...p.childNodes].map((n) => ((n as Element).classList?.contains('ord-gap') ? '___' : n.textContent)).join(''));
  const e = ENTRIES.find((x) => x.sentence.split(' ').map((t) => (core(t) === x.word ? t.replace(x.word, '___') : t)).join(' ') === shown);
  if (!e) throw new Error(`Okänd mening: ${shown}`);
  return e.word;
}

async function type(page: Page, word: string) {
  if (test.info().project.name === 'mobil') {
    // Pekskärm: appens eget tangentbord (enhetens skulle rätta stavningen).
    await expect(page.locator('.kbd')).toBeVisible();
    for (const ch of word) {
      if (ch === ' ') await page.getByRole('button', { name: 'Mellanslag' }).click();
      else {
        if (ch !== ch.toLowerCase()) await page.getByRole('button', { name: 'Stor bokstav' }).click();
        await page.locator('.kbd-key', { hasText: new RegExp(`^${ch}$`) }).click();
      }
    }
  } else {
    await page.getByLabel('Skriv ordet').fill(word);
  }
}

async function submit(page: Page) {
  if (test.info().project.name === 'mobil') await page.locator('.kbd-key.ok').click();
  else await page.getByRole('button', { name: 'Rätta' }).click();
}

const next = (page: Page) => page.getByRole('button', { name: /^(Nästa|Se resultat)$/ }).click();

test('Ordskogen → Stavningsträsket → Småorden, en hel runda med ett rättat fel', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Ordskogen' }).click();
  await page.getByRole('button', { name: /Stavningsträsket/ }).click();
  await expect(page.getByRole('heading', { name: 'Stavningsträsket' })).toBeVisible();
  await shot(page, '1-trasket');
  await page.getByRole('button', { name: /Spela: Småorden/ }).click();
  await expect(page.locator('.run-dots .dot')).toHaveCount(10);
  const seen = new Set<string>();
  for (let i = 0; i < 10; i++) {
    const w = await rightWord(page);
    seen.add(w);
    if (i === 0) {
      await shot(page, '2-valj');
      await page.locator('.ord-choice').filter({ hasNotText: new RegExp(`^${w}$`) }).first().click();
      await expect(page.locator('.errcard')).toBeVisible();
      await shot(page, '3-fel');
    }
    await page.getByRole('button', { name: w, exact: true }).click();
    await expect(page.locator('.ord-gap.filled')).toHaveText(w);
    await next(page);
  }
  expect(seen.size).toBe(10); // inga upprepade ord i en runda
  await expect(page.getByRole('heading', { name: 'Du hittade stenarna över träsket!' })).toBeVisible();
  await shot(page, '4-resultat');
});

test('diktamen: lyssna, skriv, rätta – utan autokorrektur', async ({ page }) => {
  await fakeVoice(page);
  await newHero(page);
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    localStorage.setItem(`azaleaporten:h:${id}:area:stavningstrasket`, JSON.stringify({ v: 1, stages: { smaord: { stars: 2, cleared: true, best: 10, runs: 1 } }, bosses: {}, xp: 0 }));
  });
  await page.goto('./#/omrade/stavningstrasket');
  await page.getByRole('button', { name: /Spela: Skriv småorden/ }).click();
  await expect(page.getByRole('button', { name: /Lyssna igen/ })).toBeVisible();
  const input = page.getByLabel('Skriv ordet');
  await expect(input).toHaveAttribute('spellcheck', 'false');
  await expect(input).toHaveAttribute('autocorrect', 'off');
  for (let i = 0; i < 10; i++) {
    const w = await rightWord(page);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said.at(-1))).toContain(`${w}.`);
    if (i === 0) {
      await shot(page, '5-diktamen');
      await type(page, `${w}x`);
      await submit(page);
      await expect(page.locator('.errcard')).toContainText('En bokstav extra');
      await shot(page, '6-diktamen-fel');
    }
    await type(page, w);
    await submit(page);
    await expect(page.locator('.ord-gap.filled')).toHaveText(w);
    await next(page);
  }
  await expect(page.locator('.result-card')).toBeVisible();
});

test('utan svensk röst blir diktamen ett val', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], speak: () => {}, cancel: () => {}, addEventListener: () => {} } });
  });
  await newHero(page);
  await page.goto('./#/labb/stavningstrasket');
  await page.getByRole('button', { name: /Skriv småorden/ }).click();
  await expect(page.getByText('Den här enheten kan inte läsa upp svenska')).toBeVisible();
  const w = await rightWord(page);
  await page.getByRole('button', { name: w, exact: true }).click();
  await expect(page.getByText('Rätt: 1 av 1')).toBeVisible();
});
